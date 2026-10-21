/**
 * **The upgrades the captain advice asks about** (W17 C5b, `docs/plans/progression-advisor.md` §4 C5), built on
 * the main thread like the lineups (`captainLineups.ts`): the worker only takes totals already summed.
 *
 * For each owned captain below the top star, `star + 1`, `level + 1` and `level + 10`, the delta read off
 * `captains.json` (`captainValue`), nothing typed. Each upgrade carries the lineups it has to be tried in, with
 * the upgrade applied to the profile and every other source left as the march has it:
 *
 *  - `where: 'lead'` — the captain is in the lead lineup: the lead lineup alone, with the upgrade added (the cheap form);
 *  - `where: 'bench'` — it is not: every allowed lineup that fields it, to be screened and the best planned in full.
 *
 * The enumeration and its membership logic are engine (`src/engine/captainUpgrades.ts`).
 */
import {
  captainUpgrades,
  inLeadLineup,
  lineupContaining,
  worthUpgrades,
  type CaptainUpgradeSpec,
  type WorthSpec,
} from '../engine/captainUpgrades';
import { lineupKey } from '../engine/captains';
import type { CaptainRecord } from '../data/types';
import type { BattleSetup, Profile } from './schema';
import { captainCounts, captainValue, DEFAULT_TABLES } from './derive';
import type { DeriveTables } from './derive';
import { lineupTotals, type LineupCandidate } from './captainLineups';

export interface UpgradeCandidate {
  spec: CaptainUpgradeSpec;
  /** "Aydae", the captain's name as the tables have it. */
  name: string;
  /** What changes: `★2 → ★3`, `L20 → L21`. */
  change: string;
  /** Where the upgrade is tried: the lead lineup alone, or every lineup that fields the captain. */
  where: 'lead' | 'bench';
  /** The lineups to try, with the upgrade applied: one for `lead`, the lead lineup itself. */
  lineups: LineupCandidate[];
}

/** What a captain gives on all its lines at one level and star: the sum of the bonus points. */
function worthOf(record: CaptainRecord | undefined, level: number, star: number): number {
  if (record === undefined) return 0;
  let total = 0;
  for (const line of [record.health, record.strength, record.special])
    if (line !== undefined) total += captainValue(line, level, star);
  return total;
}

const changeOf = (spec: Pick<CaptainUpgradeSpec, 'kind' | 'from' | 'to'>): string =>
  spec.kind === 'star'
    ? `★${String(spec.from.star)} → ★${String(spec.to.star)}`
    : `L${String(spec.from.level)} → L${String(spec.to.level)}`;

/**
 * The profile with one captain entry raised to `to`; every other entry, source and setup shared with the input
 * (nothing is mutated).
 */
function raised(profile: Profile, spec: Pick<CaptainUpgradeSpec, 'entryId' | 'to'>): Profile {
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
 * Every upgrade of the march's captains with the lineups to try it in, read against `lead` (the lineup the captain
 * advice found best; the current one where none gains). Upgrades the march type does not count, and those that
 * add nothing to the captain's lines, are not listed.
 *
 * `size` is the march's own lineup size (`lineupSize`): a benched captain's upgrade is tried in every lineup of
 * that size that fields it — the same size as the march's set, so the swap it reports is one the player could
 * actually march. Required, not defaulted, so a stale `LINEUP_SIZE` cannot be used by mistake.
 */
export function captainUpgradeCandidates(
  profile: Profile,
  setup: BattleSetup,
  lead: LineupCandidate,
  size: number,
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
    if (inLeadLineup(spec, lead.captainIds))
      return {
        spec,
        name,
        change: changeOf(spec),
        where: 'lead',
        lineups: [{ ...lead, totals: lineupTotals(after, setup, lead.entryIds, tables) }],
      };
    const lineups = lineupContaining(after.sources.captains, spec.captainId, counts, size).map(
      (lineup): LineupCandidate => {
        const captainIds = lineup.map((entry) => entry.captainId);
        const entryIds = lineup.map((entry) => entry.id);
        return {
          key: lineupKey(captainIds),
          entryIds,
          captainIds,
          current: false,
          totals: lineupTotals(after, setup, entryIds, tables),
        };
      },
    );
    return { spec, name, change: changeOf(spec), where: 'bench', lineups };
  });
}

/** One probe of the worth list with the lineups to try it in (`docs/plans/captain-upgrade-worth.md`). */
export interface WorthCandidate {
  spec: WorthSpec;
  name: string;
  /** What changes: `★2 → ★4`, `L20 → L25`. */
  change: string;
  where: 'lead' | 'bench';
  /** The bonus points one level adds on all the captain's lines, which the inference between level probes scales by. */
  perLevel: number;
  lineups: LineupCandidate[];
}

/**
 * Every probe of the worth list (`worthUpgrades`: levels +5/+10/+15 clamped to the top level, every remaining star)
 * with the lineups to try it in, read against `lead`: a captain in the lead lineup in that lineup alone, a benched
 * one in every lineup of `size` that fields it. Owned captains only (`distinctCaptains`).
 */
export function captainWorthCandidates(
  profile: Profile,
  setup: BattleSetup,
  lead: LineupCandidate,
  size: number,
  tables: DeriveTables = DEFAULT_TABLES,
): WorthCandidate[] {
  const record = (captainId: string): CaptainRecord | undefined =>
    tables.captains.find((candidate) => candidate.id === captainId);
  const counts = (captainId: string): boolean => captainCounts(record(captainId), setup.marchType);
  const specs = worthUpgrades(profile.sources.captains, counts, (captainId, level, star) =>
    worthOf(record(captainId), level, star),
  );
  return specs.map((spec): WorthCandidate => {
    const after = raised(profile, spec);
    const found = record(spec.captainId);
    const perLevel = [found?.health, found?.strength, found?.special].reduce(
      (sum, line) => sum + (line?.perLevel ?? 0),
      0,
    );
    const base = { spec, name: found?.name ?? spec.captainId, change: changeOf(spec), perLevel };
    if (inLeadLineup(spec, lead.captainIds))
      return {
        ...base,
        where: 'lead',
        lineups: [{ ...lead, totals: lineupTotals(after, setup, lead.entryIds, tables) }],
      };
    const lineups = lineupContaining(after.sources.captains, spec.captainId, counts, size).map(
      (lineup): LineupCandidate => {
        const captainIds = lineup.map((entry) => entry.captainId);
        const entryIds = lineup.map((entry) => entry.id);
        return {
          key: lineupKey(captainIds),
          entryIds,
          captainIds,
          current: false,
          totals: lineupTotals(after, setup, entryIds, tables),
        };
      },
    );
    return { ...base, where: 'bench', lineups };
  });
}
