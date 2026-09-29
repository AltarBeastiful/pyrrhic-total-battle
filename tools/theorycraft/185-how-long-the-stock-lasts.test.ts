/**
 * 185 — **the stock's own ceiling on identical marches, on every stop the bar offers** (S-148). Owner,
 * 2026-09-29: *"which merc is doing most damage using all my stock over a few marches until it runs out"*.
 *
 * The March's unit detail sheet will read, for a hired stack with a known owned count:
 *
 * > You own 4 200 ARC3, and a march of this size burns 231 of them for good.
 * > That is 9 marches like this one: 11.2M damage from this stack, 108M from the march in all.
 *
 * The second sentence is `lastsMarches(held, count)` — `src/engine/plan.ts:1536`,
 * `floor((held − count) / ceil(count / 10)) + 1`, the same rule the plan rations with. `held` is
 * `request.caps[unit.id]`, the account's own owned count (`state/derive.ts:505`, from
 * `profile.mercenaries.selected[].cap`) — **never** the per-march ration a re-size applies
 * (`largestSustained`), a distinction `raise.ts:314-320` documents because it is exactly the mistake to
 * avoid here.
 *
 * **Why this is the right promise.** `planCampaign` copies the account's caps into `sustain`
 * (`plan.ts:3178`; `sustain[id] = Infinity` for dominance and unlimited types only, `plan.ts:3204`), and the
 * repeats a vector plays are `min(targetRepeats, marchesFor(sustain, fielded))` — `repeatsFor`,
 * `plan.ts:3310`, whose line 3316 is literally `lastsMarches(sustain[merc.entry.id], merc.count)`. `score`
 * refuses any vector fielding a count the stock cannot repeat (`plan.ts:2146-2148`). So on the repeated
 * march `row.counts`, every capped authority type's count satisfies `lastsMarches(caps[id], count) >=
 * planRepeats(row)` **by construction**, and the plan can only play that march *fewer* times — the horizon
 * (`CAMPAIGN.marches`, 4) or the silver budget gets there first. The sheet's figure is therefore the
 * engine's own ceiling on identical marches, and the promise asserted here is exactly that ceiling's
 * soundness on the real corpus.
 *
 * The corpus is `criteriaScenarios()` — every army and every stop the bar offers, planned with the app's own
 * call (the same one experiments 183 and 184 make). For every stop of every army, the stop's own repeated
 * march (`row.counts`; `planRepeats(row)`, `plan.ts:1566`, is how often it is played) and every hired type it
 * fields with an entry in `request.caps`:
 *
 *   **`lastsMarches(caps[id], count) >= planRepeats(row)`**
 *
 * A stop with a `sequence` has no repeated march at all (`planRepeats` returns 1 and the marches all differ,
 * the `all-in`) — the promise does not apply, and those stops are counted and set aside rather than silently
 * skipped. A type the account has no cap for (an unlimited mercenary, a hand-added one) gets no reading by
 * definition: the sheet has no owned count to divide by, and the plan's own `sustain` is `Infinity` for it.
 *
 * The second reading is what decides whether the block is *useful* or merely *safe*: a figure always far
 * above what the plan plays would be honest and useless. So the same reading is reported as a histogram, and
 * against the marches the campaign actually plays (`row.marches`).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/185-how-long-the-stock-lasts.test.ts`
 */
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { lastsMarches, planCampaign, planRepeats } from '@/engine';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

describe.skipIf(!process.env.THEORY)('how long the stock lasts', () => {
  it('reads `lastsMarches` against the repeats every stop of every army plays', () => {
    const report = new Report('185-how-long-the-stock-lasts');
    report.add(
      [
        'Every stop of every benchmark army, read the way the March’s unit detail sheet will read it: for a',
        'hired stack with an owned count, **how many identical marches the stock sustains** —',
        '`lastsMarches(caps[id], count)` — set against **how many the plan plays** (`planRepeats(row)`). The',
        'promise is that the sheet never promises more than the plan plays. The corpus is',
        '`criteriaScenarios()` planned with the app’s own call, exactly as experiments 183 and 184 make it.',
      ].join(' '),
    );

    const below: string[] = [];
    const over: number[] = [];
    const histogram = new Map<number, number>();
    /** The stop-level reading: the smallest `lastsMarches` over the capped hired types its repeat fields. */
    const stopOver = { repeats: [] as number[], marches: [] as number[] };
    let armies = 0;
    let stops = 0;
    let readings = 0;
    let equal = 0;
    let skippedUncapped = 0;
    let sequences = 0;
    let noReading = 0;
    let refusals = 0;
    const repeatsSeen = new Set<number>();
    const marchesSeen = new Set<number>();

    for (const scenario of criteriaScenarios()) {
      armies += 1;
      const request = scenario.request;
      let plan;
      try {
        plan = planCampaign({
          request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
        refusals += 1;
        continue;
      }

      for (const stop of plan.alternatives) {
        stops += 1;
        // A `sequence` stop has no repeated march: `planRepeats` answers 1 and `row.counts` is its first
        // march, so there is no "marches like this one" for the sheet to promise. Set aside, and counted.
        if (stop.sequence) {
          sequences += 1;
          continue;
        }
        const repeats = planRepeats(stop);
        repeatsSeen.add(repeats);
        marchesSeen.add(stop.marches);

        /** The smallest ceiling over the capped hired types this stop's repeat fields. */
        let stopCeiling = Infinity;
        let fielded = 0;
        for (const unit of request.units) {
          if (unit.pool !== 'authority') continue;
          const count = stop.counts[unit.id] ?? 0;
          if (count <= 0) continue;
          const held = request.caps[unit.id];
          // No owned count is no reading — an unlimited mercenary, or one the account never capped.
          if (held === undefined) {
            skippedUncapped += 1;
            continue;
          }
          readings += 1;
          fielded += 1;
          const lasts = lastsMarches(held, count);
          stopCeiling = Math.min(stopCeiling, lasts);
          if (lasts < repeats) {
            below.push(
              `${scenario.label} · ${stop.pick} · ${unit.id}: lasts ${String(lasts)} against ${String(repeats)} repeats`,
            );
            continue;
          }
          if (lasts === repeats) equal += 1;
          else {
            over.push(lasts - repeats);
            histogram.set(lasts - repeats, (histogram.get(lasts - repeats) ?? 0) + 1);
          }
        }
        if (fielded === 0) {
          noReading += 1;
          continue;
        }
        stopOver.repeats.push(stopCeiling - repeats);
        stopOver.marches.push(stopCeiling - stop.marches);
      }
    }

    const overMedian = median(over);
    const overWorst = over.length === 0 ? 0 : Math.max(...over);
    const overSmallest = over.length === 0 ? 0 : Math.min(...over);
    const exactRepeats = stopOver.repeats.filter((one) => one === 0).length;
    const exactMarches = stopOver.marches.filter((one) => one === 0).length;
    const coversCampaign = stopOver.marches.filter((one) => one >= 0).length;

    report.h('The promise, on every stop of every army');
    report.add('');
    report.add(
      `**${String(armies)} armies, ${String(stops)} stops, ${String(readings)} type-readings, ${String(
        refusals,
      )} armies the plan refuses.** ` +
        `**${String(equal)} readings are exactly the repeats the plan plays; ${String(over.length)} are above ` +
        `them — +${String(overSmallest)} at the narrowest, +${n(overMedian)} median, +${String(overWorst)} at the widest; ` +
        `none is below.**`,
    );
    report.add('');
    report.add(
      `- **Stops set aside for a \`sequence\`**: ${String(sequences)} of ${String(
        stops,
      )} — the \`all-in\` and its kind, whose marches all differ, so the stop has no *"marches like this one"* ` +
        'for the sheet to promise (`planRepeats` answers 1 there; `plan.ts:1566`).',
    );
    report.add(
      `- **Type-readings skipped for want of a cap**: ${String(
        skippedUncapped,
      )} — a hired type the account has no owned count for (an unlimited mercenary, one never capped). The ` +
        'sheet has nothing to divide by, and the plan’s own `sustain` is `Infinity` for exactly those ' +
        '(`plan.ts:3204`), so they carry no reading rather than a false one.',
    );
    report.add(
      `- **Stops whose repeat fields no capped hired type at all**: ${String(
        noReading,
      )} — nothing to read, counted rather than dropped.`,
    );
    report.add(
      `- **The repeats actually played** run ${String(Math.min(...repeatsSeen))} to ${String(
        Math.max(...repeatsSeen),
      )} and the campaigns ${String(Math.min(...marchesSeen))} to ${String(
        Math.max(...marchesSeen),
      )} marches (the horizon is ${String(HORIZON)}).`,
    );

    report.h('How much room the stock has over the repeats — the histogram');
    report.add('');
    report.add(
      'Each cell counts the **type-readings** whose ceiling sits that many identical marches above what the ' +
        'plan plays. The leftmost column is the useful case: the sheet’s figure is exactly the campaign’s own ' +
        'limit, and the player is being told something the plan already acted on.',
    );
    report.add('');
    report.add('| ceiling − repeats | readings |');
    report.add('|---|---|');
    const keys = [...histogram.keys()].sort((a, b) => a - b);
    report.add(`| 0 (exact) | ${String(equal)} |`);
    for (const key of keys) report.add(`| +${String(key)} | ${String(histogram.get(key) ?? 0)} |`);
    report.add('');

    report.h('Does the sheet tell the truth about the campaign, or only about the march?');
    report.add('');
    report.add(
      [
        'The sheet’s figure is per stack; the campaign is repeats, a finale and sometimes a troops-only tail.',
        'Reading the **smallest** ceiling over the hired types a stop’s repeat fields, against the two counts',
        'that matter:',
      ].join(' '),
    );
    report.add('');
    report.add(
      `- **Exactly the repeats the plan plays**: ${String(exactRepeats)} of ${String(
        stopOver.repeats.length,
      )} stops with a reading.`,
    );
    report.add(
      `- **At least the whole campaign the plan plays** (repeats + finale + tail): ${String(
        coversCampaign,
      )} of ${String(stopOver.marches.length)} stops — of those, **exactly the campaign** on ${String(
        exactMarches,
      )}.`,
    );
    report.add('');
    report.add(
      `- **Median room over the whole campaign**: ${n(median(stopOver.marches))} marches; ` +
        `**worst over-carry**: +${String(Math.max(...stopOver.marches, 0))}; ` +
        `**tightest**: ${String(Math.min(...stopOver.marches, 0))}.`,
    );
    report.add('');
    report.add(
      'A reading far above the campaign is honest and uninformative: the stock would carry more identical ' +
        'marches than the horizon asks for, so the sheet’s figure is not what stopped the plan — silver or ' +
        'the horizon did. The rows where the two are equal are the ones where the block says something the ' +
        'plan already acted on.',
    );
    report.add('');

    report.h('What the reading is, and what it is not');
    report.add('');
    report.add(
      [
        '`held` is `request.caps[unit.id]` — the account’s **own** owned count — and never the per-march ration',
        'a re-size applies (`largestSustained`, `plan.ts:1554`), which `raise.ts:314-320` documents as the',
        'distinction to keep: an overhaul that reads the ration answers a question the owner did not ask.',
        '`count` is the stop’s own repeated march, `row.counts`, so the figure is a property of the march the',
        'sheet is drawn under.',
      ].join(' '),
    );
    report.add('');
    report.add(
      [
        'The plan reads are budgeted searches (`CAMPAIGN.budgets.plan`), so the **stops** a run offers can move',
        'with load on a busy machine; the promise is asserted on the readings themselves and no timing is',
        'pinned here.',
      ].join(' '),
    );
    report.add('');
    report.save();

    expect(below, below.join('\n')).toEqual([]);
  }, 3_600_000);
});
