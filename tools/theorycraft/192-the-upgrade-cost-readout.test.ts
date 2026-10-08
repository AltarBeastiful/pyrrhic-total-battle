/**
 * 192 — **the upgrade cost readout** (W17 Phase 04b; owner, 2026-10-08: *"damage alone is not enough"*): what
 * each default upgrade costs the march beside the damage it brings, read exactly as the card reads it.
 *
 * The advisor's default pass (`runAdvisor` over the 29 `genericProbes()`, `src/worker/advisor.ts`) on every
 * benchmark army and on the owner's account of 2026-10-07 (`pyrrhic-my-account-2026-10-07.json` at the
 * repository root, read only and never committed; `PYRRHIC_EXPORT_2026_10_07` names another path), planned as
 * the app plans it (`buildPlanRequest`, its active setup). One lane in Node, no clock in any job, as in
 * experiment 191. Each row is read on the sweet spot, the stop the card headlines by default, and the march
 * cost is the card's own: `costChange` (the bill of the reading the gain is, minus the current march's) and
 * `outstandingSeconds` under `CAMPAIGN.outstandingTraining`, printed with the card's notation (`compactTwo`,
 * `duration`).
 *
 * Writes `tools/theorycraft/out/192-the-upgrade-cost-readout.md`: per army the top 10 default upgrades (gain,
 * damage, silver, gold and training-time change, the line the card prints); how often the training time passes
 * the shipped bound, each half of it alone, and a grid of other bounds; how often the best gain is also the
 * costliest row; and what the line leaves out (the mercs lost, which the rating weighs). Display only: nothing
 * here changes a rating, a ranking or the constant.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/192-the-upgrade-cost-readout.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import {
  costChange,
  gainReading,
  headlineOf,
  outstandingSeconds,
  type AdvisorRow,
  type CostChange,
  type StopAdvice,
  type TrainingBound,
} from '../../src/engine/advisor';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes, type ProbeFamily } from '../../src/engine/probes';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { compactTwo, duration } from '../../src/ui/sections/march/format';
import { runAdvisor } from '../../src/worker/advisor';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';

const OWNER_2026_10_07 = process.env.PYRRHIC_EXPORT_2026_10_07 ?? 'pyrrhic-my-account-2026-10-07.json';
const OWNER_LABEL = 'his account of 2026-10-07';
const OUT = 'tools/theorycraft/out/192-the-upgrade-cost-readout.md';
const TOP = 10;
const SHIPPED: TrainingBound = CAMPAIGN.outstandingTraining;
/** The bounds the report measures beside the shipped one: a share of the current queue × a floor in seconds. */
const SHARES = [0.01, 0.02, 0.05, 0.1, 0.2, 0.3] as const;
const FLOORS = [
  { seconds: 3_600, name: '1 h' },
  { seconds: 4 * 3_600, name: '4 h' },
  { seconds: 12 * 3_600, name: '12 h' },
  { seconds: 86_400, name: '1 d' },
] as const;
const FAMILIES: readonly ProbeFamily[] = ['health', 'strength', 'housing'];

/** Inline clients that report a worker: the pool runs its lane in this thread, as in `advisor.test.ts`. */
function lanes(): CalcClient {
  return { ...createInlineClient(), mode: 'worker' };
}

const f = (value: number, digits = 2): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const signed = (value: number, digits = 0): string =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${f(Math.abs(value), digits)}`;
const pct = (part: number, whole: number): string => (whole === 0 ? '—' : `${f((part / whole) * 100, 1)} %`);
const share = (part: number, whole: number): string =>
  `${String(part)}/${String(whole)} (${pct(part, whole)})`;
const time = (seconds: number): string =>
  seconds === 0 ? '0' : `${seconds > 0 ? '+' : '−'}${duration(Math.abs(seconds))}`;
/** A change over the figure it changes, signed, "—" over nothing. */
const over = (change: number, base: number): string =>
  base === 0 ? '—' : `${signed((change / base) * 100, 1)} %`;
/** Today in the owner's time zone, as `YYYY-MM-DD`. */
const today = (): string => new Date().toLocaleDateString('sv-SE');

/** The owner's account of 2026-10-07 as the app plans it: its active setup through `buildPlanRequest`. */
function ownerAccount(): { label: string; input: CampaignInput } | null {
  if (!existsSync(OWNER_2026_10_07)) return null;
  const parsed = parseImport(readFileSync(OWNER_2026_10_07, 'utf8'));
  if (parsed.kind !== 'profile') return null;
  const profile = parsed.payload;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  if (setup === undefined) return null;
  const { leadership, authority, dominance } = setup.housing;
  const mercs = profile.mercenaries.selected
    .map((one) => (one.cap === null ? one.id : `${one.id} ${String(one.cap)}`))
    .join(', ');
  return {
    label: `${OWNER_LABEL} (setup "${setup.name}": ${String(leadership)} / ${String(authority)} / ${String(
      dominance,
    )}; mercs ${mercs})`,
    input: buildPlanRequest(profile, setup),
  };
}

/** One figure the card prints in the march-cost line: the purse, its size in the card's notation, its way. */
interface Printed {
  word: 'silver' | 'gold' | 'training';
  short: string;
  rises: boolean;
}

/**
 * **The line the card prints** under a row (`MarchCost`, `src/ui/sections/march/AdvisorCard.tsx`), without its
 * glyphs: silver and gold where `compactTwo` of the change is not "0", the time where `outstandingSeconds`
 * returns it; what rises after "costs" with a plus, what falls after "saves". Empty when nothing is printed.
 */
function printedFigures(stop: StopAdvice, bound: TrainingBound = SHIPPED): Printed[] {
  const change = costChange(stop);
  if (change === null) return [];
  const out: Printed[] = [];
  for (const word of ['silver', 'gold'] as const) {
    const short = compactTwo(Math.abs(change[word]));
    if (short !== '0') out.push({ word, short, rises: change[word] > 0 });
  }
  const seconds = outstandingSeconds(stop.current.bill, change, bound);
  if (seconds !== null)
    out.push({ word: 'training', short: duration(Math.abs(seconds)), rises: seconds > 0 });
  return out;
}

function cardLine(figures: readonly Printed[]): string {
  const groups = [
    { verb: 'costs', sign: '+', figures: figures.filter((one) => one.rises) },
    { verb: 'saves', sign: '', figures: figures.filter((one) => !one.rises) },
  ].filter((group) => group.figures.length > 0);
  return groups
    .map(
      (group) =>
        `${group.verb} ${group.figures.map((one) => `${group.sign}${one.short} ${one.word}`).join(', ')}`,
    )
    .join('; ');
}

/** A gaining reading (a row with a gain on one stop), with what the card and the threshold read off it. */
interface Gaining {
  family: ProbeFamily;
  stop: StopAdvice;
  change: CostChange;
  /** The mercs and dragon coins the reading the gain is loses, minus the current march's: rated, not printed. */
  mercs: number;
  coins: number;
  /** The current march's training queue, in seconds. */
  queue: number;
  /** The size of the time change over the current queue; 0 when neither moves, infinite when only it does. */
  ratio: number;
  /** What the card prints under the row, figure by figure. */
  printed: Printed[];
}

function gainingOf(row: AdvisorRow, stop: StopAdvice | undefined): Gaining | null {
  if (stop === undefined) return null;
  const change = costChange(stop);
  const reading = gainReading(stop);
  if (change === null || reading === null) return null;
  const queue = stop.current.bill.seconds;
  const size = Math.abs(change.seconds);
  return {
    family: row.family,
    stop,
    change,
    mercs: reading.bill.hired - stop.current.bill.hired,
    coins: reading.bill.dragonCoins - stop.current.bill.dragonCoins,
    queue,
    ratio: size === 0 ? 0 : queue <= 0 ? Infinity : size / queue,
    printed: printedFigures(stop),
  };
}

const unmoved = (one: Gaining): boolean =>
  one.change.silver === 0 && one.change.gold === 0 && one.change.seconds === 0;
const prints = (one: Gaining, word: Printed['word']): boolean =>
  one.printed.some((figure) => figure.word === word);
const saves = (one: Gaining): boolean => one.printed.some((figure) => !figure.rises);

/** What the card shows under a gaining row, or why it shows nothing. */
function lineOf(one: Gaining): string {
  if (one.printed.length > 0) return cardLine(one.printed);
  return unmoved(one) ? '(no line: the bill does not move)' : '(no line: under what the card prints)';
}

const passes = (one: Gaining, bound: TrainingBound): boolean =>
  outstandingSeconds({ seconds: one.queue }, one.change, bound) !== null;

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return Number.NaN;
  const at = Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))));
  return sorted[at] ?? Number.NaN;
}

/** One population of gaining readings under the shipped bound: each half alone, and both. */
function thresholdRow(name: string, all: readonly Gaining[]): string {
  const n = all.length;
  const moved = all.filter((one) => one.change.seconds !== 0).length;
  const shareAlone = all.filter((one) => Math.abs(one.change.seconds) > SHIPPED.share * one.queue).length;
  const floorAlone = all.filter((one) => Math.abs(one.change.seconds) > SHIPPED.seconds).length;
  const both = all.filter((one) => passes(one, SHIPPED)).length;
  const rises = all.filter((one) => passes(one, SHIPPED) && one.change.seconds > 0).length;
  return `| ${name} | ${String(n)} | ${share(moved, n)} | ${share(shareAlone, n)} | ${share(floorAlone, n)} | **${share(both, n)}** | ${String(rises)} / ${String(both - rises)} |`;
}

function gridRows(readings: readonly Gaining[]): string[] {
  const n = readings.length;
  return SHARES.map((part) => {
    const cells = FLOORS.map((floor) => {
      const bound = { share: part, seconds: floor.seconds };
      const count = readings.filter((one) => passes(one, bound)).length;
      const mark = part === SHIPPED.share && floor.seconds === SHIPPED.seconds ? '**' : '';
      return `${mark}${share(count, n)}${mark}`;
    });
    return `| ${f(part * 100, 0)} % | ${cells.join(' | ')} |`;
  });
}

function spreadRow(name: string, readings: readonly Gaining[]): string {
  const ratios = readings.map((one) => one.ratio).sort((a, b) => a - b);
  const hours = readings.map((one) => Math.abs(one.change.seconds) / 3_600).sort((a, b) => a - b);
  const r = (q: number): string => {
    const value = quantile(ratios, q);
    return Number.isFinite(value) ? `${f(value * 100, 1)} %` : '∞';
  };
  const h = (q: number): string => f(quantile(hours, q), 1);
  return `| ${name} | ${String(readings.length)} | ${r(0.25)} · ${r(0.5)} · ${r(0.75)} · ${r(0.9)} · ${r(1)} | ${h(0.25)} · ${h(0.5)} · ${h(0.75)} · ${h(0.9)} · ${h(1)} |`;
}

/** Per probe family, over the gaining rows given: what moves and what the card prints. */
function familyRow(family: ProbeFamily, all: readonly Gaining[]): string {
  const rows = all.filter((one) => one.family === family);
  const n = rows.length;
  const moved = rows.filter((one) => one.change.silver !== 0);
  const silverShares = moved
    .map((one) => (one.change.silver / one.stop.current.bill.silver) * 100)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const range =
    silverShares.length === 0
      ? '—'
      : `${signed(silverShares[0] ?? 0, 1)} % … ${signed(quantile(silverShares, 0.5), 1)} % … ${signed(
          silverShares.at(-1) ?? 0,
          1,
        )} %`;
  const count = (test: (one: Gaining) => boolean): number => rows.filter(test).length;
  return `| ${family} | ${String(n)} | ${String(count(unmoved))} | ${String(count((one) => one.printed.length > 0))} | ${String(
    count((one) => one.change.silver > 0),
  )} / ${String(count((one) => one.change.silver < 0))} | ${String(count((one) => one.change.gold > 0))} / ${String(
    count((one) => one.change.gold < 0),
  )} | ${String(count((one) => prints(one, 'training')))} | ${String(count((one) => one.mercs !== 0))} | ${range} |`;
}

/** One purse's printed figures, by their size over the current march's own figure in that purse. */
function smallRow(word: 'silver' | 'gold', all: readonly Gaining[]): string {
  const printed = all.filter((one) => prints(one, word));
  const sizes = printed.map((one) => Math.abs(one.change[word]) / one.stop.current.bill[word]);
  const under = (bound: number): number => sizes.filter((size) => size < bound).length;
  const n = printed.length;
  return `| ${word} | ${String(n)} | ${share(under(0.001), n)} | ${share(under(0.01), n)} | ${share(
    under(0.1),
    n,
  )} | ${share(n - under(0.1), n)} |`;
}

type Purse = 'silver' | 'gold' | 'seconds';

/**
 * **Is `best` the costliest of `rows` in `purse`**: the largest rise among the gaining rows. `null` when no
 * gaining row raises that purse at all (a saving is never called the costliest).
 */
function isCostliest(best: Gaining, rows: readonly Gaining[], purse: Purse): boolean | null {
  const top = Math.max(...rows.map((one) => one.change[purse]));
  if (!(top > 0)) return null;
  return best.change[purse] === top;
}

interface Standing {
  army: string;
  best: string;
  bestLine: string;
  bestDamage: string;
  /** Per purse, for the best gain and for the best damage: costliest, not, or no row rises. */
  byGain: Record<Purse, boolean | null>;
  byDamage: Record<Purse, boolean | null>;
}

const yes = (value: boolean | null): string => (value === null ? 'no rise' : value ? '**yes**' : 'no');

describe.skipIf(!process.env.THEORY)('192 — the upgrade cost readout', () => {
  it('reads what each default upgrade costs the march, on every benchmark army and the owner account', async () => {
    const profile = ownerProfile();
    const scenarios: { label: string; input: CampaignInput }[] = [];
    const account = ownerAccount();
    if (account !== null) scenarios.push(account);
    for (const scenario of [...(profile ? ownerScenarios(profile) : []), ...commonScenarios()]) {
      scenarios.push({
        label: scenario.label,
        input: {
          request: scenario.request,
          marchTarget: HORIZON,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        },
      });
    }
    const probes = genericProbes();
    const summary: string[] = [];
    const sections: string[] = [];
    const standings: Standing[] = [];
    const headAll: Gaining[] = [];
    const headTop: Gaining[] = [];
    const everyStop: Gaining[] = [];
    const ownerHead: Gaining[] = [];
    let armiesRead = 0;

    for (const { label, input } of scenarios) {
      // The 20 000-dominance camp's baseline alone is a minute on one lane (experiment 191): it runs under the
      // real 20 s clock and reports what was cut; the others run uncapped so every probe is read.
      const big = label.includes('20 000 dominance');
      const budgetMs = big ? CAMPAIGN.budgets.extra : 900_000;
      const pool = createCalcPool({ size: 1, createClient: lanes });
      const began = performance.now();
      let result;
      try {
        result = await runAdvisor(input, probes, pool, { budgetMs });
      } catch (error) {
        pool.dispose();
        const message = error instanceof Error ? error.message : String(error);
        summary.push(`| ${label} | — | — | — | — | — | — | — | refused: ${message} |`);
        sections.push(`## ${label}\n\nThe advisor's baseline did not run: ${message}\n`);
        continue;
      }
      const wall = performance.now() - began;
      pool.dispose();
      const rows: AdvisorRow[] = result.rows;
      if (result.baseline === null || rows.length === 0) {
        summary.push(
          `| ${label} | ${String(result.baseline?.length ?? 0)} | ${String(rows.length)}/${String(probes.length)} | — | — | — | — | — | cut (${f(wall, 0)} ms; clock ${String(budgetMs)} ms) |`,
        );
        sections.push(
          `## ${label}\n\nNothing read: ${String(result.cut.length)} of ${String(probes.length)} probes cut${
            result.baseline === null ? ', the baseline among them' : ''
          } (${f(wall, 0)} ms wall, clock ${String(budgetMs)} ms).\n`,
        );
        continue;
      }
      armiesRead += 1;

      const heads = rows.map((row) => gainingOf(row, headlineOf(row)));
      const gainingHeads = heads.filter((one): one is Gaining => one !== null);
      const topHeads = heads.slice(0, TOP).filter((one): one is Gaining => one !== null);
      const stops = rows
        .flatMap((row) => row.stops.map((stop) => gainingOf(row, stop)))
        .filter((one): one is Gaining => one !== null);
      headAll.push(...gainingHeads);
      headTop.push(...topHeads);
      everyStop.push(...stops);
      if (label.startsWith(OWNER_LABEL)) ownerHead.push(...gainingHeads);

      const count = (test: (one: Gaining) => boolean): number => gainingHeads.filter(test).length;
      const withLine = count((one) => one.printed.length > 0);
      const withSilver = count((one) => prints(one, 'silver'));
      const withGold = count((one) => prints(one, 'gold'));
      const withTime = count((one) => prints(one, 'training'));
      const stillBill = count((one) => one.printed.length === 0 && unmoved(one));
      const underPrint = count((one) => one.printed.length === 0 && !unmoved(one));
      const stopsTimed = stops.filter((one) => passes(one, SHIPPED)).length;

      // The best gain is the ranking's first row (the card's first line); the best damage the top 10's largest.
      const first = heads[0] ?? null;
      const bestDamage = topHeads.reduce<Gaining | null>(
        (best, one) => (best === null || one.stop.damagePercent > best.stop.damagePercent ? one : best),
        null,
      );
      const firstRow = rows[0];
      if (first !== null && bestDamage !== null && firstRow !== undefined) {
        const damageRow = rows.find((row) => headlineOf(row) === bestDamage.stop);
        standings.push({
          army: label,
          best: firstRow.id,
          bestLine: lineOf(first),
          bestDamage: damageRow?.id ?? '?',
          byGain: {
            silver: isCostliest(first, topHeads, 'silver'),
            gold: isCostliest(first, topHeads, 'gold'),
            seconds: isCostliest(first, topHeads, 'seconds'),
          },
          byDamage: {
            silver: isCostliest(bestDamage, topHeads, 'silver'),
            gold: isCostliest(bestDamage, topHeads, 'gold'),
            seconds: isCostliest(bestDamage, topHeads, 'seconds'),
          },
        });
      }

      summary.push(
        `| ${label} | ${String(result.baseline.length)} | ${String(rows.length)}/${String(probes.length)} | ${String(
          gainingHeads.length,
        )} | ${String(withLine)} | ${String(withSilver)} · ${String(withGold)} · ${String(withTime)} | ${String(
          stillBill,
        )} · ${String(underPrint)} | ${share(stopsTimed, stops.length)} | ${f(wall, 0)} |`,
      );

      const sweet = result.baseline.find((stop) => stop.pick === 'sweet-spot') ?? result.baseline[0];
      const now = sweet?.march.bill;
      sections.push(`## ${label}\n`);
      sections.push(
        `Baseline bar: ${result.baseline.map((stop) => stop.pick).join(' · ')}. ${String(rows.length)} of ${String(
          probes.length,
        )} probes read, ${String(result.cut.length)} cut, ${String(result.failed.length)} failed (${f(wall, 0)} ms wall).${
          now === undefined
            ? ''
            : ` The headline stop (${sweet?.pick ?? '?'}) now: damage ${f(now.damage, 0)}, silver ${f(now.silver, 0)}, gold ${f(
                now.gold,
                0,
              )}, training ${duration(now.seconds)} (${f(now.seconds, 0)} s), ${f(now.hired, 0)} mercs lost.`
        } On it ${String(gainingHeads.length)} of ${String(rows.length)} rows gain; the card prints a cost line on ${String(
          withLine,
        )} of them (silver on ${String(withSilver)}, gold on ${String(withGold)}, training time on ${String(withTime)}).\n`,
      );
      sections.push(
        '| rank | probe | gain (rating) | damage % | read from | Δ silver (of march) | Δ gold (of march) | Δ training (of queue) | Δ mercs lost | the card prints |\n|---|---|---|---|---|---|---|---|---|---|',
      );
      rows.slice(0, TOP).forEach((row, index) => {
        const stop = headlineOf(row);
        if (stop === undefined) return;
        const one = gainingOf(row, stop);
        if (one === null) {
          sections.push(
            `| ${String(index + 1)} | ${row.id} | ${f(stop.gain, 4)} | — | no gain | — | — | — | — | (no line: no gain) |`,
          );
          return;
        }
        const bill = stop.current.bill;
        sections.push(
          `| ${String(index + 1)} | ${row.id} | ${f(stop.gain, 4)} | ${signed(stop.damagePercent, 3)} | ${
            stop.from ?? ''
          } | ${signed(one.change.silver)} (${over(one.change.silver, bill.silver)}) | ${signed(one.change.gold)} (${over(
            one.change.gold,
            bill.gold,
          )}) | ${time(one.change.seconds)} (${
            Number.isFinite(one.ratio) ? `${f(one.ratio * 100, 1)} %` : '∞'
          }) | ${signed(one.mercs)}${one.coins === 0 ? '' : ` (coins ${signed(one.coins)})`} | ${lineOf(one)} |`,
        );
      });
      sections.push('');
    }

    const standingRows = standings.map(
      (one) =>
        `| ${one.army} | ${one.best} | ${one.bestLine} | ${yes(one.byGain.silver)} | ${yes(one.byGain.gold)} | ${yes(
          one.byGain.seconds,
        )} | ${one.bestDamage} | ${yes(one.byDamage.silver)} | ${yes(one.byDamage.gold)} | ${yes(one.byDamage.seconds)} |`,
    );
    const tallyOf = (pick: (one: Standing) => Record<Purse, boolean | null>, purse: Purse): string => {
      const read = standings.map(pick).map((one) => one[purse]);
      const counted = read.filter((value) => value !== null);
      return `${String(counted.filter(Boolean).length)} of ${String(counted.length)} (${String(read.length - counted.length)} with no rise)`;
    };
    const eitherPurse = (pick: (one: Standing) => Record<Purse, boolean | null>): string => {
      const read = standings.map(pick);
      return `${String(read.filter((one) => one.silver === true || one.gold === true).length)} of ${String(read.length)}`;
    };

    // Over every gaining sweet-spot row: the totals the reading quotes.
    const all = headAll.length;
    const top = headTop.length;
    const topCount = (test: (one: Gaining) => boolean): number => headTop.filter(test).length;
    const allCount = (test: (one: Gaining) => boolean): number => headAll.filter(test).length;
    const losing = headAll.filter((one) => one.stop.damagePercent < 0);
    const hidden = headAll.filter((one) => one.printed.length === 0 && one.mercs !== 0);

    const head = [
      '---',
      'type: experiment',
      'title: "192 — the upgrade cost readout"',
      `created: ${today()}`,
      'tags: [w17, advisor, probes, cost]',
      'related: ["[[Progression-Advisor-Plan]]", "[[advisor-card]]", "[[191-what-a-percent-is-worth]]"]',
      '---',
      '',
      '# 192 — the upgrade cost readout',
      '',
      `The advisor's default pass (\`runAdvisor\` over the ${String(probes.length)} probes of \`genericProbes()\`: +1 point on each of 13 health and 13 strength lines, +1 % of the leadership, authority and dominance pools) on ${String(
        scenarios.length,
      )} armies: ${
        account === null
          ? `the benchmark's (the owner's account of 2026-10-07 was not found at \`${OWNER_2026_10_07}\`)`
          : `the owner's account of 2026-10-07 (\`${OWNER_2026_10_07}\`, read only, planned as the app plans it: \`buildPlanRequest\` on its active setup) and the benchmark's ${String(
              scenarios.length - 1,
            )}`
      }. One lane in Node, no clock in any job (the 20 000-dominance camp alone under the pass's 20 s clock), every march read as the March shows it (Tight). Each row is read on the **sweet spot**, the stop the card headlines by default, and its march cost is the card's own: \`costChange\` (the bill of the reading the gain is, re-planned or re-priced, minus the current march's: silver, gold and training seconds, raw amounts per march) and \`outstandingSeconds\` under the shipped bound \`CAMPAIGN.outstandingTraining\` (${f(
        SHIPPED.share * 100,
        0,
      )} % of the current queue **and** ${duration(SHIPPED.seconds)}, both strictly exceeded), printed with the card's notation (\`compactTwo\`, \`duration\`). Display only: no rating, ranking or constant was changed.`,
      '',
      `Armies read: ${String(armiesRead)} of ${String(scenarios.length)}.`,
      '',
      '## Summary',
      '',
      '"Gaining" is a sweet-spot row with a gain (`costChange` is not null); the card prints a cost line only on those. The printed counts are silver · gold · training time, as the card would print them. "No line" splits the gaining rows the card prints nothing under into those whose bill does not move at all · those whose change is under what the card prints. "Time printed, every stop" counts every gaining probe × stop reading (the folded stops too) whose training time passes the shipped bound.',
      '',
      '| army | stops | probes read | gaining (sweet spot) | cost line printed | silver · gold · time printed | no line: unmoved · under print | time printed, every stop | wall ms |',
      '|---|---|---|---|---|---|---|---|---|',
      ...summary,
      '',
      `Top ${String(TOP)} of every army read: **${String(top)}** gaining rows; the card prints a cost line on **${share(
        topCount((one) => one.printed.length > 0),
        top,
      )}**: silver on ${share(
        topCount((one) => prints(one, 'silver')),
        top,
      )}, gold on ${share(
        topCount((one) => prints(one, 'gold')),
        top,
      )}, training time on ${share(
        topCount((one) => prints(one, 'training')),
        top,
      )}; of the rest, ${share(
        topCount((one) => one.printed.length === 0 && unmoved(one)),
        top,
      )} have a bill that does not move at all and ${share(
        topCount((one) => one.printed.length === 0 && !unmoved(one)),
        top,
      )} move under what the card prints. A line with a saving in it: ${share(topCount(saves), top)}.`,
      '',
      '## By probe family',
      '',
      `Every gaining sweet-spot row of every army read (${String(all)}), by family: how many leave the bill exactly as it is, how many get a line, which way silver and gold move, how many print the time, how many change the mercs lost, and the silver change over the march (smallest … median … largest, over the rows whose silver moves).`,
      '',
      '| family | gaining | bill unmoved | line printed | silver up / down | gold up / down | time printed | mercs lost change | Δ silver over the march |',
      '|---|---|---|---|---|---|---|---|---|',
      ...FAMILIES.map((family) => familyRow(family, headAll)),
      '',
      'How small a printed purse figure gets: silver and gold are printed whenever `compactTwo` of the change is not "0" (any change of one unit or more), with no share of the march as the training time has. The printed figures of every gaining sweet-spot row, by their size over the current march\'s own silver or gold:',
      '',
      '| purse | printed | under 0.1 % of the march | under 1 % | under 10 % | 10 % or more |',
      '|---|---|---|---|---|---|',
      smallRow('silver', headAll),
      smallRow('gold', headAll),
      '',
      '## The training-time bound',
      '',
      `Under the shipped bound (${f(SHIPPED.share * 100, 0)} % of the current queue and ${duration(
        SHIPPED.seconds,
      )}), each half alone and both (what the card prints). "Moved" is a reading whose training seconds change at all. The last column splits the printed ones into rises / savings.`,
      '',
      '| readings | gaining | moved | > 10 % of queue | > 1 h | printed (both) | rise / saving |',
      '|---|---|---|---|---|---|---|',
      thresholdRow('top 10, sweet spot', headTop),
      thresholdRow('all 29, sweet spot', headAll),
      thresholdRow('every probe × stop', everyStop),
      ...(ownerHead.length > 0 ? [thresholdRow(`${OWNER_LABEL}, sweet spot`, ownerHead)] : []),
      '',
      'Spread of the training change on gaining readings: its size over the current queue, and its size in hours, at the 25th · 50th · 75th · 90th percentile · max.',
      '',
      '| readings | n | size of Δ / queue | size of Δ, hours |',
      '|---|---|---|---|',
      spreadRow('top 10, sweet spot', headTop),
      spreadRow('all 29, sweet spot', headAll),
      spreadRow('every probe × stop', everyStop),
      '',
      'The printed count under other bounds (share of the current queue, rows; floor, columns), on the top 10 of every army on the sweet spot; the shipped bound in bold.',
      '',
      `| share \\ floor | ${FLOORS.map((floor) => floor.name).join(' | ')} |`,
      `|---|${FLOORS.map(() => '---').join('|')}|`,
      ...gridRows(headTop),
      '',
      'And on every gaining probe × stop reading (the folded stops too):',
      '',
      `| share \\ floor | ${FLOORS.map((floor) => floor.name).join(' | ')} |`,
      `|---|${FLOORS.map(() => '---').join('|')}|`,
      ...gridRows(everyStop),
      '',
      '## Is the best gain the costliest?',
      '',
      `Per army, among the top ${String(
        TOP,
      )} gaining rows on the sweet spot: is the first row (the best gain on the rating, what the card lists first) the one with the **largest rise** in silver, in gold, in training time (the raw change, printed or not)? And the same for the row with the largest damage change. "no rise" when no gaining top-${String(
        TOP,
      )} row raises that purse (a saving is never called the costliest); ties count as costliest.`,
      '',
      '| army | best gain | its line | costliest silver | costliest gold | costliest time | best damage | costliest silver | costliest gold | costliest time |',
      '|---|---|---|---|---|---|---|---|---|---|',
      ...standingRows,
      '',
      `Best gain is the costliest: silver ${tallyOf((one) => one.byGain, 'silver')}, gold ${tallyOf(
        (one) => one.byGain,
        'gold',
      )}, training ${tallyOf((one) => one.byGain, 'seconds')}; in silver or gold ${eitherPurse((one) => one.byGain)}.`,
      '',
      `Best damage is the costliest: silver ${tallyOf((one) => one.byDamage, 'silver')}, gold ${tallyOf(
        (one) => one.byDamage,
        'gold',
      )}, training ${tallyOf((one) => one.byDamage, 'seconds')}; in silver or gold ${eitherPurse((one) => one.byDamage)}.`,
      '',
      '## What the line leaves out',
      '',
      `The rating weighs five costs (silver, gold, mercs lost, dragon coins, training); the line prints three. Over the ${String(
        all,
      )} gaining sweet-spot rows: ${share(losing.length, all)} gain on the rating while their damage falls, and on those the line reads a saving ${share(
        losing.filter(saves).length,
        losing.length,
      )} and prints nothing ${String(losing.filter((one) => one.printed.length === 0).length)} times; the mercs lost change on ${share(
        allCount((one) => one.mercs !== 0),
        all,
      )} (fewer on ${String(allCount((one) => one.mercs < 0))}, more on ${String(
        allCount((one) => one.mercs > 0),
      )}); the dragon coins on ${share(
        allCount((one) => one.coins !== 0),
        all,
      )}. Rows that print no line while their mercs lost change: ${String(
        hidden.length,
      )}${hidden.length === 0 ? '' : ` (${hidden.map((one) => `${signed(one.mercs)} mercs`).join(', ')})`}.`,
      '',
      `## The top ${String(TOP)} on each army`,
      '',
      'Δ is the reading the gain is minus the current march, per march, exact; in brackets the change over the current march\'s own figure (the training change: its size over the current queue, the figure the bound reads). "Δ mercs lost" is the authority chunks the march loses for good (`hired`, which the rating weighs and the line does not print). "The card prints" is the march-cost line as `MarchCost` writes it, without its glyphs.',
      '',
    ];
    writeFileSync(OUT, [...head, ...sections].join('\n') + '\n');
    expect(armiesRead).toBeGreaterThan(0);
  }, 3_600_000);
});
