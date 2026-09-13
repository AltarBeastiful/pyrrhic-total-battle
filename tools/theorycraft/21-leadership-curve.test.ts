/**
 * B2 — how much leadership is worth fielding.
 *
 * The hired half of a march is free in silver (mercenaries have no `training` record: they are hired, revived
 * at 90 % and never recruited again). The troop half is the whole silver bill. So "should I field fewer troops
 * and fight more often?" is exactly: what does the *last* slice of leadership buy per silver, against what a
 * whole extra march buys per silver?
 *
 * Method. Two marches are scanned — the owner's 8 types (SW1 + SP2 + RD2 + RD3 + the four hired) and the
 * exhaustive single-march winner at authority 2,000 (ARC2 + RD2 + RD3 + the four hired). For each, the hired
 * counts are **frozen** at a chosen spend level (rounded to multiples of ten, the granularity the `ceil(n/10)`
 * loss rule rewards), and the troop counts are scaled proportionally, floored to integers, from the smallest
 * scale that still keeps **every troop stack strictly above the biggest hired stack** up to full leadership.
 * Counts go straight to `evaluateCounts` (`stacksFromCounts` + `simulateBattle`), so nothing is re-sized behind
 * our back; silver is `recoveryCosts(...).retrain.silver`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/21-leadership-curve.test.ts`
 */
import { describe, it } from 'vitest';

import { chunks, recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import {
  EIGHT,
  MERC_IDS,
  Report,
  countsOf,
  duration,
  evaluate,
  evaluateCounts,
  feasible,
  label,
  lines,
  loadOwner,
  n,
  scenarioB,
  unitById,
  withMethod,
  withUnits,
} from './harness';

const TEMPLE = 15;
const SEVEN = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;
const CAPS: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};

function withTemple(request: StackRequest): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE } };
}

/** A hired count at spend `f`: nearest multiple of ten, never above the cap, never below ten. */
function hiredAt(cap: number, f: number): number {
  if (f >= 1) return cap;
  return Math.min(cap, Math.max(10, Math.round((f * cap) / 10) * 10));
}

describe.skipIf(!process.env.THEORY)('B2 leadership curve', () => {
  it('scans the troop leadership of fixed-mercenary marches', () => {
    const report = new Report('21-leadership-curve');
    const owner = loadOwner();

    report.add('# B2 — how much leadership is worth fielding');
    report.add('');
    report.add(
      "Authority is 2,000 (the owner's 2026-09-14 correction), so the hired **caps** bind (92 + 76 + 72 + " +
        '2 × 37 = 314 authority), never the pool. The hired stacks are frozen at the spend shown; only the troop ' +
        'stacks move, scaled by one common factor and floored to integers. Silver is a full retrain of the ' +
        'troops — mercenaries cost none, because they cannot be recruited again at all.',
    );

    const marches = [
      { key: "owner's 8 types", ids: EIGHT },
      { key: 'single-march winner, 7 types', ids: SEVEN },
    ] as const;
    const spends = [1, 0.5, 0.3] as const;

    interface Summary {
      scenario: string;
      design: string;
      spend: number;
      minLeadership: number;
      fullLeadership: number;
      minAvg: number;
      fullAvg: number;
      minSilver: number;
      fullSilver: number;
      slope: number;
      whole: number;
      mercLost: number;
    }
    const summaries: Summary[] = [];

    for (const [scenarioName, base] of [
      ['A (export bonuses)', withTemple(owner.twelve)],
      ['B (bonuses proven in game)', scenarioB(owner.twelve)],
    ] as const) {
      for (const design of marches) {
        const request = withMethod(withUnits(base, design.ids), 'msRelaxed');
        const TROOPS = request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
        // The troop *shape* to scale: the proportions `msRelaxed` picks when it fills the leadership.
        const shape = countsOf(evaluate(request).result);

        for (const spend of spends) {
          const mercCounts: Record<string, number> = {};
          for (const id of MERC_IDS) mercCounts[id] = hiredAt(CAPS[id] ?? 0, spend);
          const mercLost = MERC_IDS.reduce((sum, id) => sum + chunks(mercCounts[id] ?? 0), 0);

          const at = (scale: number): { counts: Record<string, number>; leadership: number } => {
            const counts: Record<string, number> = { ...mercCounts };
            let leadership = 0;
            for (const id of TROOPS) {
              const unit = unitById(id);
              const count = Math.max(1, Math.floor(scale * (shape[id] ?? 0)));
              counts[id] = count;
              leadership += count * (unit?.cost ?? 1);
            }
            return { counts, leadership };
          };

          const probe = (
            counts: Record<string, number>,
          ): {
            minTroopHp: number;
            maxMercHp: number;
            hiredHits: number;
            avg: number;
            silver: number;
            seconds: number;
          } => {
            const ev = evaluateCounts(request, counts);
            const costs = recoveryCosts(ev.result.stacks, request.units, request.recovery);
            const troopHp = ev.result.stacks.filter((s) => s.pool === 'leadership').map((s) => s.totalHp);
            const mercHp = ev.result.stacks.filter((s) => s.pool === 'authority').map((s) => s.totalHp);
            return {
              minTroopHp: troopHp.length > 0 ? Math.min(...troopHp) : 0,
              maxMercHp: mercHp.length > 0 ? Math.max(...mercHp) : 0,
              hiredHits: lines(ev)
                .filter((line) => line.pool === 'authority')
                .reduce((sum, line) => sum + line.hitsEnemyFirst, 0),
              avg: ev.summary.avgDamage,
              silver: costs.retrain.silver,
              seconds: costs.retrain.seconds,
            };
          };

          // Smallest scale whose smallest troop stack still strictly outweighs the biggest hired stack.
          let minScale = 1;
          for (let scale = 0.01; scale <= 1.0001; scale += 0.002) {
            const { counts } = at(scale);
            const p = probe(counts);
            if (p.minTroopHp > p.maxMercHp) {
              minScale = Math.round(scale * 1000) / 1000;
              break;
            }
          }

          report.h(`${scenarioName} · ${design.key} · hired spend ${(spend * 100).toFixed(0)} %`);
          report.add(
            `Frozen hired stacks: ${MERC_IDS.map((id) => `${label(id)} ${n(mercCounts[id] ?? 0)}`).join(' · ')} ` +
              `— ${n(mercLost)} units of stock burnt a march (Σ ceil(n/10)). Biggest hired stack ` +
              `${n(probe(at(1).counts).maxMercHp)} HP.`,
          );
          report.add('');
          report.add(
            `Minimum scale keeping every troop stack above it: **${minScale.toFixed(3)}** ` +
              `(≈ ${n(at(minScale).leadership)} of the 4,343 leadership).`,
          );
          report.add('');

          interface Row {
            leadership: number;
            counts: Record<string, number>;
            avg: number;
            silver: number;
            seconds: number;
            minTroopHp: number;
            hiredHits: number;
            guard: boolean;
          }
          const rows: Row[] = [];
          const steps = 14;
          const seen = new Set<number>();
          for (let step = 0; step <= steps; step += 1) {
            const scale = minScale + ((1 - minScale) * step) / steps;
            const { counts, leadership } = at(scale);
            if (seen.has(leadership)) continue;
            seen.add(leadership);
            if (!feasible(request, counts)) continue;
            const p = probe(counts);
            rows.push({
              leadership,
              counts,
              avg: p.avg,
              silver: p.silver,
              seconds: p.seconds,
              minTroopHp: p.minTroopHp,
              hiredHits: p.hiredHits,
              guard: p.minTroopHp > p.maxMercHp,
            });
          }

          report.add(
            '| L used | ' +
              TROOPS.map((id) => label(id)).join(' | ') +
              ' | avg damage | retrain silver | time 0 % | min troop HP | hired hits | above hired? | marginal Δdmg/Δsilver |',
          );
          report.add('|---|' + TROOPS.map(() => '---').join('|') + '|---|---|---|---|---|---|---|');
          for (const [index, row] of rows.entries()) {
            const previous = rows[index - 1];
            const marginal =
              previous && row.silver > previous.silver
                ? (row.avg - previous.avg) / (row.silver - previous.silver)
                : undefined;
            report.add(
              `| ${n(row.leadership)} | ${TROOPS.map((id) => n(row.counts[id] ?? 0)).join(' | ')} | ${n(row.avg)} | ${n(row.silver)} | ${duration(row.seconds)} | ${n(row.minTroopHp)} | ${row.hiredHits} | ${row.guard ? 'yes' : 'no'} | ${marginal === undefined ? '—' : n(marginal)} |`,
            );
          }
          report.add('');

          const first = rows[0];
          const last = rows[rows.length - 1];
          if (first && last && last.silver > first.silver) {
            const slope = (last.avg - first.avg) / (last.silver - first.silver);
            const whole = last.avg / last.silver;
            summaries.push({
              scenario: scenarioName,
              design: design.key,
              spend,
              minLeadership: first.leadership,
              fullLeadership: last.leadership,
              minAvg: first.avg,
              fullAvg: last.avg,
              minSilver: first.silver,
              fullSilver: last.silver,
              slope,
              whole,
              mercLost,
            });
            report.add(
              `Last troops: **${n(slope)} damage per silver**. Whole march: **${n(whole)} damage per silver** ` +
                `(${n(last.avg)} ÷ ${n(last.silver)}) — **${(whole / slope).toFixed(2)}×** the marginal rate. ` +
                `Cutting from ${n(last.leadership)} to ${n(first.leadership)} leadership saves ` +
                `${n(last.silver - first.silver)} silver, gives up ${n(last.avg - first.avg)} damage, and burns ` +
                `the same ${n(mercLost)} mercenaries either way.`,
            );
          }
        }
      }
    }

    report.h('The two rates side by side');
    report.add('');
    report.add(
      '| scenario | march | hired spend | min L | full L | damage at min L | damage at full L | silver at min L | silver at full L | last troops dmg/silver | whole march dmg/silver | ratio | merc lost/march |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const s of summaries) {
      report.add(
        `| ${s.scenario} | ${s.design} | ${(s.spend * 100).toFixed(0)} % | ${n(s.minLeadership)} | ${n(s.fullLeadership)} | ${n(s.minAvg)} | ${n(s.fullAvg)} | ${n(s.minSilver)} | ${n(s.fullSilver)} | ${n(s.slope)} | ${n(s.whole)} | ${(s.whole / s.slope).toFixed(2)}× | ${n(s.mercLost)} |`,
      );
    }

    report.h('What the curve says');
    report.add('');
    report.add(
      [
        '- **The curve is a straight line.** Every stack of an N-stack march takes the same number of hits whatever',
        "  its size (`expectedHits` depends on kill position and N, not on counts), so a troop stack's damage *and*",
        '  its retrain silver both scale with its count. Leadership buys damage at a fixed price and there is no',
        '  "sweet spot" on the curve to find — only two ends to choose between.',
        '- **That fixed price is far worse than the march average**, because the hired half delivers its damage for',
        '  zero silver. The ratio column above is that gap. The troops are mostly **sponges**: their job is to',
        '  out-HP the biggest hired stack so the hired stacks die last and collect the most hits (the `hired hits`',
        '  column stays flat across the whole scan — that is the sponge working). Units piled on above that HP',
        '  threshold add only their own modest hits.',
        '- **The threshold moves with the hired spend.** At 100 % spend the hired stacks are enormous and the troops',
        '  need nearly all 4,343 leadership just to stay above them; at 30 % spend the threshold collapses, and the',
        '  leadership above it is genuinely optional. So the "cheap march" only exists at low spend — which is',
        '  exactly the regime a long campaign pushes you into (B3).',
        '- **One caveat on the tables.** In scenario A the SW1 (specialist) and SP2 (guardsmen) stacks sit within a',
        '  few hundred HP of each other, so a one-unit change in the scaling can swap their kill positions and move',
        '  one hit between them; that is the ±2 % jitter visible in the "owner\'s 8 types · 30 %" rows. It is real',
        '  engine output, not noise in the measurement, and it disappears in scenario B where the guardsmen bonus',
        '  separates the two stacks cleanly.',
        '- **A cheap march is silver-efficient and stock-wasteful.** It re-buys the free hired damage each time, but',
        '  pays the full `ceil(n/10)` mercenary toll each time, however few troops marched with it.',
        '- **Rule of thumb: cut troops only when silver binds and mercenary stock does not.** When stock binds — the',
        "  owner's situation at a large silver budget — fill the leadership every march: troops are the only part of",
        '  the army that comes back, and shrinking them throws away damage that costs nothing in the scarce currency.',
        '  When silver binds first (small budget, plenty of stock), the minimum-leadership march wins on total damage',
        '  because it buys more marches. B3 measures which side of that line each budget falls on.',
      ].join('\n'),
    );

    report.save();
  }, 600_000);
});
