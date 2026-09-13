/**
 * Account state and the four things a player can do with it (S-49b, ADR-0009): sign in, save, load,
 * sign out. The flows live here rather than in the menu so they can be driven without React, and so
 * the menu stays a list of rows.
 *
 * Nothing in here runs on its own. There is no background sync, no auto-push after an edit and no
 * auto-pull on start beyond revalidating the token: the local document is the source of truth and
 * the account is a place to put a copy of it (ADR-0009, constraint 1).
 *
 * This module must not import the PocketBase SDK — `client.ts` loads it behind a dynamic import, and
 * the account rows are part of the first load.
 */
import { create } from 'zustand';
import type { StoreApi } from 'zustand';

import { migrate } from '@/state/migrations';
import type { RootDocument } from '@/state/schema';
import { useStore, type StoreState } from '@/state/store';

import {
  accountErrorMessage,
  hasStoredSession,
  isAccountConfigured,
  loadDeviceState,
  saveDeviceState,
} from './client';
import type { AccountUser } from './schema';
import { pull, push, type RemoteProfile } from './sync';

/** Which request is in flight; the rows disable themselves rather than spinning. */
export type AccountBusy = 'none' | 'signin' | 'save' | 'load';

/** The surfaces the account rows can open. */
export type AccountDialog = 'signin' | 'load' | 'conflict' | null;

export interface AccountConflict {
  /** The version the account holds right now — always ahead of ours, or this would not be a conflict. */
  serverVersion: number;
  /** PocketBase's `YYYY-MM-DD HH:MM:SS.sssZ`; displayed, never parsed. */
  updated: string;
}

export interface AccountState {
  /** False when the build carries no backend origin: the rows are not rendered at all. */
  enabled: boolean;
  user: AccountUser | null;
  /** The version last pulled or pushed; `0` until the first save (spec §5.4). */
  remoteVersion: number;
  deviceId: string;
  /** True from the first local edit after a save, cleared by the next one. Drives the Save row. */
  dirty: boolean;
  busy: AccountBusy;
  /** One word under the row once something worked: "Saved", "Loaded". */
  notice: string;
  /** One sentence when something did not. */
  error: string;
  conflict: AccountConflict | null;
  dialog: AccountDialog;
  /** A blob already fetched (the first pull after sign-in), waiting for the player to confirm. */
  pending: RemoteProfile | null;

  setDialog: (dialog: AccountDialog) => void;
  clearMessages: () => void;
  markDirty: () => void;
  /** Called by the sign-in dialog and by the OAuth callback once a user record is in hand. */
  adopt: (user: AccountUser) => Promise<void>;
  save: () => Promise<void>;
  /** Apply the account's copy over this browser's. Always behind a confirmation. */
  load: () => Promise<void>;
  /** The two lossy ways out of a 409 (spec §5.5). */
  resolveConflict: (choice: 'server' | 'device') => Promise<void>;
  signOut: () => Promise<void>;
  /** Revalidate a stored token on start-up; does nothing when there is none. */
  restore: () => Promise<void>;
}

const device = loadDeviceState();

export const useAccountStore = create<AccountState>()((set, get) => {
  /** Remember the version this device is now level with, across reloads. */
  const rememberVersion = (remoteVersion: number): void => {
    saveDeviceState({ deviceId: get().deviceId, remoteVersion });
    set({ remoteVersion });
  };

  /**
   * Replace the local document with a pulled blob. The device's own identity is kept: `deviceId`
   * and `deviceName` describe *this* browser and travel inside the blob only because the blob is
   * the whole document, so taking the other device's values would make two browsers the same one.
   */
  const applyRemote = (remote: RemoteProfile, api: StoreApi<StoreState>): void => {
    let document: RootDocument;
    try {
      document = migrate(remote.data);
    } catch (error) {
      set({ error: accountErrorMessage(error), busy: 'none' });
      throw error;
    }
    const local = api.getState().doc;
    api.getState().replaceDocument({
      ...document,
      deviceId: local.deviceId,
      deviceName: local.deviceName,
    });
    rememberVersion(remote.version);
    // `replaceDocument` has just marked the document dirty through `trackAccountChanges`; it is not.
    set({ dirty: false, notice: 'Loaded', error: '', conflict: null, pending: null, dialog: null });
  };

  return {
    enabled: isAccountConfigured(),
    user: null,
    remoteVersion: device.remoteVersion,
    deviceId: device.deviceId,
    dirty: false,
    busy: 'none',
    notice: '',
    error: '',
    conflict: null,
    dialog: null,
    pending: null,

    setDialog: (dialog) => {
      set({ dialog, error: '' });
    },

    clearMessages: () => {
      set({ notice: '', error: '' });
    },

    markDirty: () => {
      if (!get().dirty) set({ dirty: true, notice: '' });
    },

    /**
     * Just signed in. The account may already hold a profile saved from another device; it is
     * fetched at once but applied only after the player says so — a sign-in must never overwrite
     * what is on screen behind their back (spec §5.5's spirit, applied to the first run).
     */
    adopt: async (user) => {
      set({ user, busy: 'load', error: '', dialog: null });
      try {
        const remote = await pull();
        if (remote === null) {
          rememberVersion(0);
          set({ pending: null, busy: 'none' });
          return;
        }
        set({ pending: remote, dialog: 'load', busy: 'none' });
      } catch (error) {
        set({ error: accountErrorMessage(error), busy: 'none' });
      }
    },

    save: async () => {
      const { user, remoteVersion, deviceId } = get();
      if (user === null) return;
      set({ busy: 'save', error: '', notice: '' });
      try {
        const result = await push(useStore.getState().doc, remoteVersion, deviceId);
        if (!result.ok) {
          set({
            conflict: { serverVersion: result.serverVersion, updated: result.updated },
            dialog: 'conflict',
            busy: 'none',
          });
          return;
        }
        rememberVersion(result.version);
        set({ dirty: false, notice: 'Saved', busy: 'none' });
      } catch (error) {
        set({ error: accountErrorMessage(error), busy: 'none' });
      }
    },

    load: async () => {
      const { user, pending } = get();
      if (user === null) return;
      set({ busy: 'load', error: '' });
      try {
        const remote = pending ?? (await pull());
        if (remote === null) {
          set({ error: 'Nothing has been saved to this account yet.', busy: 'none', dialog: null });
          return;
        }
        applyRemote(remote, useStore);
        set({ busy: 'none' });
      } catch {
        set({ busy: 'none' });
      }
    },

    /**
     * `server` takes the account's copy and loses this device's unsaved edits. `device` re-reads the
     * server's version (another device may have moved again since the 409) and saves on top of it,
     * losing whatever the other device wrote. Both are lossy, which is why the dialog says so.
     */
    resolveConflict: async (choice) => {
      if (choice === 'server') {
        set({ pending: null });
        await get().load();
        return;
      }
      const { user, deviceId } = get();
      if (user === null) return;
      set({ busy: 'save', error: '' });
      try {
        const remote = await pull();
        const baseVersion = remote?.version ?? 0;
        const result = await push(useStore.getState().doc, baseVersion, deviceId);
        if (!result.ok) {
          set({
            conflict: { serverVersion: result.serverVersion, updated: result.updated },
            dialog: 'conflict',
            busy: 'none',
          });
          return;
        }
        rememberVersion(result.version);
        set({ dirty: false, notice: 'Saved', busy: 'none', conflict: null, dialog: null });
      } catch (error) {
        set({ error: accountErrorMessage(error), busy: 'none' });
      }
    },

    signOut: async () => {
      // Loaded lazily: signing out must not be the thing that pulls the SDK into the first load.
      const { signOut } = await import('./auth');
      try {
        await signOut();
      } catch {
        /* there is nothing useful to say: the local session is dropped either way */
      }
      rememberVersion(0);
      set({
        user: null,
        dirty: false,
        notice: '',
        error: '',
        conflict: null,
        pending: null,
        dialog: null,
      });
    },

    restore: async () => {
      if (!isAccountConfigured() || !hasStoredSession()) return;
      const { refreshSession } = await import('./auth');
      try {
        const user = await refreshSession();
        set({ user });
        if (user === null) rememberVersion(0);
      } catch {
        /* offline, or a backend that is down: the app does not care */
      }
    },
  };
});

/**
 * Mark the account copy stale on every local edit (spec §5.4). Mirrors `trackUnsavedChanges`, which
 * watches the same subscription for the *storage* side; the two dirty flags answer different
 * questions ("has it reached this browser's disk" and "has it reached the account").
 */
export function trackAccountChanges(api: StoreApi<StoreState> = useStore): () => void {
  return api.subscribe((state, previous) => {
    if (state.doc !== previous.doc) useAccountStore.getState().markDirty();
  });
}
