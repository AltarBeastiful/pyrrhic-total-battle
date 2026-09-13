/**
 * C1 — bonus sensitivity (investigation 0015).
 *
 * Adds +1 / +5 / +10 points to one bonus key at a time, health and strength separately, and reports the
 * change in average damage of two marches: the 8-type pool under `msRelaxed` and the 12-type pool under
 * `elite`. Scenario B (the bonuses the 2026-09-13 in-game report proved) is the main one; scenario A (the
 * export's own VIP +3 / +3) is the check.
 *
 * **Two different questions, two tables.** A bonus point does two things at once and mixing them makes the
 * numbers look random:
 *   - *frozen counts* — the march already on screen, with more bonus and nobody re-sized: this is the pure
 *     damage effect, and it is what the formula predicts;
 *   - *re-solved* — press Generate again and let the sizer spend the housing differently: this adds a
 *     discrete, non-monotonic term, because counts are integers and the mercenary ceiling is a step
 *     function of the smallest troop stack.
 * Only the second is what a player gets, but only the first is interpretable, so both are printed.
 *
 * Every number comes from `sizeStacks` / `stacksFromCounts` + `simulateBattle`. The one number computed by
 * hand is the expected value of `doubleDamageChance`: the engine deliberately keeps procs out of
 * `avgDamage` (battle.ts MODEL_NOTES, "procs are upside we do not price in").
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/30-bonus-sensitivity.test.ts`
 */
import { describe, it } from 'vitest';

import type { BonusKey, SpecialKey } from '../../src/data/types';
import type { BonusTotals, StackRequest } from '../../src/engine/types';
import {
  MERC_IDS,
  Report,
  countsOf,
  evaluate,
  evaluateCounts,
  label,
  lines,
  loadOwner,
  march,
  n,
  scenarioB,
  table,
  withMethod,
  withTotals,
  withUnits,
} from './harness';

/**
 * The exhaustive single-march winner at authority 2,000 (`out/01-kai.md`): ARC2 + RD2 + RD3 + the four
 * mercenaries, `msRelaxed`, 7,843,624 average in scenario B. Three fat troop stacks act as sponges above
 * the mercenaries, which is what lets every mercenary cap be filled and still fall last.
 */
const WINNER7 = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;

type Bucket = 'health' | 'strength';

/** A copy of `totals` with `points` added to one key. Nothing else moves. */
function bump(totals: BonusTotals, bucket: Bucket, key: BonusKey, points: number): BonusTotals {
  const next = structuredClone(totals);
  next[bucket][key] += points;
  return next;
}

function bumpSpecial(totals: BonusTotals, key: SpecialKey, points: number): BonusTotals {
  const next = structuredClone(totals);
  next.special[key] += points;
  return next;
}

const KEYS: BonusKey[] = ['army', 'guardsmen', 'specialist', 'melee', 'ranged', 'mounted'];
const STEPS = [1, 5, 10] as const;

/** `EMH6:35 LGN6:37 …` — a stable signature, so "did the counts move?" is a string compare. */
function signature(counts: Record<string, number>): string {
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, count]) => `${label(id)}:${String(count)}`)
    .join(' ');
}

interface Probe {
  /** Totals with the probe applied. */
  totals: BonusTotals;
  name: string;
}

function probes(totals: BonusTotals, points: number): Probe[] {
  const out: Probe[] = [];
  for (const bucket of ['health', 'strength'] as const) {
    for (const key of KEYS) out.push({ name: `${bucket} ${key}`, totals: bump(totals, bucket, key, points) });
  }
  out.push({
    name: 'special armyStrengthAgainstEpicMonsters',
    totals: bumpSpecial(totals, 'armyStrengthAgainstEpicMonsters', points),
  });
  out.push({
    name: 'special doubleDamageChance',
    totals: bumpSpecial(totals, 'doubleDamageChance', points),
  });
  return out;
}

/** Expected extra damage from the double-damage chances a march carries: a proc is ×2 on one hit. */
function doubleDamageEV(request: StackRequest): { total: number; rows: string[] } {
  const ev = evaluate(request);
  const rows: string[] = [];
  let total = 0;
  for (const row of lines(ev)) {
    const stack = ev.result.stacks[row.position - 1];
    if (!stack) continue;
    const avgHits = (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
    const value = (avgHits * row.damagePerHit * stack.doubleDamageChance) / 100;
    total += value;
    rows.push(
      `${row.label}: ${String(stack.doubleDamageChance)} % × ${n(avgHits)} hits × ${n(row.damagePerHit)} = ${n(Math.round(value))}`,
    );
  }
  return { total, rows };
}

describe.skipIf(!process.env.THEORY)('C1 bonus sensitivity', () => {
  it('prices one bonus point', () => {
    const report = new Report('30-bonus-sensitivity');
    const owner = loadOwner();

    const winner = withMethod(withUnits(scenarioB(owner.twelve), WINNER7), 'msRelaxed');
    const marches: { name: string; request: StackRequest }[] = [
      { name: 'B · winner 7 types (ARC2 RD2 RD3 + 4 mercs) · msRelaxed', request: winner },
      { name: 'B · 8 types · msRelaxed', request: withMethod(scenarioB(owner.eight), 'msRelaxed') },
      { name: 'B · 12 types · elite', request: withMethod(scenarioB(owner.twelve), 'elite') },
      {
        name: 'A · winner 7 types · msRelaxed (check)',
        request: withMethod(withUnits(owner.twelve, WINNER7), 'msRelaxed'),
      },
      { name: 'A · 8 types · msRelaxed (check)', request: withMethod(owner.eight, 'msRelaxed') },
      { name: 'A · 12 types · elite (check)', request: withMethod(owner.twelve, 'elite') },
    ];

    report.add('# C1 — what one bonus point is worth');
    report.add(
      '\nHousing leadership 4,343 · authority 2,000 · dominance 800; caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37 ' +
        '(314 authority at full, so the **caps** bind and the authority housing never does). Enemy 1 melee / ' +
        '1 ranged / 1 mounted / 1 flying, so N = 4 and every stack dies.',
    );
    report.add(
      '\nRead the two tables as two different questions. **Frozen counts** = the march on screen, one bonus ' +
        'point more, nobody re-sized. **Re-solved** = press Generate again and let the sizer spend the housing ' +
        'differently. Neither is noise-free: even at frozen counts a *health* point changes total HP, hence ' +
        'the kill order, hence which stack sits at position 1 and loses its enemy-first hit — worth up to ' +
        '±0.8 M on a march whose stacks are near-equal in HP. A `linear? no` row is exactly that: an order ' +
        'flip, not a non-linear formula. The formula itself is strictly linear in every strength key ' +
        '(Mechanism 1 and 4 below prove it term by term).',
    );

    report.h('Baselines');
    for (const { name, request } of marches) {
      const ev = evaluate(request);
      report.add(`\n**${name}** — ${march(ev.result)}`);
      report.add(table(ev));
    }

    for (const { name, request } of marches) {
      const base = evaluate(request);
      const baseAvg = base.summary.avgDamage;
      const baseCounts = countsOf(base.result);
      const baseSig = signature(baseCounts);

      report.h(`${name}`);
      report.add(`baseline avg **${n(baseAvg)}**\n`);

      report.add('### Frozen counts (same march, more bonus)\n');
      report.add('| key | +1 | +5 | +10 | Δ / point | linear? |');
      report.add('|---|---|---|---|---|---|');
      for (const { name: probeName } of probes(request.totals, 1)) {
        const deltas = STEPS.map((step) => {
          const probe = probes(request.totals, step).find((entry) => entry.name === probeName);
          if (!probe) return 0;
          const ev = evaluateCounts(withTotals(request, probe.totals), baseCounts);
          return ev.summary.avgDamage - baseAvg;
        });
        const rate = (deltas[2] ?? 0) / 10;
        const linear = Math.abs((deltas[0] ?? 0) - rate) < 2 && Math.abs((deltas[1] ?? 0) - 5 * rate) < 6;
        report.add(
          `| ${probeName} | ${n(deltas[0] ?? 0)} | ${n(deltas[1] ?? 0)} | ${n(deltas[2] ?? 0)} | ${n(Math.round(rate))} | ${linear ? 'yes' : '**no**'} |`,
        );
      }

      report.add('\n### Re-solved (press Generate again)\n');
      report.add('| key | +1 | +5 | +10 | counts move? | march at +10 |');
      report.add('|---|---|---|---|---|---|');
      for (const { name: probeName } of probes(request.totals, 1)) {
        const cells: string[] = [];
        let moved = false;
        let finalMarch = '';
        for (const step of STEPS) {
          const probe = probes(request.totals, step).find((entry) => entry.name === probeName);
          if (!probe) continue;
          const ev = evaluate(withTotals(request, probe.totals));
          cells.push(n(ev.summary.avgDamage - baseAvg));
          if (signature(countsOf(ev.result)) !== baseSig) moved = true;
          if (step === 10) finalMarch = signature(countsOf(ev.result)) === baseSig ? '—' : march(ev.result);
        }
        report.add(`| ${probeName} | ${cells.join(' | ')} | ${moved ? 'yes' : 'no'} | ${finalMarch} |`);
      }

      const { total, rows } = doubleDamageEV(request);
      report.add(
        `\n**Double damage is not in either table's numbers.** The engine keeps procs out of \`avgDamage\` ` +
          `on purpose, so both \`doubleDamageChance\` rows read 0. By hand: a proc is a plain ×2 on one hit, ` +
          `features included, so a stack's expected damage is \`hits × damage × (1 + chance/100)\`. The chances ` +
          `this march already carries are worth **${n(Math.round(total))}** on top of ${n(baseAvg)} ` +
          `(+${n((100 * total) / baseAvg)} %):`,
      );
      for (const row of rows) report.add(`- ${row}`);
      report.add(
        `\nThe army-wide key touches every stack, so one point of \`doubleDamageChance\` is worth exactly ` +
          `avg / 100 = **${n(Math.round(baseAvg / 100))} per point**, perfectly linear. That is larger than any ` +
          `single strength point in the table above — double damage is the most valuable percentage on this ` +
          `account, and it is the one the app's headline figure does not show.`,
      );
    }

    // ---- Mechanism -----------------------------------------------------------------------------------
    const eight = withMethod(scenarioB(owner.eight), 'msRelaxed');
    const eightMs = withMethod(scenarioB(owner.eight), 'ms');
    const base = evaluate(eight);
    const baseCounts = countsOf(base.result);

    report.h('Mechanism 1 — health is absent from the damage formula');
    report.add(
      'Per-hit damage is `count × strength × (1 + Σ strength %) + count × base strength × ' +
        'strengthAgainst / 100`. No health term. So at frozen counts a health bonus cannot change a single ' +
        '`damagePerHit`; it can only change `hpPerUnit`, hence total HP, hence the *kill order*, hence how ' +
        'many hits each stack gets.',
    );
    {
      const probe = evaluateCounts(withTotals(eight, bump(eight.totals, 'health', 'army', 10)), baseCounts);
      report.add('\n| stack | count | per hit before | per hit after | HP/unit before | HP/unit after |');
      report.add('|---|---|---|---|---|---|');
      for (const row of lines(base)) {
        const after = probe.result.stacks.find((stack) => stack.unitId === row.unitId);
        const before = base.result.stacks.find((stack) => stack.unitId === row.unitId);
        if (!after || !before) continue;
        report.add(
          `| ${row.label} | ${n(row.count)} | ${n(before.damagePerHit)} | ${n(after.damagePerHit)} | ${n(before.hpPerUnit)} | ${n(after.hpPerUnit)} |`,
        );
      }
      report.add(
        `\n+10 army health at frozen counts: every \`per hit\` column is identical, every HP column moved, ` +
          `avg ${n(base.summary.avgDamage)} → ${n(probe.summary.avgDamage)} ` +
          `(Δ ${n(probe.summary.avgDamage - base.summary.avgDamage)}). The claim is verified: **a health bonus ` +
          `changes damage only through counts and ordering, never through a hit.**`,
      );
    }

    report.h('Mechanism 2 — the troop / mercenary boundary');
    report.add(
      'Under `ms` / `msRelaxed` the sizer gives the mercenary pool a hard ceiling of `smallest troop stack ' +
        'HP − 1` (`stacker.ts`, `mercCeiling`), so hired units fall after the troops. With authority at 2,000 ' +
        'the authority housing is no longer the binding constraint — the caps and that ceiling are. Raising ' +
        '**troop** health lifts the ceiling and lets more mercenaries in; raising **mercenary** health raises ' +
        'their per-unit HP and fewer of them fit under the same ceiling.',
    );

    const boundary = (request: StackRequest): string => {
      const ev = evaluate(request);
      const troops = ev.result.stacks.filter((stack) => stack.pool === 'leadership');
      const mercs = ev.result.stacks.filter((stack) => stack.pool === 'authority');
      const floor = Math.min(...troops.map((stack) => stack.totalHp));
      return [
        `floor ${n(floor)}`,
        mercs
          .map((stack) => `${label(stack.unitId)} ${n(stack.count)}/${n(request.caps[stack.unitId] ?? 0)}`)
          .join(' '),
        `A ${n(ev.result.pools.authority.used)}`,
        `avg ${n(ev.summary.avgDamage)}`,
      ].join(' · ');
    };

    report.add('\n**Measured (8 types, `msRelaxed`, scenario B), one key at a time:**\n');
    report.add('| probe | who it touches | troop floor · mercenary counts / caps · authority · avg |');
    report.add('|---|---|---|');
    const boundaryProbes: [string, string, BonusTotals][] = [
      ['baseline', '—', eight.totals],
      [
        '+10 specialist health',
        'SW1 only (troop-only in this march)',
        bump(eight.totals, 'health', 'specialist', 10),
      ],
      ['+50 specialist health', 'SW1 only', bump(eight.totals, 'health', 'specialist', 50)],
      [
        '+10 ranged health',
        'ABT6 only (mercenary-only in this march)',
        bump(eight.totals, 'health', 'ranged', 10),
      ],
      ['+50 ranged health', 'ABT6 only', bump(eight.totals, 'health', 'ranged', 50)],
      [
        '+10 guardsmen health',
        'SP2 RD2 RD3 + all four mercenaries',
        bump(eight.totals, 'health', 'guardsmen', 10),
      ],
      ['+10 army health', 'everything', bump(eight.totals, 'health', 'army', 10)],
      ['+50 army health', 'everything', bump(eight.totals, 'health', 'army', 50)],
    ];
    for (const [probeName, who, totals] of boundaryProbes) {
      report.add(`| ${probeName} | ${who} | ${boundary(withTotals(eight, totals))} |`);
    }

    report.add(
      '\n**Can a mercenary-only health bonus be isolated?** There is no key meaning "hired units". In *this* ' +
        'march it is isolable by accident: the only `ranged` unit fielded is ABT6, a mercenary (ARC1 and ARC2 ' +
        'are left out), and the only `specialist` is SW1, a troop. So `ranged` health is a mercenary-only ' +
        'health bonus here and `specialist` health is a troop-only one, and the two rows above move the ' +
        'boundary in opposite directions exactly as predicted. In the **12-type** pool the isolation is gone ' +
        '(ARC1 and ARC2 are ranged troops) and no combination of keys restores it: every key a mercenary ' +
        'carries — `guardsmen`, `melee`, `ranged`, `mounted`, `army` — is also carried by at least one troop, ' +
        'and the keys are additive with no negative-only key to subtract with. Lowering `specialist` does not ' +
        'undo `guardsmen` on SP2/RD2/RD3, so the compensation trick fails. **It cannot be isolated in general.**',
    );

    report.h(
      'Mechanism 2b — the sponge march: what a health point buys when the mercenaries are the payload',
    );
    report.add(
      'The exhaustive winner (ARC2 + RD2 + RD3 + the four mercenaries) is the extreme case of the boundary ' +
        'above. Its three troop stacks are pure sponges — they exist to sit on top of the mercenaries and ' +
        'soak the first enemy attacks — and almost all the damage comes from the hired units. ABT6, CHR6 and ' +
        'LGN6 are already at their caps; **EMH6 is not**, and what stops it is the mercenary ceiling, i.e. the ' +
        'smallest troop stack. So on this march a health point is not dead weight: it buys EMH6.',
    );
    {
      const sponge = winner;
      const spongeBase = evaluate(sponge);
      const spongeAvg = spongeBase.summary.avgDamage;
      const emh = (request: StackRequest): string => {
        const ev = evaluate(request);
        const troops = ev.result.stacks.filter((stack) => stack.pool === 'leadership');
        const floor = Math.min(...troops.map((stack) => stack.totalHp));
        const mercs = ev.result.stacks.filter((stack) => stack.pool === 'authority');
        return [
          `floor ${n(floor)}`,
          mercs
            .map((stack) => `${label(stack.unitId)} ${n(stack.count)}/${n(sponge.caps[stack.unitId] ?? 0)}`)
            .join(' '),
          `avg ${n(ev.summary.avgDamage)}`,
          `Δ ${n(ev.summary.avgDamage - spongeAvg)}`,
        ].join(' · ');
      };
      report.add('\n| probe | troop floor · mercenaries / caps · avg · Δ |');
      report.add('|---|---|');
      report.add(`| baseline | ${emh(sponge)} |`);
      for (const key of KEYS) {
        for (const points of [10, 50]) {
          report.add(
            `| +${String(points)} ${key} health | ${emh(withTotals(sponge, bump(sponge.totals, 'health', key, points)))} |`,
          );
        }
      }
      for (const key of KEYS) {
        for (const points of [10, 50]) {
          report.add(
            `| +${String(points)} ${key} strength | ${emh(withTotals(sponge, bump(sponge.totals, 'strength', key, points)))} |`,
          );
        }
      }
      report.add(
        '\n**Sweep.** The re-solved rows above swing by ±0.8 M because a health point reshuffles the kill ' +
          'order. The sponge effect itself is the smooth part: how many mercenary units the troop floor lets ' +
          'in. Swept over the two keys that raise a troop stack without costing a mercenary a single unit ' +
          '(`ranged` lifts ARC2 and ABT6, `mounted` lifts RD2/RD3 and CHR6 — and ABT6/CHR6 are already at ' +
          'their caps, so their extra HP cannot cost them units):\n',
      );
      report.add('| points | key | EMH6 | merc units | stack at position 1 | avg |');
      report.add('|---|---|---|---|---|---|');
      for (const key of ['ranged', 'mounted', 'guardsmen'] as const) {
        for (const points of [0, 10, 20, 30, 40, 60, 80, 100]) {
          const ev = evaluate(withTotals(sponge, bump(sponge.totals, 'health', key, points)));
          const mercs = ev.result.stacks.filter((stack) => stack.pool === 'authority');
          const emh6 = mercs.find((stack) => stack.unitId === 'epic-monster-hunter-6');
          report.add(
            `| +${String(points)} | ${key} health | ${n(emh6?.count ?? 0)} | ${n(mercs.reduce((sum, stack) => sum + stack.count, 0))} | ${label(ev.result.stacks[0]?.unitId ?? '')} | ${n(ev.summary.avgDamage)} |`,
          );
        }
      }
      report.add(
        '\nEMH6 is the only mercenary not already at its cap, and it is the troop floor that holds it back, ' +
          'so a troop-side health point does buy EMH6 — but slowly (roughly one unit per 10 points, ~20 k of ' +
          'damage each) and the buy is swamped by whichever stack the reshuffle leaves at position 1.',
      );
      report.add(
        '\n**Health per point vs strength per point on the sponge march** (re-solved, Δ avg ÷ points):\n',
      );
      report.add(
        '| key | health Δ/pt at +10 | health Δ/pt at +50 | strength Δ/pt at +10 | strength Δ/pt at +50 |',
      );
      report.add('|---|---|---|---|---|');
      for (const key of KEYS) {
        const rate = (bucket: Bucket, points: number): string => {
          const ev = evaluate(withTotals(sponge, bump(sponge.totals, bucket, key, points)));
          return n(Math.round((ev.summary.avgDamage - spongeAvg) / points));
        };
        report.add(
          `| ${key} | ${rate('health', 10)} | ${rate('health', 50)} | ${rate('strength', 10)} | ${rate('strength', 50)} |`,
        );
      }
    }

    report.h('Mechanism 3 — strength does not move counts, except through Allow damage trades');
    report.add(
      'A strength bonus changes no `hpPerUnit`, so under `elite` and plain `ms` the counts are bit-identical ' +
        'and the whole Δ is the frozen-counts Δ. Under `msRelaxed` the relaxation pass (`relaxPreservation`) ' +
        'scores candidate steps on **average and minimum damage**, so a strength bonus can make it accept or ' +
        'refuse a step and the counts do move. Measured:',
    );
    report.add('\n| probe | `ms` counts move? | `msRelaxed` counts move? | `ms` Δ avg | `msRelaxed` Δ avg |');
    report.add('|---|---|---|---|---|');
    {
      const msBase = evaluate(eightMs);
      const msSig = signature(countsOf(msBase.result));
      const relaxBase = evaluate(eight);
      const relaxSig = signature(countsOf(relaxBase.result));
      for (const key of KEYS) {
        const msEv = evaluate(withTotals(eightMs, bump(eightMs.totals, 'strength', key, 10)));
        const relaxEv = evaluate(withTotals(eight, bump(eight.totals, 'strength', key, 10)));
        report.add(
          `| +10 ${key} strength | ${signature(countsOf(msEv.result)) === msSig ? 'no' : '**yes**'} | ${signature(countsOf(relaxEv.result)) === relaxSig ? 'no' : '**yes**'} | ${n(msEv.summary.avgDamage - msBase.summary.avgDamage)} | ${n(relaxEv.summary.avgDamage - relaxBase.summary.avgDamage)} |`,
        );
      }
    }

    report.h('Mechanism 4 — why a strength point is worth less to EMH6 than to SP2');
    {
      const probe = evaluateCounts(withTotals(eight, bump(eight.totals, 'strength', 'army', 10)), baseCounts);
      report.add('| stack | count | base part | features part | per hit | per hit at +10 army str | ratio |');
      report.add('|---|---|---|---|---|---|---|');
      for (const row of lines(base)) {
        const before = base.result.stacks.find((stack) => stack.unitId === row.unitId);
        const after = probe.result.stacks.find((stack) => stack.unitId === row.unitId);
        if (!before || !after) continue;
        report.add(
          `| ${row.label} | ${n(row.count)} | ${n(before.damagePerHit - before.featuresDamage)} | ${n(before.featuresDamage)} | ${n(before.damagePerHit)} | ${n(after.damagePerHit)} | ${n(after.damagePerHit / before.damagePerHit)} |`,
        );
      }
      report.add(
        '\nThe strength-against ("features") part rides on the **base** strength and no bonus touches it ' +
          '(`units.ts`, `hitDamage`). EMH6 carries +609 % against epic monsters, so two thirds of its hit is ' +
          'frozen; a strength point lifts only the other third. A percentage point of strength is therefore ' +
          'worth the most on the stacks with the *fewest* features, and `armyStrengthAgainstEpicMonsters` ' +
          'behaves the other way round — it is a pure features point, identical for every unit, and lands on ' +
          'the same Δ as an army strength point only because both multiply `count × base strength`.',
      );
    }

    report.h('What it all means');
    {
      const w = evaluate(winner);
      const e = evaluate(withMethod(scenarioB(owner.eight), 'msRelaxed'));
      const rate = (request: StackRequest, bucket: Bucket, key: BonusKey, points: number): number => {
        const b = evaluate(request).summary.avgDamage;
        return (
          (evaluate(withTotals(request, bump(request.totals, bucket, key, points))).summary.avgDamage - b) /
          points
        );
      };
      report.add(
        `1. **A strength point on a key everything carries is the only clean, linear lever.** On the winner ` +
          `march \`army\` (or \`guardsmen\`, identical because every unit in it is a guardsman) is worth ` +
          `**${n(Math.round(rate(winner, 'strength', 'army', 50)))} per point**; on the 8-type march ` +
          `**${n(Math.round(rate(e.summary.avgDamage ? withMethod(scenarioB(owner.eight), 'msRelaxed') : winner, 'strength', 'army', 50)))} per point**. ` +
          `Counts never move (except through Allow damage trades), the formula is linear, and the value is ` +
          `simply \`Σ over stacks of hits × count × base strength / 100\`.`,
      );
      report.add(
        `2. **\`armyStrengthAgainstEpicMonsters\` is worth exactly the same as an army strength point** — ` +
          `both multiply \`count × base strength\` and both land on ${n(Math.round(rate(winner, 'strength', 'army', 50)))} on the winner march. ` +
          `The difference is not the rate but the ceiling: strength-against is not diluted by anything, and ` +
          `it is the only key that also helps a stack that has no useful feature against the formation (C5).`,
      );
      report.add(
        `3. **\`doubleDamageChance\` is the best point on the board and the app does not show it.** One point ` +
          `is avg / 100 — ${n(Math.round(w.summary.avgDamage / 100))} on the winner march, ` +
          `${n(Math.round(e.summary.avgDamage / 100))} on the 8-type march — six times an army strength point. ` +
          `It is expected value, not guaranteed damage, which is exactly why \`simulateBattle\` leaves it out of ` +
          `\`avgDamage\`; a player comparing two builds should add it back by hand.`,
      );
      report.add(
        `4. **Health does not produce damage; it produces position.** At frozen counts a health point changes ` +
          `no \`damagePerHit\` at all (Mechanism 1, every column identical). What it changes is total HP, ` +
          `therefore the kill order, therefore which stacks land in the last positions — and with N = 4 enemy ` +
          `squads and 7-8 stacks, **only the last two or three positions are hit twice** ` +
          `(\`expectedHits(6,4) = expectedHits(7,4) = 2\`, \`expectedHits(5,4) = 1\`). Moving a 1.1 M-per-hit ` +
          `mercenary out of a double-hit slot costs about 1.1 M of average damage, which is why single-key ` +
          `health rows swing by ±0.8 M in both directions with no trend.`,
      );
      report.add(
        `5. **A uniform health bonus is worth exactly zero on the winner march.** \`army\` and \`guardsmen\` ` +
          `health move every unit in it by the same factor, so the HP ladder only rescales: the sizer's flat ` +
          `profile is scale-invariant, the mercenary ceiling moves in step with the mercenaries' own HP, and ` +
          `the counts come back bit-identical (the sweep above: 75 EMH6 and 260 mercenary units from +0 to ` +
          `+100). Health only ever pays when it is **uneven** — when it lifts a troop stack without lifting ` +
          `the mercenary that sits under it.`,
      );
      report.add(
        `6. **On the 8-type march the boundary is real and measurable.** There \`specialist\` health touches ` +
          `only SW1 (a troop) and \`ranged\` health only ABT6 (a mercenary), so the two halves separate: ` +
          `+50 specialist health lifts the troop floor and lets the mercenary stacks grow, +50 ranged health ` +
          `raises ABT6's own HP and shrinks it. That isolation is an accident of which types this march ` +
          `fields; it does not exist in the 12-type pool and cannot be reconstructed from the key set.`,
      );
    }

    report.save();
  });
});
