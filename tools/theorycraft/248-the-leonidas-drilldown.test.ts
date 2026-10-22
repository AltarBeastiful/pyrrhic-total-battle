/**
 * 248 — **Leonidas, drilled down** (`docs/plans/hero-report.md`). The hero report's 2026-10-07 account holds
 * Leonidas (level 41, star 0) on "hold" while the live camp makes his star the verdict. For every account file and
 * every battle profile (setup) that owns him: his worth rows (tier 1), their rank among every row, where he stands in
 * the lineup advice (best lineup per stop), and his solo and trio scores. Owned captains only.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/248-the-leonidas-drilldown.test.ts`
 * Writes `tools/theorycraft/out/248-the-leonidas-drilldown.md`.
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { leadLineup } from '../../src/engine/captainUpgrades';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { captainWorthCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest } from '../../src/state/derive';
import { heroRoster } from '../../src/state/heroRoster';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runUpgradeWorth } from '../../src/worker/captainUpgrades';
import { createInlineClient } from '../../src/worker/client';
import { runHeroReport } from '../../src/worker/heroReport';
import { createCalcPool } from '../../src/worker/pool';
import { loadLiveAccount } from './harness';

const OUT = 'tools/theorycraft/out/248-the-leonidas-drilldown.md';
const NO_CLOCK = 1_000_000_000;
const FILES = [
  'tests/fixtures/pyrrhic-my-account-2026-09-17.json',
  'pyrrhic-my-account-2026-10-07.json',
  'pyrrhic-my-account-2026-10-11.json',
];

interface Case {
  label: string;
  profile: Profile;
  setup: BattleSetup;
}

function cases(): Case[] {
  const out: Case[] = [];
  const live = loadLiveAccount();
  out.push({
    label: 'live camp 2026-09-17',
    profile: live.profile,
    setup: {
      ...live.setup,
      housing: { leadership: 7_000, authority: 2_180, dominance: 0 },
      active: { ...live.setup.active, captains: live.profile.sources.captains.map((entry) => entry.id) },
    },
  });
  for (const file of FILES) {
    if (!existsSync(file)) continue;
    try {
      const parsed = parseImport(readFileSync(file, 'utf8'));
      if (parsed.kind !== 'profile') continue;
      const profile = structuredClone(parsed.payload) as Profile;
      for (const setup of profile.setups) out.push({ label: `${file} · ${setup.name}`, profile, setup });
    } catch {
      /* unreadable file: skipped */
    }
  }
  return out.filter((one) =>
    one.profile.sources.captains.some((entry) => entry.captainId === 'leonidas' && entry.level >= 1),
  );
}

describe.skipIf(!process.env.THEORY)('248 — Leonidas drilled down', () => {
  it('reads him on every account and battle profile', async () => {
    const lines = ['# 248 — Leonidas drilled down', ''];
    for (const one of cases()) {
      const pool = createCalcPool({
        size: 1,
        createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
      });
      try {
        const entry = one.profile.sources.captains.find((e) => e.captainId === 'leonidas');
        const input = buildPlanRequest(one.profile, one.setup);
        const { currentKey, lineups, size } = captainLineups(one.profile, one.setup);
        const advice = await runCaptainAdvice(
          input,
          lineups.map(({ key, totals }) => ({ key, totals })),
          currentKey,
          pool,
          { budgetMs: NO_CLOCK },
        );
        const lead = leadLineup(advice.best, currentKey);
        const candidate = lineups.find((l) => l.key === lead);
        const stops = advice.plans[lead];
        lines.push(
          `## ${one.label}`,
          '',
          `Leonidas level ${String(entry?.level)} star ${String(entry?.star)}; march type ${String(one.setup.marchType)}; marched now: ${currentKey || '—'}; lead lineup: ${lead || '—'}; ${String(lineups.length)} lineups of size ${String(size)}.`,
        );
        if (candidate === undefined || stops === undefined) {
          lines.push('No lead plan.', '');
          continue;
        }
        const best = advice.best.map((b) => `${b.pick}: ${b.lineup || '—'} (+${b.gain.toFixed(1)})`);
        lines.push(`Best lineup per stop: ${best.join('; ')}.`);
        const leadOf = { key: lead, totals: candidate.totals, stops };
        const asks = captainWorthCandidates(one.profile, one.setup, candidate, size).map((c) => ({
          id: c.spec.id,
          label: `${c.name} ${c.change}`,
          captainId: c.spec.captainId,
          kind: c.spec.kind,
          size: c.spec.size,
          perLevel: c.perLevel,
          exact: c.spec.exact === true,
          lineups: c.lineups.map(({ key, totals }) => ({ key, totals })),
        }));
        const worth = await runUpgradeWorth(input, leadOf, asks, pool, { budgetMs: NO_CLOCK });
        const ranked = worth.rows;
        const mine = ranked.filter((row) => row.captainId === 'leonidas');
        lines.push(
          `${String(ranked.length)} worth rows; ${String(ranked.filter((r) => r.worth > 0).length)} gain; best row overall: ${ranked[0]?.label ?? '—'} (${(ranked[0]?.worth ?? 0).toFixed(2)}).`,
          '',
          '| Leonidas row | worth | rank |',
          '|---|---|---|',
        );
        for (const row of mine) lines.push(`| ${row.label} | ${row.worth.toFixed(2)} | ${String(ranked.indexOf(row) + 1)} |`);
        const report = await runHeroReport(input, leadOf, heroRoster(one.profile, one.setup), pool, {
          budgetMs: NO_CLOCK,
        });
        const tile = report.tiles.find((t) => t.captainId === 'leonidas');
        lines.push(
          '',
          `Hero report: solo ${tile?.solo.toFixed(2)}, trio ${tile?.trio.toFixed(2)}, verdict ${String(tile?.soloUp.verdict)}; best trio ${report.bestTrio?.captainIds.join(', ') ?? '—'}.`,
          '',
        );
      } finally {
        pool.dispose();
      }
    }
    writeFileSync(OUT, lines.join('\n') + '\n');
    expect(lines.length).toBeGreaterThan(2);
  }, 900_000);
});
