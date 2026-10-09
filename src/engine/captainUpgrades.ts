/**
 * **Where the next star (or level) goes** (W17 C5b, `docs/plans/progression-advisor.md` §4 C5): which upgrades
 * of an owned captain are worth asking about, and which trios each one has to be tried in.
 *
 * Pure engine, like `captains.ts`: it reads no table and no profile. The caller (`src/state/captainUpgrades.ts`)
 * says what an upgrade is worth in bonus points (`worth`, read off `captains.json`, so nothing is typed) and
 * builds the totals; the pass over the pool (`src/worker/captainUpgrades.ts`) prices them.
 *
 * **The cheap form first.** An upgrade is read against the *lead trio* — the trio the captain advice found best
 * (`leadTrio`; the current one where none gains) — so what it reports is the star's own worth and never the swap
 * of trio it might also bring:
 *
 *  - the captain is in the lead trio → the one trio to try is the lead trio with the upgrade added;
 *  - the captain is not → only a trio that fields it can gain, so the trios that contain it (`trioContaining`)
 *    are re-screened and the best of them planned in full. A star on a captain who stays on the bench gains 0.
 */
import type { RosterCaptain } from './captains';
import { allowedTrios, distinctCaptains } from './captains';

/** Stars stop here (`captainEntrySchema`, `src/state/schema.ts`). */
export const CAPTAIN_MAX_STAR = 6;

/** What an upgrade raises: one star, one level, or ten levels. */
export type UpgradeKind = 'star' | 'level' | 'level10';

export const UPGRADE_KINDS: readonly UpgradeKind[] = ['star', 'level', 'level10'];

/** How many levels each level kind adds. */
export const LEVEL_STEPS = { level: 1, level10: 10 } as const;

/** One upgrade of one owned captain: the values the captain would have after it. */
export interface CaptainUpgradeSpec {
  /** Stable and unique: `captain:<captainId>:<kind>`, the probe id of the row. */
  id: string;
  captainId: string;
  /** The profile entry it raises: the strongest of the captain's entries, the one a trio fields. */
  entryId: string;
  kind: UpgradeKind;
  /** Level and star before and after. */
  from: { level: number; star: number };
  to: { level: number; star: number };
}

export function upgradeId(captainId: string, kind: UpgradeKind): string {
  return `captain:${captainId}:${kind}`;
}

/**
 * Every upgrade worth asking about: for each distinct owned captain the march type admits, `star + 1` while
 * below the top star, `level + 1` and `level + 10`. An upgrade that adds nothing to the captain's lines
 * (`worth` does not rise) is left out: it cannot gain, so it is not a question. Order: captains as first owned,
 * then star, level, level 10.
 */
export function captainUpgrades<T extends RosterCaptain & { id: string }>(
  owned: readonly T[],
  allowed: (captainId: string) => boolean,
  worth: (captainId: string, level: number, star: number) => number,
): CaptainUpgradeSpec[] {
  const out: CaptainUpgradeSpec[] = [];
  for (const entry of distinctCaptains(owned)) {
    if (!allowed(entry.captainId)) continue;
    const before = worth(entry.captainId, entry.level, entry.star);
    for (const kind of UPGRADE_KINDS) {
      const to =
        kind === 'star'
          ? { level: entry.level, star: entry.star + 1 }
          : { level: entry.level + LEVEL_STEPS[kind], star: entry.star };
      if (to.star > CAPTAIN_MAX_STAR) continue;
      if (worth(entry.captainId, to.level, to.star) <= before) continue;
      out.push({
        id: upgradeId(entry.captainId, kind),
        captainId: entry.captainId,
        entryId: entry.id,
        kind,
        from: { level: entry.level, star: entry.star },
        to,
      });
    }
  }
  return out;
}

/**
 * **The trio the upgrades are read against**: the one winning the most gain over the stops of the bar, the
 * current trio where no other trio gains and on every tie (the first trio to reach the highest total wins, the
 * current trio is counted first).
 */
export function leadTrio(best: readonly { trio: string; gain: number }[], currentKey: string): string {
  const totals = new Map<string, number>([[currentKey, 0]]);
  for (const stop of best) totals.set(stop.trio, (totals.get(stop.trio) ?? 0) + stop.gain);
  let lead = currentKey;
  let most = 0;
  for (const [key, total] of totals)
    if (total > most) {
      lead = key;
      most = total;
    }
  return lead;
}

/** Is the captain one of the lead trio's? Then the upgrade is tried in that trio alone. */
export function inLeadTrio(
  upgrade: Pick<CaptainUpgradeSpec, 'captainId'>,
  leadCaptainIds: readonly string[],
): boolean {
  return leadCaptainIds.includes(upgrade.captainId);
}

/**
 * Every allowed trio that fields `captainId`, in index order: where an upgrade of a captain outside the lead
 * trio can pay. `owned` is the roster *after* the upgrade, so a trio's order and identity are the same as before.
 */
export function trioContaining<T extends RosterCaptain>(
  owned: readonly T[],
  captainId: string,
  allowed: (captainId: string) => boolean,
): T[][] {
  return allowedTrios(owned, allowed).filter((trio) => trio.some((entry) => entry.captainId === captainId));
}
