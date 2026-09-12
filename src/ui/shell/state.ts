/**
 * The three questions the frame answers without rendering anything: what one word describes the
 * save state, why a march cannot be generated, and which of the four states the floating button is
 * in. Plain functions so they can be tested on their own and read in one screen.
 */
import type { BattleSetup, Profile } from '@/state/schema';

export type FabState = 'ready' | 'stale' | 'running' | 'blocked';

/** The one-word save state that replaced "Saved in this browser" (design plan §5.2, R5). */
export function saveStatus(options: { dirty: boolean; conflict: boolean }): string {
  if (options.conflict) return 'Sync conflict';
  return options.dirty ? 'Saving…' : 'Saved';
}

/**
 * Why pressing Generate would produce nothing, in the words the button shows — or `null` when a
 * march is possible. The order is the order a player fills the page in: an army first, then what
 * the march can carry.
 */
export function blockedReason(profile: Profile | undefined, setup: BattleSetup | undefined): string | null {
  if (profile === undefined || setup === undefined) return 'No march is selected';

  const { troops, mercenaries } = profile;
  const noTroops =
    troops.guardsmen === null &&
    troops.specialists === null &&
    troops.engineers === null &&
    troops.monsters === null;
  if (noTroops && mercenaries.selected.length === 0) return 'Add troops first';

  const { housing } = setup;
  if (housing.leadership + housing.authority + housing.dominance === 0) return 'Add housing first';

  return null;
}

/**
 * `running` wins over everything (the press cancels), then a blocked march, then a result that no
 * longer matches the form. Without a previous run there is nothing to be stale against.
 */
export function fabState(options: {
  running: boolean;
  blocked: string | null;
  hasResult: boolean;
  fingerprint: string;
  lastRunFingerprint: string | null;
}): FabState {
  if (options.running) return 'running';
  if (options.blocked !== null) return 'blocked';
  const { hasResult, lastRunFingerprint, fingerprint } = options;
  if (hasResult && lastRunFingerprint !== null && lastRunFingerprint !== fingerprint) return 'stale';
  return 'ready';
}
