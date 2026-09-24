/**
 * **The benchmark, as a standing test** (owner, 2026-09-18: *"always benchmark our total optimization against
 * the two others to understand if we're finding something interesting or just changing numbers without really
 * improving on the current stack algorithm"*; later that day: *"update the benchmark with the needed test
 * scenarios to prove everything … so we have a definitive benchmark over the main use cases of the
 * calculators"*).
 *
 * Complete optimization against Tier ladder and Troops first — each as the plain sizer and as Generate runs
 * it, the priority search on average damage — and every plan stop, all played for the same four marches: the
 * sizer methods re-sized each march on the stock the last one left (a chunk of ten lost per hired stack
 * fielded), the plan as its own sequence of repeats and finale. Where a calculator outside this repo answered
 * the same case (TotalStack's optimize capture of 2026-09-15, Kai's calculator's extract of the same day), its
 * march is a row too, played as captured while the stock lasts. Every march is priced by `simulateBattle` on
 * its counts.
 *
 * **The three rare readings changed on 2026-09-19** (S-105): `a hired`, `a soldier` and `a monster` divide
 * **that group's own damage**, not the whole campaign's. The owner, on the hired column: *"it says over a
 * million but in total they do less than 1M"*, and *"dmg per hired is still broken: it shows a damage per
 * hired almost above total damage"*. Each numerator is the group's share of the same enemy-first journal the
 * damage column is summed from (`price`), so the three are shares of that column and never a second
 * arithmetic beside it. The `a silver` and `a dragon coin` columns are untouched: they price a whole march,
 * and the whole march's damage is what they bought.
 *
 * **The reading changed on 2026-09-19** (S-94): the damage column is every march's **worst opening**
 * (`minDamage`, the enemy-first journal) where it was the midpoint of the two openings, on every row of every
 * scenario. The owner will not spend on a coin flip, the plan is ranked on the bad flip, and a table that
 * ranked the plan against its rivals on a different figure would be comparing two arithmetics. The figures
 * below are therefore **lower in level** than every snapshot up to `benchmark-2026-09-19-11-thrift-end`; the
 * per-scenario worst/expected ratio that bridges the two is in `benchmark-2026-09-19-12-reliable-damage.md`
 * and in `tools/theorycraft/out/109-reliable-damage.md` §C. `price()` below is the one place it is decided.
 *
 * **The scenarios** are the main use cases of the calculators, each pinned to what the engine does today so
 * that a change either way is news:
 *
 *  - the owner's 2026-09-17 export at its setup (7 000 leadership — the case where a hired stack on top was
 *    the best sponge, experiment 101 §A) and at 12 000;
 *  - his live account of 2026-09-18 (one hired type, 20 000) and its evening form (four types, one of them
 *    hired as unlimited, 11 000);
 *  - a first-run army with Bear V at a stock of 1, 2, 3 and 10 (experiment 101 §B: the small stocks where
 *    the plan refuses or offers one stop), and with the hunter at 83 (the e2e seed);
 *  - a first-run army that has unlocked the **monster tiers** — 12 dominance types over tiers 3–5 against a
 *    900 dominance pool, experiment 110's camp (added 2026-09-19, S-96: the first scenario here with a pool
 *    other than leadership and authority in it, and the one that holds the plan to fielding and sheltering
 *    the monsters it can house). Its 20 000-dominance sibling is not here because its search does not
 *    finish inside `CAMPAIGN.budgets.plan` — see `monsterCamp` in `plan-scenarios.ts`;
 *  - the 4 000-leadership case of 2026-09-15, the one case two other calculators answered;
 *  - **his three camps** (added 2026-09-19, S-101): the live camp of 2026-09-18 (arbalesters 485,
 *    legionaries 1 002, bears unlimited) and his camp of 2026-09-19 at both readings of the Battle card
 *    (4 975 / 2 180 with 450 hunters, 5 100 / 2 200 with 120). They have held the plan's *criteria* since
 *    S-93 and S-97; what kept them off this table was that no calculator outside this repo had answered
 *    them, and the replay of 2026-09-19 answered all three.
 *  - **his own TotalStack profile** (added 2026-09-19, S-103): 5 225 leadership, 2 120 authority and 100
 *    dominance with the monster window on tier 3, Epic Monster Hunter V ×80 and the bonuses he typed into
 *    the page. It is the one army here whose request is the captured request rather than a reconstruction
 *    of it, so the quotients under its table are two searches over one army. The second replay of that
 *    morning also gave the **monster camp** its first captured answers, which is why scenario 11 carries
 *    external rows and floors now where it carried none.
 *
 * **The owner's goal is measured on every scenario that can carry it** (S-101): under each table, a `goal`
 * line reads the plan's best stop against the captured **Total Optimization** row on the three readings he
 * named — *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"* — and says
 * which are at or above 1.0 and which are below. The three are **pinned at what they measure today**
 * (`Pinned.totalOptimization`), never at the goal: a reading the bar has not reached is a discrepancy for
 * the owner to judge, and a benchmark red for a target rather than for a regression would stop being a
 * non-regression suite.
 *
 * **A fourth reading joins it where a dragon coin is actually spent** (S-103): the monster camp and his
 * TotalStack profile and his usual setup, the three armies on this table that house a dominance pool (the
 * count read "two" until scenario 17 was added by S-106). On the other fourteen
 * neither side spends a coin, both read at `damage / 1`, and a "standing" that repeats the damage column is
 * left out of the goal line and out of the pins rather than printed as if it meant something.
 *
 * **Two things hold a run, and they answer different questions.**
 *
 *  1. **The hand pins** (`plan-scenarios.ts`): its hardest-hitting campaign reaches the pinned share of the
 *     best sizer sequence's four-march damage, its best stop a hired unit beats every sizer sequence unless
 *     pinned otherwise, its best stop a silver reaches 95 % of the best sizer sequence's, and the bar carries
 *     the pinned number of stops. They say *how far above the sizers* the plan must stand, and each was
 *     chosen by a person, dated and explained on its own scenario.
 *  2. **The registered baseline** (`plan-baseline.ts`, `checkBaseline` below), since 2026-09-19: the figures
 *     the **owner** has registered as acceptable, stop by stop, which no run may come in under — *"the
 *     benchmark is like non-regression tests. A given scenario should not be worse, or it's a discrepancy, or
 *     a new baseline needs to be registered by me if the trade is ok."* Nothing in this repo re-bases either
 *     of them. `pnpm bench:baseline` writes `tests/engine/plan-baseline.proposed.json`; the owner reads it,
 *     sets `registeredBy` and renames it. Until he does, the baseline half asserts nothing and the report
 *     says so.
 *
 * **Three pins are failing as of 2026-09-19 (S-95)**, left failing on purpose for him to judge with the
 * proposal in hand: `stops` on the 7 000 export (4 registered, 5 offered) and on the 12 000 export (5, 4),
 * and `externals.damageFloor` on his live account at 20 000 (1.02 registered, 1.018 measured). The reliable
 * reading moved the bar on those armies; whether the trade is worth a new baseline is his call, not this
 * file's.
 *
 * S-94 left **four**: the evening account's `stops` pin (5 registered, 4 offered) came back on its own when
 * the band's token-field arm moved from the count of hired units to the damage (S-95), because the bar
 * carries five stops there again. No pin was touched to make that happen.
 *
 * The table each case measured is written to `tools/theorycraft/out/benchmark-latest.md`, the figures to
 * `benchmark-latest.json` beside it (what a before/after comparison reads). The first-run and 4 000 cases run
 * everywhere; the owner's cases run where his export is.
 *
 * Read the rows knowing what they are not (validator, 2026-09-18): a plan **stop that repeats a march** used
 * to play fewer marches than the horizon when its stock ran out, while a sizer sequence went on with troops
 * alone, so a "four-march" share could compare three marches with four. Since S-89 (2026-09-18) every stop
 * plays the horizon — the `all-in` march by march, every other stop by appending the same troops-only march
 * once per march its stock does not reach (`PlanTotals.tail`) — so the shares below compare four marches with
 * four on every army the plan answers; a captured answer is one
 * march repeated on its own stock, never
 * re-sized as its stock drains (conservative for it); the 4 000 case's troop types are the ones TotalStack's
 * answer fielded, and TotalStack was asked for damage a silver where this table ranks damage. Both searches
 * run under the app's own budgets (`CAMPAIGN.budgets`).
 */
import { appendFileSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

import { planKernel } from '@/engine/fast';

// The scenarios themselves, and their pins, live beside this file (`plan-scenarios.ts`) since S-87, so that
// `plan-criteria.test.ts` can hold the shelter criterion on every army this benchmark builds.
import type { Baseline } from './plan-baseline';
import { compareToBaseline, registeredBaseline } from './plan-baseline';
import type { Scenario } from './plan-scenarios';
import { OWNER_EXPORT, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';
// **Dominance at matched spend** (S-121), the reading the owner's definition of *beating* reduces to, and
// since this story the table's **primary** one: the ratios below it are what a stop that costs no more and
// hits harder gives you for free. Its arithmetic is a module of its own so it has unit tests that run in a
// quarter of a second (`matched-spend.test.ts`) rather than only inside this three-minute suite.
// The pricing itself (S-131): `price`, `campaignOf`, `greedy` and `asCaptured` moved to a module of their
// own so experiment 138 re-asks the verdict on *this* arithmetic rather than on a second copy of it.
import type { Campaign } from './plan-campaign';
import { MARKERS, TOLERANCE, verdictWord } from './matched-spend';
// **One army, measured** — every row, the ratio readings, the baseline shape and the matched-spend verdict —
// is `plan-measure.ts`, so `tests/kernel/benchmark-equivalence.*.test.ts` measures the same armies through the
// same code on both engine paths.
import type { Measured, Verdict } from './plan-measure';
import {
  asBaseline,
  figuresOf,
  measure,
  perDragonCoin,
  perHired,
  perMonster,
  perSilver,
  perSoldier,
  verdictOf,
} from './plan-measure';

const SILVER_FLOOR = 0.95;
const OUT = new URL('../../tools/theorycraft/out/', import.meta.url);
/**
 * **The run writes to its own file, and only a whole run is promoted** (S-121b, 2026-09-22).
 *
 * `benchmark-latest.{md,json}` are **committed artefacts** — the plan's §1 and §2 are read out of them, and
 * a `git diff` on them is how a change is reviewed. They used to be written directly, scenario by scenario,
 * from module load: so `vitest run tests/engine/plan-benchmark.test.ts -t "Bear V ×3"` — the ordinary way to
 * iterate on one army of a three-minute suite — truncated both to a **one-army** payload with no standing
 * section and left them that way in the working tree, ready to be committed by accident. It happened during
 * this story: a `git diff --stat` taken mid-run read `-10,573` lines.
 *
 * So every run writes `benchmark-run.{md,json}`, and the standing test at the end — which only passes on a
 * complete run — copies them over the committed pair. A filtered run never reaches it, and never touches
 * them.
 */
/**
 * **The kernel's run writes files of its own** (both paths in `pnpm test`, 2026-09-24). `pnpm test` runs this
 * file twice at once — the `ts` project on the TypeScript engine, the `kernel` project with the plan
 * kernel set (`tests/kernel/with-kernel.setup.ts`) — so the kernel's run is `benchmark-run.kernel.*` and is
 * promoted to `benchmark-latest.kernel.*`, both gitignored: the committed pair stays the TypeScript run's.
 * Whether the two runs' figures agree is `tests/kernel/benchmark-equivalence.*.test.ts`, in one process.
 */
const SUFFIX = planKernel() ? '.kernel' : '';
const REPORT = new URL(`benchmark-run${SUFFIX}.md`, OUT);
const FIGURES = new URL(`benchmark-run${SUFFIX}.json`, OUT);
const FINAL_REPORT = new URL(`benchmark-latest${SUFFIX}.md`, OUT);
const FINAL_FIGURES = new URL(`benchmark-latest${SUFFIX}.json`, OUT);
const n = (value: number): string => Math.round(value).toLocaleString('en-US');

// ---- the owner's goal: Total Optimization on the three rare readings (S-101) --------------------------------

/**
 * The name `totalstack-rows.ts` gives the captured **Total Optimization** answer — TotalStack's `monsterSaving`
 * body, which is the row the owner names when he states his goal.
 */
const TOTAL_OPTIMIZATION = 'TotalStack · Total Optimization';

/** One scenario's standings against that row, or `null` where the table has no comparable one. */
interface Standings {
  perSilver: number;
  perSoldier: number;
  perMonster: number;
  /**
   * **Damage a dragon coin** (S-103), the fourth reading and the one only a monster camp has: where no coin
   * is spent both sides read at `damage / 1` and this repeats the damage column, so it is reported and
   * pinned only on a table where one was (`Pinned.totalOptimization.perDragonCoin`).
   */
  perDragonCoin: number;
}

/**
 * **The owner's goal, measured** (2026-09-19: *"at least the same as TotalStack full opt in silver/dmg,
 * merc/dmg and monster/dmg"*).
 *
 * The plan's **best stop** on each of the three readings, over the same reading of TotalStack's Total
 * Optimization row — both campaigns priced by our own engine, on the same request, over the same four
 * marches and on the same worst opening, so the quotient is the two answers and not two arithmetics. `≥ 1.0`
 * is the goal met; anything under it is a **discrepancy** the run reports and the story writes up, never a
 * pin (`Pinned.totalOptimization` says why).
 *
 * A reading neither side has — a campaign that spent no silver — comes back `NaN` and is shown as `—`
 * rather than counted either way.
 */
function standingsAgainstTotalOptimization(plans: Campaign[], externals: Campaign[]): Standings | null {
  const row = externals.find((c) => c.name === TOTAL_OPTIMIZATION);
  if (!row) return null;
  const over = (of: (c: Campaign) => number): number => {
    const theirs = of(row);
    const ours = Math.max(...plans.map(of).filter(Number.isFinite));
    return Number.isFinite(theirs) && theirs > 0 && Number.isFinite(ours) ? ours / theirs : NaN;
  };
  return {
    perSilver: over(perSilver),
    perSoldier: over(perSoldier),
    perMonster: over(perMonster),
    perDragonCoin: over(perDragonCoin),
  };
}

/** The three readings in the order the owner names them, for the report and for the assertions. */
const GOAL_READINGS = [
  ['damage a silver', 'perSilver'],
  ['damage a hired soldier', 'perSoldier'],
  ['damage a monster', 'perMonster'],
] as const;
/**
 * **The fourth reading, where a table has one** (S-103): damage a dragon coin. It is not in `GOAL_READINGS`
 * because the owner's goal names three and because on the fourteen armies that spend no coin it is the
 * damage column read twice; the goal line appends it and `check` pins it only on a scenario whose rows
 * actually pay in coins.
 */
const COIN_READING = ['damage a dragon coin', 'perDragonCoin'] as const;
const PINNED_READINGS = [...GOAL_READINGS, COIN_READING] as const;
/** True where a dragon coin was spent at all — by a stop or by a captured answer priced on this army. */
const spendsCoins = (rows: Campaign[]): boolean => rows.some((c) => c.dragonCoins > 0);

/**
 * **The goal line** (S-101): one sentence a scenario, under its table, saying where the bar stands against
 * TotalStack's Total Optimization on the owner's own three readings and which of them are **below** it. A
 * scenario whose table holds no comparable Total Optimization row says so instead, and says nothing about a
 * goal it was never measured on.
 */
function goalLine(measured: Measured): string {
  const plans = measured.rows.filter((c) => c.kind === 'plan');
  const externals = measured.rows.filter((c) => c.kind === 'external' && c.comparable);
  if (plans.length === 0) return 'No stop to measure against TotalStack’s Total Optimization.';
  const standings = standingsAgainstTotalOptimization(plans, externals);
  if (!standings) {
    return (
      'No comparable `TotalStack · Total Optimization` row on this army, so the owner’s goal ' +
      '(*"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*) is not ' +
      'measured here.'
    );
  }
  const read = GOAL_READINGS.map(([what, key]) => {
    const value = standings[key];
    if (!Number.isFinite(value)) return { what, text: `${what} —`, below: false };
    return { what, text: `${what} **${value.toFixed(3)}**${value >= 1 ? ' ✓' : ' ✗'}`, below: value < 1 };
  });
  const below = read.filter((one) => one.below);
  // The fourth reading, only where a coin was actually spent (S-103): on an army that houses no dominance
  // unit both sides read `damage / 1` and the quotient repeats the damage column.
  const coin = standings[COIN_READING[1]];
  const coinLine =
    spendsCoins([...plans, ...externals]) && Number.isFinite(coin)
      ? ` And the fourth currency, where one is spent: **${COIN_READING[0]} ${coin.toFixed(3)}**` +
        `${coin >= 1 ? ' ✓' : ' ✗'} — the monsters’ own price (S-102).`
      : '';
  return (
    '**Goal — at least TotalStack’s Total Optimization** (owner, 2026-09-19: *"at least the same as ' +
    'TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*), the plan’s best stop over that row: ' +
    `${read.map((one) => one.text).join(', ')}. ` +
    (below.length === 0
      ? 'All three are at or above the goal.'
      : `**Below the goal: ${below.map((one) => one.what).join(', ')}** — a discrepancy for the owner, not a pin.`) +
    coinLine
  );
}

const pct = (value: number): string =>
  Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)} %` : '—';

/**
 * **The verdict block** (S-121): three or four lines under each army's table saying, in the owner's own
 * terms, whether the bar beat the other calculator on this army and where it did not.
 *
 * It leads with their **hardest** row — the figure `docs/plans/beating-totalstack.md` §2 is tabled on — then
 * says how many of their rows *in total* the bar dominates, because beating their biggest march is not the
 * same as beating all of them and the plan's title says *everywhere*. The six marker floors follow as the
 * derived reading, and the `anything` line is printed only when it disagrees with the verdict, which is the
 * only time it is news.
 */
function verdictLines(verdict: Verdict): string[] {
  const { matched, anything, floors } = verdict;
  if (!matched.hardest) {
    return [
      '**Matched spend — not measured**: no comparable march from a calculator outside this repo on this ' +
        'army, so there is nothing to be better or worse than.',
    ];
  }
  const word = verdictWord(matched.hardest);
  const them = matched.hardest.theirs;
  const us = matched.hardest.ours;
  const lines = [
    `**Matched spend — ${word.toUpperCase()}** (owner, 2026-09-21: *"beat means using constrained ` +
      'resources to produce better damage with a fixed silver/merc/gold/dragon coins set"*). Their hardest ' +
      `comparable march is \`${them.name}\` at ${n(them.damage)} for ${n(them.silver)} silver, ` +
      `${n(them.gold)} gold, ${n(them.dragonCoins)} coins, ${n(them.burned)} burned, ${n(them.seconds)} s. ` +
      (us
        ? `Our best stop inside that budget (${(TOLERANCE * 100).toFixed(0)} %) is \`${us.name}\` at ` +
          `${n(us.damage)} — **${pct(matched.hardest.delta)}**.`
        : `**No stop of ours fits inside it**, over ${matched.hardest.over.join(', ')}.`),
    '',
    `**Over all ${String(matched.rows.length)} of their comparable marches**, the bar dominates ` +
      `**${String(matched.rowsBeaten)}** at matched spend` +
      (matched.worst
        ? `; the one it does worst on is \`${matched.worst.theirs.name}\` at ${pct(matched.worst.delta)}.`
        : '; none of its stops fits inside any of them.'),
  ];
  if (anything.rowsBeaten > matched.rowsBeaten) {
    lines.push(
      '',
      `**But the damage is reachable**: counting every algorithm the app offers — the sizers, their ` +
        `switches and all five objectives — ${String(anything.rowsBeaten)} of their ${String(anything.rows.length)} ` +
        `marches are dominated, against the bar's ${String(matched.rowsBeaten)}. The gap between those two ` +
        'numbers is the plan failing to reach what this engine can already do, not the engine losing.',
    );
  }
  if (floors.length > 0) {
    lines.push(
      '',
      `**The six markers**, our best against theirs on each alone: ${floors
        .map((one) => `${one.marker} ${one.standing === 'win' ? '✓' : one.standing === 'tie' ? '=' : '✗'}`)
        .join(', ')}.`,
    );
  }
  return lines;
}

function record(label: string, measured: Measured): void {
  const verdict = verdictOf(measured);
  const lines = [
    `## ${label}`,
    '',
    measured.refusal
      ? `The plan refused: \`${measured.refusal}\`.`
      : `The plan offers ${measured.plan?.alternatives.length ?? 0} stops.`,
    '',
    '| sequence | marches | troops | four-march damage | silver | gold | hired burned | a silver | a hired |' +
      ' soldiers burned | monsters burned | dragon coins | a soldier | a monster | a dragon coin |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...measured.rows.map(
      (c) =>
        `| ${c.name} | ${c.marches} | ${c.troopTypes === 0 ? '**none**' : `${String(c.troopTypes)} · ${n(c.leadershipUsed)}`} | ${n(c.damage)} | ${n(c.silver)} | ${n(c.gold)} | ${n(c.burned)} | ${Number.isFinite(perSilver(c)) ? perSilver(c).toFixed(2) : '—'} | ${n(perHired(c))} |` +
        ` ${n(c.soldiersLost)} | ${n(c.monstersLost)} | ${n(c.dragonCoins)} | ${n(perSoldier(c))} | ${n(perMonster(c))} |` +
        ` ${n(perDragonCoin(c))} |`,
    ),
    '',
    // **The primary reading since S-121**, above the goal line rather than beside it: the ratios the goal
    // line reads are what a stop that costs no more and hits harder gives you for free, so the dominance
    // question is asked first and the derived one after it.
    ...verdictLines(verdict),
    '',
    goalLine(measured),
    '',
  ];
  appendFileSync(REPORT, `${lines.join('\n')}\n`);
  const figures = JSON.parse(readFileSync(FIGURES, 'utf8')) as { scenarios: unknown[] };
  figures.scenarios.push(figuresOf(label, measured, verdict));
  writeFileSync(FIGURES, `${JSON.stringify(figures, null, 1)}\n`);
}

/**
 * **The registered baseline, if the owner has registered one** (2026-09-19: *"the benchmark is like
 * non-regression tests. A given scenario should not be worse, or it's a discrepancy, or a new baseline needs
 * to be registered by me if the trade is ok."*).
 *
 * Read once for the whole file. `null` — no `plan-baseline.json`, or one that still reads
 * `registeredBy: null` — means nothing below is asserted and the run says so in its report, so a tree with
 * no baseline is an honest "not measured yet" rather than a silent pass. `pnpm bench:baseline` writes the
 * proposal the owner registers.
 */
const BASELINE: Baseline | null = registeredBaseline();

function checkBaseline(scenario: Scenario, measured: Measured): void {
  if (!BASELINE) return;
  const was = BASELINE.scenarios[scenario.label];
  if (!was) {
    // A scenario the baseline does not hold is news, not a failure: the owner registers armies, and one he
    // has not registered has nothing to be worse than.
    process.stdout.write(`  baseline — ${scenario.label}: not registered\n`);
    return;
  }
  const now = asBaseline(measured);
  // Soft (S-121b), and the early return below is exactly why: a hard failure here threw out of
  // `checkBaseline`, and `check` — every hand pin on the army — never ran at all. That is the masking this
  // story set out to remove, left in the one place it could still happen.
  expect.soft(now, `${scenario.label}: the plan refused an army the baseline holds`).not.toBeNull();
  if (!now) return;
  const { failures, added } = compareToBaseline(was, now);
  for (const line of added) process.stdout.write(`  baseline — ${scenario.label}: ${line}\n`);
  expect
    .soft(failures.join('\n'), `this run is behind the baseline the owner registered\n${failures.join('\n')}`)
    .toBe('');
}

/**
 * **Every pin reports, and no pin hides another** (S-121, 2026-09-22). The assertions below are
 * `expect.soft`, which records a failure and carries on, where they used to be `expect`, which stops the
 * test at the first one.
 *
 * It is not a style change. Seven of the seventeen armies are red today, and on each of those every
 * assertion *after* the failing one was invisible — the live account of 2026-09-18 hid three shortfalls one
 * behind another (`externals.damageFloor` behind `perSilver` behind `perSoldier`) and a masking-blind audit
 * on 2026-09-21 found three more standing behind failures on `stops` and `winsHired`. A non-regression suite
 * that reports one problem an army at a time makes a change look clean because it broke something early.
 * The structural checks — a case with external rows that pins none, a table with no sweet spot — stay hard
 * throws, because those say the file is wrong rather than the engine.
 */
function check(scenario: Scenario, measured: Measured): void {
  const { pinned } = scenario;
  const tell = measured.rows
    .map((c) => `${c.name}: ${n(c.damage)} / ${n(c.silver)} / ${n(c.burned)}`)
    .join('; ');
  expect
    .soft(measured.refusal !== null, `the plan refuses (${measured.refusal ?? 'no'})`)
    .toBe(pinned.refuses);
  expect.soft(measured.plan?.alternatives.length ?? 0, `stops on the bar (${tell})`).toBe(pinned.stops);
  const sizers = measured.rows.filter((c) => c.kind === 'sizer');
  // Four sizer sequences, each of at least one march: a floor against nothing would hold of anything.
  expect(sizers.length).toBe(4);
  // Soft (S-121b): a sizer that plays no march is an **engine** outcome, not a broken file — the report's
  // own preamble records troopless rows on two armies already — so it must not stop the pins below it.
  for (const c of sizers) expect.soft(c.marches, `${c.name} played no march`).toBeGreaterThan(0);
  if (!measured.plan) return;
  const plan = measured.rows.filter((c) => c.kind === 'plan');
  const externals = measured.rows.filter((c) => c.kind === 'external' && c.comparable);
  const sweet = plan.find((c) => c.name.endsWith('sweet-spot'));
  const most = plan.reduce<Campaign | undefined>((b, c) => (!b || c.damage > b.damage ? c : b), undefined);
  if (!sweet || !most) throw new Error('no sweet spot or top');
  const bestSizerDamage = Math.max(...sizers.map((c) => c.damage));
  const finite = (values: number[]): number => Math.max(...values.filter(Number.isFinite));
  const bestSizerPerSilver = finite(sizers.map(perSilver));
  const bestSizerPerHired = Math.max(...sizers.map(perHired));
  const planPerSilver = finite(plan.map(perSilver));
  const planPerHired = Math.max(...plan.map(perHired));
  expect
    .soft(most.damage, `the plan's hardest campaign against the best sizer sequence (${tell})`)
    .toBeGreaterThanOrEqual(pinned.damageFloor * bestSizerDamage);
  expect
    .soft(planPerHired > bestSizerPerHired, `the plan's best a hired beats the sizers (${tell})`)
    .toBe(pinned.winsHired);
  expect
    .soft(planPerSilver, `the plan's best a silver against the sizers (${tell})`)
    .toBeGreaterThanOrEqual((pinned.silverFloor ?? SILVER_FLOOR) * bestSizerPerSilver);
  // `>=` on both, so an **exact tie** counts: a sizer sequence that matches the sweet spot on silver and on
  // the stock is not behind it on either, and since S-89 that is a case which actually happens (Bear V ×1
  // and ×2 tail into the Tier ladder sizer's own campaign, to the unit). The pin is named for what this
  // measures rather than for a loss it does not always mean — see `Pinned.sweetNotAheadOnEither`.
  const notAhead = sizers.some((c) => perSilver(c) >= perSilver(sweet) && perHired(c) >= perHired(sweet));
  expect
    .soft(notAhead, `no sizer sequence is behind the sweet spot on either ratio (${tell})`)
    .toBe(pinned.sweetNotAheadOnEither);
  if (externals.length > 0) {
    if (!pinned.externals) throw new Error('a case with external rows must pin them');
    const bestExternalDamage = Math.max(...externals.map((c) => c.damage));
    const bestExternalPerHired = Math.max(...externals.map(perHired));
    expect
      .soft(most.damage, `the plan's hardest campaign against the other calculators (${tell})`)
      .toBeGreaterThanOrEqual(pinned.externals.damageFloor * bestExternalDamage);
    expect
      .soft(
        planPerHired > bestExternalPerHired,
        `the plan's best a hired beats the other calculators (${tell})`,
      )
      .toBe(pinned.externals.winsHired);
  }
  // **The floors against Total Optimization** (S-101). Every scenario whose table holds a comparable
  // `TotalStack · Total Optimization` row pins all three of the owner's readings and nothing else does, so
  // a row that appears or disappears is caught here rather than silently dropping a floor.
  const standings = standingsAgainstTotalOptimization(plan, externals);
  if (standings && !pinned.totalOptimization) {
    throw new Error('a case with a comparable Total Optimization row must pin the three readings against it');
  }
  if (!standings && pinned.totalOptimization) {
    throw new Error('a case pinned against Total Optimization no longer has a comparable row for it');
  }
  if (standings && pinned.totalOptimization) {
    // The owner's three, and the coins where the scenario pins them (S-103): a reading a scenario does not
    // carry is left out of the pin rather than floored at a figure that repeats the damage column.
    for (const [what, key] of PINNED_READINGS) {
      const floor = pinned.totalOptimization[key];
      if (floor === undefined) continue;
      // A reading neither side has (no silver spent) is not a floor: it is compared only where it exists.
      if (!Number.isFinite(standings[key])) continue;
      expect
        .soft(
          standings[key],
          `the plan's best stop against TotalStack's Total Optimization on ${what} (${tell})`,
        )
        .toBeGreaterThanOrEqual(floor);
    }
  }

  // **The primary reading** (S-121): dominance at matched spend, the sentence the owner wrote. It sits last
  // in this function and it is the first thing the report prints, and with `expect.soft` above the order no
  // longer decides what a reader gets to see.
  const verdict = verdictOf(measured);
  if (externals.length > 0 && !pinned.matched) {
    throw new Error('a case with external rows must pin its matched-spend standing');
  }
  if (externals.length === 0 && pinned.matched) {
    throw new Error('a case pinned at matched spend no longer has a comparable row to match against');
  }
  if (pinned.matched) {
    const { hardest, rowsBeaten, rows, unfitted } = verdict.matched;
    const how =
      `${verdictWord(hardest)} against \`${hardest?.theirs.name ?? '—'}\`, ` +
      `${String(rowsBeaten)}/${String(rows.length)} of their marches dominated, ` +
      `${String(unfitted)} with no stop of ours inside them`;
    if (pinned.matched.fits) {
      // Their budget had a stop of ours inside it when this was pinned; a run where none fits any more has
      // taken the bar out of the comparison, which is the regression G0 describes on three other armies.
      expect.soft(hardest?.ours != null, `a stop of ours still fits their hardest march (${how})`).toBe(true);
      if (hardest?.ours && pinned.matched.delta !== undefined) {
        expect
          .soft(hardest.delta, `the bar against their hardest march at matched spend (${how})`)
          .toBeGreaterThanOrEqual(pinned.matched.delta);
      }
    } else if (hardest?.ours) {
      // Pinned at "nothing of ours fits" and something now does: the coverage defect is being fixed, so it
      // is reported rather than failed, and the owner registers the new floor when he judges it.
      process.stdout.write(
        `  matched spend — ${scenario.label}: a stop now fits their hardest march (${pct(hardest.delta)})\n`,
      );
    }
    // **`rowsBeaten` is reported and not pinned**, deliberately. It counts marches in a *captured fixture*
    // (`totalstack-rows.ts`), and the row set moves when a capture lands: the capture of 2026-09-22 took
    // `his usual setup` from +27.9 % to +4.3 % by adding rows nobody's engine had touched. An absolute count
    // over a set the engine does not control would go red on a fixture edit and stay green while a row we
    // lose is added — a discrepancy manufactured by a data file, which is the one thing a non-regression pin
    // must not be. The delta above is a ratio against a **named** row, so it moves only when a march does.
    process.stdout.write(`  matched spend — ${scenario.label}: ${how}\n`);
  }
}

// ---- the suite -------------------------------------------------------------------------------------------

mkdirSync(OUT, { recursive: true });
writeFileSync(
  REPORT,
  '# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`\n\n' +
    'Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate ' +
    'four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. ' +
    'Each march priced by `simulateBattle` on its counts — damage, retraining silver and the gold its hired ' +
    'stacks cost to revive (the gold column since S-90, 2026-09-18).\n\n' +
    '**`a hired`, `a soldier` and `a monster` are each that group\u2019s own damage over its own chunks ' +
    'since S-105** (2026-09-19; the owner: *"dmg per hired is still broken: it shows a damage per hired ' +
    'almost above total damage"*). The numerator is the group\u2019s share of the same enemy-first journal ' +
    'the damage column is summed from, so the three are shares of that column. They divided the campaign\u2019s ' +
    'whole damage until this run, which credited a chunk of rare stock with every point the troops struck ' +
    'for.\n\n' +
    'The last six columns are the rare stock read the way the owner asked for it on 2026-09-19 (S-98): the ' +
    'chunks of ten told apart into **hired soldiers** and **monsters** — monster mercenaries and ' +
    'dominance monsters together, `isMonsterUnit` in `tests/engine/plan-yardsticks.ts` — the dragon coins ' +
    'the monsters cost to recruit again, and damage a soldier, damage a monster and damage a dragon coin ' +
    'beside damage a hired unit. A campaign that spent none of one kind reads its ratio at `damage / 1`, ' +
    'exactly as `a hired` has always done.\n\n' +
    '**`hired burned` is the `authority` pool alone since S-102** (2026-09-19; the owner: *"apart from ' +
    'mercs, they [monsters] can be trained just like troops"*). A mercenary is hired and revived for gold, ' +
    'so it is a stock a march does not get back; a dominance monster is trained again ten at a time for ' +
    'silver, queue time and dragon coins, so it is a **price** and it leaves the burn. `soldiers burned + ' +
    'monsters burned = hired burned` therefore holds on every army that houses no dominance unit — all but ' +
    'the monster camp below — and on that one the difference is exactly the dominance chunks, which the ' +
    'dragon-coin column prices.\n\n' +
    '**Every algorithm the app offers has a row since S-118** (2026-09-21; the owner: *"make it run for ' +
    'all our algorithm in the future"*): the two sizers, the three sizer switches under them (the two ' +
    'monster ceilings only where a dominance pool exists, being a copy of the plain row otherwise), and ' +
    '**all five objectives** — this table asked only for average damage until then. The **troops** column ' +
    'is what those rows needed to be readable: it is the troop types the first march fields and the ' +
    'leadership it spends, and it reads **none** where an objective left every troop type at home. That ' +
    'happens on **8 of the 227** rows, and it is not new — `Troops first · Generate (average damage)` has ' +
    'been an empty march on the evening account and on Aydae-alone since S-101, showing only as a damage ' +
    'figure four times too low. The added rows are `variant` kind, so **no pin moves**: `bestSizer` is ' +
    'still the two plain sizers and their average-damage Generate.\n\n' +
    'Under each table, the **goal line** (S-101): the plan’s best stop against the captured `TotalStack · ' +
    'Total Optimization` row on the owner’s own three readings — damage a silver, damage a hired soldier ' +
    'and damage a monster — with `✓` at or above 1.0 and `✗` below it. The floors pinned on those three ' +
    'are today’s measured figures, so a `✗` is a discrepancy to judge and not a failing test.\n\n' +
    `Run: ${new Date().toISOString()}, commit ${process.env.GIT_COMMIT ?? '(working tree)'}\n\n`,
);
writeFileSync(FIGURES, `${JSON.stringify({ run: new Date().toISOString(), scenarios: [] }, null, 1)}\n`);
appendFileSync(
  REPORT,
  BASELINE === null
    ? 'No baseline is registered (`tests/engine/plan-baseline.json` is absent or still reads ' +
        '`registeredBy: null`), so **no row below is held to a previous run**. `pnpm bench:baseline` writes ' +
        'a proposal for the owner to register.\n\n'
    : `Held against the baseline ${BASELINE.registeredBy ?? ''} registered on ${BASELINE.registeredAt ?? '—'}` +
        ` (${BASELINE.reading}): no stop may hit less hard, cost more silver or burn more of the stock than` +
        ' the figures in `tests/engine/plan-baseline.json`.\n\n',
);

const runAll = (cases: Scenario[]): void => {
  for (const scenario of cases) {
    test(
      scenario.label,
      () => {
        const measured = measure(scenario);
        record(scenario.label, measured);
        checkBaseline(scenario, measured);
        check(scenario, measured);
      },
      300_000,
    );
  }
};

describe('the plan against Tier ladder, Troops first and the other calculators, over four marches', () => {
  runAll(commonScenarios());
});

describe.skipIf(!existsSync(OWNER_EXPORT))('the same, on the owner’s account', () => {
  const profile = ownerProfile();
  runAll(profile ? ownerScenarios(profile) : []);
});

/**
 * **The standing, over every army the run measured** (S-121, 2026-09-22) — the two tables
 * `docs/plans/beating-totalstack.md` opens with, written out of this run's own payload so the plan is a
 * reading of the benchmark and never a memory of one.
 *
 * It is registered **after both describes** and reads `benchmark-latest.json`, which `record` has appended
 * to once per scenario by then. `record` runs before `checkBaseline` and `check` inside every test, so an
 * army whose pins are red is still counted here — a standing that silently dropped the failing armies would
 * flatter exactly the cases this file exists to watch.
 *
 * **The two aggregate pins are §7's**: *"Silver and queue are what the plan is for; a change that buys
 * damage by spending freely is a different product, not a better one."* They are the only floors here, and
 * they are floors on **counts of armies**, so a change that trades a silver win for a damage win on one army
 * is red and the owner registers it if the trade is one he wants.
 */
// 17 → 18 on 2026-09-24 (experiment 174): his browser setup of that day, which carries no captured row and so
// no matched-spend reading — the two floors below count the same seventeen armies.
const ARMIES_MEASURED = 18;
/**
 * **Armies where our best stop beats their best comparable march on that marker alone** — measured on the
 * payload of 2026-09-22, never taken from the plan's prose.
 *
 * Only the two §7 names are floored, and each sits exactly at what the run measures: *"Silver and queue are
 * what the plan is for; a change that buys damage by spending freely is a different product, not a better
 * one."* The other four are reported and not floored — damage, burn, gold and the coins are where the work
 * of §5 happens, and a floor on them would go red for the change being made rather than for a regression.
 */
const MARKER_WINS: Partial<Record<(typeof MARKERS)[number][0], number>> = {
  silver: 13,
  // Registered by the owner 2026-09-24 (W11–W13 trades, "register them all"): 12 → 9. The reading guard
  // decided by the rating (6fe913c) gives up shortest queue by +0.07–0.08 % on seven armies for rated gains;
  // the gated finale (7fe146c) won one back.
  seconds: 9,
};
/** Armies the bar dominates at matched spend on their hardest comparable march — §2's count, measured. */
const ARMIES_BEATEN = 5;

describe('the standing at matched spend, over every army above', () => {
  test('writes it, and holds the two floors §7 names', () => {
    const figures = JSON.parse(readFileSync(FIGURES, 'utf8')) as {
      scenarios: {
        label: string;
        planMs: number;
        searchMs: number;
        searchCalls: number;
        planBudgetMs: number;
        searchBudgetMs: number;
        planBudgetBound: boolean;
        matched?: {
          verdict: string;
          hardest: string | null;
          ourStop: string | null;
          delta: number | null;
          over: string[];
          rows: number;
          rowsBeaten: number;
          unfitted: number;
          anythingBeaten: number;
          worst: { name: string; delta: number } | null;
          floors: { marker: string; ours: number; theirs: number; standing: string }[];
        } | null;
      }[];
    };
    const measured = figures.scenarios.filter((one) => one.matched?.hardest);
    const lines = [
      '',
      '## The standing at matched spend',
      '',
      'The reading the owner’s definition of *beating* another calculator reduces to (2026-09-21: ' +
        '*"beat means using constrained resources to produce better damage with a fixed ' +
        'silver/merc/gold/dragon coins set"*), asked of every army above: **their hardest comparable march, ' +
        `our best stop that spends no more of any of the four costs within ${(TOLERANCE * 100).toFixed(0)} %, ` +
        'and the damage between them.** The ratio floors under each table are the derived reading — a stop ' +
        'that costs no more and hits harder is more efficient on all of them at once.',
      '',
      '| army | verdict | their hardest march | our stop | Δ | of their marches | none fits | any algorithm |',
      '|---|---|---|---|---|---|---|---|',
      ...measured.map((one) => {
        const m = one.matched;
        if (!m) return '';
        return (
          `| ${one.label} | **${m.verdict}** | ${m.hardest ?? '—'} | ${m.ourStop ?? `— (over ${m.over.join(', ')})`} | ` +
          `${m.delta === null ? '—' : `${m.delta >= 0 ? '+' : ''}${(m.delta * 100).toFixed(1)} %`} | ` +
          `${String(m.rowsBeaten)}/${String(m.rows)} | ${String(m.unfitted)} | ${String(m.anythingBeaten)}/${String(m.rows)} |`
        );
      }),
      '',
      'The last column is the diagnostic, never a verdict: how many of their marches **any** algorithm the ' +
        'app offers would have dominated — the sizers, their switches and all five objectives. An army ' +
        'where it is ahead of the column beside it is an army where the damage is provably reachable and ' +
        'the bar is simply not reaching it.',
      '',
      '### The six markers',
      '',
      'Our best stop against their best comparable march **on each marker alone**, counted over the armies ' +
        'above. Read them as floors rather than as the goal: winning a marker by fielding a tiny march is ' +
        'not winning, which is what the table above is for.',
      '',
      '| marker | direction | we win | tie | we lose |',
      '|---|---|---|---|---|',
    ];
    const counts = new Map<string, { win: number; tie: number; lose: number }>();
    for (const one of measured) {
      for (const floor of one.matched?.floors ?? []) {
        const into = counts.get(floor.marker) ?? { win: 0, tie: 0, lose: 0 };
        into[floor.standing as 'win' | 'tie' | 'lose'] += 1;
        counts.set(floor.marker, into);
      }
    }
    for (const [marker, direction] of MARKERS) {
      const c = counts.get(marker) ?? { win: 0, tie: 0, lose: 0 };
      lines.push(`| ${marker} | ${direction} | ${String(c.win)} | ${String(c.tie)} | ${String(c.lose)} |`);
    }
    /**
     * **Where the time goes, and where a clock is actually binding** (S-124, 2026-09-22; the owner: *"pin
     * where we spend time and especially where we're constrained by a budget"*).
     *
     * **Nothing here is asserted.** A timing floor would be red on a slower machine and green on a faster
     * one, which is the opposite of what every other line in this file does. It is written down because the
     * distinction it draws decides what a performance change is *worth*: on an army whose planner ran out of
     * clock, a faster engine returns a **better plan**; on one that finished early, it returns the same plan
     * sooner. Those are different products and they were being argued for interchangeably.
     */
    const bound = figures.scenarios.filter((one) => one.planBudgetBound);
    lines.push(
      '',
      '### Where the time goes, and where a clock binds',
      '',
      'Not asserted, and deliberately — a timing floor would be red on a slow machine. It is here because ' +
        'it decides what a speed-up is **worth**. `planCampaign` on an army marked *bound* stopped because ' +
        'it ran out of clock rather than out of ideas, so making it faster buys a **better plan**; ' +
        'everywhere else a speed-up buys the same plan sooner and nothing more.',
      '',
      '| army | planner | of its budget | bound? | search, all calls | a call | of its budget |',
      '|---|---|---|---|---|---|---|',
      ...figures.scenarios.map((one) => {
        const planShare = ((one.planMs / Math.max(1, one.planBudgetMs)) * 100).toFixed(0);
        // The search budget is **per call** and `searchMs` is the sum of forty of them, so the share is
        // taken on the average call. Summing them against one budget would read 979 % and mean nothing.
        const perCall = one.searchMs / Math.max(1, one.searchCalls);
        const searchShare = ((perCall / Math.max(1, one.searchBudgetMs)) * 100).toFixed(0);
        return (
          `| ${one.label} | ${n(one.planMs)} ms | ${planShare} % | ` +
          `${one.planBudgetBound ? '**yes**' : 'no'} | ${n(one.searchMs)} ms over ${String(one.searchCalls)} | ` +
          `${n(perCall)} ms | ${searchShare} % |`
        );
      }),
      '',
      `**${String(bound.length)} of ${String(figures.scenarios.length)}** armies leave the planner ` +
        `budget-bound${bound.length > 0 ? `: ${bound.map((one) => one.label).join('; ')}` : ''}, and the ` +
        'priority search is bound on none of them either.',
      '',
      '**So on this table a speed-up buys latency and not answer quality**, and that is worth stating ' +
        'plainly because it is the opposite of what the engine felt like. The one army measured to fill ' +
        'its clock is the **20 000-dominance camp** (experiment 129: 40,843–40,934 ms against a 40,000 ms ' +
        'cap), and it is not a scenario here *precisely because* it does not converge — which is what W3 ' +
        'is for. Until W3 registers it, "faster means better answers" is a claim about **one army, and it ' +
        'is not on this table**.',
      '',
      'The other reading: the priority search costs far more of a run than the planner does — 78 s over ' +
        'forty calls against 9.6 s on the monster camp — and within a call the **sizer** is 85–90 % of it ' +
        '(experiment 131). A run that wants to be shorter goes after `stacker.ts`.',
    );
    const beaten = measured.filter((one) => one.matched?.verdict === 'beat').length;
    lines.push(
      '',
      `**${String(beaten)} of ${String(measured.length)}** armies are beaten at matched spend on their ` +
        `hardest comparable march; ${String(
          measured.filter((one) => one.matched?.verdict === 'no stop fits').length,
        )} have no stop of ours inside their budget at all.`,
      '',
    );
    appendFileSync(REPORT, `${lines.join('\n')}\n`);
    /**
     * **The floors below are held only on a whole run**, and the standing is written either way.
     *
     * They are counts *over armies*, so a run that measured a different set of armies is not a run they mean
     * anything on. Two things produce one and they behave differently:
     *
     *  - **A tree without the owner's export.** The second `describe` is skipped, only the common cases run,
     *    and this test still runs — so it writes the standing, says how many armies it saw, and holds
     *    nothing. A floor of "13 armies win on silver" against six armies would be red for the machine
     *    rather than for the engine.
     *  - **A `-t` filter**, the normal way to iterate on one army of a three-minute suite. This test is
     *    filtered out with everything else, so nothing here runs at all — and that is why the committed
     *    artefacts are written through `benchmark-run.*` and promoted only from here (see `REPORT`).
     *
     * `--shard` is **not** one of them: vitest shards by file, so this single file is never split.
     *
     * A *lost* army is a partial run too — `measure` throwing skips `record` — and that is the right
     * outcome: the army's own test is red where the throw happened, and this table says it is not holding
     * its floors rather than quietly counting sixteen as seventeen.
     */
    if (figures.scenarios.length !== ARMIES_MEASURED) {
      process.stdout.write(
        `  the standing — ${String(figures.scenarios.length)} of ${String(ARMIES_MEASURED)} armies ran, so ` +
          'the floors are not held and `benchmark-latest.{md,json}` are left as they were\n',
      );
      return;
    }
    // A whole run, so it may speak for the committed artefacts.
    copyFileSync(REPORT, FINAL_REPORT);
    copyFileSync(FIGURES, FINAL_FIGURES);
    for (const [marker, floor] of Object.entries(MARKER_WINS)) {
      expect
        .soft(
          counts.get(marker)?.win ?? 0,
          `armies where our best stop wins on ${marker} alone (§7: what the plan is for)`,
        )
        .toBeGreaterThanOrEqual(floor);
    }
    expect.soft(beaten, 'armies beaten at matched spend').toBeGreaterThanOrEqual(ARMIES_BEATEN);
  });
});
