/**
 * 246 — **the captain upgrade worth list** (`docs/plans/captain-upgrade-worth.md`, experiments A and B).
 *
 * **A — does tier 1 miss a worthwhile upgrade?** For each case, every captain the table has that the account does
 * not field is added at level 1, star 0; tier 1 reads every probe (levels +5/+10/+15, every remaining star, alone and
 * cumulative) and every probe is then regenerated in full (tier 2, no top-N cut). A *miss* at K is a probe tier 1
 * ranks outside its top K whose full gain is at least 90 % of the best full gain. Recall at K is the share of the
 * worthwhile probes (full gain ≥ 90 % of the best) that tier 1's top K holds. Target: no miss at K = 8.
 *
 * **B — do +5/+10/+15 with inference rank like exhaustive probing?** The same cases, every level step +1…+15 read
 * by tier 1, against the gains built from the three probes and the per-level inference. Per step, the captains are
 * ranked by gain; the report says whether the order and the top K agree.
 *
 * Cases: the owner's accounts on disk (the 2026-09-17 live camp with three captains, Aydae alone, the 2026-09-24
 * browser account, and the 2026-10-07 account when the file is present).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/246-the-captain-worth.test.ts`
 * Writes `tools/theorycraft/out/246-the-captain-worth.md` (and `.json` with the raw rows).
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { captains as captainTable } from '../../src/data';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { inferLevelGain } from '../../src/engine/captainUpgrades';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { captainWorthCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest } from '../../src/state/derive';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runUpgradeWorth, type WorthAsk, type WorthResult } from '../../src/worker/captainUpgrades';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { loadLiveAccount } from './harness';

const OUT = 'tools/theorycraft/out/246-the-captain-worth';
/** A pass clock no run reaches: nothing is cut, so the figures are the engine's own. */
const NO_CLOCK = 1_000_000_000;
const KS = [3, 5, 8] as const;
const EXPORT_0917 = 'tests/fixtures/pyrrhic-my-account-2026-09-17.json';
const BROWSER_0924 = 'tests/fixtures/owner-browser-2026-09-24.json';
const ACCOUNT_1007 = 'pyrrhic-my-account-2026-10-07.json';

interface Case {
  label: string;
  profile: Profile;
  setup: BattleSetup;
}

function fromFile(file: string): { profile: Profile; setup: BattleSetup } | null {
  if (!existsSync(file)) return null;
  let parsed: ReturnType<typeof parseImport>;
  try {
    parsed = parseImport(readFileSync(file, 'utf8'));
  } catch (error) {
    // A fixture older than the schema (no `savedStacks`): the case is left out, and the report says so.
    console.warn(
      `246: ${file} does not parse (${error instanceof Error ? error.message.slice(0, 80) : 'error'})`,
    );
    return null;
  }
  if (parsed.kind !== 'profile') return null;
  const profile = structuredClone(parsed.payload) as Profile;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  return setup === undefined ? null : { profile, setup };
}

/** Every table captain the account does not hold, added at level 1, star 0 (and benched). */
function withEveryCaptain(profile: Profile): Profile {
  const held = new Set(profile.sources.captains.filter((entry) => entry.level >= 1).map((e) => e.captainId));
  const next = structuredClone(profile);
  // A level-0 entry (an unowned captain the account lists) is raised in place to level 1.
  for (const entry of next.sources.captains) if (entry.level < 1) entry.level = 1;
  for (const record of captainTable)
    if (!next.sources.captains.some((entry) => entry.captainId === record.id) && !held.has(record.id))
      next.sources.captains.push({ id: `added-${record.id}`, captainId: record.id, level: 1, star: 0 });
  return next;
}

function cases(): Case[] {
  const out: Case[] = [];
  const live = loadLiveAccount();
  const entryIds = live.profile.sources.captains.map((entry) => entry.id);
  out.push({
    label: 'live camp 2026-09-17 (Aydae 43★3, Alexander 36, Leonidas 41; 7 000 leadership)',
    profile: live.profile,
    setup: {
      ...live.setup,
      housing: { leadership: 7_000, authority: 2_180, dominance: 0 },
      active: { ...live.setup.active, captains: entryIds },
    },
  });
  const alone = fromFile(EXPORT_0917);
  if (alone !== null) out.push({ label: '2026-09-17 export, Aydae alone', ...alone });
  const browser = fromFile(BROWSER_0924);
  if (browser !== null) out.push({ label: 'owner browser 2026-09-24', ...browser });
  const latest = fromFile(ACCOUNT_1007);
  if (latest !== null) out.push({ label: 'owner account 2026-10-07', ...latest });
  return out.map((one) => ({ ...one, profile: withEveryCaptain(one.profile) }));
}

interface Read {
  asks: WorthAsk[];
  result: WorthResult;
}

/** Tier 1 on every probe, and tier 2 on all of them when `full`. */
async function read(one: Case, full: boolean): Promise<Read> {
  const pool = createCalcPool({
    size: 1,
    createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
  });
  try {
    const input = buildPlanRequest(one.profile, one.setup);
    const { currentKey, lineups, size } = captainLineups(one.profile, one.setup);
    const advice = await runCaptainAdvice(
      input,
      lineups.map(({ key, totals }) => ({ key, totals })),
      currentKey,
      pool,
      { budgetMs: NO_CLOCK },
    );
    expect(advice.cut).toEqual([]);
    const lead = leadLineup(advice.best, currentKey);
    const leadCandidate = lineups.find((trio) => trio.key === lead);
    const leadStops = advice.plans[lead];
    if (leadCandidate === undefined || leadStops === undefined) throw new Error('no lead lineup');
    const asks: WorthAsk[] = captainWorthCandidates(one.profile, one.setup, leadCandidate, size).map(
      (candidate) => ({
        id: candidate.spec.id,
        label: `${candidate.name} ${candidate.change}`,
        captainId: candidate.spec.captainId,
        kind: candidate.spec.kind,
        size: candidate.spec.size,
        perLevel: candidate.perLevel,
        exact: candidate.spec.exact === true,
        lineups: candidate.lineups.map(({ key, totals }) => ({ key, totals })),
      }),
    );
    const result = await runUpgradeWorth(
      input,
      { key: lead, totals: leadCandidate.totals, stops: leadStops },
      asks,
      pool,
      { budgetMs: NO_CLOCK, top: full ? asks.length : 0 },
    );
    expect(result.cut).toEqual([]);
    expect(result.failed).toEqual([]);
    return { asks, result };
  } finally {
    pool.dispose();
  }
}

const f = (value: number, digits = 3): string => value.toFixed(digits);

describe.skipIf(!process.env.THEORY)('246 — the captain worth list', () => {
  it('A: tier 1 against a full regeneration of every probe', async () => {
    const lines: string[] = [];
    const raw: unknown[] = [];
    let misses8 = 0;
    for (const one of cases()) {
      const began = performance.now();
      const { result } = await read(one, true);
      const seconds = (performance.now() - began) / 1000;
      const rows = result.rows.filter((row) => row.tier2 !== undefined);
      // Tier 1's order: gain, the asks' order on a tie (the order `rows` were read in).
      const order = new Map(
        [...result.rows]
          .map((row, at) => ({ row, at }))
          .sort((a, b) => b.row.tier1.gain - a.row.tier1.gain || a.at - b.at)
          .map(({ row }, rank) => [row.id, rank + 1]),
      );
      const best = Math.max(...rows.map((row) => row.tier2?.gain ?? 0));
      const worthwhile = rows.filter((row) => best > 0 && (row.tier2?.gain ?? 0) >= 0.9 * best);
      lines.push(
        `## ${one.label}`,
        '',
        `${String(rows.length)} probes, ${f(seconds, 0)} s; best full gain ${f(best)}; ${String(worthwhile.length)} worthwhile (≥ 90 % of it).`,
        '',
      );
      lines.push('| K | worthwhile in tier 1 top K | recall | misses (rank > K) |', '|---|---|---|---|');
      for (const k of KS) {
        const held = worthwhile.filter((row) => (order.get(row.id) ?? Infinity) <= k);
        const missed = worthwhile.filter((row) => (order.get(row.id) ?? Infinity) > k);
        if (k === CAMPAIGN.captainWorthTop) misses8 += missed.length;
        lines.push(
          `| ${String(k)} | ${String(held.length)} / ${String(worthwhile.length)} | ${worthwhile.length === 0 ? '—' : f(held.length / worthwhile.length, 2)} | ${missed.map((row) => `${row.label} (#${String(order.get(row.id))}, ${f(row.tier2?.gain ?? 0)})`).join('; ') || '—'} |`,
        );
      }
      lines.push('', '| tier 1 rank | upgrade | tier 1 | full |', '|---|---|---|---|');
      for (const row of [...rows]
        .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
        .slice(0, 15))
        lines.push(
          `| ${String(order.get(row.id))} | ${row.label} | ${f(row.tier1.gain)} | ${f(row.tier2?.gain ?? 0)} |`,
        );
      lines.push('');
      raw.push({
        label: one.label,
        rows: rows.map((row) => ({ id: row.id, tier1: row.tier1.gain, tier2: row.tier2?.gain })),
      });
    }
    lines.push(
      `**Misses at K = ${String(CAMPAIGN.captainWorthTop)} over all cases: ${String(misses8)}.**`,
      '',
    );
    writeFileSync(`${OUT}-A.md`, `# 246 A — tier 1 against full regeneration\n\n${lines.join('\n')}`);
    writeFileSync(`${OUT}-A.json`, JSON.stringify(raw));
    console.log(lines.join('\n'));
  }, 3_600_000);

  it('B: +5/+10/+15 with inference against exhaustive +1…+15', async () => {
    const lines: string[] = [];
    const all = Array.from({ length: 15 }, (_, at) => at + 1);
    const saved = CAMPAIGN.captainLevelProbes;
    for (const one of cases()) {
      (CAMPAIGN as { captainLevelProbes: readonly number[] }).captainLevelProbes = all;
      let exhaustive: Read;
      try {
        exhaustive = await read(one, false);
      } finally {
        (CAMPAIGN as { captainLevelProbes: readonly number[] }).captainLevelProbes = saved;
      }
      // captainId → level step → tier 1 gain, all exact.
      const exact = new Map<string, Map<number, number>>();
      const bonus = new Map<string, number>();
      for (const ask of exhaustive.asks) bonus.set(ask.captainId, ask.perLevel);
      for (const row of exhaustive.result.rows)
        if (row.kind === 'level') {
          const held = exact.get(row.captainId) ?? new Map<number, number>();
          held.set(row.size, row.tier1.gain);
          exact.set(row.captainId, held);
        }
      // The three probes' own gains, and the inference from them.
      const inferredFor = (captainId: string, n: number): number => {
        const gains = exact.get(captainId);
        if (gains === undefined) return 0;
        const perLevel = bonus.get(captainId) ?? 0;
        const probes = CAMPAIGN.captainLevelProbes
          .filter((p) => gains.has(Math.min(p, 15)))
          .map((p) => ({ levels: p, bonus: perLevel * p, gain: gains.get(p) ?? 0 }));
        return inferLevelGain(probes, { levels: n, bonus: perLevel * n });
      };
      lines.push(
        `## ${one.label}`,
        '',
        '| levels | order equal | top 3 | top 5 | top 8 | worst relative error |',
        '|---|---|---|---|---|---|',
      );
      const captainIds = [...exact.keys()].filter((id) => (exact.get(id)?.get(1) ?? 0) >= 0);
      let orderMisses = 0;
      for (const n of all) {
        const byExact = captainIds
          .map((id, at) => ({ id, at, gain: exact.get(id)?.get(n) ?? 0 }))
          .sort((a, b) => b.gain - a.gain || a.at - b.at);
        const byProbe = captainIds
          .map((id, at) => ({ id, at, gain: inferredFor(id, n) }))
          .sort((a, b) => b.gain - a.gain || a.at - b.at);
        const equal = byExact.every((entry, at) => entry.id === byProbe[at]?.id);
        if (!equal) orderMisses += 1;
        const top = (k: number): string =>
          new Set(byExact.slice(0, k).map((e) => e.id)).size ===
          new Set([...byExact.slice(0, k), ...byProbe.slice(0, k)].map((e) => e.id)).size
            ? 'same'
            : 'differs';
        const worst = Math.max(
          0,
          ...captainIds.map((id) => {
            const real = exact.get(id)?.get(n) ?? 0;
            return real > 1e-9 ? Math.abs(inferredFor(id, n) - real) / real : 0;
          }),
        );
        lines.push(
          `| +${String(n)} | ${equal ? 'yes' : 'no'} | ${top(3)} | ${top(5)} | ${top(8)} | ${f(worst, 3)} |`,
        );
      }
      lines.push('', `Steps where the order differs: ${String(orderMisses)} / 15.`, '');
    }
    writeFileSync(`${OUT}-B.md`, `# 246 B — inferred levels against exhaustive\n\n${lines.join('\n')}`);
    console.log(lines.join('\n'));
  }, 3_600_000);
});
