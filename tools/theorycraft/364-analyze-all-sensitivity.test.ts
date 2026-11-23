/**
 * 364 — **how much does Analyze all depend on the battle setup?** The ranking prices every talent on the selected
 * march, so the army size, the method and the enemy could move it. This runs the full ranking on the owner's
 * newest export under variations of the setup and reports, against the untouched setup, the rank correlation
 * (Spearman), the overlap of the top 10 and the biggest rank moves; plus the noise floor (the share of talents
 * that read exactly 0, and how a talent's gain moves between the two pool shapes of its own analysis).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/364-analyze-all-sensitivity.test.ts`
 */
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { describe, expect, it } from 'vitest';

import { parseImport } from '../../src/share/exportImport';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { allTalentsInputs } from '../../src/state/talentAnalysis';
import { rankTalents, type RankingRow } from '../../src/state/talentRanking';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { runAllTalentsAnalysis } from '../../src/worker/talentAnalysis';
import { heldRank } from '../../src/engine/talentCopy';

const FILE = `${homedir()}/Downloads/pyrrhic-my-account-2026-10-22.json`;

function load(): { profile: Profile; setup: BattleSetup } | null {
  if (!existsSync(FILE)) return null;
  const parsed = parseImport(readFileSync(FILE, 'utf8'));
  if (parsed.kind !== 'profile') return null;
  const profile = structuredClone(parsed.payload) as Profile;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  return setup === undefined ? null : { profile, setup };
}

const scaled = (setup: BattleSetup, factor: number): BattleSetup => ({
  ...setup,
  housing: {
    leadership: Math.round(setup.housing.leadership * factor),
    authority: Math.round(setup.housing.authority * factor),
    dominance: Math.round(setup.housing.dominance * factor),
  },
});

function spearman(a: RankingRow[], b: RankingRow[]): number {
  const rank = (rows: RankingRow[]): Map<number, number> => new Map(rows.map((r, i) => [r.id, i]));
  const ra = rank(a);
  const rb = rank(b);
  const n = a.length;
  let sum = 0;
  for (const [id, i] of ra) sum += (i - (rb.get(id) ?? 0)) ** 2;
  return 1 - (6 * sum) / (n * (n * n - 1));
}

describe.skipIf(!process.env.THEORY)('364 — Analyze all sensitivity to the setup', () => {
  it('compares rankings across setups', async () => {
    const one = load();
    if (one === null) return;
    const { profile, setup } = one;
    const variants: { label: string; setup: BattleSetup }[] = [
      { label: 'as saved', setup },
      { label: 'housing ×0.1', setup: scaled(setup, 0.1) },
      { label: 'housing ×0.25', setup: scaled(setup, 0.25) },
      { label: 'housing ×0.5', setup: scaled(setup, 0.5) },
      { label: 'housing ×1.5', setup: scaled(setup, 1.5) },
      { label: 'method elite', setup: { ...setup, options: { ...setup.options, method: 'elite' } } },
      { label: 'method ms', setup: { ...setup, options: { ...setup.options, method: 'ms' } } },
      { label: 'enemy all melee', setup: { ...setup, enemy: { ...setup.enemy, melee: 1, ranged: 0, mounted: 0, flying: 0 } } },
      { label: 'enemy all ranged', setup: { ...setup, enemy: { ...setup.enemy, melee: 0, ranged: 1, mounted: 0, flying: 0 } } },
    ];
    const pool = createCalcPool({
      size: 1,
      createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
    });
    const results: { label: string; rows: RankingRow[]; seconds: number }[] = [];
    for (const variant of variants) {
      const began = performance.now();
      const { jobs } = allTalentsInputs(profile, variant.setup);
      const analyses = await runAllTalentsAnalysis(
        jobs.map((job) => job.input),
        pool,
        { budgetMs: Number.MAX_SAFE_INTEGER },
      );
      const rows = rankTalents(
        jobs.map((job, i) => ({
          node: job.node,
          held: heldRank(job.node, profile.talents.ranks),
          analysis: analyses[i]!,
        })),
        'perPoint',
      );
      const seconds = (performance.now() - began) / 1000;
      results.push({ label: variant.label, rows, seconds });
      console.log(`${variant.label}: ${seconds.toFixed(1)} s, ${String(rows.length)} talents`);
    }
    const base = results[0]!;
    const md: string[] = [
      '# 364 — Analyze all against the battle setup',
      '',
      `Account ${FILE.split('/').pop() ?? ''}; setup "${setup.name}", housing ${JSON.stringify(setup.housing)}, method ${setup.options.method}.`,
      '',
      '| setup | seconds | talents at 0 gain | Spearman vs saved | top-10 shared | top-5 shared |',
      '|---|---|---|---|---|---|',
    ];
    const top = (rows: RankingRow[], n: number): Set<number> => new Set(rows.slice(0, n).map((r) => r.id));
    for (const r of results) {
      const zero = r.rows.filter((row) => row.gainAtMax === 0).length;
      const t10 = [...top(r.rows, 10)].filter((id) => top(base.rows, 10).has(id)).length;
      const t5 = [...top(r.rows, 5)].filter((id) => top(base.rows, 5).has(id)).length;
      md.push(
        `| ${r.label} | ${r.seconds.toFixed(1)} | ${String(zero)} / ${String(r.rows.length)} | ${spearman(base.rows, r.rows).toFixed(2)} | ${String(t10)} / 10 | ${String(t5)} / 5 |`,
      );
    }
    md.push('', '## Top 8 per setup (name: gain per point)', '');
    for (const r of results) {
      md.push(
        `- **${r.label}**: ${r.rows
          .slice(0, 8)
          .map((row) => `${row.name} ${row.perPoint === null ? '–' : row.perPoint.toFixed(3)}`)
          .join(' · ')}`,
      );
    }
    mkdirSync('tools/theorycraft/out', { recursive: true });
    writeFileSync('tools/theorycraft/out/364-analyze-all-sensitivity.md', `${md.join('\n')}\n`);
    expect(results.length).toBe(variants.length);
  }, 3_600_000);
});
