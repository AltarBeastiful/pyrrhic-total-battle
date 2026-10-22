/**
 * 250 — **trios, outliers and pairs** (`docs/plans/hero-report.md`).
 *
 * **A — the trio confirm.** The best trio from the re-priced screen alone, from the shipped confirm (the best
 * `CAMPAIGN.heroReport.trioConfirm` planned in full) and from an oracle that plans every trio: how often the shipped
 * trio is the oracle's, and the rating it gives up when it is not.
 *
 * **B — the outliers.** The trios listed beside the best, and how many have a member that is no top-three solo hero.
 *
 * **C — the pairs.** What each owned hero pairs with, as the report names it.
 *
 * Cases: the owner's account files (battle profiles with at least four heroes), owned captains only.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/250-trios-outliers-pairs.test.ts`
 * Writes `tools/theorycraft/out/250-trios-outliers-pairs.md`.
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { buildPlanRequest } from '../../src/state/derive';
import { heroRoster } from '../../src/state/heroRoster';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { createInlineClient } from '../../src/worker/client';
import { runHeroReport } from '../../src/worker/heroReport';
import { createCalcPool } from '../../src/worker/pool';

const OUT = 'tools/theorycraft/out/250-trios-outliers-pairs.md';
const NO_CLOCK = 1_000_000_000;
const FILES = ['pyrrhic-my-account-2026-10-07.json', 'pyrrhic-my-account-2026-10-11.json'];

interface Case {
  label: string;
  profile: Profile;
  setup: BattleSetup;
}

function cases(): Case[] {
  const out: Case[] = [];
  for (const file of FILES) {
    if (!existsSync(file)) continue;
    try {
      const parsed = parseImport(readFileSync(file, 'utf8'));
      if (parsed.kind !== 'profile') continue;
      const profile = structuredClone(parsed.payload) as Profile;
      for (const setup of profile.setups)
        if (profile.sources.captains.filter((entry) => entry.level >= 1).length >= 4)
          out.push({ label: `${file} · ${setup.name}`, profile, setup });
    } catch {
      /* unreadable: skipped */
    }
  }
  return out;
}

const f = (value: number, digits = 2): string => value.toFixed(digits);

describe.skipIf(!process.env.THEORY)('250 — trios, outliers and pairs', () => {
  it('reads the trio confirm, the outliers and the pairs', async () => {
    const lines = ['# 250 — trios, outliers and pairs', ''];
    let same = 0;
    let runs = 0;
    let given = 0;
    for (const one of cases()) {
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
        const leadOf = { key: lead, totals: candidate.totals, stops };
        const roster = heroRoster(one.profile, one.setup);
        const read = async (trioConfirm: number) => {
          const began = performance.now();
          const report = await runHeroReport(input, leadOf, roster, pool, {
            budgetMs: NO_CLOCK,
            situations: false,
            trioConfirm,
          });
          return { report, seconds: (performance.now() - began) / 1000 };
        };
        const quick = await read(0);
        const shipped = await read(CAMPAIGN.heroReport.trioConfirm);
        const oracle = await read(roster.trios.length);
        const name = (id: string): string => roster.heroes.find((h) => h.captainId === id)?.name ?? id;
        const trioText = (r: typeof quick.report): string =>
          `${r.bestTrio?.captainIds.map(name).join(', ') ?? '—'} (${f(r.bestTrio?.gain ?? 0)})`;
        // The shipped trio's gain read the way the oracle reads it: the oracle's own trios list.
        const oracleGainOf = (ids: string[] | undefined): number => {
          const key = ids?.join();
          const found = [oracle.report.bestTrio, ...oracle.report.otherTrios].find(
            (t) => t?.captainIds.join() === key,
          );
          return found?.gain ?? 0;
        };
        const sameTrio =
          shipped.report.bestTrio?.captainIds.join() === oracle.report.bestTrio?.captainIds.join();
        runs += 1;
        if (sameTrio) same += 1;
        else given += (oracle.report.bestTrio?.gain ?? 0) - oracleGainOf(shipped.report.bestTrio?.captainIds);
        lines.push(
          `## ${one.label}`,
          '',
          `${String(roster.heroes.length)} heroes, ${String(roster.trios.length)} trios.`,
          '',
          '### A — the trio confirm',
          '',
          `- re-priced only: ${trioText(quick.report)}, ${f(quick.seconds, 1)} s`,
          `- shipped (top ${String(CAMPAIGN.heroReport.trioConfirm)} planned): ${trioText(shipped.report)}, ${f(shipped.seconds, 1)} s`,
          `- oracle (all ${String(roster.trios.length)} planned): ${trioText(oracle.report)}, ${f(oracle.seconds, 1)} s`,
          `- shipped is the oracle's trio: ${sameTrio ? 'yes' : 'no'}; re-priced-only is: ${
            quick.report.bestTrio?.captainIds.join() === oracle.report.bestTrio?.captainIds.join()
              ? 'yes'
              : 'no'
          }`,
          '',
          '### B — the outliers (shipped)',
          '',
        );
        for (const trio of shipped.report.otherTrios)
          lines.push(
            `- ${trio.captainIds.map(name).join(', ')} +${f(trio.gain)}${trio.surprise.length > 0 ? ` — surprise: ${trio.surprise.map(name).join(', ')}` : ''}`,
          );
        if (shipped.report.otherTrios.length === 0) lines.push('- none within the share of the best');
        lines.push('', '### C — the pairs', '');
        for (const hero of roster.heroes)
          lines.push(
            `- ${hero.name}: ${hero.pairs?.types.join(', ') || 'any'} → ${hero.pairs?.mercs.join(', ') || '—'}`,
          );
        lines.push('');
      } finally {
        pool.dispose();
      }
      writeFileSync(OUT, lines.join('\n') + '\n');
    }
    lines.push(
      '## Totals',
      '',
      `A. The shipped trio is the oracle's on ${String(same)} of ${String(runs)} cases; rating given up on the others, summed: ${f(given)}.`,
      '',
    );
    writeFileSync(OUT, lines.join('\n') + '\n');
    expect(lines.length).toBeGreaterThan(3);
  }, 3_000_000);
});
