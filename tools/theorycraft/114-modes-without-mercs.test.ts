/**
 * 114 — **what each stacking mode actually decides, and what is left of them when the account hires
 * nothing** (owner, 2026-09-20: *"we need to revisit our understanding of complete or total optimization.
 * Or maybe without merc, we silently fallback to tier ladder"*).
 *
 * S-110 measured that Complete optimization cannot be the app's default because it refuses a first-run
 * account. This asks the four questions that decide what to do about it, and every answer is a measurement
 * rather than a reading of the code:
 *
 *  - **A** — on an army that hires nothing, do the three sizer modes even differ? The ceilings that tell
 *    them apart are written on the *authority* and *dominance* pools, so the prediction is that they cannot;
 *    a measurement is what makes it a fact.
 *  - **B** — where is the exact edge of the refusal? One mercenary, one monster, a type selected with an
 *    empty stock: which of them does the plan answer for?
 *  - **C** — is there anything for a plan to *plan* on a troops-only army? The plan's own knob is how much
 *    of the pool a march spends; with no stock to spread, a bar of stops is worth drawing only if that knob
 *    still buys something. Swept over the leadership a march is allowed to fill.
 *  - **D** — what the plan is worth the moment one hired type exists, on the same army, so the two sides of
 *    the edge can be read against each other.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/114-modes-without-mercs.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import { effectiveTable, rankTroops } from '../../src/engine/plan';
import { searchPriority } from '../../src/engine/search';
import { recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { CAMPAIGN } from '../../src/config';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { parseImport } from '../../src/share/exportImport';
import { EXPORT_2026_09_17, Report, evaluate, label, n } from './harness';

/** The account the app creates on a first run: Guardsmen I–III, Specialists I, nothing hired. */
function firstRun(): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const profile = root.profiles[0];
  if (!profile) throw new Error('no profile');
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return { profile, setup };
}

function withHousing(setup: BattleSetup, housing: Partial<BattleSetup['housing']>): BattleSetup {
  return { ...setup, housing: { ...setup.housing, ...housing } };
}

/** The four figures a player compares two marches by, all on the worst opening (S-94). */
function figuresOf(request: StackRequest): {
  damage: number;
  silver: number;
  seconds: number;
  counts: string;
  stacks: number;
} {
  const { result, summary } = evaluate(request);
  const bill = recoveryCosts(result.stacks, request.units, request.recovery).plan;
  return {
    damage: summary.minDamage,
    silver: bill.silver,
    seconds: bill.seconds,
    stacks: result.stacks.length,
    counts: result.stacks.map((stack) => `${label(stack.unitId)} ${n(stack.count)}`).join(' · '),
  };
}

const days = (seconds: number): string => {
  const d = Math.floor(seconds / 86_400);
  const h = Math.round((seconds % 86_400) / 3_600);
  return d > 0 ? `${String(d)}d ${String(h)}h` : `${String(h)}h`;
};

describe.skipIf(!process.env.THEORY)('the modes, and the mercenary-free account', () => {
  // Three plan searches and a handful of greedy campaigns: well past Vitest's 5 s default.
  it('measures what each mode decides with and without hired stock', () => {
    const report = new Report('114-modes-without-mercs');
    const { profile, setup } = firstRun();

    // ---- A -----------------------------------------------------------------------------------------
    report.h('A — the three sizer modes on an army that hires nothing');
    report.add(
      'The first-run account exactly as the app creates it (Guardsmen I–III, Specialists I, no mercenary and' +
        ' no monster), at three leadership pools. Every row is `sizeStacks` + `simulateBattle`, the damage the' +
        " worst opening, the silver and the queue `recoveryCosts` under the account's own recovery settings.",
    );
    report.add('');
    report.add('| leadership | mode | damage | silver | queue | stacks | counts |');
    report.add('|---|---|---|---|---|---|---|');
    const sizerModes = [
      ['elite', 'Tier ladder', {}],
      ['ms', 'Troops first', {}],
      ['ms', 'Troops first + damage trades', { relaxedPreservation: true }],
      ['elite', 'Tier ladder + monsters after troops', { monstersLast: true }],
      ['custom', 'Your own order (reversed)', {}],
    ] as const;
    const identical: Record<number, string[]> = {};
    for (const leadership of [4_100, 12_000, 20_000]) {
      const housed = withHousing(setup, { leadership });
      identical[leadership] = [];
      for (const [method, title, extra] of sizerModes) {
        const base = buildStackRequest(profile, housed);
        // "Your own order" is only a different mode when the player really reorders: the reversed
        // Elite-Preservation ranking is the most different list there is.
        const customOrder =
          method === 'custom'
            ? [...base.units.map((unit) => unit.id)].reverse()
            : (undefined as string[] | undefined);
        const request: StackRequest = {
          ...base,
          options: {
            ...base.options,
            method,
            ...extra,
            ...(customOrder === undefined ? {} : { customOrder }),
          },
        };
        const figures = figuresOf(request);
        identical[leadership]?.push(`${String(figures.damage)}|${figures.counts}`);
        report.add(
          `| ${n(leadership)} | ${title} | ${n(figures.damage)} | ${n(figures.silver)} | ${days(
            figures.seconds,
          )} | ${String(figures.stacks)} | ${figures.counts} |`,
        );
      }
    }
    report.add('');
    for (const leadership of [4_100, 12_000, 20_000]) {
      const rows = identical[leadership] ?? [];
      const same = new Set(rows).size;
      report.add(
        `At ${n(leadership)} leadership the five rows above are **${String(same)} distinct march${
          same === 1 ? '' : 'es'
        }**.`,
      );
    }

    // ---- B -----------------------------------------------------------------------------------------
    report.h('B — where the plan refuses, exactly');
    report.add(
      'The same account at 12 000 leadership, with one thing changed at a time. "answers" means' +
        ' `planCampaign` returned a plan; the refusal is its own sentence.',
    );
    report.add('');
    report.add('| account | plan | stops | best campaign damage |');
    report.add('|---|---|---|---|');
    const tryPlan = (
      name: string,
      mutate: (profile: Profile, setup: BattleSetup) => { profile: Profile; setup: BattleSetup },
    ): void => {
      const next = mutate(structuredClone(profile), withHousing(setup, { leadership: 12_000 }));
      try {
        const plan = planCampaign(buildPlanRequest(next.profile, next.setup));
        const best = Math.max(...plan.alternatives.map((stop) => stop.totalDamage));
        report.add(
          `| ${name} | answers | ${String(plan.alternatives.length)} (${plan.alternatives
            .map((stop) => stop.pick)
            .join(' · ')}) | ${n(best)} |`,
        );
      } catch (error) {
        report.add(`| ${name} | **refuses** — "${(error as Error).message}" | — | — |`);
      }
    };
    tryPlan('first run: no mercenary, no monster', (p, s) => ({ profile: p, setup: s }));
    tryPlan('one mercenary type selected, stock 0', (p, s) => {
      p.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 0 }];
      return { profile: p, setup: { ...s, housing: { ...s.housing, authority: 2_000 } } };
    });
    tryPlan('one mercenary, stock 1', (p, s) => {
      p.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 1 }];
      return { profile: p, setup: { ...s, housing: { ...s.housing, authority: 2_000 } } };
    });
    tryPlan('one mercenary, stock 20', (p, s) => {
      p.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 20 }];
      return { profile: p, setup: { ...s, housing: { ...s.housing, authority: 2_000 } } };
    });
    tryPlan('no mercenary, but monsters unlocked at tier 3 and dominance housed', (p, s) => {
      p.troops.monsters = { min: 3, max: 3 };
      return { profile: p, setup: { ...s, housing: { ...s.housing, dominance: 900 } } };
    });
    tryPlan('no mercenary, monsters unlocked but no dominance housing', (p, s) => {
      p.troops.monsters = { min: 3, max: 3 };
      return { profile: p, setup: s };
    });

    // ---- C -----------------------------------------------------------------------------------------
    report.h('C — is there anything to plan on a troops-only army?');
    report.add(
      "The plan's own knob is how much of the pool a march spends: the ladder's floor is fixed by the" +
        ' mercenaries and every rung above it buys troop damage for silver. With nothing hired there is no' +
        ' floor, so the question is what is left of the knob. Swept by capping the leadership a march may' +
        ' fill, which is the same trade read from the other end — each row is the Tier ladder over the whole' +
        ' army at that pool, priced on the worst opening.',
    );
    report.add('');
    report.add('| leadership spent | share | damage | silver | queue | damage a silver | damage kept |');
    report.add('|---|---|---|---|---|---|---|');
    const full = figuresOf(buildStackRequest(profile, withHousing(setup, { leadership: 12_000 })));
    for (const share of [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) {
      const pool = Math.round(12_000 * share);
      const figures = figuresOf(buildStackRequest(profile, withHousing(setup, { leadership: pool })));
      report.add(
        `| ${n(pool)} | ${String(Math.round(share * 100))} % | ${n(figures.damage)} | ${n(
          figures.silver,
        )} | ${days(figures.seconds)} | ${n(figures.damage / Math.max(1, figures.silver))} | ${n(
          Math.round((figures.damage / full.damage) * 1000) / 10,
        )} % |`,
      );
    }
    report.add('');
    report.add(
      'The whole-pool march is the reference: ' +
        `${n(full.damage)} damage for ${n(full.silver)} silver and ${days(full.seconds)} of queue.`,
    );

    // ---- D -----------------------------------------------------------------------------------------
    report.h('D — the same army, one hired type, and what the plan then offers');
    const hired = structuredClone(profile);
    hired.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 60 }];
    const hiredSetup = withHousing(setup, { leadership: 12_000, authority: 2_000 });
    report.add(
      `Epic Monster Hunter VI ×60 in stock, 2 000 authority, 12 000 leadership, horizon ${String(
        CAMPAIGN.marches,
      )} marches. The sizer rows are one march; the plan rows are its stops, campaign figures included.`,
    );
    report.add('');
    report.add(
      '| mode | first march damage | silver | hired lost | campaign damage | campaign silver | hired lost |',
    );
    report.add('|---|---|---|---|---|---|---|');
    for (const [method, title] of [
      ['elite', 'Tier ladder'],
      ['ms', 'Troops first'],
    ] as const) {
      /**
       * The horizon as a player plays a sizer: Generate, march, lose a chunk of ten of every hired stack
       * fielded, Generate again on what the stock has left. The plan's campaign is measured against exactly
       * this, because it is what pressing the button four times gives.
       */
      const base = buildStackRequest(hired, hiredSetup);
      const caps = { ...base.caps };
      let damage = 0;
      let silver = 0;
      let burned = 0;
      let first: { damage: number; silver: number; burned: number } | null = null;
      for (let march = 0; march < CAMPAIGN.marches; march += 1) {
        const request: StackRequest = { ...base, caps: { ...caps }, options: { ...base.options, method } };
        const { result, summary } = evaluate(request);
        if (result.stacks.length === 0) break;
        const bill = recoveryCosts(result.stacks, request.units, request.recovery).plan;
        const lost = result.stacks
          .filter((stack) => stack.pool === 'authority')
          .reduce((sum, stack) => sum + Math.ceil(stack.count / 10), 0);
        damage += summary.minDamage;
        silver += bill.silver;
        burned += lost;
        first ??= { damage: summary.minDamage, silver: bill.silver, burned: lost };
        for (const stack of result.stacks) {
          if (stack.pool === 'leadership') continue;
          caps[stack.unitId] = Math.max(0, (caps[stack.unitId] ?? 0) - Math.ceil(stack.count / 10));
        }
      }
      report.add(
        `| ${title} | ${n(first?.damage ?? 0)} | ${n(first?.silver ?? 0)} | ${String(
          first?.burned ?? 0,
        )} | ${n(damage)} | ${n(silver)} | ${String(burned)} |`,
      );
    }
    const plan = planCampaign(buildPlanRequest(hired, hiredSetup));
    for (const stop of plan.alternatives) {
      report.add(
        `| Complete optimization · ${stop.pick} | ${n(stop.repeat.damage)} | ${n(
          stop.repeat.silver,
        )} | ${String(stop.repeat.mercLost)} | ${n(stop.totalDamage)} | ${n(stop.silver)} | ${String(
          stop.mercLost,
        )} |`,
      );
    }

    // ---- E -----------------------------------------------------------------------------------------
    report.h('E — what does move a troops-only march: the Objective, not the method');
    report.add(
      'The same first-run army at 12 000 leadership. The first row is Generate with no priority — every type' +
        ' the account can field, which is what §A measured. The others are the priority search over subsets of' +
        " the types, which is what the command bar's Objective control runs. Composition, not sizing: the" +
        ' question is which types to march with, and it is the only lever this army has.',
    );
    report.add('');
    report.add('| objective | damage | silver | queue | damage a silver | stacks | counts |');
    report.add('|---|---|---|---|---|---|---|');
    const troopsOnly = buildStackRequest(profile, withHousing(setup, { leadership: 12_000 }));
    const plain = figuresOf(troopsOnly);
    report.add(
      `| no priority (every type) | ${n(plain.damage)} | ${n(plain.silver)} | ${days(
        plain.seconds,
      )} | ${n(plain.damage / plain.silver)} | ${String(plain.stacks)} | ${plain.counts} |`,
    );
    for (const objective of ['avgDamage', 'minDamage', 'damagePerSilver'] as const) {
      const found = searchPriority({ request: troopsOnly, objective, budgetMs: 8_000 });
      const bill = recoveryCosts(found.result.stacks, troopsOnly.units, troopsOnly.recovery).plan;
      const counts = found.result.stacks
        .map((stack) => `${label(stack.unitId)} ${n(stack.count)}`)
        .join(' · ');
      report.add(
        `| ${objective} | ${n(found.summary.minDamage)} | ${n(bill.silver)} | ${days(bill.seconds)} | ${n(
          found.summary.minDamage / bill.silver,
        )} | ${String(found.result.stacks.length)} | ${counts} |`,
      );
    }

    // ---- F -----------------------------------------------------------------------------------------
    report.h('F — the bar a troops-only plan could draw, if it could draw one');
    report.add(
      "A plan's two families are the tight ladder (rungs just above the hired floor) and the sizer over a" +
        ' **prefix** of the troop ranking. With nothing hired there is no floor, so the ladder family has no' +
        ' anchor and the sizer-over-a-prefix family is all that is left. That family is measured here' +
        " directly: the same army, the sizer over the first k troop types of the plan's own ranking" +
        ' (`rankTroops`, worst damage a point of leadership first), so k = 10 is every type and k = 1 is the' +
        ' best type alone. It is the frontier a bar of stops would be drawn from.',
    );
    report.add('');
    report.add('| types fielded | damage | silver | queue | damage a silver | counts |');
    report.add('|---|---|---|---|---|---|');
    const ranked = rankTroops(effectiveTable(troopsOnly));
    for (let keep = ranked.length; keep >= 1; keep -= 1) {
      // The prefix the plan means: the k types the *ranking* keeps, which is the k best a point of
      // leadership buys — so the ones dropped are the ones it would give up first.
      const kept = new Set(ranked.slice(ranked.length - keep).map((entry) => entry.id));
      const request: StackRequest = {
        ...troopsOnly,
        units: troopsOnly.units.filter((unit) => kept.has(unit.id)),
      };
      const figures = figuresOf(request);
      report.add(
        `| ${String(keep)} | ${n(figures.damage)} | ${n(figures.silver)} | ${days(figures.seconds)} | ${n(
          figures.damage / Math.max(1, figures.silver),
        )} | ${figures.counts} |`,
      );
    }

    // ---- G -----------------------------------------------------------------------------------------
    report.h('G — a real account with four hired types, where the plan has something to spread');
    report.add(
      "The owner's export of 2026-09-17 on its own setup: 7 000 leadership, 2 180 authority, stock EMH 142 ·" +
        ' arbalester 50 · legionary 42 · chariot 20. Same arithmetic as §D — the sizers played greedily for' +
        ` the ${String(CAMPAIGN.marches)}-march horizon, the plan as its own campaign.`,
    );
    report.add('');
    report.add(
      '| mode | first march damage | silver | hired lost | campaign damage | campaign silver | hired lost |',
    );
    report.add('|---|---|---|---|---|---|---|');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const ownProfile = parsed.payload;
    const ownSetup = ownProfile.setups[0];
    if (!ownSetup) throw new Error('no setup');
    for (const [method, title] of [
      ['elite', 'Tier ladder'],
      ['ms', 'Troops first'],
    ] as const) {
      const base = buildStackRequest(ownProfile, ownSetup);
      const caps = { ...base.caps };
      let damage = 0;
      let silver = 0;
      let burned = 0;
      let first: { damage: number; silver: number; burned: number } | null = null;
      for (let march = 0; march < CAMPAIGN.marches; march += 1) {
        const request: StackRequest = { ...base, caps: { ...caps }, options: { ...base.options, method } };
        const { result, summary } = evaluate(request);
        if (result.stacks.length === 0) break;
        const bill = recoveryCosts(result.stacks, request.units, request.recovery).plan;
        const lost = result.stacks
          .filter((stack) => stack.pool !== 'leadership')
          .reduce((sum, stack) => sum + Math.ceil(stack.count / 10), 0);
        damage += summary.minDamage;
        silver += bill.silver;
        burned += lost;
        first ??= { damage: summary.minDamage, silver: bill.silver, burned: lost };
        for (const stack of result.stacks) {
          if (stack.pool === 'leadership') continue;
          caps[stack.unitId] = Math.max(0, (caps[stack.unitId] ?? 0) - Math.ceil(stack.count / 10));
        }
      }
      report.add(
        `| ${title} | ${n(first?.damage ?? 0)} | ${n(first?.silver ?? 0)} | ${String(
          first?.burned ?? 0,
        )} | ${n(damage)} | ${n(silver)} | ${String(burned)} |`,
      );
    }
    for (const stop of planCampaign(buildPlanRequest(ownProfile, ownSetup)).alternatives) {
      report.add(
        `| Complete optimization · ${stop.pick} | ${n(stop.repeat.damage)} | ${n(
          stop.repeat.silver,
        )} | ${String(stop.repeat.mercLost)} | ${n(stop.totalDamage)} | ${n(stop.silver)} | ${String(
          stop.mercLost,
        )} |`,
      );
    }

    // ---- H -----------------------------------------------------------------------------------------
    report.h('H — the army that has monsters but hires no mercenary');
    report.add(
      'The first-run troops at 12 000 leadership with the monster window open at tier 3 and 900 dominance' +
        ' housed — the case §B found the plan *does* answer for. It is also the only case in which "Monsters' +
        ' after troops" is a different mode from the Tier ladder, so all of it is measured together.',
    );
    report.add('');
    report.add(
      '| mode | first march damage | silver | hired lost | campaign damage | campaign silver | hired lost |',
    );
    report.add('|---|---|---|---|---|---|---|');
    const camp = structuredClone(profile);
    camp.troops.monsters = { min: 3, max: 3 };
    const campSetup = withHousing(setup, { leadership: 12_000, dominance: 900 });
    for (const [method, title, extra] of [
      ['elite', 'Tier ladder', {}],
      ['elite', 'Tier ladder + monsters after troops', { monstersLast: true }],
      ['ms', 'Troops first', {}],
    ] as const) {
      const base = buildStackRequest(camp, campSetup);
      const caps = { ...base.caps };
      let damage = 0;
      let silver = 0;
      let lost = 0;
      let first: { damage: number; silver: number; lost: number } | null = null;
      for (let march = 0; march < CAMPAIGN.marches; march += 1) {
        const request: StackRequest = {
          ...base,
          caps: { ...caps },
          options: { ...base.options, method, ...extra },
        };
        const { result, summary } = evaluate(request);
        if (result.stacks.length === 0) break;
        const bill = recoveryCosts(result.stacks, request.units, request.recovery).plan;
        // A dominance monster is trained again rather than burned (S-102), so only the authority pool
        // counts as stock lost — the same reading the plan's `mercLost` takes.
        const burnt = result.stacks
          .filter((stack) => stack.pool === 'authority')
          .reduce((sum, stack) => sum + Math.ceil(stack.count / 10), 0);
        damage += summary.minDamage;
        silver += bill.silver;
        lost += burnt;
        first ??= { damage: summary.minDamage, silver: bill.silver, lost: burnt };
        for (const stack of result.stacks) {
          if (stack.pool !== 'authority') continue;
          caps[stack.unitId] = Math.max(0, (caps[stack.unitId] ?? 0) - Math.ceil(stack.count / 10));
        }
      }
      report.add(
        `| ${title} | ${n(first?.damage ?? 0)} | ${n(first?.silver ?? 0)} | ${String(
          first?.lost ?? 0,
        )} | ${n(damage)} | ${n(silver)} | ${String(lost)} |`,
      );
    }
    for (const stop of planCampaign(buildPlanRequest(camp, campSetup)).alternatives) {
      report.add(
        `| Complete optimization · ${stop.pick} | ${n(stop.repeat.damage)} | ${n(
          stop.repeat.silver,
        )} | ${String(stop.repeat.mercLost)} | ${n(stop.totalDamage)} | ${n(stop.silver)} | ${String(
          stop.mercLost,
        )} |`,
      );
    }

    report.save();
  }, 120_000);
});
