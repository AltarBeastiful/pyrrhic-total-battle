/**
 * **The JS layer's cache census, for the profiling run only** (W18 P0.2b, `docs/plans/profile-drilldown.md`):
 * which marches the pool prices more than once — inside one job, across jobs, across passes — and which
 * baselines the passes plan again. Nothing here is a cache; it counts what one would be hit by.
 *
 * Code that counts writes a **note** (`noteCensus`); a note goes nowhere unless someone listens (`startCensus`).
 * A worker listens for the length of each job and sends that job's notes with its timing (`timedJob`,
 * `jobTiming.ts`); the page listens for the whole profiling run; experiment 196 listens in-process.
 *
 * **Out of production by construction**, like the timing: `CENSUS` is on in a dev or `VITE_PROFILING=1` build
 * (`DEEP_PROFILING`) and under Vitest (so the experiment can listen); a production build folds it to `false` and
 * every `if (CENSUS)` at a call site goes with it. No answer depends on a note.
 */
export const CENSUS: boolean =
  import.meta.env.MODE === 'test' || import.meta.env.DEV || import.meta.env.VITE_PROFILING === '1';

/** One march priced in a job: its pricing key (`pricingKey`) and what the pricing cost. */
export interface PricedMarch {
  key: string;
  ms: number;
}

export type CensusNote =
  /** One `runProbe` job: `show` calls, hits of its own `read` map, and every march it priced. */
  | { kind: 'probe'; shows: number; hits: number; priced: PricedMarch[] }
  /** The settings a pass's baseline job planned under (`runAdvisor`, `runCaptainAdvice`). */
  | { kind: 'baseline'; pass: 'advisor' | 'captains'; key: string }
  /** The Tight tables Generate priced for the bar. */
  | { kind: 'bar'; keys: string[] };

/** The notes of whoever listens on this thread, or `null`. */
let heard: CensusNote[] | null = null;

/** Listen until `stop()`, which hands back what was noted and puts back any listener this one interrupted. */
export function startCensus(): { stop: () => CensusNote[] } {
  const outer = heard;
  const mine: CensusNote[] = [];
  heard = mine;
  return {
    stop: () => {
      heard = outer;
      return mine;
    },
  };
}

/** Note something, built only when someone listens. */
export function noteCensus(note: () => CensusNote): void {
  heard?.push(note());
}

/** JSON with every object's keys sorted, so two equal values built in a different order read the same. */
function sortedJson(value: unknown): string {
  return JSON.stringify(value, (_, inner: unknown) =>
    inner !== null && typeof inner === 'object' && !Array.isArray(inner)
      ? Object.fromEntries(Object.entries(inner).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)))
      : inner,
  );
}

/** A stable 53-bit hash (cyrb53) of a value's sorted JSON, in base 36. */
export function stableKey(value: unknown): string {
  const text = sortedJson(value);
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/** A Tight pricing's identity: the request it ran under and the counts it raised (`countsKey`). */
export function pricingKey(request: unknown, counts: string): string {
  return `${stableKey(request)}|${counts}`;
}

/**
 * `runProbe`'s `show`, counted: one `probe` note per job, filled in as it runs. When nobody listens, `show`
 * itself comes back and nothing is counted.
 */
export function countShows<M>(
  request: unknown,
  keyOf: (counts: Record<string, number>) => string,
  isRead: (key: string) => boolean,
  show: (counts: Record<string, number>) => M,
): (counts: Record<string, number>) => M {
  if (heard === null) return show;
  const note = { kind: 'probe' as const, shows: 0, hits: 0, priced: [] as PricedMarch[] };
  heard.push(note);
  const requestKey = stableKey(request);
  return (counts) => {
    const key = keyOf(counts);
    note.shows += 1;
    if (isRead(key)) {
      note.hits += 1;
      return show(counts);
    }
    const began = performance.now();
    const march = show(counts);
    note.priced.push({ key: `${requestKey}|${key}`, ms: performance.now() - began });
    return march;
  };
}

export interface CensusSummary {
  /** `runProbe` jobs heard. */
  jobs: number;
  shows: number;
  /** `show` calls answered by the job's own `read` map. */
  readHits: number;
  /** Marches priced, and how many distinct pricing keys they were. */
  priced: number;
  distinctPriced: number;
  /** Pricings of a key some earlier job already priced (K3), and what they cost. */
  repricedAcrossJobs: number;
  repricedMs: number;
  /** Baseline jobs, and how many planned settings an earlier pass had already planned (K4). */
  baselines: number;
  repeatedBaselines: number;
  /** Generate's bar pricings, and how many of their keys a probe job priced again (K5). */
  barPricings: number;
  barRepricedByProbes: number;
}

/** What the notes add up to, in the order they were heard. */
export function summariseCensus(notes: readonly CensusNote[]): CensusSummary {
  const probes = notes.filter((note) => note.kind === 'probe');
  const seen = new Set<string>();
  let repricedAcrossJobs = 0;
  let repricedMs = 0;
  for (const probe of probes) {
    for (const priced of probe.priced) {
      if (seen.has(priced.key)) {
        repricedAcrossJobs += 1;
        repricedMs += priced.ms;
      }
    }
    for (const priced of probe.priced) seen.add(priced.key);
  }
  const baselineKeys = notes.flatMap((note) => (note.kind === 'baseline' ? [note.key] : []));
  const barKeys = notes.flatMap((note) => (note.kind === 'bar' ? note.keys : []));
  return {
    jobs: probes.length,
    shows: probes.reduce((sum, probe) => sum + probe.shows, 0),
    readHits: probes.reduce((sum, probe) => sum + probe.hits, 0),
    priced: probes.reduce((sum, probe) => sum + probe.priced.length, 0),
    distinctPriced: seen.size,
    repricedAcrossJobs,
    repricedMs: Math.round(repricedMs * 10) / 10,
    baselines: baselineKeys.length,
    repeatedBaselines: baselineKeys.length - new Set(baselineKeys).size,
    barPricings: barKeys.length,
    barRepricedByProbes: barKeys.filter((key) => seen.has(key)).length,
  };
}
