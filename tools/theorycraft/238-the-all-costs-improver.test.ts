/**
 * 238 — **the all-costs improver** (`tools/theorycraft/thrifty-stop.ts`; the owner, 2026-10-14: *"go back to my initial
 * request, I had a march that improved all criteria while taking a bit more merc — look at that again and infer a rule"*).
 *
 * That march (his 10-13 account, 9,471,089 at burn 4 against the sweet spot's 3) beats the sweet spot on silver, gold,
 * coins and queue, and on damage a silver, a merc, a gold and a coin; it gives up 5 % of the damage and takes one more chunk
 * of burn. The rule inferred: a row the bar did not offer, burn below the next stop up's, queue strictly shorter, silver
 * no higher, gold and coins within a tolerance, dmg/silver and dmg/merc at least the sweet spot's; of what passes, the most
 * damage, and keeping at least `CAMPAIGN.planFixes.fifthStop.damageFloor` (0.8, `src/config.ts`) of the sweet spot's damage. The sweep moves
 * the gold/coin tolerance from 0 (strictly every cost) up, on two burn limits; every other number is the config's.
 *
 * Reads the committed 232 horizon; `PYRRHIC_HORIZON_EXPORT` adds account exports. Writes `out/238-the-all-costs-improver.{json,md}`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/238-the-all-costs-improver.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import { OUT_DIR } from './harness';
import { horizonOf, loadHorizon } from './march-horizon';
import type { ArmyHorizon } from './march-horizon';
import { saveJson } from './plan-report';
import { improverRule, ratiosOf, renderSweep, thriftyStop } from './thrifty-stop';
import type { SweepLine } from './thrifty-stop';

const TOLERANCES = [CAMPAIGN.planFixes.fifthStop.goldTolerance, 0.05, 0.1, 0.2, 0.5, 1];

describe.skipIf(!process.env.THEORY)('238 — the all-costs improver', () => {
  it("infers the owner's first march as a rule and writes what it picks", () => {
    const base = loadHorizon(new URL('232-the-march-horizon.json', OUT_DIR));
    const armies: ArmyHorizon[] = [...base.armies];
    expect(armies.length, 'the 232 horizon holds the 19 benchmark armies').toBe(19);
    for (const file of (process.env.PYRRHIC_HORIZON_EXPORT ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f !== '')) {
      if (!existsSync(file)) continue;
      const parsed = parseImport(readFileSync(file, 'utf8'));
      const setup = parsed.kind === 'profile' ? parsed.payload.setups[0] : undefined;
      if (parsed.kind !== 'profile' || !setup) continue;
      armies.push(horizonOf(`export · ${basename(file)}`, buildStackRequest(parsed.payload, setup)));
    }

    const make = (name: string, about: string, burn: 'below-next-stop' | number): SweepLine => ({
      name,
      about,
      values: TOLERANCES,
      label: (t) => `gold, coins ≤ +${String(Math.round(t * 100))} %`,
      results: TOLERANCES.map((t) =>
        armies.map((army) =>
          thriftyStop(army, improverRule(t, burn, CAMPAIGN.planFixes.fifthStop.damageFloor)),
        ),
      ),
    });
    const lines = [
      make(
        'burn below the next stop up',
        'the burn may climb to just under the next stop above the sweet spot.',
        'below-next-stop',
      ),
      make('burn ≤ the sweet spot', "the burn may not climb: the same rule at the sweet spot's own burn.", 0),
    ];

    const meta = {
      experiment: '238',
      armies: armies.length,
      extraArmies: armies.length - 19,
      tolerances: TOLERANCES,
      fifthStop: CAMPAIGN.planFixes.fifthStop,
    };
    mkdirSync(OUT_DIR, { recursive: true });
    saveJson(
      new URL('238-the-all-costs-improver.json', OUT_DIR),
      armies.map((army, a) => ({
        label: army.label,
        ...Object.fromEntries(
          lines.map((line) => [
            line.name,
            line.values.map((t, v) => ({ goldTolerance: t, ...(line.results[v]?.[a] ?? {}) })),
          ]),
        ),
      })) as never,
      meta,
    );
    writeFileSync(
      new URL('238-the-all-costs-improver.md', OUT_DIR),
      renderSweep(
        armies,
        lines,
        {
          title: "The all-costs improver — the owner's first march, inferred as a rule",
          intro:
            "A row the bar did not offer (undominated ∧ in the band ∧ not a stop ∧ not a generator) with **silver no higher and queue strictly shorter than the sweet spot's, gold and dragon coins within the tolerance of the column, dmg/silver and dmg/merc at least the sweet spot's, and at least the configured share of its damage (`CAMPAIGN.planFixes.fifthStop.damageFloor`, 80 %)**; the burn is free up to the line's limit. A row that out-damages the sweet spot replaces it. Of what passes, **the most damage**. The tolerance steps from 0 — every cost strictly improved, as in the owner's march — upward, since the owner calls gold the lesser criterion.",
        },
        meta,
      ),
    );

    // Every pick improves every cost it is gated on and keeps both ratios; a looser tolerance never loses a pick.
    for (const line of lines)
      armies.forEach((army, a) => {
        let had = false;
        line.values.forEach((t, v) => {
          const result = line.results[v]?.[a];
          const pick = result?.pick;
          const sweet = result?.sweet;
          if (had) expect(pick, `${line.name} ${army.label} at +${String(t)}`).toBeDefined();
          if (!pick || !sweet) return;
          had = true;
          expect(pick.silver, `${army.label}: silver`).toBeLessThanOrEqual(sweet.silver);
          expect(pick.seconds, `${army.label}: queue`).toBeLessThan(sweet.seconds);
          expect(pick.gold, `${army.label}: gold`).toBeLessThanOrEqual(sweet.gold * (1 + t) + 1e-6);
          expect(ratiosOf(pick).silver, `${army.label}: dmg/silver`).toBeGreaterThanOrEqual(
            ratiosOf(sweet).silver,
          );
          expect(ratiosOf(pick).merc, `${army.label}: dmg/merc`).toBeGreaterThanOrEqual(ratiosOf(sweet).merc);
          expect(pick.worst, `${army.label}: damage floor`).toBeGreaterThanOrEqual(
            sweet.worst * CAMPAIGN.planFixes.fifthStop.damageFloor,
          );
        });
      });
  }, 600_000);
});
