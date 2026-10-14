/**
 * 233 — **the thrifty stop** (`tools/theorycraft/thrifty-stop.ts`; the owner, 2026-10-14: *"a row at the exact burn of
 * the sweet spot or lower … optimize dmg/silver, dmg/merc while keeping training time down … report it … for all
 * benchmarks, create a new report and a script that creates it"*).
 *
 * Reads the committed horizon of the 19 benchmark armies (`out/232-the-march-horizon.json`, so the run is seconds and
 * byte-identical), applies the rule to each, and writes `out/233-the-thrifty-stop.json` (every army's sweet spot,
 * pick and funnel per rule) and `out/233-the-thrifty-stop.md` (the report). Rules: `thrifty` (the first, kept for
 * comparison) and `rated q40/q20/q10/q5` — the best owner's rating against the sweet spot among stepping stones whose burn
 * is below the next stop up's, with the weight of the queue stepped from the app's 40 down to 5.
 *
 * `PYRRHIC_HORIZON_EXPORT` is an optional comma-separated list of account exports, each added as an army beside the
 * 19 with `horizonOf` (one `planCampaign` each, as 232 does). A report, not a baseline: nothing is pinned.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/233-the-thrifty-stop.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import { OUT_DIR } from './harness';
import { horizonOf, loadHorizon } from './march-horizon';
import type { ArmyHorizon } from './march-horizon';
import { saveJson } from './plan-report';
import { CAMPAIGN } from '../../src/config';
import { GOLD_RATE, THRIFTY, ratedRule, renderThrifty, thriftyStop } from './thrifty-stop';
import type { ThriftyRule, Variant } from './thrifty-stop';

describe.skipIf(!process.env.THEORY)('233 — the thrifty stop', () => {
  it('writes the thrifty stop of every benchmark army', () => {
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

    // The queue's weight: the app's own rate is 40 (a queue cut of 40 % is worth one percent of damage); lower is heavier.
    const WEIGHTS = [CAMPAIGN.markerRates.seconds, 20, 10, 5];
    const rules: { name: string; about: string; rule: ThriftyRule }[] = [
      {
        name: 'thrifty',
        about:
          "the first rule, kept for comparison: burn ≤ the sweet spot's, damage below it, queue ≥ 10 % shorter, dmg/silver and dmg/merc ≥ 95 % of the sweet spot's; the most damage.",
        rule: THRIFTY,
      },
      ...WEIGHTS.map((seconds) => ({
        name: `rated q${String(seconds)}`,
        about:
          "a stepping stone (damage and queue strictly between the next stop down's and the sweet spot's), **burn strictly below the next stop up's**, " +
          "dmg/silver and dmg/merc ≥ 95 % of the sweet spot's, no queue gate; **the best owner's rating against the sweet spot** " +
          `with the queue weighted at ${String(seconds)} (percent of queue worth one percent of damage${seconds === CAMPAIGN.markerRates.seconds ? ", the app's own" : ''}) and gold at ${String(GOLD_RATE)}.`,
        rule: ratedRule(seconds),
      })),
    ];
    const variants: Variant[] = rules.map(({ name, about, rule }) => ({
      name,
      about,
      rates: rule.rates,
      results: armies.map((army) => thriftyStop(army, rule)),
    }));

    const meta = { experiment: '233', armies: armies.length, extraArmies: armies.length - 19 };
    mkdirSync(OUT_DIR, { recursive: true });
    saveJson(
      new URL('233-the-thrifty-stop.json', OUT_DIR),
      armies.map((army, i) => ({
        label: army.label,
        ...Object.fromEntries(variants.map((v) => [v.name, v.results[i]])),
      })) as never,
      { ...meta, rules: rules.map(({ name, rule }) => ({ name, ...rule })) },
    );
    writeFileSync(new URL('233-the-thrifty-stop.md', OUT_DIR), renderThrifty(armies, variants, meta));

    // The report is whole: every pick is a fifth candidate of its army and honours the burn it was chosen under.
    for (const variant of variants) {
      variant.results.forEach((result, i) => {
        const { pick, sweet } = result;
        if (!pick || !sweet) return;
        expect(pick.marks.fifthCandidate, `${variant.name} ${result.label}: a fifth candidate`).toBe(true);
        expect(pick.worst, `${variant.name} ${result.label}: below the sweet spot`).toBeLessThan(sweet.worst);
        const up = armies[i]?.rows
          .filter((r) => r.marks.stop !== undefined && r.worst > sweet.worst)
          .map((r) => r.hired);
        if (result.rule.burn === 'below-next-stop' && up && up.length > 0)
          expect(pick.hired, `${variant.name} ${result.label}: burn below the next stop up`).toBeLessThan(
            Math.min(...up),
          );
      });
    }
  }, 600_000);
});
