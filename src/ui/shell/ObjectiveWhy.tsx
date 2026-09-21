/**
 * The **ⓘ** beside a locked Objective: the sentence that says why the plan decides it, kept off a bar
 * that has no room to print it (owner, 2026-09-21 — `OBJECTIVE_LOCKED_REASON` carries the whole of that
 * decision, and this is the half of it the narrow bars draw).
 *
 * **A popover and not a tooltip**, for the reason `sections/march/PlanPanel.tsx` gives at its own ⓘ
 * (design rules 18 and 24): hover is not a thing a thumb has, and the control this explains is
 * *disabled*, which fires no hover even where there is a pointer. A press opens it, a press outside or
 * `Escape` closes it, and a keyboard reaches it — the select beside it is out of the tab order while it
 * is locked, so this button is the one focusable thing left on that part of the bar.
 *
 * The words are carried beside the button as its description as well, because a popover's contents are
 * not in the accessibility tree until it is open.
 */
import { ActionIcon, Popover, Text, VisuallyHidden } from '@mantine/core';
import { Info } from 'lucide-react';
import { useId, useState } from 'react';

import { OBJECTIVE_LOCKED_REASON } from './command';

export interface ObjectiveWhyProps {
  /**
   * The button's own size. The phone bar passes **44**, the floor a thumb needs and the height of the
   * chip row it stands in (the review of 2026-09-13); the desktop bar leaves it at the `sm` the pane's
   * ⓘ is drawn at, where the pointer is fine and the row is 40 px of well.
   */
  size?: number | 'sm';
  /**
   * Where it stands in its own bar's row — a CSS-module class, as every `className` here is. The
   * `| undefined` is what a module's own typing hands the caller (`exactOptionalPropertyTypes`).
   */
  className?: string | undefined;
}

export function ObjectiveWhy({ size = 'sm', className }: ObjectiveWhyProps) {
  const [opened, setOpened] = useState(false);
  const whyId = useId();

  return (
    <>
      <Popover
        opened={opened}
        onChange={setOpened}
        width={260}
        // Both bars sit on the bottom edge, so the one direction there is room in is up.
        position="top-end"
        withArrow
        shadow="md"
        withinPortal
      >
        <Popover.Target>
          <ActionIcon
            // The bar is a form and this is not its Generate: an untyped `button` inside a form submits
            // it, and Mantine sets no type of its own.
            type="button"
            variant="subtle"
            color="gray"
            size={size}
            {...(className === undefined ? {} : { className })}
            // What it explains, not what it is: "Info" is a shape, and a name has to say which of the
            // bar's controls this one speaks for (design rule 19).
            aria-label="Why the objective is decided by the plan"
            aria-describedby={whyId}
            onClick={() => {
              setOpened((open) => !open);
            }}
          >
            <Info size={16} aria-hidden />
          </ActionIcon>
        </Popover.Target>
        <Popover.Dropdown>
          <Text size="sm">{OBJECTIVE_LOCKED_REASON}</Text>
        </Popover.Dropdown>
      </Popover>
      <VisuallyHidden id={whyId}>{OBJECTIVE_LOCKED_REASON}</VisuallyHidden>
    </>
  );
}
