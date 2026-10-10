/**
 * **Longest jobs first** (W18 P1.3, `docs/plans/profile-drilldown.md` §0.3): a pass's jobs are started in order of
 * expected cost, so the slowest does not start last and decide the end alone. The pool still answers in the order
 * it was given; `mapInOrder` puts the answers back in the caller's order, so a merge by probe never sees the
 * start order (§1 rule 2) and nothing changes whenever the pass's clock cuts nothing.
 *
 * The expected cost of a job is its own time on the last pass that ran it (kept in memory by id, `JobTimes`), when
 * every job of the pass has one — a time and a proxy are not on one scale — else a proxy the caller gives
 * (`planSize`); jobs of equal cost keep their order.
 */
import type { CampaignInput } from '@/engine/plan';

import type { CalcPool, PoolJob, PoolMapOptions, PoolOutcome } from './pool';

/** What each job took on the last pass that ran it, by id: one per pass kind, in memory only. */
export type JobTimes = Map<string, number>;

/** A plan's size, the cost proxy for a job never timed: stack types × leadership. */
export function planSize(plan: CampaignInput): number {
  return plan.request.units.length * plan.request.housing.leadership;
}

/** The job, timed into `times` under `id` when it finishes. */
export function timeInto<T>(job: PoolJob<T>, id: string, times: JobTimes): PoolJob<T> {
  return async (client, signal) => {
    const began = performance.now();
    const value = await job(client, signal);
    times.set(id, performance.now() - began);
    return value;
  };
}

/** Each id's time on the last pass when every id has one, else `proxy` for every job. */
export function expectedCosts(ids: readonly string[], times: JobTimes, proxy: readonly number[]): number[] {
  const known = ids.map((id) => times.get(id));
  return known.every((ms) => ms !== undefined) ? (known as number[]) : [...proxy];
}

/** Indices of `costs`, the largest first, ties in index order. */
export function longestFirst(costs: readonly number[]): number[] {
  return costs.map((_, index) => index).sort((a, b) => (costs[b] ?? 0) - (costs[a] ?? 0) || a - b);
}

/**
 * `pool.map` with the jobs started in `order` (indices into `jobs`, a permutation), the answers back in `jobs`'
 * order. `onSettled` is given the caller's index.
 */
export async function mapInOrder<T>(
  pool: CalcPool,
  jobs: readonly PoolJob<T>[],
  order: readonly number[],
  options: PoolMapOptions<T> = {},
): Promise<PoolOutcome<T>[]> {
  const { onSettled } = options;
  const started = order.map((index) => jobs[index] as PoolJob<T>);
  const outcomes = await pool.map(started, {
    ...options,
    onSettled:
      onSettled &&
      ((at, outcome, settled, total) => {
        onSettled(order[at] ?? at, outcome, settled, total);
      }),
  });
  const back: PoolOutcome<T>[] = jobs.map(() => ({ kind: 'cut' }));
  outcomes.forEach((outcome, at) => {
    const index = order[at];
    if (index !== undefined) back[index] = outcome;
  });
  return back;
}
