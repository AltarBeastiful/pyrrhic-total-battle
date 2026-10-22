/**
 * 249 — **solo and trio rated apart** (`docs/plans/hero-report.md`). The hero report reads every upgrade in the lineup
 * it plays in: each hero alone, the best trio's members in the trio, on the lead march's counts re-priced (tier 1).
 *
 * **A — tier 1 against a re-plan.** Every probe is also planned in full (base lineup planned, upgraded lineup planned
 * and read against it, as the confirm step of the captain advice does): does tier 1 rank the same upgrades first, and
 * what does it miss? Recall of the re-plan's top 3 (by the model's score: stars per star, levels as probed) in tier 1's
 * top 3 / 5, per role.
 *
 * **B — the trade.** How many probes have a stop rated below 0 (a worse trade), how deep, and does the re-plan see it
 * too (the best of its re-priced and re-planned readings per stop)?
 *
 * **C — stars to add.** For each hero's star curve, the count the report picks against the count that maximises the
 * gain, and how often a longer ladder is worse than a shorter one.
 *
 * Cases: the live camp and every battle profile of the owner's account files, owned captains only.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/249-the-roles-apart.test.ts`
 * Writes `tools/theorycraft/out/249-the-roles-apart.md` (rewritten after each case).
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { leadLineup } from '../../src/engine/captainUpgrades';
import type { Role, WorthLike } from '../../src/engine/heroReport';
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

const OUT = 'tools/theorycraft/out/249-the-roles-apart.md';
const NO_CLOCK = 1_000_000_000;
const RECALL_AT = [3, 5, 8, 12];
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
      for (const setup of profile.setups)
        out.push({ label: `${file.split('/').pop()} · ${setup.name}`, profile, setup });
    } catch {
      /* unreadable: skipped */
    }
  }
  return out;
}

const f = (value: number, digits = 2): string => value.toFixed(digits);
/** The model's score of a row: a star's gain per star, a level step's gain. */
const scoreOf = (kind: string, size: number, gain: number): number =>
  kind === 'star' ? gain / Math.max(1, size) : gain;

describe.skipIf(!process.env.THEORY)('249 — solo and trio rated apart', () => {
  it('tier 1 against a re-plan, the trade, the star counts', async () => {
    const lines = ['# 249 — solo and trio rated apart', ''];
    const recall: Record<Role, Record<number, [number, number]>> = { solo: {}, trio: {} };
    const worse = { probes: 0, negative: 0, worst5: 0, meanNeg: 0, mean1: 0, mean2: 0, noisier: 0 };
    const ladders = { heroes: 0, sameCount: 0, longerWorse: 0 };
    for (const one of cases()) {
      const began = performance.now();
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
        const candidate = lineups.find((l) => l.key === lead);
        const stops = advice.plans[lead];
        if (candidate === undefined || stops === undefined) continue;
        const roster = heroRoster(one.profile, one.setup);
        const report = await runHeroReport(
          input,
          { key: lead, totals: candidate.totals, stops },
          roster,
          pool,
          {
            budgetMs: NO_CLOCK,
            situations: false,
          },
        );
        const probes = roster.upgrades?.(report.bestTrio?.captainIds ?? null) ?? [];
        lines.push(
          `## ${one.label}`,
          '',
          `${String(report.tiles.length)} heroes, ${String(probes.length)} probes (${String(report.worth.solo.length + report.worth.trio.length)} read, ${String(report.worth.solo.concat(report.worth.trio).filter((row) => row.tier1 !== undefined).length)} planned in full); best trio ${report.bestTrio?.captainIds.join(', ') ?? '—'}; marched ${currentKey || '—'}; pass ${f((performance.now() - began) / 1000, 0)} s.`,
          '',
        );
        for (const role of ['solo', 'trio'] as const) {
          const rows = report.worth[role].filter((row) => row.tier1 !== undefined);
          // Tier 1 is the row's re-priced gain, tier 2 the planned one; ranked on the model's score.
          const scored = rows.map((row: WorthLike) => ({
            row,
            one: scoreOf(row.kind, row.size, row.tier1 ?? 0),
            two: scoreOf(row.kind, row.size, row.worth),
          }));
          const byOne = [...scored].sort((a, b) => b.one - a.one);
          const byTwo = [...scored].sort((a, b) => b.two - a.two);
          const topTwo = byTwo.filter((entry) => entry.two > 0).slice(0, 3);
          for (const k of RECALL_AT) {
            const within = new Set(byOne.slice(0, k).map((entry) => entry.row.id));
            for (const entry of topTwo) {
              const cell = (recall[role][k] ??= [0, 0]);
              cell[1] += 1;
              if (within.has(entry.row.id)) cell[0] += 1;
            }
          }
          lines.push(
            `### ${role} — top 8 by the planned score`,
            '',
            '| probe | tier 1 | tier 2 | worst stop (planned) |',
            '|---|---|---|---|',
          );
          for (const entry of byTwo.slice(0, 8))
            lines.push(
              `| ${entry.row.label} | ${f(entry.row.tier1 ?? 0)} | ${f(entry.row.worth)} | ${f(Math.min(...(entry.row.raw ?? [0])))} |`,
            );
          lines.push('');
          for (const entry of scored) {
            const worst = Math.min(...(entry.row.raw ?? [0]));
            worse.probes += 1;
            if (worst < -CAMPAIGN.heroReport.tradeWarn) worse.negative += 1;
            if (worst < -5) worse.worst5 += 1;
            const raw = entry.row.raw ?? [0];
            const net = raw.reduce((sum, rating) => sum + rating, 0) / Math.max(1, raw.length);
            if (net < 0) worse.meanNeg += 1;
            if (net < -1) worse.mean1 += 1;
            if (net < -2) worse.mean2 += 1;
            if (entry.row.worth < (entry.row.tier1 ?? 0)) worse.noisier += 1;
          }
          lines.push(
            `${role}: banner ${report.banner[role].map((a) => `${a.captainId} ${a.kind}+${String(a.size)} (${f(a.score)}${a.worse.length > 0 ? `, worse at +${a.worse.map((w) => String(w.size)).join('/+')}` : ''})`).join(' | ') || 'empty'}.`,
            '',
          );
          const heroes = new Set(rows.filter((row) => row.kind === 'star').map((row) => row.captainId));
          for (const id of heroes) {
            const ladder = rows
              .filter((row) => row.captainId === id && row.kind === 'star')
              .sort((a, b) => a.size - b.size);
            if (ladder.length === 0) continue;
            ladders.heroes += 1;
            const maxGain = Math.max(...ladder.map((row) => row.worth));
            const biggest = ladder.find((row) => row.worth === maxGain);
            const chosen = report.tiles.find((t) => t.captainId === id)?.[
              role === 'solo' ? 'soloUp' : 'trioUp'
            ]?.star;
            if (chosen !== undefined && biggest !== undefined && chosen.size === biggest.size)
              ladders.sameCount += 1;
            if (ladder.some((row, at) => at > 0 && row.worth < (ladder[at - 1]?.worth ?? 0) - 1e-9))
              ladders.longerWorse += 1;
          }
        }
      } finally {
        pool.dispose();
      }
      writeFileSync(OUT, lines.join('\n') + '\n');
    }
    const r = (role: Role): string =>
      RECALL_AT.map(
        (k) => `top ${String(k)}: ${String(recall[role][k]?.[0] ?? 0)}/${String(recall[role][k]?.[1] ?? 0)}`,
      ).join(', ');
    lines.push(
      '## Totals',
      '',
      `A. The planned top three found inside the re-priced top K — solo ${r('solo')}; trio ${r('trio')}.`,
      `B. Planned rows (best reading per stop) with a stop below −${String(CAMPAIGN.heroReport.tradeWarn)}: ${String(worse.negative)} of ${String(worse.probes)}; below −5: ${String(worse.worst5)}; with a mean over the bar below 0 / −1 / −2: ${String(worse.meanNeg)} / ${String(worse.mean1)} / ${String(worse.mean2)}.`,
      `C. Star ladders read: ${String(ladders.heroes)}; the report's count is the count of the largest gain on ${String(ladders.sameCount)}; a longer ladder is worse than a shorter on ${String(ladders.longerWorse)}.`,
      '',
    );
    writeFileSync(OUT, lines.join('\n') + '\n');
    expect(lines.length).toBeGreaterThan(3);
  }, 3_000_000);
});
