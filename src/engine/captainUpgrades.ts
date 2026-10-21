/**
 * **Where the next star (or level) goes** (W17 C5b, `docs/plans/progression-advisor.md` §4 C5): which upgrades
 * of an owned captain are worth asking about, and which lineups each one has to be tried in.
 *
 * Pure engine, like `captains.ts`: it reads no table and no profile. The caller (`src/state/captainUpgrades.ts`)
 * says what an upgrade is worth in bonus points (`worth`, read off `captains.json`, so nothing is typed) and
 * builds the totals; the pass over the pool (`src/worker/captainUpgrades.ts`) prices them.
 *
 * **The cheap form first.** An upgrade is read against the *lead lineup* — the lineup the captain advice found best
 * (`leadLineup`; the current one where none gains) — so what it reports is the star's own worth and never the swap
 * of lineup it might also bring:
 *
 *  - the captain is in the lead lineup → the one lineup to try is the lead lineup with the upgrade added;
 *  - the captain is not → only a lineup that fields it can gain, so the lineups that contain it (`lineupContaining`)
 *    are re-screened and the best of them planned in full. A star on a captain who stays on the bench gains 0.
 */
import { CAMPAIGN } from '../config';
import type { RosterCaptain } from './captains';
import { allowedLineups, distinctCaptains, LINEUP_SIZE } from './captains';

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
  /** The profile entry it raises: the strongest of the captain's entries, the one a lineup fields. */
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
 * **The lineup the upgrades are read against**: the one winning the most gain over the stops of the bar, the
 * current lineup where no other lineup gains and on every tie (the first lineup to reach the highest total wins, the
 * current lineup is counted first).
 */
export function leadLineup(best: readonly { lineup: string; gain: number }[], currentKey: string): string {
  const totals = new Map<string, number>([[currentKey, 0]]);
  for (const stop of best) totals.set(stop.lineup, (totals.get(stop.lineup) ?? 0) + stop.gain);
  let lead = currentKey;
  let most = 0;
  for (const [key, total] of totals)
    if (total > most) {
      lead = key;
      most = total;
    }
  return lead;
}

/** Is the captain one of the lead lineup's? Then the upgrade is tried in that lineup alone. */
export function inLeadLineup(
  upgrade: Pick<CaptainUpgradeSpec, 'captainId'>,
  leadCaptainIds: readonly string[],
): boolean {
  return leadCaptainIds.includes(upgrade.captainId);
}

/**
 * Every allowed lineup **of `size`** that fields `captainId`, in index order: where an upgrade of a captain
 * outside the lead lineup can pay. `owned` is the roster *after* the upgrade, so a lineup's order and identity
 * are the same as before. `size` is the march's own lineup size (`lineupSize`), so the swaps an upgrade is tried
 * in are the same size as the march's set.
 */
export function lineupContaining<T extends RosterCaptain>(
  owned: readonly T[],
  captainId: string,
  allowed: (captainId: string) => boolean,
  size: number = LINEUP_SIZE,
): T[][] {
  return allowedLineups(owned, allowed, size).filter((lineup) =>
    lineup.some((entry) => entry.captainId === captainId),
  );
}

// ---- The worth list ---------------------------------------------------------------------------------
/** What a worth upgrade raises: stars (one to every remaining star) or levels (a probe step). */
export type WorthKind = 'star' | 'level';

/**
 * One probe of the worth list (`docs/plans/captain-upgrade-worth.md`): the captain's strongest entry raised by `size`
 * stars or levels. Unlike `CaptainUpgradeSpec` there is no fixed set of kinds: a star ladder and level steps.
 */
export interface WorthSpec {
  /** `captain:<captainId>:star+<size>` or `captain:<captainId>:level+<size>`. */
  id: string;
  captainId: string;
  entryId: string;
  kind: WorthKind;
  /** Stars or levels added. */
  size: number;
  from: { level: number; star: number };
  to: { level: number; star: number };
  /** The captain's level steps are not constant per level, so this level is probed itself and nothing is inferred. */
  exact?: true;
}

export function worthId(captainId: string, kind: WorthKind, size: number): string {
  return `captain:${captainId}:${kind}+${String(size)}`;
}

/** The per-level bonus of a captain is constant, within float noise, over the probed steps. */
function constantPerLevel(
  captainId: string,
  level: number,
  star: number,
  steps: readonly number[],
  worth: (captainId: string, level: number, star: number) => number,
): boolean {
  const base = worth(captainId, level, star);
  const one = worth(captainId, level + 1, star) - base;
  return steps.every(
    (n) => Math.abs(worth(captainId, level + n, star) - base - n * one) <= 1e-9 * Math.max(1, n),
  );
}

/**
 * Every probe of the worth list, per distinct owned captain the march type admits: its level steps
 * (`CAMPAIGN.captainLevelProbes`, each clamped to `maxLevel`, a clamp that repeats the step before dropped) then every
 * remaining star alone and cumulative (`star+1`, `star+2`, … up to the top star). A captain whose level steps are not
 * constant is probed at every level up to the largest step instead (`exact`). A probe that adds nothing to the
 * captain's lines is left out: it cannot gain.
 */
export function worthUpgrades<T extends RosterCaptain & { id: string }>(
  owned: readonly T[],
  allowed: (captainId: string) => boolean,
  worth: (captainId: string, level: number, star: number) => number,
  maxLevel: number = CAMPAIGN.captainMaxLevel,
): WorthSpec[] {
  const out: WorthSpec[] = [];
  const probes = CAMPAIGN.captainLevelProbes;
  for (const entry of distinctCaptains(owned)) {
    if (!allowed(entry.captainId)) continue;
    const { captainId, level, star } = entry;
    const before = worth(captainId, level, star);
    const room = Math.max(0, maxLevel - level);
    const clamped = [...new Set(probes.map((n) => Math.min(n, room)))].filter((n) => n > 0);
    const widest = clamped.length === 0 ? 0 : Math.max(...clamped);
    const steps = constantPerLevel(captainId, level, star, clamped, worth)
      ? clamped.map((n) => ({ n, exact: false }))
      : Array.from({ length: widest }, (_, at) => ({ n: at + 1, exact: true }));
    for (const { n, exact } of steps) {
      if (worth(captainId, level + n, star) <= before) continue;
      out.push({
        id: worthId(captainId, 'level', n),
        captainId,
        entryId: entry.id,
        kind: 'level',
        size: n,
        from: { level, star },
        to: { level: level + n, star },
        ...(exact ? { exact: true as const } : {}),
      });
    }
    for (let n = 1; star + n <= CAPTAIN_MAX_STAR; n += 1) {
      if (worth(captainId, level, star + n) <= before) continue;
      out.push({
        id: worthId(captainId, 'star', n),
        captainId,
        entryId: entry.id,
        kind: 'star',
        size: n,
        from: { level, star },
        to: { level, star: star + n },
      });
    }
  }
  return out;
}

/** A level probe as the inference reads it: the levels added, the bonus points they add, the gain read. */
export interface LevelProbe {
  levels: number;
  bonus: number;
  gain: number;
}

/**
 * The gain of a level step that was not probed: the nearest probe's gain (the smaller on a tie) scaled by the ratio of
 * the two steps' bonus points. Never a fit of the gains alone; 0 with no probe.
 */
export function inferLevelGain(
  probes: readonly LevelProbe[],
  target: { levels: number; bonus: number },
): number {
  let near: LevelProbe | undefined;
  for (const probe of probes)
    if (
      near === undefined ||
      Math.abs(probe.levels - target.levels) < Math.abs(near.levels - target.levels) ||
      (Math.abs(probe.levels - target.levels) === Math.abs(near.levels - target.levels) &&
        probe.levels < near.levels)
    )
      near = probe;
  if (near === undefined || near.bonus <= 0) return 0;
  return near.gain * (target.bonus / near.bonus);
}
