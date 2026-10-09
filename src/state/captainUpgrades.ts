/**
 * **The upgrades the captain advice asks about** (W17 C5b, `docs/plans/progression-advisor.md` §4 C5), built on
 * the main thread like the trios (`captainTrios.ts`): the worker only takes totals already summed.
 *
 * For each owned captain below the top star, `star + 1`, `level + 1` and `level + 10`, the delta read off
 * `captains.json` (`captainValue`), nothing typed. Each upgrade carries the trios it has to be tried in, with
 * the upgrade applied to the profile and every other source left as the march has it:
 *
 *  - `where: 'lead'` — the captain is in the lead trio: the lead trio alone, with the upgrade added (the cheap form);
 *  - `where: 'bench'` — it is not: every allowed trio that fields it, to be screened and the best planned in full.
 *
 * The enumeration and its membership logic are engine (`src/engine/captainUpgrades.ts`).
 */
import {
  captainUpgrades,
  inLeadTrio,
  trioContaining,
  type CaptainUpgradeSpec,
} from '../engine/captainUpgrades';
import { trioKey } from '../engine/captains';
import type { CaptainRecord } from '../data/types';
import type { BattleSetup, Profile } from './schema';
import { captainCounts, captainValue, DEFAULT_TABLES } from './derive';
import type { DeriveTables } from './derive';
import { trioTotals, type TrioCandidate } from './captainTrios';

export interface UpgradeCandidate {
  spec: CaptainUpgradeSpec;
  /** "Aydae", the captain's name as the tables have it. */
  name: string;
  /** What changes: `★2 → ★3`, `L20 → L21`. */
  change: string;
  /** Where the upgrade is tried: the lead trio alone, or every trio that fields the captain. */
  where: 'lead' | 'bench';
  /** The trios to try, with the upgrade applied: one for `lead`, the lead trio itself. */
  trios: TrioCandidate[];
}

/** What a captain gives on all its lines at one level and star: the sum of the bonus points. */
function worthOf(record: CaptainRecord | undefined, level: number, star: number): number {
  if (record === undefined) return 0;
  let total = 0;
  for (const line of [record.health, record.strength, record.special])
    if (line !== undefined) total += captainValue(line, level, star);
  return total;
}

const changeOf = (spec: CaptainUpgradeSpec): string =>
  spec.kind === 'star'
    ? `★${String(spec.from.star)} → ★${String(spec.to.star)}`
    : `L${String(spec.from.level)} → L${String(spec.to.level)}`;

/**
 * The profile with one captain entry raised to `to`; every other entry, source and setup shared with the input
 * (nothing is mutated).
 */
function raised(profile: Profile, spec: CaptainUpgradeSpec): Profile {
  return {
    ...profile,
    sources: {
      ...profile.sources,
      captains: profile.sources.captains.map((entry) =>
        entry.id === spec.entryId ? { ...entry, level: spec.to.level, star: spec.to.star } : entry,
      ),
    },
  };
}

/**
 * Every upgrade of the march's captains with the trios to try it in, read against `lead` (the trio the captain
 * advice found best; the current one where none gains). Upgrades the march type does not count, and those that
 * add nothing to the captain's lines, are not listed.
 */
export function captainUpgradeCandidates(
  profile: Profile,
  setup: BattleSetup,
  lead: TrioCandidate,
  tables: DeriveTables = DEFAULT_TABLES,
): UpgradeCandidate[] {
  const record = (captainId: string): CaptainRecord | undefined =>
    tables.captains.find((candidate) => candidate.id === captainId);
  const counts = (captainId: string): boolean => captainCounts(record(captainId), setup.marchType);
  const specs = captainUpgrades(profile.sources.captains, counts, (captainId, level, star) =>
    worthOf(record(captainId), level, star),
  );
  return specs.map((spec): UpgradeCandidate => {
    const after = raised(profile, spec);
    const name = record(spec.captainId)?.name ?? spec.captainId;
    if (inLeadTrio(spec, lead.captainIds))
      return {
        spec,
        name,
        change: changeOf(spec),
        where: 'lead',
        trios: [{ ...lead, totals: trioTotals(after, setup, lead.entryIds, tables) }],
      };
    const trios = trioContaining(after.sources.captains, spec.captainId, counts).map(
      (trio): TrioCandidate => {
        const captainIds = trio.map((entry) => entry.captainId);
        const entryIds = trio.map((entry) => entry.id);
        return {
          key: trioKey(captainIds),
          entryIds,
          captainIds,
          current: false,
          totals: trioTotals(after, setup, entryIds, tables),
        };
      },
    );
    return { spec, name, change: changeOf(spec), where: 'bench', trios };
  });
}
