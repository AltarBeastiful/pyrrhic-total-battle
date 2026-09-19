/**
 * 111 — **the top of the bar, and the all-in that is dropped instead of re-sized** (the two regressions
 * S-94 disclosed and left open: *"on the Aydae-alone camp at 4 975 this bar is worse like for like … the
 * search stops reaching the 17-burn family … a follow-up owns it"*).
 *
 * S-94 moved the plan onto the **worst opening** — the enemy-first journal, the bad side of the game's coin
 * — and two things went with it.
 *
 *  - **§A/§B, the coverage.** A march ranked on the bad flip wants *many* stacks carrying the damage, so the
 *    search's winner became a **deep** ladder over every troop type the account holds. A deep ladder has the
 *    **lowest floor** of any shape the leadership can pay for, and the floor is what shelters the hired
 *    stacks (S-87) — so the winner is also the shape that fields the **fewest** of them. And the burn sweep
 *    walks **down** from the winner's own burn (`plan.ts`, "every burn level between the ends gets a rung"),
 *    which makes the winner's burn the ceiling of the whole bar. The winner went thrifty and took the bar's
 *    top with it: on the owner's own *"Aydae alone"* camp the burn ladder tops out at **7** chunks and
 *    3 387 893 a march while the sizer's own sheltered marches over 7, 6, 5, 4 and 3 of that camp's troop
 *    types stand at **10, 12, 13, 18 and 26** chunks for up to 5 366 544.
 *  - **§C, the all-in.** S-94 added one rule: the stop is dropped when another burns strictly less and is
 *    behind it on neither damage nor silver. The validator's objection is that dropping is the wrong answer
 *    to a stop that is *badly shaped* — it exists to field the most hired the troops shelter, so the honest
 *    fix is to re-size it at its own hired counts and drop it only if nothing at that burn clears the rung
 *    beside it.
 *
 * **§D** times the two engines back to back on the same fifteen armies.
 *
 * **How the two bars are measured.** The engine has one search, not a flag, so this file is run **twice** —
 * once on each engine — and each run writes its own sidecar beside this report. It detects which engine it
 * is on the way a caller would: S-97 threads a **prefix** through `ShapeScorer` (the sizer over the
 * strongest *k* troop types, scored as a shape rather than tightened into one afterwards), so the scorer
 * `shapeScorer` hands back takes six arguments on the new engine and five on the old. With both sidecars on
 * disk the report is the comparison; with one, it says so and prints that half.
 *
 * The rivals are re-measured by each run and are the same either way: they are `sizeStacks` and the shelter
 * alone (`shelterUnder`'s rule, restated here), never the plan's search, so they are an independent
 * yardstick rather than a second reading of the same code. Two families of them:
 *
 *  - **whole-stock** — every hired type at the account's own cap. What the `all-in` is about: a march the
 *    player can send once.
 *  - **anchored** — every hired type at the largest count that lasts the campaign (`lastsMarches`, a chunk
 *    of ten lost a march). What a **rung** of the bar is about, because a rung is repeated.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/111-coverage-and-all-in.test.ts`
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { effectiveTable, lastsMarches, rankTroops, shapeScorer } from '../../src/engine/plan';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import { buildStackRequest } from '../../src/state/derive';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { OUT_DIR, Report, n } from './harness';

type Stage = 'before' | 'after';
const sidecar = (stage: Stage): URL => new URL(`111-coverage-and-all-in-${stage}.json`, OUT_DIR);

// ---- the armies ----------------------------------------------------------------------------------------

/**
 * The two camps the benchmark's scenario list does not carry — the owner's live camp of 2026-09-18 and his
 * camp of 2026-09-19 at both readings — built exactly as `tests/engine/plan-criteria.test.ts` builds them,
 * so the fifteen armies here are the fifteen the criteria are held on.
 */
function extraCamps(): { label: string; request: StackRequest }[] {
  const owner = ownerProfile();
  if (!owner) return [];
  const captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  const at = (
    label: string,
    hired: { id: string; cap: number | null }[],
    leadership: number,
    authority: number,
  ): { label: string; request: StackRequest }[] => {
    const camp = structuredClone(owner);
    camp.sources.captains = [...captains];
    camp.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
    camp.mercenaries.selected = hired;
    const setup = camp.setups[0];
    if (!setup) return [];
    return [
      {
        label,
        request: buildStackRequest(camp, {
          ...setup,
          active: { ...setup.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
          housing: { ...setup.housing, leadership, authority },
        }),
      },
    ];
  };
  return [
    ...at(
      'the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)',
      [
        { id: 'arbalester-6', cap: 485 },
        { id: 'legionary-6', cap: 1002 },
        { id: 'bear-5', cap: null },
      ],
      4_975,
      2_180,
    ),
    ...at(
      'his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)',
      [{ id: 'epic-monster-hunter-6', cap: 450 }],
      4_975,
      2_180,
    ),
    ...at(
      'his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)',
      [{ id: 'epic-monster-hunter-6', cap: 120 }],
      5_100,
      2_200,
    ),
  ];
}

function armies(): { label: string; request: StackRequest }[] {
  const profile = ownerProfile();
  return [
    ...commonScenarios().map((one) => ({ label: one.label, request: one.request })),
    ...(profile ? ownerScenarios(profile).map((one) => ({ label: one.label, request: one.request })) : []),
    ...extraCamps(),
  ];
}

// ---- the yardstick -------------------------------------------------------------------------------------

interface Rival {
  what: string;
  burn: number;
  hired: number;
  damage: number;
  silver: number;
  seconds: number;
  repeats: number;
}

/** The largest count of a stock of `held` that still fields on each of `marches` marches. */
function anchor(held: number, marches: number): number {
  for (let count = held; count >= 1; count -= 1) if (lastsMarches(held, count) >= marches) return count;
  return 0;
}

/**
 * The sizer's sheltered marches over every prefix of the troop ranking and every method — the family the
 * owner builds by hand ("Troops first", then the low tiers put back). `repeats` caps every hired type at the
 * largest count that lasts that many marches; 0 leaves the account's own stock.
 */
function rivals(request: StackRequest, repeats = 0): Rival[] {
  const table = effectiveTable(request);
  const ranked = rankTroops(table);
  const hiredIds = request.units.filter((unit) => unit.pool !== 'leadership').map((unit) => unit.id);
  const hp = new Map(table.map((entry) => [entry.id, entry.hp] as const));
  const caps: Record<string, number> = { ...request.caps };
  if (repeats > 0) {
    for (const id of hiredIds) {
      const held = request.caps[id];
      if (held !== undefined) caps[id] = anchor(held, repeats);
    }
  }
  const out: Rival[] = [];
  const seen = new Set<string>();
  for (let depth = 1; depth <= ranked.length; depth += 1) {
    const chosen = new Set(ranked.slice(-depth).map((entry) => entry.id));
    for (const method of ['elite', 'ms', 'msRelaxed'] as const) {
      const sized = sizeStacks({
        ...request,
        caps,
        units: request.units.filter((unit) => chosen.has(unit.id) || unit.pool !== 'leadership'),
        options: {
          ...request.options,
          method: method === 'msRelaxed' ? 'ms' : method,
          relaxedPreservation: method === 'msRelaxed',
        },
      });
      const counts: Record<string, number> = {};
      for (const stack of sized.stacks) if (stack.count > 0) counts[stack.unitId] = stack.count;
      const troopHp = Object.entries(counts)
        .filter(([id]) => !hiredIds.includes(id))
        .map(([id, count]) => count * (hp.get(id) ?? 0));
      // More than one troop stack: the band's own third criterion, and the shelter needs a floor.
      if (troopHp.length < 2) continue;
      const floor = Math.min(...troopHp);
      for (const id of hiredIds) {
        const unitHp = hp.get(id) ?? 0;
        if (unitHp <= 0) continue;
        const most = Math.max(0, Math.ceil(floor / unitHp) - 1);
        if ((counts[id] ?? 0) > most) counts[id] = most;
      }
      // S-58 B: a march the bar could offer fields a little of everything the account holds.
      if (!hiredIds.every((id) => (counts[id] ?? 0) > 0)) continue;
      const key = Object.entries(counts)
        .filter(([, count]) => count > 0)
        .sort()
        .map(([id, count]) => `${id}:${String(count)}`)
        .join(',');
      if (seen.has(key)) continue;
      seen.add(key);
      const { summary } = planMarch(request, counts);
      out.push({
        what: `the sizer over ${String(depth)} troop types (${method})`,
        burn: hiredIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0),
        hired: hiredIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0),
        damage: summary.minDamage,
        silver: summary.recovery.silver,
        seconds: summary.recovery.seconds,
        repeats: Math.min(
          ...hiredIds.map((id) => {
            const held = request.caps[id];
            return held === undefined ? Infinity : lastsMarches(held, counts[id] ?? 0);
          }),
        ),
      });
    }
  }
  return out.sort((a, b) => a.burn - b.burn);
}

// ---- what a run records --------------------------------------------------------------------------------

interface Stop {
  pick: string;
  burn: number;
  hired: number;
  repDamage: number;
  repSilver: number;
  damage: number;
  silver: number;
  mercLost: number;
  marches: number;
  shape: string;
}
interface Measured {
  label: string;
  ms: number;
  refused?: string;
  stops: Stop[];
  /** One plan a level of hired units burned, over the plans the bar may offer: the burn ladder as drawn. */
  band: [number, number][];
  rivals: Rival[];
  anchored: Rival[];
}

const hiredOf = (request: StackRequest, counts: Record<string, number>): number => {
  const ids = new Set(request.units.filter((unit) => unit.pool !== 'leadership').map((unit) => unit.id));
  return Object.entries(counts).reduce((sum, [id, count]) => sum + (ids.has(id) ? count : 0), 0);
};

function measure(label: string, request: StackRequest): Measured {
  const started = Date.now();
  let plan: CampaignPlan | null = null;
  let refused: string | undefined;
  try {
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
      withFrontier: true,
    });
  } catch (error) {
    refused = error instanceof Error ? error.message : String(error);
  }
  const ms = Date.now() - started;
  const levels = new Map<number, number>();
  for (const row of plan?.frontier ?? []) {
    if (!row.inBand || !row.undominated) continue;
    levels.set(row.repeat.mercLost, Math.max(levels.get(row.repeat.mercLost) ?? 0, row.repeat.damage));
  }
  return {
    label,
    ms,
    ...(refused === undefined ? {} : { refused }),
    stops: (plan?.alternatives ?? []).map((row: PlanTotals & { pick: string }) => ({
      pick: row.pick,
      burn: row.repeat.mercLost,
      hired: hiredOf(request, row.counts),
      repDamage: row.repeat.damage,
      repSilver: row.repeat.silver,
      damage: row.totalDamage,
      silver: row.silver,
      mercLost: row.mercLost,
      marches: row.marches,
      shape: row.shape,
    })),
    band: [...levels.entries()].sort((a, b) => a[0] - b[0]),
    rivals: rivals(request),
    anchored: rivals(request, HORIZON - 1),
  };
}

// ---- the report ----------------------------------------------------------------------------------------

const rungsOf = (one: Measured): Stop[] => one.stops.filter((stop) => stop.pick !== 'all-in');
const topRung = (one: Measured): Stop | undefined =>
  rungsOf(one).reduce<Stop | undefined>(
    (held, stop) => (held === undefined || stop.burn > held.burn ? stop : held),
    undefined,
  );
/** The anchored marches that burn more than the bar's top rung and hit harder: the coverage the bar is short of. */
const uncovered = (one: Measured): Rival[] => {
  const top = topRung(one);
  if (!top) return [];
  return one.anchored.filter(
    (rival) => rival.repeats >= HORIZON - 1 && rival.burn > top.burn && rival.damage > top.repDamage,
  );
};

describe.skipIf(!process.env.THEORY)('111 — the top of the bar, and the all-in', () => {
  it('measures the coverage and the all-in on every army', () => {
    // Six arguments means the scorer takes a **prefix** (S-97), five means it does not: that is the whole
    // difference between the two engines, said in the one place a caller can see it.
    const probe = armies()[0];
    if (!probe) throw new Error('no army');
    const stage: Stage = shapeScorer(probe.request).length >= 6 ? 'after' : 'before';
    const measured = armies().map((army) => measure(army.label, army.request));
    writeFileSync(sidecar(stage), `${JSON.stringify(measured, null, 1)}\n`);

    const other: Stage = stage === 'after' ? 'before' : 'after';
    const held = existsSync(sidecar(other))
      ? (JSON.parse(readFileSync(sidecar(other), 'utf8')) as Measured[])
      : null;
    const before = stage === 'before' ? measured : held;
    const after = stage === 'after' ? measured : held;

    const report = new Report('111-coverage-and-all-in');
    report.add(
      '# 111 — the top of the bar, and the all-in that is dropped instead of re-sized\n\n' +
        'Two regressions S-94 left open, measured on the fifteen armies `tests/engine/plan-criteria.test.ts` ' +
        'holds its criteria on. **Before** is HEAD `7b5e02e` (S-96); **after** is S-97. Every damage is the ' +
        'worst opening on both engines — the reading is not what changed. The rivals are `sizeStacks` and ' +
        'the shelter alone, never the plan’s search.',
    );
    if (!before || !after) {
      report.add(
        `\n_Only the **${stage}** sidecar is on disk; run this file on both engines for the comparison._`,
      );
    }

    // ---- §A — the camp the regression was found on ------------------------------------------------------
    report.h('§A — “Aydae alone, 4 975”: the bar, and what the camp can field');
    const isAydae = (one: Measured): boolean => one.label.startsWith('Aydae alone');
    const aydaeAfter = after?.find(isAydae);
    const aydaeBefore = before?.find(isAydae);
    report.add(
      'The owner’s export with **one** captain enlisted (Aydae 43 ★3), the two top guardsman tiers clicked ' +
        'out, his live hired stock (hunters 83 · legionaries unlimited · chariots 10 · arbalesters 60), ' +
        '4 975 leadership against 2 180 authority — experiment 103’s camp, and the one army S-94 disclosed ' +
        'as a like-for-like loss.',
    );
    for (const [what, one] of [
      ['before', aydaeBefore],
      ['after', aydaeAfter],
    ] as const) {
      if (!one) continue;
      report.add(`\n**The bar, ${what}** (${n(one.ms)} ms):\n`);
      report.add(
        '| stop | burned | hired | damage a march | silver a march | campaign | campaign silver | burned |',
      );
      report.add('|---|--:|--:|--:|--:|--:|--:|--:|');
      for (const stop of one.stops) {
        report.add(
          `| ${stop.pick} | ${String(stop.burn)} | ${String(stop.hired)} | ${n(stop.repDamage)} | ` +
            `${n(stop.repSilver)} | ${n(stop.damage)} | ${n(stop.silver)} | ${String(stop.mercLost)} |`,
        );
      }
      report.add(
        `\nThe burn levels the bar may offer: ${one.band.map(([burn, damage]) => `**${String(burn)}** ${n(damage)}`).join(' · ')}`,
      );
    }
    const aydae = aydaeAfter ?? aydaeBefore;
    if (aydae) {
      report.add(
        '\n**What the camp can field by hand** — the sizer over each prefix of its troop ranking, every ' +
          'hired stack lowered under the lowest troop stack. Two readings of the same family: at the ' +
          'account’s whole stock (a march it can send **once**) and anchored at the counts that last the ' +
          'three repeats a rung plays.\n',
      );
      report.add(
        '| shape | burned | hired | damage | silver | repeats | anchored burned | anchored damage |',
      );
      report.add('|---|--:|--:|--:|--:|--:|--:|--:|');
      for (const rival of aydae.rivals) {
        const twin = aydae.anchored.find((one) => one.what === rival.what);
        report.add(
          `| ${rival.what} | ${String(rival.burn)} | ${String(rival.hired)} | ${n(rival.damage)} | ` +
            `${n(rival.silver)} | ${Number.isFinite(rival.repeats) ? String(rival.repeats) : '∞'} | ` +
            `${twin ? String(twin.burn) : '—'} | ${twin ? n(twin.damage) : '—'} |`,
        );
      }
    }

    // ---- §B — the coverage on every army ----------------------------------------------------------------
    report.h('§B — the burn levels the bar reaches, and what stands above its top rung');
    report.add(
      'The bar’s dearest **rung** (the `steady-max`; the `all-in` is a sequence, not a rung of the ladder), ' +
        'and the anchored sheltered marches that burn more than it and hit harder — the offers the bar does ' +
        'not carry.\n',
    );
    report.add('| army | top rung before | top rung after | above it, before | above it, after |');
    report.add('|---|---|---|---|---|');
    for (let index = 0; index < (after ?? before ?? []).length; index += 1) {
      const a = after?.[index];
      const b = before?.[index];
      const one = a ?? b;
      if (!one) continue;
      const say = (measured: Measured | undefined): string => {
        if (!measured) return '—';
        const top = topRung(measured);
        return top ? `${String(top.burn)} · ${n(top.repDamage)}` : 'refused';
      };
      const above = (measured: Measured | undefined): string => {
        if (!measured) return '—';
        const list = uncovered(measured);
        return list.length === 0
          ? '—'
          : list.map((rival) => `${String(rival.burn)} · ${n(rival.damage)}`).join(', ');
      };
      report.add(`| ${one.label} | ${say(b)} | ${say(a)} | ${above(b)} | ${above(a)} |`);
    }
    report.add(
      '\nThe burn levels each bar may offer, army by army — the ladder’s own reach, before → after:\n',
    );
    for (let index = 0; index < (after ?? before ?? []).length; index += 1) {
      const a = after?.[index];
      const b = before?.[index];
      const one = a ?? b;
      if (!one) continue;
      const levels = (measured: Measured | undefined): string =>
        measured ? measured.band.map(([burn]) => String(burn)).join(' · ') : '—';
      report.add(`- **${one.label}** — ${levels(b)} → ${levels(a)}`);
    }

    // ---- §C — the all-in --------------------------------------------------------------------------------
    report.h('§C — the all-in: offered, dropped, re-sized');
    report.add(
      'The stop is on the bar because its first march **fields** more hired units than the steady max’s ' +
        'repeat, and S-94 drops it when a thriftier stop is behind it on neither damage nor silver. What a ' +
        'bar owes the player is the row below: a sheltered march that fields **more** hired than the top ' +
        'rung, hits at least as hard and costs **less** silver is an offer the account can plainly make.\n',
    );
    report.add('| army | all-in before | all-in after | a cheaper, fuller march the bar owes |');
    report.add('|---|---|---|---|');
    for (let index = 0; index < (after ?? before ?? []).length; index += 1) {
      const a = after?.[index];
      const b = before?.[index];
      const one = a ?? b;
      if (!one) continue;
      const say = (measured: Measured | undefined): string => {
        if (!measured) return '—';
        const row = measured.stops.find((stop) => stop.pick === 'all-in');
        return row
          ? `${String(row.burn)} burned · ${n(row.damage)} for ${n(row.silver)} · ${String(row.mercLost)} over ${String(row.marches)}`
          : '**none**';
      };
      const owed = (measured: Measured | undefined): string => {
        if (!measured) return '—';
        if (measured.stops.some((stop) => stop.pick === 'all-in')) return 'offered';
        const top = topRung(measured);
        if (!top) return '—';
        const asks = measured.rivals.filter(
          (rival) => rival.hired > top.hired && rival.damage >= top.repDamage && rival.silver < top.repSilver,
        );
        return asks.length === 0
          ? 'none'
          : asks
              .map(
                (rival) =>
                  `${rival.what}: ${String(rival.hired)} hired, ${n(rival.damage)} for ${n(rival.silver)}`,
              )
              .join('; ');
      };
      report.add(`| ${one.label} | ${say(b)} | ${say(a)} | ${owed(a) === 'offered' ? owed(b) : owed(a)} |`);
    }
    report.add(
      '\n**Two rows of that table are not what they look like.**\n\n' +
        '- *his camp of 2026-09-19, the localStorage dump* loses its `all-in` **because the bar caught up ' +
        'with it**: the 18-chunk march the stop used to be alone in offering (3 976 648 a march for ' +
        '2 844 600) is the bar’s **steady max** now, so `offer`’s own dedupe refuses a second row of the ' +
        'same march. The campaign behind it is a repeated one and hits harder for less: 15 906 592 for ' +
        '11 378 400 silver and 72 chunks as a sequence, 13 842 678 for 10 476 500 and **57** as a rung — ' +
        'less damage over the four marches, and 8 % less silver for fifteen chunks of stock kept.\n' +
        '- *the 12 000 export* has no `all-in` on either engine, and that is the drop rule working. Measured ' +
        'with the rule switched off by hand on both builds: the stop plays **31 308 140 for 23 696 200 ' +
        'silver and 90 burned** against the steady max’s 31 963 845 for 21 035 600 and 82 — behind on every ' +
        'figure a stop prints. Re-sizing it at its own hired counts changes nothing there: the strongest ' +
        'shape at the vector it settles on **is** the shape it settled on.\n',
    );
    report.add(
      '**What the re-size buys, where it buys anything.** The walk that builds this stop asks each shape ' +
        '*“how much of the remaining stock can you shelter?”* and keeps the one that shelters the most; ' +
        'nobody then asked *“and what is the best shape for that much?”*. On the owner’s live camp of ' +
        '2026-09-18 the answer is a different shape at the same vector — measured march by march, all four ' +
        'of them: **2 509 790 damage for 1 559 600 silver** where the walk had settled on 2 509 790 for ' +
        '**2 844 600**, the same 347 hired and the same 36 chunks. That is 45 % of the march’s silver, for ' +
        'nothing, and it is what puts the stop back on that bar: 10 899 547 for **6 653 700** over four ' +
        'marches, which the steady max beside it (15 306 859 for 9 849 200 at 52 chunks) no longer beats on ' +
        'silver, so S-94’s rule no longer drops it.\n',
    );

    // ---- §D — the clock ---------------------------------------------------------------------------------
    report.h('§D — what the pass costs the search');
    if (before && after) {
      report.add('| army | before (ms) | after (ms) |');
      report.add('|---|--:|--:|');
      let sumBefore = 0;
      let sumAfter = 0;
      for (let index = 0; index < after.length; index += 1) {
        const a = after[index];
        const b = before[index];
        if (!a || !b) continue;
        sumBefore += b.ms;
        sumAfter += a.ms;
        report.add(`| ${a.label} | ${n(b.ms)} | ${n(a.ms)} |`);
      }
      report.add(`| **all fifteen** | **${n(sumBefore)}** | **${n(sumAfter)}** |`);
    } else {
      report.add('_Both sidecars are needed for this section; run this file on both engines._');
    }

    report.save();
  }, 900_000);
});
