/**
 * Store actions the Bonuses section needs beyond a plain `updateProfile` / `updateActiveSetup` patch
 * (S-14…S-18).
 *
 * Two invariants live here rather than in the components:
 * - deleting a source entry (a captain, a piece of equipment, an artifact, a custom source) also switches
 *   it off in *every* battle setup, not only the one on screen, so `setup.active` never points at an entry
 *   the profile no longer has;
 * - un-owning a title switches it off everywhere too, which is what keeps `active.titles ⊆ sources.titles`.
 *
 * Setups touched that way are stamped (`rev` / `updatedAt` / `deviceId`) exactly like `store.ts` stamps
 * them, because the profile patch goes in as one write.
 */
import type { ActiveSources, BattleSetup, ProfileSources } from '../schema';
import { useStore } from '../store';

/** Lists of `setup.active`: entry ids for owned sources, table ids for titles, events and the +25 pills. */
export type ActiveListKey =
  'captains' | 'equipment' | 'artifacts' | 'titles' | 'events' | 'otherPills' | 'custom';

/** Lists that exist both in `profile.sources` (the entries) and in `setup.active` (the ids switched on). */
export type EntryListKey = 'captains' | 'equipment' | 'artifacts' | 'custom';

/** The on/off sources of `setup.active` that have no list of their own. */
export type ActiveFlagKey = 'hero' | 'vip' | 'dragon' | 'unknown';

const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** How many characters a minted source id has. Share links carry them verbatim, so they stay short. */
export const SOURCE_ID_LENGTH = 8;

/** A short random id for a new source entry (≈2.8 × 10¹² values, plenty for a few dozen entries). */
export function mintSourceId(): string {
  const bytes = new Uint8Array(SOURCE_ID_LENGTH);
  crypto.getRandomValues(bytes);
  let id = '';
  for (const byte of bytes) id += ID_ALPHABET.charAt(byte % ID_ALPHABET.length);
  return id;
}

/** Replace `profile.sources` through the store, so the profile is stamped once. */
export function updateSources(profileId: string, updater: (sources: ProfileSources) => ProfileSources): void {
  useStore.getState().updateProfile(profileId, (profile) => ({ sources: updater(profile.sources) }));
}

/** Switch one id on or off in the active setup. */
export function toggleActiveSource(key: ActiveListKey, id: string, on: boolean): void {
  useStore.getState().updateActiveSetup((setup) => {
    const list = setup.active[key];
    if (on === list.includes(id)) return {};
    const active: ActiveSources = { ...setup.active };
    active[key] = on ? [...list, id] : list.filter((entry) => entry !== id);
    return { active };
  });
}

/** Switch a flag source (hero, VIP, dragon, unknown sources) on or off in the active setup. */
export function setActiveFlag(key: ActiveFlagKey, on: boolean): void {
  useStore.getState().updateActiveSetup((setup) => {
    if (setup.active[key] === on) return {};
    const active: ActiveSources = { ...setup.active, [key]: on };
    return { active };
  });
}

const stamped = (setup: BattleSetup, active: ActiveSources, deviceId: string): BattleSetup => ({
  ...setup,
  active,
  rev: setup.rev + 1,
  updatedAt: Date.now(),
  deviceId,
});

/** Every setup with `id` removed from one of its active lists; untouched setups keep their revision. */
function deactivateEverywhere(
  setups: BattleSetup[],
  key: ActiveListKey,
  id: string,
  deviceId: string,
): BattleSetup[] {
  return setups.map((setup) => {
    const list = setup.active[key];
    if (!list.includes(id)) return setup;
    const active: ActiveSources = { ...setup.active };
    active[key] = list.filter((entry) => entry !== id);
    return stamped(setup, active, deviceId);
  });
}

function withoutEntry<T extends { id: string }>(entries: T[], entryId: string): T[] {
  return entries.filter((entry) => entry.id !== entryId);
}

/** Delete one owned source entry and switch it off in every battle setup of the profile. */
export function removeSourceEntry(profileId: string, key: EntryListKey, entryId: string): void {
  const { deviceId } = useStore.getState().doc;
  useStore.getState().updateProfile(profileId, (profile) => {
    const sources: ProfileSources = { ...profile.sources };
    if (key === 'captains') sources.captains = withoutEntry(sources.captains, entryId);
    else if (key === 'equipment') sources.equipment = withoutEntry(sources.equipment, entryId);
    else if (key === 'artifacts') sources.artifacts = withoutEntry(sources.artifacts, entryId);
    else sources.custom = withoutEntry(sources.custom, entryId);
    return { sources, setups: deactivateEverywhere(profile.setups, key, entryId, deviceId) };
  });
}

/** Delete a permanent editor row (custom ones only; the eight builtin editors are never removed). */
export function removePermanentSource(profileId: string, entryId: string): void {
  updateSources(profileId, (sources) => ({
    ...sources,
    permanent: sources.permanent.filter((entry) => entry.builtin !== undefined || entry.id !== entryId),
  }));
}

/**
 * Mark a title as owned by the account, or give it up. Giving it up also switches it off in every setup,
 * which is what keeps the active titles a subset of the owned ones.
 */
export function setTitleOwned(profileId: string, titleId: string, owned: boolean): void {
  const { deviceId } = useStore.getState().doc;
  useStore.getState().updateProfile(profileId, (profile) => {
    const titles = profile.sources.titles.filter((id) => id !== titleId);
    if (owned) titles.push(titleId);
    return {
      sources: { ...profile.sources, titles },
      setups: owned ? profile.setups : deactivateEverywhere(profile.setups, 'titles', titleId, deviceId),
    };
  });
}
