/**
 * Small view-only store: things the UI needs that are not part of the saved document — the share
 * payload waiting for the "load shared config" prompt, and whether the last edit has reached storage.
 *
 * `initPersistence` (src/state/store.ts) exposes no hook, so the save state is observed by wrapping
 * the storage adapter: every successful write stamps `lastSavedAt`, every document change marks the
 * document dirty.
 */
import { create } from 'zustand';
import type { StoreApi } from 'zustand';

import type { SharePayload } from '@/share/codec';
import type { StorageAdapter } from '@/state/storage';
import { useStore, type StoreState } from '@/state/store';

export interface UiState {
  /** Decoded share link waiting for the user's decision; nothing is applied until they choose. */
  pendingShare: SharePayload | null;
  /** Why a share link could not be read (shown in the same dialog). */
  shareError: string | null;
  /** True between an edit and the debounced write that follows it. */
  dirty: boolean;
  lastSavedAt: number | null;
  setPendingShare: (payload: SharePayload | null) => void;
  setShareError: (message: string | null) => void;
  markDirty: () => void;
  markSaved: (at?: number) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  pendingShare: null,
  shareError: null,
  dirty: false,
  lastSavedAt: null,
  setPendingShare: (payload) => {
    set({ pendingShare: payload });
  },
  setShareError: (message) => {
    set({ shareError: message });
  },
  markDirty: () => {
    set({ dirty: true });
  },
  markSaved: (at) => {
    set({ dirty: false, lastSavedAt: at ?? Date.now() });
  },
}));

/** Wrap a storage adapter so a successful write clears the "unsaved changes" indicator. */
export function withSaveTracking(adapter: StorageAdapter): StorageAdapter {
  return {
    load: () => adapter.load(),
    save(value) {
      adapter.save(value);
      useUiStore.getState().markSaved();
    },
    ...(adapter.saveCorrupt ? { saveCorrupt: adapter.saveCorrupt.bind(adapter) } : {}),
  };
}

/** Mark the document dirty on every change; returns the unsubscribe function. */
export function trackUnsavedChanges(api: StoreApi<StoreState> = useStore): () => void {
  return api.subscribe((state, previous) => {
    if (state.doc !== previous.doc) useUiStore.getState().markDirty();
  });
}
