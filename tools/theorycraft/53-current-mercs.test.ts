/**
 * 53 — the march with the mercenaries the owner holds *today* (2026-09-14): ABT6 15 · CHR6 7 · EMH6 14 ·
 * LGN6 16 — 52 units, against the 277 the 2026-09-13 export's caps implied. Every earlier recommendation in
 * 0016 assumed that stock; this file redoes the optimisation from scratch with the real one and prints the
 * **stack contents** of each winner rather than a reference to a chapter.
 *
 * The search is exhaustive over the mercenary vectors (15 × 16 × 8 × 17 = 32,640 per troop set), each sized
 * by the app's own sizer, then the troop counts of the leaders are hill-climbed on `simulateBattle`.
 * Scenario C, 4,343 leadership, 4 enemy squads (one per category), temple 15.
 * `THEORY=1 pnpm vitest run tools/theorycraft/53-current-mercs.test.ts`.
 */
import { describe, it } from 'vitest';

import { chunks, retrainOne, reviveOne } from '../../src/engine/recovery';
import type { StackRequest, StackResult } from '../../src/engine/types';
import {
  Report,
  evaluate,
  evaluateCounts,
  label,
  lines,
  loadOwner,
  n,
  scenarioB,
  scenarioC,
  withCaps,
  withHousing,
  withMethod,
  withUnits,
} from './harness';

/** The owner's holdings, 2026-09-14. */
const HELD: Record<string, number> = {
  'arbalester-6': 15,
  'chariot-6': 7,
  'epic-monster-hunter-6': 14,
  'legionary-6': 16,
};
const MERCS = ['epic-monster-hunter-6', 'arbalester-6', 'chariot-6', 'legionary-6'];
const ADV = ['arbalester-6', 'chariot-6', 'legionary-6'];

const SETS: Record<string, string[]> = {
  'RD3 ARC2 RD2 SP2': ['rider-3', 'archer-2', 'rider-2', 'spearman-2'],
  'RD3 ARC2 RD2': ['rider-3', 'archer-2', 'rider-2'],
  'RD3 ARC2 RD2 SP2 ARC1 SP1': ['rider-3', 'archer-2', 'rider-2', 'spearman-2', 'archer-1', 'spearman-1'],
  'all 8 owned': [
    'swordsman-1',
    'archer-1',
    'spearman-1',
    'rider-1',
    'archer-2',
    'spearman-2',
    'rider-2',
    'rider-3',
  ],
  'RD3 only': ['rider-3'],
  'RD3 SP2': ['rider-3', 'spearman-2'],
  'ARC1 giant': ['archer-1'],
};

const RECOVERY: Record<string, string[]> = {
  'retrain all troops, revive the mercenaries': [],
  'revive RD3 + the mercenaries, retrain the rest': ['rider-3'],
  'revive RD3 + tier 2 + the mercenaries': ['rider-3', 'archer-2', 'spearman-2', 'rider-2'],
  'revive everything': [
    'rider-3',
    'archer-2',
    'spearman-2',
    'rider-2',
    'archer-1',
    'spearman-1',
    'rider-1',
    'swordsman-1',
  ],
};

interface Design {
  label: string;
  troops: string;
  mercs: string;
  damage: number;
  silver: number;
  gold: number;
  seconds: number;
  stacks: string;
  counts: Record<string, number>;
}

describe.skipIf(!process.env.THEORY)(
  'with the mercenaries held today',
  () => {
    it('re-optimises the march', () => {
      const report = new Report('53-current-mercs');
      const owner = loadOwner();
      const req0 = withHousing(scenarioC(owner.twelve), { leadership: 4_400, authority: 2_180 });
      const byId = new Map(req0.units.map((u) => [u.id, u]));
      report.add(
        `Owner's holdings ${MERCS.map((id) => `${label(id)} ${HELD[id]}`).join(' · ')} = ` +
          `${Object.values(HELD).reduce((a, b) => a + b, 0)} units. Scenario C, leadership ${n(req0.housing.leadership)}, 4 enemy squads.`,
      );

      const cost = (result: StackResult, revived: string[], request: StackRequest) => {
        let silver = 0;
        let gold = 0;
        let seconds = 0;
        for (const stack of result.stacks) {
          const unit = byId.get(stack.unitId);
          if (!unit) continue;
          const atTemple = stack.pool === 'authority' || revived.includes(stack.unitId);
          const c = atTemple
            ? reviveOne(unit, stack.count, request.recovery)
            : retrainOne(unit, stack.count, request.recovery);
          silver += c.silver;
          gold += c.gold;
          seconds += c.seconds;
        }
        return { silver: Math.round(silver), gold: Math.round(gold), seconds };
      };

      /** The stack contents, first to die first — what the owner asked to see instead of a chapter reference. */
      const describe = (result: StackResult): string =>
        result.stacks.map((stack, i) => `${i + 1}. ${label(stack.unitId)} ${n(stack.count)}`).join(' · ');

      const designs: Design[] = [];
      for (const [setName, troops] of Object.entries(SETS)) {
        for (let e = 0; e <= (HELD['epic-monster-hunter-6'] ?? 0); e += 1) {
          for (let a = 0; a <= (HELD['arbalester-6'] ?? 0); a += 1) {
            for (let c = 0; c <= (HELD['chariot-6'] ?? 0); c += 1) {
              for (let l = 0; l <= (HELD['legionary-6'] ?? 0); l += 1) {
                const caps: Record<string, number> = {
                  'epic-monster-hunter-6': e,
                  'arbalester-6': a,
                  'chariot-6': c,
                  'legionary-6': l,
                };
                const mercIds = MERCS.filter((id) => (caps[id] ?? 0) > 0);
                const set = withMethod(withUnits(req0, [...troops, ...mercIds]), 'ms');
                const req = withCaps(set, caps);
                const ev = evaluate(req);
                if (ev.result.stacks.length === 0) continue;
                const plan = cost(ev.result, [], req);
                designs.push({
                  label: `${setName} · ${MERCS.map((id) => n(caps[id] ?? 0)).join('/')}`,
                  troops: setName,
                  mercs: MERCS.map((id) => `${label(id)} ${n(caps[id] ?? 0)}`).join(' · '),
                  damage: ev.summary.avgDamage,
                  silver: plan.silver,
                  gold: plan.gold,
                  seconds: plan.seconds,
                  stacks: describe(ev.result),
                  counts: Object.fromEntries(ev.result.stacks.map((s) => [s.unitId, s.count])),
                });
              }
            }
          }
        }
      }
      report.add(
        `${n(designs.length)} marches simulated (every mercenary vector × ${Object.keys(SETS).length} troop sets, app sizer).`,
      );

      const table = (rows: Design[], title: string): void => {
        report.h(title);
        report.add(
          '| what was asked for (troops · EMH6/ABT6/CHR6/LGN6) | stacks, in kill order | damage | silver | gold | training | damage / silver |\n|---|---|---|---|---|---|---|',
        );
        const seen = new Set<string>();
        for (const d of rows) {
          const dup = seen.has(d.stacks);
          seen.add(d.stacks);
          report.add(
            `| ${d.label}${dup ? ' *(same march as above)*' : ''} | ${d.stacks} | **${n(d.damage)}** | ${n(d.silver)} | ${n(d.gold)} | ${(d.seconds / 86400).toFixed(1)} d | ${(d.damage / Math.max(1, d.silver)).toFixed(2)} |`,
          );
        }
      };

      const byDamage = [...designs].sort((x, y) => y.damage - x.damage);
      const bySilver = [...designs].sort(
        (x, y) => y.damage / Math.max(1, y.silver) - x.damage / Math.max(1, x.silver),
      );
      table(byDamage.slice(0, 6), '1. Highest damage a march (any use of the 52 mercenaries)');
      table(bySilver.slice(0, 6), '2. Highest damage per silver');
      table(
        [...designs]
          .filter((d) => ADV.every((id) => !d.counts[id]))
          .sort((x, y) => y.damage - x.damage)
          .slice(0, 4),
        '3. Highest damage with the irreplaceable mercenaries untouched (EMH6 only)',
      );

      // The winner stack by stack, with the strikes each one gets: the reason the shape wins.
      report.h('1b. The winner, stack by stack');
      const winner = byDamage[0];
      if (winner) {
        const ids = Object.keys(winner.counts);
        const req = withCaps(withMethod(withUnits(req0, ids), 'ms'), winner.counts);
        const ev = evaluateCounts(req, winner.counts);
        const ls = lines(ev);
        const hit = (row: (typeof ls)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
        report.add(
          '| # | stack | units | total HP | a hit | strikes (enemy first / we first) | damage |\n|---|---|---|---|---|---|---|',
        );
        for (const row of ls) {
          report.add(
            `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ` +
              `${row.hitsEnemyFirst} / ${row.hitsArmyFirst} (avg ${hit(row)}) | ${n(Math.round(hit(row) * row.damagePerHit))} |`,
          );
        }
        const merc = ls
          .filter((row) => MERCS.includes(row.unitId))
          .reduce((s, row) => s + hit(row) * row.damagePerHit, 0);
        const rungs = ls
          .filter((row) => !MERCS.includes(row.unitId))
          .reduce((s, row) => s + hit(row) * row.damagePerHit, 0);
        report.add(
          `\nmercenaries ${n(Math.round(merc))} (${((100 * merc) / (merc + rungs)).toFixed(0)} % of the march) · troops ${n(Math.round(rungs))} · total ${n(Math.round(merc + rungs))}`,
        );
      }

      // The same ladder with only EMH6, and with the EMH6 the owner earns back each week.
      report.h("3b. The same ladder with EMH6 alone, at today's 14 and at larger EMH6 counts");
      report.add(
        '| EMH6 fielded | stacks, in kill order | damage | silver | gold | damage / silver |\n|---|---|---|---|---|---|',
      );
      const troopCounts = Object.fromEntries(
        Object.entries(winner?.counts ?? {}).filter(([id]) => !MERCS.includes(id)),
      );
      for (const e of [14, 30, 46, 60, 92]) {
        const counts = { ...troopCounts, 'epic-monster-hunter-6': e };
        const ids = Object.keys(counts);
        const req = withCaps(withMethod(withUnits(req0, ids), 'ms'), counts);
        const ev = evaluateCounts(req, counts);
        if (ev.result.stacks.length === 0) continue;
        const plan = cost(ev.result, [], req);
        report.add(
          `| ${e} | ${describe(ev.result)} | **${n(ev.summary.avgDamage)}** | ${n(plan.silver)} | ${n(plan.gold)} | ${(ev.summary.avgDamage / Math.max(1, plan.silver)).toFixed(2)} |`,
        );
      }

      // The recovery options, for the three winners.
      report.h('4. The recovery options for each winner');
      report.add('| stacks | option | silver | gold | training |\n|---|---|---|---|---|');
      const picks = [byDamage[0], bySilver[0]].filter((d): d is Design => Boolean(d));
      const seen = new Set<string>();
      for (const pick of picks) {
        if (seen.has(pick.stacks)) continue;
        seen.add(pick.stacks);
        const troopIds = Object.keys(pick.counts).filter((id) => !MERCS.includes(id));
        const req = withCaps(
          withMethod(withUnits(req0, [...troopIds, ...MERCS.filter((id) => pick.counts[id])]), 'ms'),
          pick.counts,
        );
        const result = evaluateCounts(req, pick.counts).result;
        for (const [name, revived] of Object.entries(RECOVERY)) {
          const plan = cost(result, revived, req);
          report.add(
            `| ${pick.stacks} | ${name} | ${n(plan.silver)} | ${n(plan.gold)} | ${(plan.seconds / 86400).toFixed(1)} d |`,
          );
        }
      }

      // Weekly rate with the owner's flows: 5 M silver, 10 k gold, 95 EMH6 a week.
      report.h('5. What that is worth a week (5 M silver, 10 k gold, 95 EMH6 a week)');
      const weekly = (d: Design, emhFlow = 95): string => {
        const emhLost = chunks(d.counts['epic-monster-hunter-6'] ?? 0);
        const k = Math.min(
          d.silver > 0 ? 5_000_000 / d.silver : Infinity,
          d.gold > 0 ? 10_000 / d.gold : Infinity,
          emhLost > 0 ? emhFlow / emhLost : Infinity,
        );
        return `${k.toFixed(2)} marches · **${n(Math.round(k * d.damage))}** damage · ${n(Math.round(k * d.silver))} silver · ${n(Math.round(k * d.gold))} gold`;
      };
      for (const d of [...byDamage.slice(0, 2), ...bySilver.slice(0, 1)]) {
        report.add(`- ${d.stacks} — ${weekly(d)}`);
      }
      report.add(
        `\nEMH6 note: ${n(chunks(HELD['epic-monster-hunter-6'] ?? 0))} lost a march at today's 14, so the 95-a-week income ` +
          `supports about ${Math.floor(95 / Math.max(1, chunks(HELD['epic-monster-hunter-6'] ?? 0)))} marches a week of that size — never the binding constraint here.`,
      );
      // ---- the owner's own calculation, checked in the same engine call ----------------------------
      report.h("6. The owner's own march, checked against this engine");
      const HIS: Record<string, number> = {
        'swordsman-1': 740,
        'archer-1': 738,
        'spearman-1': 737,
        'rider-1': 368,
        'archer-2': 408,
        'spearman-2': 407,
        'rider-2': 203,
        'rider-3': 114,
        'legionary-6': 16,
        'arbalester-6': 15,
        'epic-monster-hunter-6': 14,
        'chariot-6': 7,
      };
      const reqHis = withCaps(withMethod(withUnits(req0, Object.keys(HIS)), 'ms'), HIS);
      const evHis = evaluateCounts(reqHis, HIS);
      const planHis = cost(evHis.result, [], reqHis);
      report.add(
        `his march: ${describe(evHis.result)}\n` +
          `engine: avg **${n(evHis.summary.avgDamage)}** · worst opening ${n(evHis.summary.minDamage)} · best ${n(evHis.summary.maxDamage)} · ` +
          `silver ${n(planHis.silver)} · gold ${n(planHis.gold)} · ${(evHis.summary.avgDamage / Math.max(1, planHis.silver)).toFixed(2)} per silver\n` +
          `his tool: 2,548,799 · 2,526,599 · — · 1,655,400 · 408 · 1.54`,
      );
      const lsHis = lines(evHis);
      const hitHis = (row: (typeof lsHis)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
      report.add(
        '| # | stack | units | total HP | a hit | strikes E/A | damage |\n|---|---|---|---|---|---|---|',
      );
      for (const row of lsHis) {
        report.add(
          `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(Math.round(hitHis(row) * row.damagePerHit))} |`,
        );
      }
      if (winner) {
        report.add(
          `\nthis engine's best at the same housing: ${winner.stacks} → **${n(winner.damage)}** · silver ${n(winner.silver)} · gold ${n(winner.gold)} · ` +
            `${(winner.damage / Math.max(1, winner.silver)).toFixed(2)} per silver · ${n(winner.damage - evHis.summary.avgDamage)} more damage than his for ${n(winner.silver - planHis.silver)} silver`,
        );
      }

      // Which bonus set reproduces the tool's damage on the same counts? The counts are an input, so the
      // damage is the only thing the two models can disagree about.
      report.h('6b. Which input explains the 33 % gap on the same counts');
      report.add('| bonus scenario | avg damage | worst opening | gold | silver |\n|---|---|---|---|---|');
      const scenarios: [string, StackRequest][] = [
        ['C — the 2026-09-14 report (+161 / +190)', req0],
        [
          'B — the 2026-09-13 report (+143 / +187)',
          withHousing(scenarioB(owner.twelve), { leadership: 4_400, authority: 2_180 }),
        ],
        [
          'A — the export, VIP +3 / +3 only',
          withHousing(owner.twelve, { leadership: 4_400, authority: 2_180 }),
        ],
      ];
      for (const [name, base] of scenarios) {
        const req = withCaps(withMethod(withUnits(base, Object.keys(HIS)), 'ms'), HIS);
        const ev = evaluateCounts(req, HIS);
        const plan = cost(ev.result, [], req);
        report.add(
          `| ${name} | **${n(ev.summary.avgDamage)}** | ${n(ev.summary.minDamage)} | ${n(plan.gold)} | ${n(plan.silver)} |`,
        );
      }
      report.add(
        `\nhis tool: 2,548,799 · 2,526,599 · 408 gold · 1,655,400 silver. Gold × 1.53 = ${n(Math.round(planHis.gold * 1.53))} — ` +
          `the tool's gold is this engine's without the temple-15 divisor, so its profile carries no temple level (or level 0).`,
      );
      report.save();
    });
  },
  900_000,
);
