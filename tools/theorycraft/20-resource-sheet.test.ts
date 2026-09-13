/**
 * B1 — the resource sheet of one march, per design.
 *
 * What one epic-monster march costs the account, in every currency the game actually charges, for five
 * designs of the same army. Every damage figure is `simulateBattle` through the harness; every cost
 * figure is `recoveryCosts` (src/engine/recovery.ts) on the stacks the sizer produced, so a reader can
 * re-derive each cell from the formulas quoted at the top of that file.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/20-resource-sheet.test.ts`
 */
import { describe, it } from 'vitest';

import { chunks, recoveryCosts, templeDivisor } from '../../src/engine/recovery';
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
  withCaps,
  withMethod,
  withUnits,
} from './harness';

/** The account's real temple (the export says 0; the owner's temple is 15 → ÷1.53). */
const TEMPLE = 15;
/** The training-speed bonus the in-game army card shows on this account. */
const SPEED = 47.9;

function withTemple(request: StackRequest): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE } };
}
function withSpeed(request: StackRequest, percent: number): StackRequest {
  return {
    ...request,
    recovery: {
      ...request.recovery,
      trainingSpeed: percent === 0 ? {} : { guardsmen: percent, specialist: percent },
    },
  };
}

describe.skipIf(!process.env.THEORY)('B1 resource sheet', () => {
  it('prices one march of each design', () => {
    const report = new Report('20-resource-sheet');
    const owner = loadOwner();
    const TWELVE = owner.twelve.units.map((unit) => unit.id);

    report.add('# B1 — what one march costs, per design');
    report.add('');
    report.add(
      `Housing leadership ${n(owner.twelve.housing.leadership)}, authority ${n(owner.twelve.housing.authority)} ` +
        `(the owner's correction of 2026-09-14; the export's 200 was a typo). Mercenary stock ` +
        `EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37 = 314 authority, so the **caps** bind, never the authority pool.`,
    );
    report.add('');
    report.add(
      `Temple ${TEMPLE} → revival gold ÷ ${templeDivisor(TEMPLE)}. Training speed is shown at 0 % and at ` +
        `+${SPEED} % (the figure on the in-game army card, passed as ` +
        '`request.recovery.trainingSpeed = { guardsmen: 47.9, specialist: 47.9 }`).',
    );
    report.add('');
    report.add('## How each column is computed');
    report.add('');
    report.add(
      [
        '- **avg damage** — `simulateBattle(...).avgDamage` on the stacks `sizeStacks` produced.',
        '- **retrain silver** — `Σ troops n × training.silver`. Mercenaries have no `training` record, so they',
        '  contribute nothing: they cannot be recruited again, which is the whole point of the sheet.',
        '- **retrain gold** — under a "retrain all" the mercenaries still have to come out of the Temple, so the',
        '  engine charges their revive gold here (`retrainOne` → `reviveOne(...).gold` for non-leadership pools).',
        '- **revive gold** — `Σ all (n − chunks(n)) × revival.gold / 1.53`, the whole army at 90 %.',
        '- **revive silver** — `Σ all chunks(n) × training.silver`: the tenth of every stack the Temple will not',
        '  bring back and that must be recruited again. Mercenaries contribute 0 silver — their tenth is simply gone.',
        '- **potions** — 3 sacred potions per unit revived, i.e. `3 × Σ (n − chunks(n))`, the potion price of the',
        '  same 90 % the gold column buys (it is one or the other, never both).',
        '- **merc units lost** — `Σ chunks(n)` over the hired stacks: stock that will never come back.',
        '- **training time** — `Σ troops n × training.seconds / (1 + speed/100)` under a full retrain.',
      ].join('\n'),
    );

    interface Design {
      key: string;
      ids: readonly string[];
      method: 'elite' | 'ms' | 'msRelaxed';
      caps?: Record<string, number>;
      note?: string;
    }
    const halfCaps: Record<string, number> = {
      'epic-monster-hunter-6': 46,
      'arbalester-6': 38,
      'legionary-6': 36,
      'chariot-6': 19,
    };
    /** The exhaustive single-march winner over the 12 types at authority 2,000 (01-kai §"searchPriority"). */
    const SEVEN = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;
    const designs: Design[] = [
      {
        key: '7-type msRelaxed (single-march winner)',
        ids: SEVEN,
        method: 'msRelaxed',
        note: 'ARC2 + RD2 + RD3 + the four hired types; no SW1, no SP2',
      },
      { key: '8-type msRelaxed', ids: EIGHT, method: 'msRelaxed' },
      { key: '8-type elite', ids: EIGHT, method: 'elite' },
      { key: '12-type elite', ids: TWELVE, method: 'elite' },
      { key: '12-type msRelaxed', ids: TWELVE, method: 'msRelaxed' },
      {
        key: '8-type msRelaxed, mercs at half spend',
        ids: EIGHT,
        method: 'msRelaxed',
        caps: halfCaps,
        note: 'caps halved (ceil): EMH6 46 · ABT6 38 · LGN6 36 · CHR6 19',
      },
    ];

    interface Row {
      key: string;
      marchLine: string;
      avg: number;
      min: number;
      retrainSilver: number;
      retrainGold: number;
      reviveGold: number;
      reviveSilver: number;
      potions: number;
      mercLost: number;
      mercFielded: number;
      seconds0: number;
      secondsFast: number;
      leadership: number;
      authority: number;
    }

    const sheet = (base: StackRequest, design: Design): Row => {
      let request = withMethod(withUnits(base, design.ids), design.method);
      if (design.caps) request = withCaps(request, design.caps);
      const ev = evaluate(request);
      const costs = recoveryCosts(ev.result.stacks, request.units, request.recovery);
      const slow = recoveryCosts(ev.result.stacks, request.units, withSpeed(request, 0).recovery);
      const fast = recoveryCosts(ev.result.stacks, request.units, withSpeed(request, SPEED).recovery);
      let potions = 0;
      let mercLost = 0;
      let mercFielded = 0;
      for (const stack of ev.result.stacks) {
        potions += 3 * (stack.count - chunks(stack.count));
        if (stack.pool === 'authority') {
          mercLost += chunks(stack.count);
          mercFielded += stack.count;
        }
      }
      return {
        key: design.key,
        marchLine: march(ev.result),
        avg: ev.summary.avgDamage,
        min: ev.summary.minDamage,
        retrainSilver: costs.retrain.silver,
        retrainGold: costs.retrain.gold,
        reviveGold: costs.revive.gold,
        reviveSilver: costs.revive.silver,
        potions,
        mercLost,
        mercFielded,
        seconds0: slow.retrain.seconds,
        secondsFast: fast.retrain.seconds,
        leadership: ev.result.pools.leadership.used,
        authority: ev.result.pools.authority.used,
      };
    };

    for (const [scenarioName, base] of [
      ['A (export bonuses, VIP +3/+3)', withTemple(owner.twelve)],
      ['B (bonuses proven in game 2026-09-13)', scenarioB(owner.twelve)],
    ] as const) {
      report.h(`Scenario ${scenarioName}`);
      const rows = designs.map((design) => sheet(base, design));

      report.add('### The marches');
      report.add('');
      for (const [index, row] of rows.entries()) {
        const note = designs[index]?.note;
        report.add(`- **${row.key}**${note ? ` (${note})` : ''} — ${row.marchLine}`);
      }
      report.add('');

      report.add('### Damage and the bill');
      report.add('');
      report.add(
        '| design | avg damage | min damage | retrain silver | retrain gold | revive gold | revive silver | potions | merc fielded | merc lost |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|');
      for (const row of rows) {
        report.add(
          `| ${row.key} | ${n(row.avg)} | ${n(row.min)} | ${n(row.retrainSilver)} | ${n(row.retrainGold)} | ${n(row.reviveGold)} | ${n(row.reviveSilver)} | ${n(row.potions)} | ${n(row.mercFielded)} | ${n(row.mercLost)} |`,
        );
      }
      report.add('');

      report.add('### Training time and the ratios');
      report.add('');
      report.add(
        `| design | time 0 % | time +${SPEED} % | damage / retrain silver | damage / revive gold | damage / merc lost | L used | A used |`,
      );
      report.add('|---|---|---|---|---|---|---|---|');
      for (const row of rows) {
        report.add(
          `| ${row.key} | ${duration(row.seconds0)} | ${duration(row.secondsFast)} | ${n(row.avg / Math.max(1, row.retrainSilver))} | ${n(row.avg / Math.max(1, row.reviveGold))} | ${n(Math.round(row.avg / Math.max(1, row.mercLost)))} | ${n(row.leadership)} | ${n(row.authority)} |`,
        );
      }
      report.add('');
      const best = [...rows].sort((a, b) => b.avg - a.avg)[0];
      const cheapest = [...rows].sort(
        (a, b) => b.avg / Math.max(1, b.mercLost) - a.avg / Math.max(1, a.mercLost),
      )[0];
      report.add(
        `Most damage in one march: **${best?.key}** (${n(best?.avg ?? 0)}). Most damage per mercenary ` +
          `burnt: **${cheapest?.key}** (${n(Math.round((cheapest?.avg ?? 0) / Math.max(1, cheapest?.mercLost ?? 1)))} ` +
          `per unit of stock). Those are not the same design, which is the whole of B3.`,
      );
    }

    // ---- Where the silver and the seconds actually go --------------------------------------------
    report.h('Per unit type: the retrain price of one unit');
    report.add('');
    report.add(
      '| unit | pool | group | leadership | training silver | training seconds | revival gold | gold at temple 15 |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    for (const id of [...TWELVE]) {
      const unit = unitById(id);
      if (!unit) continue;
      report.add(
        `| ${unit.label} | ${unit.pool} | ${unit.group ?? '—'} | ${n(unit.cost)} | ${unit.training ? n(unit.training.silver) : '— (cannot be retrained)'} | ${unit.training ? n(unit.training.seconds) : '—'} | ${n(unit.revival.gold)} | ${n(unit.revival.gold / templeDivisor(TEMPLE))} |`,
      );
    }
    report.add('');
    report.add(
      `The four hired types (${MERC_IDS.map((id) => unitById(id)?.label ?? id).join(', ')}) have no training row at ` +
        'all. That single fact is why a campaign is a stock problem and not a silver problem: silver buys troops back, ' +
        'nothing buys mercenaries back, and the Temple only ever returns nine of every ten.',
    );

    report.save();
  }, 600_000);
});
