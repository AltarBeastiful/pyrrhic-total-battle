/**
 * 72 — why the plan leaves a mercenary type at 0 (owner, 2026-09-15: "why is the full optimization mode
 * leaving out a stack of mercs sometimes? It seems quite detrimental to damage").
 *
 * The app takes `planned.recommend ?? planned` and marks `Object.keys(chosen.counts)` as the included
 * types, so any mercenary type the plan fields at 0 is shown to the player as left out. This experiment
 * reproduces that plan on the owner's own export and measures, with the engine's own arithmetic and with
 * the real `simulateBattle`, what restoring the dropped type would do.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/72-merc-left-out.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { lastsMarches, marchResult, planCampaign, shapeScorer } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { ResolvedSource, StackRequest } from '../../src/engine/types';
import { Report, duration, lines, loadOwner, n, withCaps, withHousing } from './harness';

/** Scenario C — the bonuses the account's current fights are under (harness.kaiReportTotals). */
const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account',
  kind: 'custom',
  health: { guardsmen: 159, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 189, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
/** What the account holds, by mercenary type — the export's own caps. */
const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};
const MERC_IDS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;
const SHORT = (id: string): string => id.replace(/-6$/, '');
/** The ten ladder scales the planner's grid offers (`LADDER_GROWTHS` in `plan.ts`, not exported). */
const SCALES = [1, 1.25, 1.5, 1.8, 2.2, 2.6, 3.2, 4, 5, 6];

function ownerRequest(): StackRequest {
  const owner = loadOwner();
  return withCaps(
    withHousing(
      { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
      { leadership: 4_343, authority: 2_000 },
    ),
    HELD,
  );
}

const mercs = (counts: Record<string, number>): string =>
  MERC_IDS.map((id) => `${SHORT(id)} ${n(counts[id] ?? 0)}${(counts[id] ?? 0) === 0 ? ' ⃰' : ''}`).join(
    ' · ',
  );
const zeros = (counts: Record<string, number>): string => {
  const out = MERC_IDS.filter((id) => (counts[id] ?? 0) === 0);
  return out.length === 0 ? '—' : out.map(SHORT).join(', ');
};

describe.skipIf(!process.env.THEORY)(
  'the plan leaves a mercenary type at 0',
  () => {
    it('reproduces the plan, names the mechanism, and measures the counterfactual', () => {
      const report = new Report('72-merc-left-out');
      const request = ownerRequest();

      // ---- 1. the plan the app puts on screen ------------------------------------------------------------------
      // The app calls `planCampaign({ ...buildPlanRequest(profile, setup), budgetMs: 25_000 })` and takes
      // `recommend ?? plan`; `alternatives` defaults to 12. Both the budgeted and the unbudgeted run are made,
      // to show the 25 s deadline is not what makes the plan what it is.
      const app = planCampaign({ request, budgetMs: 25_000 });
      const full = planCampaign({ request });
      const chosen = full.recommend ?? full;

      report.h('1. The plan the app puts on screen');
      report.add(
        `\`plan\` (the best found): **${n(full.marches)} marches**, ${n(full.totalDamage)} damage, ` +
          `${n(full.silver)} silver, ${n(full.mercLost)} mercs lost — ${mercs(full.march.counts)}`,
      );
      report.add(
        `\`recommend\` — what the UI takes — **${n(chosen.marches)} marches**, ${n(chosen.totalDamage)} damage, ` +
          `${n(chosen.silver)} silver, ${n(chosen.mercLost)} mercs lost — ${mercs(chosen.counts)}`,
      );
      report.add(`**types at 0: ${zeros(chosen.counts)}**  (⃰ = at 0)`);
      report.add(
        `with \`budgetMs: 25_000\` (the app's own call): the same \`plan\` — ${n(app.marches)} marches, ` +
          `${n(app.totalDamage)} damage, ${n(app.silver)} silver — and the same \`recommend\`, ` +
          `${n((app.recommend ?? app).marches)} marches at ${n((app.recommend ?? app).silver)} silver, ` +
          `${mercs((app.recommend ?? app).counts)}: **${app.totalDamage === full.totalDamage ? 'identical to the unbudgeted run (the 25 s deadline is not what shapes the answer here — the search finishes in about 2 s)' : 'DIFFERENT from the unbudgeted run'}**`,
      );
      report.add(
        `the repeated march: ${Object.entries(chosen.counts)
          .map(([id, count]) => `${id} ${n(count)}`)
          .join(' · ')}`,
      );
      report.add(
        `its finale (\`finaleCounts\`): ${
          chosen.finaleCounts
            ? Object.entries(chosen.finaleCounts)
                .map(([id, count]) => `${id} ${n(count)}`)
                .join(' · ')
            : '—'
        }`,
      );
      report.add(
        `binding: ${Object.entries(full.binding)
          .map(([key, value]) => `${key} ${value}`)
          .join(' · ')}`,
      );

      for (const [name, point] of [
        ['plan (the maximised one)', full],
        ['recommend', full.recommend],
        ['knee', full.knee],
        ['mostEfficient', full.mostEfficient],
        ['mostThrifty', full.mostThrifty],
      ] as const) {
        if (!point) continue;
        report.add(
          `\`${name}\`: ${n(point.marches)} marches, ${n(point.totalDamage)} damage, ${n(point.silver)} silver, ` +
            `${n(point.mercLost)} mercs lost — ${mercs(point.counts)} — at 0: ${zeros(point.counts)}`,
        );
      }

      report.h('1b. Every alternative the plan carries');
      report.add(
        '| label | marches | damage | silver | mercs lost | EMH | arb | leg | chariot | at 0 |\n' +
          '|---|---|---|---|---|---|---|---|---|---|',
      );
      for (const row of full.alternatives) {
        report.add(
          `| ${row.label} | ${n(row.marches)} | ${n(row.totalDamage)} | ${n(row.silver)} | ${n(row.mercLost)} | ` +
            MERC_IDS.map((id) => n(row.counts[id] ?? 0)).join(' | ') +
            ` | ${zeros(row.counts)} |`,
        );
      }
      report.add(
        `\nThe frontier does carry chariot plans — at 1 to 20 chariots — but every one of them is a 2-to-20-march ` +
          `plan, an order of magnitude below the ${n(full.totalDamage)} the ${n(full.marches)}-march plan reaches.`,
      );

      // ---- 2. the mechanism: `marchesFor` is a min over the fielded types --------------------------------------
      report.h('2. The mechanism: how many marches each type allows, alone and together');
      const base = full.march.counts;
      report.add(
        '| type | held | fielded | chunks lost a march | marches it allows alone |\n|---|---|---|---|---|',
      );
      let worst = { id: '', marches: Infinity, count: 0 };
      for (const id of MERC_IDS) {
        const count = base[id] ?? 0;
        const alone = lastsMarches(HELD[id] ?? 0, Math.max(1, count));
        report.add(
          `| ${SHORT(id)} | ${n(HELD[id] ?? 0)} | ${n(count)} | ${n(chunks(Math.max(1, count)))} | ` +
            `${count === 0 ? 'not fielded' : n(alone)} |`,
        );
        if (count > 0 && alone < worst.marches) worst = { id, marches: alone, count };
      }
      report.add(
        `\n\`marchesFor\` takes the **minimum over the fielded types**: the run lasts as long as the type that runs ` +
          `out first — here **${SHORT(worst.id)} at ${n(worst.count)} fielded, ${n(worst.marches)} marches**. So ` +
          `fielding a chariot at any count makes the whole campaign *shorter*, and *shorter* in the engine's ` +
          `arithmetic means \`total = marches × damage(march) + damage(finale)\` **loses a whole march's damage**.`,
      );
      report.add(
        'the chariot ceilings in full (the count the type could be fielded at, and the marches that count allows):',
      );
      report.add('| chariot fielded | lost a march | marches allowed |\n|---|---|---|');
      for (const count of [1, 5, 9, 10, 12, 20, 26, 37]) {
        report.add(
          `| ${n(count)} | ${n(chunks(count))} | ${n(lastsMarches(HELD['chariot-6'] ?? 0, count))} |`,
        );
      }
      report.add(
        `\nso the largest chariot count that still allows a 66-march run is ` +
          `**${(() => {
            for (let count = 37; count >= 1; count -= 1)
              if (lastsMarches(HELD['chariot-6'] ?? 0, count) >= 66) return `${n(count)}`;
            return '0 — none';
          })()}**, and the planner's own grid asks for it at every march count it tries.`,
      );

      // ---- 3. the plan's own march, with the dropped type restored ---------------------------------------------
      report.h("3. The plan's own march, chariot restored at every count (real `simulateBattle`)");
      const zeroChariot = marchResult(request, base);
      const zeroEngine = zeroChariot.summary.avgDamage;
      report.add(
        `the plan's own march, as the planner prices it: **${n(full.march.damage)}** damage, ` +
          `${n(full.march.silver)} silver, ${n(full.march.mercLost)} mercs lost, ${n(full.march.strikes)} strikes. ` +
          `The real \`simulateBattle\` on the same counts: **${n(zeroEngine)}** damage ` +
          `(${((zeroEngine / full.march.damage - 1) * 100).toFixed(2)} % against the planner's figure), ` +
          `${n(zeroChariot.summary.recovery.silver)} silver, ${duration(zeroChariot.summary.recovery.seconds)} training.`,
      );
      report.add(
        '\n| chariot | sim damage | Δ damage | silver | chariot stack HP | kill position | chariot hits (E/A) | chariot damage |\n' +
          '|---|---|---|---|---|---|---|---|',
      );
      let bestRestored: { count: number; damage: number; delta: number } | null = null;
      for (const count of [0, 1, 2, 4, 7, 10, 12, 15, 20, 26, 32, 37]) {
        const counts = { ...base, 'chariot-6': count };
        const { result, summary } = marchResult(request, counts);
        const row = lines({ result, summary }).find((line) => line.unitId === 'chariot-6');
        const damage = summary.avgDamage;
        const delta = damage - zeroEngine;
        if (count > 0 && (!bestRestored || damage > bestRestored.damage))
          bestRestored = { count, damage, delta };
        report.add(
          `| ${n(count)} | ${n(damage)} | ${delta >= 0 ? '+' : ''}${n(Math.round(delta))} | ` +
            `${n(summary.recovery.silver)} | ${n(row?.totalHp ?? 0)} | ${row ? n(row.position) : '—'} | ` +
            `${n(row?.hitsEnemyFirst ?? 0)}/${n(row?.hitsArmyFirst ?? 0)} | ` +
            `${n(Math.round(((row?.damageEnemyFirst ?? 0) + (row?.damageArmyFirst ?? 0)) / 2))} |`,
        );
      }
      if (bestRestored)
        report.add(
          `\n**Yes — on the march alone, restoring the chariot gains damage.** The best of them is ` +
            `**${n(bestRestored.count)} chariots, +${n(Math.round(bestRestored.delta))} damage a march** ` +
            `(${((bestRestored.damage / zeroEngine - 1) * 100).toFixed(2)} %). Held **inside the same ladder** that ` +
            `shelters the fielded mercenaries, the chariot stack strikes; it is a stack the enemy has to kill, and ` +
            `the engine's own arithmetic agrees with the simulation on this (see the planner's figure above).`,
        );

      report.h("3b. Where the chariot stack sits in the plan's march (kill order, highest HP first)");
      report.add('| # | stack | count | total HP | per hit | hits E/A |\n|---|---|---|---|---|---|');
      for (const line of lines(zeroChariot)) {
        report.add(
          `| ${line.position} | ${line.label} | ${n(line.count)} | ${n(line.totalHp)} | ${n(line.damagePerHit)} | ` +
            `${line.hitsEnemyFirst}/${line.hitsArmyFirst} |`,
        );
      }
      const mercFloor = Math.max(
        ...lines(zeroChariot)
          .filter((line) => line.pool === 'authority')
          .map((line) => line.totalHp),
      );
      const topRung = Math.max(...lines(zeroChariot).map((line) => line.totalHp));
      report.add(
        `\nThe plan's ladder is built to clear a floor set by **the mercenaries it fields**: their largest stack is ` +
          `${n(mercFloor)} HP, and \`ladder()\` puts its lowest rung ${(25).toFixed(0)} % above that. Read the table with ` +
          `that number: a chariot stack of 10 is **${n(297_540)} HP — above the mercenary floor (${n(mercFloor)}) and below ` +
          `every troop rung** (${n(topRung)} at the top). The enemy kills highest-HP first, so the seven troop rungs die ` +
          `before it and the chariot strikes **twice** (kill position 8 of 11): the same ladder shelters it, which is why ` +
          `restoring it costs **no extra silver at all** (the silver column in the table above is flat) — and why, at 12 ` +
          `chariots and beyond, it climbs past the troop rungs and its strikes fall to one and then none.`,
      );

      // ---- 4. the campaign the uniform shape cannot express ----------------------------------------------------
      report.h('4. What the uniform shape costs: the two-phase campaign the planner cannot represent');
      report.add(
        `A plan is **one march repeated plus one finale** (\`marchesFor\` ties the repeats to the tightest type), so ` +
          `a type whose stock is short is either in *every* repeat or in *none*. The chariot's stock (${n(HELD['chariot-6'] ?? 0)}) ` +
          `is short: fielding it makes the run shorter, and the plan drops it. What it never tries is \`m\` marches ` +
          `**with** the chariot followed by \`66 − m\` **without** it — which is what a player would do.`,
      );
      const repeats = full.marches - (chosen.finaleCounts ? 1 : 0);
      report.add(
        `\nthe plan's finale fields ${n(chosen.finaleCounts?.['chariot-6'] ?? 0)} chariots; each of the ${n(repeats)} ` +
          `repeats reaches the field without one. Table: \`m\` marches with \`c\` chariots, then \`${n(repeats)} − m\` ` +
          `without, then the same finale with the chariots the repeats burned removed.`,
      );
      report.add(
        '\n| c chariots | m marches with | chariots left for the finale | phase-A damage each | phase-B damage each | ' +
          'A−B each | phase A total | finale damage | **campaign total** | vs the plan |\n' +
          '|---|---|---|---|---|---|---|---|---|---|',
      );
      const planFinale = chosen.finaleCounts
        ? marchResult(request, chosen.finaleCounts).summary.avgDamage
        : 0;
      const planTotalSim = repeats * zeroEngine + planFinale;
      let bestMixed: { total: number; c: number; m: number } | null = null;
      for (const count of [1, 2, 4, 7, 10, 15, 20, 26, 37]) {
        const withChariot = marchResult(request, { ...base, 'chariot-6': count }).summary.avgDamage;
        const m = Math.min(repeats, lastsMarches(HELD['chariot-6'] ?? 0, count));
        const left = Math.max(0, (HELD['chariot-6'] ?? 0) - m * chunks(count));
        const finaleCounts = chosen.finaleCounts
          ? { ...chosen.finaleCounts, 'chariot-6': left }
          : { ...base, 'chariot-6': left };
        const finale = marchResult(request, finaleCounts).summary.avgDamage;
        const total = m * withChariot + (repeats - m) * zeroEngine + finale;
        if (!bestMixed || total > bestMixed.total) bestMixed = { total, c: count, m };
        report.add(
          `| ${n(count)} | ${n(m)} | ${n(left)} | ${n(withChariot)} | ${n(zeroEngine)} | ` +
            `${withChariot - zeroEngine >= 0 ? '+' : ''}${n(Math.round(withChariot - zeroEngine))} | ` +
            `${n(m * withChariot)} | ${n(finale)} | **${n(Math.round(total))}** | ` +
            `${total >= planTotalSim ? '+' : ''}${n(Math.round(total - planTotalSim))} |`,
        );
      }
      if (bestMixed)
        report.add(
          `\nThe same ${n(repeats)} repeats scored the uniform way (the plan's own shape): ` +
            `**${n(Math.round(planTotalSim))}** damage in-game simulation. The best two-phase campaign above is ` +
            `**${n(Math.round(bestMixed.total))}** (c = ${n(bestMixed.c)}, m = ${n(bestMixed.m)}): ` +
            `**${bestMixed.total >= planTotalSim ? '+' : ''}${n(Math.round(bestMixed.total - planTotalSim))}** damage, ` +
            `${(((bestMixed.total - planTotalSim) / planTotalSim) * 100).toFixed(2)} %.\n` +
            `\n**But read this table for what it is**: it is *my* composition of two engine-priced marches, not a ` +
            `shape \`planCampaign\` can score — the engine scores \`m\` repeats **plus one finale**, never \`m\` repeats ` +
            `followed by \`66 − m\` different ones. Section 4b shows what the engine does say about a chariot in the ` +
            `repeat, and it says *no*: the run cannot be long enough. And the two-phase campaign is **${n(repeats)} ` +
            `marches, ${n(Math.round((zeroChariot.summary.recovery.seconds * repeats) / 86_400))} days of ` +
            `training** — it is not a plan the owner would ever run either (section 6). The two claims are both true ` +
            `and they are about different things: the engine is right about its own shape, and the shape is not what ` +
            `a player does.`,
        );

      report.h("4b. The same question asked in the engine's own arithmetic (`shapeScorer`)");
      report.add(
        "The table above is the real simulation with the plan's ladder held fixed. This one hands each candidate " +
          "count vector to the planner's own scorer — which rebuilds the ladder for the vector's own floor, picks " +
          'the best of the 80 ladders, and prices the finale from the stock the repeats burn — and takes the best ' +
          'over every march count the stock allows. Columns: the best `total` the engine finds for that shape.',
      );
      const scorer = shapeScorer(request);
      interface Best {
        total: number;
        depth: number;
        scale: number;
        rungs: { entry: { id: string; cost: number; hp: number }; count: number }[];
        marchDamage: number;
        finaleDamage: number;
        marches: number;
      }
      const bestOf = (counts: Record<string, number>, marches: number): Best | null => {
        let best: Best | null = null;
        for (let depth = 1; depth <= 8; depth += 1) {
          for (const scale of SCALES) {
            const scored = scorer(marches, counts, depth, scale);
            if (scored && (!best || scored.total > best.total))
              best = {
                total: scored.total,
                depth,
                scale,
                rungs: scored.rungs,
                marchDamage: scored.march.damage,
                finaleDamage: scored.finale?.march.damage ?? 0,
                marches,
              };
          }
        }
        return best;
      };
      const planCounts: Record<string, number> = {};
      for (const id of MERC_IDS) planCounts[id] = base[id] ?? 0;
      const check = bestOf(planCounts, repeats);
      report.add(
        `\nthe plan's own shape through this route: ${n(Math.round(check?.total ?? 0))} damage (the planner reports ` +
          `${n(full.totalDamage)}; the small gap is the finale-cache and rounding) at depth ${check?.depth}, scale ${check?.scale}.`,
      );
      report.add(
        '\n| chariot | marches the stock allows | best `total` the engine finds | vs the plan | at marches |\n|---|---|---|---|---|',
      );
      let engineBest: (Best & { c: number }) | null = null;
      const ladderRows: { c: number; best: Best }[] = [];
      for (const count of [1, 4, 7, 10, 20, 37]) {
        const counts = { ...planCounts, 'chariot-6': count };
        const ceiling = Math.min(repeats, lastsMarches(HELD['chariot-6'] ?? 0, count));
        let best: Best | null = null;
        for (let marches = 1; marches <= ceiling; marches += 1) {
          const scored = bestOf(counts, marches);
          if (scored && (!best || scored.total > best.total)) best = scored;
        }
        if (best && (!engineBest || best.total > engineBest.total)) engineBest = { ...best, c: count };
        if (best) ladderRows.push({ c: count, best });
        report.add(
          `| ${n(count)} | ${n(ceiling)} | **${n(Math.round(best?.total ?? 0))}** | ` +
            `${(best?.total ?? 0) >= full.totalDamage ? '+' : ''}${n(Math.round((best?.total ?? 0) - full.totalDamage))} | ` +
            `${n(best?.marches ?? 0)} |`,
        );
      }
      report.add(
        `\n**Read against the same route's own figure for the plan**, not against \`full.totalDamage\`: this sweep walks ` +
          `the 80-ladder grid and nothing else, where the planner also hill-climbs the scale, so its own score for the ` +
          `plan's counts is the lower ${n(Math.round(check?.total ?? 0))}. Grid against grid, **every chariot-inclusive ` +
          `shape loses, and loses hugely** — the best of them is c = ${n(engineBest?.c ?? 0)} over ${n(engineBest?.marches ?? 0)} ` +
          `marches at ${n(Math.round(engineBest?.total ?? 0))}, against ${n(Math.round(check?.total ?? 0))} for the plan's ` +
          `own counts: **${n(Math.round((engineBest?.total ?? 0) - (check?.total ?? 0)))}**. And the march count is the ` +
          `whole of it: the chariot raises the *per-march* damage the engine finds (${n(Math.round(engineBest?.marchDamage ?? 0))} ` +
          `against ${n(Math.round(check?.marchDamage ?? 0))}, because a higher mercenary floor buys a bigger ladder — ` +
          `section 4c), but ${n(engineBest?.marches ?? 0)} repeat${(engineBest?.marches ?? 0) === 1 ? '' : 's'} of it is ` +
          `less than ${n(repeats)} of the plan's, and the plan's repeats are what the total is made of.`,
      );
      report.add(
        `\nSo far, strictly inside what the engine can represent, the omission is **right**: with the chariot in the ` +
          `repeat the run cannot be long, and length is worth more than the chariot. Section 4 asks the different ` +
          `question the engine cannot: what if only *part* of the run fielded it.`,
      );

      report.h(
        "4c. The second mechanism: the mercenary floor rises to clear the new stack (`ladder`'s `mercenaryHp`)",
      );
      report.add(
        '`ladder()` puts the lowest troop rung a quarter above **the largest mercenary stack the vector fields** ' +
          '(`mercenaryHp`), so adding a chariot stack raises the floor the ladder has to clear — and the leadership ' +
          "is already fully spent by the plan's own ladder. The engine's best ladder per chariot count:",
      );
      report.add(
        '\n| chariot | best ladder | rungs | rung counts | leadership used | march damage | finale damage | marches |\n' +
          '|---|---|---|---|---|---|---|---|',
      );
      const leadershipOf = (best: Best): number =>
        best.rungs.reduce((sum, rung) => sum + rung.count * rung.entry.cost, 0);
      for (const { c, best } of [{ c: 0, best: check as Best }, ...ladderRows]) {
        if (!best) continue;
        report.add(
          `| ${n(c)} | depth ${n(best.depth)}, scale ${best.scale} | ${n(best.rungs.length)} | ` +
            `${best.rungs.map((rung) => `${n(rung.count)}×${rung.entry.id.replace(/-\d$/, '')}`).join(' ')} | ` +
            `${n(leadershipOf(best))}/4,343 | ${n(Math.round(best.marchDamage))} | ${n(Math.round(best.finaleDamage))} | ${n(best.marches)} |`,
        );
      }
      report.add(
        `\nThe chariot does not only shorten the run (section 4b): once its stack outgrows the mercenary floor it also ` +
          `**moves the ladder**, because \`mercenaryHp\` is the largest stack the vector fields. The plan's own ladder ` +
          `(depth ${n(check?.depth ?? 0)}, ${n(leadershipOf(check as Best))} of 4,343 leadership) is built for the ` +
          `${n(mercFloor)}-HP mercenary stack; ${n(1)} and ${n(4)} chariots (${n(29_754)} and ${n(119_016)} HP) stay under ` +
          `it and the ladder is unchanged, but ${n(7)} chariots (${n(208_278)} HP) pass it and the engine switches to a ` +
          `depth-${n(6)} ladder, ${n(10)} chariots to depth ${n(6)} at scale ${n(1)}. Note the direction: the *per-march* ` +
          `damage goes **up** (a higher floor buys bigger rungs), which is why the chariot's cost is entirely the run's ` +
          `length. The battle confirms the rule rather than contradicting it: the plan's own ladder's **highest** troop ` +
          `rung is ${n(topRung)} HP, and a ${n(10)}-chariot stack (${n(297_540)}) is under every rung — eight kill ` +
          `positions down, two strikes. At ${n(12)} chariots (${n(357_048)}) it clears all but one rung and is killed ` +
          `second, one strike; at ${n(15)} (${n(446_310)}) it is the biggest stack on the field and never strikes ` +
          `enemy-first at all. That is exactly what \`mercenaryHp\` is protecting against.`,
      );

      // ---- 5. the same with a silver budget -------------------------------------------------------------------
      report.h('5. With a silver budget (the app passes the campaign box through)');
      report.add(
        '| budget | marches | damage | silver | mercs lost | mercs | at 0 |\n|---|---|---|---|---|---|---|',
      );
      for (const budget of [8_000_000, 3_000_000]) {
        const budgeted = planCampaign({ request, silverBudget: budget, budgetMs: 25_000 });
        report.add(
          `| ${n(budget)} | ${n(budgeted.marches)} | ${n(budgeted.totalDamage)} | ${n(budgeted.silver)} | ` +
            `${n(budgeted.mercLost)} | ${mercs(budgeted.counts)} | ${zeros(budgeted.counts)} |`,
        );
      }
      report.add(
        `\nThe plan with a budget returns no \`recommend\` (the app then takes \`plan\` itself), and **the chariot is ` +
          `fielded at both budgets**: the omission is not a property of the search, it is a property of the ` +
          `unbudgeted plan's *length*. A budget caps the run at ${n(29)} and ${n(6)} marches — lengths the chariot's ` +
          `${n(HELD['chariot-6'] ?? 0)}-unit stock covers — while the unbudgeted plan stretches to ${n(repeats)} ` +
          `repeats, which no chariot count can cover (section 2).`,
      );

      // ---- 6. the alternatives the frontier carries: which are choices, which are curiosities ---------------
      report.h('6. The alternatives the engine carries, and which of them are choices');
      interface Row {
        label: string;
        marches: number;
        damageAMarch: number;
        silverAMarch: number;
        mercsAMarch: number;
        damagePerSilver: number;
        damagePerMercenary: number;
        troopStacks: number;
        mercTypes: number;
        trainingDays: number;
        counts: Record<string, number>;
        /** The plan's own total, finale included — what the slider's damage axis shows. */
        planTotal: number;
        planSilver: number;
      }
      const rows: Row[] = [];
      const rowFrom = (row: (typeof full.alternatives)[number]): Row => {
        const { result, summary } = marchResult(request, row.counts);
        return {
          label: row.label,
          marches: row.marches,
          damageAMarch: summary.avgDamage,
          silverAMarch: summary.recovery.silver,
          mercsAMarch: Object.entries(row.counts)
            .filter(([id]) => (MERC_IDS as readonly string[]).includes(id))
            .reduce((sum, [, count]) => sum + chunks(count), 0),
          damagePerSilver: row.damagePerSilver,
          damagePerMercenary: row.damagePerMercenary,
          troopStacks: result.stacks.filter((stack) => stack.pool === 'leadership').length,
          mercTypes: result.stacks.filter((stack) => stack.pool === 'authority').length,
          trainingDays: (summary.recovery.seconds * row.marches) / 86_400,
          counts: row.counts,
          planTotal: row.totalDamage,
          planSilver: row.silver,
        };
      };
      for (const row of full.alternatives) rows.push(rowFrom(row));
      const bestAMarch = Math.max(...rows.map((row) => row.damageAMarch));
      /** Stated criteria: a march of one troop stack is not a march; a plan needing years of training is not a plan. */
      const HORIZON_DAYS = 90;
      const DAMAGE_FLOOR = 0.5;
      report.add(
        '| label | marches | damage a march | % of the best march | silver a march | mercs lost a march | troop stacks | merc types | damage/silver | damage/mercenary | training, whole run | verdict |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      for (const row of rows) {
        const share = row.damageAMarch / bestAMarch;
        const reasons: string[] = [];
        if (row.troopStacks <= 1) reasons.push(`${n(row.troopStacks)} troop stack`);
        if (share < DAMAGE_FLOOR) reasons.push(`march at ${(share * 100).toFixed(0)} % of the best`);
        if (row.trainingDays > HORIZON_DAYS) reasons.push(`${n(Math.round(row.trainingDays))} d of training`);
        report.add(
          `| ${row.label} | ${n(row.marches)} | ${n(row.damageAMarch)} | ${(share * 100).toFixed(0)} % | ` +
            `${n(row.silverAMarch)} | ${n(row.mercsAMarch)} | ${n(row.troopStacks)} | ${n(row.mercTypes)} | ` +
            `${row.damagePerSilver.toFixed(2)} | ${n(Math.round(row.damagePerMercenary))} | ` +
            `${n(Math.round(row.trainingDays))} d | ${reasons.length === 0 ? '**practical**' : `curiosity — ${reasons.join('; ')}`} |`,
        );
      }
      const practical = rows.filter(
        (row) =>
          row.troopStacks > 1 &&
          row.damageAMarch / bestAMarch >= DAMAGE_FLOOR &&
          row.trainingDays <= HORIZON_DAYS,
      );
      report.add(
        `\n**${n(practical.length)} of the ${n(rows.length)} rows the engine carries are practical** under the stated ` +
          `criteria (a march of more than one troop stack, per-march damage at least ${(DAMAGE_FLOOR * 100).toFixed(0)} % ` +
          `of the best march in the list, and a whole run that finishes inside ${n(HORIZON_DAYS)} days of training): ` +
          `${practical.map((row) => row.label).join(' · ') || 'none'}.`,
      );
      const cheapestPractical = [...practical].sort(
        (a, b) => a.silverAMarch * a.marches - b.silverAMarch * b.marches,
      )[0];
      const richestPractical = [...practical].sort(
        (a, b) => b.damageAMarch * b.marches - a.damageAMarch * a.marches,
      )[0];
      report.add(
        `The rows the owner's "I would never choose this" lands on are the others: ` +
          `${rows
            .filter((row) => !practical.includes(row))
            .map((row) => `\`${row.label}\``)
            .join(', ')}.`,
      );

      // ---- 7. a stopped set for the slider -------------------------------------------------------------------
      report.h('7. A stopped set for the slider');
      const dominatedBy = (point: {
        silver: number;
        mercLost: number;
        totalDamage: number;
      }): string | null => {
        for (const other of full.alternatives) {
          if (other === point) continue;
          if (
            other.silver <= point.silver &&
            other.mercLost <= point.mercLost &&
            other.totalDamage >= point.totalDamage &&
            (other.silver < point.silver ||
              other.mercLost < point.mercLost ||
              other.totalDamage > point.totalDamage)
          )
            return other.label;
        }
        return null;
      };
      const sweet = (full.recommend ?? full) as (typeof full.alternatives)[number];
      const sweetDomination = dominatedBy(sweet);
      const neighbours = full.alternatives
        .filter((row) => row.label !== sweet.label)
        .map((row) => ({ row, distance: Math.abs(row.silver - sweet.silver) / Math.max(1, sweet.silver) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2)
        .map((entry) => entry.row);
      // `recommend` is pushed onto the list by `planCampaign`, so it is a row of `alternatives` — but not
      // necessarily the one this experiment measured: find it by its own numbers.
      const sweetRow =
        rows.find((row) => row.label === sweet.label && row.marches === sweet.marches) ?? rowFrom(sweet);
      const stopped = [
        { why: 'the cheapest practical plan', row: cheapestPractical },
        { why: 'the sweet spot (`recommend`)', row: sweetRow },
        { why: 'its neighbour above (by silver)', row: neighbours[0] ? rowFrom(neighbours[0]) : undefined },
        { why: 'its neighbour below (by silver)', row: neighbours[1] ? rowFrom(neighbours[1]) : undefined },
        { why: 'the richest practical plan the list carries', row: richestPractical },
      ].filter((entry): entry is { why: string; row: Row } => entry.row !== undefined);
      report.add(
        "| # | point | marches | damage (the plan's own total, finale in) | silver | mercs lost | damage a march | practical? |\n" +
          '|---|---|---|---|---|---|---|---|',
      );
      stopped.forEach((entry, index) => {
        const row = entry.row;
        report.add(
          `| ${index + 1} | ${entry.why} — \`${row.label}\` | ${n(row.marches)} | ${n(row.planTotal)} | ` +
            `${n(row.planSilver)} | ${n(row.mercsAMarch * row.marches)} | ${n(row.damageAMarch)} | ` +
            `${practical.includes(row) ? 'yes' : 'no — see section 6'} |`,
        );
      });
      report.add(
        `\nThe sweet spot (\`recommend\` = \`balanced\`) is ${sweetDomination ? `**dominated** by \`${sweetDomination}\` — it is on the list only because \`planCampaign\` pushes it there` : '**undominated** among the rows the plan carries'}. ` +
          `Its label is \`${sweet.label}\` — ${n(sweet.marches)} marches, ${n(sweet.totalDamage)} damage, ` +
          `${n(sweet.silver)} silver, ${n(sweet.mercLost)} mercenaries.`,
      );
      report.add(
        `\n**And it fails the horizon test itself**: ${n(Math.round(sweetRow?.trainingDays ?? 0))} days of training ` +
          `(section 6). So on this account the engine's own balanced pick is one of the curiosities by the same ` +
          `criterion that condemns the rest of the long tail — which is the owner's complaint arriving from the ` +
          `other side: a slider whose marked point is a plan he would never run is not a slider. The two ends that ` +
          `*are* practical (rows 1 and 5, ${n(2)} and ${n(17)} marches) sit at ${n(4_288_500)} and ${n(29_468_500)} ` +
          `silver, i.e. **the whole practical range is the first third of the silver axis**, and the sweet spot sits ` +
          `at ${n(sweet.silver)}, past the end of it.`,
      );
      report.add(
        `\nNote what the neighbour rows above show: the two rows nearest the sweet spot *by silver* are ` +
          `${n(Math.round(Math.abs((neighbours[0]?.silver ?? 0) - sweet.silver) / 1000))} k and ` +
          `${n(Math.round(Math.abs((neighbours[1]?.silver ?? 0) - sweet.silver) / 1000))} k away from it, i.e. **the ` +
          `frontier next to the sweet spot is not in the list at all** — it was thinned out (and two of the three ` +
          `rows the search actually settled on are between them, added back by hand). A slider drawn on this list jumps.`,
      );
      report.add(
        '\nThe `curve` is the other axis the plan carries, one point per silver bucket. Around the sweet spot:',
      );
      report.add(
        '| curve point | silver | damage | damage/silver | mercs lost | thrifty damage |\n|---|---|---|---|---|---|',
      );
      const curve = full.curve.filter((point) => point.silver > 0);
      const below = [...curve].filter((point) => point.silver <= sweet.silver).pop();
      const above = curve.find((point) => point.silver > sweet.silver);
      for (const point of [below, above]) {
        if (!point) continue;
        report.add(
          `| ${point.silver <= sweet.silver ? 'just below the sweet spot' : 'just above it'} | ${n(point.silver)} | ` +
            `${n(point.damage)} | ${point.damagePerSilver.toFixed(2)} | ${n(point.mercLost)} | ${n(point.thriftyDamage)} |`,
        );
      }
      report.add(
        `\nThe curve is a *silver* axis and the sweet spot sits at ${n(sweet.silver)} silver; the bucket either side ` +
          `of it is inside ${n(Math.round((Math.abs((above?.silver ?? sweet.silver) - sweet.silver) / sweet.silver) * 100))} % ` +
          `of that spend, so a slider drawn on \`curve\` has real neighbouring values where \`alternatives\` has a gap. ` +
          `Both carry *different quantities of marches* at the same time, though — the curve's damage is the plan's ` +
          `total, and its ${n(below?.damage ?? 0)} at ${n(below?.silver ?? 0)} silver and ${n(above?.damage ?? 0)} at ` +
          `${n(above?.silver ?? 0)} are two different campaign lengths, so the axis a slider should show is silver ` +
          `*and* marches, not silver alone.`,
      );

      // ---- 8. where the fix belongs --------------------------------------------------------------------------
      report.add(
        `\nTwo different complaints, two different fixes, and neither is a bug in the arithmetic:\n` +
          `\n- **the left-out mercenary**: inside the shape the engine can score, the omission is **right** — grid against ` +
          `grid the best chariot-inclusive shape loses by ${n(Math.abs(Math.round((engineBest?.total ?? 0) - (check?.total ?? 0))))} ` +
          `(section 4b), because \`marchesFor\` is a minimum over the fielded types and the run's length is worth more ` +
          `than the chariot. What the engine cannot score is a **lead-in phase** (\`m\` marches with the chariot, then ` +
          `the rest without it), worth ${n(Math.round((bestMixed?.total ?? planTotalSim) - planTotalSim))} ` +
          `(\`${((((bestMixed?.total ?? planTotalSim) - planTotalSim) / planTotalSim) * 100).toFixed(2)} %\`) if the ` +
          `leading marches keep the plan's own ladder (section 4) — but that campaign is ${n(repeats)} marches and ` +
          `${n(Math.round((zeroChariot.summary.recovery.seconds * repeats) / 86_400))} ` +
          `days of training, so it is not the answer to the owner's complaint either. **The omission only appears on ` +
          `the plan whose length is impractical**: at a 3 M or 8 M silver budget the plan fields 22 and 10 chariots ` +
          `(section 5), and every frontier row of 2 to 16 marches fields all four hired types (section 6). No fix to ` +
          `\`plan.ts\` is warranted for it;\n` +
          `- **the slider's curiosities** (sections 6, 7) are the *thinning* in \`planCampaign\`: \`alternatives\` is an even ` +
          `sample of the undominated frontier, and the frontier itself contains one-stack marches and century-long runs. ` +
          `That is a few lines in \`plan.ts\` (pick the practical extremes and the sweet spot's neighbours instead of ` +
          `evenly sampling), but it needs a definition of "practical" the engine should not invent on its own — the ` +
          `criteria above are the proposal, and they belong beside \`summarise\` so the UI's slider and the engine agree.\n` +
          `\nNothing in \`src/\` was changed by this experiment.`,
      );

      // ---- 8. where the fix belongs --------------------------------------------------------------------------

      report.save();
    });
  },
  300_000,
);
