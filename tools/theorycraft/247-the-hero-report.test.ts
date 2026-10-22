/**
 * 247 — **the hero report** (`docs/plans/hero-report.md`, experiments E1–E3).
 *
 * **E1 — roles.** Do the solo and trio scores rank the heroes sensibly, and is the best trio over the five-stop
 * average stable against each stop's own best trio (how many stops agree, and the rating the average trio gives up
 * on the stops where another is best)?
 *
 * **E2 — situations.** Does any of the three situations (more monsters, more mercs, other mercs) flip a verdict —
 * the best solo hero, the best trio, a hero entering or leaving it? A situation that never flips is to be removed.
 *
 * **E3 — verdict thresholds.** The banner's figures and the ratio of the third action to the first (where a third
 * becomes marginal), the verdicts the rule gives, and the smaller-to-larger action ratio of the heroes marked both.
 *
 * Cases: the owner's accounts (the live camp, the 2026-09-17 export, the 2026-10-07 account when present), every
 * table captain added at level 1.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/247-the-hero-report.test.ts`
 * Writes `tools/theorycraft/out/247-the-hero-report.md`.
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { captains as captainTable } from '../../src/data';
import { leadLineup } from '../../src/engine/captainUpgrades';
import type { HeroReport } from '../../src/engine/heroReport';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { buildPlanRequest } from '../../src/state/derive';
import { heroRoster } from '../../src/state/heroRoster';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { createInlineClient } from '../../src/worker/client';
import { runHeroReport } from '../../src/worker/heroReport';
import { createCalcPool } from '../../src/worker/pool';
import { loadLiveAccount } from './harness';

const OUT = 'tools/theorycraft/out/247-the-hero-report.md';
const NO_CLOCK = 1_000_000_000;
const EXPORT_0917 = 'tests/fixtures/pyrrhic-my-account-2026-09-17.json';
const ACCOUNT_1007 = 'pyrrhic-my-account-2026-10-07.json';

interface Case {
  label: string;
  profile: Profile;
  setup: BattleSetup;
}

function fromFile(file: string): { profile: Profile; setup: BattleSetup } | null {
  if (!existsSync(file)) return null;
  try {
    const parsed = parseImport(readFileSync(file, 'utf8'));
    if (parsed.kind !== 'profile') return null;
    const profile = structuredClone(parsed.payload) as Profile;
    const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
    return setup === undefined ? null : { profile, setup };
  } catch {
    return null;
  }
}

function withEveryCaptain(profile: Profile): Profile {
  const next = structuredClone(profile);
  for (const entry of next.sources.captains) if (entry.level < 1) entry.level = 1;
  for (const record of captainTable)
    if (!next.sources.captains.some((entry) => entry.captainId === record.id))
      next.sources.captains.push({ id: `added-${record.id}`, captainId: record.id, level: 1, star: 0 });
  return next;
}

function cases(): Case[] {
  const live = loadLiveAccount();
  const out: Case[] = [
    {
      label: 'live camp 2026-09-17',
      profile: live.profile,
      setup: {
        ...live.setup,
        housing: { leadership: 7_000, authority: 2_180, dominance: 0 },
        active: { ...live.setup.active, captains: live.profile.sources.captains.map((entry) => entry.id) },
      },
    },
  ];
  const alone = fromFile(EXPORT_0917);
  if (alone !== null) out.push({ label: '2026-09-17 export', ...alone });
  const latest = fromFile(ACCOUNT_1007);
  if (latest !== null) out.push({ label: 'owner account 2026-10-07', ...latest });
  return out.map((one) => ({ ...one, profile: withEveryCaptain(one.profile) }));
}

async function reportOf(one: Case): Promise<HeroReport> {
  const pool = createCalcPool({
    size: 1,
    createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
  });
  try {
    const input = buildPlanRequest(one.profile, one.setup);
    const { currentKey, lineups } = captainLineups(one.profile, one.setup);
    const advice = await runCaptainAdvice(
      input,
      lineups.map(({ key, totals }) => ({ key, totals })),
      currentKey,
      pool,
      { budgetMs: NO_CLOCK },
    );
    const lead = leadLineup(advice.best, currentKey);
    const candidate = lineups.find((trio) => trio.key === lead);
    const stops = advice.plans[lead];
    if (candidate === undefined || stops === undefined) throw new Error('no lead lineup');
    const leadOf = { key: lead, totals: candidate.totals, stops };
    return await runHeroReport(input, leadOf, heroRoster(one.profile, one.setup), pool, {
      budgetMs: NO_CLOCK,
    });
  } finally {
    pool.dispose();
  }
}

const f = (value: number, digits = 2): string => value.toFixed(digits);

describe.skipIf(!process.env.THEORY)('247 — the hero report', () => {
  it('E1, E2, E3 on the owner accounts', async () => {
    const lines: string[] = ['# 247 — the hero report', ''];
    const flipped = { monsters: 0, moreMercs: 0, otherMercs: 0 };
    for (const one of cases()) {
      const began = performance.now();
      const report = await reportOf(one);
      const seconds = (performance.now() - began) / 1000;
      const name = (id: string): string => report.tiles.find((tile) => tile.captainId === id)?.name ?? id;
      lines.push(`## ${one.label}`, '', `${String(report.tiles.length)} heroes, ${f(seconds, 0)} s.`, '');

      lines.push('### E1 — roles', '', '| hero | solo | trio | verdict |', '|---|---|---|---|');
      for (const tile of [...report.tiles].sort((a, b) => b.solo - a.solo).slice(0, 12))
        lines.push(`| ${tile.name} | ${f(tile.solo)} | ${f(tile.trio)} | ${tile.soloUp.verdict} |`);
      const avg = report.bestTrio;
      const agree = report.stopTrios.filter((t) => t?.captainIds.join() === avg?.captainIds.join()).length;
      const given = report.stopTrios.map((t, at) => (t?.gain ?? 0) - (avg?.stops[at] ?? 0));
      lines.push(
        '',
        `Best trio over the bar: ${avg?.captainIds.map(name).join(', ') ?? '—'} (${f(avg?.gain ?? 0)}). It is the best trio on ${String(agree)} of ${String(report.stops.length)} stops; given up per stop: ${given.map((g) => f(g)).join(' / ')}.`,
        '',
      );

      lines.push('### E2 — situations', '');
      for (const row of report.situations)
        lines.push(
          `- ${row.id}: best solo ${row.bestSolo === null ? '—' : name(row.bestSolo)}; best trio ${row.bestTrio?.map(name).join(', ') ?? '—'}`,
        );
      for (const skip of report.skipped) lines.push(`- ${skip.id}: not read (${skip.why})`);
      const flips = report.tiles.filter((tile) => tile.flips.length > 0);
      lines.push(
        '',
        `Heroes flipped: ${flips.map((tile) => `${tile.name} (${tile.flips.join(', ')})`).join('; ') || 'none'}.`,
        '',
      );
      for (const tile of flips) for (const id of tile.flips) if (id !== 'default') flipped[id] += 1;

      lines.push('### E3 — verdicts', '');
      const counts: Record<string, number> = {};
      for (const tile of report.tiles) counts[tile.soloUp.verdict] = (counts[tile.soloUp.verdict] ?? 0) + 1;
      lines.push(`Verdicts: ${JSON.stringify(counts)}.`);
      lines.push(
        `Banner: ${report.banner.solo.map((a) => `${name(a.captainId)} ${a.kind}+${String(a.size)} ${f(a.score, 3)}`).join(' | ') || 'empty'}.`,
      );
      lines.push(
        'Top solo heroes, level / star action score (star: per star): ' +
          [...report.tiles]
            .sort((a, b) => b.solo - a.solo)
            .slice(0, 6)
            .map(
              (tile) =>
                `${tile.name} ${f(tile.soloUp.level?.score ?? 0, 3)} / ${f(tile.soloUp.star?.score ?? 0, 3)} (${tile.soloUp.verdict})`,
            )
            .join('; '),
      );
      if (report.getting !== null)
        lines.push(
          `Worth getting: ${report.getting.name} (difficulty ${String(report.getting.difficulty)}).`,
        );
      lines.push('');
      expect(report.tiles.length).toBeGreaterThan(0);
    }
    lines.push('## Situations that flipped a hero, over all cases', '', JSON.stringify(flipped), '');
    writeFileSync(OUT, lines.join('\n'));
    console.log(lines.join('\n'));
  }, 3_600_000);
});
