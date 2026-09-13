/**
 * One tab stop for a whole row of chips (design rule 24; investigation 0011 measured the captain
 * grid at **52 tab stops**, which is a keyboard walking the Bonuses card for half a minute).
 *
 * The pattern is the ARIA authoring practice for a composite widget: `Tab` enters the group once and
 * leaves it once, the **arrows** move between the items inside it, `Home`/`End` jump to the ends, and
 * the item's own key contract is left alone — a chip is a checkbox, so `Space` still toggles it, and
 * nothing here touches that.
 *
 * A chip may carry a second control (the captain's corner gear). Those are not in the arrow ring —
 * fifty-two arrow presses would be no better than fifty-two tab stops — they are reachable with
 * `Tab` from the chip they belong to, and only from it: every other gear is out of the tab order, so
 * the group is still one stop in and one stop out.
 *
 * Two implementation notes, both deliberate. The tab indices are written on the DOM in an effect
 * rather than passed as props: the rows this serves memoise every chip so that toggling one does not
 * re-render the other seventy-nine, and a prop that changes with the focus position would undo
 * exactly that. And what comes back is **spread** onto the group rather than picked apart
 * (`{...roving}`), because reading `roving.ref` in a render is reading a ref in a render, which is
 * what `react-hooks/refs` is there to refuse.
 */
import { useCallback, useEffect, useRef, type FocusEvent, type KeyboardEvent } from 'react';

/** The chips themselves: Mantine draws one as a visually hidden input behind the label. */
const ITEMS = 'input:not([disabled])';
/** A control riding on a chip: the corner gear. */
const SECONDARY = 'button:not([disabled])';

/** Which way each arrow walks the row. A wrapping row has no axis, so both pairs move one step. */
const STEPS: Record<string, number> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

export interface RovingTabs {
  /** Goes on the element that carries `role="group"`, with the two handlers beside it. */
  ref: (node: HTMLElement | null) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onFocus: (event: FocusEvent<HTMLElement>) => void;
}

export function useRovingTabs(): RovingTabs {
  // The group element and the item `Tab` comes back to, in one box that is only ever read and
  // written from a handler or an effect.
  const box = useRef<{ group: HTMLElement | null; active: number }>({ group: null, active: 0 });

  const items = useCallback(
    (): HTMLElement[] =>
      box.current.group === null ? [] : [...box.current.group.querySelectorAll<HTMLElement>(ITEMS)],
    [],
  );

  /**
   * Write the tab order: one item at 0, everything else at −1, and the controls riding on the active
   * item's own chip back in the order behind it.
   */
  const apply = useCallback((): void => {
    const list = items();
    if (list.length === 0) return;
    if (box.current.active >= list.length) box.current.active = list.length - 1;
    for (const [index, item] of list.entries()) item.tabIndex = index === box.current.active ? 0 : -1;

    const buttons = box.current.group?.querySelectorAll<HTMLElement>(SECONDARY) ?? [];
    if (buttons.length === 0) return;
    // The chip and its gear are siblings inside one wrapper, and that wrapper is a direct child of
    // the group: "the same wrapper as the focused chip" is the whole of the test.
    let wrapper = list[box.current.active] ?? null;
    while (wrapper !== null && wrapper.parentElement !== box.current.group) wrapper = wrapper.parentElement;
    for (const button of buttons) button.tabIndex = wrapper?.contains(button) === true ? 0 : -1;
  }, [items]);

  // The chips are a list the caller re-renders freely, so the order is rewritten after every paint
  // rather than only when the hook is mounted.
  useEffect(apply);

  const ref = useCallback(
    (node: HTMLElement | null): void => {
      box.current.group = node;
      if (node !== null) apply();
    },
    [apply],
  );

  /**
   * Move to an item and focus it. **Only a key ever calls this** — a pointer or a thumb lands on a
   * chip by itself and `onFocus` below merely records where it landed — so the ring this focus
   * raises is a keyboard's ring, which is the one it is for. `focusVisible` says that out loud for
   * the engines that read it, rather than leaving it to a heuristic (design rule 24; the owner
   * photographed a square appearing around a chip after a tap on 2026-09-13, which was a `:hover`
   * a phone never takes back — see `theme.module.css`).
   */
  const move = useCallback(
    (next: number): void => {
      const list = items();
      if (list.length === 0) return;
      const wrapped = (next + list.length) % list.length;
      box.current.active = wrapped;
      apply();
      list[wrapped]?.focus({ focusVisible: true });
    },
    [apply, items],
  );

  const onKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>): void => {
      const list = items();
      const index = list.indexOf(event.target as HTMLElement);
      // A key pressed on a gear, or inside the editor it opens, belongs to that control.
      if (index === -1) return;
      const step = STEPS[event.key];
      if (step !== undefined) {
        event.preventDefault();
        move(index + step);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        move(0);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        move(list.length - 1);
      }
    },
    [items, move],
  );

  /** Landing on a chip with the pointer makes it the one `Tab` comes back to. */
  const onFocus = useCallback(
    (event: FocusEvent<HTMLElement>): void => {
      const index = items().indexOf(event.target);
      if (index === -1 || index === box.current.active) return;
      box.current.active = index;
      apply();
    },
    [apply, items],
  );

  return { ref, onKeyDown, onFocus };
}
