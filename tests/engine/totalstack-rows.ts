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
 * Three runs of the kit, read in this order and the first that answers a scenario wins it: the fourth of
 * 2026-09-18 (22:46) asks the owner's scenarios on his own troop window; the third (22:44) asked them on the
 * page's wider profile and is read only for a scenario the fourth does not hold; the **replay of 2026-09-19**
 * (09:36, `totalstack-2026-09-19-replay-m3.json`) asks the five armies neither of them covers — the two small
 * bear stocks and the three camps — and is last, so no scenario the 2026-09-18 runs answered changes its rows
 * by its arrival (S-101).
 *
 * **What the replay holds**: 28 answers at 2xx on the Generate route, seven scenarios × the four flag sets
 * `methodOf` names (Elite Preservation, M's Preservation and two bodies that both read as Total Optimization
 * — `monsterSaving=true` with and without `trackAnalytics`, whose counts are identical on every one of the
 * seven, so the de-duplication below collapses them to one row). The **priority-search** route answered
 * **403** on all 70 of its calls (Pro is required and the trial had lapsed), so this replay contributes no
 * `optimize` row at all.
 *
 * **Two of its seven scenarios are deliberately not mapped below** (S-101): `monsters, first-run army
 * (tiers 3–9, no mercenaries)` and `monsters, owner’s window (tiers 3–9, hunters 450, 4 975 / 2 180)` were
 * asked with the monster tier window open to 3–9 to see what the page fields from the dominance pool, and
 * the answer is **nothing**: `monsterCounts` is empty in all four answers to each of them, exactly as it is
 * in all 280 answers of the 2026-09-18 datasets (`plan-yardsticks.ts` states why — no `monsterCaps` is ever
 * sent and the account behind the capture houses no dominance unit). Their troop-and-mercenary answers are
 * besides that **the same counts** the camp scenarios beside them already give: the owner's-window pair is
 * identical to `camp of 2026-09-19, hunters 450` to the unit, and the first-run pair is that army's answer
 * with the bear taken out. A row that is another row's duplicate would be a second vote for the same march
 * in every `Math.max` the benchmark takes, so neither is fielded.
 */
const DATASETS = [
  new URL('../../docs/research/fixtures/totalstack-2026-09-18-dataset-window.json', import.meta.url),
  new URL('../../docs/research/fixtures/totalstack-2026-09-18-dataset-full.json', import.meta.url),
  new URL('../../docs/research/fixtures/totalstack-2026-09-19-replay-m3.json', import.meta.url),
];

interface Answer {
  method: string;
  scenario: string;
  priority: string;
  status: number | string;
  request: { excludedTroopIds?: string[] };
  response: {
    troopCounts?: Record<string, number>;
    mercenaryCounts?: Record<string, number>;
    calculation?: { troopCounts: Record<string, number>; mercenaryCounts: Record<string, number> };
    excludedTroopIds?: string[];
  };
}

/**
 * The kit's scenario names → the benchmark's labels (the kit has two the benchmark does not: 20 000 and
 * 11 000 on the owner's stock, and the replay's two `monsters, …` runs, which the note on `DATASETS` above
 * explains).
 *
 * The last five are the replay of 2026-09-19 (S-101): the two small bear stocks, which had no captured
 * answer at all until then, and the three camps the criteria have been held on since S-93 and S-97 — the
 * live camp of 2026-09-18 and his camp of 2026-09-19 at both readings of the Battle card — which became
 * benchmark scenarios in the same story.
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
      const counts = { ...(calc.troopCounts ?? {}), ...(calc.mercenaryCounts ?? {}) };
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
