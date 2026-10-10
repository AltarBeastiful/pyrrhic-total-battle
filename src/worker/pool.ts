/**
 * **A pool of calculation workers** (W17 step A, `docs/plans/progression-advisor.md` §2): many independent
 * jobs — the advisor's probes, each a whole plan — run side by side, one per worker, each worker with its own
 * kernel. It shares nothing with the page's main worker (`src/ui/calcClient.ts`) or the raise clients, so a
 * 20 s pass never sits in front of a Generate.
 *
 * - **Results come back in job order**, whatever order the workers finish in: a merge never depends on
 *   arrival, so the answer is the same with one worker or six (§1 rule 2).
 * - **The clock is the pool's, never the engine's.** A job should plan with no `budgetMs` (W17 A0), so its
 *   answer is the same on every device; `budgetMs` here only stops the pass, and every job it did not finish
 *   comes back `cut`.
 * - A job that throws comes back as `error` and the others run on.
 * - **Lazy and short-lived**: workers start on the first `map` and are terminated after `idleMs` with nothing
 *   to do, because each one holds a kernel instance and a phone's memory is small.
 * - **No inline pool**: when the platform gives no worker, `createCalcClient` falls back to the main thread;
 *   the pool then runs one client, so the jobs run one after the other, same answers, slower.
 */
import { abortError, createCalcClient, type CalcClient } from './client';

/** One job: given a client of its own and a signal the pool aborts on a cut or a cancel. */
export type PoolJob<T> = (client: CalcClient, signal: AbortSignal) => Promise<T>;

export type PoolOutcome<T> =
  | { kind: 'done'; value: T }
  /** The pass's clock ran out before this job finished (or started). */
  | { kind: 'cut' }
  | { kind: 'error'; message: string };

export interface PoolMapOptions<T> {
  /** Wall-clock cut for the whole pass (`CAMPAIGN.budgets.extra` for the advisor); omitted, none. */
  budgetMs?: number | undefined;
  /** Aborting it rejects the pass with an `AbortError` and stops every job. */
  signal?: AbortSignal | undefined;
  /** Called as each job settles, in finishing order, with how many have settled so far. */
  onSettled?: ((index: number, outcome: PoolOutcome<T>, settled: number, total: number) => void) | undefined;
}

export interface CalcPool {
  /** Runs `jobs` across the workers; one pass at a time, a second waits for the first. */
  map<T>(jobs: readonly PoolJob<T>[], options?: PoolMapOptions<T>): Promise<PoolOutcome<T>[]>;
  /** Workers currently alive (0 before the first pass and after the idle timeout). */
  readonly alive: number;
  /** A pass is running or waiting: a new `map` would queue behind it. */
  readonly busy: boolean;
  dispose(): void;
}

export interface PoolOptions {
  /** Workers to run; default `poolSize()`. */
  size?: number;
  /** Default `createCalcClient`; tests pass a double. */
  createClient?: () => CalcClient;
  /** Idle time before the workers are terminated; default 60 s. */
  idleMs?: number;
}

const IDLE_MS = 60_000;
const MAX_WORKERS = 6;

/** `hardwareConcurrency − 1`, leaving a core to the page and its main worker, between 1 and 6. */
export function poolSize(cores?: number): number {
  const reported = cores ?? (typeof navigator === 'undefined' ? 1 : navigator.hardwareConcurrency);
  const usable = Number.isFinite(reported) ? Math.floor(reported) - 1 : 1;
  return Math.min(MAX_WORKERS, Math.max(1, usable));
}

export function createCalcPool(options: PoolOptions = {}): CalcPool {
  const size = Math.max(1, options.size ?? poolSize());
  const createClient = options.createClient ?? createCalcClient;
  const idleMs = options.idleMs ?? IDLE_MS;

  let clients: CalcClient[] = [];
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  let queue: Promise<unknown> = Promise.resolve();
  let disposed = false;
  let pending = 0;

  const stopAll = (): void => {
    for (const client of clients) client.dispose();
    clients = [];
  };

  /** Starts the workers; one only when the platform gave the main-thread fallback. */
  const start = (): CalcClient[] => {
    if (clients.length > 0) return clients;
    const first = createClient();
    clients = [first];
    if (first.mode === 'inline') return clients;
    while (clients.length < size) clients.push(createClient());
    return clients;
  };

  const run = async <T>(
    jobs: readonly PoolJob<T>[],
    { budgetMs, signal, onSettled }: PoolMapOptions<T>,
  ): Promise<PoolOutcome<T>[]> => {
    if (disposed) throw abortError('The calculation pool was disposed.');
    if (signal?.aborted) throw abortError();
    clearTimeout(idleTimer);
    const outcomes: (PoolOutcome<T> | undefined)[] = jobs.map(() => undefined);
    if (jobs.length === 0) return [];

    const workers = start();
    const pass = new AbortController();
    let cut = false;
    let next = 0;
    let settled = 0;

    const settle = (index: number, outcome: PoolOutcome<T>): void => {
      outcomes[index] = outcome;
      settled += 1;
      onSettled?.(index, outcome, settled, jobs.length);
    };
    const onCancel = (): void => pass.abort();
    signal?.addEventListener('abort', onCancel, { once: true });
    const timer =
      budgetMs === undefined
        ? undefined
        : setTimeout(() => {
            cut = true;
            pass.abort();
          }, budgetMs);

    const lane = async (client: CalcClient): Promise<void> => {
      while (!pass.signal.aborted && next < jobs.length) {
        const index = next;
        next += 1;
        const job = jobs[index];
        if (job === undefined) continue;
        try {
          settle(index, { kind: 'done', value: await job(client, pass.signal) });
        } catch (error) {
          if (pass.signal.aborted) break;
          settle(index, { kind: 'error', message: error instanceof Error ? error.message : String(error) });
        }
      }
    };

    try {
      await Promise.all(workers.map(lane));
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onCancel);
    }

    if (pass.signal.aborted) {
      // A job that ignores its signal would keep its worker busy past the pass: start the next pass afresh.
      stopAll();
      if (!cut) throw abortError();
    }
    return outcomes.map((outcome) => outcome ?? { kind: 'cut' });
  };

  return {
    map<T>(jobs: readonly PoolJob<T>[], mapOptions: PoolMapOptions<T> = {}) {
      pending += 1;
      const result = queue.then(() => run(jobs, mapOptions));
      const settled = (): void => {
        pending -= 1;
      };
      result.then(settled, settled);
      queue = result.then(
        () => undefined,
        () => undefined,
      );
      void queue.then(() => {
        if (disposed || clients.length === 0) return;
        clearTimeout(idleTimer);
        idleTimer = setTimeout(stopAll, idleMs);
      });
      return result;
    },
    get alive() {
      return clients.length;
    },
    get busy() {
      return pending > 0;
    },
    dispose() {
      disposed = true;
      clearTimeout(idleTimer);
      stopAll();
    },
  };
}
