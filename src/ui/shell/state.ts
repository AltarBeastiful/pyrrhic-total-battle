/**
 * The three questions the frame answers without rendering anything: what one word describes the
 * save state, why a march cannot be generated, and which of the four states the floating button is
 * in. Plain functions so they can be tested on their own and read in one screen.
 */
import type { BattleSetup, Profile } from '@/state/schema';

export type FabState = 'ready' | 'stale' | 'running' | 'blocked';

/**
 * Where the profile is saved, in a few words (design plan §5.2, R5; S-49d). `account` is `null` in a
 * build with no account, `'signed-out'` when it has one and nobody is signed in — then the profile is
 * this browser's alone, and the row says so — or the account's sync state.
 */
export function saveStatus(options: {
  dirty: boolean;
  account: null | 'signed-out' | 'saved' | 'saving' | 'offline' | 'error';
}): string {
  const { dirty, account } = options;
  if (account === null) return dirty ? 'Saving…' : 'Saved';
  if (account === 'signed-out') return dirty ? 'Saving…' : 'Saved in this browser only';
  if (account === 'saving') return 'Saving to your account…';
  if (account === 'offline') return 'Offline: saves when back online';
  if (account === 'error') return 'Not saved to your account yet: will retry';
  return 'Saved to your account';
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
