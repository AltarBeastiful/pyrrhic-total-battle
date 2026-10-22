/**
 * **The hero report pass** (`docs/plans/hero-report.md`): the role pass and the situation pass, as jobs of the
 * calculation pool, and the report built from their readings (`buildHeroReport`, pure).
 *
 * A reading is one screen job (`client.captains`): the march with no hero is the current lineup, every hero alone and
 * every trio are screened against it, and each stop of the lead march's bar is re-priced under their totals. A
 * **situation** is the same screen under a changed request: its own baseline is planned first (one probe job), so
 * the stops re-priced are the ones that situation would march. No job carries a clock, results are merged by
 * position, so one worker and six give one report.
 */
import { CAMPAIGN } from '@/config';
import { CATEGORIES, type Category } from '@/data/types';
import {
  buildHeroReport,
  type CatalogHero,
  type HeroInfo,
  type HeroReport,
  type RoleReading,
  type SituationId,
} from '@/engine/heroReport';
import type { ScreenLineup } from '@/engine/captains';
import type { CampaignInput } from '@/engine/plan';
import type { MarkerRates } from '@/engine/rating';
import type { EnemyFormation, StackRequest } from '@/engine/types';

import type { CalcPool, PoolJob } from './pool';
import type { CaptainScreenAnswer, ProbeAnswer } from './protocol';
import type { UpgradeLead, WorthResult } from './captainUpgrades';

/** The heroes and the lineups to screen, built on the main thread (`src/state/heroLineups.ts`). */
export interface HeroRoster {
  heroes: HeroInfo[];
  /** The march with no hero: the baseline every gain is read against. */
  none: ScreenLineup;
  /** Every captain of the game with its difficulty, for the last block; omitted: no recommendation. */
  catalog?: CatalogHero[] | undefined;
  solos: (ScreenLineup & { captainIds: string[] })[];
  trios: (ScreenLineup & { captainIds: string[] })[];
}

export interface HeroReportOptions {
  signal?: AbortSignal | undefined;
  onProgress?: ((done: number, total: number) => void) | undefined;
  budgetMs?: number | undefined;
  rates?: MarkerRates | undefined;
  /** `false` reads the default situation only. */
  situations?: boolean | undefined;
}

/** The enemy formation with `step` squads moved from the categories without a monster to those with one. */
export function monsterFormation(
  enemy: EnemyFormation,
  monsterCategories: readonly Category[],
  step: number,
): EnemyFormation | null {
  if (monsterCategories.length === 0) return null;
  const next = { ...enemy };
  const others = CATEGORIES.filter((category) => !monsterCategories.includes(category));
  let moved = 0;
  while (moved < step) {
    const from = others.filter((category) => next[category] > 0).sort((a, b) => next[b] - next[a])[0];
    if (from === undefined) break;
    const to = [...monsterCategories].sort((a, b) => next[a] - next[b])[0]!;
    next[from] -= 1;
    next[to] += 1;
    moved += 1;
  }
  return moved === 0 ? null : next;
}

/** A situation's request, `null` (with why) when this account has nothing the situation could change. */
function situationRequest(
  id: Exclude<SituationId, 'default'>,
  request: StackRequest,
  lead: UpgradeLead,
): { request: StackRequest } | { why: string } {
  const { monsterShift, mercsAllowance, otherMercs } = CAMPAIGN.heroReport.situations;
  if (id === 'monsters') {
    const categories = [
      ...new Set(
        request.units.flatMap((unit) => (unit.pool === 'dominance' && unit.category ? [unit.category] : [])),
      ),
    ];
    const enemy = monsterFormation(request.enemy, categories, monsterShift);
    return enemy === null ? { why: 'The army fields no monster.' } : { request: { ...request, enemy } };
  }
  const mercs = request.units.filter(
    (unit) => unit.pool === 'authority' && request.caps[unit.id] !== undefined,
  );
  if (mercs.length === 0) return { why: 'The army holds no mercenary.' };
  if (id === 'moreMercs') {
    const caps = { ...request.caps };
    for (const unit of mercs) caps[unit.id] = Math.ceil((caps[unit.id] ?? 0) * mercsAllowance);
    return { request: { ...request, caps } };
  }
  if (!otherMercs) return { why: 'Switched off.' };
  const used = (unitId: string): number =>
    lead.stops.reduce((sum, stop) => sum + (stop.counts[unitId] ?? 0), 0);
  const top = [...mercs].sort((a, b) => used(b.id) - used(a.id))[0];
  if (top === undefined || used(top.id) === 0) return { why: 'The lead march hires no mercenary.' };
  return { request: { ...request, caps: { ...request.caps, [top.id]: 0 } } };
}

function settingsOf(input: CampaignInput): CampaignInput {
  const settings = { ...input };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

/**
 * Run the hero report: the lineups of `roster` screened against the march with no hero, on the lead march's bar
 * and, unless switched off, under each situation. `worth` is the upgrade worth list (`null`: no verdicts).
 * Rejects when `signal` aborts.
 */
export async function runHeroReport(
  input: CampaignInput,
  lead: UpgradeLead,
  roster: HeroRoster,
  worth: WorthResult | null,
  pool: CalcPool,
  options: HeroReportOptions = {},
): Promise<HeroReport> {
  const { signal, onProgress } = options;
  const budgetMs = options.budgetMs ?? CAMPAIGN.budgets.extra;
  const rates = options.rates ?? CAMPAIGN.markerRates;
  const settings = settingsOf(input);
  const lineups = [roster.none, ...roster.solos, ...roster.trios].map(({ key, totals }) => ({ key, totals }));
  const stopsOf = (stops: UpgradeLead['stops']) =>
    stops.map((stop) => ({ pick: stop.pick, counts: stop.counts }));

  const wanted: Exclude<SituationId, 'default'>[] =
    options.situations === false ? [] : ['monsters', 'moreMercs', 'otherMercs'];
  const skipped: { id: SituationId; why: string }[] = [];
  const planned: { id: Exclude<SituationId, 'default'>; request: StackRequest }[] = [];
  for (const id of wanted) {
    const made = situationRequest(id, settings.request, lead);
    if ('why' in made) skipped.push({ id, why: made.why });
    else planned.push({ id, request: made.request });
  }

  const total = 1 + planned.length * 2;
  let done = 0;
  const onSettled = (): void => {
    done += 1;
    onProgress?.(done, total);
  };
  const began = performance.now();
  const screenJob =
    (request: StackRequest, stops: UpgradeLead['stops']): PoolJob<CaptainScreenAnswer> =>
    (client, jobSignal) =>
      client.captains(
        { request, lineups, currentKey: roster.none.key, stops: stopsOf(stops), rates },
        jobSignal,
      );
  const readingOf = (answer: CaptainScreenAnswer): RoleReading => {
    const byKey = new Map(answer.screens.map((screen) => [screen.key, screen.repriced]));
    const solo: Record<string, number[]> = {};
    for (const hero of roster.solos) solo[hero.captainIds[0] ?? ''] = byKey.get(hero.key) ?? [];
    return {
      solo,
      trios: roster.trios.map((trio) => ({ captainIds: trio.captainIds, stops: byKey.get(trio.key) ?? [] })),
    };
  };
  const complete = (answer: CaptainScreenAnswer): boolean => answer.screens.length === lineups.length;

  // The situations' baselines and the default screen go out together.
  const baselineJobs = planned.map(
    ({ request }): PoolJob<ProbeAnswer> =>
      (client, jobSignal) =>
        client.probe({ plan: { ...settings, request: { ...request, totals: lead.totals } } }, jobSignal),
  );
  const [first, ...baselines] = await pool.map<CaptainScreenAnswer | ProbeAnswer>(
    [screenJob(settings.request, lead.stops), ...baselineJobs],
    { budgetMs, signal, onSettled },
  );
  if (first?.kind === 'error') throw new Error(first.message);
  if (first?.kind !== 'done' || !complete(first.value as CaptainScreenAnswer))
    throw new Error('The hero screen did not finish.');
  const readings: Partial<Record<SituationId, RoleReading>> = {
    default: readingOf(first.value as CaptainScreenAnswer),
  };

  const screenJobs: PoolJob<CaptainScreenAnswer>[] = [];
  const screened: Exclude<SituationId, 'default'>[] = [];
  baselines.forEach((outcome, at) => {
    const situation = planned[at];
    if (situation === undefined) return;
    if (outcome.kind !== 'done') {
      skipped.push({
        id: situation.id,
        why: outcome.kind === 'error' ? outcome.message : 'Cut by the clock.',
      });
      return;
    }
    screened.push(situation.id);
    screenJobs.push(screenJob(situation.request, (outcome.value as ProbeAnswer).stops));
  });
  const left = budgetMs - (performance.now() - began);
  const outcomes =
    screenJobs.length > 0 && left > 0
      ? await pool.map(screenJobs, { budgetMs: left, signal, onSettled })
      : [];
  screened.forEach((id, at) => {
    const outcome = outcomes[at];
    if (outcome?.kind === 'done' && complete(outcome.value)) readings[id] = readingOf(outcome.value);
    else skipped.push({ id, why: outcome?.kind === 'error' ? outcome.message : 'Cut by the clock.' });
  });

  return buildHeroReport({
    stops: lead.stops.map((stop) => stop.pick),
    heroes: roster.heroes,
    readings,
    skipped,
    worth: worth?.rows ?? null,
    catalog: roster.catalog,
  });
}
