/**
 * 125 — **why his bar carries two stops and not five** (owner, 2026-09-21: *"check why we don't have always
 * an all in line on the slider … reproduce it locally and check why we don't have the three choices there.
 * Is there a static limit that prevents it?"*).
 *
 * Read off his browser the same day (`localhost:5173`, `localStorage['pyrrhic.v1']`): **5 600 leadership /
 * 2 180 authority / 600 dominance**, guardsmen I–III with the top tier's melee and ranged out, specialists I
 * with melee out, monsters III, **Epic Monster Hunter VI × 64**, Aydae 48 ★3 alone of three captains, VIP 7,
 * Ragnarok–Fenrir, army modernization at +1.5 % health on melee/ranged/mounted, retrain recovery with no
 * temple. His bar: **Sweet spot · Steady max**, and nothing else.
 *
 * This is investigation 0024's §3 asked again of a **different** army — that one was 800 dominance and a
 * stock of 27, this is 600 and 64 — because the answer there was specific to its figures and the owner is
 * asking whether something *static* refuses the row on every army.
 *
 * **The gates, in the order a stop meets them** (`planCampaign`, `src/engine/plan.ts`):
 *
 *  - `silver-saver` wants a march **left of the sweet spot** — strictly fewer chunks burned, no more silver,
 *    and at least its damage a silver (`leftOfSweet`) — that no other such march beats on the figures.
 *  - `more-mercs` wants the sweet spot and the steady max to be **at least two chunks apart**
 *    (`high - low < 2` returns nothing), and a ladder rung strictly between them.
 *  - `all-in` is **built** whenever the plan plays a march at all, **offered** when its first march fields
 *    more hired units than the steady max's repeat (`filledOf`), and **dropped** when another stop has at
 *    least its damage for no more silver and **strictly fewer** chunks burned (S-94).
 *  - and `offer` refuses any row whose counts another row already carries.
 *
 * Each is evaluated below against this army's own measured figures, so the answer per row is "this quantity
 * was X and the rule needs Y" rather than a reading of the code. §D then sweeps the two knobs his account
 * actually moves — the dominance pool and the hunter stock — to say whether the missing rows are a property
 * of the rule or of this army.
 *
 * Damage is the **worst opening** (S-94/S-108); silver, gold and queue are the campaign's own.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/125-the-missing-all-in.test.ts`
 */
import { writeFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { chunks, recoveryCosts } from '../../src/engine/recovery';
import { planCampaign } from '../../src/engine/plan';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { Report, evaluateCounts, n } from './harness';

const HUNTER = 'epic-monster-hunter-6';

/**
 * **His account as his browser held it on 2026-09-21** — every field read off `localStorage` rather than
 * guessed, and §A checks the bar it produces against the two stops he is looking at before anything is
 * concluded from it.
 */
function liveAccount(
  dominance = 600,
  stock = 64,
  leadership = 5_600,
): { profile: Profile; setup: BattleSetup } {
  const root = structuredClone(newRoot());
  const profile = root.profiles[0];
  const first = profile?.setups[0];
  if (!profile || !first) throw new Error('no default profile');
  profile.troops = {
    guardsmen: { min: 1, max: 3 },
    specialists: { min: 1, max: 1 },
    engineers: null,
    monsters: { min: 3, max: 3 },
    topTierExcluded: { guardsmen: ['melee', 'ranged'], specialists: ['melee'] },
    excludedUnitIds: [],
  };
  profile.mercenaries = { selected: [{ id: HUNTER, cap: stock }], custom: [] };
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
    housing: { leadership, authority: 2_180, dominance },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    options: {
      method: 'plan',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: false,
    },
    priority: 'damagePerSilver',
    // His own plan as the app now spells it (2026-09-21): the top monster revived, the rest retrained.
    recoveryPlan: { mode: 'selective', reviveFamilies: ['monsters'] },
  };
  return { profile, setup };
}

const perSilver = (row: PlanTotals): number => (row.silver > 0 ? row.totalDamage / row.silver : 0);
/** Hired units a march fields — the quantity the `all-in`'s offer rule compares (`filledOf`). */
const hiredUnits = (request: StackRequest, counts: Record<string, number>): number =>
  request.units.reduce((sum, unit) => sum + (unit.pool !== 'leadership' ? (counts[unit.id] ?? 0) : 0), 0);

function planOf(profile: Profile, setup: BattleSetup, marchTarget?: number): CampaignPlan | null {
  try {
    const input = buildPlanRequest(profile, setup);
    return planCampaign(marchTarget === undefined ? input : { ...input, marchTarget });
  } catch {
    return null;
  }
}

describe.skipIf(!process.env.THEORY)('the missing all in', () => {
  it('reproduces his bar and names the rule that refuses each row it has not got', () => {
    const report = new Report('125-the-missing-all-in');
    const { profile, setup } = liveAccount();
    const base = buildStackRequest(profile, setup);
    const plan = planOf(profile, setup);
    if (plan === null) throw new Error('the plan refused this army');

    // ---- A ---------------------------------------------------------------------------------------
    report.h('A. Is this his bar?');
    report.add('');
    report.add(
      'His browser on 2026-09-21 draws **Sweet spot · Steady max** and a slider whose `aria-valuemax` is 1. ' +
        'The reconstruction below has to produce the same two rows before anything is concluded from it.',
    );
    report.add('');
    report.add(
      '| stop | worst opening a march | silver a march | chunks a march | campaign damage | campaign silver |',
    );
    report.add('|---|---|---|---|---|---|');
    for (const row of plan.alternatives) {
      report.add(
        `| ${row.pick} | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ${n(row.repeat.mercLost)} | ${n(
          row.totalDamage,
        )} | ${n(row.silver)} |`,
      );
    }
    report.add('');
    report.add(
      `**${n(plan.alternatives.length)} stops**: ${plan.alternatives.map((row) => row.pick).join(' · ')}. ` +
        `The bar also reports **${n(plan.leftOut)}** plans left out of the band.`,
    );

    const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
    const steady = plan.alternatives.find((row) => row.pick === 'steady-max');
    if (!sweet || !steady) throw new Error('the two stops he sees are not here');

    // ---- B ---------------------------------------------------------------------------------------
    report.h('B. The three rows the bar has not got, one rule at a time');

    report.add('');
    report.add('### More mercs — the burn axis has no room on it');
    report.add('');
    const low = sweet.repeat.mercLost;
    const high = steady.repeat.mercLost;
    report.add(
      `\`moreMercs\` returns nothing when the two ends are fewer than **two** chunks apart. Measured: the ` +
        `sweet spot burns **${n(low)}** chunks a march, the steady max **${n(high)}**, the gap is **${n(
          high - low,
        )}**. The rule needs ≥ 2, so this row cannot exist on this army — there is no rung strictly between ` +
        'them to name.',
    );
    report.add('');
    report.add(
      `The axis itself is \`chunks(hunters)\` over the authority pool: a stock of **${n(
        base.caps[HUNTER] ?? 0,
      )}** hunters spans **${n(chunks(base.caps[HUNTER] ?? 0))}** values (1–10 units is 1 chunk, 11–20 is 2, ` +
        'and so on), and two of them are already taken by the two stops on screen.',
    );

    report.add('');
    report.add('### Silver saver — nothing left of the sweet spot reaches its rate');
    report.add('');
    report.add(
      '`leftOfSweet` wants a march that burns **strictly fewer** chunks, costs **no more** silver and ' +
        'returns **at least** the sweet spot’s damage a silver. The sweet spot here burns ' +
        `**${n(low)}** chunk${low === 1 ? '' : 's'} a march at **${n(sweet.repeat.silver)}** silver and ` +
        `**${n(Math.round(perSilver(sweet) * 1000) / 1000)}** damage a silver over the campaign.`,
    );
    report.add('');
    report.add(
      `So a candidate must burn at most **${n(low - 1)}** chunk${low - 1 === 1 ? '' : 's'} — that is at most ` +
        `${n((low - 1) * 10)} hunters — and still reach **${n(Math.round(perSilver(sweet) * 1000) / 1000)}** ` +
        'damage a silver. The sweep below holds the sweet spot’s troops and monsters exactly as it fields ' +
        'them and moves only the hunter, which is the only thing a thriftier march can change here.',
    );
    report.add('');
    report.add('| hunters | chunks a march | worst opening | silver a march | damage a silver |');
    report.add('|---|---|---|---|---|');
    let reaches = 0;
    for (const hunters of [0, 5, 10, 15, 20, 25, 30, 40, 50, 64]) {
      const counts = { ...sweet.counts, [HUNTER]: hunters };
      const { result, summary } = evaluateCounts(base, counts);
      const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
      const rate = bill.silver > 0 ? summary.minDamage / bill.silver : 0;
      if (hunters > 0 && chunks(hunters) < low && rate >= perSilver(sweet)) reaches += 1;
      report.add(
        `| ${n(hunters)} | ${n(chunks(hunters))} | ${n(Math.round(summary.minDamage))} | ${n(
          bill.silver,
        )} | ${n(Math.round(rate * 1000) / 1000)} |`,
      );
    }
    report.add('');
    report.add(
      `**${n(reaches)}** of the thriftier hunter counts reach the sweet spot's rate. The silver a march is ` +
        '**flat** — a mercenary is brought back for gold and costs no silver to retrain, so the silver ' +
        'column is the troops and the monsters standing behind it — while the damage climbs with every ' +
        'hunter. On an account whose only spendable stock is a mercenary, **fielding fewer of them is ' +
        'always a worse rate**, so "cheaper and at least as efficient a silver" has nothing it can name. ' +
        'That is arithmetic, not a threshold, and it is the same finding investigation 0024 §3 made on his ' +
        'other army.',
    );

    report.add('');
    report.add('### All in — built, and then?');
    report.add('');
    /**
     * The all-in's own first march is horizon-independent: the builder scores each march of its sequence at
     * `marches = 1` off the stock that is left. A horizon of 1 is therefore the way to read the row this bar
     * has not got — the same trick investigation 0024 §3 used.
     */
    const solo = planOf(profile, setup, 1);
    const soloAllIn = solo?.alternatives.find((row) => row.pick === 'all-in');
    if (soloAllIn === undefined) {
      report.add(
        'At a horizon of **1** the bar carries no `all-in` either, so the row is not merely being dropped ' +
          'late — it is refused before that. The offer rule is the next thing to read.',
      );
    } else {
      const its = hiredUnits(base, soloAllIn.counts);
      const top = hiredUnits(base, steady.counts);
      report.add(
        `At a horizon of **1** the same army **does** carry it: its first march fields **${n(
          its,
        )}** hired units against the steady max's **${n(top)}**.`,
      );
      report.add('');
      report.add(
        its > top
          ? `The offer rule (\`filledOf(allIn) > filledOf(top)\`) is **${n(its)} > ${n(top)}** — it **passes**.`
          : `The offer rule (\`filledOf(allIn) > filledOf(top)\`) is **${n(its)} > ${n(
              top,
            )}** — it **fails**, so the row is never offered on this army. "All in" *is* the steady max here.`,
      );
      report.add('');
      report.add('| | the all-in’s first march | the steady max’s repeat |');
      report.add('|---|---|---|');
      report.add(
        `| hired units | ${n(its)} | ${n(top)} |\n| worst opening | ${n(soloAllIn.repeat.damage)} | ${n(
          steady.repeat.damage,
        )} |\n| silver a march | ${n(soloAllIn.repeat.silver)} | ${n(steady.repeat.silver)} |\n` +
          `| chunks a march | ${n(soloAllIn.repeat.mercLost)} | ${n(steady.repeat.mercLost)} |`,
      );
      const hunters = (row: PlanTotals): number => row.counts[HUNTER] ?? 0;
      report.add('');
      report.add(
        `Hunters: the all-in's first march fields **${n(hunters(soloAllIn))}** of the **${n(
          base.caps[HUNTER] ?? 0,
        )}** in stock, the steady max **${n(hunters(steady))}**.`,
      );
    }

    // ---- C ---------------------------------------------------------------------------------------
    report.h('C. The S-94 drop, evaluated on the bar he has');
    report.add('');
    report.add(
      'Whatever the offer rule says, a bar that carries an `all-in` loses it when **another stop has at ' +
        'least its campaign damage, no more silver and strictly fewer chunks burned**. On the horizon-1 bar ' +
        'above that comparison can be made directly.',
    );
    if (solo !== null) {
      report.add('');
      report.add('| horizon-1 stop | campaign damage | campaign silver | chunks burned |');
      report.add('|---|---|---|---|');
      for (const row of solo.alternatives) {
        report.add(`| ${row.pick} | ${n(row.totalDamage)} | ${n(row.silver)} | ${n(row.mercLost)} |`);
      }
      /**
       * **The drop, at the app's own horizon of 4.** The all-in is gone from that bar, so its campaign has
       * to be rebuilt the way investigation 0024 §3 rebuilt it: from its own measured first march, spending
       * the stock down march by march the way the builder spends it. The damage and silver of marches two
       * to four are the builder's and would differ; what is **exact** is the burn, and the burn is the arm
       * that decides the drop (`other.mercLost < row.mercLost` is the only strict one).
       */
      if (soloAllIn) {
        const horizon = plan.marches;
        const stock = base.caps[HUNTER] ?? 0;
        let left = stock;
        let burn = 0;
        const spent: number[] = [];
        for (let march = 0; march < horizon && left > 0; march += 1) {
          const fields = Math.min(left, soloAllIn.counts[HUNTER] ?? 0);
          spent.push(fields);
          burn += chunks(fields);
          left -= chunks(fields);
        }
        report.add('');
        report.add(
          `**At the app's horizon of ${n(horizon)}** the all-in spends the stock down ` +
            `${spent.map((one) => n(one)).join(' · ')}, burning **${n(burn)}** chunks in all.`,
        );
        /**
         * **Each march of the sequence priced, not the first one multiplied.** Marches two to four field
         * fewer hunters than the first — 57, 51, 45 here — so scaling the opener by four over-states the
         * campaign by more than the drop's margin. Every march below is `simulateBattle` on its own counts
         * and `recoveryCosts` on its own stacks, which is how the engine prices the sequence it builds.
         */
        let allInDamage = 0;
        let allInSilver = 0;
        report.add('');
        report.add('| march | hunters | worst opening | silver | chunks |');
        report.add('|---|---|---|---|---|');
        for (const [index, fields] of spent.entries()) {
          const counts = { ...soloAllIn.counts, [HUNTER]: fields };
          const { result, summary } = evaluateCounts(base, counts);
          const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
          allInDamage += summary.minDamage;
          allInSilver += bill.silver;
          report.add(
            `| ${n(index + 1)} | ${n(fields)} | ${n(Math.round(summary.minDamage))} | ${n(
              bill.silver,
            )} | ${n(chunks(fields))} |`,
          );
        }
        allInDamage = Math.round(allInDamage);
        report.add('');
        report.add('| stop | campaign damage | campaign silver | chunks burned |');
        report.add('|---|---|---|---|');
        for (const row of plan.alternatives) {
          report.add(`| ${row.pick} | ${n(row.totalDamage)} | ${n(row.silver)} | ${n(row.mercLost)} |`);
        }
        report.add(`| **all-in** (rebuilt) | ${n(allInDamage)} | ${n(allInSilver)} | **${n(burn)}** |`);
        report.add('');
        const arms = plan.alternatives.map((other) => {
          const damage = other.totalDamage >= allInDamage;
          const silver = other.silver <= allInSilver;
          const fewer = other.mercLost < burn;
          return { other, damage, silver, fewer, fires: damage && silver && fewer };
        });
        report.add('| beating stop | damage ≥ | silver ≤ | chunks < | S-94 fires |');
        report.add('|---|---|---|---|---|');
        for (const arm of arms) {
          report.add(
            `| ${arm.other.pick} | ${arm.damage ? 'yes' : 'no'} (${n(arm.other.totalDamage)}) | ${
              arm.silver ? 'yes' : 'no'
            } (${n(arm.other.silver)}) | ${arm.fewer ? 'yes' : 'no'} (${n(arm.other.mercLost)}) | ${
              arm.fires ? '**yes**' : 'no'
            } |`,
          );
        }
        const firing = arms.find((arm) => arm.fires);
        report.add('');
        report.add(
          firing === undefined
            ? '**No stop fires all three arms on the rebuild**, so the row is being removed by something ' +
                'other than S-94 — the dedupe on identical counts is the only other thing that can.'
            : `**${firing.other.pick} fires all three arms**, so S-94 removes the row: it is on the bar, and ` +
                'then it is taken off it.',
        );
      }
      if (soloAllIn) {
        const beater = solo.alternatives.find(
          (other) =>
            other !== soloAllIn &&
            other.totalDamage >= soloAllIn.totalDamage &&
            other.silver <= soloAllIn.silver &&
            other.mercLost < soloAllIn.mercLost,
        );
        report.add('');
        report.add(
          beater === undefined
            ? '**No stop beats it outright at horizon 1**, which is why it survives there.'
            : `**${beater.pick} beats it outright** (${n(beater.totalDamage)} ≥ ${n(
                soloAllIn.totalDamage,
              )}, ${n(beater.silver)} ≤ ${n(soloAllIn.silver)}, ${n(beater.mercLost)} < ${n(
                soloAllIn.mercLost,
              )}), so S-94 would remove it.`,
        );
      }
    }

    // ---- D ---------------------------------------------------------------------------------------
    report.h('D. Is it this army, or is it a limit? — the two knobs he actually moves');
    report.add('');
    report.add(
      'The dominance pool and the hunter stock, swept around his own figures. Each cell is the bar the ' +
        'engine draws at the app’s own horizon of 4.',
    );
    report.add('');
    report.add('| dominance | stock | stops | sweet ⟶ steady chunks | all in? | why not |');
    report.add('|---|---|---|---|---|---|');
    let withAllIn = 0;
    let swept = 0;
    for (const dominance of [0, 200, 400, 600, 800, 1_000, 1_200]) {
      for (const stock of [27, 40, 64, 100, 142]) {
        const army = liveAccount(dominance, stock);
        const bar = planOf(army.profile, army.setup);
        swept += 1;
        if (bar === null) {
          report.add(`| ${n(dominance)} | ${n(stock)} | — | — | — | the plan refuses this army |`);
          continue;
        }
        const its = buildStackRequest(army.profile, army.setup);
        const sweetHere = bar.alternatives.find((row) => row.pick === 'sweet-spot');
        const steadyHere = bar.alternatives.find((row) => row.pick === 'steady-max');
        const has = bar.alternatives.some((row) => row.pick === 'all-in');
        if (has) withAllIn += 1;
        const gap =
          sweetHere && steadyHere ? steadyHere.repeat.mercLost - sweetHere.repeat.mercLost : Number.NaN;
        let why = has ? '—' : 'not offered or dropped';
        if (!has) {
          const one = planOf(army.profile, army.setup, 1);
          const oneAllIn = one?.alternatives.find((row) => row.pick === 'all-in');
          if (oneAllIn === undefined) why = 'not even at horizon 1';
          else if (steadyHere !== undefined) {
            const its1 = hiredUnits(its, oneAllIn.counts);
            const top1 = hiredUnits(its, steadyHere.counts);
            why =
              its1 > top1
                ? `offered (${n(its1)} > ${n(top1)}) then dropped`
                : `fields no more hired than the steady max (${n(its1)} vs ${n(top1)})`;
          }
        }
        report.add(
          `| ${n(dominance)} | ${n(stock)} | ${bar.alternatives.map((r) => r.pick).join(' · ')} | ${
            Number.isNaN(gap) ? '—' : n(gap)
          } | ${has ? '**yes**' : 'no'} | ${why} |`,
        );
      }
    }
    report.add('');
    report.add(
      `**${n(withAllIn)} of ${n(swept)}** armies swept carry an \`all-in\`. Nothing in the code caps the ` +
        'number of stops — `PlanPick` has five and `offer` pushes whichever exist — so a short bar is ' +
        'always a rule declining a row, never a ceiling on how many rows may be drawn.',
    );

    const out = report.save();
    writeFileSync(`${out}.done`, 'ok');
  }, 900_000);
});
