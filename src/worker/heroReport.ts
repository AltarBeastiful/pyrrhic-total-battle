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
import { getUnits } from '@/data';
import { CATEGORIES, type Category } from '@/data/types';
import { probeInfo } from '@/engine/advisor';
import type { WorthKind } from '@/engine/captainUpgrades';
import {
  bestTrioOf,
  buildHeroReport,
  type CatalogHero,
  type HeroInfo,
  type HeroReport,
  type Role,
  type RoleReading,
  type SituationId,
  scoreOf,
  type WorthLike,
} from '@/engine/heroReport';
import type { ScreenLineup } from '@/engine/captains';
import type { CampaignInput } from '@/engine/plan';
import type { MarkerRates } from '@/engine/rating';
import type { BonusTotals, EnemyFormation, StackRequest } from '@/engine/types';

import type { CalcPool, PoolJob } from './pool';
import type { CaptainScreenAnswer, ProbeAnswer } from './protocol';
import type { UpgradeLead } from './captainUpgrades';

/** The heroes and the lineups to screen, built on the main thread (`src/state/heroLineups.ts`). */
export interface HeroRoster {
  heroes: HeroInfo[];
  /** The march with no hero: the baseline every gain is read against. */
  none: ScreenLineup;
  /** Every captain of the game with its difficulty, for the last block; omitted: no recommendation. */
  catalog?: CatalogHero[] | undefined;
  solos: (ScreenLineup & { captainIds: string[] })[];
  trios: (ScreenLineup & { captainIds: string[] })[];
  /**
   * The upgrades to read once the best trio is known: for every hero its solo lineup, and for each member of
   * `trio` the trio. Each probe carries the lineup with the upgrade and the one without. Omitted: no upgrades.
   */
  upgrades?: ((trio: readonly string[] | null) => HeroProbe[]) | undefined;
}

/** One upgrade of one hero in one role, as totals (built on the main thread: the worker takes no profile). */
export interface HeroProbe {
  id: string;
  label: string;
  captainId: string;
  role: Role;
  kind: WorthKind;
  /** Stars or levels added. */
  size: number;
  base: ScreenLineup;
  upgraded: ScreenLineup;
}

export interface HeroReportOptions {
  signal?: AbortSignal | undefined;
  onProgress?: ((done: number, total: number) => void) | undefined;
  budgetMs?: number | undefined;
  rates?: MarkerRates | undefined;
  /** Trios planned in full; `CAMPAIGN.heroReport.trioConfirm` by default, 0 reads the re-priced screen alone. */
  trioConfirm?: number | undefined;
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
  const mercs = request.units.filter((unit) => unit.pool === 'authority');
  if (id === 'moreMercs') {
    const held = mercs.filter((unit) => request.caps[unit.id] !== undefined);
    if (held.length === 0) return { why: 'The army holds no capped mercenary.' };
    const caps = { ...request.caps };
    for (const unit of held) caps[unit.id] = Math.ceil((caps[unit.id] ?? 0) * mercsAllowance);
    return { request: { ...request, caps } };
  }
  if (!otherMercs) return { why: 'Switched off.' };
  // The mercenary types the owner did not select join the pool, each held as many as his largest stock.
  const fielded = new Set(request.units.map((unit) => unit.id));
  const extra = getUnits().filter((unit) => unit.kind === 'mercenary' && !fielded.has(unit.id));
  if (extra.length === 0) return { why: 'Every mercenary type is already fielded.' };
  const stocks = mercs.flatMap((unit) =>
    request.caps[unit.id] === undefined ? [] : [request.caps[unit.id] ?? 0],
  );
  const caps = { ...request.caps };
  if (stocks.length > 0) for (const unit of extra) caps[unit.id] = Math.max(...stocks);
  return { request: { ...request, units: [...request.units, ...extra], caps } };
}

function settingsOf(input: CampaignInput): CampaignInput {
  const settings = { ...input };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

/**
 * Run the hero report: the lineups of `roster` screened against the march with no hero, on the lead march's bar
 * and, unless switched off, under each situation; then the upgrades of the solo lineups and of the best trio, each
 * read against its own lineup without it (tier 1: the lead march's counts re-priced). Rejects when `signal` aborts.
 */
export async function runHeroReport(
  input: CampaignInput,
  lead: UpgradeLead,
  roster: HeroRoster,
  pool: CalcPool,
  options: HeroReportOptions = {},
): Promise<HeroReport> {
  const { signal, onProgress } = options;
  const mean = (values: readonly number[]): number =>
    values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length;
  const budgetMs = options.budgetMs ?? CAMPAIGN.budgets.heroReport;
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
    const made = situationRequest(id, settings.request);
    if ('why' in made) skipped.push({ id, why: made.why });
    else planned.push({ id, request: made.request });
  }

  let total = 1 + planned.length * 2;
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

  // Tier 2 for the trios (experiment 193: the re-priced screen names the best trio on 57 % of stops, its top eight
  // hold it on 91 %): the best-reading trios planned in full against the march with no hero planned the same way.
  const defaultReading = readings.default!;
  const quick = structuredClone(defaultReading);
  const trioScore = (at: number): number =>
    mean(defaultReading.trios[at]?.stops.map((gain) => Math.max(0, gain)) ?? []);
  const trioTop = roster.trios
    .map((trio, at) => ({ trio, at }))
    .sort((a, b) => trioScore(b.at) - trioScore(a.at) || a.at - b.at)
    .slice(0, Math.max(0, options.trioConfirm ?? CAMPAIGN.heroReport.trioConfirm));
  if (trioTop.length > 0 && budgetMs - (performance.now() - began) > 0) {
    total += 1 + trioTop.length;
    const planNone: PoolJob<ProbeAnswer> = (client, jobSignal) =>
      client.probe(
        { plan: { ...settings, request: { ...settings.request, totals: roster.none.totals } } },
        jobSignal,
      );
    const [noneOutcome] = await pool.map([planNone], {
      budgetMs: budgetMs - (performance.now() - began),
      signal,
      onSettled,
    });
    if (noneOutcome?.kind === 'done') {
      const baseline = noneOutcome.value.stops;
      const confirmed = await pool.map(
        trioTop.map(
          ({ trio }): PoolJob<ProbeAnswer> =>
            (client, jobSignal) =>
              client.probe(
                {
                  plan: { ...settings, request: { ...settings.request, totals: trio.totals } },
                  against: {
                    probe: probeInfo({ id: trio.key, family: 'captains', label: trio.key }),
                    baseline,
                    rates,
                  },
                },
                jobSignal,
              ),
        ),
        { budgetMs: Math.max(0, budgetMs - (performance.now() - began)), signal, onSettled },
      );
      confirmed.forEach((outcome, index) => {
        const at = trioTop[index]?.at;
        const entry = at === undefined ? undefined : defaultReading.trios[at];
        if (outcome.kind === 'done' && outcome.value.row !== null && entry !== undefined)
          entry.stops = outcome.value.row.stops.map((stop) => stop.gain);
      });
    }
  }

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
  // The upgrades are read in the lineups the roles play in: every hero alone, and the best trio's members in it.
  const probes = roster.upgrades?.(bestTrioOf(readings.default!.trios)?.captainIds ?? null) ?? [];
  const groups = new Map<string, HeroProbe[]>();
  for (const probe of probes) {
    const at = `${probe.role}|${probe.base.key}`;
    groups.set(at, [...(groups.get(at) ?? []), probe]);
  }
  const grouped = [...groups.values()];
  total += grouped.length;
  const upgradeJobs = grouped.map(
    (group): PoolJob<CaptainScreenAnswer> =>
      (client, jobSignal) =>
        client.captains(
          {
            request: settings.request,
            lineups: [group[0]!.base, ...group.map((probe) => ({ ...probe.upgraded, key: probe.id }))].map(
              ({ key, totals }) => ({ key, totals }),
            ),
            currentKey: group[0]!.base.key,
            stops: stopsOf(lead.stops),
            rates,
          },
          jobSignal,
        ),
  );
  const left = budgetMs - (performance.now() - began);
  const outcomes =
    screenJobs.length + upgradeJobs.length > 0 && left > 0
      ? await pool.map([...screenJobs, ...upgradeJobs], { budgetMs: left, signal, onSettled })
      : [];
  screened.forEach((id, at) => {
    const outcome = outcomes[at];
    if (outcome?.kind === 'done' && complete(outcome.value)) readings[id] = readingOf(outcome.value);
    else skipped.push({ id, why: outcome?.kind === 'error' ? outcome.message : 'Cut by the clock.' });
  });
  const worth: Record<Role, WorthLike[]> = { solo: [], trio: [] };
  grouped.forEach((group, at) => {
    const outcome = outcomes[screenJobs.length + at];
    if (outcome?.kind === 'error') throw new Error(outcome.message);
    if (outcome?.kind !== 'done' || outcome.value.screens.length !== group.length + 1) return;
    const byKey = new Map(outcome.value.screens.map((screen) => [screen.key, screen.repriced]));
    for (const probe of group) {
      const raw = byKey.get(probe.id) ?? [];
      worth[probe.role].push({
        id: probe.id,
        label: probe.label,
        captainId: probe.captainId,
        kind: probe.kind,
        size: probe.size,
        worth: raw.length === 0 ? 0 : raw.reduce((sum, rating) => sum + Math.max(0, rating), 0) / raw.length,
        raw,
      });
    }
  });

  // Tier 2 (experiment 249: tier 1 alone puts the re-plan's top three in its own top three on 58 % of solo and 33 % of
  // trio reads): the best-scoring probes planned in full, the base lineup planned once and each upgrade read against it.
  if (worth.solo.length + worth.trio.length > 0) {
    const byId = new Map(probes.map((probe) => [probe.id, probe]));
    const picked = [...worth.solo, ...worth.trio]
      .sort((a, b) => scoreOf(b) - scoreOf(a))
      .slice(0, CAMPAIGN.heroReport.confirm)
      .flatMap((row) => byId.get(row.id) ?? []);
    const bases = [...new Map(picked.map((probe) => [probe.base.key, probe.base])).values()];
    const planOf = (totals: BonusTotals): CampaignInput => ({
      ...settings,
      request: { ...settings.request, totals },
    });
    total += bases.length + picked.length;
    const left2 = budgetMs - (performance.now() - began);
    const baseOutcomes =
      left2 > 0
        ? await pool.map(
            bases.map(
              (base): PoolJob<ProbeAnswer> =>
                (client, jobSignal) =>
                  client.probe({ plan: planOf(base.totals) }, jobSignal),
            ),
            { budgetMs: left2, signal, onSettled },
          )
        : [];
    const baselines = new Map<string, ProbeAnswer['stops']>();
    bases.forEach((base, at) => {
      const outcome = baseOutcomes[at];
      if (outcome?.kind === 'done') baselines.set(base.key, outcome.value.stops);
    });
    const ready = picked.filter((probe) => baselines.has(probe.base.key));
    const left3 = budgetMs - (performance.now() - began);
    const replans =
      ready.length > 0 && left3 > 0
        ? await pool.map(
            ready.map(
              (probe): PoolJob<ProbeAnswer> =>
                (client, jobSignal) =>
                  client.probe(
                    {
                      plan: planOf(probe.upgraded.totals),
                      against: {
                        probe: probeInfo({ id: probe.id, family: 'captains', label: probe.label }),
                        baseline: baselines.get(probe.base.key)!,
                        rates,
                      },
                    },
                    jobSignal,
                  ),
            ),
            { budgetMs: left3, signal, onSettled },
          )
        : [];
    ready.forEach((probe, at) => {
      const outcome = replans[at];
      if (outcome?.kind !== 'done' || outcome.value.row === null) return;
      const row = worth[probe.role].find((candidate) => candidate.id === probe.id);
      if (row === undefined) return;
      const stopsOf2 = outcome.value.row.stops;
      row.tier1 = row.worth;
      row.worth =
        stopsOf2.length === 0 ? 0 : stopsOf2.reduce((sum, stop) => sum + stop.gain, 0) / stopsOf2.length;
      row.raw = stopsOf2.map((stop) =>
        Math.max(stop.repricedRating, stop.replannedRating ?? Number.NEGATIVE_INFINITY),
      );
    });
  }

  // Only a planned row may say a trade worsens: the re-priced reading cries it on counts the upgrade would change.
  for (const row of [...worth.solo, ...worth.trio]) if (row.tier1 === undefined) delete row.raw;

  return buildHeroReport({
    stops: lead.stops.map((stop) => stop.pick),
    heroes: roster.heroes,
    readings,
    quick,
    skipped,
    worth: roster.upgrades === undefined ? null : worth,
    catalog: roster.catalog,
  });
}
