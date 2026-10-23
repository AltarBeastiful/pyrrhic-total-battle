/**
 * **The hero champion pass** (`docs/plans/the-hero-champion.md`): every hero planned in full on a grid of star and
 * level points, in waves under one clock, so the page always has a picture:
 *
 * 1. every hero at its own level, stars 0 to 6;
 * 2. the remaining level steps, the leading heroes first;
 * 3. the champion's and the challenger's curves sharpened to `sharpStep`, and their star curves read on three plans
 *    (housing −1 %, 0, +1 %: experiment 262, a valley is told only in the mean);
 * 4. the trios as they stand, then the ladders of the best few (read on one plan: no trio valley is told).
 *
 * A point's rating is the mean gain over the stops of the march with no hero planned the same way, its all-in left
 * out (experiments 260 and 261). Every job is the existing `client.probe`, run through the pool; none carries a
 * clock of its own, so results are merged by position.
 */
import { CAMPAIGN } from '@/config';
import { probeInfo } from '@/engine/advisor';
import {
  buildHeroChampion,
  type ChampionHero,
  type GridRating,
  type HeroChampion,
  type TrioLadder,
  type TrioNow,
} from '@/engine/heroChampion';
import type { CampaignInput } from '@/engine/plan';
import type { BonusTotals } from '@/engine/types';

import type { CalcPool, PoolJob } from './pool';
import type { ProbeAnswer } from './protocol';

/** The march as one housing shift sees it, built on the main thread (the worker takes totals already summed). */
export interface ChampionVariant {
  input: CampaignInput;
  /** The march with no hero: the baseline every gain is read against. */
  none: BonusTotals;
  /** One hero alone, raised to `star` and `level`. */
  hero: (captainId: string, star: number, level: number) => BonusTotals;
  /** A trio as it stands, or with one member raised. */
  trio: (
    captainIds: readonly string[],
    raise?: { captainId: string; star: number; level: number },
  ) => BonusTotals;
}

export interface ChampionRoster {
  /** Every hero with a fighting line; the ones that count on one kind of march only are listed apart. */
  heroes: ChampionHero[];
  /** The march with the leadership housing moved by `jitter` (0.01 = +1 %); 0 is the march as it stands. */
  variant: (jitter: number) => ChampionVariant;
}

export interface ChampionOptions {
  signal?: AbortSignal | undefined;
  onProgress?: ((done: number, total: number) => void) | undefined;
  budgetMs?: number | undefined;
  /** Called with the champion as it stands after each wave. */
  onWave?: ((champion: HeroChampion) => void) | undefined;
  /**
   * The heroes best right now, as the page's "Right now" podium names them, so a "surprising trio" is judged against
   * what the page shows. Left out, the three best by their rating at their own star and level.
   */
  podium?: readonly string[] | undefined;
}

export interface ChampionResult {
  champion: HeroChampion;
  /** What the clock cut from the pass, in words; empty when it read everything. */
  cuts: string[];
}

const STARS = [0, 1, 2, 3, 4, 5, 6];

/** From `level` up to the top: `level` itself, then every multiple of `step`, then the top level. */
export function levelsFrom(level: number, step: number): number[] {
  const top = CAMPAIGN.captainMaxLevel;
  const out = [Math.min(level, top)];
  for (let at = (Math.floor(level / step) + 1) * step; at < top; at += step) out.push(at);
  if (level < top) out.push(top);
  return out;
}

/** A grid point's key in a hero's ratings. */
const pointKey = (star: number, level: number): string => `${String(star)}/${String(level)}`;

const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

export async function runHeroChampion(
  roster: ChampionRoster,
  pool: CalcPool,
  options: ChampionOptions = {},
): Promise<ChampionResult> {
  const { signal, onProgress, onWave } = options;
  const budgetMs = options.budgetMs ?? CAMPAIGN.budgets.heroReport;
  const { levelStep, sharpStep, valleyJitters, trioLadders } = CAMPAIGN.heroChampion;
  const began = performance.now();
  const left = (): number => budgetMs - (performance.now() - began);
  const cuts: string[] = [];
  let done = 0;
  let total = 0;
  let shown = 0;
  // The count grows as waves add batches, so the share is held where it was rather than stepping back.
  const report = (): void => {
    // Later waves add jobs, so the bar stays short of full until `finish`.
    const share = total === 0 ? 0 : Math.min(done, total - 1) / total;
    if (share < shown) {
      onProgress?.(Math.ceil(shown * total - 1e-9), total);
      return;
    }
    shown = share;
    onProgress?.(Math.min(done, total - 1), total);
  };
  const onSettled = (): void => {
    done += 1;
    report();
  };
  /** The pass is over: jobs the clock cut never settled, so the count is closed here. */
  const finish = (): void => {
    done = total;
    shown = 1;
    onProgress?.(total, total);
  };

  const racers = roster.heroes.filter((hero) => hero.onlyOn === undefined);
  const ratings = new Map<string, Map<string, GridRating>>(racers.map((hero) => [hero.captainId, new Map()]));
  const valleyCurves: Record<string, number[]> = {};
  let trios: { now: TrioNow[]; ladders: TrioLadder[] } | undefined;
  let podium: readonly string[] = options.podium ?? [];
  /** Per hero, the grid points the pass meant to read, whatever the clock then allowed. */
  const planned: Record<string, number> = {};
  const meant = new Map<string, Set<string>>();

  const snapshot = (): HeroChampion =>
    buildHeroChampion({
      heroes: roster.heroes,
      ratings: Object.fromEntries([...ratings].map(([id, points]) => [id, [...points.values()]])),
      valleyCurves,
      planned,
      podium,
      ...(trios === undefined ? {} : { trios }),
    });
  const emit = (): void => onWave?.(snapshot());

  // A variant is prepared once: the march with no hero planned under it, the baseline its points are read against.
  const prepared = new Map<
    number,
    Promise<{ variant: ChampionVariant; baseline: ProbeAnswer['stops'] } | null>
  >();
  const prepare = (jitter: number) => {
    const cached = prepared.get(jitter);
    if (cached !== undefined) return cached;
    const made = (async () => {
      const variant = roster.variant(jitter);
      if (left() <= 0) return null;
      total += 1;
      const [outcome] = await pool.map(
        [
          (client, jobSignal): Promise<ProbeAnswer> =>
            client.probe({ plan: planOf(variant, variant.none) }, jobSignal),
        ],
        { budgetMs: left(), signal, onSettled },
      );
      if (outcome?.kind === 'error') throw new Error(outcome.message);
      if (outcome?.kind !== 'done') return null;
      // The march with no hero has its own, shorter bar: its all-in is left out, the rest is read.
      return { variant, baseline: outcome.value.stops.filter((stop) => stop.pick !== 'all-in') };
    })();
    prepared.set(jitter, made);
    return made;
  };
  const planOf = (variant: ChampionVariant, totals: BonusTotals): CampaignInput => {
    const settings = { ...variant.input };
    delete settings.budgetMs;
    delete settings.shouldStop;
    return { ...settings, request: { ...settings.request, totals } };
  };

  /**
   * Rate lineups, each under its own housing shift, as one batch so every worker stays busy to the end; `NaN` where
   * the clock cut or the plan failed.
   */
  const rateJobs = async (items: readonly { jitter: number; totals: BonusTotals }[]): Promise<number[]> => {
    const shifts = [...new Set(items.map((item) => item.jitter))];
    const bases = new Map(
      await Promise.all(shifts.map(async (jitter) => [jitter, await prepare(jitter)] as const)),
    );
    if (left() <= 0 || shifts.some((jitter) => bases.get(jitter) === null))
      return items.map(() => Number.NaN);
    total += items.length;
    const outcomes = await pool.map(
      items.map(({ jitter, totals }, at): PoolJob<ProbeAnswer> => {
        const base = bases.get(jitter)!;
        return (client, jobSignal) =>
          client.probe(
            {
              plan: planOf(base.variant, totals),
              against: {
                probe: probeInfo({
                  id: `${String(jitter)}:${String(at)}`,
                  family: 'captains',
                  label: 'champion',
                }),
                baseline: base.baseline,
                rates: CAMPAIGN.markerRates,
              },
            },
            jobSignal,
          );
      }),
      { budgetMs: left(), signal, onSettled },
    );
    return outcomes.map((outcome) => {
      if (outcome.kind === 'error') throw new Error(outcome.message);
      return outcome.kind === 'done' && outcome.value.row !== null
        ? mean(outcome.value.row.stops.map((stop) => stop.gain))
        : Number.NaN;
    });
  };
  /** Rate the lineups under one housing shift. */
  const rate = (jitter: number, totalsList: readonly BonusTotals[]): Promise<number[]> =>
    rateJobs(totalsList.map((totals) => ({ jitter, totals })));

  /** Note the points the pass means to read, so a wave the clock skips still shows as missing. */
  const meaning = (wanted: { captainId: string; star: number; level: number }[]): void => {
    for (const { captainId, star, level } of wanted) {
      const keys = (meant.get(captainId) ?? new Set<string>()).add(pointKey(star, level));
      meant.set(captainId, keys);
      planned[captainId] = keys.size;
    }
  };
  /** Plan the points of heroes not yet read, store what came back; returns how many were cut. */
  const readPoints = async (
    wanted: { captainId: string; star: number; level: number }[],
  ): Promise<number> => {
    meaning(wanted);
    const fresh = wanted.filter(
      ({ captainId, star, level }) => !ratings.get(captainId)?.has(pointKey(star, level)),
    );
    if (fresh.length === 0) return 0;
    const variant = roster.variant(0);
    const values = await rate(
      0,
      fresh.map(({ captainId, star, level }) => variant.hero(captainId, star, level)),
    );
    let cut = 0;
    fresh.forEach(({ captainId, star, level }, at) => {
      const value = values[at] ?? Number.NaN;
      if (Number.isNaN(value)) cut += 1;
      else ratings.get(captainId)?.set(pointKey(star, level), { star, level, rating: value });
    });
    return cut;
  };
  const note = (what: string, cut: number, of: number): void => {
    if (cut > 0) cuts.push(`${what}: ${String(of - cut)} of ${String(of)} plans read`);
  };

  // Wave 1: every hero at its own level, stars 0 to 6.
  const own = (hero: ChampionHero) => Math.max(1, hero.level);
  const wave1 = racers.flatMap((hero) =>
    STARS.map((star) => ({ captainId: hero.captainId, star, level: own(hero) })),
  );
  note('the stars at each hero’s level', await readPoints(wave1), wave1.length);
  // Right now: the rating at the hero's own star and level, unless the page told who it shows.
  if (options.podium === undefined)
    podium = racers
      .flatMap((hero) => {
        const today = ratings.get(hero.captainId)?.get(pointKey(hero.star, own(hero)))?.rating;
        return today === undefined ? [] : [{ id: hero.captainId, today }];
      })
      .sort((a, b) => b.today - a.today)
      .slice(0, 3)
      .map((entry) => entry.id);
  emit();

  // Wave 2: the remaining level steps, the leading heroes first.
  const bestOf = (id: string): number =>
    Math.max(-Infinity, ...[...(ratings.get(id)?.values() ?? [])].map((p) => p.rating));
  const leading = [...racers].sort((a, b) => bestOf(b.captainId) - bestOf(a.captainId));
  const wave2 = leading.flatMap((hero) =>
    levelsFrom(own(hero), levelStep).flatMap((level) =>
      STARS.map((star) => ({ captainId: hero.captainId, star, level })),
    ),
  );
  meaning(wave2);
  if (left() > 0) {
    note('the level steps', await readPoints(wave2), wave2.length);
    emit();
  } else cuts.push('the level steps were not read');

  // Wave 3: the champion's and the challenger's curves sharpened, their star curves read on three plans.
  const front = snapshot();
  const duo = [front.champion, front.challenger].flatMap((entry) => {
    const hero = racers.find((candidate) => candidate.captainId === entry?.captainId);
    return hero === undefined ? [] : [hero];
  });
  const sharp = duo.flatMap((hero) =>
    levelsFrom(own(hero), sharpStep).flatMap((level) =>
      STARS.map((star) => ({ captainId: hero.captainId, star, level })),
    ),
  );
  meaning(sharp);
  if (duo.length > 0 && left() > 0) {
    note('the sharpened curves', await readPoints(sharp), sharp.length);
    await readValleys(duo.map((hero) => ({ captainId: hero.captainId, level: own(hero) })));
    emit();
  } else if (duo.length > 0) cuts.push('the champion’s curves were not sharpened');

  /** The star curves of these heroes on the shifted plans, all in one batch; the plan as it stands is already read. */
  async function readValleys(members: { captainId: string; level: number }[]): Promise<void> {
    const shifts = valleyJitters.filter((shift) => shift !== 0);
    const items = members.flatMap(({ captainId, level }) =>
      shifts.flatMap((jitter) => {
        const variant = roster.variant(jitter);
        return STARS.map((star) => ({ jitter, totals: variant.hero(captainId, star, level) }));
      }),
    );
    const read = await rateJobs(items);
    members.forEach(({ captainId, level }, index) => {
      const plans = [
        STARS.map((star) => ratings.get(captainId)?.get(pointKey(star, level))?.rating ?? Number.NaN),
        ...shifts.map((_, at) => {
          const from = (index * shifts.length + at) * STARS.length;
          return read.slice(from, from + STARS.length);
        }),
      ];
      if (plans.some((curve) => curve.some(Number.isNaN))) {
        cuts.push(`the valleys of ${captainId} were read on fewer than three plans`);
        return;
      }
      valleyCurves[captainId] = STARS.map((star) => mean(plans.map((curve) => curve[star] ?? 0)));
    });
  }

  // Wave 4: the trios as they stand, then the ladders of the best few.
  // Strongest heroes first, so a cut drops the trios of the weakest.
  const general = leading;
  const all: ChampionHero[][] = [];
  for (let i = 0; i < general.length; i += 1)
    for (let j = i + 1; j < general.length; j += 1)
      for (let k = j + 1; k < general.length; k += 1) all.push([general[i]!, general[j]!, general[k]!]);
  if (all.length > 0 && left() > 0) {
    const variant = roster.variant(0);
    const standing = await rate(
      0,
      all.map((trio) => variant.trio(trio.map((hero) => hero.captainId))),
    );
    const now: TrioNow[] = [];
    all.forEach((trio, at) => {
      const rating = standing[at] ?? Number.NaN;
      if (!Number.isNaN(rating)) now.push({ captainIds: trio.map((hero) => hero.captainId), rating });
    });
    note('the trios as they stand', all.length - now.length, all.length);
    trios = { now, ladders: [] };
    emit();

    const best = [...now].sort((a, b) => b.rating - a.rating).slice(0, trioLadders);
    const ladders: TrioLadder[] = [];
    // Every member's ladder of every best trio goes out as one batch.
    const asked = best.flatMap((trio) =>
      trio.captainIds.map((captainId) => {
        const hero = racers.find((candidate) => candidate.captainId === captainId)!;
        const levels = levelsFrom(own(hero), levelStep).slice(1);
        return { trio, hero, levels };
      }),
    );
    const read = await rate(
      0,
      asked.flatMap(({ trio, hero, levels }) => [
        ...STARS.map((star) =>
          variant.trio(trio.captainIds, { captainId: hero.captainId, star, level: own(hero) }),
        ),
        ...levels.map((level) =>
          variant.trio(trio.captainIds, { captainId: hero.captainId, star: hero.star, level }),
        ),
      ]),
    );
    let from = 0;
    for (const { trio, hero, levels } of asked) {
      const mine = read.slice(from, from + STARS.length + levels.length);
      from += mine.length;
      if (mine.some(Number.isNaN)) {
        cuts.push(`the ladder of ${hero.name} in a trio was cut`);
        continue;
      }
      ladders.push({
        captainIds: trio.captainIds,
        captainId: hero.captainId,
        level: own(hero),
        star: hero.star,
        stars: mine.slice(0, STARS.length),
        levels: levels.map((level, at) => ({ level, rating: mine[STARS.length + at] ?? 0 })),
      });
    }
    trios = { now, ladders };
    emit();
  } else if (all.length > 0) cuts.push('the trios were not read');

  finish();
  return { champion: snapshot(), cuts };
}
