/**
 * Application store (S-03). One zustand store holds the whole root document; every mutation goes through
 * an action so that `rev` / `updatedAt` / `deviceId` are stamped in exactly one place (ADR-0004 amendment):
 * the sync unit is the *profile*, so any change inside a profile (a setup, a saved stack) bumps the
 * profile as well as the entity itself.
 *
 * Persistence is a debounced subscription rather than zustand's `persist` middleware, because the load
 * path has to migrate, validate and quarantine a corrupt document before the store ever sees it.
 */
import { create } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { StateCreator, StoreApi } from 'zustand';

import { cloneProfileWithNewIds, defaultSetup, newProfile, newRoot, uuid } from './defaults';
import { migrate } from './migrations';
import type { StorageAdapter } from './storage';
import type { BattleSetup, Profile, RootDocument, SavedStack, SyncMeta, Theme } from './schema';

/** ADR-0004: writes are debounced by 300 ms. */
export const PERSIST_DEBOUNCE_MS = 300;

/** A patch, or a function of the current entity returning a patch. Sync fields are always ignored. */
export type Patch<T> = Partial<T> | ((current: T) => Partial<T>);

type Editable<T> = Omit<T, keyof SyncMeta>;

function resolvePatch<T>(current: T, patch: Patch<T>): Partial<T> {
  return typeof patch === 'function' ? patch(current) : patch;
}

/** Apply a patch and stamp the sync metadata. `id` can never be changed by a patch. */
function touch<T extends SyncMeta>(current: T, patch: Partial<T>, deviceId: string): T {
  return {
    ...current,
    ...patch,
    id: current.id,
    rev: current.rev + 1,
    updatedAt: Date.now(),
    deviceId,
  };
}

function replaceById<T extends { id: string }>(list: T[], next: T): T[] {
  return list.map((item) => (item.id === next.id ? next : item));
}

export interface StoreState {
  doc: RootDocument;

  // -- whole document ------------------------------------------------------------------------------
  /** Used by the loader and by "import → replace everything"; does not stamp anything. */
  replaceDocument: (doc: RootDocument) => void;
  setDeviceName: (name: string) => void;
  setTheme: (theme: Theme) => void;

  // -- profiles ------------------------------------------------------------------------------------
  createProfile: (name: string) => string;
  duplicateProfile: (id: string, name?: string) => string | null;
  renameProfile: (id: string, name: string) => void;
  /** Removes the profile and leaves a tombstone so a sync pull does not resurrect it. */
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string) => void;
  updateProfile: (id: string, patch: Patch<Editable<Profile>>) => void;
  /** Adds a profile as-is (import / share link); caller owns the ids. */
  addProfile: (profile: Profile, options?: { activate?: boolean }) => void;

  // -- battle setups (inside the active profile) ----------------------------------------------------
  createSetup: (name: string) => string | null;
  duplicateSetup: (id: string, name?: string) => string | null;
  renameSetup: (id: string, name: string) => void;
  deleteSetup: (id: string) => void;
  setActiveSetup: (id: string) => void;
  updateActiveSetup: (patch: Patch<Editable<BattleSetup>>) => void;

  // -- saved stacks (inside the active profile) -----------------------------------------------------
  addSavedStack: (stack: SavedStack) => void;
  /** Replace the stack with the same id (stamping it) or append it; used by "import → replace". */
  upsertSavedStack: (stack: SavedStack) => void;
  renameSavedStack: (id: string, name: string) => void;
  removeSavedStack: (id: string) => void;
}

// ---- Selectors ---------------------------------------------------------------------------------------
export function selectProfiles(state: StoreState): Profile[] {
  return state.doc.profiles;
}
export function selectActiveProfile(state: StoreState): Profile | undefined {
  return state.doc.profiles.find((profile) => profile.id === state.doc.activeProfileId);
}
export function selectActiveSetup(state: StoreState): BattleSetup | undefined {
  const profile = selectActiveProfile(state);
  return profile?.setups.find((setup) => setup.id === profile.activeSetupId);
}
export function selectTheme(state: StoreState): Theme {
  return state.doc.ui.theme;
}

// ---- Store -------------------------------------------------------------------------------------------
const initializer =
  (initial: RootDocument): StateCreator<StoreState> =>
  (set, get) => {
    /** Edit the profile with `id` (default: the active one) and stamp it. */
    const editProfile = (id: string | null, update: (profile: Profile) => Partial<Profile>): void => {
      const { doc } = get();
      const targetId = id ?? doc.activeProfileId;
      const profile = doc.profiles.find((candidate) => candidate.id === targetId);
      if (!profile) return;
      const next = touch(profile, update(profile), doc.deviceId);
      set({ doc: { ...doc, profiles: replaceById(doc.profiles, next) } });
    };

    /** Edit one setup of the active profile; both the setup and its profile are stamped. */
    const editSetup = (setupId: string, update: (setup: BattleSetup) => Partial<BattleSetup>): void => {
      const deviceId = get().doc.deviceId;
      editProfile(null, (profile) => {
        const setup = profile.setups.find((candidate) => candidate.id === setupId);
        if (!setup) return {};
        return { setups: replaceById(profile.setups, touch(setup, update(setup), deviceId)) };
      });
    };

    return {
      doc: initial,

      replaceDocument: (doc) => set({ doc }),

      setDeviceName: (name) => set(({ doc }) => ({ doc: { ...doc, deviceName: name } })),

      setTheme: (theme) => set(({ doc }) => ({ doc: { ...doc, ui: { ...doc.ui, theme } } })),

      createProfile: (name) => {
        const { doc } = get();
        const profile = newProfile(name, doc.deviceId);
        set({ doc: { ...doc, profiles: [...doc.profiles, profile], activeProfileId: profile.id } });
        return profile.id;
      },

      duplicateProfile: (id, name) => {
        const { doc } = get();
        const source = doc.profiles.find((candidate) => candidate.id === id);
        if (!source) return null;
        const copy = cloneProfileWithNewIds(source, doc.deviceId, name ?? `${source.name} (copy)`);
        set({ doc: { ...doc, profiles: [...doc.profiles, copy], activeProfileId: copy.id } });
        return copy.id;
      },

      renameProfile: (id, name) => editProfile(id, () => ({ name })),

      updateProfile: (id, patch) =>
        editProfile(id, (profile) => resolvePatch(profile as Editable<Profile>, patch) as Partial<Profile>),

      addProfile: (profile, options) => {
        const { doc } = get();
        set({
          doc: {
            ...doc,
            profiles: [...doc.profiles, profile],
            activeProfileId: options?.activate === false ? doc.activeProfileId : profile.id,
          },
        });
      },

      deleteProfile: (id) => {
        const { doc } = get();
        if (!doc.profiles.some((profile) => profile.id === id)) return;
        const profiles = doc.profiles.filter((profile) => profile.id !== id);
        const tombstones = [...doc.tombstones, { id, deletedAt: Date.now() }];
        // The app always has at least one profile; deleting the last one starts a fresh account.
        if (profiles.length === 0) {
          const fresh = newProfile('My account', doc.deviceId);
          set({ doc: { ...doc, profiles: [fresh], activeProfileId: fresh.id, tombstones } });
          return;
        }
        const activeProfileId =
          doc.activeProfileId === id ? (profiles[0]?.id ?? doc.activeProfileId) : doc.activeProfileId;
        set({ doc: { ...doc, profiles, activeProfileId, tombstones } });
      },

      setActiveProfile: (id) => {
        const { doc } = get();
        if (!doc.profiles.some((profile) => profile.id === id)) return;
        set({ doc: { ...doc, activeProfileId: id } });
      },

      createSetup: (name) => {
        const { doc } = get();
        const setup = defaultSetup(doc.deviceId, name);
        let created: string | null = null;
        editProfile(null, (profile) => {
          created = setup.id;
          return { setups: [...profile.setups, setup], activeSetupId: setup.id };
        });
        return created;
      },

      duplicateSetup: (id, name) => {
        const { doc } = get();
        let created: string | null = null;
        editProfile(null, (profile) => {
          const source = profile.setups.find((setup) => setup.id === id);
          if (!source) return {};
          const copy: BattleSetup = {
            ...source,
            id: uuid(),
            rev: 0,
            updatedAt: Date.now(),
            deviceId: doc.deviceId,
            name: name ?? `${source.name} (copy)`,
          };
          created = copy.id;
          return { setups: [...profile.setups, copy], activeSetupId: copy.id };
        });
        return created;
      },

      renameSetup: (id, name) => editSetup(id, () => ({ name })),

      updateActiveSetup: (patch) => {
        const profile = selectActiveProfile(get());
        if (!profile) return;
        editSetup(
          profile.activeSetupId,
          (setup) => resolvePatch(setup as Editable<BattleSetup>, patch) as Partial<BattleSetup>,
        );
      },

      deleteSetup: (id) => {
        const { doc } = get();
        editProfile(null, (profile) => {
          if (!profile.setups.some((setup) => setup.id === id)) return {};
          const setups = profile.setups.filter((setup) => setup.id !== id);
          if (setups.length === 0) {
            // A profile always keeps one (implicit) setup, ADR-0004's "quick path".
            const fresh = defaultSetup(doc.deviceId);
            return { setups: [fresh], activeSetupId: fresh.id };
          }
          return {
            setups,
            activeSetupId:
              profile.activeSetupId === id ? (setups[0]?.id ?? profile.activeSetupId) : profile.activeSetupId,
          };
        });
        set(({ doc: current }) => ({
          doc: { ...current, tombstones: [...current.tombstones, { id, deletedAt: Date.now() }] },
        }));
      },

      setActiveSetup: (id) =>
        editProfile(null, (profile) =>
          profile.setups.some((setup) => setup.id === id) ? { activeSetupId: id } : {},
        ),

      addSavedStack: (stack) =>
        editProfile(null, (profile) => ({ savedStacks: [...profile.savedStacks, stack] })),

      upsertSavedStack: (stack) => {
        const deviceId = get().doc.deviceId;
        editProfile(null, (profile) => {
          const existing = profile.savedStacks.find((candidate) => candidate.id === stack.id);
          if (!existing) return { savedStacks: [...profile.savedStacks, stack] };
          return {
            savedStacks: replaceById(profile.savedStacks, touch(existing, { ...stack }, deviceId)),
          };
        });
      },

      renameSavedStack: (id, name) => {
        const deviceId = get().doc.deviceId;
        editProfile(null, (profile) => {
          const stack = profile.savedStacks.find((candidate) => candidate.id === id);
          if (!stack) return {};
          return { savedStacks: replaceById(profile.savedStacks, touch(stack, { name }, deviceId)) };
        });
      },

      removeSavedStack: (id) => {
        editProfile(null, (profile) =>
          profile.savedStacks.some((stack) => stack.id === id)
            ? { savedStacks: profile.savedStacks.filter((stack) => stack.id !== id) }
            : {},
        );
        set(({ doc }) => ({
          doc: { ...doc, tombstones: [...doc.tombstones, { id, deletedAt: Date.now() }] },
        }));
      },
    };
  };

/** Vanilla store, used by tests and by anything outside React. */
export function createAppStore(initial: RootDocument = newRoot()): StoreApi<StoreState> {
  return createStore<StoreState>()(initializer(initial));
}

/** The application store. `loadStore` / `initPersistence` replace its document on start-up. */
export const useStore = create<StoreState>()(initializer(newRoot()));

// ---- Persistence -------------------------------------------------------------------------------------
/**
 * Read, migrate and validate the stored document. An unreadable document is never silently thrown away:
 * it is parked under `pyrrhic.v1.corrupt` and the app starts from a fresh default root.
 */
export function loadStore(adapter: StorageAdapter): RootDocument {
  const raw = adapter.load();
  if (raw === null) return newRoot();
  try {
    return migrate(JSON.parse(raw));
  } catch (error) {
    console.warn('[pyrrhic] stored configuration could not be read, starting from defaults', error);
    adapter.saveCorrupt?.(raw);
    return newRoot();
  }
}

/**
 * Write the document through the adapter, debounced. Returns a dispose function that cancels the pending
 * timer and flushes the last value, so a teardown never loses the most recent edit.
 */
export function persist(
  api: StoreApi<StoreState>,
  adapter: StorageAdapter,
  delay: number = PERSIST_DEBOUNCE_MS,
): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: RootDocument | null = null;

  const flush = (): void => {
    if (pending === null) return;
    adapter.save(JSON.stringify(pending));
    pending = null;
  };

  const unsubscribe = api.subscribe((state, previous) => {
    if (state.doc === previous.doc) return;
    pending = state.doc;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      flush();
    }, delay);
  });

  return () => {
    unsubscribe();
    if (timer !== null) clearTimeout(timer);
    timer = null;
    flush();
  };
}

/** Load the stored document into `api` and start persisting it. Returns the dispose function. */
export function initPersistence(
  adapter: StorageAdapter,
  api: StoreApi<StoreState> = useStore,
  delay: number = PERSIST_DEBOUNCE_MS,
): () => void {
  api.getState().replaceDocument(loadStore(adapter));
  return persist(api, adapter, delay);
}
