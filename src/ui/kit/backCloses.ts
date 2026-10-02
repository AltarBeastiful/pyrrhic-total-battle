/**
 * **The phone's Back closes the popup, not the app** (owner, 2026-10-02: *"press back on mobile closes
 * popup (like troop settings…)"*). Android's Back — and the swipe that stands for it — is a history
 * step, and the app is one page with one history entry, so Back left Pyrrhic with a sheet still open.
 *
 * So while anything that hovers is open, the page carries **one extra history entry** of its own (same
 * URL, nothing in the address bar changes). Back spends it: the `popstate` closes the newest popup,
 * and if another is still open under it the entry is laid down again for the next Back. A popup closed
 * any other way — its ×, Done, Enter, a tap outside — takes the entry back off, so the history a player
 * leaves the app with is the one they came in with.
 *
 * Touch screens only (`pointer: coarse`): a desktop's Back is the browser's, and a player who pressed
 * Alt+← meant to leave the page. It is also what keeps this out of jsdom, which has no `matchMedia`.
 *
 * The entry is reconciled on a timer rather than in the effect that opens or closes a popup: moving
 * from one gear to another closes one popover and opens the next in the same commit, and an entry
 * taken off and laid down again in one tick would have `history.back()` land after the new
 * `pushState` — and close the popover that just opened.
 */
import { useEffect, useRef } from 'react';

const MARK = 'pyrrhic-popup';

/** The open popups' closers, oldest first. */
const stack: (() => void)[] = [];
/** Our entry is the current one in the history. */
let armed = false;
/** A `history.back()` of our own is on its way; its `popstate` is not a player's Back. */
let unwinding = false;
let pending: ReturnType<typeof setTimeout> | undefined;
let listening = false;

function touchScreen(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
}

function reconcile(): void {
  pending = undefined;
  if (stack.length > 0 && !armed && !unwinding) {
    window.history.pushState({ [MARK]: true }, '');
    armed = true;
  } else if (stack.length === 0 && armed) {
    armed = false;
    unwinding = true;
    window.history.back();
  }
}

function schedule(): void {
  if (pending === undefined) pending = setTimeout(reconcile, 0);
}

function onPopState(): void {
  if (unwinding) {
    unwinding = false;
    schedule();
    return;
  }
  if (!armed) return;
  armed = false;
  // Out of the stack now rather than when its effect cleans up, so the entry is laid down again only
  // for a popup that is really still open.
  const close = stack.pop();
  close?.();
  schedule();
}

function register(close: () => void): () => void {
  if (!listening) {
    window.addEventListener('popstate', onPopState);
    listening = true;
  }
  stack.push(close);
  schedule();
  return () => {
    const at = stack.indexOf(close);
    if (at !== -1) stack.splice(at, 1);
    schedule();
  };
}

/** While `opened`, the phone's Back calls `close` — newest popup first. */
export function useBackCloses(opened: boolean, close: () => void): void {
  const latest = useRef(close);
  useEffect(() => {
    latest.current = close;
  });

  useEffect(() => {
    if (!opened || !touchScreen()) return;
    return register(() => {
      latest.current();
    });
  }, [opened]);
}
