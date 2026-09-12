/**
 * The view state that belongs to the device rather than to the document: which mercenaries this
 * player reached for last, so the picker can float them to the top. It lives under one
 * `pyrrhic.ui.v1` object in `localStorage`, beside the saved document but never inside it — a share
 * link and a sync must not carry "this device hired a bear once".
 *
 * This is a private copy of the same tiny helper the Troops card uses; the two are merged into one
 * module once both cards have landed.
 *
 * Every read and every write is guarded: a private window, a full quota and a blocked origin all
 * throw, and none of them is a reason to lose the card.
 */
const KEY = 'pyrrhic.ui.v1';

/** The ids the picker floats to the top, most recently added first. */
export const MERCENARIES_RECENT = 'mercenariesRecent';

/** How many ids are worth remembering: enough to cover a camp, short enough to stay a shortcut. */
const RECENT_LIMIT = 8;

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

/** Writes one field and keeps every other one: the object is shared with the rest of the interface. */
function writeOne(name: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify({ ...readAll(), [name]: value }));
  } catch {
    // No storage (private window, full quota): the card simply forgets between visits.
  }
}

/** The remembered ids, oldest entries already dropped. */
export function readRecent(): string[] {
  const value = readAll()[MERCENARIES_RECENT];
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === 'string').slice(0, RECENT_LIMIT);
}

/** Puts `id` first and keeps the rest in order, without ever repeating one. */
export function rememberRecent(id: string): string[] {
  const next = [id, ...readRecent().filter((entry) => entry !== id)].slice(0, RECENT_LIMIT);
  writeOne(MERCENARIES_RECENT, next);
  return next;
}
