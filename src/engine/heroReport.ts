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

/** The slice of a worth row the report reads (`WorthRow`). */
export interface WorthLike {
  id: string;
  label: string;
  captainId: string;
  kind: WorthKind;
  size: number;
  cost?: { amount: number; unit: string } | undefined;
  worth: number;
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
}

export interface HeroTile extends HeroInfo {
  /** Mean gain over the bar of the hero marching alone with troops. */
  solo: number;
  /** What the hero adds to the best trio over the best trio without them. */
  trio: number;
  verdict: Verdict;
  levelUp?: HeroAction;
  starUp?: HeroAction;
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
  bestTrio: BestTrio | null;
  /** The best trio of each stop alone, in the bar's order: the footnote of the best trio (E1: how far it differs). */
  stopTrios: (BestTrio | null)[];
  /** The top actions, best first; the third only when it is not marginal. */
  banner: HeroAction[];
  /** The three heroes to put effort in, best action first. */
  plan: HeroTile[];
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

/** The trio with the highest mean over the bar (the first on a tie); `null` with no trio. */
export function bestTrioOf(
  trios: RoleReading['trios'],
  skip?: (captainIds: readonly string[]) => boolean,
): BestTrio | null {
  let best: BestTrio | null = null;
  for (const trio of trios) {
    if (skip?.(trio.captainIds) === true) continue;
    const stops = clamped(trio.stops);
    const gain = mean(stops);
    if (best === null || gain > best.gain) best = { captainIds: trio.captainIds, stops, gain };
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

const scoreOf = (row: WorthLike): number =>
  row.cost === undefined ? row.worth : row.worth / row.cost.amount;

function actionOf(row: WorthLike): HeroAction {
  return {
    captainId: row.captainId,
    kind: row.kind,
    size: row.size,
    label: row.label,
    gain: row.worth,
    score: scoreOf(row),
    unit: row.cost?.unit ?? null,
  };
}

/**
 * A hero's level action is its smallest probed level step; its star action the star step with the best score
 * (`scoreOf`: per star). Rows that gain nothing are not actions.
 */
function actionsOf(rows: readonly WorthLike[], captainId: string): { level?: HeroAction; star?: HeroAction } {
  const own = rows.filter((row) => row.captainId === captainId && row.worth > 0);
  const levels = own.filter((row) => row.kind === 'level').sort((a, b) => a.size - b.size);
  let star: WorthLike | undefined;
  for (const row of own.filter((candidate) => candidate.kind === 'star'))
    if (star === undefined || scoreOf(row) > scoreOf(star)) star = row;
  const level = levels[0];
  return {
    ...(level === undefined ? {} : { level: actionOf(level) }),
    ...(star === undefined ? {} : { star: actionOf(star) }),
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
  /** The worth list's rows; `null` when it was not computed (every verdict then holds). */
  worth: readonly WorthLike[] | null;
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
  const { heroes, stops } = input;
  const base = input.readings.default;
  if (base === undefined) throw new Error('The hero report needs the default reading.');
  const rows = input.worth ?? [];

  const solos = heroes.map((hero) => soloScore(base, hero.captainId));
  const trios = heroes.map((hero) => trioContribution(base, hero.captainId));
  const maxSolo = Math.max(0, ...solos);
  const maxTrio = Math.max(0, ...trios);

  // The best action of each unit group, to tell a hero that holds from one that pays.
  const all = heroes.flatMap((hero) => {
    const { level, star } = actionsOf(rows, hero.captainId);
    return [level, star].filter((action): action is HeroAction => action !== undefined);
  });
  const topOf = (unit: string | null): number =>
    Math.max(0, ...all.filter((action) => action.unit === unit).map((action) => action.score));

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

  const tiles: HeroTile[] = heroes.map((hero, index) => {
    const { level, star } = actionsOf(rows, hero.captainId);
    const solo = solos[index] ?? 0;
    const trio = trios[index] ?? 0;
    const flips = flipsOf(hero.captainId);
    const share = CAMPAIGN.heroReport.mattersShare;
    const verdict = verdictOf(level, star, topOf);
    return {
      ...hero,
      solo,
      trio,
      verdict,
      ...(level === undefined ? {} : { levelUp: level }),
      ...(star === undefined ? {} : { starUp: star }),
      flips,
      matters:
        (maxSolo > 0 && solo >= share * maxSolo) ||
        (maxTrio > 0 && trio >= share * maxTrio) ||
        verdict !== 'hold' ||
        flips.length > 0,
    };
  });

  const ranked = rankActions(all);
  const { bannerMax, bannerMarginal } = CAMPAIGN.heroReport;
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

  const plan: HeroTile[] = [];
  for (const action of ranked) {
    const tile = tiles.find((candidate) => candidate.captainId === action.captainId);
    if (tile !== undefined && !plan.includes(tile) && plan.length < 3) plan.push(tile);
  }

  return {
    stops,
    tiles,
    bestTrio: bestTrioOf(base.trios),
    stopTrios: stops.map((_, at) =>
      bestTrioOf(base.trios.map((trio) => ({ ...trio, stops: [trio.stops[at] ?? 0] }))),
    ),
    banner,
    plan,
    situations: situationRows,
    getting: worthGetting(input.catalog ?? []),
    skipped: input.skipped ?? [],
    unit: banner[0]?.unit ?? null,
  };
}
