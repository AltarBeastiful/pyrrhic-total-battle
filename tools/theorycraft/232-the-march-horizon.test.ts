/**
 * 232 — **the march horizon** (`docs/plans/the-march-horizon.md`; the owner, 2026-10-14: *"a full benchmark
 * generating all marches, not just offered but computed … its ratings and criterias, and a mark on which one we
 * selected"*).
 *
 * One `planCampaign` per army over the 19 benchmark armies (`commonScenarios()` + `ownerScenarios(profile)`), and
 * for each the set of marches the plan computes and the bar does not show: the ten readings, the owner's rating
 * against the sweet spot and the cheapest stop, the bar's criteria, and the marks that say which row the bar
 * offered (`tools/theorycraft/march-horizon.ts`).
 *
 * Writes `out/232-the-march-horizon.json` (committed), `out/232-the-march-horizon.md` (the committed one-pager)
 * and `out/232-the-march-horizon-full.md` (the giant table, gitignored). **A report, not a baseline**: the three
 * assertions below say the run is whole, and no figure is pinned.
 *
 * `PYRRHIC_HORIZON_EXPORT` is an optional comma-separated list of account exports, each added as an army beside
 * the 19 (built with `buildStackRequest`, as `loadOwner` in `harness.ts` does; a path that does not exist is
 * skipped with a note). It never enters `plan-scenarios.ts`, so no golden moves.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/232-the-march-horizon.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import type { StackRequest } from '../../src/engine/types';
import { UNBUDGETED, measure } from '../../tests/engine/plan-measure';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import type { Scenario } from '../../tests/engine/plan-scenarios';
import { OUT_DIR, Report } from './harness';
import { figuresOf, horizonOf, renderHorizon, renderSummary, saveHorizon } from './march-horizon';
import type { ArmyHorizon } from './march-horizon';
import { READINGS } from './plan-report';
import type { Figures } from './plan-report';

/** The army an export file describes, built as `loadOwner` builds it (setup 0), or `null` with a note. */
function exportArmy(
  file: string,
  note: (text: string) => void,
): { label: string; request: StackRequest } | null {
  if (!existsSync(file)) {
    note(`PYRRHIC_HORIZON_EXPORT: ${file} does not exist, skipped`);
    return null;
  }
  const parsed = parseImport(readFileSync(file, 'utf8'));
  if (parsed.kind !== 'profile') {
    note(`PYRRHIC_HORIZON_EXPORT: ${file} is not a profile export, skipped`);
    return null;
  }
  const setup = parsed.payload.setups[0];
  if (!setup) {
    note(`PYRRHIC_HORIZON_EXPORT: ${file} has no setup, skipped`);
    return null;
  }
  return { label: `export · ${basename(file)}`, request: buildStackRequest(parsed.payload, setup) };
}

/** The ten readings of a row, as the bar's own `READINGS` print them (`best` is not among their inputs). */
const readingsOf = (figures: ReturnType<typeof figuresOf>): number[] =>
  READINGS.map((reading) => reading.of({ ...figures, best: 0 } as Figures));

describe.skipIf(!process.env.THEORY)('232 — the march horizon', () => {
  it('writes the horizon of every benchmark army', () => {
    const report = new Report('232-the-march-horizon-run');
    const profile = ownerProfile();
    if (!profile) throw new Error('the owner export of the benchmark is missing (OWNER_EXPORT)');
    const scenarios: Scenario[] = [...commonScenarios(), ...ownerScenarios(profile)];
    expect(scenarios.length, 'the benchmark corpus is 19 armies').toBe(19);

    const extras = (process.env.PYRRHIC_HORIZON_EXPORT ?? '')
      .split(',')
      .map((file) => file.trim())
      .filter((file) => file !== '')
      .flatMap((file) => exportArmy(file, (text) => report.add(text)) ?? []);

    const armies: ArmyHorizon[] = [];
    for (const { label, request } of [...scenarios, ...extras]) {
      const horizon = horizonOf(label, request);
      armies.push(horizon);
      report.add(
        `${label}: ${
          horizon.refused
            ? `REFUSED (${horizon.refused})`
            : `${String(horizon.rows.length)} rows, ` +
              `${String(horizon.stops.length)} stops, ${String(horizon.census.fifthCandidates)} fifth candidates`
        }`,
      );
    }

    const meta = {
      experiment: '232',
      marchTarget: HORIZON,
      benchmarkArmies: scenarios.length,
      extraArmies: extras.length,
    };
    mkdirSync(OUT_DIR, { recursive: true });
    saveHorizon(new URL('232-the-march-horizon.json', OUT_DIR), armies, meta);
    writeFileSync(new URL('232-the-march-horizon.md', OUT_DIR), renderSummary(armies, meta));
    writeFileSync(new URL('232-the-march-horizon-full.md', OUT_DIR), renderHorizon(armies, meta));

    const benchmark = armies.slice(0, scenarios.length);

    // (1) every benchmark army produced rows, none refused.
    for (const army of benchmark) {
      expect(army.refused, `${army.label} was refused`).toBeUndefined();
      expect(army.rows.length, `${army.label} produced no rows`).toBeGreaterThan(0);
    }

    // (2) one to five stops, each present in `rows`, with the readings the standing benchmark builds for the
    // same army. `measure` is the benchmark's own request (`runPlanOnce`): if the library's `CampaignInput`
    // drifts from it, the stops stop matching and this goes red.
    scenarios.forEach((scenario, index) => {
      const army = benchmark[index];
      if (!army) throw new Error(`no horizon for ${scenario.label}`);
      expect(army.stops.length, `${army.label}: stops`).toBeGreaterThanOrEqual(1);
      expect(army.stops.length, `${army.label}: stops`).toBeLessThanOrEqual(5);
      const measured = measure(scenario, UNBUDGETED, 1);
      if (!measured.plan)
        throw new Error(`${army.label}: the benchmark's own plan was refused (${measured.refusal ?? '?'})`);
      expect(
        measured.plan.alternatives.map((stop) => stop.pick),
        `${army.label}: the offered picks`,
      ).toEqual(army.stops.map((stop) => stop.pick));
      for (const stop of measured.plan.alternatives) {
        const row = army.rows.find((r) => r.marks.stop === stop.pick);
        expect(row, `${army.label}: the ${stop.pick} stop is among the rows`).toBeDefined();
        if (!row) continue;
        expect(readingsOf(row), `${army.label}: ${stop.pick} readings`).toEqual(
          readingsOf(figuresOf(stop.repeat)),
        );
      }
    });

    // (3) the horizon contains the bar, and the census is nested.
    for (const army of benchmark) {
      const mostDamage = army.readings.find((reading) => reading.head === 'most damage');
      if (!mostDamage) throw new Error(`${army.label}: no 'most damage' reading`);
      // The bar's readings are campaign totals (`readingOf` over `StopReport.campaign`), a row's `worst` is one
      // march: compare each on its own scale.
      const best = Math.max(...army.rows.map((row) => row.worst));
      const bestStop = Math.max(
        ...army.rows.filter((row) => row.marks.stop !== undefined).map((row) => row.worst),
      );
      expect(
        best,
        `${army.label}: best row on worst vs the best offered stop, a march`,
      ).toBeGreaterThanOrEqual(bestStop);
      const bestCampaign = Math.max(...army.rows.map((row) => row.campaign.totalDamage));
      expect(
        bestCampaign,
        `${army.label}: best row campaign vs the bar's most damage`,
      ).toBeGreaterThanOrEqual(mostDamage.value);
      const { summarised, undominated, band } = army.census;
      expect(summarised, `${army.label}: summarised ≥ undominated`).toBeGreaterThanOrEqual(undominated);
      expect(undominated, `${army.label}: undominated ≥ band`).toBeGreaterThanOrEqual(band);
    }

    report.save();
  }, 600_000);
});
