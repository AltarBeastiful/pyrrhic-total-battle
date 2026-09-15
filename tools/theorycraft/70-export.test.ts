/**
 * 70 — the campaign planner's two tables, handed over as CSV (owner, 2026-09-15: "so the owner can plot and
 * analyse it outside the repo").
 *
 * 67 printed the curve and 68 climbed the shape space, and both readings die on the terminal: the numbers
 * exist for a second and the markdown tables are hard to plot from. Everything both files need is already on
 * the engine's public API, so this experiment adds no arithmetic of its own — it writes it out as plain CSV,
 * no formatting and no thousands separators, for a spreadsheet or a plot:
 *
 *   - `plan-curve.csv` — the planner's own frontier, one row per bucket of `plan.curve`: the most damage N
 *     silver buys (`damage`, `damage_per_silver`, `mercs_lost`, `damage_per_mercenary`) and, at that same
 *     spend, the most damage a mercenary any plan found buys (`thrifty_damage`, `thrifty_mercs`,
 *     `thrifty_per_mercenary`). Sixty buckets 1.2× apart, so this is the file to plot damage against silver.
 *   - `plan-progression.csv` — the other axis, which no single plan reports because each march count is a
 *     *different* plan: what the campaign totals as marches are **added**. For K = 1…12 it takes the best
 *     plan whose repeated march the stock can still field K times (the march count is the axis, not the
 *     silver: `shapeScorer`'s own guard throws out any `(K, counts)` the stock cannot sustain, so no row can
 *     be a plan the account could not march), and prints the total beside the step from K − 1:
 *     `delta_damage`, `delta_silver`, and `marginal_damage_per_silver` — what one more march's worth of
 *     silver bought, which is the curve the owner is asking about. 68's §3 asks the same question; this
 *     file is the same sweep in a form that leaves the repo.
 *
 * The search at each K is a **plain sweep**, seeded from the planner's own rule (`largestFor`: the largest
 * count that still lasts K marches) at fractions [1, 0.8, 0.6, 0.4, 0.25] of each mercenary type, across the
 * planner's depth list 1…8 and a ladder scale of 1.0 → 6.0 by 0.05 (101 scales, against the ten
 * `LADDER_GROWTHS` the planner samples), keeping the highest `total`. No hill-climb: 68's `refine` is where
 * the finer answer belongs, and the sweep alone covers the whole file in about a minute (measured: 68 s).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/70-export.test.ts`
 */
import { mkdirSync, writeFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign, shapeScorer } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { ResolvedSource, StackRequest } from '../../src/engine/types';
import { MERC_IDS, OUT_DIR, Report, loadOwner, withCaps, withHousing } from './harness';

const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account',
  kind: 'custom',
  health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 187, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
/** The stock the account holds — 68's, so the two files' numbers sit on the same army. */
const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 14,
  'legionary-6': 16,
  'arbalester-6': 15,
  'chariot-6': 7,
};

/** The planner's own depth list (`plan.ts` DEPTHS). */
const DEPTHS = [1, 2, 3, 4, 5, 6, 7, 8];
/** The ladder floor, 1.0 → 6.0 by 0.05: a grid twenty times finer than the planner's ten growths. */
const SCALES: number[] = [];
for (let scale = 1; scale <= 6.0001; scale += 0.05) SCALES.push(Math.round(scale * 100) / 100);
/** Fractions of the largest count that still lasts K marches, beside that count itself (the planner's grid). */
const FRACTIONS = [1, 0.8, 0.6, 0.4, 0.25];
const MAX_MARCHES = 12;

interface Shape {
  K: number;
  counts: Record<string, number>;
  depth: number;
  scale: number;
  total: number;
  silver: number;
  mercLost: number;
}

/** The planner's own rule (`planCampaign`): the largest count of a type that still allows `marches` marches. */
const largestFor = (held: number, marches: number): number => {
  for (let count = held; count >= 1; count -= 1) {
    if (Math.floor((held - count) / chunks(count)) + 1 >= marches) return count;
  }
  return 0;
};

/** A plain CSV number: no separators, no exponent, and an empty cell rather than `Infinity`. */
const num = (value: number): string => (Number.isFinite(value) ? String(Number(value.toFixed(4))) : '');
const csv = (rows: string[][]): string => `${rows.map((row) => row.join(',')).join('\n')}\n`;

describe.skipIf(!process.env.THEORY)(
  'the planner, exported',
  () => {
    it('writes the curve and the march-count progression as CSV', () => {
      const report = new Report('70-export');
      const owner = loadOwner();
      const request: StackRequest = withCaps(
        withHousing(
          { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
          { leadership: 4_400, authority: 2_180 },
        ),
        HELD,
      );
      const score = shapeScorer(request);
      const held = (id: string): number => request.caps[id] ?? 0;
      const at = (K: number, counts: Record<string, number>, depth: number, scale: number): Shape | null => {
        const scored = score(K, counts, depth, scale);
        if (!scored) return null;
        return {
          K,
          counts: { ...counts },
          depth,
          scale,
          total: scored.total,
          silver: scored.silver,
          mercLost: scored.mercLost,
        };
      };

      // ── the curve ───────────────────────────────────────────────────────────────────────────────────
      const plan = planCampaign({ request, alternatives: 10 });
      const curveRows: string[][] = [
        [
          'silver',
          'damage',
          'damage_per_silver',
          'mercs_lost',
          'damage_per_mercenary',
          'thrifty_damage',
          'thrifty_mercs',
          'thrifty_per_mercenary',
        ],
      ];
      for (const point of plan.curve) {
        curveRows.push([
          num(point.silver),
          num(point.damage),
          num(point.damagePerSilver),
          num(point.mercLost),
          num(point.damage / Math.max(1, point.mercLost)),
          num(point.thriftyDamage),
          num(point.thriftyMercLost),
          num(point.thriftyPerMercenary),
        ]);
      }

      // ── the progression ─────────────────────────────────────────────────────────────────────────────
      const progression: Shape[] = [];
      for (let K = 1; K <= MAX_MARCHES; K += 1) {
        let best: Shape | null = null;
        for (const fraction of FRACTIONS) {
          // The seeds are the planner's own rule, so the sweep starts where the plan itself would: the
          // largest count each type carries K times, and four fractions below it. Every one of them is
          // scored *at this K*, and the scorer's guard rejects whatever K marches cannot sustain.
          const counts = Object.fromEntries(
            MERC_IDS.map((id) => [id, Math.round(largestFor(held(id), K) * fraction)]),
          );
          for (const depth of DEPTHS) {
            for (const scale of SCALES) {
              const shape = at(K, counts, depth, scale);
              if (shape && (!best || shape.total > best.total)) best = shape;
            }
          }
        }
        if (best) progression.push(best);
      }

      const progressionRows: string[][] = [
        [
          'marches',
          'total_damage',
          'silver',
          'mercs_lost',
          'damage_per_silver',
          'damage_per_mercenary',
          'delta_damage',
          'delta_silver',
          'marginal_damage_per_silver',
        ],
      ];
      let previous: Shape | undefined;
      for (const shape of progression) {
        const dDamage = previous ? shape.total - previous.total : undefined;
        const dSilver = previous ? shape.silver - previous.silver : undefined;
        progressionRows.push([
          num(shape.K),
          num(shape.total),
          num(shape.silver),
          num(shape.mercLost),
          num(shape.total / Math.max(1, shape.silver)),
          num(shape.total / Math.max(1, shape.mercLost)),
          dDamage === undefined ? '' : num(dDamage),
          dSilver === undefined ? '' : num(dSilver),
          dDamage === undefined || dSilver === undefined || dSilver <= 0 ? '' : num(dDamage / dSilver),
        ]);
        previous = shape;
      }

      mkdirSync(OUT_DIR, { recursive: true });
      const curveFile = new URL('plan-curve.csv', OUT_DIR);
      const progressionFile = new URL('plan-progression.csv', OUT_DIR);
      writeFileSync(curveFile, csv(curveRows));
      writeFileSync(progressionFile, csv(progressionRows));

      report.h('The two files');
      report.add(
        `- \`${curveFile.pathname}\` — ${plan.curve.length} rows plus the header. First row: ` +
          `\`${curveRows[1]?.join(',') ?? ''}\``,
      );
      report.add(
        `- \`${progressionFile.pathname}\` — ${progression.length} rows plus the header. First row: ` +
          `\`${progressionRows[1]?.join(',') ?? ''}\``,
      );
      report.add(
        'the progression at each K: ' +
          progression
            .map(
              (shape) =>
                `${shape.K}× ${shape.depth} rungs@${shape.scale} ` +
                `(${MERC_IDS.map((id) => shape.counts[id] ?? 0).join('/')})`,
            )
            .join(' · '),
      );
      report.save();
    });
  },
  900_000,
);
