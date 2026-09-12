/**
 * The sync flow behind `SyncDialog` (S-44): build the adapter from the saved settings, check the gist,
 * show a plan, apply it. Nothing happens without a click — no auto-pull on open, no auto-push on save
 * (investigation 0001: explicit Pull/Push first), and therefore no background request either.
 */
import { useCallback, useRef, useState } from 'react';

import { version as gameData } from '@/data';
import type { Profile } from '@/state/schema';
import { useStore } from '@/state/store';
import { apply, plan } from '@/sync/engine';
import type { ApplyEntryResult, ConflictChoice, SyncPlan } from '@/sync/engine';
import { createGistStore } from '@/sync/gist';
import type { GistStore } from '@/sync/gist';
import { useSyncStore } from '@/sync/syncStore';
import { syncErrorMessage } from '@/sync/types';

export type SyncStatus = 'idle' | 'testing' | 'checking' | 'applying';

export interface SyncController {
  status: SyncStatus;
  plan: SyncPlan | null;
  results: ApplyEntryResult[] | null;
  error: string | null;
  notice: string | null;
  choices: Record<string, ConflictChoice>;
  /** True when a token is configured; the Pull/Push panel stays disabled until then. */
  ready: boolean;
  testConnection: () => Promise<void>;
  check: () => Promise<void>;
  run: () => Promise<void>;
  choose: (id: string, choice: ConflictChoice) => void;
  fetchRemote: (id: string) => Promise<Profile | null>;
  forget: () => void;
}

export function useSync(): SyncController {
  const settings = useSyncStore((state) => state.settings);
  const passphrase = useSyncStore((state) => state.passphrase);
  const deviceName = useStore((state) => state.doc.deviceName);

  const [status, setStatus] = useState<SyncStatus>('idle');
  const [current, setPlan] = useState<SyncPlan | null>(null);
  const [results, setResults] = useState<ApplyEntryResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, ConflictChoice>>({});

  const secret = settings.encrypt ? passphrase : '';
  const key = [settings.token, settings.gistId, String(settings.encrypt), secret, deviceName].join('|');
  const cache = useRef<{ key: string; store: GistStore } | null>(null);

  /** One adapter per settings combination: the encryption key is derived once, the gist read once. */
  const adapter = useCallback((): GistStore => {
    if (cache.current?.key !== key) {
      cache.current = {
        key,
        store: createGistStore({
          token: settings.token,
          gistId: settings.gistId,
          dataVersion: gameData.dataVersion,
          deviceName,
          ...(settings.encrypt && passphrase !== '' ? { passphrase } : {}),
        }),
      };
    }
    return cache.current.store;
  }, [key, settings.token, settings.gistId, settings.encrypt, passphrase, deviceName]);

  /** Remember the gist the adapter found or created, so the next run skips the lookup. */
  const rememberGist = useCallback((store: GistStore): void => {
    const id = store.gistId();
    if (id !== null && id !== useSyncStore.getState().settings.gistId) {
      useSyncStore.getState().setSettings({ gistId: id });
    }
  }, []);

  const replan = useCallback((remoteIndex: Awaited<ReturnType<GistStore['index']>>): SyncPlan => {
    const { doc } = useStore.getState();
    return plan({
      profiles: doc.profiles,
      tombstones: doc.tombstones,
      remote: remoteIndex,
      syncState: useSyncStore.getState().records,
    });
  }, []);

  const check = useCallback(async (): Promise<void> => {
    setStatus('checking');
    setError(null);
    setResults(null);
    try {
      const store = adapter();
      const next = replan(await store.index());
      rememberGist(store);
      setPlan(next);
      setNotice(
        next.entries.every((entry) => entry.action === 'in-sync') ? 'Everything is up to date.' : null,
      );
    } catch (failure) {
      setPlan(null);
      setError(syncErrorMessage(failure));
    } finally {
      setStatus('idle');
    }
  }, [adapter, rememberGist, replan]);

  const run = useCallback(async (): Promise<void> => {
    if (current === null) return;
    setStatus('applying');
    setError(null);
    try {
      const store = adapter();
      const outcome = await apply({
        plan: current,
        choices,
        syncState: useSyncStore.getState().records,
        store: useStore,
        remote: store,
      });
      rememberGist(store);
      useSyncStore.getState().setRecords(outcome.syncState);
      setResults(outcome.results);
      setChoices({});
      setNotice(
        `Sent ${String(outcome.pushed)}, received ${String(outcome.pulled)}` +
          (outcome.failed > 0 ? `, ${String(outcome.failed)} still to look at.` : '.'),
      );
      // Show what the gist looks like now, so the panel never displays a stale plan.
      setPlan(replan(await store.index()));
    } catch (failure) {
      setError(syncErrorMessage(failure));
    } finally {
      setStatus('idle');
    }
  }, [adapter, choices, current, rememberGist, replan]);

  const testConnection = useCallback(async (): Promise<void> => {
    setStatus('testing');
    setError(null);
    setNotice(null);
    try {
      const store = adapter();
      const connection = await store.testConnection();
      rememberGist(store);
      const who = connection.login === null ? 'The token works' : `Connected as ${connection.login}`;
      setNotice(
        connection.gistId === null
          ? `${who}. No pyrrhic-sync gist yet — the first push creates one.`
          : `${who}. Using gist ${connection.gistId}${connection.encrypted ? ' (encrypted)' : ''}.`,
      );
    } catch (failure) {
      setError(syncErrorMessage(failure));
    } finally {
      setStatus('idle');
    }
  }, [adapter, rememberGist]);

  const fetchRemote = useCallback(
    async (id: string): Promise<Profile | null> => {
      try {
        return await adapter().get(id);
      } catch (failure) {
        setError(syncErrorMessage(failure));
        return null;
      }
    },
    [adapter],
  );

  const choose = useCallback((id: string, choice: ConflictChoice): void => {
    setChoices((previous) => ({ ...previous, [id]: choice }));
  }, []);

  const forget = useCallback((): void => {
    useSyncStore.getState().reset();
    cache.current = null;
    setPlan(null);
    setResults(null);
    setNotice('Sync settings cleared from this browser.');
  }, []);

  return {
    status,
    plan: current,
    results,
    error,
    notice,
    choices,
    ready: settings.token.trim() !== '',
    testConnection,
    check,
    run,
    choose,
    fetchRemote,
    forget,
  };
}
