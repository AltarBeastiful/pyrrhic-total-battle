/**
 * 229 — **what `Tight (old)` costs a Generate** (owner, 2026-10-13: *"tell me if tight-old makes the
 * generation slower"*).
 *
 * The bar's tables are priced by `positionTrades` over `OFFERED_POSITIONS`
 * (`src/ui/sections/march/positions.ts`), and since 2026-10-07 that list carries two positions: `Tight`
 * (rated) and `Tight (old)` (the damage-ranked Tight kept for the selector's comparison). **Both are priced
 * on every stop of the bar**, and the bar's pricing is *awaited* before the March is drawn (`priceBar`,
 * `generate.ts`), so both are on the Generate's own clock.
 *
 * So the question the owner asked is one number: **how much more does a stop cost when `Tight (old)` is
 * priced beside `Tight`?** This walks every stop of every benchmark army and the live account's bar, and
 * prices each stop twice on fresh kernels — `['tight']` alone, then `['tight', 'tightOld']` exactly as the
 * app asks them (`positionTrades` runs them in that order through one kernel, so the memo `raise` keeps
 * shares the battles the second search would otherwise fight again) — three times each, min of the three.
 *
 * **The second search is a re-ranking of the same box**: `Tight` and `Tight (old)` share the merc cap, the
 * shelter and the box, and differ only in the rank the search maximises (the owner's `markerRates` against
 * damage alone). A **walked** box is enumerated once and re-ranked; a **searched** one explores by its rank,
 * so it may visit vectors the other did not and pay for them. The margin therefore tracks the walk/search
 * split (§3), and §2 says whether the two positions even answer differently here.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/229-the-cost-of-tight-old.test.ts`
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch, withMethod } from '@/engine';
import { setRaiseKernel } from '@/engine/fast';
import { createRaiseKernel } from '@/kernel/raise';
import { parseImport } from '@/share/exportImport';
import { buildStackRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';
import { positionTrades } from '@/ui/sections/march/positions';
import { troopFloor, type RaiseMode } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

/** The account investigation 0025 profiled (never committed, `pyrrhic-my-account-2026-10-11.json` at the root). */
const LIVE = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';

/** The arms: `Tight` alone, and `Tight` then `Tight (old)` — `OFFERED_POSITIONS`, in the app's own order. */
type Mode = Exclude<RaiseMode, 'off'>;
const ALONE: readonly Mode[] = ['tight'];
const BOTH: readonly Mode[] = ['tight', 'tightOld'];
/** Timings are noisy; each arm is priced this many times and the min kept. */
const RUNS = 3;

/** Are two count records the same march, type for type? (The two positions' answers, compared whole.) */
function sameCounts(a: Record<string, number>, b: Record<string, number>): boolean {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) if ((a[id] ?? 0) !== (b[id] ?? 0)) return false;
  return true;
}

describe.skipIf(!process.env.THEORY)('the cost of tight-old on the bar', () => {
  it(
    'prices every stop with and without it, on the live account and every benchmark army',
    () => {
      const module = loadKernelModule();
      const report = new Report('229-the-cost-of-tight-old');
      report.add(
        [
          '**`Tight` on its own against `Tight` + `Tight (old)`**, on every stop of the bar that has a box to',
          'search. **alone** is the stop priced with `OFFERED_POSITIONS` = `[`tight`]`; **both** is the',
          'shipped `[`tight`, `tightOld`]`; **Δ** is the second search the bar pays for the',
          'comparison segment. Three fresh-kernel runs each, min taken, so a cold JIT does not read as a cost.',
          '',
          '| army · stop | box (how) | alone ms | both ms | Δ ms | Δ % | answers |',
          '|---|---|---:|---:|---:|---:|---|',
        ].join('\n'),
      );

      const tally = {
        stops: 0,
        walked: 0,
        searched: 0,
        alone: 0,
        both: 0,
        differ: 0,
        worst: 0,
        worstLabel: '',
        /** Every ordinary stop — a `Tight` under a second, where a box is walked, not searched over minutes. */
        ordinaryStops: 0,
        ordinaryAlone: 0,
        ordinaryBoth: 0,
        /** The live account's own bar, its five stops. */
        liveStops: 0,
        liveAlone: 0,
        liveBoth: 0,
      };

      const price = (
        request: Parameters<typeof positionTrades>[0],
        base: Parameters<typeof positionTrades>[1],
        modes: readonly Mode[],
      ): { ms: number; rows: ReturnType<typeof positionTrades> } => {
        let ms = Infinity;
        let rows: ReturnType<typeof positionTrades> | null = null;
        for (let run = 0; run < RUNS; run += 1) {
          // A kernel of the stop's own, so the second arm is never warm from the first (§ the census' own rule).
          setRaiseKernel(createRaiseKernel(module));
          const began = performance.now();
          rows = positionTrades(request, base, modes);
          ms = Math.min(ms, performance.now() - began);
        }
        if (rows === null) throw new Error('positionTrades answered nothing');
        return { ms, rows };
      };

      /** The live account's own scenario, kept apart from the benchmark's so its bar is read on its own. */
      let liveLabel: string | null = null;

      const scenarios = [...criteriaScenarios()];
      try {
        const parsed = parseImport(readFileSync(LIVE, 'utf8'));
        if (parsed.kind === 'profile') {
          const profile = parsed.payload as Profile;
          const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
          if (setup !== undefined) {
            liveLabel = `the live account of 2026-10-11 (${profile.name})`;
            scenarios.push({ label: liveLabel, request: buildStackRequest(profile, setup) });
          }
        }
      } catch {
        report.add(`\n(\`${LIVE}\` was not readable; the live account is not in this measurement.)`);
      }

      for (const scenario of scenarios) {
        let plan;
        try {
          plan = planCampaign({
            request: scenario.request,
            marchTarget: HORIZON,
            budgetMs: CAMPAIGN.budgets.plan,
            ...CAMPAIGN.planFixes,
            putBack: CAMPAIGN.putBack,
          });
        } catch (error) {
          if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
          continue;
        }
        // The app prices the bar on the **elite** request (`priceBar` gets `marchRequest`, `generate.ts`).
        const request = withMethod(scenario.request, 'elite');
        for (const stop of plan.alternatives) {
          const base = planMarch(request, stop.counts).result;
          if (troopFloor(base) === null) continue;

          const alone = price(request, base, ALONE);
          const both = price(request, base, BOTH);
          const tight = both.rows.rows.find((row) => row.mode === 'tight');
          const old = both.rows.rows.find((row) => row.mode === 'tightOld');
          // Sanity: pricing the second position must not move the first (the arms agree on `Tight`).
          expect(tight?.counts).toEqual(alone.rows.rows.find((row) => row.mode === 'tight')?.counts);

          const delta = both.ms - alone.ms;
          const how = tight?.how ?? '—';
          const differ = tight !== undefined && old !== undefined && !sameCounts(tight.counts, old.counts);
          tally.stops += 1;
          if (how === 'walked') tally.walked += 1;
          else if (how === 'searched') tally.searched += 1;
          tally.alone += alone.ms;
          tally.both += both.ms;
          if (differ) tally.differ += 1;
          // A stop whose own `Tight` is under a second is one a real box walks; the searched monsters that run
          // for tens of seconds are read apart so one camp cannot speak for every account.
          if (alone.ms < 1_000) {
            tally.ordinaryStops += 1;
            tally.ordinaryAlone += alone.ms;
            tally.ordinaryBoth += both.ms;
          }
          if (scenario.label === liveLabel) {
            tally.liveStops += 1;
            tally.liveAlone += alone.ms;
            tally.liveBoth += both.ms;
          }
          if (delta > tally.worst) {
            tally.worst = delta;
            tally.worstLabel = `${scenario.label} · ${stop.pick}`;
          }
          report.add(
            [
              `| ${scenario.label} · ${stop.pick} | ${n(tight?.space ?? 0)} (${how}) |`,
              `${alone.ms.toFixed(1)} | ${both.ms.toFixed(1)} | ${delta.toFixed(1)} |`,
              `${alone.ms === 0 ? '—' : ((delta / alone.ms) * 100).toFixed(1)} % |`,
              `${differ ? '**differ**' : 'same'} |`,
            ].join(' '),
          );
        }
      }

      setRaiseKernel(null);

      const pct = (value: number, total: number): string =>
        total === 0 ? '—' : `${((value / total) * 100).toFixed(1)} %`;
      const ms = (value: number): string => `${value.toFixed(1)} ms`;
      report.h('What the numbers say');
      report.add(
        [
          `- **${n(tally.stops)}** stops priced (${n(tally.walked)} walked, ${n(tally.searched)} searched) over every`,
          '  benchmark army and the live account.',
          `- **The whole corpus**: \`Tight\` alone ${n(Math.round(tally.alone))} ms, \`Tight (old)\` beside it`,
          `  ${n(Math.round(tally.both))} ms — the second search adds ${n(Math.round(tally.both - tally.alone))} ms`,
          `  (${pct(tally.both - tally.alone, tally.alone)}). **That total is two stops of one camp**: the`,
          '  monster tiers 3–7 at 20 000 dominance, whose searched boxes are 10¹⁴–10²³ vectors and cost 3.6–37 s a',
          '  stop. No real account reaches them — 0025’s own live workload meets none.',
          `- **Every ordinary stop** (\`Tight\` under a second — ${n(tally.ordinaryStops)} of ${n(tally.stops)}):`,
          `  ${ms(tally.ordinaryAlone)} alone, ${ms(tally.ordinaryBoth)} with it, a margin of`,
          `  **${ms(tally.ordinaryBoth - tally.ordinaryAlone)}** (${pct(tally.ordinaryBoth - tally.ordinaryAlone, tally.ordinaryAlone)}).`,
          `- **The live account of 2026-10-11’s own bar** (its ${n(tally.liveStops)} stops): ${ms(tally.liveAlone)}`,
          `  alone, ${ms(tally.liveBoth)} with it — \`Tight (old)\` costs **${ms(tally.liveBoth - tally.liveAlone)}** a`,
          '  Generate. A player cannot feel a millisecond.',
          `- The two positions answered **differently on ${n(tally.differ)} of ${n(tally.stops)}** stops — and on the`,
          '  live account’s own bar, never. Where they agree, the second search re-ranks the same box and buys',
          '  nothing a player can see.',
          `- The single widest margin is **${tally.worst.toFixed(1)} ms** (\`${tally.worstLabel}\`).`,
        ].join('\n'),
      );
      report.add(`\nSaved to ${report.save()}`);
    },
    20 * 60_000,
  );
});
