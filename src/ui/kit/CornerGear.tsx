/**
 * The gear that overlaps the top-right corner of a chip (plan §3; investigation 0007's best find).
 * `Indicator` positions it and `ActionIcon` is the button, which matters: the gear opens an editor
 * and must never be the thing that toggles the chip under it, so it is a sibling target with its own
 * name rather than a mark inside the chip's own label.
 */
import { ActionIcon, Indicator, Popover } from '@mantine/core';
import { Settings } from 'lucide-react';
import type { ReactNode } from 'react';

import classes from './kit.module.css';

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
  size = 18,
  dropdown,
  opened,
  onOpenedChange,
}: CornerGearProps) {
  const gear = (
    <ActionIcon
      size={size}
      radius="xl"
      variant={active ? 'filled' : 'default'}
      aria-label={label}
      onClick={onPress}
    >
      <Settings size={Math.round(size * 0.6)} aria-hidden />
    </ActionIcon>
  );

  const badge = (
    <Indicator
      className={classes.cornerGear}
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
      <Popover.Dropdown>{dropdown}</Popover.Dropdown>
    </Popover>
  );
}
