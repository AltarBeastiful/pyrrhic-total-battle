/**
 * 202 — **screen with As is, then read the survivors with Tight** (`docs/plans/screen-then-tight.md`, owner,
 * 2026-10-11): the advisor prices every stop of every probe's bar by Tight (49 % of the pool's CPU in the owner's
 * trace). If a probe's worth on the As-is reading (the plan's counts battled untouched) ranks the probes as the
 * Tight reading does, the pass can screen on As is and spend Tight on the few probes that matter.
 *
 * Every army (the owner's account, if present, the owner scenarios and the common ones) runs the generic probes
 * twice through `runAdvisor` on one inline lane, no clock: once at `reading: 'tight'`, once at `'as-is'`. Per
 * army and per stop kind it compares the gains (rank correlation, the biggest gap) and prices candidate
 * survivor rules against the Tight answer: a rule's recall (of the Tight top 5 and of every Tight gain above
 * `WORTH` %), and the share of the Tight reading it would still have to pay for.
 *
 * Writes `tools/theorycraft/out/202-screen-then-tight.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/202-screen-then-tight.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { AdvisorRow } from '../../src/engine/advisor';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { runAdvisor } from '../../src/worker/advisor';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report } from './harness';

const ACCOUNT = process.env.PLANNER_ACCOUNT ?? 'pyrrhic-my-account-2026-10-07.json';
const NO_CLOCK = 3_600_000;
/** A gain (rating points, ≈ % damage) below this is noise to a player. */
const WORTH = 0.25;

const lane = (): CalcClient => ({ ...createInlineClient(), mode: 'worker' });
const cpuMs = (usage: NodeJS.CpuUsage): number => (usage.user + usage.system) / 1000;
const f = (value: number, digits = 2): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const gainAt = (row: AdvisorRow, pick: string): number => row.stops.find((s) => s.pick === pick)?.gain ?? 0;
const bestGain = (row: AdvisorRow): number => Math.max(0, ...row.stops.map((s) => s.gain));

function ranks(values: number[]): number[] {
  const order = values.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(values.length).fill(0);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1]![0] === order[i]![0]) j += 1;
    for (let k = i; k <= j; k += 1) out[order[k]![1]] = (i + j) / 2;
    i = j + 1;
  }
  return out;
}
function spearman(a: number[], b: number[]): number {
  if (a.length < 3) return NaN;
  const ra = ranks(a);
  const rb = ranks(b);
  const mean = (ra.length - 1) / 2;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < ra.length; i += 1) {
    num += (ra[i]! - mean) * (rb[i]! - mean);
    da += (ra[i]! - mean) ** 2;
    db += (rb[i]! - mean) ** 2;
  }
  return da === 0 || db === 0 ? NaN : num / Math.sqrt(da * db);
}

interface Rule {
  name: string;
  /** The probe ids kept, given the as-is rows. */
  keep: (asIs: AdvisorRow[]) => Set<string>;
}
const RULES: Rule[] = [
  ...[3, 5, 8, 12].map((k): Rule => ({
    name: `top ${k}`,
    keep: (rows) =>
      new Set(
        [...rows]
          .sort((a, b) => bestGain(b) - bestGain(a))
          .slice(0, k)
          .map((r) => r.id),
      ),
  })),
  ...[0.25, 0.5].map((share): Rule => ({
    name: `gain ≥ ${share} × best`,
    keep: (rows) => {
      const top = Math.max(0, ...rows.map(bestGain));
      return new Set(rows.filter((r) => bestGain(r) >= share * top && bestGain(r) > 0).map((r) => r.id));
    },
  })),
  {
    name: 'gain > 0 (any)',
    keep: (rows) => new Set(rows.filter((r) => bestGain(r) > 0).map((r) => r.id)),
  },
  {
    name: 'top 5 ∪ gain ≥ 0.25 × best',
    keep: (rows) => {
      const top = Math.max(0, ...rows.map(bestGain));
      const five = [...rows].sort((a, b) => bestGain(b) - bestGain(a)).slice(0, 5);
      return new Set([
        ...five.map((r) => r.id),
        ...rows.filter((r) => bestGain(r) >= 0.25 * top && bestGain(r) > 0).map((r) => r.id),
      ]);
    },
  },
];

interface Army {
  label: string;
  input: CampaignInput;
}

function armies(): Army[] {
  const out: Army[] = [];
  if (existsSync(ACCOUNT)) {
    const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
    if (parsed.kind === 'profile') {
      const setup = parsed.payload.setups.find((one) => one.id === parsed.payload.activeSetupId);
      if (setup !== undefined)
        out.push({ label: `account ${ACCOUNT}`, input: buildPlanRequest(parsed.payload, setup) });
    }
  }
  const profile = ownerProfile();
  const scenarios = [...(profile ? ownerScenarios(profile) : []), ...commonScenarios()];
  const only = process.env.ONLY202;
  for (const s of scenarios) {
    if (only !== undefined && !s.label.includes(only)) continue;
    out.push({
      label: s.label,
      input: { request: s.request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack },
    });
  }
  return out;
}

async function pass(input: CampaignInput, reading: 'tight' | 'as-is') {
  const pool = createCalcPool({ size: 1, createClient: lane });
  const cpu = process.cpuUsage();
  const began = performance.now();
  try {
    const result = await runAdvisor(input, genericProbes(), pool, { budgetMs: NO_CLOCK, reading });
    return { result, wall: performance.now() - began, cpu: cpuMs(process.cpuUsage(cpu)) };
  } finally {
    pool.dispose();
  }
}

describe.skipIf(!process.env.THEORY)('202 — screen with As is, then Tight', () => {
  it(
    'compares the As-is and Tight readings of the generic probes',
    async () => {
      const report = new Report('202-screen-then-tight');
      report.add(`# 202 — screen with As is, then read the survivors with Tight\n`);
      report.add(
        `Generic probes on one inline lane, no clock. Worth = a gain of at least ${WORTH} (rating points ≈ % damage). Gains are the rows' best stop gain unless a pick is named.\n`,
      );
      const per: string[] = [
        '| army | probes | wall tight (ms) | wall as-is (ms) | as-is / tight | ρ best gain | ρ sweet-spot | worthy (tight) | top-gain gap |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|',
      ];
      const pooled = RULES.map(() => ({
        worthy: 0,
        hit: 0,
        top5: 0,
        top5Hit: 0,
        kept: 0,
        total: 0,
        lostGain: 0,
        allGain: 0,
        topMiss: 0,
        armies: 0,
      }));
      const gaps: number[] = [];
      let wallT = 0;
      let wallA = 0;
      for (const army of armies()) {
        const tight = await pass(army.input, 'tight');
        const asIs = await pass(army.input, 'as-is');
        const t = tight.result.rows;
        const a = asIs.result.rows;
        if (t.length === 0 || t.length !== a.length) {
          per.push(`| ${army.label} | — | refused or cut | | | | | | |`);
          continue;
        }
        const byId = new Map(a.map((r) => [r.id, r]));
        const pairs = t.map((r) => [r, byId.get(r.id)!] as const);
        const bt = pairs.map(([x]) => bestGain(x));
        const ba = pairs.map(([, y]) => bestGain(y));
        const st = pairs.map(([x]) => gainAt(x, 'sweet-spot'));
        const sa = pairs.map(([, y]) => gainAt(y, 'sweet-spot'));
        const topT = Math.max(...bt);
        const gap = Math.max(
          ...pairs.flatMap(([x, y]) => x.stops.map((s, i) => Math.abs(s.gain - (y.stops[i]?.gain ?? 0)))),
        );
        gaps.push(gap);
        wallT += tight.wall;
        wallA += asIs.wall;
        const worthy = bt.filter((g) => g >= WORTH).length;
        per.push(
          `| ${army.label} | ${t.length} | ${f(tight.wall, 0)} | ${f(asIs.wall, 0)} | ${f(asIs.wall / tight.wall, 2)} | ${f(spearman(bt, ba), 2)} | ${f(spearman(st, sa), 2)} | ${worthy} | ${f(gap, 2)} |`,
        );
        RULES.forEach((rule, i) => {
          const kept = rule.keep(a);
          const p = pooled[i]!;
          p.armies += 1;
          p.total += t.length;
          p.kept += kept.size;
          const topIds = [...t]
            .sort((x, y) => bestGain(y) - bestGain(x))
            .slice(0, 5)
            .map((r) => r.id);
          for (const id of topIds) {
            p.top5 += 1;
            if (kept.has(id)) p.top5Hit += 1;
          }
          for (const r of t) {
            if (bestGain(r) >= WORTH) {
              p.worthy += 1;
              if (kept.has(r.id)) p.hit += 1;
              else p.lostGain += bestGain(r);
            }
            p.allGain += bestGain(r);
          }
          const top = [...t].sort((x, y) => bestGain(y) - bestGain(x))[0];
          if (top !== undefined && bestGain(top) >= WORTH && !kept.has(top.id)) p.topMiss += 1;
        });
        void topT;
        console.log(
          `202 done: ${army.label} rho=${f(spearman(bt, ba), 2)} tight ${f(tight.wall, 0)} ms as-is ${f(asIs.wall, 0)} ms worthy ${worthy}`,
        );
      }
      report.h('Per army');
      report.add(per.join('\n'));
      report.h('Survivor rules against the Tight answer (pooled over the armies)');
      report.add(
        '| rule | probes kept / read | Tight top 5 kept | worthy kept | gain missed | best probe missed in |',
      );
      report.add('|---|---:|---:|---:|---:|---:|');
      RULES.forEach((rule, i) => {
        const p = pooled[i]!;
        report.add(
          `| ${rule.name} | ${p.kept} / ${p.total} (${f((100 * p.kept) / Math.max(1, p.total), 0)} %) | ${p.top5Hit} / ${p.top5} | ${p.hit} / ${p.worthy} | ${f((100 * p.lostGain) / Math.max(1e-9, p.allGain), 1)} % | ${p.topMiss} / ${p.armies} armies |`,
        );
      });
      report.add(
        `\nTotal wall: Tight ${f(wallT, 0)} ms, As is ${f(wallA, 0)} ms (${f(wallA / Math.max(1, wallT), 2)}×). Largest per-stop gain gap anywhere: ${f(Math.max(0, ...gaps), 2)}.`,
      );
      report.save();
      expect(gaps.length).toBeGreaterThan(0);
    },
    24 * 3_600_000,
  );
});
