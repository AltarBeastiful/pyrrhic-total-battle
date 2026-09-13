/**
 * "Keep this, please" (spec §5.7). Safari evicts local storage after seven days of no interaction
 * for a site that is not installed to the home screen, and a player's whole account lives there.
 *
 * `navigator.storage.persist()` is asked for once per browser profile: Chromium grants or refuses it
 * silently on engagement heuristics, Firefox may ask the user, Safari ignores it. A refusal changes
 * nothing — the account (ADR-0009) is what makes eviction recoverable rather than fatal.
 */
const FLAG_KEY = 'pyrrhic.storage.persist.asked';

let asked = false;

/**
 * Returns what the browser decided, or `null` when it has no opinion (no API, or already asked in a
 * previous visit). Never throws: storage permission is a bonus, never a requirement.
 */
export async function requestPersistentStorage(): Promise<boolean | null> {
  if (asked) return null;
  asked = true;
  try {
    const storage = navigator.storage as StorageManager | undefined;
    if (!storage || typeof storage.persist !== 'function') return null;
    if (typeof storage.persisted === 'function' && (await storage.persisted())) return true;
    if (globalThis.localStorage?.getItem(FLAG_KEY) === '1') return null;
    globalThis.localStorage?.setItem(FLAG_KEY, '1');
    return await storage.persist();
  } catch {
    return null;
  }
}
