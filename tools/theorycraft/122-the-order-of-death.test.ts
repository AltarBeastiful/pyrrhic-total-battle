/**
 * 122 — **is the order of death optimal, with troops, mercenaries and monsters together?** (owner,
 * 2026-09-20: *"is the order of death proposed always optimal with troops, mercs and monsters. Even if we
 * put back or left out a troop in the summary"*, against his standing objective — *"best damage over a
 * campaign using my constrained resources"*.)
 *
 * **The arithmetic this rests on, taken from the tables and the engine rather than from anyone's memory.**
 *
 * 1. `src/data/tables/*.json`: **health = 3 × strength for every guardsman, specialist, mercenary and
 *    monster in the game** — 56 of the 65 troops, 69 of 69 mercenaries, 28 of 28 monsters. The nine
 *    exceptions are the **engineers**, at 6 × (half the damage for the same HP).
 * 2. `hitDamage` (`src/engine/units.ts`) is **exactly linear in the count**:
 *    `damage = count × strength × (100 + strengthPercent + strengthAgainst) / 100`, and `effectiveUnit`
 *    gives `hpPerUnit = health × (1 + healthPercent)`.
 *
 * Put together, a stack's **damage for each point of HP it puts on the field** is
 *
 *     damage per HP = (strength / health) × (100 + strengthPercent + strengthAgainst) / (100 + healthPercent)
 *
 * which is **independent of the count, of the tier and of what the unit costs**. A tier-1 archer and a
 * tier-9 kraken carry exactly the same base damage per point of HP; only the bonuses they catch tell them
 * apart. That is the fact the whole question turns on.
 *
 * **What the enemy does with it**: it destroys the highest-HP living stack first, so the queue is sorted by
 * *total* HP and the number of blows a stack lands is decided by its place in that queue (the biggest stack
 * strikes zero times). Damage is therefore `Σ hits(place) × hp(stack) × damagePerHp(type)`, and since
 * `hits(place)` rises as you go **down** the queue, the best arrangement puts the **highest damage-per-HP
 * type last** — smallest total HP — and the lowest first. *That* is the ideal order of death, and it is
 * derived here rather than assumed.
 *
 * So the report asks three things of the live plans:
 *
 * **A.** What each type's damage per HP actually is on his army, after his captains, events and sources.
 * **B.** Whether the march the plan fields is in that order — every inversion named, with what it costs.
 * **C.** Whether it stays in that order after a troop is **left out** and the march re-sized (S-107).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/122-the-order-of-death.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { effectiveUnit, hitDamage } from '../../src/engine/units';
import type { StackRequest, UnitDef } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { parseImport } from '../../src/share/exportImport';
import { EXPORT_2026_09_17, Report, evaluateCounts, n } from './harness';

/** The damage one point of this type's HP buys, after every bonus this setup applies to it. */
function damagePerHp(unit: UnitDef, request: StackRequest): number {
  const effective = effectiveUnit(unit, request.totals, request.enemy, request.activeEvents);
  if (effective.hpPerUnit <= 0) return 0;
  return hitDamage(effective, 1).damage / effective.hpPerUnit;
}

function ownersAccount(dominance = 1_200): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const base = root.profiles[0];
  const first = base?.setups[0];
  if (!base || !first) throw new Error('no default profile');
  const profile = structuredClone(base);
  profile.troops = {
    guardsmen: { min: 1, max: 3 },
    specialists: { min: 1, max: 1 },
    engineers: null,
    monsters: { min: 3, max: 3 },
    topTierExcluded: { guardsmen: ['melee', 'ranged'], specialists: ['melee'] },
    excludedUnitIds: [],
  };
  profile.mercenaries = { selected: [{ id: 'epic-monster-hunter-6', cap: 64 }], custom: [] };
  for (const source of profile.sources.permanent) {
    if (source.builtin === 'armyModernization') source.health = { melee: 1.5, ranged: 1.5, mounted: 1.5 };
  }
  profile.sources.captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 48, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  profile.sources.vipLevel = 7;
  const setup: BattleSetup = {
    ...first,
    active: {
      ...first.active,
      captains: ['ww8j0qwv'],
      events: ['ragnarok-fenrir'],
      vip: false,
      dragon: false,
    },
    housing: { leadership: 5_600, authority: 2_180, dominance },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    options: {
      method: 'plan',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: false,
    },
    priority: 'damagePerSilver',
    recoveryPlan: { mode: 'selective', reviveFamilies: ['monsters'] },
  };
  return { profile, setup };
}

/** The march in the queue the enemy actually uses: highest total HP first. */
function queue(
  base: StackRequest,
  counts: Record<string, number>,
): {
  id: string;
  label: string;
  pool: string;
  count: number;
  totalHp: number;
  perHp: number;
  hits: number;
  damage: number;
}[] {
  const { result, summary } = evaluateCounts(base, counts);
  const blows = new Map<string, number>();
  for (const entry of summary.journals.enemyFirst.entries) {
    if (entry.actor === 'army') blows.set(entry.unitId, (blows.get(entry.unitId) ?? 0) + 1);
  }
  const byId = new Map(base.units.map((unit) => [unit.id, unit]));
  return result.stacks
    .map((stack) => {
      const unit = byId.get(stack.unitId);
      const hits = blows.get(stack.unitId) ?? 0;
      return {
        id: stack.unitId,
        label: unit?.label ?? stack.unitId,
        pool: stack.pool,
        count: stack.count,
        totalHp: stack.totalHp,
        perHp: unit ? damagePerHp(unit, base) : 0,
        hits,
        damage: hits * stack.damagePerHit,
      };
    })
    .sort((a, b) => b.totalHp - a.totalHp);
}

describe.skipIf(!process.env.THEORY)('the order of death', () => {
  it('derives the ideal order and checks the plan against it', () => {
    const report = new Report('122-the-order-of-death');

    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const own = parsed.payload;
    const ownSetup = own.setups[0];
    if (!ownSetup) throw new Error('no setup');
    const mine = ownersAccount();

    for (const army of [
      { name: 'his account of 2026-09-20 — 5 600 / 2 180 / 1 200, monsters III, EMH VI ×64', ...mine },
      { name: 'the 2026-09-17 export, four hired types', profile: own, setup: ownSetup },
    ] as const) {
      report.h(army.name);
      const base = buildStackRequest(army.profile, army.setup);
      const plan = planCampaign(buildPlanRequest(army.profile, army.setup));
      const top = plan.alternatives.at(-1);
      if (!top) continue;

      // --- A. the ranking ----------------------------------------------------------------------------
      report.add('');
      report.add(
        '**A. What a point of HP buys, by type.** Base `strength / health` is **1/3** for every guardsman, specialist, mercenary and monster and **1/6** for engineers; everything else here is the bonuses this setup catches.',
      );
      report.add('');
      report.add('| type | pool | HP a unit | damage a unit | **damage a point of HP** | in the march |');
      report.add('|---|---|---|---|---|---|');
      const fielded = new Set(
        Object.entries(top.counts)
          .filter(([, c]) => c > 0)
          .map(([id]) => id),
      );
      const ranked = base.units
        .map((unit) => {
          const effective = effectiveUnit(unit, base.totals, base.enemy, base.activeEvents);
          return {
            unit,
            hp: effective.hpPerUnit,
            damage: hitDamage(effective, 1).damage,
            perHp: damagePerHp(unit, base),
          };
        })
        .sort((a, b) => b.perHp - a.perHp);
      for (const row of ranked) {
        report.add(
          `| ${row.unit.label} | ${row.unit.pool} | ${n(row.hp)} | ${n(row.damage)} | **${n(
            Math.round(row.perHp * 1000) / 1000,
          )}** | ${fielded.has(row.unit.id) ? 'yes' : '—'} |`,
        );
      }

      // --- B. the march against the ideal ------------------------------------------------------------
      const lines = queue(base, top.counts);
      report.add('');
      report.add(
        `**B. The dearest stop (${top.pick}) in the queue the enemy uses.** The ideal is **damage a point of HP rising as you go down**: the type that turns HP into damage best should be killed last, because the last stacks strike most.`,
      );
      report.add('');
      report.add('| # | stack | pool | units | total HP | damage a point of HP | blows | damage |');
      report.add('|---|---|---|---|---|---|---|---|');
      for (const [index, line] of lines.entries()) {
        report.add(
          `| ${String(index + 1)} | ${line.label} | ${line.pool} | ${n(line.count)} | ${n(
            line.totalHp,
          )} | ${n(Math.round(line.perHp * 1000) / 1000)} | ${String(line.hits)} | ${n(line.damage)} |`,
        );
      }
      const inversions = lines.flatMap((line, index) =>
        lines
          .slice(index + 1)
          .flatMap((later) => (later.perHp < line.perHp - 1e-9 ? [[line, later] as const] : [])),
      );
      report.add('');
      report.add(
        inversions.length === 0
          ? '**No inversions**: every stack that dies later turns HP into damage at least as well as the one before it, which is the ideal order.'
          : `**${String(inversions.length)} inversions** — a stack that dies *later* turns HP into damage *worse* than one that died before it: ${inversions
              .slice(0, 8)
              .map(
                ([a, b]) =>
                  `${a.label} (${n(Math.round(a.perHp * 1000) / 1000)}) before ${b.label} (${n(Math.round(b.perHp * 1000) / 1000)})`,
              )
              .join('; ')}.`,
      );

      // --- C. after a troop is left out --------------------------------------------------------------
      const troop = lines.find((line) => line.pool === 'leadership');
      if (troop) {
        const without = { ...top.counts };
        delete without[troop.id];
        const left = planCampaign({
          ...buildPlanRequest(army.profile, army.setup),
          request: { ...base, units: base.units.filter((unit) => unit.id !== troop.id) },
        });
        const leftTop = left.alternatives.at(-1);
        if (leftTop) {
          const after = queue(
            { ...base, units: base.units.filter((unit) => unit.id !== troop.id) },
            leftTop.counts,
          );
          const afterInversions = after.flatMap((line, index) =>
            after.slice(index + 1).flatMap((later) => (later.perHp < line.perHp - 1e-9 ? [1] : [])),
          ).length;
          report.add('');
          report.add(
            `**C. With ${troop.label} left out** — the biggest stack of the march, which is the one a player takes out first — the plan re-sizes to ${String(
              after.length,
            )} stacks and the queue has **${String(afterInversions)} inversions**.`,
          );
          report.add('');
          report.add('| # | stack | pool | units | total HP | damage a point of HP | blows |');
          report.add('|---|---|---|---|---|---|---|');
          for (const [index, line] of after.entries()) {
            report.add(
              `| ${String(index + 1)} | ${line.label} | ${line.pool} | ${n(line.count)} | ${n(
                line.totalHp,
              )} | ${n(Math.round(line.perHp * 1000) / 1000)} | ${String(line.hits)} |`,
            );
          }
        }
      }
    }

    // --- D. what the inversions cost -----------------------------------------------------------------
    //
    // The ranking above says which stack *ought* to die last; it does not say what the app loses by
    // getting it wrong, because a stack's HP and its damage are the same lever — shrinking the mercenary
    // to push it down the queue shrinks its damage too. So this searches the hired counts directly: keep
    // the troops exactly as the plan fields them, keep every pool and every stock, and hill-climb the
    // mercenary and monster counts on the **worst opening** the bar is ranked on. Deterministic: a fixed
    // ladder of step sizes from the plan's own answer, no randomness to reproduce.
    report.h('D. What the inversions cost: the same troops, the hired counts searched');
    for (const army of [
      { name: 'his account of 2026-09-20', ...ownersAccount() },
      { name: 'the 2026-09-17 export', profile: own, setup: ownSetup },
    ] as const) {
      const base = buildStackRequest(army.profile, army.setup);
      const plan = planCampaign(buildPlanRequest(army.profile, army.setup));
      const top = plan.alternatives.at(-1);
      if (!top) continue;

      const hiredIds = base.units
        .filter((unit) => unit.pool !== 'leadership')
        .map((unit) => unit.id)
        .filter((id) => (top.counts[id] ?? 0) > 0 || base.units.some((unit) => unit.id === id));
      const costOf = new Map(base.units.map((unit) => [unit.id, unit.cost]));
      const poolOf = new Map(base.units.map((unit) => [unit.id, unit.pool]));
      const capOf = (id: string): number => base.caps[id] ?? Number.MAX_SAFE_INTEGER;

      const fits = (counts: Record<string, number>): boolean => {
        const used = { leadership: 0, authority: 0, dominance: 0 };
        for (const [id, count] of Object.entries(counts)) {
          if (count < 0 || count > capOf(id)) return false;
          const pool = poolOf.get(id);
          if (pool === undefined) continue;
          used[pool] += count * (costOf.get(id) ?? 0);
        }
        return (
          used.leadership <= base.housing.leadership &&
          used.authority <= base.housing.authority &&
          used.dominance <= base.housing.dominance
        );
      };
      const score = (counts: Record<string, number>): number =>
        fits(counts) ? evaluateCounts(base, counts).summary.minDamage : -1;

      let best = { ...top.counts };
      let bestScore = score(best);
      const started = bestScore;
      for (const step of [64, 32, 16, 8, 4, 2, 1]) {
        let moved = true;
        while (moved) {
          moved = false;
          for (const id of hiredIds) {
            for (const delta of [step, -step]) {
              const next = { ...best, [id]: Math.max(0, (best[id] ?? 0) + delta) };
              const value = score(next);
              if (value > bestScore) {
                best = next;
                bestScore = value;
                moved = true;
              }
            }
          }
        }
      }

      report.add('');
      report.add(`### ${army.name}`);
      report.add('');
      report.add(
        `The plan's dearest stop deals **${n(started)}**; the search, on the same troops and within the same pools and stocks, reaches **${n(
          bestScore,
        )}** — **${n(Math.round((bestScore / started - 1) * 1000) / 10)} %**.`,
      );
      report.add('');
      report.add('| stack | the plan fields | the search fields |');
      report.add('|---|---|---|');
      for (const id of hiredIds) {
        const label = base.units.find((unit) => unit.id === id)?.label ?? id;
        const was = top.counts[id] ?? 0;
        const now = best[id] ?? 0;
        if (was === 0 && now === 0) continue;
        report.add(`| ${label} | ${n(was)} | ${n(now)}${now === was ? '' : ' **←**'} |`);
      }
      const after = queue(base, best);
      report.add('');
      report.add('The searched march in the queue:');
      report.add('');
      report.add('| # | stack | units | total HP | damage a point of HP | blows |');
      report.add('|---|---|---|---|---|---|');
      for (const [index, line] of after.entries()) {
        report.add(
          `| ${String(index + 1)} | ${line.label} | ${n(line.count)} | ${n(line.totalHp)} | ${n(
            Math.round(line.perHp * 1000) / 1000,
          )} | ${String(line.hits)} |`,
        );
      }
    }

    report.save();
  }, 900_000);
});
