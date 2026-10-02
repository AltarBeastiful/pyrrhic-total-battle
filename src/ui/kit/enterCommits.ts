/**
 * **Enter finishes a typed figure** (owner, 2026-10-02: *"when editing counts, validate with enter key
 * — same in popup"*). Every field here writes on every keystroke, so there is nothing for Enter to
 * save: what it does is *close what the figure was typed in* — the edit-counts mode, a gear's
 * popover, a sheet.
 *
 * Only an Enter that lands in a typed field counts. A `Select`'s input is an `<input>` too, and its
 * Enter picks the highlighted option — it says so with `aria-haspopup` — and a switch or a checkbox
 * keeps its own keys. An Enter that is still composing an IME word is the word's, not ours.
 */
import type { KeyboardEvent } from 'react';

/** The inputs Enter finishes: the ones a player types into, not the ones that open a list. */
export function isTypedField(element: EventTarget | null): element is HTMLInputElement {
  if (!(element instanceof HTMLInputElement)) return false;
  if (element.type === 'checkbox' || element.type === 'radio') return false;
  if (element.hasAttribute('aria-haspopup') || element.readOnly || element.disabled) return false;
  return true;
}

/** A plain Enter in a typed field. `Ctrl`/`⌘ + Enter` is Generate's (`shell/useGenerateRun`). */
export function isCommitEnter(event: KeyboardEvent): boolean {
  if (event.key !== 'Enter' || event.nativeEvent.isComposing) return false;
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return false;
  return isTypedField(event.target);
}

/**
 * Where Enter goes in a form of several fields (a sheet): the **next** typed field if there is one,
 * the way a phone keyboard's "next" walks a form, and `null` on the last — which is where the caller
 * finishes. The theme selects a field's figure on focus, so the next one opens ready to be replaced.
 */
export function nextTypedField(container: HTMLElement, from: HTMLInputElement): HTMLInputElement | null {
  const fields = [...container.querySelectorAll('input')].filter(isTypedField);
  const at = fields.indexOf(from);
  return at === -1 ? null : (fields[at + 1] ?? null);
}
