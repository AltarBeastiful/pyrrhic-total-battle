/**
 * TotalStack's answers to the benchmark's scenarios, read from the dataset the owner captured in his own
 * browser on 2026-09-18 (`docs/research/totalstack-capture-2026-09-18.md`, the third run: six bases, eighty
 * answers). One row a method and priority: the three Generate methods as the page names them, and the priority
 * search under Elite and under M's for each objective.
 *
 * TotalStack sends no method name; the method is the body's flags (the doc has the table). Its answers to the
 * owner's scenarios field Archer III, Spearman III and Swordsman I, which his Pyrrhic export leaves out, so a row
 * carries the unit ids its counts need and the benchmark prices it on the scenario's request widened to them —
 * the same bonuses, enemy and prices, one more window of troop types.
 */
import { existsSync, readFileSync } from 'node:fs';

import { unitById } from '@/data';
import type { StackRequest, UnitDef } from '@/engine/types';

const DATASET = new URL(
  '../../docs/research/fixtures/totalstack-2026-09-18-dataset-full.json',
  import.meta.url,
);

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

/** The kit's scenario names → the benchmark's labels (the kit has two the benchmark does not: 20 000 and 11 000 on the owner's stock). */
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
  if (!existsSync(DATASET)) return [];
  const data = JSON.parse(readFileSync(DATASET, 'utf8')) as { results: Answer[] };
  const kitName = Object.entries(SCENARIOS).find(([, benchmark]) => benchmark === label)?.[0];
  if (!kitName) return [];
  const rows: TotalStackRow[] = [];
  const seen = new Set<string>();
  for (const answer of data.results) {
    if (answer.scenario !== kitName || (answer.status !== 200 && answer.status !== 201)) continue;
    const calc = answer.response.calculation ?? answer.response;
    const counts = { ...(calc.troopCounts ?? {}), ...(calc.mercenaryCounts ?? {}) };
    const method = methodOf(answer.method);
    const optimize = answer.method.startsWith('calculations/optimize');
    // A Generate body pressed while the page was excluding types replays with those exclusions: say so.
    const excluded = answer.request.excludedTroopIds ?? [];
    const window = !optimize && excluded.length > 0 ? ` (page excluding ${excluded.join(', ')})` : '';
    const name = `TotalStack · ${method}${optimize ? ` (${answer.priority})` : ''}${window}`;
    const key = `${name}|${JSON.stringify(counts)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ name, counts });
  }
  return rows;
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
