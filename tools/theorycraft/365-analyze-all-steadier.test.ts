/**
 * 365 — **a steadier Analyze all.** Experiment 364 showed the talent ranking moves with the army size and the
 * enemy (rank correlation 0.46-0.68 against the saved setup). This reads candidate ways to make it steadier on
 * several armies and several states of the talent tree (0 / 50 / 100 % of the battle points held, bought in tree
 * order: a node only once all its parents hold a rank), and scores each by
 *
 *  - **stability**: the mean pairwise Spearman rank correlation, and the mean top-10 overlap, among the rankings
 *    it gives under twelve perturbed setups (housing x0.5 / x1 / x1.5, four enemy mixes). A steadier list is
 *    one that does not care which of those the player has selected;
 *  - **agreement**: its Spearman against the consensus (mean rank over the whole grid of 12 setups, read by the
 *    plainest method), so a method cannot win by ranking on something trivial.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/365-analyze-all-steadier.test.ts`
 */
/// <reference types="node" />
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { describe, expect, it } from 'vitest';

import { talents } from '../../src/data';
import type { TalentRecord } from '../../src/data/types';
import { screenLineups } from '../../src/engine/captains';
import { sizeStacks } from '../../src/engine/stacker';
import { talentCopy } from '../../src/engine/talentCopy';
import { CAMPAIGN } from '../../src/config';
import { parseImport } from '../../src/share/exportImport';
import { newProfile } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { allTalentsInputs } from '../../src/state/talentAnalysis';
import { countsOf } from '../../src/ui/sections/march/raise';
import { lineupPricer } from '../../src/worker/jobs';
import type { StackRequest } from '../../src/engine/types';
import { RANKING_METHODS, type RankingMethod } from '../../src/engine/talentAnalysis';
import { heldRank } from '../../src/engine/talentCopy';
import { combineAnalyses, rankTalents } from '../../src/state/talentRanking';
import { RANKING_PLANS } from '../../src/engine/talentAnalysis';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { runAllTalentsAnalysis } from '../../src/worker/talentAnalysis';

const DL = `${homedir()}/Downloads`;
const FILES = [
  'pyrrhic-my-account-2026-10-12 (1).json', // 13 000
  'pyrrhic-my-account-2026-10-12.json', // 9 000
  'pyrrhic-my-account-2026-10-13.json', // 6 800
  'pyrrhic-my-account-2026-10-22.json', // 11 815
];

interface Army {
  label: string;
  profile: Profile;
  setup: BattleSetup;
}

function armies(): Army[] {
  const out: Army[] = [];
  for (const file of FILES) {
    if (!existsSync(`${DL}/${file}`)) continue;
    const parsed = parseImport(readFileSync(`${DL}/${file}`, 'utf8'));
    if (parsed.kind !== 'profile') continue;
    const profile = structuredClone(parsed.payload) as Profile;
    const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
    if (setup !== undefined) {
      out.push({
        label: `${file.replace('pyrrhic-my-account-', '').replace('.json', '')} (${String(setup.housing.leadership)})`,
        profile,
        setup,
      });
    }
  }
  // a small first-run army
  const small = newProfile('small');
  const smallSetup = small.setups[0];
  if (smallSetup !== undefined) {
    smallSetup.housing = { leadership: 3_000, authority: 1_000, dominance: 0 };
    small.mercenaries.selected = [{ id: 'bear-5', cap: 10 }];
    out.push({ label: 'small first-run (3 000)', profile: small, setup: smallSetup });
  }
  return out;
}

// ---- the tree states ---------------------------------------------------------------------------------
/** Hold `share` of the battle trees' points, bought in layout order, a node only once its parents hold a rank. */
function withPoints(army: Army, share: number): Army {
  const profile = structuredClone(army.profile);
  const trees = new Set(
    talents.filter((n) => n.stats.some((s) => s === 'UNIT_POWER' || s === 'UNIT_HEALTH')).map((n) => n.tree),
  );
  const nodes = talents
    .filter((n) => trees.has(n.tree))
    .sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x);
  const cost = (n: TalentRecord): number => n.costs.reduce((a, b) => a + b, 0);
  let budget = nodes.reduce((sum, n) => sum + cost(n), 0) * share;
  const ranks: Record<string, number> = {};
  for (const node of nodes) {
    if (node.parents.some((p) => (ranks[String(p)] ?? 0) < 1)) continue;
    let rank = 0;
    for (const c of node.costs) {
      if (budget < c) break;
      budget -= c;
      rank += 1;
    }
    if (rank > 0) ranks[String(node.id)] = rank;
  }
  profile.talents.ranks = ranks;
  const lines = talentCopy(talents, ranks, undefined).lines;
  const has = profile.sources.permanent.some((e) => e.builtin === 'heroTalents');
  profile.sources.permanent = has
    ? profile.sources.permanent.map((e) => (e.builtin === 'heroTalents' ? { ...e, ...lines } : e))
    : [
        ...profile.sources.permanent,
        { id: 'heroTalents', name: 'Hero Talents', builtin: 'heroTalents' as const, ...lines },
      ];
  return { label: `${army.label} @${String(Math.round(share * 100))} %`, profile, setup: army.setup };
}

// ---- pricing one context -----------------------------------------------------------------------------
type Mode = 'sized' | 'fixed';
interface Priced {
  id: number;
  points: number[];
  gains: number[]; // mean over the pool shapes, one per priced rank (the first is the baseline, 0)
}

const scaled = (setup: BattleSetup, factor: number): BattleSetup => ({
  ...setup,
  housing: {
    leadership: Math.round(setup.housing.leadership * factor),
    authority: Math.round(setup.housing.authority * factor),
    dominance: Math.round(setup.housing.dominance * factor),
  },
});
const ENEMIES: Record<string, Record<string, number>> = {
  even: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
  meleeHeavy: { melee: 0.7, ranged: 0.1, mounted: 0.1, flying: 0.1 },
  rangedHeavy: { melee: 0.1, ranged: 0.7, mounted: 0.1, flying: 0.1 },
  mountedHeavy: { melee: 0.1, ranged: 0.1, mounted: 0.7, flying: 0.1 },
};
const withEnemy = (setup: BattleSetup, name: string): BattleSetup => ({
  ...setup,
  enemy: ENEMIES[name] as BattleSetup['enemy'],
});

const cache = new Map<string, Priced[]>();
function price(army: Army, setup: BattleSetup, mode: Mode, tag: string): Priced[] {
  const key = `${army.label}|${tag}|${mode}|${JSON.stringify(setup.housing)}|${JSON.stringify(setup.enemy)}`;
  const hit = cache.get(key);
  if (hit !== undefined) return hit;
  const { jobs } = allTalentsInputs(army.profile, setup);
  const out: Priced[] = jobs.map((job) => {
    const { input, node, baseline } = job;
    const lineups = input.ranks.map(({ rank, totals }) => ({ key: String(rank), totals }));
    const perFill = CAMPAIGN.talentFills.map((fill) => {
      const request: StackRequest = {
        ...input.request,
        housing: {
          ...input.request.housing,
          leadership: Math.floor((input.request.housing.leadership * fill) / 100),
        },
      };
      const stops =
        mode === 'fixed'
          ? [
              {
                pick: 'fixed',
                counts: countsOf(
                  sizeStacks({
                    ...request,
                    totals: lineups[0]!.totals,
                    options: { ...request.options, method: 'elite' },
                  }),
                ),
              },
            ]
          : [];
      const screens = screenLineups(
        lineups,
        lineups[0]!.key,
        stops,
        lineupPricer(request),
        CAMPAIGN.markerRates,
      );
      return screens.map((s) => (mode === 'sized' ? s.sized : (s.repriced[0] ?? 0)));
    });
    const gains = lineups.map((_, i) => perFill.reduce((s, g) => s + (g[i] ?? 0), 0) / perFill.length);
    let acc = 0;
    const points = input.ranks.map(({ rank }, i) => {
      if (i === 0) return 0;
      for (let r = input.ranks[i - 1]?.rank ?? baseline; r < rank; r++) acc += node.costs[r] ?? 0;
      return acc;
    });
    return { id: node.id, points, gains };
  });
  cache.set(key, out);
  return out;
}

// ---- scoring -----------------------------------------------------------------------------------------
type Score = Map<number, number>; // talent id -> score; talents with nothing to buy are absent

const endpoint = (p: Priced): number | null => {
  const pts = p.points.at(-1) ?? 0;
  return pts > 0 ? (p.gains.at(-1) ?? 0) / pts : null;
};
/** Least-squares slope of gain on points through the origin, over every priced rank. */
const slope = (p: Priced): number | null => {
  let xy = 0;
  let xx = 0;
  p.points.forEach((x, i) => {
    xy += x * (p.gains[i] ?? 0);
    xx += x * x;
  });
  return xx > 0 ? xy / xx : null;
};
const scoreOf = (rows: Priced[], f: (p: Priced) => number | null): Score => {
  const s: Score = new Map();
  for (const r of rows) {
    const v = f(r);
    if (v !== null) s.set(r.id, v);
  }
  return s;
};
const ranksOf = (s: Score): Map<number, number> => {
  const order = [...s.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  return new Map(order.map(([id], i) => [id, i + 1]));
};
const meanScores = (list: Score[]): Score => {
  const out: Score = new Map();
  for (const id of list[0]?.keys() ?? [])
    out.set(id, list.reduce((s, m) => s + (m.get(id) ?? 0), 0) / list.length);
  return out;
};

const SIZES = [0.5, 0.75, 1, 1.5];
interface Method {
  name: string;
  score: (army: Army, setup: BattleSetup) => Score;
}
const METHODS: Method[] = [
  {
    name: 'M0 current (endpoint, sized, own setup)',
    score: (a, s) => scoreOf(price(a, s, 'sized', 'x'), endpoint),
  },
  {
    name: 'M1 slope through all ranks (sized, own setup)',
    score: (a, s) => scoreOf(price(a, s, 'sized', 'x'), slope),
  },
  {
    name: 'M2 fixed counts (re-priced, own setup)',
    score: (a, s) => scoreOf(price(a, s, 'fixed', 'x'), endpoint),
  },
  {
    name: 'M3 size mean (endpoint, x0.5 x0.75 x1 x1.5)',
    score: (a, s) => meanScores(SIZES.map((f) => scoreOf(price(a, scaled(s, f), 'sized', 'x'), endpoint))),
  },
  {
    name: 'M4 size mean of slopes',
    score: (a, s) => meanScores(SIZES.map((f) => scoreOf(price(a, scaled(s, f), 'sized', 'x'), slope))),
  },
  {
    name: 'M5 size mean, fixed counts',
    score: (a, s) => meanScores(SIZES.map((f) => scoreOf(price(a, scaled(s, f), 'fixed', 'x'), endpoint))),
  },
  {
    name: 'M6 size x enemy mean of slopes (16 contexts)',
    score: (a, s) =>
      meanScores(
        SIZES.flatMap((f) =>
          Object.keys(ENEMIES).map((e) => scoreOf(price(a, withEnemy(scaled(s, f), e), 'sized', 'x'), slope)),
        ),
      ),
  },
  {
    name: 'M9 size x enemy mean, fixed counts, slope',
    score: (a, s) =>
      meanScores(
        SIZES.flatMap((f) =>
          Object.keys(ENEMIES).map((e) => scoreOf(price(a, withEnemy(scaled(s, f), e), 'fixed', 'x'), slope)),
        ),
      ),
  },
  {
    name: 'M10 enemy mean only (own size, sized, slope)',
    score: (a, s) =>
      meanScores(Object.keys(ENEMIES).map((e) => scoreOf(price(a, withEnemy(s, e), 'sized', 'x'), slope))),
  },
  {
    name: 'M11 size mean only over 8 sizes (sized, slope)',
    score: (a, s) =>
      meanScores(
        [0.25, 0.4, 0.55, 0.7, 0.85, 1, 1.25, 1.5].map((f) =>
          scoreOf(price(a, scaled(s, f), 'sized', 'x'), slope),
        ),
      ),
  },
  {
    name: 'M12 naive: bonus points per talent point (no battle)',
    score: (a) => {
      const out: Score = new Map();
      for (const job of allTalentsInputs(a.profile, a.setup).jobs) {
        const node = job.node;
        const points = node.costs.slice(job.baseline, node.maxRank).reduce((x, y) => x + y, 0);
        if (points > 0)
          out.set(node.id, ((node.values.at(-1) ?? 0) - (node.values[job.baseline - 1] ?? 0)) / points);
      }
      return out;
    },
  },
  {
    name: 'M7 mean rank over sizes (slope)',
    score: (a, s) => {
      const ranked = SIZES.map((f) => ranksOf(scoreOf(price(a, scaled(s, f), 'sized', 'x'), slope)));
      const out: Score = new Map();
      for (const id of ranked[0]?.keys() ?? [])
        out.set(id, -ranked.reduce((sum, r) => sum + (r.get(id) ?? 0), 0) / ranked.length);
      return out;
    },
  },
  {
    name: 'M8 size mean of slopes, fixed counts',
    score: (a, s) => meanScores(SIZES.map((f) => scoreOf(price(a, scaled(s, f), 'fixed', 'x'), slope))),
  },
];

function spearman(a: Score, b: Score): number {
  const ra = ranksOf(a);
  const rb = ranksOf(b);
  const ids = [...ra.keys()].filter((id) => rb.has(id));
  const n = ids.length;
  // re-rank on the shared ids
  const sub = (r: Map<number, number>): Map<number, number> =>
    new Map(ids.sort((x, y) => (r.get(x) ?? 0) - (r.get(y) ?? 0)).map((id, i) => [id, i + 1]));
  const sa = sub(ra);
  const sb = sub(rb);
  let d2 = 0;
  for (const id of ids) d2 += ((sa.get(id) ?? 0) - (sb.get(id) ?? 0)) ** 2;
  return 1 - (6 * d2) / (n * (n * n - 1));
}
const top = (s: Score, n: number): Set<number> =>
  new Set([...ranksOf(s).entries()].filter(([, r]) => r <= n).map(([id]) => id));
const overlap = (a: Score, b: Score, n = 10): number =>
  [...top(a, n)].filter((id) => top(b, n).has(id)).length;

describe.skipIf(!process.env.THEORY)('365 — a steadier Analyze all', () => {
  it('scores each method on stability and agreement', async () => {
    const states = armies().flatMap((army) => [0, 0.5, 1].map((share) => withPoints(army, share)));
    const perturb: BattleSetup[] = [];
    const sizes = [0.5, 1, 1.5];
    const mkSetups = (army: Army): BattleSetup[] =>
      sizes.flatMap((f) => Object.keys(ENEMIES).map((e) => withEnemy(scaled(army.setup, f), e)));
    const stab: Record<string, { sp: number[]; top: number[]; agree: number[] }> = {};
    for (const m of METHODS) stab[m.name] = { sp: [], top: [], agree: [] };
    const perState: string[] = [
      '| state | ' + METHODS.map((m) => `${m.name.split(' ')[0] ?? ''} sp / top10`).join(' | ') + ' |',
      '|---|' + METHODS.map(() => '---|').join(''),
    ];
    for (const army of states) {
      const setups = mkSetups(army);
      void perturb;
      // consensus: mean of per-talent mean rank, read by the plainest method (M1) on the 12 setups
      const reference = meanScores(setups.map((s) => scoreOf(price(army, s, 'sized', 'x'), slope)));
      const cells: string[] = [];
      for (const m of METHODS) {
        const scores = setups.map((s) => m.score(army, s));
        const sps: number[] = [];
        const tops: number[] = [];
        for (let i = 0; i < scores.length; i++)
          for (let j = i + 1; j < scores.length; j++) {
            sps.push(spearman(scores[i]!, scores[j]!));
            tops.push(overlap(scores[i]!, scores[j]!));
          }
        const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
        const agree = mean(scores.map((s) => spearman(s, reference)));
        stab[m.name]!.sp.push(mean(sps));
        stab[m.name]!.top.push(mean(tops));
        stab[m.name]!.agree.push(agree);
        cells.push(`${mean(sps).toFixed(2)} / ${mean(tops).toFixed(1)}`);
      }
      perState.push(`| ${army.label} | ${cells.join(' | ')} |`);
      console.log(army.label, cells.join(' | '));
    }
    const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
    const md = [
      '# 365 — a steadier Analyze all',
      '',
      `${String(states.length)} armies x tree states; 12 perturbed setups each (housing x0.5 / x1 / x1.5 by four enemy mixes).`,
      '',
      '| method | stability (mean pairwise Spearman) | stability (top-10 shared of 10) | agreement with consensus |',
      '|---|---|---|---|',
      ...METHODS.map(
        (m) =>
          `| ${m.name} | ${mean(stab[m.name]!.sp).toFixed(3)} | ${mean(stab[m.name]!.top).toFixed(2)} | ${mean(stab[m.name]!.agree).toFixed(3)} |`,
      ),
      '',
      '## Per army and tree state (Spearman / top-10)',
      '',
      ...perState,
    ];
    mkdirSync('tools/theorycraft/out', { recursive: true });
    writeFileSync('tools/theorycraft/out/365-analyze-all-steadier.md', `${md.join('\n')}\n`);
    expect(states.length).toBeGreaterThan(0);
  }, 3_600_000);

  it('the shipped pipeline (allTalentsInputs -> pool -> combine -> rank) reproduces the experiment', async () => {
    // One army state per process (THEORY_STATE=i): hundreds of runs in one process run the wasm memory out.
    const only = process.env.THEORY_STATE === undefined ? undefined : Number(process.env.THEORY_STATE);
    const all = armies().flatMap((army) => [0, 0.5, 1].map((share) => withPoints(army, share)));
    const states = only === undefined ? all : all.filter((_, i) => i === only);
    const pool = createCalcPool({
      size: 1,
      createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
    });
    const shipped = async (army: Army, setup: BattleSetup, method: RankingMethod): Promise<Score> => {
      const { jobs } = allTalentsInputs(army.profile, setup, undefined, undefined, method);
      const analyses = await runAllTalentsAnalysis(
        jobs.flatMap((job) => job.inputs),
        pool,
        { budgetMs: Number.MAX_SAFE_INTEGER },
      );
      let at = 0;
      const rows = rankTalents(
        jobs.map((job) => {
          const own = analyses.slice(at, at + job.inputs.length);
          at += job.inputs.length;
          return {
            node: job.node,
            held: heldRank(job.node, army.profile.talents.ranks),
            analysis: combineAnalyses(own),
            score: RANKING_PLANS[method].score,
          };
        }),
        'perPoint',
      );
      const out: Score = new Map();
      for (const row of rows) if (row.perPoint !== null) out.set(row.id, row.perPoint);
      return out;
    };
    const acc: Record<string, { sp: number[]; top: number[]; agree: number[] }> = {};
    for (const m of RANKING_METHODS) acc[m] = { sp: [], top: [], agree: [] };
    const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
    for (const army of states) {
      const setups = [0.5, 1, 1.5].flatMap((f) =>
        Object.keys(ENEMIES).map((e) => withEnemy(scaled(army.setup, f), e)),
      );
      const reference = meanScores(setups.map((s) => scoreOf(price(army, s, 'sized', 'x'), slope)));
      for (const method of RANKING_METHODS) {
        const scores: Score[] = [];
        for (const s of setups) scores.push(await shipped(army, s, method));
        const sps: number[] = [];
        const tops: number[] = [];
        for (let i = 0; i < scores.length; i++)
          for (let j = i + 1; j < scores.length; j++) {
            sps.push(spearman(scores[i]!, scores[j]!));
            tops.push(overlap(scores[i]!, scores[j]!));
          }
        acc[method]!.sp.push(mean(sps));
        acc[method]!.top.push(mean(tops));
        acc[method]!.agree.push(mean(scores.map((sc) => spearman(sc, reference))));
      }
    }
    pool.dispose();
    if (only !== undefined) {
      mkdirSync('tools/theorycraft/out/366', { recursive: true });
      writeFileSync(
        `tools/theorycraft/out/366/${String(only)}.json`,
        JSON.stringify({ label: states[0]?.label, acc }),
      );
      return;
    }
    const md = [
      '# 366 — the shipped rankings, checked through the product pipeline',
      '',
      `${String(states.length)} armies x tree states, 12 perturbed setups each (as 365).`,
      '',
      '| reading | stability (Spearman) | stability (top-10 of 10) | agreement with consensus |',
      '|---|---|---|---|',
      ...RANKING_METHODS.map(
        (m) =>
          `| ${m} | ${mean(acc[m]!.sp).toFixed(3)} | ${mean(acc[m]!.top).toFixed(2)} | ${mean(acc[m]!.agree).toFixed(3)} |`,
      ),
    ];
    writeFileSync('tools/theorycraft/out/366-shipped-rankings.md', `${md.join('\n')}\n`);
    expect(mean(acc.steady!.sp)).toBeGreaterThan(mean(acc.current!.sp));
  }, 3_600_000);
});
