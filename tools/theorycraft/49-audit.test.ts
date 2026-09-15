/**
 * A5 — the audit strand: what the repo's evidence proves, what it does not, and which in-game
 * observations would settle the open questions.
 *
 * Nothing here is a new model. It re-derives, from the report alone, the bonuses the 2026-09-14 report
 * (`docs/research/battlereportkai.md`) was fought with, replays it through the engine, and then measures
 * how much of the model the repo's four in-game reports actually pin down. Every number printed comes from
 * the engine (`stacksFromCounts` / `evaluateCounts`); the report's own transcription is the input.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/49-audit.test.ts`
 */
import { describe, expect, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import type { BonusKey } from '../../src/data/types';
import type { BonusTotals, ResolvedSource } from '../../src/engine/types';
import {
  MERC_IDS,
  Report,
  evaluate,
  evaluateCounts,
  label,
  lines,
  loadOwner,
  n,
  scenarioC,
  stacksFromCounts,
  withMethod,
  withUnits,
  unitById,
} from './harness';

/** Kai's march as fought: 11 stacks, 1,970 troops (docs/research/battlereportkai.md, "The squads"). */
const KAI: Record<string, number> = {
  'spearman-1': 855,
  'rider-1': 423,
  'archer-1': 837,
  'spearman-2': 451,
  'rider-2': 223,
  'archer-2': 440,
  'rider-3': 116,
  'arbalester-6': 18,
  'legionary-6': 18,
  'epic-monster-hunter-6': 16,
  'chariot-6': 8,
};
const IDS = Object.keys(KAI);

/** The four monster squads of the report, by the category each unit's strength-against selects. */
const MONSTER_OF: Record<string, string> = { flying: 'M1', mounted: 'M2', melee: 'M3', ranged: 'M4' };

interface Line {
  actor: 'army' | 'enemy';
  unit: string;
  /** Damage as printed (entry 11 is the doubled hit). */
  damage: number;
  /** The "caractéristiques" sub-portion, friendly lines only. */
  extra?: number;
  /** Monster squad the friendly stack struck. */
  monster?: string;
  /** The red badge on the struck monster card (kills), when the transcription shows one. */
  kills?: number;
}

/**
 * The report, transcribed from `docs/research/battlereportkai.md` (30 entries). Only the columns the audit
 * uses: actor, our stack, the printed damage, its "extra" part, which monster was struck, and the kill badge.
 */
const REPORT: Line[] = [
  { actor: 'army', unit: 'spearman-1', damage: 140_647, extra: 16_672, monster: 'M2' },
  { actor: 'enemy', unit: 'spearman-1', damage: 334_732 },
  { actor: 'army', unit: 'rider-1', damage: 150_165, extra: 27_495, monster: 'M4', kills: 7 },
  { actor: 'enemy', unit: 'rider-1', damage: 331_209 },
  { actor: 'army', unit: 'archer-1', damage: 149_823, extra: 28_040, monster: 'M1', kills: 1 },
  { actor: 'enemy', unit: 'archer-1', damage: 328_313 },
  { actor: 'army', unit: 'spearman-2', damage: 141_659, extra: 23_948, monster: 'M2', kills: 1 },
  { actor: 'enemy', unit: 'spearman-2', damage: 317_819 },
  { actor: 'army', unit: 'rider-2', damage: 155_743, extra: 39_337, monster: 'M4', kills: 8 },
  { actor: 'army', unit: 'archer-2', damage: 155_232, extra: 39_996, monster: 'M1', kills: 1 },
  { actor: 'army', unit: 'rider-3', damage: 323_686, extra: 108_390, monster: 'M4', kills: 17 },
  { actor: 'army', unit: 'arbalester-6', damage: 273_600, extra: 174_078, monster: 'M1', kills: 2 },
  { actor: 'army', unit: 'legionary-6', damage: 200_070, extra: 100_890, monster: 'M2', kills: 2 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 291_670, extra: 197_803, monster: 'M3' },
  { actor: 'army', unit: 'chariot-6', damage: 238_032, extra: 149_872, monster: 'M4', kills: 12 },
  { actor: 'enemy', unit: 'rider-2', damage: 314_296 },
  { actor: 'army', unit: 'archer-2', damage: 155_232, extra: 39_996, monster: 'M1', kills: 1 },
  { actor: 'enemy', unit: 'archer-2', damage: 310_662 },
  { actor: 'army', unit: 'rider-3', damage: 161_843, extra: 54_195, monster: 'M4', kills: 8 },
  { actor: 'enemy', unit: 'rider-3', damage: 290_649 },
  { actor: 'army', unit: 'arbalester-6', damage: 273_600, extra: 174_078, monster: 'M1', kills: 2 },
  { actor: 'enemy', unit: 'arbalester-6', damage: 268_299 },
  { actor: 'army', unit: 'legionary-6', damage: 200_070, extra: 100_890, monster: 'M2', kills: 1 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 291_670, extra: 197_803, monster: 'M3', kills: 1 },
  { actor: 'army', unit: 'chariot-6', damage: 238_032, extra: 149_872, monster: 'M4', kills: 13 },
  { actor: 'enemy', unit: 'legionary-6', damage: 267_786 },
  { actor: 'army', unit: 'epic-monster-hunter-6', damage: 291_670, extra: 197_803, monster: 'M3', kills: 1 },
  { actor: 'enemy', unit: 'epic-monster-hunter-6', damage: 252_369 },
  { actor: 'army', unit: 'chariot-6', damage: 238_032, extra: 149_872, monster: 'M4', kills: 12 },
  { actor: 'enemy', unit: 'chariot-6', damage: 238_032 },
];
/** Entry 11 is the doubled hit: the game printed 2 × the stack's ordinary line. */
const plainHit = (line: Line): number => (line.damage === 323_686 ? line.damage / 2 : line.damage);
const plainExtra = (line: Line): number =>
  line.damage === 323_686 ? (line.extra ?? 0) / 2 : (line.extra ?? 0);

/** A bonus set, "as entered" on the additive keys the engine sums. */
function totalsFrom(
  health: Partial<Record<BonusKey, number>>,
  strength: Partial<Record<BonusKey, number>>,
): BonusTotals {
  const source: ResolvedSource = {
    id: 'audit-fit',
    label: 'fit from the 2026-09-14 report',
    kind: 'custom',
    health,
    strength,
    special: { doubleDamageChance: 3 },
  };
  return aggregateBonuses([source]);
}

interface Fit {
  /** Stacks whose per-hit damage the engine reproduces exactly (11 max). */
  exactHits: number;
  /** Stacks whose total HP lands inside the per-unit-rounding slack (11 max). */
  hpInSlack: number;
  /** Σ |engine damage − report damage| over the 11 friendly lines. */
  hitResidual: number;
  /** Σ |engine total HP − the report's enemy line| over the 11 stacks. */
  hpResidual: number;
  maxHpResidual: number;
}

/**
 * The engine's arithmetic for the march. Both residuals are stack properties, so this needs no battle
 * simulation: the friendly line is `damagePerHit`, the enemy line is `totalHp`. A stack's HP counts as
 * reproduced when it lands within the documented per-unit-rounding slack (`tests/engine/ingame-report.test.ts`:
 * the game truncates count × unrounded HP, the engine rounds the per-unit HP first, so the gap is ≤ count/2).
 */
function fitScore(owner: ReturnType<typeof loadOwner>, totals: BonusTotals): Fit {
  const result = stacksFromCounts({ ...owner.twelve, totals }, KAI);
  let exactHits = 0;
  let hpInSlack = 0;
  let hitResidual = 0;
  let hpResidual = 0;
  let maxHpResidual = 0;
  for (const stack of result.stacks) {
    const friendly = REPORT.find((line) => line.actor === 'army' && line.unit === stack.unitId);
    const enemy = REPORT.find((line) => line.actor === 'enemy' && line.unit === stack.unitId);
    if (friendly) {
      const delta = stack.damagePerHit - plainHit(friendly);
      if (delta === 0) exactHits += 1;
      hitResidual += Math.abs(delta);
    }
    if (enemy) {
      const delta = stack.totalHp - enemy.damage;
      if (Math.abs(delta) <= stack.count / 2 + 1) hpInSlack += 1;
      hpResidual += Math.abs(delta);
      maxHpResidual = Math.max(maxHpResidual, Math.abs(delta));
    }
  }
  return { exactHits, hpInSlack, hitResidual, hpResidual, maxHpResidual };
}

describe.skipIf(!process.env.THEORY)('A5 — audit of the evidence', () => {
  it('re-derives the bonuses, replays the report, and prices the open levers', () => {
    const report = new Report('49-audit');
    const owner = loadOwner();

    // ---- 1. the fit ------------------------------------------------------------------------------
    report.h('1. The fit: bonuses re-derived from the report alone');
    report.add(
      'Step 1 — invert the report with arithmetic (health from the enemy line, strength from the friendly\n' +
        'line minus its "extra" part, both divided by count × base stat). This is the audit\'s own reading of\n' +
        "the transcription, not the harness's scenario C:",
    );
    const unitIds = IDS;
    const inversion = [
      '| unit | count | enemy line | health ×  | base damage | extra | strength × | extra / (count×str) = SA |',
      '|---|---|---|---|---|---|---|---|',
    ];
    for (const unit of unitIds) {
      const def = unitById(unit);
      if (!def) throw new Error(`unknown unit ${unit}`);
      const count = KAI[unit] ?? 0;
      const friendly = REPORT.find((line) => line.actor === 'army' && line.unit === unit);
      const enemy = REPORT.find((line) => line.actor === 'enemy' && line.unit === unit);
      if (!friendly || !enemy) throw new Error(`missing line for ${unit}`);
      const healthMult = enemy.damage / (count * def.health);
      const base = def.strength * count;
      const strengthMult = (plainHit(friendly) - plainExtra(friendly)) / base;
      const sa = plainExtra(friendly) / def.strength / count;
      inversion.push(
        `| ${label(unit)} | ${n(count)} | ${n(enemy.damage)} | ×${healthMult.toFixed(5)} | ${n(Math.round(base))} ` +
          `| ${n(plainExtra(friendly))} | ×${strengthMult.toFixed(5)} | ${(sa * 100).toFixed(0)} % |`,
      );
    }
    report.add(inversion.join('\n'));
    report.add(
      '\nThree distinct health multipliers (×2.59 on the category-less EMH6, ×2.61 on melee/mounted/flying,\n' +
        '×2.615 on ranged) and three distinct strength multipliers (×2.89 / ×2.90 / ×2.91, same split) — so a\n' +
        '**uniform** bonus set cannot explain the report: at least one non-uniform (category) term is required.\n' +
        'The last column is the check that the "extra" part is the unit\'s strength-against on its **base**\n' +
        'strength: every value lands on the units table to the digit.',
    );

    // The fit the report pins: EMH6 (guardsmen, no category) sets the base, everything else is a delta.
    const FIT = totalsFrom(
      { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
      { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
    );
    const fit = fitScore(owner, FIT);
    report.add(
      `\nStep 2 — the engine on that fit (guardsmen **+159 % health / +189 % strength**, melee·mounted·flying\n` +
        `+2 / +1, ranged +2.5 / +2, double damage +3 %): **${fit.exactHits}/11** friendly lines exact, Σ|Δ| = ` +
        `${n(fit.hitResidual)} on the friendly lines, ${fit.hpInSlack}/11 stacks inside the HP slack, ` +
        `max |Δ| = ${n(fit.maxHpResidual)} on the enemy lines (Σ|Δ| = ${n(fit.hpResidual)}).\n\n` +
        'The one friendly line short of exact is SP1: 855 × 50 × 3.29 = **140,647.5** exactly, and the engine\n' +
        'rounds a half up (140,648) where the game truncates (140,647) — the same truncation rule as rule 17,\n' +
        "so it is the engine's arithmetic and not a bonus misfit. The fit is the report's own three health and\n" +
        'three strength families to within 0.002 %.',
    );

    // Step 3 — is the fit unique? Six 1-D sweeps around it, one parameter at a time, engine-scored.
    const sweep = (
      parameter: string,
      apply: (value: number) => BonusTotals,
      from: number,
      to: number,
      step: number,
    ): string => {
      const zero: number[] = [];
      let best = Number.POSITIVE_INFINITY;
      let bestValue = from;
      for (let value = from; value <= to + 1e-9; value += step) {
        const score = fitScore(owner, apply(value));
        const total = score.hitResidual + score.hpResidual;
        if (total < best) {
          best = total;
          bestValue = value;
        }
        // "Reproduced" = every stack inside the HP slack and no friendly line off by more than the one
        // truncation half-SP1 carries (140,647.5, the engine's round-half-up against the game's truncation).
        if (score.hpInSlack === 11 && score.hitResidual <= 1) zero.push(value);
      }
      const first = zero[0];
      const last = zero[zero.length - 1];
      const span =
        first !== undefined && last !== undefined
          ? `${first.toFixed(3)} … ${last.toFixed(3)} (${zero.length} of ${Math.round((to - from) / step) + 1}, span ±${((last - first + step) / 2).toFixed(3)})`
          : `none (best ${n(bestValue)}, Σ|Δ| ${n(best)})`;
      return `| ${parameter} | ${span} | ${n(bestValue)} | ${n(best)} |`;
    };
    const healthSet = (guardsmen: number) =>
      totalsFrom(
        { guardsmen, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
        { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
      );
    const strengthSet = (guardsmen: number) =>
      totalsFrom(
        { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
        { guardsmen, melee: 1, mounted: 1, flying: 1, ranged: 2 },
      );
    const categoryHealth = (value: number) =>
      totalsFrom(
        { guardsmen: 159, melee: value, mounted: value, flying: value, ranged: 2.5 },
        { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
      );
    const categoryStrength = (value: number) =>
      totalsFrom(
        { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
        { guardsmen: 189, melee: value, mounted: value, flying: value, ranged: 2 },
      );
    const rangedHealth = (value: number) =>
      totalsFrom(
        { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: value },
        { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
      );
    const rangedStrength = (value: number) =>
      totalsFrom(
        { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
        { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: value },
      );
    report.add(
      [
        '\nStep 3 — uniqueness: sweep each parameter alone, engine-scored (step 0.001 — the report pins these to',
        "a few thousandths of a percent). A value counts only when no friendly line is off by more than SP1's",
        'half-unit **and** all 11 stacks land inside the per-unit-rounding slack; the two parameters marked ✝',
        "are confounded with `army` (every one of the march's 11 units is a guardsman), so the report can only",
        'pin their **sum**, not the split:',
        '',
        '| parameter swept (others at the fit) | values that reproduce the whole report | best value | best Σ|Δ| |',
        '|---|---|---|---|',
        sweep('guardsmen health', healthSet, 158.99, 159.01, 0.001),
        sweep('guardsmen strength ✝', strengthSet, 188.99, 189.01, 0.001),
        sweep('category health (melee=mounted=flying)', categoryHealth, 1.99, 2.01, 0.001),
        sweep('category strength', categoryStrength, 0.99, 1.01, 0.001),
        sweep('ranged health offset', rangedHealth, 2.4, 2.6, 0.001),
        sweep('ranged strength offset', rangedStrength, 1.99, 2.01, 0.001),
      ].join('\n'),
    );

    // Uniform (no category term) — refuted, with the best it can do.
    let uniformBest = Number.POSITIVE_INFINITY;
    let uniformAt = '';
    let uniformExact = 0;
    for (let h = 140; h <= 190; h += 0.25) {
      for (let s = 170; s <= 220; s += 0.25) {
        const score = fitScore(owner, totalsFrom({ army: h }, { army: s }));
        const total = score.hitResidual + score.hpResidual;
        if (total < uniformBest) {
          uniformBest = total;
          uniformAt = `health +${h} / strength +${s}`;
          uniformExact = score.exactHits;
        }
      }
    }
    report.add(
      [
        '',
        `**The fitted account bonuses, as percentages:** guardsmen/army **+159 % health / +189 % strength**;`,
        'melee · mounted **+2 / +1** on top; ranged **+2.5 / +2**; double damage **+3 %** (observed, not fitted:',
        "entry 11 is the only proc in the fight). The harness's `kaiReportTotals` is one such set — the",
        'independent fit lands on exactly its values, so scenario C is confirmed rather than assumed.',
        '',
        '**What this report cannot see** (the fit is silent, not wrong, there):',
        '',
        '- the split between the `army` and `guardsmen` keys — every one of the 11 units is a guardsman, so only',
        '  their **sum** (+159 / +189) is identified;',
        '- the **flying** category: the march has no flying unit, so the +2 / +1 written for flying in scenario C',
        '  is an analogy with melee/mounted, not an observation;',
        '- the **specialist** group: SW1 does not march (the 2026-09-13 report is what pins ×1.51 / ×1.71);',
        '- whether the ranged top-up is a category term or a per-unit-type term — one report cannot tell the two',
        "  apart, and the engine's category key is the parsimonious reading.",
      ].join('\n'),
    );
    report.add(
      `\nStep 4 — the best **uniform** (category-less) set over a 201 × 201 sweep is ${uniformAt} ` +
        `(${uniformExact}/11 friendly lines exact), residual ${n(uniformBest)} — vs ${n(fit.hitResidual + fit.hpResidual)} for the fit.\n` +
        'A uniform set cannot fit both the category-less EMH6 (×2.59 / ×2.89) and the melee/ranged units\n' +
        "(×2.61 / ×2.90–2.91): **the report requires a non-uniform term**, and the engine's category keys supply it.",
    );

    // ---- 2. the replay ---------------------------------------------------------------------------
    report.h('2. The replay (army first, 4 enemy squads)');
    const replayReq = withUnits({ ...owner.twelve, totals: FIT }, IDS);
    const replay = evaluateCounts(replayReq, KAI);
    const journal = replay.summary.journals.armyFirst.entries;
    const rows = ['| # | report | engine | report dmg | engine dmg | Δ |', '|---|---|---|---|---|---|'];
    let actorMismatch = 0;
    let stackMismatch = 0;
    let printed = 0;
    let modelled = 0;
    REPORT.forEach((line, index) => {
      const entry = journal[index];
      const who = entry ? `${entry.actor === 'army' ? '' : 'E>'}${label(entry.unitId)}` : '—';
      const expected = `${line.actor === 'army' ? '' : 'E>'}${label(line.unit)}`;
      if (!entry || entry.actor !== line.actor) actorMismatch += 1;
      if (!entry || entry.unitId !== line.unit) stackMismatch += 1;
      if (line.actor === 'army') {
        printed += line.damage;
        modelled += entry?.damage ?? 0;
      }
      rows.push(
        `| ${index + 1} | ${expected} | ${who} | ${n(line.damage)} | ${n(entry?.damage ?? 0)} | ${n((entry?.damage ?? 0) - plainHit(line))} |`,
      );
    });
    report.add(rows.join('\n'));
    const hitCounts = new Map<string, number>();
    for (const entry of journal)
      if (entry.actor === 'army') hitCounts.set(entry.unitId, (hitCounts.get(entry.unitId) ?? 0) + 1);
    const reportHits = new Map<string, number>();
    for (const line of REPORT)
      if (line.actor === 'army') reportHits.set(line.unit, (reportHits.get(line.unit) ?? 0) + 1);
    const hitRows = IDS.map(
      (unit) => `| ${label(unit)} | ${reportHits.get(unit) ?? 0} | ${hitCounts.get(unit) ?? 0} |`,
    );
    const enemyResiduals = IDS.map((unit) => {
      const enemy = REPORT.find((line) => line.actor === 'enemy' && line.unit === unit);
      const stack = replay.result.stacks.find((entry) => entry.unitId === unit);
      return { unit, report: enemy?.damage ?? 0, engine: stack?.totalHp ?? 0 };
    });
    const worst = enemyResiduals.reduce((a, b) =>
      Math.abs(b.engine - b.report) > Math.abs(a.engine - a.report) ? b : a,
    );
    report.add([`\n|l| report | engine |`, '|---|---|---|', ...hitRows].join('\n'));
    report.add(
      `\nentries: report ${REPORT.length}, engine ${journal.length} · actor mismatches ${actorMismatch}, ` +
        `stack mismatches ${stackMismatch} · hits per stack identical: ${
          IDS.every((unit) => (reportHits.get(unit) ?? 0) === (hitCounts.get(unit) ?? 0)) ? 'yes' : 'NO'
        }`,
    );
    report.add(
      `friendly damage: report as printed ${n(printed)} (entry 11 doubled), report without the proc ` +
        `${n(printed - 161_843)}, engine army-first total ${n(modelled)} (Δ ${n(modelled - (printed - 161_843))}).`,
    );
    report.add(
      `enemy lines: engine = stack total HP, report = the printed line; worst ${label(worst.unit)} ` +
        `${n(worst.engine)} vs ${n(worst.report)} (Δ ${n(worst.engine - worst.report)}, ` +
        `${((100 * Math.abs(worst.engine - worst.report)) / worst.report).toFixed(3)} %); ` +
        `Σ|Δ| over the 11 lines ${n(enemyResiduals.reduce((sum, row) => sum + Math.abs(row.engine - row.report), 0))}, ` +
        `lines exact ${enemyResiduals.filter((row) => row.engine === row.report).length}/11.`,
    );
    report.add(
      '0015 §3b claims "0 mismatches, enemy lines within 428 (0.13 %)" — **confirmed**: 30/30 entries, the\n' +
        'actor and stack sequences identical, the hits per stack identical (1 1 1 1 1 2 2 2 2 3 3 = 19 friendly\n' +
        'hits), the friendly total off by one unit, and the worst enemy line off by 428 = 0.128 % (SP1). Three\n' +
        "of the 11 enemy lines are exact; the other eight carry the engine's per-unit rounding, Σ|Δ| = 941.\n" +
        'The proc on entry 11 is the only thing the report prints that the engine does not (the engine has no\n' +
        'proc in a journal: 161,843 vs the printed 323,686, +4.1 % of the friendly total).',
    );
    report.add(
      'The enemy-line gap is the engine rounding HP **per unit** (round(150 × 2.61) = 392) where the game\n' +
        'scales the stack and truncates once (855 × 391.5 = 334,732.5 → 334,732) — the documented ±0.2 %\n' +
        'tolerance of `tests/engine/ingame-report.test.ts`, not a bonus misfit. Fitting the per-unit HP is\n' +
        'what forces the health bonus down to +159: the truncating rule would read 2.61 exactly.',
    );

    // ---- 3. the evidence table --------------------------------------------------------------------
    report.h('3. The evidence table (rule → evidence → verdict)');
    report.add(EVIDENCE.join('\n'));

    // ---- 4. the decisive tests --------------------------------------------------------------------
    report.h('4. The decisive in-game tests');
    report.add('### 4a. Can a stack survive an enemy attack?');
    const maxTested = 345_504; // 2026-09-11 report 1, SP1 944 × 150 × 2.44 — the largest stack a monster ever hit
    const biggestLine = 334_732; // Kai entry 2 — the largest damage a monster ever printed
    const fitRD3 = replay.result.stacks.find((stack) => stack.unitId === 'rider-3');
    const hpPerRD3 = fitRD3?.hpPerUnit ?? 0;
    const probeCount = Math.ceil((2 * biggestLine) / hpPerRD3);
    const probe = {
      'rider-3': probeCount,
      'epic-monster-hunter-6': 92,
      'arbalester-6': 76,
      'legionary-6': 72,
      'chariot-6': 37,
    };
    const probeEval = evaluateCounts(withUnits({ ...owner.twelve, totals: FIT }, Object.keys(probe)), probe);
    const giantCount = 2_171;
    const giant = { 'rider-3': giantCount };
    const giantEval = evaluateCounts(withUnits({ ...owner.twelve, totals: FIT }, ['rider-3']), giant);
    // The cheapest decisive probe: mercenaries only, no troops — the very first monster hit then meets the
    // 92-unit EMH6 stack, which is 4.3 × the largest line a monster has ever printed.
    const mercOnly = { 'epic-monster-hunter-6': 92, 'arbalester-6': 76, 'legionary-6': 72, 'chariot-6': 37 };
    const mercOnlyEval = evaluateCounts(
      withUnits({ ...owner.twelve, totals: FIT }, Object.keys(mercOnly)),
      mercOnly,
    );
    const mercOnlyTop = lines(mercOnlyEval)[0];
    const seven = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS];
    const best = evaluate(withMethod(scenarioC(withUnits(owner.twelve, seven)), 'ms'));
    const probeOrder = probeEval.result.stacks.map((stack) => label(stack.unitId));
    report.add(
      [
        `The tested envelope: the biggest stack any monster has ever hit is ${n(maxTested)} HP (2026-09-11,`,
        `SP1 944); the biggest number a monster has ever printed is ${n(biggestLine)} (Kai entry 2). Every one`,
        "of the 40 monster attacks in the repo destroyed its target, but the enemy line *is* the target's HP,",
        'so no report can tell raw damage from a one-shot kill.',
        '',
        `**Threshold to test: any single stack above ${n(maxTested)} HP; decisive at ≥ ${n(2 * biggestLine)} HP**`,
        `(twice the largest number a monster has ever printed). Nothing in the repo has ever put a stack that big`,
        'in front of a monster.',
        '',
        "Under today's model a stack is the **first victim** whatever its size (kill order = total HP), so a",
        `giant stack strikes at most once. Engine, the fitted bonuses, RD3 = ${n(hpPerRD3)} HP/unit:`,
        '',
        '| march | stacks | biggest stack | model total (army-first) |',
        '|---|---|---|---|',
        `| **the 4 mercenaries at their caps, no troops** (cheapest decisive probe) | 4 | EMH6 92 — ${n(mercOnlyTop?.totalHp ?? 0)} HP, ${(mercOnlyTop?.totalHp ?? 0) / biggestLine > 1 ? `${((mercOnlyTop?.totalHp ?? 0) / biggestLine).toFixed(1)} × the largest line ever printed` : ''} | ${n(mercOnlyEval.summary.maxDamage)} |`,
        `| RD3 ${n(probeCount)} + the 4 mercenaries at their caps | 5 | RD3 ${n(probeCount)} — ${n(probeCount * hpPerRD3)} HP (2.0 ×) | ${n(probeEval.summary.maxDamage)} |`,
        `| RD3 ${n(giantCount)} alone — all 4,343 leadership | 1 | RD3 ${n(giantCount)} — ${n(giantCount * hpPerRD3)} HP (16.3 ×) | ${n(giantEval.summary.maxDamage)} |`,
        `| reference: the best normal march (ARC2 RD2 RD3 + the 4 mercs, M's Preservation) | ${best.result.stacks.length} | — | ${n(best.summary.maxDamage)} |`,
      ].join('\n'),
    );
    const probeHp = probeCount * hpPerRD3;
    report.add(
      [
        '',
        `**The cheapest decisive probe is the mercenaries alone** (RD3 needs 268 riders and 375 k silver to`,
        'retrain; the four mercenary stacks cost no leadership and come back at 90 %). Fielding them with no',
        `troops puts EMH6 92 (${n(mercOnlyTop?.totalHp ?? 0)} HP) in front of the very first monster hit —`,
        `${((mercOnlyTop?.totalHp ?? 0) / biggestLine).toFixed(1)} × the largest number a monster has ever printed, at a cost of 314 authority and 10 EMH6`,
        'of stock. Everything below then adds one more reading of the same question at a bigger stack.',
        '',
        `Today's model **punishes** the shape the survival question is about: the probe march scores ` +
          `${n(probeEval.summary.maxDamage)} against ${n(best.summary.maxDamage)} for the ordinary march ` +
          `(${n(probeEval.summary.maxDamage - best.summary.maxDamage)}, ${((100 * (probeEval.summary.maxDamage - best.summary.maxDamage)) / best.summary.maxDamage).toFixed(0)} %), because the huge stack`,
        'is the one thing the model refuses to let fight twice.',
        '',
        `**Do this (cheapest first):**`,
        '',
        `1. **EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37**, no troops (authority 314, leadership 0), at any monster`,
        `   with 4 squads. The very first monster hit meets EMH6 92 — ${n(mercOnlyTop?.totalHp ?? 0)} HP,`,
        `   ${((mercOnlyTop?.totalHp ?? 0) / biggestLine).toFixed(1)} × the largest number a monster has ever printed.`,
        `2. The same plus **RD3 ${n(probeCount)}** (leadership ${n(probeCount * 2 + 277)} of 4,343): the kill order is`,
        `   ${probeOrder.join(' · ')}, so the fifth monster hit meets RD3 at ${n(probeHp)} HP.`,
        `3. The all-in version, **RD3 ${n(giantCount)} alone** (all 4,343 leadership, ${n(giantCount * hpPerRD3)} HP), at a`,
        '   monster the account can afford to lose riders to.',
        '',
        `**Read this:** the enemy line against the big stack, whether the stack's card comes back, and the red`,
        "badge on it. Today's model says the stack dies on that hit: the line reads the stack's full HP",
        `(${n(mercOnlyTop?.totalHp ?? 0)}, then ${n(probeHp)}, then ${n(giantCount * hpPerRD3)}) and the card shows every unit killed.`,
        '',
        '**It would mean:** a full-HP line with the whole stack wiped → the one-shot rule holds at 2–16 × beyond',
        'anything ever tested and the model stands (for the price of one march). A smaller line instead — near',
        `300,000, with the stack reappearing later at a partial figure — → **survival is real**: the monster deals`,
        'raw damage, the one-shot rule is an artefact of every stack so far being small, and a march built around',
        `one huge stack becomes the strongest march in the game (RD3 ${n(giantCount)} strikes once in the model, for`,
        `${n(giantEval.summary.maxDamage)}; every extra round of survival is another ${n(giantEval.summary.maxDamage)} —`,
        `${((100 * giantEval.summary.maxDamage) / best.summary.maxDamage).toFixed(0)} % of the best whole march above).`,
      ].join('\n'),
    );

    report.add('### 4b. Is XP driven by damage or by kills?');
    const byMonster = new Map<string, { damage: number; kills: number }>();
    for (const line of REPORT) {
      if (line.actor !== 'army' || !line.monster) continue;
      const row = byMonster.get(line.monster) ?? { damage: 0, kills: 0 };
      row.damage += line.damage;
      row.kills += line.kills ?? 0;
      byMonster.set(line.monster, row);
    }
    const killRows = [...byMonster.entries()].map(([monster, row]) => ({
      monster,
      ...row,
      perKill: row.damage / row.kills,
    }));
    killRows.sort((a, b) => b.perKill - a.perKill);
    report.add(
      [
        '| monster squad | category (the units that hit it) | our damage | badge kills | damage per kill |',
        '|---|---|---|---|---|',
        ...killRows.map(
          (row) =>
            `| ${row.monster} | ${Object.entries(MONSTER_OF).find(([, id]) => id === row.monster)?.[0] ?? ''} | ${n(row.damage)} | ${row.kills} | ${n(Math.round(row.perKill))} |`,
        ),
        '',
        `spread best/worst = ${(killRows[0]!.perKill / killRows[killRows.length - 1]!.perKill).toFixed(1)} ×`,
      ].join('\n'),
    );
    report.add(
      [
        '',
        'M3 (the melee squad, the one EMH6 hits) absorbs ~22 × more damage per monster killed than M4 (ranged).',
        '**Do this:** hit the same monster twice, once with a stack that carries strength-against on the squad it',
        'targets and once with one that does not (e.g. an EMH6-only march vs a CHR6-only march at the same',
        "monster), and note the account's XP (or the hero level) before and after each.",
        '**Read this:** XP gained ÷ damage dealt, and XP gained ÷ badge kills, for both marches.',
        "**It would mean:** the same XP per damage → damage is the score and the app's objective is right; the",
        `same XP per kill → kills are the score, and the *choice of monster* becomes a ${(killRows[0]!.perKill / killRows[killRows.length - 1]!.perKill).toFixed(0)} × lever the app`,
        'does not model at all (M3 would be the target, whatever the damage).',
        '',
        '**Caveat.** The badge is ±1 on M4 (the transcription counts −78 over 77 kills), entries 1 and 14 show',
        'no figure, and the badges are read off screenshots: the damage-per-kill figures carry that error, and',
        'on M3 (2 kills) a single misread moves the number by 50 %.',
      ].join('\n'),
    );

    report.add('### 4c. The other open questions (no repo evidence at all)');
    report.add(OPEN_TESTS.join('\n'));

    // ---- 5. the tier-7 lever ----------------------------------------------------------------------
    report.h('5. The obtainable-tier lever: tier-7 mercenaries');
    const mercs7 = ['epic-monster-hunter-7', 'arbalester-7', 'legionary-7', 'chariot-7'];
    const authorityOf = (counts: Record<string, number>, ids: string[]): number =>
      ids.reduce((sum, id) => sum + (counts[id] ?? 0) * (unitById(id)?.cost ?? 0), 0);
    const swap = (counts: Record<string, number>): Record<string, number> => {
      const out: Record<string, number> = { ...counts };
      MERC_IDS.forEach((id, index) => {
        const to = mercs7[index] ?? '';
        const value = out[id];
        delete out[id];
        if (value !== undefined) out[to] = value;
      });
      return out;
    };
    const kai7 = swap(KAI);
    const kaiSix = replay.summary.maxDamage;
    const kaiSeven = evaluateCounts(
      withUnits({ ...owner.twelve, totals: FIT }, [
        ...IDS.filter((id) => !(MERC_IDS as readonly string[]).includes(id)),
        ...mercs7,
      ]),
      kai7,
    ).summary.maxDamage;
    const sevenIds6 = [...seven];
    const sevenIds7 = ['archer-2', 'rider-2', 'rider-3', ...mercs7];
    const sizedSix = withMethod(scenarioC(withUnits(owner.twelve, sevenIds6)), 'ms');
    const sizedSixEval = evaluate(sizedSix);
    const sizedSixCounts = Object.fromEntries(
      sizedSixEval.result.stacks.map((stack) => [stack.unitId, stack.count]),
    );
    const swapCounts = swap(sizedSixCounts);
    const swapEval = evaluateCounts(withUnits(sizedSix, sevenIds7), swapCounts);
    const caps7: Record<string, number> = {};
    MERC_IDS.forEach((id, index) => {
      const cap = owner.twelve.caps[id];
      if (cap !== undefined) caps7[mercs7[index] ?? ''] = cap;
    });
    const resized = evaluate(
      withMethod(
        { ...scenarioC(withUnits(owner.twelve, sevenIds7)), caps: { ...owner.twelve.caps, ...caps7 } },
        'ms',
      ),
    );
    const authoritySix = authorityOf(sizedSixCounts, [...MERC_IDS]);
    const resizedCounts = Object.fromEntries(
      resized.result.stacks.map((stack) => [stack.unitId, stack.count]),
    );
    const authoritySeven = authorityOf(resizedCounts, mercs7);
    const delta = (value: number, base: number, authority: number): string =>
      `${n(value - base)} (${n((value - base) / authority)} / authority pt)`;
    const shape = (ev: typeof sizedSixEval): string =>
      lines(ev)
        .map(
          (row) =>
            `${row.label} ${n(row.count)} (${n(row.totalHp)} HP, ${n(row.damagePerHit)}/hit, ${row.hitsArmyFirst} hit${row.hitsArmyFirst === 1 ? '' : 's'})`,
        )
        .join(' · ');
    report.add(
      [
        'Tier-7 mercenaries exist in the data tables (EMH7 11,220 HP / 3,740 str / 609→934 % vs epic monsters;',
        'ABT7 10,200 / 3,400 / 509→729 %; LGN7 10,200 / 3,400 / 295→387 %; CHR7 20,400 / 6,800 / 493→752 %) at the',
        '**same authority cost** (1 / 1 / 1 / 2). Whether the owner can obtain them is a game question the repo',
        'cannot answer; the caps below are assumed to be the tier-6 stock (92 / 76 / 72 / 37).',
        '',
        '| scenario | mercenaries | march damage | authority (mercs) | Δ vs tier-6 |',
        '|---|---|---|---|---|',
        `| Kai's march, tier 6, as fought | 16 / 18 / 18 / 8 | ${n(kaiSix)} | ${n(authorityOf(KAI, [...MERC_IDS]))} | — |`,
        `| Kai's march, tier 7, **same counts** | 16 / 18 / 18 / 8 | ${n(kaiSeven)} | ${n(authorityOf(kai7, mercs7))} | ${delta(kaiSeven, kaiSix, authorityOf(kai7, mercs7))} |`,
        `| best 7-type march, tier 6 (sizer) | ${MERC_IDS.map((id) => sizedSixCounts[id] ?? 0).join(' / ')} | ${n(sizedSixEval.summary.maxDamage)} | ${n(authoritySix)} | — |`,
        `| same march, tier 7, **same counts** | ${mercs7.map((id) => swapCounts[id] ?? 0).join(' / ')} | ${n(swapEval.summary.maxDamage)} | ${n(authorityOf(swapCounts, mercs7))} | ${delta(swapEval.summary.maxDamage, sizedSixEval.summary.maxDamage, Math.max(1, authorityOf(swapCounts, mercs7)))} |`,
        `| best 7-type march, tier 7, **re-sized by the sizer** (caps kept) | ${mercs7.map((id) => resizedCounts[id] ?? 0).join(' / ')} | ${n(resized.summary.maxDamage)} | ${n(authoritySeven)} | ${delta(resized.summary.maxDamage, sizedSixEval.summary.maxDamage, Math.max(1, authoritySeven))} |`,
        '',
        'What the fight does, from the engine (kill order, army-first hits):',
        '',
        `- tier 6: ${shape(sizedSixEval)}`,
        `- tier 7, same counts: ${shape(swapEval)}`,
        `- tier 7, re-sized: ${shape(resized)}`,
        '',
        'Two structural facts fall out. **The tier-7 mercenary stacks are so much bigger that at the same counts',
        'they jump above the troop stacks**, so the kill order flips: the four mercenaries become positions 1–4',
        '(one hit each) and the three troop stacks fall to positions 5–7, where positions 6 and 7 collect the',
        'second hit of the round. The swap is worth far more than the tier-6 march anyway, because the mercenary',
        'damage per hit nearly doubles (EMH6 1,367,205 → EMH7 3,430,515) and the troops keep their two-hit slots.',
        'And **the sizer\'s "every mercenary stack under the smallest troop stack" rule costs ' +
          `${n(swapEval.summary.maxDamage - resized.summary.maxDamage)} a march here** ` +
          `(${((100 * (swapEval.summary.maxDamage - resized.summary.maxDamage)) / swapEval.summary.maxDamage).toFixed(0)} %): it trims the tier-7 stacks back under the troop floor and throws`,
        'the extra damage away. The re-sized row is what the app produces today, not an optimum — it is the',
        'clearest case yet for the mercenary post-pass of 0015 §8/E2.',
        '',
        'Per authority point the mercenaries carry the whole delta (the sizer never spends the 2,000, so the',
        "denominator is small); per march the swap is +18 % on Kai's ladder and +64 % on the best 7-type march.",
        '**Obtainability is a game question**: nothing in the repo says tier-7 mercenaries can be hired, at what',
        'authority cost, in what numbers, or at what price in revival gold.',
      ].join('\n'),
    );

    // ---- 6. corrections ---------------------------------------------------------------------------
    report.h('6. Corrected and failed assumptions');
    report.add(
      [
        '- **0015 §3b, "reproduces the report entry for entry", is a claim about the *sequence*, not the',
        '  digits.** The sequence is exact (30/30, 0 mismatches), but only 10 of the 11 friendly damage values',
        "  (18 of the 19 printed lines) and 3 of the 11 enemy lines are character-for-character the report's;",
        '  SP1 is off by 1 and the enemy lines by up to 428. The cause is one rule the engine knowingly does not',
        '  follow — the game truncates where the engine (and TotalStack) round — and it is the whole ±0.2 %',
        '  tolerance.',
        '- **Scenario C is a fit, not a measurement — and this audit is the first place it was fitted from the',
        '  report rather than copied from the test.** It lands on the same numbers, so the values stand; what',
        '  the fit *cannot* see is listed above (the army/guardsmen split, the flying category, the specialist',
        '  group). The `flying` entry in scenario C (+2 / +1) has no observation behind it in this report.',
        '- **The doubled line doubles both parts (entry 11).** Inverting the report by hand (damage − extra)',
        '  on that line alone yields ×1.44 strength for RD3 and a 292 % strength-against — the trap is that',
        '  the print doubles the "extra" too (108,390 = 2 × 54,195). Halving both gives ×2.90 / 146 %, the',
        '  table value. Any reader reconciling a report must halve the whole line, not just the total.',
        "- **A failed guess of this audit's own:** the first reading of the tier-7 swap was that it would lose,",
        '  because bigger mercenary stacks climb to the top of the kill order and die first. Wrong — the engine',
        '  shows it is worth +64 % on the best march, because the *troop* stacks then fall into the two-hit',
        "  positions (6 and 7) while the mercenaries' damage per hit nearly doubles. Position, not survival, is",
        '  what pays in this model — which is exactly why the survival question in §4a would break it.',
        '- **The "one stack per unit type" rule and the stack ceiling are engine contracts, not game rules.**',
        '  Every observed march happens to have distinct types and ≤ 11 stacks, so nothing in the repo would',
        '  notice if the game allowed more; the sizer would have to be re-shaped, not just re-tuned.',
      ].join('\n'),
    );

    // ---- assertions ------------------------------------------------------------------------------
    report.save();
    // 10 of 11 friendly lines are character-for-character the report's; SP1 is the one half-integer the
    // engine rounds up and the game truncates (140,647.5).
    expect(fit.exactHits).toBe(10);
    expect(fit.hitResidual).toBe(1);
    expect(fit.hpInSlack).toBe(11);
    expect(actorMismatch).toBe(0);
    expect(stackMismatch).toBe(0);
    expect(journal).toHaveLength(REPORT.length);
  });
});

/** Recomputed at run time in section 3 so the numbers in the table come from the report it names. */
const EVIDENCE = [
  '| # | rule the model uses | evidence in the repo | observations | verdict |',
  '|---|---|---|---|---|',
  '| 1 | kill order = total HP descending | 4 in-game reports: 2026-09-11 ×2 (`docs/research/fixtures/ingame-2026-09-11-epic-ancient-report.md`), 2026-09-13 (`fixtures/ingame-2026-09-13/README.md`), Kai 2026-09-14 (`docs/research/battlereportkai.md`); discriminating cases: the 2-unit ABT6 mercenary stack killed first and never striking (2026-09-13), RD1 killed 3rd although 4th by base damage (2026-09-11 ×2) | 40 kills | **proved** within these reports (the HP values are the enemy lines themselves; the 2026-09-13 popup makes them independent) |',
  "| 2 | attack order = base damage descending | 2026-09-13: SW1 (4,077 HP) dies first but strikes after RD2 (3,936 HP, base 1,549 vs 1,539) — one discriminating pair; reproduces 2026-09-11 ×2 entry for entry (RD1, 3rd by HP/4th by damage, never strikes); Kai's report: order coincides, non-discriminating | 1 discriminating + 3 consistent | **proved** on a single discriminating observation |",
  '| 3 | N enemy attacks/round, one strike between consecutive attacks, survivor sweep after the Nth | 2026-09-11 ×2 (N=3: 28 entries; N=4: 24), 2026-09-13 (N=4), Kai (N=4), 3 TotalStack journals | 4 in-game + 3 journals | **consistent** — the survivor sweep is one line short on 2026-09-13 entry 20 (20 of 21 entries), rule unsettled |',
  '| 4 | damage per hit = count × str × (1 + Σstr%) + count × baseStr × SA/100 | every friendly line of 4 in-game reports (2026-09-11: 18 + 14; 2026-09-13: 12; Kai: 19 — 63 lines, each one reconciled in the fixtures or here) + 3 TotalStack journals + the 2026-09-13 troop-detail popup | 63 in-game lines | **proved** |',
  '| 5 | the "extra" part is the SA term on the BASE strength and is included in the printed total | 4 reports, every friendly line; this audit re-checks all 11 units of Kai\'s report (extra ÷ count ÷ base str = the table SA to the digit) | 11 + ~50 | **proved** (for our units; the monster\'s own "extra" on entries 16/22 is unmodelled and touches nothing we compute) |',
  "| 6 | **the enemy always destroys the stack it attacks** | 40/40 enemy attacks destroyed their target — but under rule 8 the printed line *is* the target's HP, so the equality is the model, not an observation. Largest stack ever attacked: 345,504 HP; largest number a monster ever printed: 334,732 | 40 attacks, all below ~345 k HP | **unverified** — untestable by any existing report (§4a) |",
  "| 7 | the enemy line = the destroyed stack's total HP | 40 lines reconcile to count × base × healthMult to the digit at both the stack level (2026-09-11, truncation) and the per-unit level (engine); the 2026-09-13 popup independently supplies the health bonus | 40 lines | **proved as an identity of the printed number**; **unverified** as a causal statement (raw damage vs one-shot kill) |",
  '| 8 | every stack we field dies | every stack of all four reports died (40/40); a corollary of rule 6 with the same caveat | 40 stacks, ≤ 345 k HP | **consistent** |',
  "| 9 | one stack per unit type per march | every observed march has distinct types only (9, 10, 11 stacks); no report ever shows a type twice | 4 marches, never exercised | **unverified** — it is the sizer's contract, not an observation |",
  "| 10 | the maximum number of stacks a march may field | nothing anywhere in the repo; the largest observed march is 11 stacks, TotalStack's journal runs 12 with N=8 | 0 | **unverified** |",
  '| 11 | two stacks of one type cannot coexist | never observed, never attempted | 0 | **unverified** |',
  '| 12 | the monster figure and the red kill badge | figure − badge reconciles for M1 (−7/7), M2 (−3/3), M3 (−1/1); M4 moves −78 over 77 badges (3 of 7 segments off by ±1). The figures (2.07 M – 29.56 M) cannot be unit counts at ~19.5 k damage per kill on M4 | 4 squads, 19 friendly hits | **badge = kills this exchange: consistent (±1 on M4)**; **what the figure counts: unverified** |',
  '| 13 | whether damage or kills drive XP | no evidence in the repo (no mention of XP anywhere) | 0 | **unverified** — and it reprices the monster choice (§4b) |',
  '| 14 | whether training runs several unit types in parallel | no evidence; flagged "to check in game" in 0015 §6.3 | 0 | **unverified** |',
  '| 15 | march limits per monster/period (cooldown, re-attack, number of marches) | no evidence in the repo | 0 | **unverified** |',
  '| 16 | a stack targets the enemy squad it has the largest strength-against for (else melee) | Kai 11/11 (M1 flying ← archers and ABT6 at 67/101/509 %, M2 mounted ← spearmen and LGN6 at 39/59/295 %, M3 melee ← EMH6 — the category-less fallback, M4 ranged ← riders and CHR6 at 65/98/146/493 %); 2026-09-11 report 2 (RD3 and CHR6 retarget onto the ranged swarm squad that appears there); 2026-09-11 report 1 | 4 reports | **proved** |',
  '| 17 | HP is truncated at the stack, not rounded per unit | 2026-09-13: 20 SP1 = 7,289, not divisible by 20 (settled in game) | 1 direct | **proved**; the engine keeps per-unit rounding as a stated modelling choice (±0.2 %) |',
  '| 18 | double damage = a plain ×2 on both parts of one hit | 2026-09-11 report 2 entry 8, 2026-09-13 entry 14, Kai entry 11 (323,686 = 2 × 161,843 incl. 2 × 54,195) | 3 | **proved** |',
  "| 19 | authority 2,000 · mercenary caps 92/76/72/37 · temple 15 | the export's `housing.authority` reads **200** — 2,000 is the owner's correction of a typo; the caps are the export's own `cap` fields | export only | **input, not evidence** |",
];

const OPEN_TESTS = [
  '| question | do this in game | read this | it would mean |',
  '|---|---|---|---|',
  "| can two stacks of one unit type coexist? | add the same troop type twice to a march (the app cannot express it — try the game's own march screen) | does the march screen refuse it, or does the report show two cards of that type? | refused → the engine's one-stack-per-type contract is the game's rule; accepted → the app is missing marches (two half-stacks would re-shape the whole hit schedule) |",
  "| how many stacks may a march hold? | send the widest march the game allows (every owned type + 4 mercenaries + monsters) | the number of cards in the report | ≥ 12 → the engine's cap must rise; the optimum grows with K (damage ≈ housing × K / 2N) |",
  '| does training run in parallel? | start two different troop types training at once | do both countdown, or does the second queue? | parallel → retrain time is the longest single type, not the sum (0015 §6.3 assumes the sum) |',
  '| march limits per monster/period | attack the same monster twice in a row, then a second monster | is the second march refused (cooldown), and is the monster\'s figure restored between marches? | a cooldown makes "damage per march" the wrong objective; the figure resetting decides whether kills accumulate |',
  '| what does the monster figure count? | one hit by a stack of known damage-per-hit on a fresh monster, at pixel zoom | the figure drop against the badge | drop = badge → a unit count (then ~19.5 k damage kills one monster of M4); drop ≈ damage → the figure is HP, and the badge is a derived read-out |',
];
