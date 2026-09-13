/**
 * B6 — which troop tier to put in the leadership.
 *
 * Leadership is a fixed 4,343 and troops are the only part of the army that can be bought back, so the
 * question is: per point of leadership, which unit type gives the most HP (to out-weigh the hired stacks and
 * hold the kill order), and what does that HP cost in silver and in seconds?
 *
 * The three rates below come straight from the tables and the bonuses:
 *
 * ```
 * HP per leadership = effectiveUnit(...).hpPerUnit / unit.cost
 * silver per HP     = training.silver   / effectiveUnit(...).hpPerUnit
 * seconds per HP    = training.seconds  / effectiveUnit(...).hpPerUnit
 * ```
 *
 * `effectiveUnit` is the engine's own (src/engine/units.ts); scenario B is the bonus set the 2026-09-13
 * in-game report proved on this account, so the guardsmen ×2.43 / specialist ×1.51 split is live in the table
 * and SW1 — the only specialist the account fields — is visibly penalised by it.
 *
 * Then three marches: the owner's, the same with SW1 replaced by SP3 and/or ARC3 (**tier-3 types the account
 * may not have unlocked — every row using them is labelled**), and the owned alternatives (ARC1 / SP1 / RD1 /
 * ARC2 back in).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/26-tiers.test.ts`
 */
import { describe, it } from 'vitest';

import { recoveryCosts } from '../../src/engine/recovery';
import { effectiveUnit } from '../../src/engine/units';
import type { StackRequest } from '../../src/engine/types';
import {
  EIGHT,
  MERC_IDS,
  Report,
  duration,
  evaluate,
  loadOwner,
  march,
  n,
  scenarioB,
  unitById,
  withMethod,
  withUnits,
} from './harness';

const TEMPLE = 15;
const SPEED = 47.9;
/** Tier-3 guardsmen the account may not have unlocked — every use is flagged. */
const MAYBE_UNOWNED = new Set(['spearman-3', 'archer-3']);

function withTemple(request: StackRequest): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE } };
}
function fastSettings(request: StackRequest): StackRequest['recovery'] {
  return {
    ...request.recovery,
    templeLevel: TEMPLE,
    trainingSpeed: { guardsmen: SPEED, specialist: SPEED },
  };
}

describe.skipIf(!process.env.THEORY)('B6 tiers', () => {
  it('rates the troop tiers and swaps SW1 out', () => {
    const report = new Report('26-tiers');
    const owner = loadOwner();
    const TWELVE = owner.twelve.units.map((unit) => unit.id);

    report.add('# B6 — which troop tier to put in the leadership');
    report.add('');
    report.add(
      "⚠️ **Ownership caveat.** SP3 (Spearman III) and ARC3 (Archer III) are tier-3 guardsmen that the owner's " +
        'export does not list — the account may not have unlocked them. Every row and march that uses them is ' +
        'marked **[unowned?]** and is a *what-if*, not a recommendation. The ARC1 / SP1 / RD1 / ARC2 rows are the ' +
        'owned alternatives (they are in the export, merely left out of the current setup).',
    );

    // ---- Rates per unit type ---------------------------------------------------------------------
    const candidates = [
      'swordsman-1',
      'archer-1',
      'spearman-1',
      'rider-1',
      'archer-2',
      'spearman-2',
      'rider-2',
      'archer-3',
      'spearman-3',
      'rider-3',
    ];

    for (const [scenarioName, base] of [
      ['B (bonuses proven in game) — the one that matters', scenarioB(owner.twelve)],
      ['A (export bonuses)', withTemple(owner.twelve)],
    ] as const) {
      report.h(`Rates per troop type — scenario ${scenarioName}`);
      report.add('');
      interface Rate {
        id: string;
        label: string;
        group: string;
        tier: number;
        cost: number;
        hp: number;
        strength: number;
        hpPerL: number;
        strengthPerL: number;
        silverPerHp: number;
        secondsPerHp: number;
        unowned: boolean;
      }
      const rows: Rate[] = [];
      for (const id of candidates) {
        const unit = unitById(id);
        if (!unit?.training) continue;
        const effective = effectiveUnit(unit, base.totals, base.enemy, base.activeEvents);
        rows.push({
          id,
          label: unit.label,
          group: unit.group ?? '—',
          tier: unit.tier,
          cost: unit.cost,
          hp: effective.hpPerUnit,
          strength: effective.strengthPerUnit,
          hpPerL: effective.hpPerUnit / unit.cost,
          strengthPerL: effective.strengthPerUnit / unit.cost,
          silverPerHp: unit.training.silver / effective.hpPerUnit,
          secondsPerHp: unit.training.seconds / effective.hpPerUnit,
          unowned: MAYBE_UNOWNED.has(id),
        });
      }
      rows.sort((a, b) => b.hpPerL - a.hpPerL);
      report.add(
        '| unit | group | tier | L cost | effective HP | effective strength | **HP per L** | strength per L | silver per HP | seconds per HP | HP per silver | HP per second |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|---|---|');
      for (const row of rows) {
        report.add(
          `| ${row.label}${row.unowned ? ' **[unowned?]**' : ''} | ${row.group} | ${row.tier} | ${n(row.cost)} | ${n(row.hp)} | ${n(row.strength)} | ${n(row.hpPerL)} | ${n(row.strengthPerL)} | ${n(row.silverPerHp)} | ${n(row.secondsPerHp)} | ${n(1 / row.silverPerHp)} | ${n(1 / row.secondsPerHp)} |`,
        );
      }
      report.add('');
      const best = rows[0];
      const cheapest = [...rows].sort((a, b) => a.silverPerHp - b.silverPerHp)[0];
      const fastest = [...rows].sort((a, b) => a.secondsPerHp - b.secondsPerHp)[0];
      report.add(
        `Most HP per leadership: **${best?.label}**${best?.unowned ? ' [unowned?]' : ''} (${n(best?.hpPerL ?? 0)}). ` +
          `Cheapest HP: **${cheapest?.label}** (${n(cheapest?.silverPerHp ?? 0)} silver per HP). ` +
          `Fastest HP: **${fastest?.label}** (${n(fastest?.secondsPerHp ?? 0)} s per HP).`,
      );
      report.add('');
      report.add(
        [
          'Reading the table:',
          '',
          '- **HP per leadership doubles every tier and does not depend on the leadership cost.** A rider costs 2 L',
          "  and has exactly twice a spearman's HP of the same tier, so per point of leadership the three categories",
          '  of a tier are identical on HP. Only the *strength* and the strength-against tables separate them.',
          '- **Silver per HP is flat inside a tier and rises between tiers.** Tier 1 is 2 silver per HP, tier 2 is',
          '  1.85, tier 3 is 1.46 in raw table terms — so higher tiers are *cheaper* per HP, not dearer.',
          '- **Seconds per HP is where the tiers really differ**: tier 1 is 0.1 s per HP, tier 2 is 0.67, tier 3 is',
          '  0.875. A tier-3 wall costs roughly **nine times** the training time of a tier-1 wall of the same HP.',
          '- **The specialist penalty is visible in scenario B.** SW1 carries only the specialist bonus (×1.51 health)',
          "  where every other type carries the guardsmen bonus (×2.43), so SW1's effective HP per leadership is about",
          "  40 % below SP1's — for the same 300 silver and the same 15 seconds. On this account SW1 is simply a worse",
          '  Spearman I, and it is only in the march because the setup leaves SP1 out.',
        ].join('\n'),
      );
    }

    // ---- The marches ------------------------------------------------------------------------------
    report.h('The marches: swapping SW1 out');
    report.add('');
    const marches = [
      { key: "owner's 8 (SW1 SP2 RD2 RD3 + hired)", ids: EIGHT, flag: false },
      {
        key: 'SW1 → SP3 [unowned?]',
        ids: ['spearman-3', 'spearman-2', 'rider-2', 'rider-3', ...MERC_IDS],
        flag: true,
      },
      {
        key: 'SW1 → ARC3 [unowned?]',
        ids: ['archer-3', 'spearman-2', 'rider-2', 'rider-3', ...MERC_IDS],
        flag: true,
      },
      {
        key: 'SW1 → SP3 + ARC3 [unowned?]',
        ids: ['spearman-3', 'archer-3', 'spearman-2', 'rider-2', 'rider-3', ...MERC_IDS],
        flag: true,
      },
      {
        key: 'SW1 → SP1 (owned)',
        ids: ['spearman-1', 'spearman-2', 'rider-2', 'rider-3', ...MERC_IDS],
        flag: false,
      },
      {
        key: 'SW1 → ARC2 (owned)',
        ids: ['archer-2', 'spearman-2', 'rider-2', 'rider-3', ...MERC_IDS],
        flag: false,
      },
      {
        key: 'owned alternatives all back in (12 types)',
        ids: TWELVE,
        flag: false,
      },
      {
        key: 'single-march winner: ARC2 RD2 RD3 + hired (owned)',
        ids: ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS],
        flag: false,
      },
      {
        key: 'tier-3 only: SP3 ARC3 RD3 + hired [unowned?]',
        ids: ['spearman-3', 'archer-3', 'rider-3', ...MERC_IDS],
        flag: true,
      },
    ];

    for (const [scenarioName, base] of [
      ['B (bonuses proven in game)', scenarioB(owner.twelve)],
      ['A (export bonuses)', withTemple(owner.twelve)],
    ] as const) {
      for (const method of ['msRelaxed', 'elite'] as const) {
        report.add(`### Scenario ${scenarioName} · ${method}`);
        report.add('');
        report.add(
          `| march | avg damage | vs owner's | retrain silver | damage / silver | time 0 % | time +${SPEED} % | revive gold | march |`,
        );
        report.add('|---|---|---|---|---|---|---|---|---|');
        let reference = 0;
        for (const design of marches) {
          const request = withMethod(withUnits(base, design.ids), method);
          const ev = evaluate(request);
          const slow = recoveryCosts(ev.result.stacks, request.units, {
            ...request.recovery,
            templeLevel: TEMPLE,
            trainingSpeed: {},
          });
          const fast = recoveryCosts(ev.result.stacks, request.units, fastSettings(request));
          if (reference === 0) reference = ev.summary.avgDamage;
          report.add(
            `| ${design.key} | ${n(ev.summary.avgDamage)} | ${((ev.summary.avgDamage / reference - 1) * 100).toFixed(1)} % | ${n(slow.retrain.silver)} | ${n(ev.summary.avgDamage / Math.max(1, slow.retrain.silver))} | ${duration(slow.retrain.seconds)} | ${duration(fast.retrain.seconds)} | ${n(slow.revive.gold)} | ${march(ev.result)} |`,
          );
        }
        report.add('');
      }
    }

    report.h('What B6 says');
    report.add('');
    report.add(
      [
        "- **The mechanism is not the troops' own damage — it is the HP floor they set.** Under `ms`/`msRelaxed`",
        "  every hired stack is sized just under the *smallest troop stack*, so raising the troops' HP per",
        '  leadership raises the ceiling on the mercenaries. Swapping SW1 for SP1 lifts EMH6 from 35 to 43 and ABT6',
        '  from 37 to 46; swapping it for SP3 lifts EMH6 to 61 and ABT6 to 65. That is where the +35 % and the +81 %',
        '  come from. The troop tier is a **lever on the hired half of the march**, which is the half that does most',
        '  of the damage and costs no silver.',
        "- **SW1 is the weakest unit in the owner's march and it is owned-replaceable.** Under scenario B it carries",
        '  the specialist bonus (×1.51 health, ×1.71 strength) while every other type carries the guardsmen one',
        '  (×2.43 / ×2.87), at identical leadership, silver and training time. Swapping SW1 for **SP1** — which the',
        '  account already has, merely excluded from the setup — is free damage with no change to cost or clock.',
        '- **Higher tiers buy HP with time, not silver.** Silver per HP *falls* with tier (tier 3 is the cheapest HP',
        '  in the game per silver); seconds per HP rises about ninefold from tier 1 to tier 3. So a tier-3 wall is the',
        '  right answer for a silver-bound player and the wrong one for a clock-bound player — exactly the opposite of',
        '  the usual intuition.',
        '- **SP3 / ARC3 would be a real upgrade if the account has them [unowned?].** They add HP per leadership, which',
        '  is what holds the hired stacks at the bottom of the kill order, and they cost less silver per HP than',
        '  anything the account currently fields. The price is the training clock, which multiplies (B5 §4 — and',
        '  whether those queues run in parallel is **not settled** by the repo).',
        '- **The best owned march is ARC2 + RD2 + RD3 + the four hired**, which is what the exhaustive single-march',
        '  search lands on. It does not use SW1, SP1 or SP2 at all: it spends the whole 4,343 on the types with the',
        '  best HP per leadership among the owned units, which lets EMH6 reach 75 and ABT6/LGN6/CHR6 their full caps.',
        "- **Beware the bill.** Every step up this ladder costs silver and clock: the owner's march is 1,799,300",
        '  silver and 3 d 23 h (+47.9 %); the single-march winner is 2,361,500 and 7 d 21 h; the tier-3 what-if is',
        '  3,040,100 and 14 d 6 h for +101 % damage. Per silver the ranking is much flatter (2.49 → 3.32 → 2.96), and',
        '  per *day* it inverts completely. Which one is right depends on B3: whether silver, stock or the clock binds.',
      ].join('\n'),
    );

    report.save();
  }, 600_000);
});
