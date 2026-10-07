/**
 * Two copies of the document, one answer (S-49d, docs/plans/sso-accounts.md §6). Pure, so it can be
 * tested on its own and run on every save without a second thought.
 *
 * The unit is the **record**, not the document: profiles are united by id, and inside a profile its
 * marches (setups) and saved marches are united the same way. Where both copies hold a record, the
 * one edited last wins (`updatedAt`, then `rev`): so a profile edited on the phone and another edited
 * on the PC both survive, and so do two marches of one profile. The one thing that can be lost is the
 * older of two edits to the *same* record between two syncs — accepted by the owner as the price of
 * never being asked (2026-10-07).
 *
 * Deletions travel as tombstones (already in the document since S-45): a tombstoned id is gone on
 * both sides, whichever side still had it. Ids are UUIDs and never come back, so a tombstone needs no
 * date comparison.
 *
 * What describes *this browser* stays this browser's: `deviceId`, `deviceName`, the active profile,
 * the theme.
 */
import type { BattleSetup, Profile, RootDocument, SavedStack, SyncMeta, Tombstone } from '@/state/schema';

/** `a` if it was edited after `b`; the counter breaks a tie of clocks. */
function newer<T extends SyncMeta>(a: T, b: T): T {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt ? a : b;
  return a.rev >= b.rev ? a : b;
}

/** Union by id, in `local`'s order then `remote`'s newcomers, minus anything deleted anywhere. */
function unite<T extends SyncMeta>(
  local: T[],
  remote: T[],
  deleted: Set<string>,
  combine: (winner: T, other: T) => T = (winner) => winner,
): T[] {
  const remoteById = new Map(remote.map((record) => [record.id, record]));
  const localIds = new Set(local.map((record) => record.id));
  const merged = local.map((record) => {
    const other = remoteById.get(record.id);
    if (other === undefined) return record;
    const winner = newer(record, other);
    return combine(winner, winner === record ? other : record);
  });
  for (const record of remote) if (!localIds.has(record.id)) merged.push(record);
  return merged.filter((record) => !deleted.has(record.id));
}

function mergeTombstones(local: Tombstone[], remote: Tombstone[]): Tombstone[] {
  const byId = new Map<string, Tombstone>();
  for (const tombstone of [...local, ...remote]) {
    const known = byId.get(tombstone.id);
    if (known === undefined || tombstone.deletedAt > known.deletedAt) byId.set(tombstone.id, tombstone);
  }
  return [...byId.values()];
}

/** The newer profile's own fields, with both copies' marches and saved marches united. */
function combineProfiles(deleted: Set<string>) {
  return (winner: Profile, other: Profile): Profile => {
    const setups = unite<BattleSetup>(winner.setups, other.setups, deleted);
    const savedStacks = unite<SavedStack>(winner.savedStacks, other.savedStacks, deleted);
    // A profile always keeps one march (ADR-0004); both copies cannot have lost all of theirs.
    const kept = setups.length > 0 ? setups : winner.setups;
    const activeSetupId = kept.some((setup) => setup.id === winner.activeSetupId)
      ? winner.activeSetupId
      : (kept[0]?.id ?? winner.activeSetupId);
    return { ...winner, setups: kept, activeSetupId, savedStacks };
  };
}

export function mergeDocuments(local: RootDocument, remote: RootDocument): RootDocument {
  const tombstones = mergeTombstones(local.tombstones, remote.tombstones);
  const deleted = new Set(tombstones.map((tombstone) => tombstone.id));
  const profiles = unite(local.profiles, remote.profiles, deleted, combineProfiles(deleted));
  const activeProfileId = profiles.some((profile) => profile.id === local.activeProfileId)
    ? local.activeProfileId
    : (profiles[0]?.id ?? local.activeProfileId);
  return { ...local, profiles, tombstones, activeProfileId };
}

/** True when the two copies hold the same records: nothing to push, nothing to apply. */
export function sameContent(a: RootDocument, b: RootDocument): boolean {
  return JSON.stringify([a.profiles, a.tombstones]) === JSON.stringify([b.profiles, b.tombstones]);
}
