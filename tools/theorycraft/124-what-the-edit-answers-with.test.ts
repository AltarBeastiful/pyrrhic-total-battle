/**
 * 124 — **what a March edit answers with, and the march it left behind** (owner, 2026-09-20: *"I'm not that
 * sure any more that when removing or adding a troop — left out / put back from the battle summary — we
 * should not compute again the best possible outcome, checking if less leadership buys us something"*).
 *
 * A press on a "Left out — tap to put back" pill, or on a marching pill to take a type out, runs
 * `resizeMarchOver` (`src/engine/plan.ts`) through the worker's `resize` job. It **does** recompute: it
 * builds the sizer's three methods and the tight ladder at each of the ten `LADDER_GROWTHS` over exactly
 * the types that are in, shelters every hired stack, and keeps the best by `beats` — **fewest unfielded,
 * then highest damage**, silver and queue being tie-breaks only. Three things follow, and this experiment
 * measures each rather than reasoning about it:
 *
 * **A. The march on screen is not a candidate of its own re-size.** Nothing in the candidate set is "the
 * stop, with that one type taken out or put in, and nothing else touched", so a press can only move the
 * player to a *different* march — including, as investigation 0024 §5 found on a dominance account, a
 * strictly worse one. §A builds that missing candidate (`shelterCounts` over the stop's own counts with the
 * edit applied) and counts how often the answer the app gives is **dominated** by it.
 *
 * **B. Does less leadership buy anything after an edit?** Experiment 119 turned the dial on every stop **as
 * generated** and found 0 dominations, which retired S-115. It never turned it on a march the player had
 * edited, which is a different march over a different type set with a different floor. §B re-sizes every
 * edit at eleven lower fills of the pool and asks the same two questions: does any fill dominate, and does
 * any fill pass the owner's own put-back exchange rate (`CAMPAIGN.putBack`: score = silver-saved % / 5 +
 * queue-saved % / 10 + damage change %, taken when it recovers faster, scores ≥ 0 and loses ≤ 3 %)?
 *
 * **C. Where the smaller marches already are.** The ladder growth list is itself a leadership dial —
 * `ladder()` tests only `used <= leadership` — so the small marches are already on the table at the full
 * pool and are discarded by `beats`. §C prices the three sizer methods side by side to say whether a
 * cheaper runner-up is hiding among them, and §D times one re-size so the cost of adding a dial is a
 * figure rather than a worry.
 *
 * **E. What the edit is allowed to spend.** A re-size caps a mercenary at `largestSustained(stock, repeats)`
 * and a monster at its whole pool (S-102, S-107), neither of which is the stop's own count. §E tables the
 * two side by side, because it is the multiplier that decides how far an edit can wander from the stop.
 *
 * Damage is the **worst opening** (S-94/S-108), which is what the bar ranks on and the recap draws; silver
 * and queue are `recoveryCosts(...).plan` under each account's own recovery settings; burn is `hiredLost`.
 * The four armies are the three experiments 118 and 119 used plus **the dominance account of investigation
 * 0024**, which is the only one of the four where a press makes the march worse.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/124-what-the-edit-answers-with.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import {
  largestSustained,
  planCampaign,
  planRepeats,
  resizeMarchOver,
  shelterCounts,
} from '../../src/engine/plan';
import type { CampaignPlan, MarchWithin, PlanTotals } from '../../src/engine/plan';
import { recoveryCosts } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest, UnitDef } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { parseImport } from '../../src/share/exportImport';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { EXPORT_2026_09_17, Report, evaluateCounts, loadLiveAccount, n } from './harness';

const HUNTER = 'epic-monster-hunter-6';
/** Shares of the leadership pool the dial is turned to in §B. */
const FILLS = [100, 98, 96, 94, 92, 90, 85, 80, 75, 70, 60, 50] as const;
/** `CAMPAIGN.putBack`, the owner's own exchange rates — read here rather than imported, so the report says them. */
const SILVER_PER_DAMAGE = 5;
const TIME_PER_DAMAGE = 10;
const LOSS_CAP = 3;

interface Priced {
  damage: number;
  silver: number;
  seconds: number;
  burn: number;
  counts: Record<string, number>;
}

function price(base: StackRequest, counts: Record<string, number>): Priced {
  const { result, summary } = evaluateCounts(base, counts);
  const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
  return {
    damage: summary.minDamage,
    silver: bill.silver,
    seconds: bill.seconds,
    burn: hiredLost(result.stacks),
    counts,
  };
}

/**
 * **`planStopAgain`'s own `within`** (`src/ui/sections/march/generate.ts`), rebuilt here so the figures come
 * from the path a pill press actually runs: a monster at its whole dominance pool, a capped mercenary at
 * what the stock sustains over the stop's repeats, an uncapped one at its authority pool.
 */
function withinFor(request: StackRequest, stop: PlanTotals, included: Set<string>): MarchWithin {
  const repeats = planRepeats(stop);
  const troopIds: string[] = [];
  const hired: Record<string, number> = {};
  for (const unit of request.units) {
    if (!included.has(unit.id)) continue;
    if (unit.pool === 'leadership') {
      troopIds.push(unit.id);
      continue;
    }
    hired[unit.id] = capOf(request, stop, unit, repeats);
  }
  return { troopIds, hired };
}

function capOf(request: StackRequest, stop: PlanTotals, unit: UnitDef, repeats: number): number {
  if (unit.pool === 'dominance') {
    return Math.max(
      stop.counts[unit.id] ?? 0,
      Math.floor(request.housing.dominance / Math.max(1, unit.cost)),
    );
  }
  const held = request.caps[unit.id];
  if (held === undefined) return Math.floor(request.housing.authority / Math.max(1, unit.cost));
  return largestSustained(held, repeats);
}

/**
 * **The candidate nobody builds: the stop, with the edit applied and nothing else touched.**
 *
 * Taking a type out only ever *frees* leadership and can only *raise* the troop floor, so the stop's other
 * counts stay exactly where they are and the hired stacks are re-sheltered (`shelterCounts` lowers and never
 * raises, so this is the conservative reading). Putting a type back sizes it into the leadership the stop
 * left unused — the most it can field without moving a single other stack — and re-shelters, because a new
 * small troop stack can lower the floor under the hired ones.
 */
function stopWithEdit(
  base: StackRequest,
  stop: PlanTotals,
  edit: { out?: string; back?: string },
): Record<string, number> | null {
  const counts: Record<string, number> = {};
  for (const [id, count] of Object.entries(stop.counts)) if (count > 0 && id !== edit.out) counts[id] = count;
  if (edit.back !== undefined) {
    const unit = base.units.find((one) => one.id === edit.back);
    if (unit === undefined) return null;
    const used = base.units
      .filter((one) => one.pool === 'leadership')
      .reduce((sum, one) => sum + (counts[one.id] ?? 0) * one.cost, 0);
    const room = Math.floor(Math.max(0, base.housing.leadership - used) / Math.max(1, unit.cost));
    if (room <= 0) return null;
    counts[unit.id] = room;
  }
  const troops = base.units.filter((one) => one.pool === 'leadership' && (counts[one.id] ?? 0) > 0);
  if (troops.length === 0) return null;
  return shelterCounts(base, counts);
}

const pct = (part: number, whole: number): string =>
  whole === 0 ? '—' : `${n(Math.round((part / whole) * 1000) / 10)} %`;
const signed = (value: number): string => `${value >= 0 ? '+' : ''}${n(Math.round(value * 10) / 10)} %`;

/** The put-back score, in the owner's own rates, of `after` read against `before`. */
function putBackScore(before: Priced, after: Priced): { score: number; damage: number; takes: boolean } {
  const damage = ((after.damage - before.damage) / before.damage) * 100;
  const silver = before.silver > 0 ? ((before.silver - after.silver) / before.silver) * 100 : 0;
  const time = before.seconds > 0 ? ((before.seconds - after.seconds) / before.seconds) * 100 : 0;
  const score = silver / SILVER_PER_DAMAGE + time / TIME_PER_DAMAGE + damage;
  return { score, damage, takes: after.seconds < before.seconds && score >= 0 && -damage <= LOSS_CAP };
}

/** 0024's account: 5 600 / 2 180 / 800, guardsmen I–III, monsters III, Aydae 48 ★3, 27 hunters. */
function dominanceAccount(dominance = 800, stock = 27): { profile: Profile; setup: BattleSetup } {
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
    recoveryPlan: { mode: 'selective', selectiveTop: 3 },
  };
  return { profile, setup };
}

function firstRun(): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const profile = root.profiles[0];
  const setup = profile?.setups[0];
  if (!profile || !setup) throw new Error('no first-run profile');
  return { profile, setup };
}

interface Army {
  name: string;
  profile: Profile;
  setup: BattleSetup;
}

/** One edit of one stop, as a pill press makes it. */
interface Edit {
  label: string;
  out?: string;
  back?: string;
  included: Set<string>;
}

function editsOf(base: StackRequest, stop: PlanTotals): Edit[] {
  const troopIds = base.units.filter((one) => one.pool === 'leadership').map((one) => one.id);
  const fielded = troopIds.filter((id) => (stop.counts[id] ?? 0) > 0);
  const absent = troopIds.filter((id) => (stop.counts[id] ?? 0) <= 0);
  // The types the march itself carries, which is what `finish(Object.keys(chosen.counts))` puts in the run.
  const inMarch = new Set(Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0));
  const out: Edit[] = [];
  if (fielded.length > 2) {
    for (const id of [fielded[0], fielded[fielded.length - 1]]) {
      if (id === undefined) continue;
      out.push({
        label: `take out ${id}`,
        out: id,
        included: new Set([...inMarch].filter((one) => one !== id)),
      });
    }
  }
  for (const id of absent.slice(-1)) {
    out.push({ label: `put back ${id}`, back: id, included: new Set([...inMarch, id]) });
  }
  return out;
}

describe.skipIf(!process.env.THEORY)('what a March edit answers with', () => {
  it('measures the missing candidate, the dial, the shapes, the cost and the caps', () => {
    const report = new Report('124-what-the-edit-answers-with');

    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const own = parsed.payload;
    const ownSetup = own.setups[0];
    if (!ownSetup) throw new Error('no setup');
    const live = loadLiveAccount();
    const { profile: fresh, setup: freshSetup } = firstRun();
    const camp = dominanceAccount();

    const armies: Army[] = [
      {
        name: 'a first-run army, 12 000 leadership (hires nothing)',
        profile: fresh,
        setup: { ...freshSetup, housing: { ...freshSetup.housing, leadership: 12_000 } },
      },
      { name: 'the live account, 20 000 leadership · 83 EMH', profile: live.profile, setup: live.setup },
      { name: 'the 2026-09-17 export, its own setup (four hired types)', profile: own, setup: ownSetup },
      {
        name: '0024’s account, 5 600 / 2 180 / 800 dominance · 27 EMH',
        profile: camp.profile,
        setup: camp.setup,
      },
    ];

    const prepared = armies.map((army) => {
      const base = buildStackRequest(army.profile, army.setup);
      // An army the plan refuses ("no feasible plan for this army") has no stop to edit, so it is skipped
      // rather than allowed to end the run.
      let plan: CampaignPlan | null;
      try {
        plan = planCampaign(buildPlanRequest(army.profile, army.setup));
      } catch {
        plan = null;
      }
      return { army, base, plan };
    });

    // ---- A -------------------------------------------------------------------------------------------
    report.h('A. The march on screen is not a candidate of its own re-size');
    report.add('');
    report.add(
      'For every stop and every edit: what the app answers with today, against **the stop with that one ' +
        'change and nothing else touched**. *Dominated* means the untouched march deals at least as much ' +
        'damage for no more silver and no more burn, and the app answered with the other one anyway.',
    );
    let editsSeen = 0;
    let dominatedByStop = 0;
    let dearer = 0;
    let slower = 0;

    /**
     * **The press that changes nothing**, which is the case investigation 0024 §5 measured: a put-back whose
     * type cannot be fielded, or a `Put back all` over types that do not fit, leaves the re-size with exactly
     * the stop's own troop set — and it still answers with a different march, because the stop is not a
     * candidate of its own re-size and a monster is re-capped at its whole pool (S-102).
     */
    report.add('');
    report.add(
      '**First, the press that changes no type at all** — `resizeMarchOver` over the stop’s own troop set:',
    );
    report.add('');
    report.add('| army | stop | the stop | the same types, re-sized | damage | silver | queue | burn |');
    report.add('|---|---|---|---|---|---|---|---|');
    let noops = 0;
    let noopsWorse = 0;
    for (const { army, base, plan } of prepared) {
      if (plan === null) continue;
      for (const stop of plan.alternatives) {
        const inMarch = new Set(Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0));
        const answer = resizeMarchOver(base, withinFor(base, stop, inMarch));
        if (answer === null) continue;
        const was = price(base, stop.counts);
        const now = price(base, answer.counts);
        noops += 1;
        const worse = now.damage < was.damage && now.silver >= was.silver;
        if (worse) noopsWorse += 1;
        report.add(
          `| ${army.name.split(',')[0]} | ${stop.pick} | ${n(was.damage)} · ${n(was.silver)} · ${n(
            was.burn,
          )} | ${n(now.damage)} · ${n(now.silver)} · ${n(now.burn)} | ${pct(now.damage, was.damage)} | ${pct(
            now.silver,
            was.silver,
          )} | ${pct(now.seconds, was.seconds)} | ${n(now.burn)} vs ${n(was.burn)} |`,
        );
      }
    }
    report.add('');
    report.add(
      `**${n(noops)} stops re-sized over their own types**: **${n(
        noopsWorse,
      )}** answer with **less damage for no less silver** than the march the player was already looking at.`,
    );

    for (const { army, base, plan } of prepared) {
      if (plan === null) continue;
      report.add('');
      report.add(`### ${army.name}`);
      report.add('');
      report.add(
        '| stop | edit | the app answers | the stop, edited | damage | silver | queue | burn | verdict |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|');
      for (const stop of plan.alternatives) {
        const stopPrice = price(base, stop.counts);
        for (const edit of editsOf(base, stop)) {
          const answer = resizeMarchOver(base, withinFor(base, stop, edit.included));
          if (answer === null) continue;
          editsSeen += 1;
          const got = price(base, answer.counts);
          if (got.silver > stopPrice.silver) dearer += 1;
          if (got.seconds > stopPrice.seconds) slower += 1;
          const untouchedCounts = stopWithEdit(base, stop, edit);
          if (untouchedCounts === null) continue;
          const untouched = price(base, untouchedCounts);
          const dominates =
            untouched.damage >= got.damage &&
            untouched.silver <= got.silver &&
            untouched.burn <= got.burn &&
            (untouched.damage > got.damage || untouched.silver < got.silver || untouched.burn < got.burn);
          if (dominates) dominatedByStop += 1;
          report.add(
            `| ${stop.pick} | ${edit.label} | ${n(got.damage)} · ${n(got.silver)} · ${n(got.burn)} | ${n(
              untouched.damage,
            )} · ${n(untouched.silver)} · ${n(untouched.burn)} | ${pct(got.damage, untouched.damage)} | ${pct(
              got.silver,
              untouched.silver,
            )} | ${pct(got.seconds, untouched.seconds)} | ${n(got.burn)} vs ${n(untouched.burn)} | ${
              dominates ? '**the untouched march wins outright**' : 'the re-size wins or trades'
            } |`,
          );
        }
      }
    }
    report.add('');
    report.add(
      `**Over ${n(editsSeen)} edits**: the untouched march wins **outright** — at least the damage, no more ` +
        `silver, no more burn — on **${n(dominatedByStop)}** of them. ${n(dearer)} answers cost more silver ` +
        `than the stop they edited and ${n(slower)} take longer to recover.`,
    );

    // ---- B -------------------------------------------------------------------------------------------
    report.h('B. The leadership dial, turned on the march after the edit');
    report.add('');
    report.add(
      'Experiment 119 turned the dial on stops as generated: 0 dominations, which retired S-115. This turns ' +
        'it on the **edited** march — a different type set and a different floor — at eleven lower fills.',
    );
    let fillsSeen = 0;
    let fillDominations = 0;
    let fillTakes = 0;
    const takeRows: string[] = [];
    for (const { army, base, plan } of prepared) {
      if (plan === null) continue;
      report.add('');
      report.add(`### ${army.name}`);
      for (const stop of plan.alternatives) {
        for (const edit of editsOf(base, stop)) {
          const within = withinFor(base, stop, edit.included);
          const full = resizeMarchOver(base, within);
          if (full === null) continue;
          const at100 = price(base, full.counts);
          report.add('');
          report.add(
            `**${stop.pick} · ${edit.label}** — the answer today (${full.shape}): ${n(at100.damage)} damage, ` +
              `${n(at100.silver)} silver, ${n(Math.round(at100.seconds))} s queue, ${n(at100.burn)} hired lost`,
          );
          report.add('');
          report.add(
            '| fill | shape | damage | of the answer | silver | of it | queue | of it | burn | score | verdict |',
          );
          report.add('|---|---|---|---|---|---|---|---|---|---|---|');
          for (const fill of FILLS) {
            const dialled = resizeMarchOver(
              {
                ...base,
                housing: { ...base.housing, leadership: Math.floor((base.housing.leadership * fill) / 100) },
              },
              within,
            );
            if (dialled === null) continue;
            const row = price(base, dialled.counts);
            const { score, damage, takes } = putBackScore(at100, row);
            const dominates =
              fill !== 100 &&
              row.damage >= at100.damage &&
              row.silver <= at100.silver &&
              row.burn <= at100.burn &&
              (row.damage > at100.damage || row.silver < at100.silver || row.burn < at100.burn);
            if (fill !== 100) {
              fillsSeen += 1;
              if (dominates) fillDominations += 1;
              if (takes && !dominates) {
                fillTakes += 1;
                takeRows.push(
                  `| ${army.name.split(',')[0]} | ${stop.pick} | ${edit.label} | ${n(fill)} % | ${signed(
                    damage,
                  )} | ${signed(-((at100.silver - row.silver) / at100.silver) * 100 * -1)} silver | ${n(
                    at100.silver - row.silver,
                  )} silver saved | ${n(Math.round(at100.seconds - row.seconds))} s saved | ${n(
                    Math.round(score * 10) / 10,
                  )} |`,
                );
              }
            }
            report.add(
              `| ${n(fill)} % | ${dialled.shape} | ${n(row.damage)} | ${pct(row.damage, at100.damage)} | ${n(
                row.silver,
              )} | ${pct(row.silver, at100.silver)} | ${n(Math.round(row.seconds))} | ${pct(
                row.seconds,
                at100.seconds,
              )} | ${n(row.burn)} | ${n(Math.round(score * 10) / 10)} | ${
                fill === 100
                  ? 'the answer'
                  : dominates
                    ? '**dominates**'
                    : takes
                      ? '**the put-back rule takes it**'
                      : 'a trade'
              } |`,
            );
          }
        }
      }
    }
    report.add('');
    report.add(
      `**Over ${n(fillsSeen)} lower fills**: **${n(fillDominations)}** dominations, and **${n(
        fillTakes,
      )}** the owner's own put-back rule would take (score ≥ 0, recovers faster, at most ${n(
        LOSS_CAP,
      )} % of the damage lost).`,
    );
    if (takeRows.length > 0) {
      report.add('');
      report.add('| army | stop | edit | fill | damage | — | silver saved | queue saved | score |');
      report.add('|---|---|---|---|---|---|---|---|---|');
      for (const row of takeRows) report.add(row);
    }

    // ---- C -------------------------------------------------------------------------------------------
    report.h('C. The three sizer shapes the chooser sees, at the full pool');
    report.add('');
    report.add(
      'Rebuilt from `sizedShape`’s own recipe — `sizeStacks` under the method, then the shelter — to say ' +
        'whether a cheaper runner-up is already on the table before any dial is added.',
    );
    let shapeSeen = 0;
    let shapeBetter = 0;
    for (const { army, base, plan } of prepared) {
      if (plan === null) continue;
      report.add('');
      report.add(`### ${army.name}`);
      report.add('');
      report.add('| stop | edit | elite | ms | msRelaxed | all three the same |');
      report.add('|---|---|---|---|---|---|');
      for (const stop of plan.alternatives) {
        for (const edit of editsOf(base, stop)) {
          const within = withinFor(base, stop, edit.included);
          const full = resizeMarchOver(base, within);
          if (full === null) continue;
          const at100 = price(base, full.counts);
          const keep = new Set([
            ...within.troopIds,
            ...Object.keys(within.hired).filter((id) => (within.hired[id] ?? 0) > 0),
          ]);
          const readings: Priced[] = [];
          for (const method of ['elite', 'ms', 'msRelaxed'] as const) {
            const sized = sizeStacks({
              ...base,
              caps: { ...base.caps, ...within.hired },
              units: base.units.filter((one) => keep.has(one.id)),
              options: {
                ...base.options,
                method: method === 'elite' ? 'elite' : 'ms',
                relaxedPreservation: method === 'msRelaxed',
              },
            });
            const raw: Record<string, number> = {};
            for (const stack of sized.stacks) if (stack.count > 0) raw[stack.unitId] = stack.count;
            readings.push(price(base, shelterCounts(base, raw)));
          }
          shapeSeen += 1;
          for (const one of readings) if (putBackScore(at100, one).takes) shapeBetter += 1;
          const same = readings.every(
            (one) => one.damage === readings[0]?.damage && one.silver === readings[0]?.silver,
          );
          report.add(
            `| ${stop.pick} | ${edit.label} | ${readings.map((one) => `${n(one.damage)} · ${n(one.silver)}`).join(' | ')} | ${
              same ? 'yes' : '**no**'
            } |`,
          );
        }
      }
    }
    report.add('');
    report.add(
      `**Over ${n(shapeSeen)} edits**: **${n(
        shapeBetter,
      )}** of the sizer shapes already in the candidate set score better under the put-back rule than the ` +
        'shape the chooser takes.',
    );

    // ---- D -------------------------------------------------------------------------------------------
    report.h('D. What one re-size costs');
    report.add('');
    report.add('| army | troop types | hired types | one `resizeMarchOver` | a 12-fill dial |');
    report.add('|---|---|---|---|---|');
    for (const { army, base, plan } of prepared) {
      if (plan === null) continue;
      const stop = plan.alternatives[Math.min(1, plan.alternatives.length - 1)];
      if (stop === undefined) continue;
      const edit = editsOf(base, stop)[0];
      if (edit === undefined) continue;
      const within = withinFor(base, stop, edit.included);
      const runs = 25;
      const t0 = performance.now();
      for (let i = 0; i < runs; i += 1) resizeMarchOver(base, within);
      const one = (performance.now() - t0) / runs;
      report.add(
        `| ${army.name} | ${n(within.troopIds.length)} | ${n(Object.keys(within.hired).length)} | ${n(
          Math.round(one * 100) / 100,
        )} ms | ≈ ${n(Math.round(one * 12))} ms |`,
      );
    }

    // ---- E -------------------------------------------------------------------------------------------
    report.h('E. What the edit is allowed to spend, against what the stop spends');
    report.add('');
    report.add(
      '| army | stop | repeats | hired type | stock | the stop fields | the re-size may field | ratio |',
    );
    report.add('|---|---|---|---|---|---|---|---|');
    for (const { army, base, plan } of prepared) {
      if (plan === null) continue;
      for (const stop of plan.alternatives) {
        const repeats = planRepeats(stop);
        for (const unit of base.units) {
          if (unit.pool === 'leadership') continue;
          const inStop = stop.counts[unit.id] ?? 0;
          if (inStop <= 0 && unit.pool !== 'dominance') continue;
          const cap = capOf(base, stop, unit, repeats);
          report.add(
            `| ${army.name.split(',')[0]} | ${stop.pick} | ${n(repeats)} | ${unit.id} | ${n(
              base.caps[unit.id] ?? 0,
            )} | ${n(inStop)} | ${n(cap)} | ${inStop > 0 ? `${n(Math.round((cap / inStop) * 100) / 100)}×` : '—'} |`,
          );
        }
      }
    }

    report.save();
  });
});
