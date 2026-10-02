/**
 * The gear that overlaps the top-right corner of a chip (plan §3; investigation 0007's best find).
 * `Indicator` positions it and `ActionIcon` is the button, which matters: the gear opens an editor
 * and must never be the thing that toggles the chip under it, so it is a sibling target with its own
 * name rather than a mark inside the chip's own label.
 */
import { ActionIcon, Indicator, Popover, VisuallyHidden } from '@mantine/core';
import { Settings } from 'lucide-react';
import { useId, type ReactNode } from 'react';

import classes from './kit.module.css';
import { isCommitEnter } from './enterCommits';
import { useOpenEditor } from './openEditors';

export interface CornerGearProps {
  /** The gear's own accessible name: "Set Aydae's level". */
  label: string;
  onPress: () => void;
  /** The thing the gear sits on. */
  children: ReactNode;
  /** Filled while the thing under it is chosen, so the mark keeps up with the chip. */
  active?: boolean;
  size?: number;
  /**
   * A short figure worn in place of the gear: a captain's level (owner, 2026-10-02, proposal G of the
   * "Captain Level Badges" artifact). The badge is then 20 px, 1 px higher than centred on the corner, as wide as its
   * digits, and the chip under it ends 7 px after its last mark instead of keeping the gear's 14 px strip.
   */
  figure?: string;
  /** What the mark stands for, read after the button's name: "Level 60, 3 stars". */
  description?: string;
  /**
   * The editor the gear opens. Given, `CornerGear` owns the popover and anchors it on the gear's own
   * button — which is the only correct anchor: `Popover.Target` stamps `aria-expanded` onto whatever
   * it wraps, and that attribute is invalid on the `<span>` a chip or a pill renders (0007's
   * `aria-allowed-attr`, 23 nodes). Without it the gear is a plain button and the caller decides.
   */
  dropdown?: ReactNode;
  opened?: boolean;
  onOpenedChange?: (opened: boolean) => void;
}

export function CornerGear({
  label,
  onPress,
  children,
  active = false,
  size: sizeProp,
  figure,
  description,
  dropdown,
  opened,
  onOpenedChange,
}: CornerGearProps) {
  // The editor behind the gear is a setup editor like a sheet is, so `Ctrl`/`⌘ + Enter` shuts it
  // before it generates (`openEditors.ts`). Only when the caller drives it: left uncontrolled, the
  // popover's open state is Mantine's own and nothing here can put it down.
  useOpenEditor(opened === true && onOpenedChange !== undefined, () => {
    onOpenedChange?.(false);
  });

  const descriptionId = useId();
  const size = sizeProp ?? (figure === undefined ? 18 : 20);
  // Two widths, not a measure: up to two digits the badge is its own height, three take 28 px. How far
  // it reaches past the chip is then known, and so is the gap the next chip keeps (`kit.module.css`).
  const digits = figure === undefined ? undefined : figure.length > 2 ? '3' : '2';

  const gear = (
    <ActionIcon
      size={size}
      radius="xl"
      variant={active ? 'filled' : 'default'}
      aria-label={label}
      {...(description === undefined ? {} : { 'aria-describedby': descriptionId })}
      className={figure === undefined ? undefined : classes.figure}
      data-digits={digits}
      onClick={onPress}
    >
      {figure ?? <Settings size={Math.round(size * 0.6)} aria-hidden />}
    </ActionIcon>
  );

  const badge = (
    <Indicator
      className={figure === undefined ? classes.cornerGear : `${classes.cornerGear} ${classes.cornerFigure}`}
      data-digits={digits}
      position="top-end"
      // Centred on the corner itself, as TotalStack's gear is (investigation 0006: "overlapping the
      // top-right corner"). It used to sit 2 px in, which is 2 px more of the chip's last letters
      // under it and 2 px more the chip had to reserve for it (`kit.module.css`, `.cornerGear`).
      offset={0}
      size={size}
      color="transparent"
      label={dropdown === undefined ? gear : <Popover.Target>{gear}</Popover.Target>}
    >
      {children}
      {description !== undefined && <VisuallyHidden id={descriptionId}>{description}</VisuallyHidden>}
    </Indicator>
  );

  if (dropdown === undefined) return badge;

  return (
    <Popover
      position="bottom-end"
      trapFocus
      {...(opened === undefined ? {} : { opened })}
      {...(onOpenedChange === undefined ? {} : { onChange: onOpenedChange })}
    >
      {badge}
      <Popover.Dropdown
        // Enter in the editor's field closes it (owner, 2026-10-02; `enterCommits.ts`): the figure is
        // already written, and Enter is how a typed number is finished — the cap popover's rule too.
        onKeyDown={(event) => {
          if (!isCommitEnter(event) || onOpenedChange === undefined) return;
          event.preventDefault();
          onOpenedChange(false);
        }}
      >
        {dropdown}
      </Popover.Dropdown>
    </Popover>
  );
}
