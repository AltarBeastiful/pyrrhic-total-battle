/**
 * 112 — **the band's token-field yardstick, re-measured** (owner, 2026-09-19: his camp at 5 100 / 2 200 with
 * 120 hunters, *"more efficient a silver than the sweet spot and it burns less"* — seven troop types and 25
 * hunters for 2 169 458 expected at 1 997 400 silver, 3 chunks burned and 5d 14h of queue — and the bar
 * refuses to carry it).
 *
 * The rule that refuses it is the band's **token field**: `hiredOf(row.counts) * 2 >= goal.hired`, where
 * `goal.hired` is the **winner's** fielded hired. The winner there fields 90, so the band asks 45 and his 25
 * are out. Experiment 108 §A measured five readings of that rule and found exactly one that admits his march
 * without letting in the 506 032-damage extreme — **half the winner's damage** — and declined it, because
 * S-93's tighter shape made both of the day's criteria hold without it and it cost the 7 000 export's sweet
 * spot 16 % of its campaign.
 *
 * Everything under that measurement has since moved: **S-94** put the whole bar on the worst opening (so
 * every damage in 108's tables is a different figure now), **S-96** widened the hired set to every non-
 * leadership pool, and **S-97** added the top-of-the-bar pass and a twelfth benchmark scenario. This file
 * re-measures before anything is built, over the **shared scenario list** the criteria are held on
 * (`criteriaScenarios`, fifteen armies), and on the engine it runs on.
 *
 *  - **§A** the four readings, army by army: the band's size, the whole bar, the stops that move, and the
 *    extreme each reading lets in (the thriftiest **band** plan's damage as a share of the steady max's);
 *  - **§B** his own march — priced by `planMarch`, which is the recap's — and whether the band admits the
 *    family it belongs to;
 *  - **§C** the criterion the decision has to make true, evaluated under each reading on all fifteen armies;
 *  - **§D** the decision, with the figures it was taken on.
 *
 * The four readings, all through the one diagnostic flag `CampaignInput.bandHired` so they run on one engine:
 *
 *  1. `winner` — today: at least **half the hired units the winner's march fields**;
 *  2. `damage` — 108's A5: at least **half the winner's damage** a march;
 *  3. `damageMin` at half the **sweet spot's** damage — A5 read against the knee rather than the extreme;
 *  4. `burn` at half the **sweet spot's** burn — the hired share measured on the axis the bar prints.
 *
 * Readings 3 and 4 are floors measured off a **provisional** bar (the one today's rule gives), because the
 * sweet spot is chosen *from* the band and cannot be its own yardstick without circularity. That is exactly
 * how experiment 108 measured its A2 and A3.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/112-band-yardstick.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import type { CampaignInput, CampaignPlan, PlanTotals } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { HORIZON } from '../../tests/engine/plan-scenarios';
import { countsKey, repeatsOf, shelteredRivals } from '../../tests/engine/plan-yardsticks';
import { Report, duration, n } from './harness';

/**
 * His Troops-first march of 2026-09-19, as he typed it — seven troop types and 25 hunters. Only the camp it
 * was built on can field it; on every other army of the list it is priced for the record and nothing else.
 */
const HIS_TROOPS_FIRST: Record<string, number> = {
  'archer-1': 1028,
  'spearman-1': 1027,
  'rider-1': 513,
  'archer-2': 568,
  'spearman-2': 567,
  'rider-2': 283,
  'rider-3': 159,
  'epic-monster-hunter-6': 25,
};
/** The label of the army he sent it from, in the shared list. */
const HIS_CAMP = 'his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)';

const run = (
  request: StackRequest,
  extra: Partial<CampaignInput>,
): { plan: CampaignPlan | null; ms: number; refusal?: string } => {
  const started = performance.now();
  try {
    const plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
      withTrade: true,
      withFrontier: true,
      ...extra,
    });
    return { plan, ms: Math.round(performance.now() - started) };
  } catch (error) {
    return {
      plan: null,
      ms: Math.round(performance.now() - started),
      refusal: error instanceof Error ? error.message : String(error),
    };
  }
};

const perSilver = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.silver);
const perHired = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.mercLost);
const pct = (after: number, before: number): string =>
  before === 0 ? '—' : `${(((after - before) / before) * 100).toFixed(1)} %`;

interface Reading {
  key: string;
  title: string;
  /** Built off the provisional bar today's rule gives, for the two readings that need a floor. */
  of: (provisional: { sweetDamage: number; sweetBurn: number }) => Partial<CampaignInput>;
}

const READINGS: Reading[] = [
  {
    key: 'R1',
    title: 'the rule until S-95 — half the winner’s fielded hired',
    of: () => ({ bandHired: { mode: 'winner' } }),
  },
  {
    key: 'R2',
    title: 'half the winner’s damage a march (108’s A5)',
    of: () => ({ bandHired: { mode: 'damage' } }),
  },
  {
    key: 'R3',
    title: 'half the **sweet spot’s** damage a march (A5 on the knee, not the extreme)',
    of: (p) => ({ bandHired: { mode: 'damageMin', min: Math.ceil(p.sweetDamage / 2) } }),
  },
  {
    key: 'R4',
    title: 'half the **sweet spot’s** burn (the hired share on the axis the bar prints)',
    of: (p) => ({ bandHired: { mode: 'burn', min: Math.ceil(p.sweetBurn / 2) } }),
  },
];

/** The share of the steady max's damage the criterion of §C asks a thrifty rival to reach. */
const SHARE = 0.5;

describe.skipIf(!process.env.THEORY)('112 — the band’s token-field yardstick', () => {
  it('re-measures the four readings over the fifteen armies the criteria are held on', () => {
    const report = new Report('112-band-yardstick');
    const armies = criteriaScenarios();

    const aSummary: string[] = [];
    const cSummary: string[] = [];
    const moved: string[] = [];

    for (const army of armies) {
      const hiredIds = army.request.units.filter((unit) => unit.pool !== 'leadership').map((u) => u.id);
      const hiredOf = (counts: Record<string, number>): number =>
        hiredIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
      const troopStacks = (counts: Record<string, number>): number =>
        Object.entries(counts).filter(([id, count]) => count > 0 && !hiredIds.includes(id)).length;

      report.h(army.label);
      const base = run(army.request, { bandHired: { mode: 'winner' } });
      if (!base.plan) {
        report.add(`The plan refuses this army: ${base.refusal ?? 'unknown'}.`);
        aSummary.push(`| ${army.label} | refused | refused | refused | refused |`);
        cSummary.push(`| ${army.label} | refused | — | — | — | — |`);
        continue;
      }
      const baseSweet = base.plan.alternatives.find((row) => row.pick === 'sweet-spot');
      if (baseSweet) {
        // The **expected** damage of the bar's own recommendation, beside the worst opening the bar prints.
        // His complaint compares his march's *expected* figure with the bar's *worst opening*, which is two
        // arithmetics; this is the one line that lets the report compare like with like.
        const priced = planMarch(army.request, baseSweet.counts).summary;
        report.add(
          `The sweet spot's own march, re-priced: ${n(priced.minDamage)} worst opening, ` +
            `${n(priced.avgDamage)} expected, for ${n(priced.recovery.silver)} silver — ` +
            `${(priced.minDamage / Math.max(1, priced.recovery.silver)).toFixed(3)} a silver on the worst ` +
            `opening, ${(priced.avgDamage / Math.max(1, priced.recovery.silver)).toFixed(3)} on the expected.`,
        );
      }
      const baseMost = base.plan.alternatives.find((row) => row.pick === 'steady-max');
      const provisional = {
        sweetDamage: baseSweet?.repeat.damage ?? 0,
        sweetBurn: baseSweet?.repeat.mercLost ?? 1,
      };
      /** The fixed denominator every reading's extreme is quoted against: today's steady max. */
      const steadyMax = baseMost?.repeat.damage ?? baseSweet?.repeat.damage ?? 1;
      const winnerHired = hiredOf(base.plan.counts);
      report.add(
        `Winner: ${n(winnerHired)} hired fielded, ${n(base.plan.repeat.damage)} a march — so today's rule ` +
          `asks ${n(Math.ceil(winnerHired / 2))} hired, and 108's A5 would ask ` +
          `${n(Math.ceil(base.plan.repeat.damage / 2))} damage. Provisional sweet spot ` +
          `${n(provisional.sweetDamage)} a march at ${provisional.sweetBurn} burned; steady max ` +
          `${n(steadyMax)}. Base search ${base.ms} ms.`,
      );

      /** The rivals the §C criterion is stated over, built once per army. */
      const rivals = shelteredRivals(army.request);
      const hand = army.label === HIS_CAMP ? HIS_TROOPS_FIRST : null;
      if (hand) {
        const { summary } = planMarch(army.request, hand);
        report.add(
          `\n**His own march**, priced by \`planMarch\`: ${n(summary.minDamage)} worst opening ` +
            `(${n(summary.avgDamage)} expected) for ${n(summary.recovery.silver)} silver, ` +
            `${duration(summary.recovery.seconds)}, ${hiredOf(hand)} hired fielded — ` +
            `${(summary.minDamage / Math.max(1, summary.recovery.silver)).toFixed(3)} a silver on the worst ` +
            `opening, ${(summary.avgDamage / Math.max(1, summary.recovery.silver)).toFixed(3)} on the ` +
            `expected, and ${((summary.minDamage / steadyMax) * 100).toFixed(1)} % of the steady max's damage.`,
        );
      }

      const bars = new Map<string, CampaignPlan | null>();
      const thrift = new Map<string, string>();
      for (const reading of READINGS) {
        const measured = run(army.request, reading.of(provisional));
        bars.set(reading.key, measured.plan);
        if (!measured.plan) {
          report.add(`\n**§A ${reading.key} · ${reading.title}** — refused: ${measured.refusal ?? '?'}`);
          thrift.set(reading.key, 'refused');
          continue;
        }
        const plan = measured.plan;
        const band = plan.trade ?? [];
        const thinnest =
          band.length === 0 ? null : band.reduce((h, r) => (r.repeat.damage < h.repeat.damage ? r : h));
        const share = thinnest ? (thinnest.repeat.damage / steadyMax) * 100 : 0;
        thrift.set(
          reading.key,
          `${band.length} in band · thinnest ${thinnest ? n(thinnest.repeat.damage) : '—'} ` +
            `(${share.toFixed(1)} % of steady max)`,
        );
        report.add(
          `\n**§A ${reading.key} · ${reading.title}** — band ${band.length} plans, ` +
            `${plan.alternatives.length} stops, ${measured.ms} ms. The band's **thriftiest** plan: ` +
            `${thinnest ? n(thinnest.repeat.damage) : '—'} damage, ` +
            `${thinnest ? n(thinnest.repeat.silver) : '—'} silver, ` +
            `${thinnest ? String(thinnest.repeat.mercLost) : '—'} burned, ` +
            `${thinnest ? n(hiredOf(thinnest.counts)) : '—'} hired — **${share.toFixed(1)} %** of the steady ` +
            `max's damage.`,
        );
        report.add(
          '| stop | troop stacks | hired | burn | damage (worst opening) | silver | queue | a silver | a hired | vs R1 |',
        );
        report.add('|---|---|---|---|---|---|---|---|---|---|');
        const todays = new Map((bars.get('R1')?.alternatives ?? []).map((row) => [row.pick, row] as const));
        for (const row of plan.alternatives) {
          const before = todays.get(row.pick);
          const same = before && countsKey(before.counts) === countsKey(row.counts);
          const note =
            reading.key === 'R1'
              ? '—'
              : !before
                ? '**new stop**'
                : same
                  ? 'same march'
                  : `damage ${pct(row.repeat.damage, before.repeat.damage)}, silver ` +
                    `${pct(row.repeat.silver, before.repeat.silver)}, burn ` +
                    `${before.repeat.mercLost} → ${row.repeat.mercLost}`;
          report.add(
            `| ${row.pick} | ${troopStacks(row.counts)} | ${n(hiredOf(row.counts))} | ` +
              `${row.repeat.mercLost} | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ` +
              `${duration(row.repeat.seconds)} | ${perSilver(row).toFixed(3)} | ` +
              `${n(Math.round(perHired(row)))} | ${note} |`,
          );
          if (reading.key !== 'R1' && before && !same) {
            moved.push(
              `| ${army.label} | ${reading.key} | ${row.pick} | ` +
                `${n(before.repeat.damage)} → ${n(row.repeat.damage)} (${pct(row.repeat.damage, before.repeat.damage)}) | ` +
                `${n(before.repeat.silver)} → ${n(row.repeat.silver)} (${pct(row.repeat.silver, before.repeat.silver)}) | ` +
                `${before.repeat.mercLost} → ${row.repeat.mercLost} | ` +
                `${n(before.totalDamage)} → ${n(row.totalDamage)} (${pct(row.totalDamage, before.totalDamage)}) | ` +
                `${n(before.silver)} → ${n(row.silver)} |`,
            );
          }
        }
        if (reading.key !== 'R1') {
          for (const before of todays.values()) {
            if (!plan.alternatives.some((row) => row.pick === before.pick)) {
              moved.push(
                `| ${army.label} | ${reading.key} | ${before.pick} | **lost** (${n(before.repeat.damage)}) | ` +
                  `**lost** (${n(before.repeat.silver)}) | ${before.repeat.mercLost} → — | ` +
                  `**lost** (${n(before.totalDamage)}) | ${n(before.silver)} |`,
              );
            }
          }
        }

        // ---- §B, on his camp: the family his march belongs to -------------------------------------------
        if (hand) {
          const handHired = hiredOf(hand);
          const handStacks = troopStacks(hand);
          const near = (plan.frontier ?? [])
            .filter((row) => troopStacks(row.counts) >= handStacks)
            .sort(
              (a, b) => Math.abs(hiredOf(a.counts) - handHired) - Math.abs(hiredOf(b.counts) - handHired),
            )[0];
          report.add(
            near
              ? `His march's nearest **seven-type** row on the frontier: ${n(hiredOf(near.counts))} hired, ` +
                  `${near.repeat.mercLost} burned, ${n(near.repeat.damage)} a march for ` +
                  `${n(near.repeat.silver)} (${perSilver(near).toFixed(3)} a silver) — undominated ` +
                  `${near.undominated ? 'yes' : 'no'}, **in band ${near.inBand ? 'yes' : 'no'}**, stop ` +
                  `${near.stop ?? '—'}.`
              : 'No row with as many troop stacks as his march is on the frontier at all.',
          );
          const thin = (plan.trade ?? []).filter(
            (row) => hiredOf(row.counts) <= handHired + 5 && troopStacks(row.counts) >= 5,
          );
          report.add(
            `Band plans of his own family (≥ 5 troop stacks, ≤ ${handHired + 5} hired): **${thin.length}**` +
              (thin.length > 0
                ? ` — thriftiest ${n(hiredOf(thin[0]?.counts ?? {}))} hired, ${n(thin[0]?.repeat.damage ?? 0)} for ${n(thin[0]?.repeat.silver ?? 0)}.`
                : '.'),
          );
        }

        // ---- §C, the criterion the decision has to make true --------------------------------------------
        /**
         * Two readings of the same question, measured side by side because the first of them — the one the
         * owner's sentence suggests — turns out to be **vacuous on every army**: read on the worst opening,
         * no sheltered march the account can field is at once thriftier than the sweet spot and at least as
         * efficient a silver as it. The second drops the ratio and asks what the band is actually for:
         * whether the thrift half of the trade is **inside it at all**.
         */
        const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
        const most = plan.alternatives.find((row) => row.pick === 'steady-max');
        if (sweet && most) {
          const kneePerSilver = sweet.repeat.damage / sweet.repeat.silver;
          const floor = SHARE * most.repeat.damage;
          const thrifty = rivals.filter(
            (rival) =>
              rival.repeats >= repeatsOf(sweet) &&
              rival.burn < sweet.repeat.mercLost &&
              rival.silver <= sweet.repeat.silver &&
              rival.damage >= floor,
          );
          const onRatio = thrifty.filter((rival) => rival.damage / rival.silver >= kneePerSilver);
          const thriftiestStop = plan.alternatives.reduce((held, row) =>
            row.repeat.mercLost < held.repeat.mercLost ? row : held,
          );
          const bandBurn = band.length === 0 ? Infinity : Math.min(...band.map((row) => row.repeat.mercLost));
          const cheapest =
            thrifty.length === 0 ? null : thrifty.reduce((held, r) => (r.burn < held.burn ? r : held));
          const inBand = cheapest === null || bandBurn <= cheapest.burn;
          const onBar = cheapest === null || thriftiestStop.repeat.mercLost <= cheapest.burn;
          report.add(
            `\n**§C** — sheltered marches the account can field that burn under ${sweet.repeat.mercLost}, ` +
              `cost no more than the sweet spot's ${n(sweet.repeat.silver)} and still reach ` +
              `${(SHARE * 100).toFixed(0)} % of the steady max's ${n(most.repeat.damage)}: **${thrifty.length}**` +
              ` (of them **${onRatio.length}** also at least as efficient a silver as the sweet spot's ` +
              `${kneePerSilver.toFixed(3)})` +
              (cheapest
                ? `. The cheapest burns **${cheapest.burn}** — ${n(cheapest.damage)} for ` +
                  `${n(cheapest.silver)}, ${duration(cheapest.seconds)}, ` +
                  `${(cheapest.damage / cheapest.silver).toFixed(3)} a silver. The **band's** thriftiest ` +
                  `plan burns **${bandBurn === Infinity ? '—' : String(bandBurn)}** ` +
                  `(**${inBand ? 'inside' : 'REFUSED'}**), the **bar's** thriftiest stop burns ` +
                  `**${thriftiestStop.repeat.mercLost}** (**${onBar ? 'offered' : 'NOT offered'}**).`
                : ' — nothing to answer; both readings hold vacuously.'),
          );
          cSummary.push(
            `| ${army.label} | ${reading.key} | ${thrifty.length} | ${onRatio.length} | ` +
              `${cheapest ? String(cheapest.burn) : '—'} | ${bandBurn === Infinity ? '—' : String(bandBurn)} | ` +
              `${inBand ? 'inside' : '**REFUSED**'} | ${thriftiestStop.repeat.mercLost} | ` +
              `${onBar ? 'offered' : '**not offered**'} |`,
          );
        } else {
          cSummary.push(
            `| ${army.label} | ${reading.key} | — | — | — | — | — | — | no sweet spot / steady max |`,
          );
        }
      }

      aSummary.push(`| ${army.label} | ${READINGS.map((r) => thrift.get(r.key) ?? '—').join(' | ')} |`);
    }

    report.h('§A summary — the band and the extreme each reading lets in');
    report.add(
      'Band size, and the **thriftiest plan the band keeps**, as a share of the steady max damage the rule ' +
        'until S-95 gives that army.',
    );
    report.add(
      '| army | R1 the rule until S-95 | R2 ½ winner damage | R3 ½ sweet damage | R4 ½ sweet burn |',
    );
    report.add('|---|---|---|---|---|');
    for (const line of aSummary) report.add(line);

    report.h('§A summary — every stop that moves against the rule until S-95');
    report.add('| army | reading | stop | damage | silver | burn | campaign damage | campaign silver |');
    report.add('|---|---|---|---|---|---|---|---|');
    if (moved.length === 0) report.add('| — | — | no stop moves on any army | — | — | — | — | — |');
    for (const line of moved) report.add(line);

    report.h('§C summary — the criterion, reading by reading');
    report.add(
      'Sheltered marches the account can field that burn less than the sweet spot, cost no more silver and ' +
        `still reach ${(SHARE * 100).toFixed(0)} % of the steady max's damage — how many there are, how many ` +
        'of them are also at least as efficient a silver as the sweet spot (the reading the owner’s sentence ' +
        'suggests), whether the **band** carries a plan as thrifty as the cheapest of them, and whether the ' +
        '**bar** offers one.',
    );
    report.add(
      '| army | reading | thrifty | of them on ratio | cheapest burn | band’s thriftiest | band | bar’s thriftiest | bar |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const line of cSummary) report.add(line);

    /**
     * **§D — the decision**, written once here so a re-run of this file carries it. The tables above are
     * re-measured against whatever engine runs them; the figures quoted below were taken on 2026-09-19
     * against the engine as it stood at HEAD `4c74cfb` (after S-94, S-96 and S-97), which is what the
     * decision was taken on.
     */
    report.add(`## §D — the decision

### The yardstick moves: **half the winner's damage**, not half the winner's fielded hired

The band's first arm exists for one sentence of the owner's — *"well just don't show the extremes, if we use a
certain % of mercs or waay too much silver we're too far off from our goal of everything optimized"* — and
until S-95 it read that as a count: a plan is a token field when its march fields fewer than **half the hired
units the winner's march fields**. Measured over the fifteen armies the criteria are held on, the count loses
on the rule's own terms.

**It does not refuse the extremes.** On the first-run armies with one, two and three Bear V the winner's own
march fields a token of the stock, so half of it asks for almost nothing and the band keeps a plan worth
**14.7 %, 14.4 % and 14.7 %** of that army's steady max damage. Read on damage, the worst the band keeps
anywhere in the fifteen is **37.8 %** (his own localStorage dump). The two floors, army by army, are §A's
summary table.

**It refuses the plans the owner reaches by hand.** On his camp of 2026-09-19 (5 100 / 2 200, 120 hunters) the
winner fields 100 hired, so the count asks 50, and **every** plan of his own family — five or more troop
stacks and twenty to thirty hunters — was outside the band: **0** of them under the count, **41** under the
damage reading. On his live camp of 2026-09-18 the band's thriftiest plan burned **8** chunks while the sizer's
own sheltered march at **7** does 2 230 444 for 1 942 700 in 5d 9h.

The two other readings measured are declined on the figures. Half the **sweet spot's damage** (R3) gives the
**same bar on all fifteen armies** as half the winner's, with a floor 3 to 10 points lower — it refuses less
and buys nothing. Half the sweet spot's **burn** (R4) is the worst of the four: its own floor is
**14.4 %** on Bear V ×2 — it keeps the count's extremes there untouched, because on those armies it asks for
half of a burn that is already one chunk — and it lets in an **18.4 %** extreme on the 4 000 case and a
**19.6 %** one on the monster camp, which the count refuses. It also drops the live account's silver saver
40.8 % in damage and moves his own camp's *recommendation* 2 509 413 → 2 151 774 (−14.3 %) at the **same**
silver.

### What it costs — four recommendations move, two bars gain a thrift stop, and one move is a fall on two readings

| army | stop | before | after | the trade |
|---|---|---|---|---|
| his live camp of 2026-09-18 | sweet-spot | 3 544 681 / 2 264 700 / 12 chunks / 8d 16h | **2 249 888 / 1 766 400 / 4 / 4d 19h** | the eco stop he asked for: −36.5 % damage for **−22 % silver**, a third of the stock and **half** the queue, and a **three**-stop bar becomes four. **The 12-chunk march is not kept**: the new *more mercs* is a different plan, 3 285 305 for 2 635 500 at 10 chunks — 7.3 % less damage for 16.4 % **more** silver than the march that left the bar |
| 2026-09-17 export at 7 000 | sweet-spot | 4 870 455 / 2 614 000 / 10 | 4 442 817 / **2 722 500** / 7 | **the one fall on two readings at once**: −8.8 % a march (campaign 20 079 262 → 18 796 348, −6.4 %) for **4.2 % more** silver, against three chunks of the stock kept. Its old march stays on the bar as *more mercs*, and its silver saver moves 3 583 107 / 1 851 500 / 7 → 3 549 139 / 1 985 200 / 6 |
| the evening account at 11 000 | sweet-spot | 6 189 687 / 4 247 600 / 11 | **7 096 423** / 4 259 200 / 14 | a **gain**: +14.6 % a march, +10.2 % over the campaign, +0.3 % silver |
| his localStorage dump (450 hunters) | **silver-saver gained** | — | **1 882 911 / 1 790 200 / 3 / 6d 21h** | the eco stop, at thirty hunters over five troop stacks: three stops become four |
| his localStorage dump (450 hunters) | sweet-spot | 2 423 299 / 2 264 700 / 5 | 2 385 168 / 2 268 000 / 4 | −1.6 % a march for a chunk of stock |
| the evening account at 11 000 | **silver-saver gained** | — | **23 474 915 / 13 945 500 / 53 over the campaign** | four stops become five, which is the \`stops\` pin S-94 left red coming back green on its own |

**Eleven of the fifteen armies do not move at all** — including his own camp of 2026-09-19 at 5 100 / 2 200, the
12 000 export, Aydae alone, the monster camp, the 4 000 case and every first-run army — although the band grows
on most of them (the 12 000 export 146 → 170 plans, the e2e seed 14 → 16, Aydae 274 → 274 unchanged).

### What it does **not** do, measured and stated plainly

It does **not** put his own hand march on the bar, and no reading of this arm can. His march, priced by
\`planMarch\` on his own request, is **2 090 122** on the worst opening (2 169 458 expected) for 1 997 400
silver — **1.046** a silver — while the bar's sweet spot is 2 509 413 for 2 321 200, **1.081** a silver on the
worst opening *and* on the expected (the two coincide on that march). His complaint compares his **expected**
figure with the bar's **worst opening**: on that mixed reading his 1.086 beats 1.081 by half a percent, and on
either arithmetic taken whole it does not. The stop that would carry it — \`silver-saver\`, *"the cheapest march
left of the sweet spot that costs no more silver and is **at least as efficient a silver**"* — therefore
refuses it whatever the band does, and §C measures that directly **over the family this file scores** — the
sizer over each prefix of the troop ranking, under each of its three methods, every hired stack sheltered
(\`shelteredRivals\`) — and inside that family, of every march that burns less than the sweet spot, costs no
more silver **and clears half the steady max's damage**, *not one, on any of the fifteen armies, under any of
the four readings, is also at least as efficient a silver* (the "of them on ratio" column of §C's table reads 0 in
every one of the **forty-four** rows that carry a bar with both a sweet spot and a steady max; the sixteen
rows that do not are the four Bear V armies, whose bars carry neither). Marches below that damage floor are not scored on the ratio here and the sentence does
not speak for them; his own march is not one of them — it does **72.7 %** of his camp's steady max, so it is
inside the family the measurement covers, and it comes in at 1.046 against 1.081. What his march *is*, against the
sweet spot: 20.5 % less silver, **three chunks against five**, 5d 14h against 8d 21h, for 16.7 % less damage.
Offering that is a change to the silver saver's own definition, and it is a story of its own.

What this one buys him is the precondition: on his camp the whole thrift half of the trade was **outside the
band**, so nothing downstream could ever have offered it. §C is the criterion that holds it —
*"a march the account can field that burns less than the sweet spot, costs no more silver and still does at
least half the steady max's damage is among the plans the bar draws from"* — and it **fails on HEAD on two of
the fifteen** (his camp of 2026-09-19: the cheapest such march burns **3** and the plans the bar draws from
start at **5**; his live camp of 2026-09-18: **7** against **8**) and holds on all fifteen after.`);

    report.save();
  }, 3_600_000);
});
