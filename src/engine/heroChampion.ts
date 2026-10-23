/**
 * **The hero champion's model** (`docs/plans/the-hero-champion.md`): pure, it reads no table and no pool. The worker
 * pass (`src/worker/heroChampion.ts`) rates every hero on a grid of star and level points; this module turns the
 * ratings into what the report draws — the champion and challenger, the valleys, the tiers, the replaced heroes.
 *
 * A rating is the mean gain over the trimmed bar of the hero marching alone, against the march with no hero.
 */
import { CAMPAIGN } from '../config';

/** A hero as the champion race names it. */
export interface ChampionHero {
  captainId: string;
  name: string;
  level: number;
  star: number;
  /** The march type the hero is limited to: such a hero never enters the race. */
  onlyOn?: string | undefined;
}

export interface GridPoint {
  star: number;
  level: number;
}

export interface GridRating extends GridPoint {
  rating: number;
}

export type Tier = 'S' | 'A' | 'B';

/** One hero of the roster: its place, and the curve from where it stands to where it can go. */
export interface ChampionTile extends ChampionHero, BoardEntry {
  tier: Tier;
  /** The rating at the hero's own star and level; `null` when that point was not read. */
  today: number | null;
  /** The best rating on the hero's grid (top star, top level). */
  potential: number;
  /** The stars from the hero's own, at its own level: the long road. */
  starPath: GridRating[];
  /** The levels from the hero's own, at its own star: the quick road, always on screen. */
  levelPath: GridRating[];
}

/** One hero's standing in the race. */
export interface BoardEntry {
  captainId: string;
  /** The average over the points the hero reaches of its rating minus the best other rating there. */
  lead: number;
  /** The points where the lead is positive, of the points compared. */
  leadsAt: { wins: number; of: number };
  /** Grid points the pass meant to read for this hero and the clock or a failure cut: its lead is read on fewer. */
  cut: number;
}

/**
 * A star that lowers the rating. `package`: a later star (`to`) rises past the level before the dip (`from`), `gain` is
 * the whole climb from `from` to `to`. `dead-end`: none does, do not star past `from`.
 */
export interface Valley {
  kind: 'package' | 'dead-end';
  /** The star before the dip: the peak. */
  from: number;
  /** The first star that loses. */
  dip: number;
  /** The star that recovers past the peak; absent for a dead end. */
  to?: number;
  /** How far the rating falls below the peak, at the lowest rung. */
  loss: number;
  gain: number;
}

/** A trio's rating as it stands. */
export interface TrioNow {
  captainIds: string[];
  rating: number;
}

/** One member of a trio raised alone, the other two held as they are: its rating at each star, and by level. */
export interface TrioLadder {
  captainIds: string[];
  captainId: string;
  level: number;
  star: number;
  /** The trio's rating at stars 0..6 (the member's level). */
  stars: readonly number[];
  /** How many plans the star ladder is the mean of; a valley is told from three or more (experiment 262). */
  plans?: number;
  /** The trio's rating at the levels above the member's (its star). */
  levels: readonly { level: number; rating: number }[];
}

export interface TrioMember {
  captainId: string;
  /** What the best rung of its ladder adds to the trio as it stands. */
  gain: number;
  /** The star of that rung (the ladder stops at ★5 when ★6 is below it). */
  bestStar: number;
  stopsAt: number;
  /** The valleys of its star ladder; told only when the ladder is the mean of three plans, one plan is noisier than a valley. */
  valleys?: Valley[];
  ladder: TrioLadder;
}

export interface TrioAdvice {
  /** The trios as they stand, best first. */
  ranked: TrioNow[];
  /** The trio to grow: the highest ceiling over its members' ladders, not necessarily the best today. */
  advised: { captainIds: string[]; ceiling: number; now: number; order: TrioMember[] } | null;
  /** Close trios with a member outside the solo podium: the trio works through the match. */
  surprising: (TrioNow & { outsiders: string[] })[];
}

export interface ChampionInput {
  heroes: readonly ChampionHero[];
  /** Per hero, its rating at every grid point it reaches. */
  ratings: Readonly<Record<string, readonly GridRating[]>>;
  /**
   * Per hero, its rating at each star at the hero's own level, the mean of three plans (experiment 262: one plan's
   * noise is larger than most valleys). A valley is told only for a hero that has one.
   */
  valleyCurves?: Readonly<Record<string, readonly number[]>>;
  /** Per hero, how many grid points the pass meant to read; the shortfall against `ratings` is flagged as `cut`. */
  planned?: Readonly<Record<string, number>>;
  /** The solo podium (the heroes best right now), to tell which trio members surprise. */
  podium?: readonly string[];
  trios?: { now: readonly TrioNow[]; ladders: readonly TrioLadder[] };
}

export interface HeroChampion {
  /** The race, best first; the heroes that count on one kind of march only are not in it. */
  board: BoardEntry[];
  champion: BoardEntry | null;
  challenger: BoardEntry | null;
  /** The grid points both reach where the challenger rates above the champion. */
  overtakes: GridPoint[];
  /** Champion and challenger are within `CAMPAIGN.heroChampion.marginFloor` on the average lead. */
  noClearMargin: boolean;
  /** The race's heroes bar the replaced ones, best first, each in a tier. */
  tiles: ChampionTile[];
  /** Heroes another hero beats at every point of their own grid, and who by (the one with the best lead). */
  replaced: { captainId: string; by: string }[];
  /** Heroes that count on one kind of march only, listed apart. */
  situational: ChampionHero[];
  /** The trio ranking, secondary to the solo champion; absent when no trio was read. */
  trios?: TrioAdvice;
  /** The valleys of the heroes that have a valley curve. */
  valleys: Record<string, Valley[]>;
}

const EPS = 1e-9;
const tidy = (value: number): number => Math.round(value * 1e9) / 1e9;

/** The valleys of a star curve: each dip below a peak, grouped until the curve climbs past that peak. */
export function valleysOf(curve: readonly number[]): Valley[] {
  const out: Valley[] = [];
  let at = 1;
  while (at < curve.length) {
    if (curve[at]! >= curve[at - 1]! - EPS) {
      at += 1;
      continue;
    }
    const from = at - 1;
    const peak = curve[from]!;
    let low = curve[at]!;
    let to = -1;
    for (let next = at + 1; next < curve.length; next += 1) {
      if (curve[next]! > peak + EPS) {
        to = next;
        break;
      }
      low = Math.min(low, curve[next]!);
    }
    out.push({
      kind: to === -1 ? 'dead-end' : 'package',
      from,
      dip: at,
      ...(to === -1 ? {} : { to }),
      loss: tidy(peak - low),
      gain: to === -1 ? 0 : tidy(curve[to]! - peak),
    });
    at = to === -1 ? curve.length : to + 1;
  }
  return out;
}

const same = (a: GridPoint, b: GridPoint): boolean => a.star === b.star && a.level === b.level;

/** The ladder as the page reads it: up to the best star, stopping at ★5 when ★6 is below it. */
function effectiveStars(ladder: TrioLadder): readonly number[] {
  const six = ladder.stars[6];
  const five = ladder.stars[5];
  return six !== undefined && five !== undefined && six < five ? ladder.stars.slice(0, 6) : ladder.stars;
}

function adviseTrios(input: NonNullable<ChampionInput['trios']>, podium: readonly string[]): TrioAdvice {
  const ranked = [...input.now].sort((a, b) => b.rating - a.rating);
  const keyOf = (ids: readonly string[]): string => [...ids].sort().join();
  let advised: TrioAdvice['advised'] = null;
  for (const trio of ranked) {
    const order = input.ladders
      .filter((ladder) => keyOf(ladder.captainIds) === keyOf(trio.captainIds))
      .map((ladder): TrioMember => {
        const stars = effectiveStars(ladder);
        const best = Math.max(...stars, ...ladder.levels.map((l) => l.rating));
        const bestStar = stars.indexOf(Math.max(...stars));
        return {
          captainId: ladder.captainId,
          gain: tidy(best - trio.rating),
          bestStar,
          stopsAt: stars.length - 1,
          ladder,
        };
      })
      .sort((a, b) => b.gain - a.gain);
    if (order.length === 0) continue;
    const ceiling = trio.rating + order[0]!.gain;
    if (advised === null || ceiling > advised.ceiling + EPS)
      advised = {
        captainIds: trio.captainIds,
        ceiling: tidy(ceiling),
        now: trio.rating,
        order: order.map((member) =>
          (member.ladder.plans ?? 1) >= 3
            ? { ...member, valleys: valleysOf(effectiveStars(member.ladder)) }
            : member,
        ),
      };
  }
  const best = ranked[0]?.rating ?? 0;
  const surprising = ranked
    .slice(1)
    .filter((trio) => trio.rating >= CAMPAIGN.heroReport.outlierShare * best && trio.rating > 0)
    .map((trio) => ({ ...trio, outsiders: trio.captainIds.filter((id) => !podium.includes(id)) }))
    .filter((trio) => trio.outsiders.length > 0);
  return { ranked, advised, surprising };
}

export function buildHeroChampion(input: ChampionInput): HeroChampion {
  const situational = input.heroes.filter((hero) => hero.onlyOn !== undefined);
  const pointsOf = (id: string): readonly GridRating[] => input.ratings[id] ?? [];
  // A hero not rated at any point yet (the clock cut the wave) is not in the race.
  const racers = input.heroes.filter(
    (hero) => hero.onlyOn === undefined && pointsOf(hero.captainId).length > 0,
  );
  const ratingAt = (id: string, point: GridPoint): number | undefined =>
    pointsOf(id).find((candidate) => same(candidate, point))?.rating;

  const board = racers
    .map((hero): BoardEntry => {
      let sum = 0;
      let wins = 0;
      let of = 0;
      for (const point of pointsOf(hero.captainId)) {
        const rivals = racers
          .filter((other) => other.captainId !== hero.captainId)
          .flatMap((other) => ratingAt(other.captainId, point) ?? []);
        if (rivals.length === 0) continue;
        const lead = point.rating - Math.max(...rivals);
        sum += lead;
        of += 1;
        if (lead > 0) wins += 1;
      }
      return {
        captainId: hero.captainId,
        lead: of === 0 ? 0 : sum / of,
        leadsAt: { wins, of },
        cut: Math.max(0, (input.planned?.[hero.captainId] ?? 0) - pointsOf(hero.captainId).length),
      };
    })
    .sort((a, b) => b.lead - a.lead);

  const champion = board[0] ?? null;
  const challenger = board[1] ?? null;
  const overtakes =
    champion === null || challenger === null
      ? []
      : pointsOf(champion.captainId).flatMap((point) => {
          const other = ratingAt(challenger.captainId, point);
          return other !== undefined && other > point.rating
            ? [{ star: point.star, level: point.level }]
            : [];
        });
  const heroOf = (id: string): ChampionHero => racers.find((hero) => hero.captainId === id)!;
  const beats = (other: string, id: string): boolean => {
    const own = pointsOf(id);
    return own.length > 0 && own.every((point) => (ratingAt(other, point) ?? -Infinity) > point.rating);
  };
  // Beaten on every solo march is not beaten on every trio: the best trio's members and the surprises stay on the roster.
  const trios = input.trios === undefined ? undefined : adviseTrios(input.trios, input.podium ?? []);
  const kept = new Set([
    ...(trios?.ranked[0]?.captainIds ?? []),
    ...(trios?.advised?.captainIds ?? []),
    ...(trios?.surprising.flatMap((trio) => trio.captainIds) ?? []),
  ]);
  const replaced = board.flatMap((entry) => {
    if (kept.has(entry.captainId)) return [];
    const by = board.find(
      (other) => other.captainId !== entry.captainId && beats(other.captainId, entry.captainId),
    );
    return by === undefined ? [] : [{ captainId: entry.captainId, by: by.captainId }];
  });
  const { s: tierS, a: tierA } = CAMPAIGN.heroChampion.tiers;
  const tiles = board
    .filter((entry) => !replaced.some((r) => r.captainId === entry.captainId))
    .map((entry): ChampionTile => {
      const hero = heroOf(entry.captainId);
      const own = pointsOf(entry.captainId);
      const byStar = (a: GridRating, b: GridRating): number => a.star - b.star || a.level - b.level;
      return {
        ...hero,
        ...entry,
        tier: entry === champion || entry.lead >= -tierS ? 'S' : entry.lead >= -tierA ? 'A' : 'B',
        today: ratingAt(entry.captainId, hero) ?? null,
        potential: Math.max(0, ...own.map((point) => point.rating)),
        starPath: own.filter((p) => p.level === hero.level && p.star >= hero.star).sort(byStar),
        levelPath: own.filter((p) => p.star === hero.star && p.level >= hero.level).sort(byStar),
      };
    });
  return {
    board,
    tiles,
    replaced,
    champion,
    challenger,
    overtakes,
    noClearMargin:
      champion !== null &&
      challenger !== null &&
      champion.lead - challenger.lead < CAMPAIGN.heroChampion.marginFloor,
    situational,
    ...(trios === undefined ? {} : { trios }),
    valleys: Object.fromEntries(
      Object.entries(input.valleyCurves ?? {}).map(([id, curve]) => [id, valleysOf(curve)]),
    ),
  };
}
