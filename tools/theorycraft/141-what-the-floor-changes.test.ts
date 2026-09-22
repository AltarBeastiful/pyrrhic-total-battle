/**
 * 141 — **what the playability floor actually changes, march by march** (S-133, 2026-09-22).
 *
 * The owner, on being told W9 was ready to decide: *"on W9 I don't understand what we're changing, I need an
 * actual visual example."* Fair — every account of W9 so far has been a rule and a count of pins. This is the
 * marches themselves, printed as unit lists, before and after.
 *
 * **The rule, in one sentence.** `searchPriority` may not *answer* with a selection that fields fewer than
 * `troopFloor` troop stacks. It still **evaluates** every such selection and still walks through them, so
 * nothing about the search's coverage changes — only which candidate is allowed to be the answer. What it
 * turns down is reported on `SearchResult.refused`, so the March pane can say what was refused rather than
 * quietly handing over the runner-up.
 *
 * **Three settings are measured, and the default ships unchanged.** `0` is today's search exactly (every
 * existing test passes against it, unmodified); `1` refuses a march with no troop stack at all; `2` is the
 * band's own criterion — *"the march itself must be more than a single troop stack"*.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/141-what-the-floor-changes.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { searchPriority } from '../../src/engine/search';
import type { SearchResult, StackRequest } from '../../src/engine/types';
import { countsOf, price } from '../../tests/engine/plan-campaign';
import { commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

const OBJECTIVES = [
  ['avgDamage', 'average damage'],
  ['minDamage', 'best worst case'],
  ['damagePerSilver', 'damage per silver'],
  ['damagePerGold', 'damage per gold'],
  ['damagePerDragonCoin', 'damage per dragon coin'],
] as const;

const FLOORS = [0, 1, 2] as const;

/** The march as a player would read it: every stack it fields, troops first. */
const asMarch = (request: StackRequest, counts: Record<string, number>): string => {
  const of = (pool: string): string =>
    request.units
      .filter((unit) => unit.pool === pool && (counts[unit.id] ?? 0) > 0)
      .map((unit) => `${unit.label} ${String(Math.floor(counts[unit.id] ?? 0))}`)
      .join(', ');
  const troops = of('leadership');
  const rest = [of('authority'), of('dominance')].filter((part) => part.length > 0).join(' · ');
  return `${troops.length > 0 ? troops : '**no troops**'}${rest.length > 0 ? ` · ${rest}` : ''}`;
};

const troopStacks = (request: StackRequest, counts: Record<string, number>): number =>
  request.units.filter((unit) => unit.pool === 'leadership' && (counts[unit.id] ?? 0) > 0).length;

describe.skipIf(!process.env.THEORY)('what the floor changes', () => {
  it('prints the marches the floor refuses and the ones it offers instead', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('141-what-the-floor-changes');
    report.add('# 141 — what the playability floor changes, march by march\n');
    report.add(
      'The rule: **the search may not answer with a march fielding fewer than `troopFloor` troop stacks.** ' +
        'It still evaluates every such march and still walks through them — coverage is untouched — so what ' +
        'changes is only which candidate may be the answer, and what it turned down is reported rather than ' +
        'hidden. `0` is today’s search exactly and is what ships until the pins below are registered.\n',
    );

    /** Every (army, method, objective) whose answer changes at some floor. */
    const changed: string[] = [];
    let trooplessToday = 0;
    for (const scenario of scenarios) {
      for (const method of ['elite', 'ms'] as const) {
        const title = method === 'elite' ? 'Tier ladder' : 'Troops first';
        for (const [objective, words] of OBJECTIVES) {
          const request: StackRequest = {
            ...scenario.request,
            options: { ...scenario.request.options, method },
          };
          const runs = new Map<number, SearchResult>();
          for (const floor of FLOORS) {
            runs.set(
              floor,
              searchPriority({
                request,
                objective,
                budgetMs: CAMPAIGN.budgets.search,
                ...(floor > 0 ? { troopFloor: floor } : {}),
              }),
            );
          }
          const today = runs.get(0);
          if (!today) continue;
          const todayCounts = countsOf(today.result);
          const todayStacks = troopStacks(request, todayCounts);
          if (todayStacks === 0) trooplessToday += 1;
          // Only the cells the floor actually moves are worth a reader's time.
          const moved = FLOORS.filter((floor) => {
            const run = runs.get(floor);
            return run !== undefined && run.includedUnitIds.join(',') !== today.includedUnitIds.join(',');
          });
          if (moved.length === 0) continue;

          changed.push(
            `\n### ${scenario.label.slice(0, 52)} · ${title} · ${words}\n\n` +
              [
                '| floor | the march it answers with | troop stacks | damage (worst) | silver | burn |',
                '|---|---|---:|---:|---:|---:|',
              ]
                .concat(
                  FLOORS.map((floor) => {
                    const run = runs.get(floor);
                    if (!run) return '';
                    const counts = countsOf(run.result);
                    const priced = price(request, counts);
                    const burn = request.units
                      .filter((unit) => unit.pool === 'authority')
                      .reduce((sum, unit) => sum + Math.ceil((counts[unit.id] ?? 0) / 10), 0);
                    const label = floor === 0 ? '**0 — today**' : `${String(floor)}`;
                    return (
                      `| ${label} | ${asMarch(request, counts)} | ${String(troopStacks(request, counts))} | ` +
                      `${n(priced.damage)} | ${n(priced.silver)} | ${String(burn)} |`
                    );
                  }).filter((line) => line.length > 0),
                )
                .join('\n') +
              (runs.get(1)?.refused
                ? `\n\nAt floor 1 the search **refused** \`${runs.get(1)?.refused?.includedUnitIds.join(' · ') ?? ''}\`` +
                  ` — ${String(runs.get(1)?.refused?.troopStacks ?? 0)} troop stacks — which is the march the ` +
                  'March pane would name rather than pass over in silence.'
                : ''),
          );
        }
      }
    }
    report.add(
      `\n**${String(trooplessToday)}** of the ${String(scenarios.length * 2 * OBJECTIVES.length)} ` +
        `(army × method × objective) answers field **no troop stack at all** today. ` +
        `The floor moves **${String(changed.length)}** of them.\n`,
    );
    report.add(changed.join('\n'));
    report.save();
  }, 3_600_000);
});
