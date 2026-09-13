/**
 * B4 — retrain, revive, or a bit of both.
 *
 * After a march every stack is dead. Two ways back, and they are priced in different currencies:
 *
 *   - **retrain** — recruit the lost troops again in the Army tab: `n × training.silver` and
 *     `n × training.seconds`. Mercenaries have no training row, so the 90 % of them still has to come out
 *     of the Temple in gold whatever you choose (`retrainOne` charges it).
 *   - **revive** — the Temple returns `n − ceil(n/10)` of every stack for `revival.gold / 1.53` each (temple
 *     15) or **3 sacred potions** per unit. The remaining `ceil(n/10)` cannot be revived at all: it is
 *     recruited again, so a "revive all" still costs `ceil(n/10) × training.silver` and the matching seconds.
 *
 * So reviving is an exchange: gold (or potions) in, silver and time out. This file prices that exchange per
 * unit type, ranks the types to revive first when gold is short, and prints a full march under every plan
 * `request.recovery.plan` offers.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/24-recovery-choice.test.ts`
 */
import { describe, it } from 'vitest';

import { chunks, recoveryCosts, reviveOne, retrainOne, templeDivisor } from '../../src/engine/recovery';
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
const DIVISOR = templeDivisor(TEMPLE);
const SEVEN = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;

function withTemple(request: StackRequest): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE } };
}
function withPlan(
  request: StackRequest,
  mode: 'retrain' | 'revive' | 'selective',
  top?: number,
): StackRequest {
  return {
    ...request,
    recovery: {
      ...request.recovery,
      templeLevel: TEMPLE,
      plan: { mode, ...(top === undefined ? {} : { selectiveTop: top }) },
    },
  };
}

describe.skipIf(!process.env.THEORY)('B4 recovery choice', () => {
  it('prices retrain against revive', () => {
    const report = new Report('24-recovery-choice');
    const owner = loadOwner();
    const TWELVE = owner.twelve.units.map((unit) => unit.id);

    report.add('# B4 — retrain, revive, or a bit of both');
    report.add('');
    report.add(
      `Temple ${TEMPLE} on this account, so every revived unit costs \`revival.gold / ${DIVISOR}\` — or **3 sacred ` +
        'potions**, the same 90 %, never both. The tenth of every stack (`ceil(n/10)`) cannot be revived and is ' +
        'recruited again, which is why a "revive all" still shows silver and a training timer.',
    );

    // ---- The exchange rate, per unit type -------------------------------------------------------
    report.h('1. The exchange rate per unit type');
    report.add('');
    report.add(
      'For one unit brought back by the Temple instead of the Army tab:\n\n' +
        '```\nsilver saved per gold spent  = training.silver × templeDivisor / revival.gold\n' +
        'silver saved per potion       = training.silver / 3\n' +
        'seconds saved per gold spent  = training.seconds × templeDivisor / revival.gold\n```\n\n' +
        'The temple divisor is the *only* place the temple level enters: it never touches silver or time.',
    );
    report.add('');
    interface Rate {
      id: string;
      label: string;
      silver: number;
      seconds: number;
      gold: number;
      perGold: number;
      perPotion: number;
      secondsPerGold: number;
    }
    const rates: Rate[] = [];
    for (const id of TWELVE) {
      const unit = unitById(id);
      if (!unit) continue;
      const silver = unit.training?.silver ?? 0;
      const seconds = unit.training?.seconds ?? 0;
      const goldPerUnit = unit.revival.gold / DIVISOR;
      rates.push({
        id,
        label: unit.label,
        silver,
        seconds,
        gold: unit.revival.gold,
        perGold: goldPerUnit > 0 ? silver / goldPerUnit : 0,
        perPotion: silver / 3,
        secondsPerGold: goldPerUnit > 0 ? seconds / goldPerUnit : 0,
      });
    }
    rates.sort((a, b) => b.perGold - a.perGold || a.label.localeCompare(b.label));
    report.add(
      '| rank | unit | training silver | training seconds | revival gold | gold at temple 15 | **silver per gold** | silver per potion | seconds per gold |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const [index, rate] of rates.entries()) {
      report.add(
        `| ${index + 1} | ${rate.label} | ${rate.silver > 0 ? n(rate.silver) : '— (hired)'} | ${rate.seconds > 0 ? n(rate.seconds) : '—'} | ${n(rate.gold)} | ${n(rate.gold / DIVISOR)} | ${rate.perGold > 0 ? n(rate.perGold) : '0'} | ${rate.perPotion > 0 ? n(rate.perPotion) : '0'} | ${rate.secondsPerGold > 0 ? n(rate.secondsPerGold) : '0'} |`,
      );
    }
    report.add('');
    report.add(
      [
        '**Revive in this order when gold is short.** The ranking is `training.silver × 1.53 / revival.gold`, and it',
        'is a property of the unit type alone — it does not depend on the march, the bonuses or the stack size.',
        `Top of the list: **${rates[0]?.label}** at ${n(rates[0]?.perGold ?? 0)} silver per gold. Bottom of the useful`,
        'list are the tier-1 types (ARC1, SP1, SW1, RD1) at 114.75 — a rider I costs twice the silver of an archer I',
        'but also twice the revival gold, so they tie exactly.',
        '',
        '**The four hired types are a different question entirely.** They have no training row, so reviving them',
        'saves no silver at all — the ratio is 0. You revive them because the alternative is not "pay silver", it is',
        '**losing them for ever**. Their gold is not optional: it is the rent on the stock, and it is charged under',
        'the retrain plan too.',
      ].join('\n'),
    );

    // ---- Gold-efficient selective ----------------------------------------------------------------
    report.h('2. Selective recovery: what the game offers and what the ranking wants');
    report.add('');
    report.add(
      'The Temple offers TOP 1 / TOP 2 / TOP 3 / CUSTOM, and the engine implements "top-N by tier, retrain the ' +
        'rest" (`recoveryCosts` sorts by `unit.tier`). That is **not** the gold-efficient order: tier and ' +
        "`silver × 1.53 / gold` are different rankings. Below, both, for the owner's 8-type march.",
    );
    report.add('');

    for (const [scenarioName, base] of [
      ['A (export bonuses)', withTemple(owner.twelve)],
      ['B (bonuses proven in game)', scenarioB(owner.twelve)],
    ] as const) {
      for (const design of [
        { key: "owner's 8 types", ids: EIGHT },
        { key: 'single-march winner, 7 types', ids: SEVEN },
      ] as const) {
        const request = withMethod(withUnits(base, design.ids), 'msRelaxed');
        const ev = evaluate(request);
        const stacks = ev.result.stacks;
        const costs = recoveryCosts(stacks, request.units, withPlan(request, 'retrain').recovery);
        const potionsAll = stacks.reduce((sum, s) => sum + 3 * (s.count - chunks(s.count)), 0);

        report.add(`### ${scenarioName} · ${design.key}`);
        report.add('');
        report.add(`March: ${march(ev.result)} — ${n(ev.summary.avgDamage)} avg damage.`);
        report.add('');
        report.add(
          '| plan | silver | gold | potions instead of gold | training time 0 % | damage / silver | damage / gold |',
        );
        report.add('|---|---|---|---|---|---|---|');
        const planRows: { key: string; silver: number; gold: number; seconds: number; potions: number }[] = [
          {
            key: 'retrain all',
            silver: costs.retrain.silver,
            gold: costs.retrain.gold,
            seconds: costs.retrain.seconds,
            potions: stacks
              .filter((s) => s.pool !== 'leadership')
              .reduce((sum, s) => sum + 3 * (s.count - chunks(s.count)), 0),
          },
          {
            key: 'revive all',
            silver: costs.revive.silver,
            gold: costs.revive.gold,
            seconds: costs.revive.seconds,
            potions: potionsAll,
          },
        ];
        for (let top = 1; top <= request.units.length; top += 1) {
          const selective = recoveryCosts(
            stacks,
            request.units,
            withPlan(request, 'selective', top).recovery,
          );
          const revived = new Set(selective.selectiveRevived);
          const potions = stacks
            .filter((s) => revived.has(s.unitId) || s.pool !== 'leadership')
            .reduce((sum, s) => sum + 3 * (s.count - chunks(s.count)), 0);
          planRows.push({
            key: `selective TOP ${top} by tier (${selective.selectiveRevived.map((id) => unitById(id)?.label ?? id).join(' ')})`,
            silver: selective.selective.silver,
            gold: selective.selective.gold,
            seconds: selective.selective.seconds,
            potions,
          });
        }
        for (const row of planRows) {
          report.add(
            `| ${row.key} | ${n(row.silver)} | ${n(row.gold)} | ${n(row.potions)} | ${duration(row.seconds)} | ${n(ev.summary.avgDamage / Math.max(1, row.silver))} | ${n(ev.summary.avgDamage / Math.max(1, row.gold))} |`,
          );
        }
        report.add('');

        // The gold-efficient frontier: revive types in silver-per-gold order.
        report.add(
          '**Note on TOP N.** The engine ranks by `unit.tier`, and the four hired types are tier 6, so TOP 1 to ' +
            'TOP 4 revive *only mercenaries* — which costs exactly what retraining them costs, because a mercenary ' +
            'is bought back in gold either way. **The first four steps of the in-game selective plan change ' +
            'nothing at all on this account.** Only TOP 5 and beyond start saving silver, and they do it in tier ' +
            'order (RD3, then RD2, then SP2…), which happens to agree with the gold-efficient order here but ' +
            'need not in general.',
        );
        report.add('');
        report.add('**Gold-efficient frontier** — revive the troop types in `silver × 1.53 / gold` order:');
        report.add('');
        report.add(
          '| types revived (best first) | gold spent | silver paid | silver saved vs retrain all | silver saved per extra gold |',
        );
        report.add('|---|---|---|---|---|');
        const troopStacks = stacks.filter((s) => s.pool === 'leadership');
        const order = [...troopStacks].sort((a, b) => {
          const ra = rates.find((r) => r.id === a.unitId)?.perGold ?? 0;
          const rb = rates.find((r) => r.id === b.unitId)?.perGold ?? 0;
          return rb - ra;
        });
        let previousGold = costs.retrain.gold;
        let previousSilver = costs.retrain.silver;
        const chosen: string[] = [];
        report.add(
          `| (none — retrain all) | ${n(costs.retrain.gold)} | ${n(costs.retrain.silver)} | 0 | — |`,
        );
        for (const stack of order) {
          chosen.push(stack.unitId);
          const set = new Set(chosen);
          let silver = 0;
          let gold = 0;
          for (const s of stacks) {
            const unit = request.units.find((u) => u.id === s.unitId);
            if (!unit) continue;
            const cost =
              set.has(s.unitId) || unit.pool !== 'leadership'
                ? reviveOne(unit, s.count, withPlan(request, 'revive').recovery)
                : retrainOne(unit, s.count, withPlan(request, 'retrain').recovery);
            silver += cost.silver;
            gold += cost.gold;
          }
          silver = Math.round(silver);
          gold = Math.round(gold);
          const rate = gold > previousGold ? (previousSilver - silver) / (gold - previousGold) : 0;
          report.add(
            `| ${chosen.map((id) => unitById(id)?.label ?? id).join(' + ')} | ${n(gold)} | ${n(silver)} | ${n(costs.retrain.silver - silver)} | ${n(rate)} |`,
          );
          previousGold = gold;
          previousSilver = silver;
        }
        report.add('');
      }
    }

    // ---- What reviving does to a campaign ---------------------------------------------------------
    report.h('3. What reviving does to the campaign of B3');
    report.add('');
    report.add(
      'A march at full leadership costs the same silver every time, so the only thing that changes is *how much*. ' +
        "Reviving everything divides the troops' silver by about ten (only `ceil(n/10)` is recruited) and the " +
        'training time by the same factor, and replaces it with gold. The stock still falls by `ceil(n/10)` a ' +
        'march either way — **nothing buys a mercenary back**.',
    );
    report.add('');
    report.add(
      '| scenario | march | retrain silver | revive silver | ÷ | retrain gold | revive gold | potions instead | marches for 20 M silver (retrain) | marches for 20 M silver (revive) | gold for those marches |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|');
    for (const [scenarioName, base] of [
      ['A', withTemple(owner.twelve)],
      ['B', scenarioB(owner.twelve)],
    ] as const) {
      for (const design of [
        { key: '8 types', ids: EIGHT },
        { key: '7 types', ids: SEVEN },
      ] as const) {
        const request = withMethod(withUnits(base, design.ids), 'msRelaxed');
        const ev = evaluate(request);
        const costs = recoveryCosts(ev.result.stacks, request.units, withPlan(request, 'retrain').recovery);
        const potionsAll = ev.result.stacks.reduce((sum, s) => sum + 3 * (s.count - chunks(s.count)), 0);
        const budget = 2e7;
        const retrainMarches = Math.floor(budget / Math.max(1, costs.retrain.silver));
        const reviveMarches = Math.floor(budget / Math.max(1, costs.revive.silver));
        report.add(
          `| ${scenarioName} | ${design.key} | ${n(costs.retrain.silver)} | ${n(costs.revive.silver)} | ${(costs.retrain.silver / Math.max(1, costs.revive.silver)).toFixed(1)} | ${n(costs.retrain.gold)} | ${n(costs.revive.gold)} | ${n(potionsAll)} | ${n(retrainMarches)} | ${n(reviveMarches)} | ${n(reviveMarches * costs.revive.gold)} |`,
        );
      }
    }
    report.add('');
    report.add(
      [
        '- **Silver per march falls by a factor of ~10** (the tenth that cannot be revived), so a 20 M silver budget',
        '  goes from ~11 marches to ~110 — except the stock runs out long before that: at 30 mercenaries lost a',
        '  march, the full-cap plan has about 10 marches in it whatever the silver. Reviving therefore converts the',
        '  owner\'s problem from "silver-bound" to "stock-bound and gold-bound", which is exactly the regime where',
        "  B3's spend lever starts to matter.",
        '- **The gold bill is the new constraint.** Reviving a full 7-type march costs ~11.6 K gold; thirty of them',
        '  is ~350 K gold. If gold is short, the frontier tables above say which types to buy back first, and the',
        '  answer is always the *expensive-to-train, cheap-to-revive* ones — RD3 first, then RD2 and SP2/ARC2.',
        '- **Potions are the gold-free alternative at 3 per unit.** A full 7-type march needs ~8,850 potions to',
        '  revive its 90 %; the same march is ~11.6 K gold. That sets the internal exchange rate of this account at',
        '  roughly **1.3 gold per potion** — below that, pay gold; above it, spend potions.',
        '- **Nothing here saves a mercenary.** The `ceil(n/10)` toll is untouched by the recovery plan: it is the',
        '  10 % the Temple explicitly refuses, and the hired types have no Army-tab price at which to buy it back.',
      ].join('\n'),
    );

    report.save();
  }, 600_000);
});
