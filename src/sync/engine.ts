/**
 * Sync logic (S-44), pure over any `SyncStore`: `plan()` decides what should happen to every profile and
 * `apply()` carries it out. No HTTP, no React and no provider knowledge lives here, which is why the
 * whole decision table is tested against the in-memory store.
 *
 * The decision needs three revisions per profile: the local `rev`, the remote index `rev`, and what both
 * were at the last sync (`syncState[id]`, persisted by `syncStore.ts`). "Changed here" is
 * `local.rev !== lastSynced.rev`, "changed there" is `remote.rev !== lastSynced.remoteRev`; both at once
 * is a conflict and is never merged silently (investigation 0001). Deletions are tombstones on either
 * side, so a delete is not undone by the other device — unless the other device edited the profile after
 * the delete, which is itself a conflict.
 */
import { cloneProfileWithNewIds } from '../state/defaults';
import type { Profile, Tombstone } from '../state/schema';
import type { StoreState } from '../state/store';
import type { StoreApi } from 'zustand';

import type { RemoteIndex, RemoteProfileMeta, SyncStore } from './types';
import { syncErrorMessage } from './types';

export type SyncAction = 'push' | 'pull' | 'conflict' | 'delete-remote' | 'delete-local' | 'in-sync';
export type ConflictKind = 'both-edited' | 'remote-deleted' | 'local-deleted';
/** Keep both is only offered when both sides still exist. */
export type ConflictChoice = 'mine' | 'theirs' | 'both';

/** What this device knew at the end of the last successful sync of one profile. */
export interface SyncRecord {
  /** Local `profile.rev` at that moment. */
  rev: number;
  /** Remote index `rev` at that moment (the store's concurrency counter). */
  remoteRev: number;
  at: number;
}

export type SyncStateMap = Record<string, SyncRecord>;

export interface LocalProfileMeta {
  id: string;
  name: string;
  rev: number;
  updatedAt: number;
  setups: number;
  savedStacks: number;
}

export function localMeta(profile: Profile): LocalProfileMeta {
  return {
    id: profile.id,
    name: profile.name,
    rev: profile.rev,
    updatedAt: profile.updatedAt,
    setups: profile.setups.length,
    savedStacks: profile.savedStacks.length,
  };
}

export interface SyncPlanEntry {
  id: string;
  action: SyncAction;
  conflict?: ConflictKind;
  /** Best name available: the local one, else the remote one. */
  name: string;
  local: LocalProfileMeta | null;
  remote: RemoteProfileMeta | null;
  lastSynced: SyncRecord | null;
  /** One short sentence for the plan table. */
  reason: string;
}

export interface SyncPlan {
  entries: SyncPlanEntry[];
  counts: Record<SyncAction, number>;
}

export interface PlanInput {
  profiles: Profile[];
  tombstones: Tombstone[];
  remote: RemoteIndex;
  syncState: SyncStateMap;
}

const ZERO_COUNTS: Record<SyncAction, number> = {
  push: 0,
  pull: 0,
  conflict: 0,
  'delete-remote': 0,
  'delete-local': 0,
  'in-sync': 0,
};

/** Entries the user has to act on (or that change something) come first. */
const ORDER: Record<SyncAction, number> = {
  conflict: 0,
  pull: 1,
  push: 2,
  'delete-local': 3,
  'delete-remote': 4,
  'in-sync': 5,
};

export function plan(input: PlanInput): SyncPlan {
  const locals = new Map(input.profiles.map((profile) => [profile.id, profile]));
  const remotes = new Map(input.remote.profiles.map((meta) => [meta.id, meta]));
  const localTombstones = new Set(input.tombstones.map((stone) => stone.id));
  const remoteTombstones = new Set(input.remote.tombstones.map((stone) => stone.id));

  const ids = new Set<string>([...locals.keys(), ...remotes.keys()]);
  for (const id of localTombstones) if (remotes.has(id)) ids.add(id);
  for (const id of remoteTombstones) if (locals.has(id)) ids.add(id);

  const entries: SyncPlanEntry[] = [];
  for (const id of ids) {
    const profile = locals.get(id) ?? null;
    const remote = remotes.get(id) ?? null;
    const lastSynced = input.syncState[id] ?? null;
    const local = profile === null ? null : localMeta(profile);
    const base = {
      id,
      name: local?.name ?? remote?.name ?? 'Profile',
      local,
      remote,
      lastSynced,
    };
    const changedHere = local !== null && (lastSynced === null || local.rev !== lastSynced.rev);
    const changedThere = remote !== null && (lastSynced === null || remote.rev !== lastSynced.remoteRev);

    // 1. Deleted here.
    if (profile === null && localTombstones.has(id)) {
      if (remote === null) continue;
      if (changedThere && lastSynced !== null) {
        entries.push({
          ...base,
          action: 'conflict',
          conflict: 'local-deleted',
          reason: 'Deleted here, changed on the other device.',
        });
        continue;
      }
      entries.push({ ...base, action: 'delete-remote', reason: 'Deleted here; remove it from the gist.' });
      continue;
    }

    // 2. Deleted on another device.
    if (remote === null && remoteTombstones.has(id)) {
      if (profile === null) continue;
      if (changedHere && lastSynced !== null) {
        entries.push({
          ...base,
          action: 'conflict',
          conflict: 'remote-deleted',
          reason: 'Deleted on another device, changed here.',
        });
        continue;
      }
      entries.push({ ...base, action: 'delete-local', reason: 'Deleted on another device.' });
      continue;
    }

    // 3. Only on one side.
    if (remote === null) {
      entries.push({
        ...base,
        action: 'push',
        reason: lastSynced === null ? 'Not in the gist yet.' : 'Missing from the gist; send it again.',
      });
      continue;
    }
    if (profile === null) {
      entries.push({ ...base, action: 'pull', reason: 'Only in the gist.' });
      continue;
    }

    // 4. On both sides.
    if (!changedHere && !changedThere) {
      entries.push({ ...base, action: 'in-sync', reason: 'Up to date.' });
      continue;
    }
    if (changedHere && changedThere) {
      // Never synced but byte-identical (both devices imported the same export): adopt, do not ask.
      if (
        lastSynced === null &&
        local !== null &&
        local.rev === remote.docRev &&
        local.updatedAt === remote.updatedAt
      ) {
        entries.push({ ...base, action: 'in-sync', reason: 'Same version on both sides.' });
        continue;
      }
      entries.push({
        ...base,
        action: 'conflict',
        conflict: 'both-edited',
        reason: 'Changed here and on the other device.',
      });
      continue;
    }
    if (changedHere) {
      entries.push({ ...base, action: 'push', reason: 'Changed here since the last sync.' });
      continue;
    }
    entries.push({ ...base, action: 'pull', reason: 'Changed on the other device.' });
  }

  entries.sort((a, b) => ORDER[a.action] - ORDER[b.action] || a.name.localeCompare(b.name));
  const counts = { ...ZERO_COUNTS };
  for (const entry of entries) counts[entry.action] += 1;
  return { entries, counts };
}

// ---- Apply ------------------------------------------------------------------------------------------
export type ApplyStatus = 'done' | 'skipped' | 'conflict' | 'error';

export interface ApplyEntryResult {
  id: string;
  name: string;
  action: SyncAction;
  status: ApplyStatus;
  message?: string;
}

export interface ApplyResult {
  results: ApplyEntryResult[];
  /** The updated sync state; the caller persists it (`syncStore.setRecords`). */
  syncState: SyncStateMap;
  pushed: number;
  pulled: number;
  failed: number;
}

export interface ApplyInput {
  plan: SyncPlan;
  /** Conflict decisions, by profile id. A conflict with no choice is left alone. */
  choices: Record<string, ConflictChoice>;
  syncState: SyncStateMap;
  store: StoreApi<StoreState>;
  remote: SyncStore;
  now?: () => number;
}

/**
 * Execute a plan. Every entry is independent: one failure is reported against its profile and the rest
 * still run. Returns the sync state to persist and one result line per entry.
 */
export async function apply(input: ApplyInput): Promise<ApplyResult> {
  const { store, remote } = input;
  const now = input.now ?? (() => Date.now());
  const syncState: SyncStateMap = { ...input.syncState };
  const results: ApplyEntryResult[] = [];

  const currentProfile = (id: string): Profile | undefined =>
    store.getState().doc.profiles.find((profile) => profile.id === id);

  /** Replace or add the profile locally, keeping the remote identity, and return the resulting rev. */
  const writeLocal = (doc: Profile): number => {
    const state = store.getState();
    if (state.doc.profiles.some((profile) => profile.id === doc.id)) {
      const { id: _id, rev: _rev, updatedAt: _updatedAt, deviceId: _deviceId, ...rest } = doc;
      state.updateProfile(doc.id, rest);
    } else {
      state.addProfile(doc, { activate: false });
    }
    return currentProfile(doc.id)?.rev ?? doc.rev;
  };

  /** Bring a profile back that this device had deleted: drops the local tombstone too. */
  const restoreLocal = (doc: Profile): number => {
    const state = store.getState();
    const { doc: root } = state;
    state.replaceDocument({
      ...root,
      profiles: [...root.profiles.filter((profile) => profile.id !== doc.id), doc],
      tombstones: root.tombstones.filter((stone) => stone.id !== doc.id),
    });
    return currentProfile(doc.id)?.rev ?? doc.rev;
  };

  const pull = async (entry: SyncPlanEntry, restore: boolean): Promise<ApplyEntryResult> => {
    const doc = await remote.get(entry.id);
    if (doc === null) {
      return { ...line(entry), status: 'error', message: 'The gist no longer holds this profile.' };
    }
    const rev = restore ? restoreLocal(doc) : writeLocal(doc);
    const remoteRev = entry.remote?.rev ?? syncState[entry.id]?.remoteRev ?? 0;
    syncState[entry.id] = { rev, remoteRev, at: now() };
    return { ...line(entry), status: 'done' };
  };

  const push = async (entry: SyncPlanEntry, expectedRev: number | null): Promise<ApplyEntryResult> => {
    const profile = currentProfile(entry.id);
    if (profile === undefined) {
      return { ...line(entry), status: 'error', message: 'This profile is no longer on this device.' };
    }
    const outcome = await remote.put(entry.id, profile, expectedRev);
    if (!outcome.ok) {
      return {
        ...line(entry),
        status: 'conflict',
        message: 'The gist changed while syncing; check again.',
      };
    }
    syncState[entry.id] = { rev: profile.rev, remoteRev: outcome.rev, at: now() };
    return { ...line(entry), status: 'done' };
  };

  const removeRemote = async (entry: SyncPlanEntry): Promise<ApplyEntryResult> => {
    const outcome = await remote.delete(entry.id, entry.remote?.rev ?? null);
    if (!outcome.ok) {
      return { ...line(entry), status: 'conflict', message: 'The gist changed while syncing; check again.' };
    }
    delete syncState[entry.id];
    return { ...line(entry), status: 'done' };
  };

  const keepBoth = async (entry: SyncPlanEntry): Promise<ApplyEntryResult> => {
    const doc = await remote.get(entry.id);
    if (doc === null) {
      return { ...line(entry), status: 'error', message: 'The gist no longer holds this profile.' };
    }
    const state = store.getState();
    const suffix = entry.remote?.deviceName ?? 'other device';
    const copy = cloneProfileWithNewIds(doc, state.doc.deviceId, `${doc.name} (${suffix})`);
    state.addProfile(copy, { activate: false });
    // The copy is a brand-new profile here, so the next sync pushes it; the remote keeps mine.
    return push(entry, entry.remote?.rev ?? null);
  };

  for (const entry of input.plan.entries) {
    try {
      if (entry.action === 'in-sync') {
        if (entry.local !== null && entry.remote !== null && input.syncState[entry.id] === undefined) {
          syncState[entry.id] = { rev: entry.local.rev, remoteRev: entry.remote.rev, at: now() };
        }
        results.push({ ...line(entry), status: 'skipped' });
        continue;
      }
      if (entry.action === 'push') {
        results.push(await push(entry, entry.remote?.rev ?? null));
        continue;
      }
      if (entry.action === 'pull') {
        results.push(await pull(entry, false));
        continue;
      }
      if (entry.action === 'delete-remote') {
        results.push(await removeRemote(entry));
        continue;
      }
      if (entry.action === 'delete-local') {
        store.getState().deleteProfile(entry.id);
        delete syncState[entry.id];
        results.push({ ...line(entry), status: 'done' });
        continue;
      }

      const choice = input.choices[entry.id];
      if (choice === undefined) {
        results.push({ ...line(entry), status: 'skipped', message: 'Conflict left unresolved.' });
        continue;
      }
      if (entry.conflict === 'remote-deleted') {
        // Keep mine = put it back in the gist; keep theirs = accept the deletion here.
        if (choice === 'theirs') {
          store.getState().deleteProfile(entry.id);
          delete syncState[entry.id];
          results.push({ ...line(entry), status: 'done' });
        } else {
          results.push(await push(entry, null));
        }
        continue;
      }
      if (entry.conflict === 'local-deleted') {
        // Keep mine = delete it there too; keep theirs = bring it back here.
        if (choice === 'theirs') results.push(await pull(entry, true));
        else results.push(await removeRemote(entry));
        continue;
      }
      if (choice === 'mine') results.push(await push(entry, entry.remote?.rev ?? null));
      else if (choice === 'theirs') results.push(await pull(entry, false));
      else results.push(await keepBoth(entry));
    } catch (error) {
      results.push({ ...line(entry), status: 'error', message: syncErrorMessage(error) });
    }
  }

  const pushed = results.filter(
    (result) => result.status === 'done' && (result.action === 'push' || result.action === 'conflict'),
  ).length;
  const pulled = results.filter((result) => result.status === 'done' && result.action === 'pull').length;
  const failed = results.filter((result) => result.status === 'error' || result.status === 'conflict').length;
  return { results, syncState, pushed, pulled, failed };
}

function line(entry: SyncPlanEntry): { id: string; name: string; action: SyncAction } {
  return { id: entry.id, name: entry.name, action: entry.action };
}
