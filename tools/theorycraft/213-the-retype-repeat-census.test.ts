/**
 * 213 — **the re-typing repeat census** (W22, `docs/plans/next-speed.md` §"Next candidates"): per plan, how often each
 * re-typing pass — `retypeOne`, `retypeRow` / `retypeRowNow`, `retypeMarch`, and the `retypeWalk` / `retypeClimb`
 * kernel doors — is handed an input it has already seen in the same plan, and the summed ms a memo of that input would
 * recover. Needs the census patch on `src/engine/retype.ts` and `src/engine/plan.ts`
 * (`docs/research/patches/213-retype-repeat-census.patch`; `git apply` it; it fills `globalThis.__retype213`). Timing
 * fixture as 206/211. Writes `tools/theorycraft/out/213-the-retype-repeat-census.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/213-the-retype-repeat-census.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planCampaign, type CampaignInput } from '../../src/engine';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';

const OUT = 'tools/theorycraft/out/213-the-retype-repeat-census.md';
const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const PLANS = Number(process.env.RETYPE_PLANS ?? 3);

/** One recorded call: its input signature, its ms, and level-specific tallies. */
interface Rec {
  key: string;
  ckey?: string;
  ms: number;
  hit?: boolean;
  ok?: boolean;
  played?: number;
  changed?: number;
  findHits?: number;
  findMisses?: number;
}
interface Census {
  one: Rec[];
  rowNow: Rec[];
  row: Rec[];
  march: Rec[];
  walk: Rec[];
  climb: Rec[];
}

const f = (value: number, digits = 0): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

function probeSettings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const settings = { ...buildPlanRequest(profile, setup) };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

const fresh = (): Census => ({ one: [], rowNow: [], row: [], march: [], walk: [], climb: [] });
const store = globalThis as unknown as { __retype213?: Census | undefined };

/** Calls, distinct inputs, repeats, total ms, and the ms inside the repeated calls, for one plan's records. */
interface Stats {
  total: number;
  distinct: number;
  repeats: number;
  ms: number;
  repeatMs: number;
}
function stats(records: Rec[], keyOf: (r: Rec) => string = (r) => r.key): Stats {
  const seen = new Set<string>();
  let repeats = 0;
  let ms = 0;
  let repeatMs = 0;
  for (const r of records) {
    ms += r.ms;
    const k = keyOf(r);
    if (seen.has(k)) {
      repeats += 1;
      repeatMs += r.ms;
    } else seen.add(k);
  }
  return { total: records.length, distinct: seen.size, repeats, ms, repeatMs };
}

const mean = (xs: number[]): number => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
const median = (xs: number[]): number => {
  const sorted = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('213 — the re-typing repeat census', () => {
  it(
    'counts repeated re-typing inputs',
    () => {
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('the timing fixture is not a profile');
      const input = probeSettings(parsed.payload);

      // The answer with the census off; every census-on plan below must reproduce it.
      store.__retype213 = undefined;
      const plain = planCampaign(input);
      const plainAnswer = JSON.stringify(plain.alternatives.map((r) => r.counts));

      // One warm-up with the census on, then PLANS measured plans, each with the recorder reset.
      store.__retype213 = fresh();
      planCampaign(input);

      const walls: number[] = [];
      const perPlan: Census[] = [];
      for (let i = 0; i < PLANS; i += 1) {
        const snap = fresh();
        store.__retype213 = snap;
        const t0 = performance.now();
        const plan = planCampaign(input);
        walls.push(performance.now() - t0);
        if (JSON.stringify(plan.alternatives.map((r) => r.counts)) !== plainAnswer)
          throw new Error('the census changed the answer');
        perPlan.push(snap);
      }
      const wall = median(walls);

      const level = (pick: (c: Census) => Rec[]): { perPlan: Stats[]; avg: Stats } => {
        const ps = perPlan.map((c) => stats(pick(c)));
        const avg: Stats = {
          total: mean(ps.map((s) => s.total)),
          distinct: mean(ps.map((s) => s.distinct)),
          repeats: mean(ps.map((s) => s.repeats)),
          ms: mean(ps.map((s) => s.ms)),
          repeatMs: mean(ps.map((s) => s.repeatMs)),
        };
        return { perPlan: ps, avg };
      };

      const one = level((c) => c.one);
      const rowNow = level((c) => c.rowNow);
      const row = level((c) => c.row);
      const march = level((c) => c.march);
      const walk = level((c) => c.walk);
      const climb = level((c) => c.climb);
      // The walk keyed on `(slots, hired, guard)` alone (base dropped) too, in case the finer key hides a collision.
      const walkCore = level((c) => c.walk.map((r) => ({ ...r, key: r.ckey ?? r.key })));

      const rowLine = (name: string, av: Stats): string =>
        `| ${name} | ${f(av.total, 1)} | ${f(av.distinct, 1)} | ${f(av.repeats, 1)} | ${av.total > 0 ? f((100 * av.repeats) / av.total, 1) : '0.0'} % | ${f(av.ms, 1)} | ${f(av.repeatMs, 2)} | ${f((100 * av.ms) / wall, 1)} % |`;

      // Cross-checks: retypeOne's own cache hits, and retypeRowNow's intra-call `moved.find`.
      const engineHits = mean(perPlan.map((c) => c.one.filter((r) => r.hit === true).length));
      const findHits = mean(perPlan.map((c) => c.rowNow.reduce((a, r) => a + (r.findHits ?? 0), 0)));
      const findMisses = mean(perPlan.map((c) => c.rowNow.reduce((a, r) => a + (r.findMisses ?? 0), 0)));
      const played = mean(perPlan.map((c) => c.rowNow.reduce((a, r) => a + (r.played ?? 0), 0)));
      const rowNowWithChanged = mean(perPlan.map((c) => c.rowNow.filter((r) => (r.changed ?? 0) > 0).length));
      const walkOk = mean(perPlan.map((c) => c.walk.filter((r) => r.ok === true).length));
      const climbOk = mean(perPlan.map((c) => c.climb.filter((r) => r.ok === true).length));

      const wallCeiling = walk.avg.repeatMs;
      const marchCeiling = march.avg.repeatMs;
      const lines = [
        '# 213 — the re-typing repeat census\n',
        `W22, \`docs/plans/next-speed.md\` §"Next candidates". Run ${new Date().toISOString().slice(0, 10)}: \`planCampaign\` in-process, probes' settings, release kernel, fixture \`${ACCOUNT}\`, ${String(PLANS)} plans (after a warm-up). Planner wall **${f(wall)} ms per plan** (median; runs ${walls.map((w) => f(w)).join(', ')}). "Repeat" = an input signature already seen **within the same plan**; **ms in repeats** is the summed ms of those repeated calls — the ceiling a memo of that level would recover. Times summed per plan.\n`,
        '| Level | Calls/plan | Distinct/plan | Repeats/plan | Repeat rate | Total ms/plan | Ms in repeats/plan | Share of planner |',
        '|---|---:|---:|---:|---:|---:|---:|---:|',
        rowLine('`retypeOne`', one.avg),
        rowLine('`retypeRow`', row.avg),
        rowLine('`retypeRowNow`', rowNow.avg),
        rowLine('`retypeMarch`', march.avg),
        rowLine('`retypeWalk` door', walk.avg),
        rowLine('`retypeClimb` door', climb.avg),
        '',
        `**\`retypeOne\`'s own cache.** Of its ${f(one.avg.total, 1)} calls a plan, ${f(engineHits, 1)} returned from \`retypeCache\` (a hit on the engine's own \`JSON.stringify(Object.entries(counts).sort())\` key); the rest reached \`retypeMarch\`. Its repeats above (${f(one.avg.repeats, 1)} a plan) cost ${f(one.avg.repeatMs, 2)} ms in total — the memo already exists.\n`,
        `**\`retypeRowNow\`'s intra-call cache.** It re-types ${f(played, 1)} marches a plan across ${f(rowNow.avg.total, 1)} row calls (${f(rowNowWithChanged, 1)} of the rows moved a march). \`moved.find((march) => march.counts === counts)\` hit ${f(findHits, 1)} times and missed ${f(findMisses, 1)} a plan.\n`,
        `**\`retypeMarch\`.** ${f(march.avg.total, 1)} calls a plan (one per \`retypeOne\` cache miss), ${f(march.avg.repeats, 1)} of them repeats — the signature is canonical counts + \`silverCeiling\` + \`holdDamagePerSilver\` + \`secondsCeiling\` + \`tierCandidate\` + \`deadline === Infinity\`. Its repeats cost ${f(march.avg.repeatMs, 2)} ms a plan.\n`,
        `**The doors.** \`retypeWalk\` is called ${f(walk.avg.total, 1)} times a plan (${f(walk.avg.distinct, 1)} distinct on \`slots + hired + base + guard\`; ${f(walkCore.avg.distinct, 1)} distinct on \`slots + hired + guard\` alone), and ${f(walkOk, 1)} of those calls returned a result (the door accepted the whole walk); one walk costs ${f(walk.avg.total > 0 ? walk.avg.ms / walk.avg.total : 0, 1)} ms and the door's ${f(walk.avg.ms, 2)} ms/plan is ${f(walk.avg.total > 0 ? (100 * walk.avg.ms) / wall : 0, 1)} % of the planner. \`retypeClimb\` is called ${f(climb.avg.total, 1)} times (${f(climb.avg.distinct, 1)} distinct), ${f(climbOk, 1)} accepted — the rest fell back to the JS reference climb — at ${f(climb.avg.total > 0 ? climb.avg.ms / climb.avg.total : 0, 2)} ms a call, ${f(climb.avg.ms, 2)} ms/plan.\n`,
        '## Verdict',
        '',
        `The re-typing walk repeats an input ${f(walk.avg.total > 0 ? (100 * walk.avg.repeats) / walk.avg.total : 0, 1)} % of the time on the finer key (\`slots + hired + base + guard\`) and ${f(walkCore.avg.total > 0 ? (100 * walkCore.avg.repeats) / walkCore.avg.total : 0, 1)} % on \`slots + hired + guard\` alone. A memo of the walk would recover **${f(wallCeiling, 2)} ms per plan (${f((100 * wallCeiling) / wall, 2)} % of the ${f(wall)} ms planner wall)**; a memo of the whole \`retypeMarch\` would recover ${f(marchCeiling, 2)} ms per plan (${f((100 * marchCeiling) / wall, 2)} %). ${wallCeiling < 1 ? 'That is not enough to pay for another kernel door.' : 'That is worth a door.'}`,
        '',
      ];
      const out = lines.join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
      // eslint-disable-next-line no-console -- the answer the census must leave untouched
      console.log('answer:', plainAnswer);
      expect(one.avg.total).toBeGreaterThan(0);
      expect(walk.avg.total + climb.avg.total).toBeGreaterThan(0);
    },
    30 * 60_000,
  );
});
