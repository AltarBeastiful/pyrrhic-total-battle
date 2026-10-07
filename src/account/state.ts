/**
 * Account state and everything a player can do with it (S-49b, S-49d): sign in, sign out, confirm
 * the address, change the password, delete the account — and, while signed in, keep the account and
 * this browser in step without being asked (docs/plans/sso-accounts.md §6).
 *
 * **Ownership.** Signed in, every profile on screen belongs to the account; signed out, every profile
 * on screen is this browser's alone. Which one the document on screen is, is remembered apart from
 * the session (`DeviceState.owner`), so a session that is gone is noticed even offline, and the
 * account's profiles never stay on screen, editable, for somebody who is not signed in.
 *
 * **Sync.** An edit saves itself 3 s later (and at once when the page is hidden); opening the app,
 * coming back to the tab and coming back online pull and merge. A save is a push of the whole document
 * at the version this device last saw; a 409 is answered by pulling, merging (`merge.ts`) and pushing
 * again. There is no question to answer: the merge is per record, and the later edit wins.
 *
 * This module must not import the PocketBase SDK — `client.ts` loads it behind a dynamic import, and
 * the account rows are part of the first load.
 */
import { create } from 'zustand';
import type { StoreApi } from 'zustand';

import { newProfile, newRoot, uniqueProfileName } from '@/state/defaults';
import { migrate } from '@/state/migrations';
import type { Profile, RootDocument } from '@/state/schema';
import { useStore, type StoreState } from '@/state/store';

import {
  AccountError,
  accountErrorMessage,
  hasStoredSession,
  isAccountConfigured,
  loadDeviceState,
  readCache,
  readStoredUser,
  saveDeviceState,
  writeCache,
  type DeviceState,
} from './client';
import type * as Auth from './auth';
import type { SignInMethods } from './auth';
import { mergeDocuments, sameContent } from './merge';
import type { AccountUser } from './schema';
import { pull, push, type RemoteProfile } from './sync';

/** How long after the last edit the account is saved. */
export const AUTOSAVE_MS = 3000;

/** Which errand is in flight; the rows disable themselves rather than spinning. */
export type AccountBusy = 'none' | 'signin' | 'signout' | 'verify' | 'password' | 'delete';

/** The surfaces the account rows can open. */
export type AccountDialog = 'signin' | 'account' | 'password' | 'delete' | 'merged' | 'left' | null;

/** Where the account copy stands, in the words the profile row uses. */
export type AccountSync = 'saved' | 'saving' | 'offline' | 'error';

/** What signing in did to the profiles this browser had made on its own. */
export interface MergeSummary {
  added: string[];
  renamed: { from: string; to: string }[];
}

export interface AccountState {
  /** False when the build carries no backend origin: the rows are not rendered at all. */
  enabled: boolean;
  user: AccountUser | null;
  /** The version last pulled or pushed; `0` until the first save (spec §5.4). */
  remoteVersion: number;
  deviceId: string;
  /** True from a local edit until the save that carries it has been accepted. */
  dirty: boolean;
  syncState: AccountSync;
  busy: AccountBusy;
  /** One sentence when something did not work. */
  error: string;
  /** Set once a confirmation email has been asked for again, so the row can say so. */
  verificationSent: boolean;
  dialog: AccountDialog;
  /** For the `merged` dialog. */
  merged: MergeSummary | null;
  /** For the `left` dialog: why the account's profiles left the screen. */
  leftReason: 'expired' | 'offline' | null;
  /** What the server offers (S-49c), read once by the first dialog that needs it; `null` until then. */
  methods: SignInMethods | null;

  setDialog: (dialog: AccountDialog) => void;
  /** Called on every local edit; schedules the autosave while signed in. */
  markDirty: () => void;
  /** Just signed in: bring the account's profiles in and add this browser's own to them. */
  adopt: (user: AccountUser) => Promise<void>;
  /** Pull (when asked), merge, push what the account does not have. Safe to call at any time. */
  sync: (options?: { pull?: boolean; keepalive?: boolean }) => Promise<void>;
  resendVerification: () => Promise<void>;
  /** Both answer `true` when the server agreed, so the dialog knows which panel to show. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  signOut: () => Promise<void>;
  /** On start-up: notice a session that is gone, revalidate one that is there, then sync. */
  restore: () => Promise<void>;
  /** Fill `methods` once; a failure is the dialog's `error`, and the next open tries again. */
  loadMethods: () => Promise<void>;
  /**
   * SSO through the SDK's popup. Synchronous up to the SDK call, so it must be wired straight to a
   * click, and only once `methods` is in (which means the auth code is loaded): Safari blocks a
   * popup opened after an `await`. No `busy` state: a popup the player closes never answers, and the
   * buttons must stay pressable for a second try.
   */
  signInWith: (provider: string) => void;
}

let device: DeviceState = loadDeviceState();

/** The auth module once `loadMethods` has imported it, for the one call that cannot wait for it. */
let auth: typeof Auth | null = null;

/** True while this module itself replaces the document, so the change is not taken for an edit. */
let applying = false;
let autosave: ReturnType<typeof setTimeout> | null = null;
let running: Promise<void> | null = null;
let again: { pull: boolean; keepalive: boolean } | null = null;

function rememberDevice(patch: Partial<DeviceState>): void {
  device = { ...device, ...patch };
  saveDeviceState(device);
}

function apply(doc: RootDocument): void {
  applying = true;
  try {
    useStore.getState().replaceDocument(doc);
  } finally {
    applying = false;
  }
}

/** A blob from the server or the cache as a current document, or `null` when it is not one. */
function readDocument(data: unknown): RootDocument | null {
  try {
    return migrate(data);
  } catch {
    return null;
  }
}

/** The document a signed-out browser starts from, keeping what describes the browser itself. */
function freshLocal(current: RootDocument): RootDocument {
  const root = newRoot(current.deviceName);
  return { ...root, deviceId: current.deviceId, ui: current.ui };
}

/** A merge can delete everything; the app always has a profile to show. */
function withAProfile(doc: RootDocument): RootDocument {
  if (doc.profiles.length > 0) return doc;
  const profile = newProfile('My account', doc.deviceId);
  return { ...doc, profiles: [profile], activeProfileId: profile.id };
}

function cancelAutosave(): boolean {
  if (autosave === null) return false;
  clearTimeout(autosave);
  autosave = null;
  return true;
}

export const useAccountStore = create<AccountState>()((set, get) => {
  /** Merge the server's copy into the one on screen; the version this device has now seen. */
  const takeRemote = (remote: RemoteProfile): RootDocument => {
    const remoteDoc = readDocument(remote.data);
    if (remoteDoc === null)
      throw new AccountError('format', 'The account holds a copy this version cannot read.');
    const current = useStore.getState().doc;
    const merged = withAProfile(mergeDocuments(current, remoteDoc));
    if (!sameContent(merged, current)) apply(merged);
    return remoteDoc;
  };

  /** The account's profiles leave the screen; a fresh local profile takes their place. */
  const leave = async (keep: boolean): Promise<void> => {
    cancelAutosave();
    const current = useStore.getState().doc;
    writeCache(keep && device.owner !== null ? { owner: device.owner, doc: current } : null);
    apply(freshLocal(current));
    rememberDevice({ owner: null, remoteVersion: 0 });
    try {
      const { signOut } = await import('./auth');
      await signOut();
    } catch {
      /* the local session is dropped either way */
    }
  };

  /** The server refused the token: keep everything for the next sign-in, and say why it went. */
  const expire = async (): Promise<void> => {
    await leave(true);
    set({
      user: null,
      dirty: false,
      syncState: 'saved',
      busy: 'none',
      dialog: 'left',
      leftReason: 'expired',
    });
  };

  const syncOnce = async (pullFirst: boolean, keepalive: boolean): Promise<void> => {
    const user = get().user;
    if (user === null || device.owner === null) return;
    set({ syncState: 'saving' });
    try {
      // An unconfirmed address cannot save (the hook answers 403). Ask whether it is confirmed by
      // now, the way the app learns it after the link in the email, instead of trying a save that
      // is bound to be refused.
      if (!user.verified) {
        const { refreshSession } = await import('./auth');
        const fresh = await refreshSession();
        if (fresh === null) throw new AccountError('auth', 'This session has expired. Sign in again.');
        set({ user: fresh });
        if (!fresh.verified) {
          set({ dirty: true, syncState: 'error', error: '' });
          return;
        }
      }
      let base = get().remoteVersion;
      if (pullFirst) {
        const remote = await pull();
        base = remote?.version ?? 0;
        if (remote !== null) {
          const remoteDoc = takeRemote(remote);
          if (sameContent(useStore.getState().doc, remoteDoc)) {
            rememberDevice({ remoteVersion: base });
            set({ remoteVersion: base, dirty: false, syncState: 'saved', error: '' });
            return;
          }
        }
      }
      for (let attempt = 0; attempt < 3; attempt += 1) {
        // Edits made while this request is out mark the document dirty again, and save themselves.
        set({ dirty: false });
        const result = await push(useStore.getState().doc, base, get().deviceId, { keepalive });
        if (result.ok) {
          rememberDevice({ remoteVersion: result.version });
          set({ remoteVersion: result.version, syncState: get().dirty ? 'saving' : 'saved', error: '' });
          return;
        }
        // Another device saved in between: take what it saved, then try again on top of it.
        const remote = await pull();
        base = remote?.version ?? 0;
        if (remote !== null) takeRemote(remote);
      }
      set({
        dirty: true,
        syncState: 'error',
        error: 'The account kept changing under this save. It will try again.',
      });
    } catch (error) {
      const kind = error instanceof AccountError ? error.kind : 'server';
      if (kind === 'auth') {
        await expire();
        return;
      }
      set({
        dirty: true,
        syncState: kind === 'network' ? 'offline' : 'error',
        error: kind === 'network' ? '' : accountErrorMessage(error),
      });
    }
  };

  const hasSession = hasStoredSession();

  return {
    enabled: isAccountConfigured(),
    // Drawn on the first frame, offline included; `restore` checks the token with the server.
    user: isAccountConfigured() && hasSession && device.owner !== null ? readStoredUser() : null,
    remoteVersion: device.remoteVersion,
    deviceId: device.deviceId,
    dirty: false,
    syncState: 'saved',
    busy: 'none',
    error: '',
    verificationSent: false,
    dialog: null,
    merged: null,
    leftReason: null,
    methods: null,

    setDialog: (dialog) => {
      set({ dialog, error: '' });
    },

    markDirty: () => {
      if (get().user === null || device.owner === null) return;
      set({ dirty: true, syncState: 'saving' });
      cancelAutosave();
      autosave = setTimeout(() => {
        autosave = null;
        void get().sync();
      }, AUTOSAVE_MS);
    },

    sync: (options = {}) => {
      const pullFirst = options.pull ?? false;
      const keepalive = options.keepalive ?? false;
      cancelAutosave();
      if (running !== null) {
        again = {
          pull: (again?.pull ?? false) || pullFirst,
          keepalive: (again?.keepalive ?? false) || keepalive,
        };
        return running;
      }
      running = (async () => {
        let next: { pull: boolean; keepalive: boolean } | null = { pull: pullFirst, keepalive };
        while (next !== null) {
          again = null;
          await syncOnce(next.pull, next.keepalive);
          next = again;
        }
      })().finally(() => {
        running = null;
      });
      return running;
    },

    /**
     * The account's profiles come in (from the server, and from the cache an expired session left);
     * this browser's own profiles are added to them, renamed when the account already uses the name.
     * The untouched profile a browser starts with is not worth adding. Then one save makes the account whole.
     */
    adopt: async (user) => {
      set({ user, busy: 'signin', error: '', dialog: null, verificationSent: false, syncState: 'saving' });
      const cache = readCache();
      const cached = cache !== null && cache.owner === user.id ? readDocument(cache.doc) : null;

      let remote: RemoteProfile | null = null;
      let reached = true;
      try {
        remote = await pull();
      } catch {
        // Offline: the account's copy arrives with the next sync, and merges then.
        reached = false;
      }
      const remoteDoc = remote === null ? null : readDocument(remote.data);
      const base =
        cached !== null && remoteDoc !== null ? mergeDocuments(cached, remoteDoc) : (cached ?? remoteDoc);

      const current = useStore.getState().doc;
      const known = new Set(base?.profiles.map((profile) => profile.id) ?? []);
      const taken = new Set(base?.profiles.map((profile) => profile.name) ?? []);
      const summary: MergeSummary = { added: [], renamed: [] };
      const mine: Profile[] = [];
      // The profile a browser starts with, never touched: not worth adding to an account. A profile
      // the player created (also never edited, maybe) is.
      const untouchedStart = current.profiles.length === 1 && current.profiles[0]?.rev === 0;
      for (const profile of current.profiles) {
        if (known.has(profile.id)) {
          mine.push(profile); // the account's own, still on screen (an update from an older build)
          continue;
        }
        if (untouchedStart) continue;
        const name = uniqueProfileName(profile.name, taken, 'local');
        taken.add(name);
        summary.added.push(name);
        if (name === profile.name) {
          mine.push(profile);
        } else {
          summary.renamed.push({ from: profile.name, to: name });
          mine.push({ ...profile, name, rev: profile.rev + 1, updatedAt: Date.now() });
        }
      }
      const local: RootDocument = { ...current, profiles: mine };
      let next = base === null ? local : mergeDocuments(local, base);
      // Nothing anywhere yet: the untouched profile on screen becomes the account's first.
      if (next.profiles.length === 0) next = { ...next, profiles: current.profiles };
      if (!next.profiles.some((profile) => profile.id === next.activeProfileId)) {
        const preferred = cached?.activeProfileId;
        next = {
          ...next,
          activeProfileId: next.profiles.some((profile) => profile.id === preferred)
            ? (preferred ?? '')
            : (next.profiles[0]?.id ?? next.activeProfileId),
        };
      }
      const worthSaying = summary.added.length > 0 && (base?.profiles.length ?? 0) > 0;
      apply(withAProfile(next));
      writeCache(null);
      const remoteVersion = remote?.version ?? (reached ? 0 : device.remoteVersion);
      rememberDevice({ owner: user.id, remoteVersion });
      set({
        remoteVersion,
        busy: 'none',
        dirty: true,
        // Said only when the account already held profiles: joining an empty one changes nothing.
        merged: worthSaying ? summary : null,
        dialog: worthSaying ? 'merged' : null,
      });
      await get().sync();
    },

    /**
     * The address is confirmed by opening a link in an email, so all this can do is ask for the
     * email again — and PocketBase will not send a second one within its own cooldown. The row
     * therefore says a mail is on its way, never that a new one was sent.
     */
    resendVerification: async () => {
      const { user } = get();
      if (user === null || user.email === '') return;
      set({ busy: 'verify', error: '' });
      try {
        const { resendVerification } = await import('./auth');
        await resendVerification(user.email);
        set({ verificationSent: true, busy: 'none' });
      } catch (error) {
        set({ error: accountErrorMessage(error), busy: 'none' });
      }
    },

    /**
     * PocketBase revokes every token of the account when its password changes, so `changePassword`
     * signs in again and hands back a fresh record; the store takes it as the current user.
     */
    changePassword: async (currentPassword, newPassword) => {
      if (get().user === null) return false;
      set({ busy: 'password', error: '' });
      try {
        const passwords = await import('./auth');
        const user = await passwords.changePassword(currentPassword, newPassword);
        set({ user, busy: 'none' });
        return true;
      } catch (error) {
        set({ error: accountErrorMessage(error), busy: 'none' });
        return false;
      }
    },

    /**
     * The account and the copy it holds are gone. The profiles on screen stay, as this browser's own
     * (ADR-0009's promise): nothing else in this browser changes.
     */
    deleteAccount: async () => {
      if (get().user === null) return false;
      set({ busy: 'delete', error: '' });
      try {
        const { deleteAccount } = await import('./auth');
        await deleteAccount();
      } catch (error) {
        set({ error: accountErrorMessage(error), busy: 'none' });
        return false;
      }
      cancelAutosave();
      writeCache(null);
      rememberDevice({ owner: null, remoteVersion: 0 });
      set({
        user: null,
        remoteVersion: 0,
        dirty: false,
        syncState: 'saved',
        busy: 'none',
        verificationSent: false,
      });
      return true;
    },

    /**
     * Save what is not saved yet, then take the account's profiles off this browser. If the save
     * cannot happen (offline), they are kept in the cache for the next sign-in, and the dialog says so.
     */
    signOut: async () => {
      if (get().user === null) return;
      set({ busy: 'signout', error: '' });
      if (get().dirty || cancelAutosave()) await get().sync();
      // `sync` may have found the session already gone and left on its own.
      if (get().user === null) return;
      const saved = !get().dirty && get().syncState === 'saved';
      await leave(!saved);
      set({
        user: null,
        dirty: false,
        syncState: 'saved',
        busy: 'none',
        verificationSent: false,
        dialog: saved ? null : 'left',
        leftReason: saved ? null : 'offline',
      });
    },

    restore: async () => {
      if (!isAccountConfigured()) return;
      // The document on screen is an account's, but the session that went with it is gone.
      if (device.owner !== null && !hasStoredSession()) {
        await expire();
        return;
      }
      if (!hasStoredSession()) return;
      const { refreshSession } = await import('./auth');
      let user: AccountUser | null;
      try {
        user = await refreshSession();
      } catch {
        return; // a backend that is down: stay as we are, and sync when it answers
      }
      if (user === null) {
        if (device.owner !== null) await expire();
        else set({ user: null });
        return;
      }
      if (device.owner === user.id) {
        set({ user });
        await get().sync({ pull: true });
        return;
      }
      // Signed in, but the document on screen is not this account's yet: an older build, which
      // kept no owner, or another account's leftovers. Either way, the sign-in flow sorts it.
      if (device.owner !== null) await leave(true);
      await get().adopt(user);
    },

    loadMethods: async () => {
      if (get().methods !== null) return;
      auth = await import('./auth');
      try {
        set({ methods: await auth.signInMethods() });
      } catch (error) {
        set({ error: accountErrorMessage(error) });
      }
    },

    signInWith: (provider) => {
      if (auth === null) return;
      set({ error: '' });
      auth.signInWithProvider(provider).then(
        (user) => get().adopt(user),
        (error: unknown) => {
          set({ error: accountErrorMessage(error) });
        },
      );
    },
  };
});

/**
 * Every local edit marks the account copy stale and schedules its save (spec §5.4). Mirrors
 * `trackUnsavedChanges`, which watches the same subscription for the *storage* side; the two dirty
 * flags answer different questions ("has it reached this browser's disk" and "has it reached the
 * account"). Changes this module makes itself (a merge) are not edits.
 */
export function trackAccountChanges(api: StoreApi<StoreState> = useStore): () => void {
  return api.subscribe((state, previous) => {
    if (!applying && state.doc !== previous.doc) useAccountStore.getState().markDirty();
  });
}

/**
 * The moments a signed-in browser syncs on its own: leaving the page (save now, with `keepalive`, so
 * the request outlives the tab), coming back to it, and coming back online (pull, merge, save).
 */
export function watchAccountSync(): () => void {
  const onVisibility = (): void => {
    const account = useAccountStore.getState();
    if (account.user === null) return;
    if (document.visibilityState === 'hidden') {
      if (account.dirty) void account.sync({ keepalive: true });
    } else {
      void account.sync({ pull: true });
    }
  };
  const onOnline = (): void => {
    const account = useAccountStore.getState();
    if (account.user !== null) void account.sync({ pull: true });
  };
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('online', onOnline);
  return () => {
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('online', onOnline);
  };
}

/** Tests only: forget the module's timers and the device state read at import. */
export function resetAccountModule(): void {
  cancelAutosave();
  running = null;
  again = null;
  auth = null;
  device = loadDeviceState();
}
