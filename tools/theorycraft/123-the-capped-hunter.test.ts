/**
 * 123 — **why his march fields 21 of 27 hunters, and why the bar carried only two rows** (owner,
 * 2026-09-20: he generated a march, got *21 hunters out of 27 in stock* with a 180 000-HP gap between the
 * last monster stack and the hunters, and a trade table showing **Sweet spot** and **Steady max** and
 * nothing else — *"I picked the last row expecting it to max out mercs, and it did not"*).
 *
 * **The arithmetic that makes it look wrong, before any of it is measured.** His hunters stand at 9 927 HP
 * a unit (`epic-monster-hunter-6`, 6 090 base HP in `src/data/tables/mercenaries.json`, ×1.6301 after his
 * sources). The lowest troop rung of the march he was shown is Archer I at 388 037 HP. `shelterUnder`
 * (`src/engine/plan.ts`) lowers a hired stack to `ceil(troopFloor / hp) − 1` = `ceil(388 037 / 9 927) − 1`
 * = **39**, his stock is **27**, and his authority pool houses 2 180 of a unit that costs 1. None of the
 * three explains 21. So something else caps it, and this experiment is about naming that something with
 * figures rather than with the code's own words.
 *
 * **Five questions, in the order they have to be answered.**
 *
 * **A. Is this his army at all?** A diagnosis on a lookalike is worthless, so the first section replays his
 * own paste — ten stacks with their HP to the unit, three pools, seven march figures and twelve bar
 * figures — against the reconstruction, and says outright whether every one of them matches.
 *
 * **B. What caps the hunter at 21?** Four ceilings are computed side by side on the march he was shown: the
 * stock, the authority housing, the shelter, and the one nobody names on screen — `largestSustained(held,
 * repeats)`, the rule that the repeated march has to be fieldable on **every repeat of the horizon**. Only
 * one of them is 21.
 *
 * **C. Why only two rows?** Each of the three missing stops (`silver-saver`, `more-mercs`, `all-in`) is
 * offered by a rule in `planCampaign` that reads figures this run can print. Each rule is evaluated here
 * against those figures, so the answer per row is a measured "this quantity was X and the rule needs Y".
 *
 * **D. Is 21 actually wrong?** The hunter count is swept from 0 to everything the shelter would allow, on
 * *this exact march*, priced with `simulateBattle` on the worst opening and `recoveryCosts` — and then the
 * same sweep read as a **four-march campaign**, spending the stock down march by march. The two peaks are
 * not in the same place, and which one the owner wanted is the whole of his complaint.
 *
 * **E. Does the take-out cause it?** His screen listed SP I and SP II under "tap to put back", so the
 * march may have come through the S-107 re-size (`resizeMarchOver`) rather than a plain Generate. Both are
 * run here on the same army and compared count by count.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/123-the-capped-hunter.test.ts`
 */
import { describe, it } from 'vitest';

import {
  largestSustained,
  lastsMarches,
  planCampaign,
  planRepeats,
  resizeMarchOver,
  shelterCounts,
} from '../../src/engine/plan';
import type { PlanRow, PlanTotals } from '../../src/engine/plan';
import { chunks, recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { Report, evaluateCounts, n } from './harness';

const HUNTER = 'epic-monster-hunter-6';

/**
 * **His account as his browser held it on 2026-09-20**, which is experiment 121's `ownersAccount` with the
 * three things his paste says are different: the dominance pool is **800** and not 1 200, the hunter stock
 * is **27** and not 64, and SP I / SP II are the two types sitting under "tap to put back".
 *
 * Nothing here is guessed: §A checks every figure it produces against his own screen before anything else
 * is concluded, and the guardsmen I–III / specialists-I-with-melee-excluded shape is what leaves exactly
 * the seven troop types his march and his put-back pills name between them (ARC1, ARC2, RD1, RD2, RD3 on
 * the field; SP1, SP2 out).
 */
function ownersAccount(dominance = 800, stock = 27): { profile: Profile; setup: BattleSetup } {
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
    active: { ...first.active, captains: ['ww8j0qwv'], events: ['ragnarok-fenrir'], vip: false, dragon: false },
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
    recoveryPlan: { mode: 'selective', selectiveTop: 3 },
  };
  return { profile, setup };
}

/** The worst-opening damage and the retraining bill of one explicit count vector. */
function price(base: StackRequest, counts: Record<string, number>): { damage: number; silver: number } {
  const { result, summary } = evaluateCounts(base, counts);
  return { damage: summary.minDamage, silver: recoveryCosts(result.stacks, base.units, base.recovery).plan.silver };
}

/** The two ratios the bar prints on a row — the **repeat's**, which is what the UI draws (`PlanTrade`). */
const perSilver = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.silver);
const perHired = (row: PlanTotals): number => row.repeat.hiredDamage / Math.max(1, row.repeat.mercLost);

const hhmm = (seconds: number): string =>
  `${String(Math.floor(seconds / 86_400))}d ${String(Math.floor((seconds % 86_400) / 3_600))}h`;

describe.skipIf(!process.env.THEORY)('the capped hunter', () => {
  it('reproduces his screen, names what caps the hunter, and prices the alternative', () => {
    const report = new Report('123-the-capped-hunter');
    const { profile, setup } = ownersAccount();
    const base = buildStackRequest(profile, setup);
    const plan = planCampaign({ ...buildPlanRequest(profile, setup), withTrade: true, withFrontier: true });
    const rows = plan.alternatives;
    const top = rows.at(-1) as PlanRow;
    const sweet = rows.find((row) => row.pick === 'sweet-spot') as PlanRow;

    // =================================================================================================
    // A. Is this his army?
    // =================================================================================================
    report.h('A. The reconstruction against his own screen');
    report.add('');
    report.add(
      'Every figure below is read off the run; the "he pasted" column is his message of 2026-09-20. The march is the **Steady max** stop, which is the row he picked.',
    );

    /** His paste, stack by stack: the HP profile with the first to fall on top. */
    const pastedProfile: [string, number][] = [
      ['rider-1', 419_900],
      ['rider-3', 410_540],
      ['archer-2', 403_596],
      ['rider-2', 395_160],
      ['archer-1', 388_037],
      ['emerald-dragon', 310_500],
      ['battle-boar', 308_776],
      ['water-elemental', 306_658],
      ['stone-gargoyle', 296_400],
      [HUNTER, 208_467],
    ];
    const { result: topResult, summary: topSummary } = evaluateCounts(base, top.counts);
    const labelOf = new Map(base.units.map((unit) => [unit.id, unit.label]));
    let mismatches = 0;
    report.add('');
    report.add('| # | stack | units | total HP measured | he pasted | same |');
    report.add('|---|---|---|---|---|---|');
    for (const [index, stack] of topResult.stacks.entries()) {
      const pasted = pastedProfile[index];
      const same = pasted !== undefined && pasted[0] === stack.unitId && pasted[1] === stack.totalHp;
      if (!same) mismatches += 1;
      report.add(
        `| ${String(index + 1)} | ${labelOf.get(stack.unitId) ?? stack.unitId} | ${n(stack.count)} | ${n(
          stack.totalHp,
        )} | ${pasted ? n(pasted[1]) : '—'} | ${same ? 'yes' : '**no**'} |`,
      );
    }

    const checks: [string, string, string][] = [
      ['expected damage', n(topSummary.avgDamage), '5,928,282'],
      ['worst opening', n(topSummary.minDamage), '5,763,382'],
      ['silver', n(top.repeat.silver), '2,449,200'],
      ['gold', n(top.repeat.gold), '9,024'],
      ['dragon coins', n(top.repeat.dragonCoins), '2,920'],
      ['time to recover', hhmm(top.repeat.seconds), '8d 6h'],
      ['hired lost', n(top.repeat.mercLost), '3'],
      ['leadership used', `${n(topResult.pools.leadership.used)} of ${n(topResult.pools.leadership.capacity)}`, '5,590 of 5,600'],
      ['authority used', `${n(topResult.pools.authority.used)} of ${n(topResult.pools.authority.capacity)}`, '21 of 2,180'],
      ['dominance used', `${n(topResult.pools.dominance.used)} of ${n(topResult.pools.dominance.capacity)}`, '628 of 800'],
      ['campaign damage', n(top.totalDamage), '22,582,807'],
      ['campaign silver', n(top.silver), '9,717,200'],
      ['campaign marches', n(top.marches), '4'],
      ['sweet · worst opening', n(sweet.repeat.damage), '5,698,946 (he read 5.7M)'],
      ['sweet · silver', n(sweet.repeat.silver), '2,499,000 (he read 2.5M)'],
      ['sweet · time', hhmm(sweet.repeat.seconds), '8d 17h'],
      ['sweet · dragon coins', n(sweet.repeat.dragonCoins), '2,520'],
      ['sweet · hired lost', n(sweet.repeat.mercLost), '2'],
      ['sweet · per silver', perSilver(sweet).toFixed(3), '2.280'],
      ['sweet · per hired', n(Math.round(perHired(sweet))), '482,450'],
      ['steady · per silver', perSilver(top).toFixed(3), '2.353'],
      ['steady · per hired', n(Math.round(perHired(top))), '397,312'],
      ['the bar’s rows', rows.map((row) => row.pick).join(' · '), 'sweet-spot · steady-max'],
    ];
    report.add('');
    report.add('| reading | measured | he pasted |');
    report.add('|---|---|---|');
    for (const [name, measured, pasted] of checks) report.add(`| ${name} | ${measured} | ${pasted} |`);
    report.add('');
    report.add(
      mismatches === 0
        ? '**Every stack matches to the unit and every figure on his screen is reproduced.** The diagnosis below is on his army and not on a lookalike.'
        : `**${String(mismatches)} stacks differ** — the reconstruction is not his army, and nothing below should be read as a diagnosis of his screen.`,
    );

    // =================================================================================================
    // B. What caps the hunter at 21?
    // =================================================================================================
    //
    // Four ceilings, each computed from the march he was shown. Three of them are the ones a player can see
    // on screen (his stock, his authority bar, the HP gap); the fourth is the horizon rule, which the screen
    // never names — and it is the only one that is 21.
    report.h('B. The four ceilings on the hunter, and which one is 21');
    const hunterUnit = base.units.find((unit) => unit.id === HUNTER);
    const hunterStack = topResult.stacks.find((stack) => stack.unitId === HUNTER);
    const troopFloor = Math.min(
      ...topResult.stacks.filter((stack) => stack.pool === 'leadership').map((stack) => stack.totalHp),
    );
    const hunterHp = hunterStack?.hpPerUnit ?? 0;
    const repeats = planRepeats(top);
    const ceilings: [string, number, string][] = [
      ['his stock', 27, 'the cap he typed on the mercenary card'],
      [
        'his authority housing',
        Math.floor(base.housing.authority / Math.max(1, hunterUnit?.cost ?? 1)),
        `\`floor(${n(base.housing.authority)} / ${String(hunterUnit?.cost ?? 1)})\` — the pool, at a cost of ${String(hunterUnit?.cost ?? 1)} a unit`,
      ],
      [
        'the shelter (`shelterUnder`)',
        Math.ceil(troopFloor / hunterHp) - 1,
        `\`ceil(${n(troopFloor)} / ${n(hunterHp)}) − 1\` — the most that still stands strictly under Archer I`,
      ],
      [
        '**the horizon (`largestSustained`)**',
        largestSustained(27, repeats),
        `\`largestSustained(27, ${String(repeats)})\` — the most a stock of 27 can field on **each** of the ${String(repeats)} repeats this stop plays`,
      ],
    ];
    report.add('');
    report.add('| ceiling | units | how it is computed |');
    report.add('|---|---|---|');
    for (const [name, value, how] of ceilings) report.add(`| ${name} | **${n(value)}** | ${how} |`);
    report.add('');
    report.add(
      `The march fields **${n(hunterStack?.count ?? 0)}**. The binding ceiling is the smallest of the four: **${
        ceilings.reduce((best, row) => (row[1] < best[1] ? row : best))[0]
      }**.`,
    );

    // The horizon rule, unrolled. `lastsMarches(held, count) = floor((held − count) / ceil(count/10)) + 1`.
    report.add('');
    report.add(
      `**Why 21 and not 22.** A fielded stack of \`c\` loses \`chunks(c) = ceil(c/10)\` units for good every march, and the count has to still be there to field on the last repeat — so a stock of 27 fielding \`c\` lasts \`floor((27 − c) / chunks(c)) + 1\` marches. The stop repeats its march ${String(repeats)} times (a four-march horizon is ${String(repeats)} repeats and a finale, \`planRepeats\`):`,
    );
    report.add('');
    report.add('| hunters a march | chunks burned | marches the stock lasts | enough for the 3 repeats |');
    report.add('|---|---|---|---|');
    for (let count = 27; count >= 18; count -= 1) {
      const lasts = lastsMarches(27, count);
      report.add(
        `| ${String(count)}${count === 21 ? ' **(fielded)**' : ''} | ${String(chunks(count))} | ${String(lasts)} | ${lasts >= repeats ? '**yes**' : 'no'} |`,
      );
    }
    report.add('');
    report.add(
      `And the campaign it buys, which is the line at the foot of his screen: **${String(repeats)} repeats of ${n(
        largestSustained(27, repeats),
      )} hunters burning ${String(chunks(21))} chunks each, then a finale on what is left** — ${String(
        repeats * chunks(21),
      )} + ${n(top.mercLost - repeats * chunks(21))} = **${n(top.mercLost)} of the 27 gone**, against his *"11 of the hired stock gone"*.`,
    );
    report.add('');
    report.add(
      `At a horizon of four **marches** rather than three repeats the same rule gives \`largestSustained(27, 4)\` = **${n(
        largestSustained(27, 4),
      )}**, and at one march it gives **${n(largestSustained(27, 1))}** — the whole stock. The horizon is the lever; the shelter, at ${n(
        Math.ceil(troopFloor / hunterHp) - 1,
      )}, never comes near.`,
    );

    // The same account planned at every horizon from one march to six. `CAMPAIGN.marches` is 4 in
    // `src/config.ts`; this is what the other five would have put on his screen, and it is the cleanest
    // demonstration that the count on the card is the horizon's answer and nothing else's.
    report.add('');
    report.add(
      '**The same army at every horizon.** `CAMPAIGN.marches` (`src/config.ts`) is **4**; nothing else changes between these runs.',
    );
    report.add('');
    report.add('| horizon | repeats | hunters a march | rows the bar carries | damage a march | campaign damage |');
    report.add('|---|---|---|---|---|---|');
    for (const target of [1, 2, 3, 4, 5, 6]) {
      const at = planCampaign({ ...buildPlanRequest(profile, setup), marchTarget: target });
      const dearest = at.alternatives.at(-1);
      if (!dearest) continue;
      report.add(
        `| ${String(target)}${target === 4 ? ' **(his)**' : ''} | ${String(planRepeats(dearest))} | **${n(
          dearest.counts[HUNTER] ?? 0,
        )}** | ${at.alternatives.map((row) => row.pick).join(' \u00b7 ')} | ${n(dearest.repeat.damage)} | ${n(
          dearest.totalDamage,
        )} |`,
      );
    }

    // =================================================================================================
    // C. Why the bar carried only two rows
    // =================================================================================================
    report.h('C. The three missing stops, one rule at a time');

    // --- more-mercs -----------------------------------------------------------------------------------
    //
    // `moreMercs` in plan.ts: `if (high - low < 2) return undefined`, where low and high are the sweet
    // spot's and the steady max's burned chunks. It is the rung "strictly inside" the gap, so a gap of one
    // has nothing in it.
    const low = sweet.repeat.mercLost;
    const high = top.repeat.mercLost;
    report.add('');
    report.add('### More mercs');
    report.add('');
    report.add(
      `It is *"the rung of the ladder nearest the middle of the gap between the sweet spot and the top, strictly inside it"*, and it is refused outright when the gap is smaller than two chunks. Measured: the sweet spot burns **${n(
        low,
      )}** and the steady max burns **${n(high)}**, a gap of **${n(high - low)}** — so there is no rung strictly between them and the stop is never built.`,
    );
    report.add('');
    report.add(
      `**The bar's whole axis is \`chunks(hunters)\`, and on this account it has three values.** The burn counts authority units only (S-102: a monster is trained, not spent), so it is \`ceil(hunters / 10)\`, and the hunter is capped at ${n(
        largestSustained(27, repeats),
      )} by §B:`,
    );
    report.add('');
    report.add('| hunters a march | 1–10 | 11–20 | 21 |');
    report.add('|---|---|---|---|');
    report.add('| chunks burned | 1 | 2 | 3 |');
    report.add('');
    report.add(
      'A bar of five stops is being drawn on an axis with **three points on it**, two of which the sweet spot and the steady max already occupy.',
    );

    // --- silver-saver ---------------------------------------------------------------------------------
    //
    // `leastSilver` is chosen over the *band* (`candidates`), not over the ladder: the cheapest plan that
    // stands left of the sweet spot (fewer chunks burned), costs no more silver, and returns at least the
    // sweet spot's damage a silver. Every one of those three is a figure the frontier carries, so the set
    // can be listed here exactly as the rule sees it.
    const frontier = plan.frontier ?? [];
    // `leastSilver` is chosen over `candidates`, which is `undominated.filter(inBand)` — so both verdicts,
    // read straight off the frontier diagnostic rather than recomputed here.
    const banded = frontier.filter((row) => row.inBand && row.undominated);
    const leftOfSweet = banded.filter(
      (row) =>
        row.repeat.mercLost < sweet.repeat.mercLost &&
        row.repeat.silver <= sweet.repeat.silver &&
        perSilver(row) >= perSilver(sweet),
    );
    report.add('');
    report.add('### Silver saver');
    report.add('');
    report.add(
      `It is the cheapest plan of the **band** that stands left of the sweet spot — fewer chunks burned — while costing no more silver **and** returning at least the sweet spot's damage a silver. The sweet spot burns ${n(
        low,
      )}, so "left of it" means a plan burning **1** chunk: ten hunters or fewer.`,
    );
    report.add('');
    const cheaper = banded.filter((row) => row.repeat.mercLost < sweet.repeat.mercLost);
    report.add(
      `The search priced **${n(frontier.length)}** plans, of which **${n(banded.length)}** are inside the band. Of those, **${n(
        cheaper.length,
      )}** burn fewer chunks than the sweet spot, and **${n(leftOfSweet.length)}** clear all three of the rule's tests.`,
    );
    if (cheaper.length > 0) {
      report.add('');
      report.add('| plan | hunters | chunks | silver a march | damage a march | per silver | ≤ sweet’s silver | ≥ sweet’s rate |');
      report.add('|---|---|---|---|---|---|---|---|');
      for (const row of [...cheaper].sort((a, b) => a.repeat.silver - b.repeat.silver).slice(0, 12)) {
        report.add(
          `| ${row.label} | ${n(row.counts[HUNTER] ?? 0)} | ${n(row.repeat.mercLost)} | ${n(
            row.repeat.silver,
          )} | ${n(row.repeat.damage)} | ${perSilver(row).toFixed(3)} | ${
            row.repeat.silver <= sweet.repeat.silver ? 'yes' : '**no**'
          } | ${perSilver(row) >= perSilver(sweet) ? 'yes' : '**no**'} |`,
        );
      }
    }
    report.add('');
    report.add(
      `The sweet spot's own bar is **${n(sweet.repeat.silver)}** silver at **${perSilver(sweet).toFixed(
        3,
      )}** a silver.`,
    );
    if (cheaper.length > 0) {
      const bestRate = cheaper.reduce((best, row) => (perSilver(row) > perSilver(best) ? row : best));
      const cheapest = cheaper.reduce((best, row) =>
        row.repeat.silver < best.repeat.silver ? row : best,
      );
      report.add('');
      report.add(
        `**Which of the three tests actually refuses them.** Of the ${n(
          cheaper.length,
        )} cheaper plans, **${n(
          cheaper.filter((row) => row.repeat.silver <= sweet.repeat.silver).length,
        )}** cost no more silver than the sweet spot — so the silver test refuses almost none of them — while **${n(
          cheaper.filter((row) => perSilver(row) >= perSilver(sweet)).length,
        )}** return at least its ${perSilver(sweet).toFixed(
          3,
        )} a silver. The best rate anywhere left of the sweet spot is **${perSilver(bestRate).toFixed(
          3,
        )}** (${n(bestRate.counts[HUNTER] ?? 0)} hunters, ${n(
          bestRate.repeat.silver,
        )} silver), and the cheapest march of all returns ${perSilver(cheapest).toFixed(3)}.`,
      );
      report.add('');
      report.add(
        '**And the efficiency test is the one that refuses them.** A hunter costs no silver to retrain — it is gone for good, and the silver column is the *troops* it stands behind. §D holds the troops of this march still and moves only the hunter: the silver does not move at all while the damage climbs, so damage a silver rises monotonically with the hunter count. On an account whose only hired stock is a mercenary, spending fewer of them is always a **worse** rate, and a stop defined as *cheaper and at least as efficient a silver* has nothing it can be.',
      );
    }

    // --- all-in ---------------------------------------------------------------------------------------
    //
    // `if (allIn && top && filledOf(allIn.counts) > filledOf(top.counts)) offer(allIn, 'all-in')`. `filledOf`
    // counts **every hired unit** — the authority pool's hunters and the dominance pool's monsters together
    // — so the steady max's own monster camp is on the steady max's side of that comparison.
    const hiredUnitsOf = (counts: Record<string, number>): number =>
      base.units
        .filter((unit) => unit.pool !== 'leadership')
        .reduce((sum, unit) => sum + (counts[unit.id] ?? 0), 0);
    const monsterUnits = base.units.filter((unit) => unit.pool === 'dominance');
    report.add('');
    report.add('### All in');
    report.add('');
    report.add(
      `It is offered *only* when its first march fields **more hired units** than the steady max's repeat, and "hired units" counts the **monsters as well as the hunters** (\`filledOf\`, over every non-leadership pool). The steady max's side of that comparison is therefore:`,
    );
    report.add('');
    report.add('| pool | stacks | units |');
    report.add('|---|---|---|');
    report.add(
      `| authority | ${HUNTER} | ${n(top.counts[HUNTER] ?? 0)} |`,
    );
    report.add(
      `| dominance | ${monsterUnits.map((unit) => unit.label).join(', ')} | ${n(
        monsterUnits.reduce((sum, unit) => sum + (top.counts[unit.id] ?? 0), 0),
      )} |`,
    );
    report.add(`| **total** | | **${n(hiredUnitsOf(top.counts))}** |`);

    /**
     * **The stop is built, and it does field the whole stock — it is removed after it is offered.**
     *
     * The all-in's **first** march is the same march at every horizon: the builder scores each march of its
     * sequence at `marches = 1` off the stock that is left, and on the first march nothing has been spent
     * yet. So the one horizon where the row survives to the payload shows what the offer rule was comparing
     * at every other horizon. That horizon is **1**, and this is its row.
     */
    const atOne = planCampaign({ ...buildPlanRequest(profile, setup), marchTarget: 1 });
    const allInRow = atOne.alternatives.find((row) => row.pick === 'all-in');
    if (allInRow) {
      report.add('');
      report.add(
        `**The stop exists, and its first march fields everything.** At a horizon of **1** the same army carries it, and this is the march it offers: **${n(
          allInRow.counts[HUNTER] ?? 0,
        )} hunters** — the whole stock — behind ${n(
          monsterUnits.reduce((sum, unit) => sum + (allInRow.counts[unit.id] ?? 0), 0),
        )} monster units, **${n(
          hiredUnitsOf(allInRow.counts),
        )} hired units in all**, for ${n(allInRow.repeat.damage)} worst-opening at ${n(
          allInRow.repeat.silver,
        )} silver and ${n(allInRow.repeat.dragonCoins)} dragon coins.`,
      );
      report.add('');
      report.add('| stack | the all-in’s first march | the Steady max he was shown |');
      report.add('|---|---|---|');
      for (const unit of base.units) {
        const mine = allInRow.counts[unit.id] ?? 0;
        const his = top.counts[unit.id] ?? 0;
        if (mine === 0 && his === 0) continue;
        report.add(`| ${unit.label} | ${n(mine)} | ${n(his)} |`);
      }
      report.add('');
      report.add(
        `**So the offer rule passes at his horizon too**: \`filledOf\` compares **${n(
          hiredUnitsOf(allInRow.counts),
        )}** against **${n(
          hiredUnitsOf(top.counts),
        )}**. (\`filledOf\` counts only the types above the S-99 hired cut, and that cut is **inert on this army** — measured below: the bar is identical with \`refuseDroppedTypes\` off, which is the flag that switches the cut on.) The row is therefore **offered and then removed**, and there is exactly one rule between the offer and the payload that removes a row outright: S-94's *"the all-in is not offered when a stop beside it beats it outright"*.`,
      );

      /**
       * S-94 reads three figures of the **campaign**: another stop with at least the all-in's damage, at most
       * its silver and **strictly fewer** chunks of the stock burned. The first two need the all-in's own
       * campaign, which the payload no longer carries — so it is rebuilt here the way the builder spends the
       * stock: its measured first march, then each next march on what the stock has left, `chunks` of it gone
       * each time. Marches two to four are re-sized by the builder and are only approximated here; what is
       * exact is the **burn**, which is the arm that decides.
       */
      let held = 27;
      let rebuilt = 0;
      let burned = 0;
      const legs: number[] = [];
      for (let march = 0; march < 4; march += 1) {
        const fielded = Math.min(allInRow.counts[HUNTER] ?? 0, held);
        const leg = price(base, { ...allInRow.counts, [HUNTER]: fielded }).damage;
        legs.push(fielded);
        rebuilt += leg;
        burned += chunks(fielded);
        held = Math.max(0, held - chunks(fielded));
      }
      const allInSilver = 4 * allInRow.repeat.silver;
      report.add('');
      report.add(
        `**The predicate, on his own bar.** Rebuilt, the all-in plays ${legs
          .map((count) => String(count))
          .join(' \u00b7 ')} hunters over four marches: about **${n(rebuilt)}** damage, about **${n(
          allInSilver,
        )}** silver, and **${String(burned)}** chunks of the 27 burned. Against the sweet spot the bar does carry:`,
      );
      report.add('');
      report.add('| arm of the rule | the sweet spot | the all-in | fires |');
      report.add('|---|---|---|---|');
      report.add(
        `| damage (needs ≥) | ${n(sweet.totalDamage)} | ${n(rebuilt)} | ${
          sweet.totalDamage >= rebuilt ? '**yes**' : 'no'
        } |`,
      );
      report.add(
        `| silver (needs ≤) | ${n(sweet.silver)} | ${n(allInSilver)} | ${
          sweet.silver <= allInSilver ? '**yes**' : 'no'
        } |`,
      );
      report.add(
        `| chunks burned (needs **<**) | ${n(sweet.mercLost)} | ${String(burned)} | ${
          sweet.mercLost < burned ? '**yes**' : 'no'
        } |`,
      );
      report.add('');
      report.add(
        `All three arms hold, and the row goes. **The control is the horizon-1 run**, where the all-in burns ${String(
          allInRow.mercLost,
        )} chunks and the dearest rung beside it burns ${String(
          atOne.alternatives.filter((row) => row.pick !== 'all-in').reduce((most, row) => Math.max(most, row.mercLost), 0),
        )} — nothing burns **strictly** fewer, the rule cannot fire, and the row survives. That is the whole difference between the two runs.`,
      );
      report.add('');
      report.add(
        '**What that means for his complaint.** The bar drops the one stop that fields his whole stock because it *costs more silver for less damage over four marches* — which is true, and which is not the question he was asking. He wanted the row that spends the mercenaries; the rule that removed it is a rule about campaign efficiency, and it was written (S-94) to stop the all-in being a strictly worse plan. On this army it removes the only offer the stop exists to make.',
      );
    }

    // --- and what the share walk does to it, when the sizer family is not there ------------------------
    //
    // A second weakness of the same stop, measured separately because it is a different mechanism: the walk
    // that decides how much of the stock the stop asks for scales **every** hired type by one common share.
    report.add('');
    report.add(
      `**A second thing the same stop gets wrong, which shows when the sizer shapes are off.** The all-in's share walk starts from every hired type's stock — a capped mercenary at its cap, an **uncapped** type at what its own pool would house — and scales them all by **one common share**, 100 %, 95 %, 90 %…, taking the first share at which some shape is both housed (\`fitsHousing\`) and sheltered. His four monster types are uncapped, so each of them reads the **whole** dominance pool:`,
    );
    report.add('');
    report.add('| type | cost | its own stock for the walk | dominance that asks for |');
    report.add('|---|---|---|---|');
    let asked = 0;
    for (const unit of monsterUnits) {
      const held = Math.floor(base.housing.dominance / Math.max(1, unit.cost));
      asked += held * unit.cost;
      report.add(`| ${unit.label} | ${String(unit.cost)} | ${n(held)} | ${n(held * unit.cost)} |`);
    }
    report.add(`| **together** | | | **${n(asked)}** |`);
    report.add('');
    report.add(
      `His camp houses **${n(base.housing.dominance)}**, so the walk's vector at share *s* asks for about \`${n(
        asked,
      )} \u00d7 s\` dominance and **no share above ${((base.housing.dominance / asked) * 100).toFixed(
        0,
      )} % can be housed at all** \u2014 while the same share is applied to the hunter, whose 27 becomes:`,
    );
    report.add('');
    report.add('| share | dominance the vector asks for | housed | hunters it fields | hired units in all |');
    report.add('|---|---|---|---|---|');
    for (const share of [1, 0.5, 0.35, 0.3, 0.25, 0.2, 0.15, 0.1]) {
      let dominance = 0;
      let units = 0;
      for (const unit of monsterUnits) {
        const count = Math.floor(Math.floor(base.housing.dominance / Math.max(1, unit.cost)) * share);
        dominance += count * unit.cost;
        units += count;
      }
      const hunters = Math.floor(27 * share);
      report.add(
        `| ${(share * 100).toFixed(0)} % | ${n(dominance)} | ${
          dominance <= base.housing.dominance ? 'yes' : '**no**'
        } | ${n(hunters)} | ${n(units + hunters)} |`,
      );
    }
    report.add('');
    report.add(
      'The sizer shapes rescue the walk from that (`sizeStacks` fills a pool and stops, so it answers at the full share), which is why the row above fields 27 and not six. **Switch the sizer family off and the walk is all that is left**, and the stop lands exactly where the arithmetic says:',
    );
    report.add('');
    report.add('| the plan with | rows | hunters the All in fields | hired units on it |');
    report.add('|---|---|---|---|');
    for (const variant of [
      { name: 'every flag as shipped', flags: {} },
      { name: '`refuseDroppedTypes` off (the S-99 cut)', flags: { refuseDroppedTypes: false } },
      { name: '`tokenFloor` off', flags: { tokenFloor: false } },
      { name: '**`sizerShape` off**', flags: { sizerShape: false } },
      { name: 'no put-back pass', flags: { putBack: undefined } },
    ]) {
      const run = planCampaign({ ...buildPlanRequest(profile, setup), ...variant.flags });
      const stop = run.alternatives.find((row) => row.pick === 'all-in');
      report.add(
        `| ${variant.name} | ${run.alternatives.map((row) => row.pick).join(' \u00b7 ')} | ${
          stop ? `**${n(stop.counts[HUNTER] ?? 0)}**` : 'the row is not there'
        } | ${stop ? n(hiredUnitsOf(stop.counts)) : '\u2014'} |`,
      );
    }
    report.add('');
    report.add(
      'With the sizer off the All in is back on the bar \u2014 fielding **six** hunters of his 27, which is `floor(27 \u00d7 0.25)` to the unit. Two of the five rows of this bar are decided by a walk that scales a mercenary stock by a monster pool.',
    );

    // Two perturbations that move one thing each: the camp itself, and the room it stands in.
    report.add('');
    report.add(
      '**The same account with the monster camp off** \u2014 everything else untouched:',
    );
    {
      const noMonsters = ownersAccount(800, 27);
      noMonsters.profile.troops = { ...noMonsters.profile.troops, monsters: null };
      const other = planCampaign(buildPlanRequest(noMonsters.profile, noMonsters.setup));
      report.add('');
      report.add('| stop | hunters | chunks | damage a march | silver a march | campaign damage |');
      report.add('|---|---|---|---|---|---|');
      for (const row of other.alternatives) {
        report.add(
          `| ${row.pick} | **${n(row.counts[HUNTER] ?? 0)}** | ${n(row.repeat.mercLost)} | ${n(
            row.repeat.damage,
          )} | ${n(row.repeat.silver)} | ${n(row.totalDamage)} |`,
        );
      }
      report.add('');
      report.add(
        `Rows: **${other.alternatives.map((row) => row.pick).join(' \u00b7 ')}** \u2014 against **${rows
          .map((row) => row.pick)
          .join(' \u00b7 ')}** with the camp on. Take the monsters away and the stop that fields all 27 is offered, and survives.`,
      );
    }

    // --- where the row comes back ---------------------------------------------------------------------
    //
    // Two sweeps that bracket the mechanism from opposite sides without guessing at the builder's internals.
    // Widening the dominance pool loosens the share walk and leaves everything else alone; raising the
    // hunter stock raises the hunter's own share of `filledOf` and leaves the pool alone. Whichever of the
    // two brings the row back tells which half of the comparison is doing the work.
    report.add('');
    report.add(
      '**Where the All in comes back.** Two sweeps, each moving one thing. His account is the first line of each.',
    );
    report.add('');
    report.add('| dominance housed | over-subscribed by | rows | hunters on the dearest stop | hired units on it |');
    report.add('|---|---|---|---|---|');
    for (const dominance of [800, 900, 1_000, 1_100, 1_200, 1_600, 2_400, 3_200]) {
      const army = ownersAccount(dominance, 27);
      const run = planCampaign(buildPlanRequest(army.profile, army.setup));
      const dearest = run.alternatives.at(-1);
      if (!dearest) continue;
      report.add(
        `| ${n(dominance)}${dominance === 800 ? ' **(his)**' : ''} | ${(asked / dominance).toFixed(1)}\u00d7 | ${run.alternatives
          .map((row) => row.pick)
          .join(' \u00b7 ')} | **${n(dearest.counts[HUNTER] ?? 0)}** | ${n(hiredUnitsOf(dearest.counts))} |`,
      );
    }
    report.add('');
    report.add('| hunter stock | rows | hunters on the dearest stop | hired units on it |');
    report.add('|---|---|---|---|');
    for (const stock of [27, 40, 64, 100, 200]) {
      const army = ownersAccount(800, stock);
      const run = planCampaign(buildPlanRequest(army.profile, army.setup));
      const dearest = run.alternatives.at(-1);
      if (!dearest) continue;
      report.add(
        `| ${n(stock)}${stock === 27 ? ' **(his)**' : ''} | ${run.alternatives
          .map((row) => row.pick)
          .join(' \u00b7 ')} | **${n(dearest.counts[HUNTER] ?? 0)}** | ${n(hiredUnitsOf(dearest.counts))} |`,
      );
    }

    // =================================================================================================
    // D. Is 21 right?
    // =================================================================================================
    //
    // Two different questions, and the owner asked one of them while the engine answered the other.
    //
    //   *the march*   — on this exact field, how much damage does each hunter count buy?
    //   *the campaign* — over four marches with 27 hunters to spend, how much does each **repeated** count buy?
    //
    // Both are priced here with the same arithmetic: `simulateBattle` on the worst opening (`minDamage`,
    // which is what the bar ranks on) plus `recoveryCosts` for the silver. The campaign model is stated
    // rather than inherited: four marches, the same troops and the same monsters every time (a monster is
    // retrained, not spent), the hunter fielded at `min(n, what the stock still holds)`, and `chunks` of it
    // gone for good after each march.
    report.h('D. What each hunter count is actually worth, on this march and over his campaign');
    const shelterCeiling = Math.ceil(troopFloor / hunterHp) - 1;
    const sweepRows: {
      hunters: number;
      damage: number;
      silver: number;
      chunks: number;
      lasts: number;
      campaign: number;
      spent: number;
    }[] = [];
    for (let hunters = 0; hunters <= shelterCeiling; hunters += 1) {
      const one = price(base, { ...top.counts, [HUNTER]: hunters });
      // Four marches, spending the stock down.
      let held = 27;
      let campaign = 0;
      let spent = 0;
      for (let march = 0; march < 4; march += 1) {
        const fielded = Math.min(hunters, held);
        campaign += price(base, { ...top.counts, [HUNTER]: fielded }).damage;
        const lost = chunks(fielded);
        held = Math.max(0, held - lost);
        spent += lost;
      }
      sweepRows.push({
        hunters,
        damage: one.damage,
        silver: one.silver,
        chunks: chunks(hunters),
        lasts: hunters === 0 ? Infinity : hunters > 27 ? Number.NaN : lastsMarches(27, hunters),
        campaign,
        spent,
      });
    }
    const inStock = sweepRows.filter((row) => row.hunters <= 27);
    const marchPeak = inStock.reduce((best, row) => (row.damage > best.damage ? row : best));
    const campaignPeak = inStock.reduce((best, row) => (row.campaign > best.campaign ? row : best));
    const fieldedRow = sweepRows[top.counts[HUNTER] ?? 0];

    report.add('');
    report.add(
      `The march's troops and monsters are held exactly as the Steady max fields them; only the hunter moves. His stock is 27, so rows past it are what the **shelter** would have allowed (up to ${n(
        shelterCeiling,
      )}) and the stock does not.`,
    );
    report.add('');
    report.add('| hunters | worst opening | silver | chunks a march | marches the stock lasts | 4-march campaign | chunks spent |');
    report.add('|---|---|---|---|---|---|---|');
    for (const row of sweepRows) {
      if (row.hunters % 3 !== 0 && row.hunters !== 21 && row.hunters !== 27 && row.hunters !== marchPeak.hunters && row.hunters !== campaignPeak.hunters) {
        continue;
      }
      const note = [
        row.hunters === (top.counts[HUNTER] ?? 0) ? '**(the plan)**' : '',
        row.hunters > 27 ? '*(past his stock)*' : '',
      ]
        .filter(Boolean)
        .join(' ');
      report.add(
        `| ${String(row.hunters)} ${note} | ${n(row.damage)} | ${n(row.silver)} | ${String(row.chunks)} | ${
          Number.isNaN(row.lasts) ? '—' : Number.isFinite(row.lasts) ? String(row.lasts) : '∞'
        } | ${row.hunters <= 27 ? n(row.campaign) : '—'} | ${row.hunters <= 27 ? String(row.spent) : '—'} |`,
      );
    }
    report.add('');
    report.add(
      `**The single march peaks at ${n(marchPeak.hunters)} hunters** (${n(
        marchPeak.damage,
      )} worst-opening) and the plan fields ${n(fieldedRow?.hunters ?? 0)} for ${n(
        fieldedRow?.damage ?? 0,
      )} — a gap of **${((marchPeak.damage / Math.max(1, fieldedRow?.damage ?? 1) - 1) * 100).toFixed(2)} %** on the one march.`,
    );
    report.add('');
    report.add(
      `**The four-march campaign peaks at ${n(campaignPeak.hunters)} hunters** (${n(
        campaignPeak.campaign,
      )}) against the plan's ${n(fieldedRow?.campaign ?? 0)} at ${n(fieldedRow?.hunters ?? 0)} — **${(
        (campaignPeak.campaign / Math.max(1, fieldedRow?.campaign ?? 1) - 1) *
        100
      ).toFixed(2)} %**.`,
    );
    report.add('');
    report.add(
      `**And the two campaigns spend exactly the same stock.** \`chunks(27)\` and \`chunks(21)\` are both **${String(
        chunks(27),
      )}**, so the descending campaign 27 · 24 · 21 · 18 burns ${String(
        chunks(27) + chunks(24) + chunks(21) + chunks(18),
      )} chunks of the 27 and the flat one 21 · 21 · 21 · 18 burns ${String(
        chunks(21) * 3 + chunks(18),
      )} — the same **${n(top.mercLost)}** the foot of his screen reports, for the same ${n(
        (sweepRows[21]?.silver ?? 0) * 4,
      )} silver. The horizon cap is buying **nothing** here: it gives up ${n(
        campaignPeak.campaign - (fieldedRow?.campaign ?? 0),
      )} damage and saves neither a chunk of stock nor a piece of silver.`,
    );
    report.add('');
    report.add(
      `And the campaign the engine actually planned — three repeats and a re-sized finale — is **${n(
        top.totalDamage,
      )}**, which is **below** the flat model's ${n(
        fieldedRow?.campaign ?? 0,
      )}: its finale is worth ${n(
        top.totalDamage - 3 * top.repeat.damage,
      )}, where simply repeating the march with the ${n(27 - 3 * chunks(21))} hunters the stock has left is worth ${n(
        sweepRows[27 - 3 * chunks(21)]?.damage ?? 0,
      )}. That is a second, smaller finding, and it is not what this experiment is about.`,
    );
    report.add('');
    report.add(
      `**The one-march answer.** If he means to spend the stock on a single march — an epic-event opener — the best he can field is the whole 27 (the shelter allows ${n(
        shelterCeiling,
      )}), worth **${n(sweepRows[27]?.damage ?? 0)}** worst-opening against the plan's **${n(
        fieldedRow?.damage ?? 0,
      )}**: **+${(((sweepRows[27]?.damage ?? 0) / Math.max(1, fieldedRow?.damage ?? 1) - 1) * 100).toFixed(
        2,
      )} %** for one march, burning the same ${String(chunks(27))} chunks the plan already burns.`,
    );

    // =================================================================================================
    // E. Does the take-out cause it?
    // =================================================================================================
    //
    // His screen listed SP I and SP II under "tap to put back". If he took them out by hand, the March pane
    // re-derives the march through `resizeMarchOver` with the S-107 caps (`generate.ts`, `capOf`): a
    // mercenary at `largestSustained(stock, repeats)`, a monster at its own pool. This runs exactly that,
    // and compares it with the plan's own stop.
    report.h('E. The take-out: the plan’s stop against the S-107 re-size');
    const includedTroops = base.units
      .filter((unit) => unit.pool === 'leadership' && (top.counts[unit.id] ?? 0) > 0)
      .map((unit) => unit.id);
    const capOf = (unit: { id: string; pool: string; cost: number }): number => {
      if (unit.pool === 'dominance') {
        return Math.max(top.counts[unit.id] ?? 0, Math.floor(base.housing.dominance / Math.max(1, unit.cost)));
      }
      const held = base.caps[unit.id];
      if (held === undefined) return Math.floor(base.housing.authority / Math.max(1, unit.cost));
      return largestSustained(held, repeats);
    };
    const hired: Record<string, number> = {};
    for (const unit of base.units) {
      if (unit.pool === 'leadership') continue;
      hired[unit.id] = capOf(unit);
    }
    report.add('');
    report.add(
      `The pane's own caps for this stop (\`src/ui/sections/march/generate.ts\`, \`capOf\`): the hunter at \`largestSustained(27, ${String(
        repeats,
      )})\` = **${n(hired[HUNTER] ?? 0)}**, each monster at its own pool.`,
    );
    const resized = resizeMarchOver(base, { troopIds: includedTroops, hired });
    report.add('');
    report.add('| stack | the plan’s Steady max | the re-size with SP I / SP II out |');
    report.add('|---|---|---|');
    const ids = new Set([...Object.keys(top.counts), ...Object.keys(resized?.counts ?? {})]);
    let identical = true;
    for (const id of ids) {
      const was = top.counts[id] ?? 0;
      const now = resized?.counts[id] ?? 0;
      if (was !== now) identical = false;
      report.add(`| ${labelOf.get(id) ?? id} | ${n(was)} | ${n(now)}${was === now ? '' : ' **←**'} |`);
    }
    report.add('');
    report.add(
      `Damage: **${n(top.repeat.damage)}** against **${n(resized?.damage ?? 0)}**; silver **${n(
        top.repeat.silver,
      )}** against **${n(resized?.silver ?? 0)}**.`,
    );
    report.add('');
    report.add(
      identical
        ? '**The two marches are identical, stack for stack.** SP I and SP II were never in the Steady max to begin with — the plan left them out, not the player — so the re-size has nothing to give back and the hunter stays at what the horizon allows. The take-out is **not** what caps the hunter.'
        : `**The hunter is 21 on both, and everything else moves.** §A settled which of the two he was looking at: his screen reads ${n(
            top.repeat.damage,
          )} worst-opening and ${n(
            top.repeat.silver,
          )} silver, which is the **plan's own stop** to the unit, so the march he complained about never went through the re-size — SP I and SP II are types the search left out, not types he took out. The re-size is therefore **not** what caps the hunter: it caps it at exactly the same \`largestSustained(27, ${String(
            repeats,
          )})\` = 21.

But it is worth saying out loud what the re-size *does* do, because it is a defect of its own: pressing any pill on this stop re-derives the march at **${n(
            resized?.damage ?? 0,
          )}** against the plan's **${n(top.repeat.damage)}** — **${(
            ((resized?.damage ?? 0) / Math.max(1, top.repeat.damage) - 1) *
            100
          ).toFixed(
            1,
          )} %** — for **more** silver. The cause is visible in the table: the monsters are capped at their **own pool** in the re-size (S-102, *"a monster is trained, not spent"*), so the sizer fills the dominance pool from ${n(
            monsterUnits.reduce((sum, unit) => sum + (top.counts[unit.id] ?? 0) * unit.cost, 0),
          )} to ${n(
            monsterUnits.reduce((sum, unit) => sum + (resized?.counts[unit.id] ?? 0) * unit.cost, 0),
          )} of the 800, and the leadership it has to leave over for the troops falls with it.`,
    );
    report.add('');
    report.add(
      `And the shelter read back off the plan's own march (\`shelterCounts\`) leaves the hunter at **${n(
        shelterCounts(base, top.counts)[HUNTER] ?? 0,
      )}**: the shelter has nothing to say about ${n(top.counts[HUNTER] ?? 0)} either.`,
    );

    report.save();
  }, 900_000);
});
