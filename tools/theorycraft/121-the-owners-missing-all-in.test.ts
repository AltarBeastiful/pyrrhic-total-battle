/**
 * 121 — **why the owner's bar shows no "All in", and what actually shelters what** (owner, 2026-09-20:
 * *"one of my problems is that the lines don't show an all in sometimes… I get only sweet steady and not all
 * in, preventing me from filling mercs. It seems we might be shielding mercs too aggressively with monsters.
 * Is there such a rule?"*).
 *
 * His account, read out of his own browser the same day: leadership **5 600**, authority **2 180**, dominance
 * **1 200**, one hired type (epic monster hunter VI, stock **64**), monsters at tier III, guardsmen I–III
 * with the top tier's melee and ranged left out, specialists I only, Aydae 48 ★3 active alone, VIP 7 with the
 * VIP source off, Ragnarok/Fenrir on, `strictMercsAboveMonsters` and `monstersLast` both **off**, recovery
 * plan "selective, top 3".
 *
 * Three questions, and each is answered with figures rather than with the code's own words:
 *
 * **A. Is there a rule that monsters shelter mercenaries?** What `shelterUnder` reads is the **troop** floor —
 * `rungs` is the leadership stacks and nothing else — and it lowers *every* non-leadership stack under it,
 * mercenaries and monsters alike and independently. The two options that do relate the hired pools to each
 * other (`monstersLast`, `strictMercsAboveMonsters`) are both off on his setup. Measured here by running his
 * army with the dominance pool at **1 200 and at 0**: if monsters cost him hunters, the hunter count moves.
 *
 * **B. Why is there no All in?** It is offered only when its first march fields **more hired units** than the
 * steady max's repeat (`filledOf`, `plan.ts`). Printed here: both counts, and what binds the hunter — his
 * stock, the authority housing, or the shelter.
 *
 * **C. Is the shelter order computed, or is it a static rule?** The rule lowers every hired stack to
 * `ceil(troopFloor / hp) − 1`. This sweeps the hunter count from 1 to what the stock allows, prices every one
 * of them, and prints where the damage actually peaks — so the cost of the rule is a number and not an
 * opinion.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/121-the-owners-missing-all-in.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { Report, evaluateCounts, n } from './harness';

const HUNTER = 'epic-monster-hunter-6';

/** His account as his browser held it on 2026-09-20. */
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
  profile.mercenaries = { selected: [{ id: HUNTER, cap: 64 }], custom: [] };
  for (const source of profile.sources.permanent) {
    if (source.builtin === 'armyModernization') source.health = { melee: 1.5, ranged: 1.5, mounted: 1.5 };
  }
  profile.sources.captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 48, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  profile.sources.vipLevel = 7;
  profile.recovery = {
    ...profile.recovery,
    templeLevel: 0,
    trainingCostReduction: {},
    trainingSpeed: {},
    plan: { mode: 'retrain' },
  };

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

interface Reading {
  damage: number;
  silver: number;
  burn: number;
  hunters: number;
  monsters: number;
  troopFloor: number;
  hunterHp: number;
  hunterStackHp: number;
}

function read(base: StackRequest, counts: Record<string, number>): Reading {
  const { result, summary } = evaluateCounts(base, counts);
  const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
  const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
  const hunter = result.stacks.find((stack) => stack.unitId === HUNTER);
  return {
    damage: summary.minDamage,
    silver: bill.silver,
    burn: hiredLost(result.stacks),
    hunters: counts[HUNTER] ?? 0,
    monsters: result.stacks
      .filter((stack) => stack.pool === 'dominance')
      .reduce((sum, stack) => sum + stack.count, 0),
    troopFloor: troops.length === 0 ? 0 : Math.min(...troops.map((stack) => stack.totalHp)),
    hunterHp: hunter ? hunter.hpPerUnit : 0,
    hunterStackHp: hunter ? hunter.totalHp : 0,
  };
}

describe.skipIf(!process.env.THEORY)('the owner’s missing All in', () => {
  it('reads his bar, and asks what binds the hunter', () => {
    const report = new Report('121-the-owners-missing-all-in');

    for (const dominance of [1_200, 0]) {
      const { profile, setup } = ownersAccount(dominance);
      report.h(
        dominance > 0
          ? 'His account as it stands — 5 600 / 2 180 / 1 200, monsters at tier III'
          : 'The same account with **no dominance pool** — the monsters cannot be fielded at all',
      );
      const base = buildStackRequest(profile, setup);
      const plan = planCampaign(buildPlanRequest(profile, setup));
      const rows = plan.alternatives.map((stop) => ({ pick: stop.pick, ...read(base, stop.counts) }));

      report.add('');
      report.add(
        '| stop | damage | silver | hired lost | hunters | monster units | lowest troop rung | the hunters’ stack |',
      );
      report.add('|---|---|---|---|---|---|---|---|');
      for (const row of rows) {
        report.add(
          `| ${row.pick} | ${n(row.damage)} | ${n(row.silver)} | ${n(row.burn)} | **${n(row.hunters)}** | ${n(
            row.monsters,
          )} | ${n(row.troopFloor)} | ${n(row.hunterStackHp)} |`,
        );
      }

      const top = rows.at(-1);
      if (top) {
        // What the shelter would allow on this floor, against his stock and against his authority.
        const ceiling = top.hunterHp > 0 ? Math.ceil(top.troopFloor / top.hunterHp) - 1 : 0;
        const hunterCost = base.units.find((unit) => unit.id === HUNTER)?.cost ?? 1;
        const byAuthority = Math.floor(base.housing.authority / hunterCost);
        report.add('');
        report.add(
          `**What binds the hunter on the dearest stop**: the shelter allows \`ceil(${n(
            top.troopFloor,
          )} / ${n(top.hunterHp)}) − 1\` = **${n(ceiling)}**, his stock holds **64**, and his authority houses **${n(
            byAuthority,
          )}**. He is fielding **${n(top.hunters)}** — bound by **${
            ceiling <= Math.min(64, byAuthority)
              ? 'the shelter'
              : ceiling === 0
                ? 'nothing it can field'
                : 'his stock or his authority'
          }**.`,
        );
        report.add('');
        report.add(
          `**Is All in on the bar?** ${
            rows.some((row) => row.pick === 'all-in')
              ? 'yes'
              : `**no** — it is offered only when its first march fields more hired units than the steady max repeats, and the steady max already fields ${n(
                  top.hunters,
                )}, which is everything this floor shelters.`
          }`,
        );
      }
    }

    // --- C. What the static shelter costs, on his own army ---------------------------------------------
    //
    // `shelterUnder` lowers every hired stack to `ceil(troopFloor / hp) − 1` and asks nothing about damage.
    // This takes the dearest stop's troops and monsters exactly as the plan fields them, sweeps the hunter
    // count over everything his authority could house, and prices each one. If the rule's answer is also the
    // damage peak, the rule costs nothing here; if it is not, the gap is what the shelter is buying him.
    {
      const { profile, setup } = ownersAccount(1_200);
      const base = buildStackRequest(profile, setup);
      const plan = planCampaign(buildPlanRequest(profile, setup));
      const top = plan.alternatives.at(-1);
      if (top) {
        report.h('What the shelter costs: the same march, every hunter count');
        const hunterCost = base.units.find((unit) => unit.id === HUNTER)?.cost ?? 1;
        const houses = Math.floor(base.housing.authority / hunterCost);
        const rows: { hunters: number; damage: number; silver: number; burn: number; stackHp: number }[] = [];
        const fieldedCount = read(base, top.counts).hunters;
        const steps = new Set<number>([fieldedCount]);
        for (let hunters = 10; hunters <= Math.min(houses, 200); hunters += 10) steps.add(hunters);
        for (const hunters of [...steps].sort((a, b) => a - b)) {
          const one = read(base, { ...top.counts, [HUNTER]: hunters });
          rows.push({
            hunters,
            damage: one.damage,
            silver: one.silver,
            burn: one.burn,
            stackHp: one.hunterStackHp,
          });
        }
        const fielded = read(base, top.counts);
        const peak = rows.reduce((best, row) => (row.damage > best.damage ? row : best));
        const floor = fielded.troopFloor;

        report.add('');
        report.add(
          `His stock holds **64**, his authority would house **${n(
            houses,
          )}**, and the lowest troop rung of this march is **${n(floor)} HP**. The rule fields **${n(
            fielded.hunters,
          )}**.`,
        );
        report.add('');
        report.add('| hunters | the stack’s HP | above the troop floor | damage | silver | hired lost |');
        report.add('|---|---|---|---|---|---|');
        for (const row of rows) {
          report.add(
            `| ${n(row.hunters)}${row.hunters === fielded.hunters ? ' (the rule)' : ''} | ${n(
              row.stackHp,
            )} | ${row.stackHp >= floor ? '**yes**' : 'no'} | ${n(row.damage)} | ${n(row.silver)} | ${n(
              row.burn,
            )} |`,
          );
        }
        report.add('');
        report.add(
          `**The damage peak is at ${n(peak.hunters)} hunters** (${n(peak.damage)}), against **${n(
            fielded.damage,
          )}** at the ${n(fielded.hunters)} the rule fields — a difference of **${n(
            Math.round((peak.damage / fielded.damage - 1) * 1000) / 10,
          )} %**, at ${n(peak.burn)} hired lost against ${n(fielded.burn)}.`,
        );
      }
    }

    report.save();
  }, 900_000);
});
