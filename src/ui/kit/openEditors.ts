/**
 * Every **setup editor that hovers** — a sheet, a chip's gear popover, a pill's cap popover —
 * says here that it is open, so the frame can shut it without knowing which one it was.
 *
 * It exists for one keystroke. `Ctrl`/`⌘ + Enter` generates from anywhere (`shell/useGenerateRun`),
 * and the owner's ask of 2026-09-20 was that it also close the popup he pressed it in: the editor
 * is over the answer, and a march he cannot see is a march he has to close something to read. A
 * plain `Enter` cannot do this job — it is the key that *commits a figure*, and a run on every
 * committed figure is a run paid for on every edit.
 *
 * Only editors register. The March sheet carries the **answer**, so it stays up to receive the new
 * one, and a modal `Dialog` is a question with its own buttons: neither is dismissed from here.
 *
 * It is a module-level set rather than a store because the frame reads it at the moment of the
 * keystroke and never renders from it — the same reason `useGenerateShortcut` subscribes to
 * nothing (see its note: a shortcut that re-renders the frame on every keystroke was felt as
 * "all inputs a bit sluggish").
 */
import { useEffect, useRef, useSyncExternalStore } from 'react';

import { useBackCloses } from './backCloses';

const open = new Set<() => void>();
const listeners = new Set<() => void>();

function changed(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Whether any editor hovers right now, as a render input. The March sheet reads it to give up its
 * own Escape: Mantine closes every open drawer on one keystroke, and the owner's ask of 2026-10-20 was
 * that Esc shut the troop detail and the next Esc the summary under it.
 */
export function useEditorOpen(): boolean {
  return useSyncExternalStore(subscribe, () => open.size > 0);
}

/** Register an open editor; call what comes back when it closes. */
export function registerOpenEditor(close: () => void): () => void {
  open.add(close);
  changed();
  return () => {
    open.delete(close);
    changed();
  };
}

/**
 * Close every open editor, newest first, and say whether there was one. The closers are copied
 * first: each one sets state that unregisters it, which would otherwise be a set mutated while it
 * is iterated.
 */
export function closeOpenEditors(): boolean {
  if (open.size === 0) return false;
  for (const close of [...open].reverse()) close();
  return true;
}

/**
 * The hook side of it: registered while `opened`, unregistered the moment it shuts or unmounts.
 * `close` is read through a ref, so an inline arrow — which is what every caller passes — does not
 * re-register the editor on every render of it.
 */
export function useOpenEditor(opened: boolean, close: () => void): void {
  // Every editor that Ctrl+Enter shuts is one the phone's Back shuts too (`backCloses.ts`).
  useBackCloses(opened, close);

  const latest = useRef(close);
  useEffect(() => {
    latest.current = close;
  });

  useEffect(() => {
    if (!opened) return;
    return registerOpenEditor(() => {
      latest.current();
    });
  }, [opened]);
}
