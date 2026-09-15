/**
 * 68 — the shape space, swept fine (owner, 2026-09-14: "can't we do better than 1.56 and 705? did you
 * analyse the curvature? is there a sweeter spot? … always compute what a stack with x marches totals").
 *
 * Experiment 67 read the curve off the *plans* the planner happened to find. Read against `plan.ts`, both
 * of the ratios it printed are properties of the **shape**, not of the plan: a plan is `marches` repeats of
 * one march plus a final march, so
 *
 *   total damage = marches × damage(march) + damage(finale)      total silver = marches × silver(march) + …
 *
 * and changing the march count only walks along a **ray** from the origin — the ratios do not move. What is
 * left to optimise is the shape: the mercenary counts, the ladder's depth, and the height of its floor. The
 * planner samples that space coarsely — ten ladder scales (`LADDER_GROWTHS`), eight depths — and only the
 * mercenary counts are hill-climbed; the ladder's scale is never refined.
 *
 * So this experiment scores shapes with the engine's own exported scorer (`shapeScorer`, `plan.ts`), seeds
 * from the planner's own picks, and refines the scale on a grid twenty times finer than the planner's,
 * then asks the three questions in order:
 *
 *   §1 are the rays real?          — the ratios, held fixed while the march count walks the ray
 *   §2 is there headroom?          — the fine sweep against the planner's own pick, on both ratios
 *   §3 the progression             — what the campaign totals as marches are added, and the marginal
 *   §4 the curvature               — where one more silver stops buying damage, and the sweet spot
 *   §5 three random shapes         — what an average shape looks like, so the picks are not read as miracles
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/68-shape-sweep.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign, shapeScorer } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { ResolvedSource, StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, loadOwner, n, withCaps, withHousing } from './harness';

const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account',
  kind: 'custom',
  health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 187, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 14,
  'legionary-6': 16,
  'arbalester-6': 15,
  'chariot-6': 7,
};

/** The planner's own depth list (`plan.ts` DEPTHS). */
const DEPTHS = [1, 2, 3, 4, 5, 6, 7, 8];
/**
 * The scale grid the planner never had: the ladder's floor is `mercenaryHp × (1 + gap) × scale`, and the
 * planner only ever asks for `scale ∈ LADDER_GROWTHS`. 0.05 apart, and out to 10 to test that cap too.
 */
const FINE_SCALES: number[] = [];
for (let scale = 1; scale <= 10.0001; scale += 0.05) FINE_SCALES.push(Math.round(scale * 100) / 100);
/** Offsets the mercenary counts are climbed by, beside the planner's ±1/±2. */
const DELTAS = [1, -1, 2, -2, 3, -3, 5, -5, 8, -8, 13, -13, 21, -21];
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

const perSilver = (shape: Shape): number => shape.total / Math.max(1, shape.silver);
const perMerc = (shape: Shape): number => shape.total / Math.max(1, shape.mercLost);
/** The planner's own rule: the largest count that still lasts `marches`. */
const largestFor = (held: number, marches: number): number => {
  for (let count = held; count >= 1; count -= 1) {
    if (Math.floor((held - count) / chunks(count)) + 1 >= marches) return count;
  }
  return 0;
};

describe.skipIf(!process.env.THEORY)(
  'the shape space, swept fine',
  () => {
    it('answers whether 1.56 and 705,862 are the frontier or the grid', () => {
      const report = new Report('68-shape-sweep');
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
      const mercsOf = (counts: Record<string, number>): Record<string, number> =>
        Object.fromEntries(MERC_IDS.map((id) => [id, Math.max(0, Math.floor(counts[id] ?? 0))]));

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

      /** The engine's own plan, so the seeds are its picks and not a re-derivation of them. */
      const plan = planCampaign({ request, alternatives: 10 });
      const picks = [
        plan.recommend,
        plan.knee,
        plan.mostEfficient,
        plan.mostThrifty,
        ...plan.alternatives,
      ].filter((pick): pick is NonNullable<typeof pick> => pick !== undefined);

      // ── §1 the rays ────────────────────────────────────────────────────────────────────────────────
      report.h('§1 Are the rays real? One shape, marched 1 to 12 times');
      const seed = plan.recommend;
      const seedCounts = mercsOf(seed?.counts ?? {});
      const seedDepth = Number(/(\d+) rungs/.exec(seed?.label ?? '')?.[1] ?? 7);
      const seedScale = 1.5;
      report.add(
        `the shape: ${MERC_IDS.map((id) => `${id.replace(/-6$/, '')} ${seedCounts[id] ?? 0}`).join(' · ')} ` +
          `behind a ${seedDepth}-rung ladder at scale ${seedScale}`,
      );
      report.add(
        '| marches K | total damage | silver | mercs lost | damage / K | silver / K | damage / silver | damage / mercenary |\n' +
          '|---|---|---|---|---|---|---|---|',
      );
      const ray: Shape[] = [];
      for (let K = 1; K <= MAX_MARCHES; K += 1) {
        const shape = at(K, seedCounts, seedDepth, seedScale);
        if (!shape) continue;
        ray.push(shape);
        report.add(
          `| ${K} | ${n(Math.round(shape.total))} | ${n(Math.round(shape.silver))} | ${n(shape.mercLost)} | ` +
            `${n(Math.round(shape.total / K))} | ${n(Math.round(shape.silver / K))} | ` +
            `${perSilver(shape).toFixed(3)} | ${n(Math.round(perMerc(shape)))} |`,
        );
      }
      report.add('What each further march adds, which is where the shape of the curve lives:');
      report.add('| from | to | Δ damage | Δ silver | Δ damage / Δ silver |\n|---|---|---|---|---|');
      for (let index = 1; index < ray.length; index += 1) {
        const from = ray[index - 1] as Shape;
        const to = ray[index] as Shape;
        const dSilver = to.silver - from.silver;
        report.add(
          `| ${from.K} | ${to.K} | ${n(Math.round(to.total - from.total))} | ${n(Math.round(dSilver))} | ` +
            `${dSilver > 0 ? ((to.total - from.total) / dSilver).toFixed(4) : '—'} |`,
        );
      }
      report.add(
        'The steps are **identical to the second decimal from the second march on** — the same march, marched ' +
          "again — so the repeated march *is* a ray, and its own rate (the last column) is the shape's true " +
          'exchange rate. The **averages** in the table above drift away from it because the final march is not ' +
          'a repeat: it spends the stock the repeats burned, and the more marches there are the smaller it is. ' +
          'So the "2.66 at the cheap end, 1.13 at the dear end" the planner prints is not the ladder getting ' +
          'worse — it is **one finale being amortised over fewer or more marches**. What a plan can decide is ' +
          'the shape; what the march count decides is how much of the free final march each silver rides on.',
      );

      // ── §2 headroom ────────────────────────────────────────────────────────────────────────────────
      report.h('§2 The fine sweep, against the planner’s own picks');
      const refine = (start: Shape, key: (shape: Shape) => number, rounds = 8): Shape => {
        let counts = { ...start.counts };
        let depth = start.depth;
        let scale = start.scale;
        let best = start;
        for (let round = 0; round < rounds; round += 1) {
          let improved = false;
          for (const d of DEPTHS) {
            for (const s of FINE_SCALES) {
              const candidate = at(start.K, counts, d, s);
              if (candidate && key(candidate) > key(best)) {
                best = candidate;
                depth = d;
                scale = s;
                improved = true;
              }
            }
          }
          for (const id of MERC_IDS) {
            for (const delta of DELTAS) {
              const count = Math.max(0, Math.min(held(id), (counts[id] ?? 0) + delta));
              if (count === (counts[id] ?? 0)) continue;
              const trial = { ...counts, [id]: count };
              const candidate = at(start.K, trial, depth, scale);
              if (candidate && key(candidate) > key(best)) {
                best = candidate;
                counts = trial;
                improved = true;
              }
            }
          }
          if (!improved) break;
        }
        return best;
      };

      const seeds: Shape[] = [];
      for (const pick of picks) {
        const label = pick.label;
        const depth = Number(/(\d+) rungs/.exec(label)?.[1] ?? 0);
        // the label counts the finale as a march; the shape's `K` is the repeats only
        const K = label.includes('finale') ? pick.marches - 1 : pick.marches;
        if (depth < 1 || K < 1 || K > MAX_MARCHES) continue;
        const counts = mercsOf(pick.counts);
        if (MERC_IDS.every((id) => (counts[id] ?? 0) === 0)) continue;
        const shape = at(K, counts, depth, 1.5);
        if (shape) seeds.push(shape);
      }
      // the planner's own numbers, for the comparison row
      const engineBalanced = plan.recommend;
      report.add(
        `the planner's balanced pick, as it reports it: **${n(engineBalanced?.totalDamage ?? 0)} damage, ` +
          `${n(engineBalanced?.silver ?? 0)} silver, ${n(engineBalanced?.mercLost ?? 0)} mercenaries** — ` +
          `${(engineBalanced?.damagePerSilver ?? 0).toFixed(2)} a silver, ` +
          `${n(Math.round(engineBalanced?.damagePerMercenary ?? 0))} a mercenary.`,
      );
      report.add(`seeded from ${seeds.length} of the planner's own picks.`);

      const climbed: Shape[] = [];
      for (const objective of [
        { name: 'most damage', key: (shape: Shape): number => shape.total },
        { name: 'most damage a silver', key: perSilver },
        { name: 'most damage a mercenary', key: perMerc },
      ]) {
        let best: Shape | null = null;
        for (const seedShape of seeds) {
          const candidate = refine(seedShape, objective.key);
          climbed.push(candidate);
          if (!best || objective.key(candidate) > objective.key(best)) best = candidate;
        }
        if (best) {
          report.add(
            `- **${objective.name}**, after the fine sweep: ${n(Math.round(best.total))} damage, ` +
              `${n(Math.round(best.silver))} silver, ${n(best.mercLost)} mercenaries — ` +
              `${perSilver(best).toFixed(2)} a silver, ${n(Math.round(perMerc(best)))} a mercenary ` +
              `(${best.K}× ${best.depth} rungs at scale ${best.scale}: ` +
              `${MERC_IDS.map((id) => `${id.replace(/-6$/, '')} ${best?.counts[id] ?? 0}`).join(' · ')})`,
          );
        }
      }

      report.h('§2b A shape that beats the balanced pick on *both* ratios at once');
      // The pair to beat, from the planner's own pick and from the climbed pool — the peaks are taken over
      // the union so the two are judged on the same scales.
      const pool = [...climbed, ...seeds];
      const peakPerSilver = Math.max(...pool.map(perSilver));
      const peakPerMerc = Math.max(...pool.map(perMerc));
      const balancedScore = (shape: Shape): number =>
        Math.min(perSilver(shape) / peakPerSilver, perMerc(shape) / peakPerMerc);
      let balanced: Shape | null = null;
      for (const seedShape of seeds) {
        const candidate = refine(seedShape, balancedScore);
        climbed.push(candidate);
        if (!balanced || balancedScore(candidate) > balancedScore(balanced)) balanced = candidate;
      }
      const bar = {
        silver: engineBalanced?.damagePerSilver ?? 1.56,
        merc: engineBalanced?.damagePerMercenary ?? 705_862,
      };
      report.add(
        `the bar: ${bar.silver.toFixed(2)} a silver **and** ${n(Math.round(bar.merc))} a mercenary, together.`,
      );
      report.add(
        `the pool's peaks: ${peakPerSilver.toFixed(2)} a silver, ${n(Math.round(peakPerMerc))} a mercenary.`,
      );
      if (balanced) {
        report.add(
          `the climbed sweet spot: ${n(Math.round(balanced.total))} damage, ${n(Math.round(balanced.silver))} silver, ` +
            `${n(balanced.mercLost)} mercenaries — **${perSilver(balanced).toFixed(2)} a silver, ` +
            `${n(Math.round(perMerc(balanced)))} a mercenary** (${balanced.K}× ${balanced.depth} rungs at scale ` +
            `${balanced.scale}: ${MERC_IDS.map((id) => `${id.replace(/-6$/, '')} ${balanced?.counts[id] ?? 0}`).join(' · ')})`,
        );
        const beatsBoth = perSilver(balanced) > bar.silver && perMerc(balanced) > bar.merc;
        const mine = `${perSilver(balanced).toFixed(2)} / ${n(Math.round(perMerc(balanced)))}`;
        report.add(
          beatsBoth
            ? `**Yes — it beats the planner's pick on both**, so the planner's pick is a grid artefact: ` +
                `${mine} against ${bar.silver.toFixed(2)} / ${n(Math.round(bar.merc))}.`
            : `No: ${mine} does not clear both (${bar.silver.toFixed(2)} / ${n(Math.round(bar.merc))}). ` +
                `The planner's pick stands as undominated over every shape the sweep reached.`,
        );
      }

      // ── §3 the progression ─────────────────────────────────────────────────────────────────────────
      report.h('§3 What the campaign totals as marches are added');
      const bestByK = new Map<number, Shape>();
      let carry: Shape | undefined;
      for (let K = 1; K <= MAX_MARCHES; K += 1) {
        // Seeds for this K, and every one of them is *scored at this K*: the guard inside the scorer throws
        // out any shape the stock cannot field that many times, so a shape found at one march count is a
        // legitimate seed for a smaller one and an impossible plan for a larger one.
        const seedsForK: Shape[] = [];
        for (const fraction of [1, 0.8, 0.6, 0.4, 0.25]) {
          const counts = Object.fromEntries(
            MERC_IDS.map((id) => [id, Math.round(largestFor(held(id), K) * fraction)]),
          );
          const shape = at(K, counts, 7, 1.5);
          if (shape) seedsForK.push(shape);
        }
        // the shape that won one fewer march, carried forward, plus the swept pool's own winners
        if (carry) {
          const continued = at(K, carry.counts, carry.depth, carry.scale);
          if (continued) seedsForK.push(continued);
        }
        // the pooled winners, thinned: the five fractions above already cover the per-K grid, so the pool
        // contributes only what it uniquely knows — the best total, and the best of each ratio
        const ranked = [...pool].sort((a, b) => b.total - a.total).slice(0, 5);
        const thrifty = [...pool].sort((a, b) => perMerc(b) - perMerc(a)).slice(0, 2);
        const light = [...pool].sort((a, b) => perSilver(b) - perSilver(a)).slice(0, 2);
        for (const swept of [...ranked, ...thrifty, ...light]) {
          const shape = at(K, swept.counts, swept.depth, swept.scale);
          if (shape) seedsForK.push(shape);
        }
        let best: Shape | null = null;
        for (const seedShape of seedsForK) {
          const refined = refine(seedShape, (shape: Shape): number => shape.total, 4);
          if (!best || refined.total > best.total) best = refined;
        }
        if (best) bestByK.set(K, best);
        carry = best ?? carry;
      }
      report.add(
        '| marches | total damage | silver | mercs lost | damage / silver | damage / mercenary | Δ from one fewer | Δ silver | marginal, damage a silver |\n' +
          '|---|---|---|---|---|---|---|---|---|',
      );
      let previous: Shape | undefined;
      for (let K = 1; K <= MAX_MARCHES; K += 1) {
        const shape = bestByK.get(K);
        if (!shape) continue;
        const dDamage = previous ? shape.total - previous.total : 0;
        const dSilver = previous ? shape.silver - previous.silver : 0;
        report.add(
          `| ${K} | ${n(Math.round(shape.total))} | ${n(Math.round(shape.silver))} | ${n(shape.mercLost)} | ` +
            `${perSilver(shape).toFixed(2)} | ${n(Math.round(perMerc(shape)))} | ` +
            `${previous ? n(Math.round(dDamage)) : '—'} | ${previous ? n(Math.round(dSilver)) : '—'} | ` +
            `${previous && dSilver > 0 ? (dDamage / dSilver).toFixed(2) : '—'} |`,
        );
        previous = shape;
      }
      report.add(
        `the shape at each K, so a reader can see the ladder move rather than only the totals: ` +
          [...bestByK.entries()]
            .map(
              ([K, shape]) =>
                `${K}× ${shape.depth} rungs@${shape.scale} (${MERC_IDS.map((id) => shape.counts[id] ?? 0).join('/')})`,
            )
            .join(' · '),
      );

      // ── §4 the curvature ───────────────────────────────────────────────────────────────────────────
      report.h('§4 The curvature, and the sweet spot');
      const series = [...bestByK.entries()]
        .sort((a, b) => a[1].silver - b[1].silver)
        .map(([, shape]) => shape);
      const margins: { from: Shape; to: Shape; marginal: number }[] = [];
      for (let index = 1; index < series.length; index += 1) {
        const from = series[index - 1] as Shape;
        const to = series[index] as Shape;
        if (to.silver - from.silver <= 0) continue;
        margins.push({ from, to, marginal: (to.total - from.total) / (to.silver - from.silver) });
      }
      report.add('| from silver | to silver | damage bought | per silver |\n|---|---|---|---|');
      for (const step of margins) {
        report.add(
          `| ${n(Math.round(step.from.silver))} | ${n(Math.round(step.to.silver))} | ` +
            `${n(Math.round(step.to.total - step.from.total))} | **${step.marginal.toFixed(2)}** |`,
        );
      }
      // Convex or concave: the sign of the change in the marginal itself.
      const falling = margins.filter(
        (step, index) => index > 0 && step.marginal < (margins[index - 1] as { marginal: number }).marginal,
      ).length;
      const rising = margins.length - 1 - falling;
      report.add(
        `the marginal falls at ${falling} of the ${margins.length - 1} steps and rises at ${rising} — ` +
          `${rising === 0 ? '**the curve is concave everywhere**: every extra silver buys less than the one before' : 'the curve is **not** everywhere concave: it has steps where more silver buys *more*, which is where the plan changes shape'}.`,
      );
      const belowOne = margins.find((step) => step.marginal < 1);
      report.add(
        belowOne
          ? `the first slice that buys less than 1 damage a silver starts at ${n(Math.round(belowOne.from.silver))} silver.`
          : 'every slice on this series still buys more than 1 damage a silver.',
      );
      if (balanced) {
        const near = margins
          .map((step) => ({ step, distance: Math.abs(step.from.silver - (balanced?.silver ?? 0)) }))
          .sort((a, b) => a.distance - b.distance)[0];
        if (near)
          report.add(
            `at the sweet spot's own spend (${n(Math.round(balanced.silver))} silver) the going rate is ` +
              `**${near.step.marginal.toFixed(2)} damage a silver**: the last million silver bought about ` +
              `${n(Math.round(near.step.marginal * 1_000_000))} damage, so buying one million *less* costs about that much.`,
          );
      }

      // ── §5 three random shapes ─────────────────────────────────────────────────────────────────────
      report.h('§5 Three random shapes, to show what an average one is');
      let state = 20_260_914;
      const random = (): number => {
        state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
        return state / 2_147_483_648;
      };
      const K = balanced?.K ?? 6;
      const samples: Shape[] = [];
      for (let index = 0; index < 400; index += 1) {
        // sampled inside what K marches can field at all, so the sample is 400 plans and not 400 drawings
        // of which the guard throws most away
        const counts = Object.fromEntries(
          MERC_IDS.map((id) => [id, Math.floor(random() * (largestFor(held(id), K) + 1))]),
        );
        if (MERC_IDS.every((id) => (counts[id] ?? 0) === 0)) continue;
        const shape = at(K, counts, 1 + Math.floor(random() * 8), Math.round((1 + random() * 5) * 100) / 100);
        if (shape) samples.push(shape);
      }
      samples.sort((a, b) => a.total - b.total);
      const middle = samples[Math.floor(samples.length / 2)];
      report.add(
        `${samples.length} random shapes at K = ${K}: total damage from ${n(Math.round(samples[0]?.total ?? 0))} to ` +
          `${n(Math.round(samples[samples.length - 1]?.total ?? 0))}, median ${n(Math.round(middle?.total ?? 0))} ` +
          `(damage a silver ${perSilver(samples[0] as Shape).toFixed(2)}–${perSilver(samples[samples.length - 1] as Shape).toFixed(2)}, ` +
          `median ${middle ? perSilver(middle).toFixed(2) : '—'}).`,
      );
      report.add(
        '| # | shape | total damage | silver | damage / silver | damage / mercenary |\n|---|---|---|---|---|---|',
      );
      for (const index of [0, Math.floor(samples.length / 2), samples.length - 1]) {
        const shape = samples[index] as Shape;
        report.add(
          `| ${shape === samples[0] ? 'worst' : shape === middle ? 'median' : 'best'} | ${shape.K}× ${shape.depth} rungs@${shape.scale} ` +
            `(${MERC_IDS.map((id) => shape.counts[id] ?? 0).join('/')}) | ${n(Math.round(shape.total))} | ` +
            `${n(Math.round(shape.silver))} | ${perSilver(shape).toFixed(2)} | ${n(Math.round(perMerc(shape)))} |`,
        );
      }
      report.add(
        'The median random shape is nowhere near the frontier — the picks are the top of a very thin tail, not ' +
          'the middle of a flat field. That is why they have to come from a search and not from intuition.',
      );

      report.save();
    });
  },
  900_000,
);
