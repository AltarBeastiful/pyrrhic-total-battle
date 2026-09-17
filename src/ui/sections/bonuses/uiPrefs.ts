/**
 * The one piece of Bonuses view state that belongs to the device rather than to the document:
 * whether the list of sources is unfolded (design plan §7.3, decision D7 — "collapsed by default,
 * expanded state remembered per device").
 *
 * It lives under the shared `pyrrhic.ui.v1` object in `localStorage`, beside the saved document but
 * never inside it: a share link and a sync must not carry "this device likes its bonuses open".
 * Every read and every write is guarded — a private window, a full quota and a blocked origin all
 * throw, and none of them is a reason to lose the card.
 *
 * This is a private copy of the same tiny helper the Mercenaries card uses; the two are merged into
 * one module once every card has landed.
 */
const KEY = 'pyrrhic.ui.v1';

/** The field of that object this card owns. */
export const BONUSES_EXPANDED = 'bonusesExpanded';
/** The two families folded at the foot of the list (artifacts, titles), each remembered the same way. */
export const BONUSES_FOLDS = 'bonusesFolds';
export type BonusesFold = 'artifacts' | 'titles';

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

/** Was the card left open? Anything but a stored `true` means collapsed, which is the default. */
export function readExpanded(): boolean {
  return readAll()[BONUSES_EXPANDED] === true;
}

/** Writes that one field and keeps every other one: the object is shared with the rest of the UI. */
export function writeExpanded(expanded: boolean): void {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify({ ...readAll(), [BONUSES_EXPANDED]: expanded }));
  } catch {
    // No storage (private window, full quota): the card simply forgets between visits.
  }
}

/** Was one of the two foot folds left open? Anything but a stored `true` means folded. */
export function readFold(fold: BonusesFold): boolean {
  const folds = readAll()[BONUSES_FOLDS];
  return typeof folds === 'object' && folds !== null && (folds as Record<string, unknown>)[fold] === true;
}

export function writeFold(fold: BonusesFold, open: boolean): void {
  try {
    const all = readAll();
    const folds =
      typeof all[BONUSES_FOLDS] === 'object' && all[BONUSES_FOLDS] !== null ? all[BONUSES_FOLDS] : {};
    globalThis.localStorage?.setItem(
      KEY,
      JSON.stringify({ ...all, [BONUSES_FOLDS]: { ...(folds as Record<string, unknown>), [fold]: open } }),
    );
  } catch {
    // No storage: the fold simply forgets between visits.
  }
}
