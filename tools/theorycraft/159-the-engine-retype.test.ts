/**
 * 159 — **the engine's `retypeMarch`, against 157-rated** (W11 §5 step 4; 2026-09-23).
 *
 * `src/engine/retype.ts` ports `tools/theorycraft/silver-aware.ts`'s `retype(…, 'rated')` into the engine,
 * with one change of substance: its rating is `rate()` (`src/engine/rating.ts`) on the march's **whole**
 * bill — damage, silver, gold, hired burn, dragon coins and queue — where 157 counted damage, silver and
 * queue only, on the claim that the kept hired stacks hold the other three fixed.
 *
 * This experiment runs both, on exactly what 157-rated ran — every march of every stop of the bar as shipped,
 * on every benchmark army, cached by march — and reads:
 *
 *  1. **Reproduction**: march by march, does the engine pick the same counts as the tool; stop by stop, is the
 *     re-typed campaign the same to the unit; and do the re-typed-stop rows print exactly as
 *     `out/157-a-silver-aware-ladder-rated.md` printed them.
 *  2. **The markers 157 left out**: over every admissible candidate (damage held), can a re-typing move the
 *     gold, the hired burn or the dragon coins of a march? Measured by re-running the search with rates that
 *     make any such move dominate the score (a saving, then a rise).
 *  3. **The owner's rating on every stop** (owner, 2026-09-23: *"benchmark between steps and rank with the
 *     rating function"*): `rate(shipped, re-typed, CAMPAIGN.markerRates)` on the four-march campaign bill —
 *     better / equal / worse, and the worst.
 *  4. **Time**: the engine's pass per army.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/159-the-engine-retype.test.ts`
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill, MarkerRates } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { EXHAUSTIVE, marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { OUT_DIR, Report, n } from './harness';
import { retype } from './silver-aware';

const RATES: MarkerRates = CAMPAIGN.markerRates;
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const keyOf = (m: Record<string, number>): string => JSON.stringify(Object.entries(m).sort());
const same = (a: Record<string, number>, b: Record<string, number>): boolean => {
  const ids = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const id of ids) if ((a[id] ?? 0) !== (b[id] ?? 0)) return false;
  return true;
};
const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});
const sameCampaign = (a: Campaign, b: Campaign): boolean =>
  a.damage === b.damage &&
  a.silver === b.silver &&
  a.gold === b.gold &&
  a.burned === b.burned &&
  a.dragonCoins === b.dragonCoins &&
  a.seconds === b.seconds;
/** Rates under which any gold / hired / coin move dominates the score (`sign` 1: a saving; −1: a rise). */
const probe = (sign: 1 | -1): MarkerRates => ({
  silver: Infinity,
  seconds: Infinity,
  gold: sign * 1e-9,
  hired: sign * 1e-9,
  dragonCoins: sign * 1e-9,
});

describe.skipIf(!process.env.THEORY)('the engine retype against 157-rated', () => {
  it('reproduces 157-rated, reads the markers it left out, and rates every stop', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    // `SUFFIX=…` names the report after the tree it ran on (the bar moves with `plan.ts`).
    const report = new Report(`159-the-engine-retype${process.env.SUFFIX ? `-${process.env.SUFFIX}` : ''}`);
    report.add('# 159 — the engine’s `retypeMarch` against 157-rated\n');
    report.add(
      'Every march of every stop on the bar as shipped, re-typed twice: by the tool (`silver-aware.ts`, ' +
        '`rated` — damage, silver and queue scored) and by the engine (`src/engine/retype.ts` — `rate()` on the ' +
        'whole march bill). Four-march campaigns, the bar as `planCampaign` builds it today.\n',
    );
    const perArmy: string[] = [
      '| use case | stops | marches | tool = engine (marches) | stops equal to the unit | engine pass | tool pass | gold / hired / coins movable (candidates) | rating better / equal / worse | worst |\n' +
        '|---|---:|---:|---:|---:|---:|---:|---|---|---:|',
    ];
    const stopRows: string[] = [];
    const mismatches: string[] = [];
    const all = {
      stops: 0,
      stopsEqual: 0,
      marches: 0,
      marchesEqual: 0,
      better: 0,
      equal: 0,
      worse: 0,
      worst: Infinity,
      worstAt: '',
      movable: 0,
      probed: 0,
      retyped: 0,
      climbed: 0,
      beyond: 0,
    };
    let slowest = { label: '', ms: 0 };

    for (const scenario of scenarios) {
      const request: StackRequest = scenario.request;
      let plan;
      try {
        plan = planCampaign({
          request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }
      if (plan.alternatives.length === 0) continue;
      const stops = plan.alternatives.map((stop) => ({ stop, marches: marchesOf(stop as PlanTotals) }));

      // The engine's pass, timed, cached by march as 157 cached.
      const engineCache = new Map<string, Record<string, number>>();
      const t0 = performance.now();
      const engineNext = stops.map(({ marches }) =>
        marches.map((m) => {
          const key = keyOf(m);
          const hit = engineCache.get(key);
          if (hit) return hit;
          const r = retypeMarch(request, m, RATES);
          const out = r ? r.counts : m;
          if (r && !r.exhaustive) all.climbed += 1;
          engineCache.set(key, out);
          return out;
        }),
      );
      const engineMs = performance.now() - t0;
      // The tool's pass, the same way.
      const toolCache = new Map<string, Record<string, number>>();
      const t1 = performance.now();
      const toolNext = stops.map(({ marches }) =>
        marches.map((m) => {
          const key = keyOf(m);
          const hit = toolCache.get(key);
          if (hit) return hit;
          const r = retype(request, m, 'rated');
          const out = r ? r.counts : m;
          toolCache.set(key, out);
          return out;
        }),
      );
      const toolMs = performance.now() - t1;
      if (engineMs > slowest.ms) slowest = { label: scenario.label, ms: engineMs };

      // The markers 157 left out: can any admissible re-typing of a march move gold, hired or coins?
      let movable = 0;
      for (const [key] of engineCache) {
        const m = Object.fromEntries(JSON.parse(key) as [string, number][]);
        const base = marchBill(request, m);
        // Is this march past the exhaustive walk (the probe then reads the climb's neighbourhood only)?
        const lead = request.units.filter((u) => u.pool === 'leadership');
        const k = lead.filter((u) => (m[u.id] ?? 0) > 0).length;
        let perms = 1;
        for (let i = 0; i < k; i += 1) perms *= lead.length - i;
        if (perms > EXHAUSTIVE) all.beyond += 1;
        for (const sign of [1, -1] as const) {
          const r = retypeMarch(request, m, probe(sign));
          if (!r) continue;
          const b = marchBill(request, r.counts);
          if (b.gold !== base.gold || b.hired !== base.hired || b.dragonCoins !== base.dragonCoins) {
            movable += 1;
            mismatches.push(
              `${scenario.label.slice(0, 40)}: a march's gold ${n(base.gold ?? 0)} → ${n(b.gold ?? 0)}, ` +
                `hired ${n(base.hired ?? 0)} → ${n(b.hired ?? 0)}, coins ${n(base.dragonCoins ?? 0)} → ${n(b.dragonCoins ?? 0)}`,
            );
            break;
          }
        }
        all.probed += 1;
      }
      all.movable += movable;

      let marchesEqual = 0;
      let marchCount = 0;
      let stopsEqual = 0;
      let better = 0;
      let equal = 0;
      let worse = 0;
      let worst = Infinity;
      stops.forEach(({ stop, marches }, s) => {
        const eng = engineNext[s] ?? [];
        const tool = toolNext[s] ?? [];
        marches.forEach((_, i) => {
          marchCount += 1;
          if (same(eng[i] ?? {}, tool[i] ?? {})) marchesEqual += 1;
        });
        const a = campaignOf(request, stop.pick, 'plan', marches);
        const bEng = campaignOf(request, stop.pick, 'plan', eng);
        const bTool = campaignOf(request, stop.pick, 'plan', tool);
        if (sameCampaign(bEng, bTool)) stopsEqual += 1;
        else
          mismatches.push(
            `${scenario.label.slice(0, 40)} ${SHORT[stop.pick] ?? stop.pick}: engine ${n(bEng.damage)} / ${n(bEng.silver)} / ${n(bEng.seconds)} s against tool ${n(bTool.damage)} / ${n(bTool.silver)} / ${n(bTool.seconds)} s`,
          );
        const r = rate(billOf(a), billOf(bEng), RATES);
        if (r > 1e-9) better += 1;
        else if (r < -1e-9) worse += 1;
        else equal += 1;
        if (r < worst) worst = r;
        if (r < all.worst) {
          all.worst = r;
          all.worstAt = `${scenario.label.slice(0, 40)} ${SHORT[stop.pick] ?? stop.pick}`;
        }
        const changed = eng.some((m, i) => m !== marches[i]);
        if (changed) {
          all.retyped += 1;
          const first = eng[0] ?? {};
          const troopsOf = (m: Record<string, number>): string =>
            Object.entries(m)
              .filter(([id, c]) => c > 0 && request.units.find((u) => u.id === id)?.pool === 'leadership')
              .map(([id, c]) => `${id} ${n(c)}`)
              .join(', ');
          // 157's own row format, character for character, so the two reports can be compared line by line.
          stopRows.push(
            `| ${scenario.label.slice(0, 34)} | ${SHORT[stop.pick] ?? stop.pick} | ${troopsOf(marches[0] ?? {})} | ${troopsOf(first)} | ` +
              `${n(Math.round(a.damage))} → ${n(Math.round(bEng.damage))} | ${n(Math.round(a.silver))} → ${n(Math.round(bEng.silver))} | ` +
              `${(a.damage / a.silver).toFixed(3)} → ${(bEng.damage / bEng.silver).toFixed(3)} | ${n(Math.round(a.seconds / 3600))} h → ${n(Math.round(bEng.seconds / 3600))} h |`,
          );
        }
      });
      all.stops += stops.length;
      all.stopsEqual += stopsEqual;
      all.marches += marchCount;
      all.marchesEqual += marchesEqual;
      all.better += better;
      all.equal += equal;
      all.worse += worse;
      perArmy.push(
        `| ${scenario.label.slice(0, 40)} | ${String(stops.length)} | ${String(marchCount)} | ${String(marchesEqual)} of ${String(marchCount)} | ` +
          `${String(stopsEqual)} of ${String(stops.length)} | ${(engineMs / 1000).toFixed(2)} s | ${(toolMs / 1000).toFixed(2)} s | ` +
          `${String(movable)} of ${String(engineCache.size)} marches | ${String(better)} / ${String(equal)} / ${String(worse)} | ${worst.toFixed(2)} |`,
      );
    }

    // The re-typed-stop rows against 157-rated's, as printed.
    let recorded: string[];
    try {
      const text = readFileSync(new URL('157-a-silver-aware-ladder-rated.md', OUT_DIR), 'utf8');
      const section = text.split('## Every re-typed stop')[1] ?? '';
      recorded = section
        .split('\n')
        .filter((line) => line.startsWith('| ') && !line.startsWith('| use case'));
    } catch {
      recorded = [];
    }
    const mine = new Set(stopRows);
    const theirs = new Set(recorded);
    const onlyRecorded = recorded.filter((line) => !mine.has(line));
    const onlyEngine = stopRows.filter((line) => !theirs.has(line));

    report.add('## Every use case\n');
    report.add(perArmy.join('\n'));
    report.add(
      `\n\n**Reproduction.** The engine picks the tool’s counts on **${String(all.marchesEqual)} of ${String(all.marches)}** marches; ` +
        `**${String(all.stopsEqual)} of ${String(all.stops)}** stops are the same campaign to the unit (damage, silver, gold, hired, coins, queue). ` +
        `Re-typed stops: **${String(all.retyped)} of ${String(all.stops)}**. Against the rows 157-rated printed ` +
        `(\`out/157-a-silver-aware-ladder-rated.md\`, ${String(recorded.length)} rows): **${String(recorded.length - onlyRecorded.length)}** printed identically; ` +
        `${String(onlyRecorded.length)} only in 157, ${String(onlyEngine.length)} only here.\n`,
    );
    report.add(
      `**The markers 157 left out.** Over every admissible candidate of every distinct march (${String(all.probed)} marches), ` +
        `a re-typing that moves gold, the hired burn or dragon coins exists on **${String(all.movable)}**. ` +
        `Marches past the exhaustive walk (${n(EXHAUSTIVE)} assignments), where the probe reads the climb only: ${String(all.beyond)}; ` +
        `re-typings found by the climb: ${String(all.climbed)}.\n`,
    );
    report.add(
      `**The owner’s rating on every stop** (\`rate(shipped, re-typed, CAMPAIGN.markerRates)\` on the four-march campaign bill): ` +
        `**${String(all.better)} better, ${String(all.equal)} equal, ${String(all.worse)} worse** of ${String(all.stops)}; the worst is ` +
        `**${all.worst.toFixed(2)}** (${all.worstAt}).\n`,
    );
    report.add(
      `**Time.** The slowest engine pass: **${(slowest.ms / 1000).toFixed(2)} s** (${slowest.label}).\n`,
    );
    if (mismatches.length > 0)
      report.add(`## Mismatches and moves\n\n${mismatches.map((m) => `- ${m}`).join('\n')}\n`);
    if (onlyRecorded.length + onlyEngine.length > 0)
      report.add(
        '## Rows that differ from 157-rated\n\n' +
          onlyRecorded.map((l) => `- 157: ${l}`).join('\n') +
          '\n' +
          onlyEngine.map((l) => `- 159: ${l}`).join('\n') +
          '\n',
      );
    report.save();
  }, 7_200_000);
});
