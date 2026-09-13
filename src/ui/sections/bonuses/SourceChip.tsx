/**
 * The same chip anatomy `CaptainChip` gives the captains, for the three other families TotalStack
 * draws as chips (investigation 0006, D-34): artifacts, permanent sources and titles.
 *
 * It is a composition of stock parts — Mantine's `Chip` inside the kit's `CornerGear` — and exists
 * only because the wording differs: a captain "rides with this march", an artifact is "equipped" and
 * a permanent source is "always on". The shapes, the 32 px height and the gear are the theme's and
 * the kit's; nothing here is styled.
 */
import { Chip, Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { CornerGear } from '@/ui/kit2';

export interface SourceChipProps {
  /** What the chip reads as. */
  name: string;
  /** The chip's accessible name: it says the state, because the ground colour cannot (rule 24). */
  toggleLabel: string;
  /** The second, dimmed line under the name: what the source is worth. */
  value?: string;
  checked: boolean;
  onToggle: () => void;
  /** A level or a value is recorded: the name gets a dot, as TotalStack's chips do. */
  dotted?: boolean;
  disabled?: boolean;
  /** The gear's own accessible name. Left out, the chip carries no gear. */
  gearLabel?: string;
  onGear?: () => void;
  /** The editor the gear opens, built only while it is open. */
  gearDropdown?: ReactNode;
  gearOpened?: boolean;
  onGearOpenedChange?: (opened: boolean) => void;
}

export function SourceChip({
  name,
  toggleLabel,
  value,
  checked,
  onToggle,
  dotted = false,
  disabled = false,
  gearLabel,
  onGear,
  gearDropdown,
  gearOpened,
  onGearOpenedChange,
}: SourceChipProps) {
  const chip = (
    <Chip checked={checked} disabled={disabled} color="brass" aria-label={toggleLabel} onChange={onToggle}>
      <Group gap={5} wrap="nowrap" component="span">
        <Stack gap={0} component="span">
          <Text span inherit>
            {name}
            {dotted && (
              <Text span c="dimmed">
                {' '}
                •
              </Text>
            )}
          </Text>
          {value !== undefined && value !== '' && (
            <Text span size="xs" c="dimmed">
              {value}
            </Text>
          )}
        </Stack>
      </Group>
    </Chip>
  );

  if (gearLabel === undefined || onGear === undefined) return chip;

  return (
    <CornerGear
      label={gearLabel}
      active={checked}
      onPress={onGear}
      {...(gearDropdown === undefined ? {} : { dropdown: gearDropdown })}
      {...(gearOpened === undefined ? {} : { opened: gearOpened })}
      {...(onGearOpenedChange === undefined ? {} : { onOpenedChange: onGearOpenedChange })}
    >
      {chip}
    </CornerGear>
  );
}
