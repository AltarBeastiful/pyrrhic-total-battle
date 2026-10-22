/**
 * **The hero report's model** (`docs/plans/hero-report.md`): pure, it reads no table, no profile, no pool. The worker
 * pass (`src/worker/heroReport.ts`) prices the lineups and hands the readings here; this module turns them into what
 * the popup draws — roles, the best trio, the actions, the situation matrix.
 *
 * A **reading** is the screen's gain, stop by stop of the bar, of a lineup over the march with no hero. A gain is
 * clamped at 0 wherever it is read (a hero is never reported as a loss), and a score is its mean over the stops.
 */
import { CAMPAIGN } from '../config';
import type { PlanPick } from './plan';
import type { WorthKind } from './captainUpgrades';

export type SituationId = 'default' | 'monsters' | 'moreMercs' | 'otherMercs';

export const SITUATIONS: readonly SituationId[] = ['default', 'monsters', 'moreMercs', 'otherMercs'];

/** A hero as the report names it. */
export interface HeroInfo {
  captainId: string;
  name: string;
  level: number;
  star: number;
  /** The march type the hero is limited to, shown as a condition tag. */
  onlyOn?: string | undefined;
}

/** One situation's readings: each hero alone, each trio, gains stop by stop (not clamped). */
export interface RoleReading {
  solo: Record<string, number[]>;
  trios: { captainIds: string[]; stops: number[] }[];
}

/** Solo and trio marches weigh equally and are rated apart: a hero's upgrade is read in the lineup it plays in. */
export type Role = 'solo' | 'trio';

export const ROLES: readonly Role[] = ['solo', 'trio'];

/**
 * One upgrade read in one role (`src/worker/heroReport.ts`): the hero's lineup of that role with the upgrade
 * applied, against the same lineup without it, on the lead march's counts.
 */
export interface WorthLike {
  id: string;
  label: string;
  captainId: string;
  kind: WorthKind;
  /** Stars or levels added. */
  size: number;
  cost?: { amount: number; unit: string } | undefined;
  /** The mean over the bar of the gain, clamped at 0 on every stop. */
  worth: number;
  /** The rating on each stop of the bar, not clamped: its mean below 0 is an upgrade that worsens the trade. */
  raw?: number[] | undefined;
  /** Set when the row was planned in full (tier 2): the re-priced gain it started from. */
  tier1?: number | undefined;
}

export type Verdict = 'level' | 'star' | 'both' | 'hold';

/** One upgrade the report names, with the figure it is ranked on. */
export interface HeroAction {
  captainId: string;
  kind: WorthKind;
  size: number;
  label: string;
  /** The gain on the owner's rating, averaged over the bar. */
  gain: number;
  /** Gain per cost where the owner typed one, the raw gain otherwise. */
  score: number;
  /** The cost's unit, `null` when the score is the raw gain. */
  unit: string | null;
  /** The net rating over the bar, not clamped (`WorthLike.raw`); below 0 the upgrade worsens the trade. */
  trade: number;
  /** The step after this one (stars: the next probed star count), as the change in gain it brings; may be negative. */
  next?: { size: number; delta: number } | undefined;
  /** The star count with the largest total gain, when it is not this one (the cheapest step is not the biggest). */
  most?: { size: number; gain: number } | undefined;
  /** The star counts of this hero whose net trade over the bar is below minus `tradeWarn`, with that rating. */
  worse: { size: number; trade: number }[];
}

/** What one role says of a hero: the verdict and the two actions it comes from. */
export interface RoleUp {
  verdict: Verdict;
  level?: HeroAction;
  star?: HeroAction;
}

export interface HeroTile extends HeroInfo {
  /** Mean gain over the bar of the hero marching alone with troops. */
  solo: number;
  /** What the hero adds to the best trio over the best trio without them. */
  trio: number;
  /** Upgrades read in the hero's solo lineup. */
  soloUp: RoleUp;
  /** Upgrades read in the best trio; absent for a hero outside it. */
  trioUp?: RoleUp;
  /** Situations that change the verdict for this hero (becomes, or stops being, the best). */
  flips: SituationId[];
  /** False for a hero that matters nowhere: the board folds it into one line. */
  matters: boolean;
}

export interface BestTrio {
  captainIds: string[];
  /** Gain per stop of the bar, clamped. */
  stops: number[];
  gain: number;
}

export interface SituationRow {
  id: SituationId;
  bestSolo: string | null;
  bestTrio: string[] | null;
  /** Solo score per hero. */
  solo: Record<string, number>;
}

/** One captain of the game as the "worth getting" block reads it. */
export interface CatalogHero {
  captainId: string;
  name: string;
  /** 0 (easiest to own) to 10; equal numbers form a tier (`CAMPAIGN.heroReport.difficulty`). */
  difficulty: number;
  /** What the captain is rated at: the bonus points it gives at the top star. */
  rating: number;
  owned: boolean;
}

export interface HeroReport {
  stops: PlanPick[];
  tiles: HeroTile[];
  /** Heroes that count on one kind of march only (`onlyOn`), rated apart: their gain where they apply. */
  situational: HeroTile[];
  bestTrio: BestTrio | null;
  /** The best trio of each stop alone, in the bar's order: the footnote of the best trio (E1: how far it differs). */
  stopTrios: (BestTrio | null)[];
  /** The top actions of each role, best first; the third only when it is not marginal. */
  banner: Record<Role, HeroAction[]>;
  /** The three heroes to put effort in for each role, best action first. */
  plan: Record<Role, HeroTile[]>;
  /** The upgrades as read, by role (the rows the actions are taken from). */
  worth: Record<Role, readonly WorthLike[]>;
  situations: SituationRow[];
  /** The unowned hero worth getting, the last block; `null` when the catalog was not given or has none above. */
  getting: CatalogHero | null;
  /** Situations that could not be read on this account (no monster, no mercenary), with why. */
  skipped: { id: SituationId; why: string }[];
  /** Cost unit of the banner, `null` when the figures are raw gain. */
  unit: string | null;
}

const mean = (values: readonly number[]): number =>
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;

const clamped = (stops: readonly number[]): number[] => stops.map((gain) => Math.max(0, gain));

/** A hero alone: the mean of its clamped gains over the bar. */
export function soloScore(reading: RoleReading, captainId: string): number {
  return mean(clamped(reading.solo[captainId] ?? []));
}

/** The trio with the highest mean over the bar (the first on a tie); `null` with no trio that gains. */
export function bestTrioOf(
  trios: RoleReading['trios'],
  skip?: (captainIds: readonly string[]) => boolean,
): BestTrio | null {
  let best: BestTrio | null = null;
  for (const trio of trios) {
    if (skip?.(trio.captainIds) === true) continue;
    const stops = clamped(trio.stops);
    const gain = mean(stops);
    if (gain > (best?.gain ?? 0)) best = { captainIds: trio.captainIds, stops, gain };
  }
  return best;
}

/** What a hero adds: the best trio with them minus the best trio without, never below 0. */
export function trioContribution(reading: RoleReading, captainId: string): number {
  const withHero = bestTrioOf(reading.trios.filter((trio) => trio.captainIds.includes(captainId)));
  const without = bestTrioOf(reading.trios, (ids) => ids.includes(captainId));
  return Math.max(0, (withHero?.gain ?? 0) - (without?.gain ?? 0));
}

/** The hero with the best solo score (the first on a tie); `null` when none gains. */
function bestSolo(reading: RoleReading, heroes: readonly HeroInfo[]): string | null {
  let best: string | null = null;
  let most = 0;
  for (const hero of heroes) {
    const score = soloScore(reading, hero.captainId);
    if (score > most) {
      best = hero.captainId;
      most = score;
    }
  }
  return best;
}

/** Gain per cost when a cost was typed (a zero cost is none), else a star's gain per star and a level step's gain. */
export const scoreOf = (row: WorthLike): number => {
  if (row.cost !== undefined && row.cost.amount > 0) return row.worth / row.cost.amount;
  return row.kind === 'star' ? row.worth / Math.max(1, row.size) : row.worth;
};

/**
 * The net trade of a row: its mean rating over the bar, not clamped (experiment 249: a single stop swings by 5 or
 * more on the re-plan's own noise, the mean over the bar is below −1 on 3.5 % of the upgrades).
 */
const tradeOf = (row: WorthLike): number => mean(row.raw ?? [row.worth]);

function actionOf(row: WorthLike, rows: readonly WorthLike[]): HeroAction {
  const own = rows.filter((other) => other.captainId === row.captainId && other.kind === row.kind);
  const after = own.filter((other) => other.size > row.size).sort((a, b) => a.size - b.size)[0];
  const most = own.reduce<WorthLike | undefined>(
    (top, other) => (top === undefined || other.worth > top.worth ? other : top),
    undefined,
  );
  return {
    captainId: row.captainId,
    kind: row.kind,
    size: row.size,
    label: row.label,
    gain: row.worth,
    score: scoreOf(row),
    unit: row.cost !== undefined && row.cost.amount > 0 ? row.cost.unit : null,
    trade: tradeOf(row),
    ...(after === undefined || row.kind !== 'star'
      ? {}
      : { next: { size: after.size, delta: after.worth - row.worth } }),
    ...(most === undefined || row.kind !== 'star' || most.worth <= row.worth + 1e-9
      ? {}
      : { most: { size: most.size, gain: most.worth } }),
    worse: own
      .filter((other) => other.kind === 'star' && tradeOf(other) <= -CAMPAIGN.heroReport.tradeWarn)
      .map((other) => ({ size: other.size, trade: tradeOf(other) })),
  };
}

/**
 * A hero's level action is its smallest probed level step; its star action the star count with the best score
 * (`scoreOf`: per star), so the count to add is the most efficient one, not the biggest. Rows that gain nothing
 * are not actions, but a star count that worsens the trade is still named on the action (`worse`).
 */
function actionsOf(rows: readonly WorthLike[], captainId: string): { level?: HeroAction; star?: HeroAction } {
  const mine = rows.filter((row) => row.captainId === captainId);
  const own = mine.filter((row) => row.worth > 0);
  const levels = own.filter((row) => row.kind === 'level').sort((a, b) => a.size - b.size);
  let star: WorthLike | undefined;
  for (const row of own.filter((candidate) => candidate.kind === 'star').sort((a, b) => a.size - b.size))
    if (star === undefined || scoreOf(row) > scoreOf(star)) star = row;
  const level = levels[0];
  return {
    ...(level === undefined ? {} : { level: actionOf(level, mine) }),
    ...(star === undefined ? {} : { star: actionOf(star, mine) }),
  };
}

/** Order actions as the worth list does: costed ones by unit group first, then raw gain; the order given on a tie. */
export function rankActions(actions: readonly HeroAction[]): HeroAction[] {
  const units: string[] = [];
  for (const action of actions)
    if (action.unit !== null && !units.includes(action.unit)) units.push(action.unit);
  const group = (action: HeroAction): number =>
    action.unit === null ? units.length : units.indexOf(action.unit);
  return actions
    .map((action, index) => ({ action, index }))
    .sort((a, b) => group(a.action) - group(b.action) || b.action.score - a.action.score || a.index - b.index)
    .map((entry) => entry.action);
}

function verdictOf(
  level: HeroAction | undefined,
  star: HeroAction | undefined,
  topOf: (unit: string | null) => number,
): Verdict {
  const best = [level, star].filter((action): action is HeroAction => action !== undefined);
  // Raw gain holds under a floor in rating units (the rating steps in whole units, a gain of a few is faint); a gain
  // per cost holds under a share of the best of its unit, since its figure has no scale of its own.
  const pays = best.some((action) =>
    action.unit === null
      ? action.gain >= CAMPAIGN.heroReport.holdGain
      : action.score >= CAMPAIGN.heroReport.holdShare * (topOf(action.unit) || 1),
  );
  if (!pays) return 'hold';
  if (level === undefined) return 'star';
  if (star === undefined) return 'level';
  const [large, small] = level.score >= star.score ? [level, star] : [star, level];
  if (small.score >= CAMPAIGN.heroReport.bothShare * large.score) return 'both';
  return large === level ? 'level' : 'star';
}

export interface HeroReportInput {
  stops: PlanPick[];
  heroes: readonly HeroInfo[];
  /** The default reading, then the situations that could be read. */
  readings: Partial<Record<SituationId, RoleReading>>;
  skipped?: { id: SituationId; why: string }[];
  /** The upgrades read in each role; `null` when they were not computed (every verdict then holds). */
  worth: Partial<Record<Role, readonly WorthLike[]>> | null;
  /** Every captain of the game, owned or not, for the last block. */
  catalog?: readonly CatalogHero[] | undefined;
}

/**
 * The unowned hero to get: among the unowned heroes harder than anything the account holds, the easiest tier, and in
 * it the highest rated (the first on a tie). `null` when none is above.
 */
export function worthGetting(catalog: readonly CatalogHero[]): CatalogHero | null {
  const held = Math.max(-1, ...catalog.filter((hero) => hero.owned).map((hero) => hero.difficulty));
  const above = catalog.filter((hero) => !hero.owned && hero.difficulty > held);
  if (above.length === 0) return null;
  const tier = Math.min(...above.map((hero) => hero.difficulty));
  let best: CatalogHero | null = null;
  for (const hero of above)
    if (hero.difficulty === tier && (best === null || hero.rating > best.rating)) best = hero;
  return best;
}

/** Build the report from the readings. */
export function buildHeroReport(input: HeroReportInput): HeroReport {
  const { stops } = input;
  // A hero that only counts on one kind of march (Amanitore in a group, Hercules against epic monsters) is rated on
  // its own, as a situational hero: it takes no solo or trio place and no banner line.
  const heroes = input.heroes.filter((hero) => hero.onlyOn === undefined);
  const conditional = input.heroes.filter((hero) => hero.onlyOn !== undefined);
  const base = input.readings.default;
  if (base === undefined) throw new Error('The hero report needs the default reading.');
  const rows: Record<Role, readonly WorthLike[]> = {
    solo: input.worth?.solo ?? [],
    trio: input.worth?.trio ?? [],
  };

  const solos = heroes.map((hero) => soloScore(base, hero.captainId));
  const trios = heroes.map((hero) => trioContribution(base, hero.captainId));
  const maxSolo = Math.max(0, ...solos);
  const maxTrio = Math.max(0, ...trios);

  // The best action of each unit group in a role, to tell a hero that holds from one that pays.
  const allOf = (role: Role): HeroAction[] =>
    heroes.flatMap((hero) => {
      const { level, star } = actionsOf(rows[role], hero.captainId);
      return [level, star].filter((action): action is HeroAction => action !== undefined);
    });
  const all: Record<Role, HeroAction[]> = { solo: allOf('solo'), trio: allOf('trio') };
  const topOf =
    (role: Role) =>
    (unit: string | null): number =>
      Math.max(0, ...all[role].filter((action) => action.unit === unit).map((action) => action.score));

  const situationRows: SituationRow[] = [];
  for (const id of SITUATIONS) {
    const reading = input.readings[id];
    if (reading === undefined) continue;
    situationRows.push({
      id,
      bestSolo: bestSolo(reading, heroes),
      bestTrio: bestTrioOf(reading.trios)?.captainIds ?? null,
      solo: Object.fromEntries(heroes.map((hero) => [hero.captainId, soloScore(reading, hero.captainId)])),
    });
  }
  const home = situationRows.find((row) => row.id === 'default');
  const flipsOf = (captainId: string): SituationId[] =>
    situationRows
      .filter((row) => row.id !== 'default' && home !== undefined)
      .filter((row) => {
        const wasSolo = home?.bestSolo === captainId;
        const wasTrio = home?.bestTrio?.includes(captainId) === true;
        const isSolo = row.bestSolo === captainId;
        const isTrio = row.bestTrio?.includes(captainId) === true;
        return wasSolo !== isSolo || wasTrio !== isTrio;
      })
      .map((row) => row.id);

  const upOf = (role: Role, hero: HeroInfo): RoleUp => {
    const { level, star } = actionsOf(rows[role], hero.captainId);
    return {
      verdict: verdictOf(level, star, topOf(role)),
      ...(level ? { level } : {}),
      ...(star ? { star } : {}),
    };
  };
  const tileOf = (hero: HeroInfo, solo: number, trio: number, flips: SituationId[]): HeroTile => {
    const soloUp = upOf('solo', hero);
    const inTrio = rows.trio.some((row) => row.captainId === hero.captainId);
    const trioUp = inTrio ? upOf('trio', hero) : undefined;
    const share = CAMPAIGN.heroReport.mattersShare;
    return {
      ...hero,
      solo,
      trio,
      soloUp,
      ...(trioUp === undefined ? {} : { trioUp }),
      flips,
      matters:
        (maxSolo > 0 && solo >= share * maxSolo) ||
        (maxTrio > 0 && trio >= share * maxTrio) ||
        soloUp.verdict !== 'hold' ||
        (trioUp?.verdict ?? 'hold') !== 'hold' ||
        flips.length > 0,
    };
  };
  const tiles = heroes.map((hero, index) =>
    tileOf(hero, solos[index] ?? 0, trios[index] ?? 0, flipsOf(hero.captainId)),
  );
  // Its gain where it applies: the solo reading (a lineup with the hero alone, march type left open).
  const situational = conditional.map((hero) => tileOf(hero, soloScore(base, hero.captainId), 0, []));

  const { bannerMax, bannerMarginal } = CAMPAIGN.heroReport;
  const bannerOf = (ranked: readonly HeroAction[]): HeroAction[] => {
    let banner = ranked.slice(0, bannerMax);
    const first = banner[0];
    const last = banner.length === bannerMax ? banner.at(-1) : undefined;
    if (
      first !== undefined &&
      last !== undefined &&
      last.unit === first.unit &&
      last.score < bannerMarginal * first.score
    )
      banner = banner.slice(0, -1);
    return banner;
  };
  const ranked: Record<Role, HeroAction[]> = { solo: rankActions(all.solo), trio: rankActions(all.trio) };
  const banner: Record<Role, HeroAction[]> = { solo: bannerOf(ranked.solo), trio: bannerOf(ranked.trio) };
  const planOf = (role: Role): HeroTile[] => {
    const plan: HeroTile[] = [];
    for (const action of ranked[role]) {
      const tile = tiles.find((candidate) => candidate.captainId === action.captainId);
      if (tile !== undefined && !plan.includes(tile) && plan.length < 3) plan.push(tile);
    }
    return plan;
  };

  return {
    stops,
    tiles,
    situational,
    bestTrio: bestTrioOf(base.trios),
    stopTrios: stops.map((_, at) =>
      bestTrioOf(base.trios.map((trio) => ({ ...trio, stops: [trio.stops[at] ?? 0] }))),
    ),
    banner,
    plan: { solo: planOf('solo'), trio: planOf('trio') },
    worth: rows,
    situations: situationRows,
    getting: worthGetting(input.catalog ?? []),
    skipped: input.skipped ?? [],
    unit: banner.solo[0]?.unit ?? banner.trio[0]?.unit ?? null,
  };
}
