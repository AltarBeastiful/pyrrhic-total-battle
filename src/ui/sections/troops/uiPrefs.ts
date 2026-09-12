/**
 * The handful of view flags that belong to the device rather than to the document: whether a card
 * is open, not what it holds. They live under one `pyrrhic.ui.v1` object in `localStorage`, beside
 * the saved document but never inside it — a share link and a sync must not carry "this player
 * keeps Troops folded".
 *
 * Every read and every write is guarded: private windows, a full quota and a blocked origin all
 * throw, and none of them is a reason to lose the card.
 */
const KEY = 'pyrrhic.ui.v1';

/** The flag the Troops card remembers. */
export const TROOPS_EXPANDED = 'troopsExpanded';

function readAll(): Record<string, unknown> {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (raw === null || raw === undefined) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** `undefined` when the device has no opinion yet, so a caller can fall back to its own default. */
export function readUiFlag(name: string): boolean | undefined {
  const value = readAll()[name];
  return typeof value === 'boolean' ? value : undefined;
}

/** Writes one flag and keeps every other one: the object is shared with the rest of the interface. */
export function writeUiFlag(name: string, value: boolean): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify({ ...readAll(), [name]: value }));
  } catch {
    // No storage (private window, full quota): the card simply forgets between visits.
  }
}
