/**
 * TotalStack's answers to the benchmark's scenarios, read from the datasets the owner captured in his own
 * browser on 2026-09-18 (`docs/research/totalstack-capture-2026-09-18.md`, the third run: six bases, eighty
 * answers) and **replayed on 2026-09-19** for the five armies those runs never asked (S-101). One row a
 * method and priority: the three Generate methods as the page names them, and the priority search under
 * Elite and under M's for each objective — the replay contributes Generate rows only, its `optimize` calls
 * having come back 403 (see `DATASETS` below).
 *
 * TotalStack sends no method name; the method is the body's flags (the doc has the table). Its answers to the
 * owner's scenarios field Archer III, Spearman III and Swordsman I, which his Pyrrhic export leaves out, so a row
 * carries the unit ids its counts need and the benchmark prices it on the scenario's request widened to them —
 * the same bonuses, enemy and prices, one more window of troop types.
 */
import { existsSync, readFileSync } from 'node:fs';

import { unitById } from '@/data';
import type { StackRequest, UnitDef } from '@/engine/types';

/**
 * Four runs of the kit, read in this order and the first that answers a scenario wins it: the fourth of
 * 2026-09-18 (22:46) asks the owner's scenarios on his own troop window; the third (22:44) asked them on the
 * page's wider profile and is read only for a scenario the fourth does not hold; the **replay of 2026-09-19**
 * (09:36, `totalstack-2026-09-19-replay-m3.json`) asks the five armies neither of them covers — the two small
 * bear stocks and the three camps — and is last but one, so no scenario the 2026-09-18 runs answered changes
 * its rows by its arrival (S-101); the **second replay of the same morning** (10:09,
 * `totalstack-2026-09-19-replay-v2.json`) is last, for the reason the next paragraph gives.
 *
 * **What the first replay holds**: 28 answers at 2xx on the Generate route, seven scenarios × the four flag
 * sets `methodOf` names (Elite Preservation, M's Preservation and two bodies that both read as Total
 * Optimization — `monsterSaving=true` with and without `trackAnalytics`, whose counts are identical on every
 * one of the seven, so the de-duplication below collapses them to one row). The **priority-search** route
 * answered **403** on all 70 of its calls (Pro is required and the trial had lapsed), so this replay
 * contributes no `optimize` row at all.
 *
 * **What the second replay holds** (S-103, 2026-09-19): 40 answers at 201 on the Generate route, ten
 * scenarios × the same four flag sets, asked on the **current API schema** — `dominanceValue`,
 * `recoveryPlan`, `reviveAllTroops`, `trainingCostReductions` and `trainingSpeedBonuses` are on the wire now
 * and were not three quarters of an hour earlier — and with the monster tier window open, so its
 * `monsterCounts` comes back **filled** where every earlier capture's was empty. Its priority-search calls
 * answered 403 exactly as the first replay's did (100 of them), so it contributes no `optimize` row either.
 *
 * **Its five repeated scenarios are read from the first replay, not from it, and the reason is that the two
 * agree** (S-103). The two small bear stocks and the three camps are in both runs, and on all five, on all
 * three method rows, **the counts are identical to the unit** — the schema fields the second run added move
 * no answer on an army that houses no dominance unit. One plan is one row, so the pair is resolved by the
 * order of this list: the first replay answers them, the second is never reached for them, and every figure
 * the benchmark pinned on those five in S-101 is untouched by this file's growth. The second replay is read
 * for the two scenarios nothing before it answered: **experiment 110's 900-dominance camp** (benchmark
 * scenario 11, whose table had no captured answer at all until now) and **his own TotalStack profile of
 * 2026-09-19** (benchmark scenario 16, built from that very request).
 *
 * **Four of its ten scenarios are deliberately not mapped below**, two of them repeating S-101's finding and
 * two of them new:
 *
 *  - `monsters, first-run army (tiers 3–9, dominance 20 000, no mercenaries)` and `monsters, owner’s window
 *    (tiers 3–9, dominance 20 000, hunters 450, 4 975 / 2 180)`. S-101 skipped their first-replay twins
 *    because the page fielded no monster at all on them; **it fields monsters on these**, and they are still
 *    not rows, because their troop-and-mercenary halves are to the unit the answers the camps beside them
 *    already give — the owner's-window one is `camp of 2026-09-19, hunters 450` plus a monster fill, the
 *    first-run one is `first-run, 1 bear` with the bear taken out plus the same fill — and because **no
 *    army in this repo holds that window**: a tiers-3–9 pool at 20 000 dominance is the camp S-96 left off
 *    the benchmark for running past `CAMPAIGN.budgets.plan`. A row has to be priced on a scenario's own
 *    request, and there is no scenario to price these on.
 *  - `monsters, camp 110 — tiers 3–5, dominance 20 000 (EMH 83 · Bear V 6, 20 000 / 2 180)`, for the second
 *    of those reasons alone: it is experiment 110's **other** camp, the one whose search does not finish
 *    inside the app's own budget, so it is not a benchmark scenario and its four answers are recorded in
 *    `plan-scenarios.ts` (`monsterCamp`) as a note rather than fielded as rows.
 */
const DATASETS = [
  new URL('../../docs/research/fixtures/totalstack-2026-09-18-dataset-window.json', import.meta.url),
  new URL('../../docs/research/fixtures/totalstack-2026-09-18-dataset-full.json', import.meta.url),
  new URL('../../docs/research/fixtures/totalstack-2026-09-19-replay-m3.json', import.meta.url),
  new URL('../../docs/research/fixtures/totalstack-2026-09-19-replay-v2.json', import.meta.url),
];

interface Answer {
  method: string;
  scenario: string;
  priority: string;
  status: number | string;
  request: { excludedTroopIds?: string[] };
  response: {
    troopCounts?: Record<string, number>;
    /**
     * The dominance pool's own stacks (S-103). Empty in all 318 answers captured before the second replay
     * of 2026-09-19 — no `monsterCaps` was ever sent and the account behind those runs houses no dominance
     * unit — and filled in that replay's monster scenarios, so merging it below changes no row that
     * predates it and is the only way the page's monster answers reach the table at all.
     */
    monsterCounts?: Record<string, number>;
    mercenaryCounts?: Record<string, number>;
    calculation?: {
      troopCounts: Record<string, number>;
      monsterCounts?: Record<string, number>;
      mercenaryCounts: Record<string, number>;
    };
    excludedTroopIds?: string[];
  };
}

/**
 * The kit's scenario names → the benchmark's labels (the kit has several the benchmark does not: 20 000 and
 * 11 000 on the owner's stock, and the replays' four `monsters, …` runs, which the note on `DATASETS` above
 * explains).
 *
 * The five before the last two are the replay of 2026-09-19 (S-101): the two small bear stocks, which had no
 * captured answer at all until then, and the three camps the criteria have been held on since S-93 and S-97
 * — the live camp of 2026-09-18 and his camp of 2026-09-19 at both readings of the Battle card — which
 * became benchmark scenarios in the same story.
 *
 * **The last two are the second replay** (S-103): experiment 110's 900-dominance camp, which is benchmark
 * scenario 11 and the one army here that houses a dominance pool, and **his own TotalStack profile** as it
 * stood that morning, which is benchmark scenario 16 and is built from this very request — the one case on
 * the table where the army we price and the army the page was asked are the same by construction rather
 * than by reconstruction.
 */
const SCENARIOS: Record<string, string> = {
  'owner 7 000': '2026-09-17 export, its setup (7 000 leadership)',
  'owner 12 000': '2026-09-17 export, 12 000 leadership',
  'live, hunters only': 'live account of 2026-09-18 (one hired type, 20 000 leadership)',
  evening: 'live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)',
  'first-run, 3 bears': 'first-run army, Bear V ×3 (20 000 leadership)',
  'first-run, 10 bears': 'first-run army, Bear V ×10 (20 000 leadership)',
  'first-run, hunters 83': 'first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)',
  'the 4 000 case of 2026-09-15':
    'the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)',
  'first-run, 1 bear': 'first-run army, Bear V ×1 (20 000 leadership)',
  'first-run, 2 bears': 'first-run army, Bear V ×2 (20 000 leadership)',
  'live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears uncapped, 4 975 / 2 180)':
    'the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)',
  'camp of 2026-09-19, hunters 450 (4 975 / 2 180)':
    'his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)',
  'camp of 2026-09-19, hunters 120 (5 100 / 2 200)':
    'his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)',
  'monsters, camp 110 — tiers 3–5, dominance 900 (EMH 83 · Bear V 6, 20 000 / 2 180)':
    'first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)',
  'his TotalStack profile 2026-09-19 (5 225 / dominance 100 / 2 120, monsters tier 3, EMH V 80 · bears 6 · cyclopes 6)':
    'his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)',
};

/** What the page calls the body's flags. */
function methodOf(key: string): string {
  const optimize = key.startsWith('calculations/optimize');
  const relaxed = key.includes('relaxedPreservation=true');
  const saving = key.includes('monsterSaving=true');
  if (optimize) return relaxed ? 'priority search under M’s' : 'priority search under Elite';
  if (saving) return 'Total Optimization';
  return relaxed ? 'M’s Preservation' : 'Elite Preservation';
}

export interface TotalStackRow {
  name: string;
  counts: Record<string, number>;
}

/** TotalStack's rows for a benchmark label, or none where the dataset is absent or holds no answer for it. */
export function totalstackRows(label: string): TotalStackRow[] {
  const kitName = Object.entries(SCENARIOS).find(([, benchmark]) => benchmark === label)?.[0];
  if (!kitName) return [];
  for (const dataset of DATASETS) {
    if (!existsSync(dataset)) continue;
    const data = JSON.parse(readFileSync(dataset, 'utf8')) as { results: Answer[] };
    const rows: TotalStackRow[] = [];
    const seen = new Set<string>();
    for (const answer of data.results) {
      if (answer.scenario !== kitName || (answer.status !== 200 && answer.status !== 201)) continue;
      const calc = answer.response.calculation ?? answer.response;
      const counts = {
        ...(calc.troopCounts ?? {}),
        // The dominance pool between the two, as the page orders its own payload (S-103).
        ...(calc.monsterCounts ?? {}),
        ...(calc.mercenaryCounts ?? {}),
      };
      const method = methodOf(answer.method);
      const optimize = answer.method.startsWith('calculations/optimize');
      const name = `TotalStack · ${method}${optimize ? ` (${answer.priority})` : ''}`;
      const key = `${name}|${JSON.stringify(counts)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ name, counts });
    }
    if (rows.length > 0) return rows;
  }
  return [];
}

/** The scenario's request widened to every unit a captured answer fields, so no stack is silently dropped. */
export function widenedFor(request: StackRequest, counts: Record<string, number>): StackRequest {
  const have = new Set(request.units.map((unit) => unit.id));
  const extra: UnitDef[] = [];
  for (const id of Object.keys(counts)) {
    if (have.has(id)) continue;
    const unit = unitById(id);
    if (!unit) throw new Error(`TotalStack fielded an unknown unit ${id}`);
    extra.push(unit as UnitDef);
  }
  return extra.length === 0 ? request : { ...request, units: [...request.units, ...extra] };
}
