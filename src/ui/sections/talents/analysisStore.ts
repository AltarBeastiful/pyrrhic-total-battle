/**
 * **The talent analysis' state** (B-24): one result per talent, kept until the next ask. The key is the question
 * (`talentAnalysisKey`): a result whose key is not the current one is stale and says so. One pass runs at a time —
 * starting another, or leaving the talent (`cancelAnalysis`), aborts it — and only the pass on screen may write.
 */
import { create } from 'zustand';

import type { TalentRecord } from '@/data/types';
import type { BattleSetup, Profile } from '@/state/schema';
import { talentAnalysisInput, talentAnalysisKey } from '@/state/talentAnalysis';
import { isAbortError } from '@/worker/client';
import { runTalentAnalysis, type TalentAnalysis } from '@/worker/talentAnalysis';

import { advisorPool } from '../march/advisorSearch';

export interface AnalysisEntry {
  key: string;
  status: 'running' | 'done' | 'failed' | 'cancelled';
  done: number;
  total: number;
  analysis: TalentAnalysis | null;
  error: string | null;
}

interface AnalysisState {
  entries: Record<number, AnalysisEntry>;
  set: (nodeId: number, entry: AnalysisEntry) => void;
}

export const useAnalysisStore = create<AnalysisState>()((set) => ({
  entries: {},
  set: (nodeId, entry) => {
    set((state) => ({ entries: { ...state.entries, [nodeId]: entry } }));
  },
}));

let controller: AbortController | null = null;
let running: number | null = null;

/** Stop the pass that is out, if any; its talent reads "cancelled". */
export function cancelAnalysis(): void {
  const nodeId = running;
  controller?.abort();
  controller = null;
  running = null;
  if (nodeId === null) return;
  const entry = useAnalysisStore.getState().entries[nodeId];
  if (entry?.status === 'running') useAnalysisStore.getState().set(nodeId, { ...entry, status: 'cancelled' });
}

/** Ask what each rank of `node` is worth to the march `setup` selects. A pass already out is cancelled first. */
export async function analyzeTalent(node: TalentRecord, profile: Profile, setup: BattleSetup): Promise<void> {
  const input = talentAnalysisInput(profile, setup, node);
  if (input === null) return;
  cancelAnalysis();
  const key = talentAnalysisKey(profile, setup, node);
  const own = new AbortController();
  controller = own;
  running = node.id;
  const store = useAnalysisStore.getState();
  const previous = store.entries[node.id]?.analysis ?? null;
  store.set(node.id, { key, status: 'running', done: 0, total: 0, analysis: previous, error: null });
  const live = (): AnalysisEntry | null => {
    const entry = useAnalysisStore.getState().entries[node.id];
    return entry !== undefined && entry.key === key && entry.status === 'running' ? entry : null;
  };
  try {
    const analysis = await runTalentAnalysis(input, advisorPool(), {
      signal: own.signal,
      onProgress: (done, total) => {
        const entry = live();
        if (entry !== null) useAnalysisStore.getState().set(node.id, { ...entry, done, total });
      },
    });
    const entry = live();
    if (entry !== null) useAnalysisStore.getState().set(node.id, { ...entry, status: 'done', analysis });
  } catch (error) {
    if (isAbortError(error)) return;
    const entry = live();
    if (entry !== null)
      useAnalysisStore
        .getState()
        .set(node.id, { ...entry, status: 'failed', error: error instanceof Error ? error.message : String(error) });
  } finally {
    if (controller === own) {
      controller = null;
      running = null;
    }
  }
}
