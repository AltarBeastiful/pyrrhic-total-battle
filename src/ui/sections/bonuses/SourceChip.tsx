/**
 * The same chip anatomy `CaptainChip` gives the captains, for the three other families TotalStack
 * draws as chips (investigation 0006, D-34): artifacts, permanent sources and titles.
 *
 * It is a composition of stock parts — Mantine's `Chip` inside the kit's `CornerGear` — and exists
 * only because the wording differs: a captain "rides with this march", an artifact is "equipped" and
 * a permanent source is "always on". The shapes, the 32 px height and the gear are the theme's and
 * the kit's; nothing here is styled.
 */
import { Box, Chip, Group, Stack, Text, Tooltip } from '@mantine/core';
import type { ReactNode } from 'react';

import { ChipDot, CornerGear } from '@/ui/kit';

export interface SourceChipProps {
  /** What the chip reads as. */
  name: string;
  /** The chip's accessible name: it says the state, because the ground colour cannot (rule 24). */
  toggleLabel: string;
  /** The second, dimmed line under the name: what the source is worth. */
  value?: string;
  /**
   * Every line the source is worth, for the tooltip a hover or a focus raises (owner, 2026-09-17:
   * "a tooltip on hover on Army Modernization that shows all bonuses entered"). The chip's own line
   * stops at "and 2 more"; this is the rest. Nothing is raised for a source with nothing in it.
   */
  details?: readonly string[];
  checked: boolean;
  onToggle: () => void;
  /** A level or a value is recorded: the chip gets a dot, as TotalStack's chips do (`ChipDot`). */
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
  details = [],
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
            {dotted && <ChipDot />}
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

  // The tooltip's target is a box around the chip rather than the chip itself: Mantine's `Chip` hands
  // its props to the hidden input, and a hover never lands on a hidden input. In a portal, so a
  // popover-anchored gear and a card's own overflow leave it alone; on focus too, for the keyboard.
  const described =
    details.length === 0 ? (
      chip
    ) : (
      <Tooltip
        label={
          <Stack gap={2}>
            {details.map((line) => (
              <Text key={line} size="xs">
                {line}
              </Text>
            ))}
          </Stack>
        }
        events={{ hover: true, focus: true, touch: false }}
        withinPortal
        multiline
        maw={280}
      >
        <Box component="span" display="inline-block">
          {chip}
        </Box>
      </Tooltip>
    );

  if (gearLabel === undefined || onGear === undefined) return described;

  return (
    <CornerGear
      label={gearLabel}
      active={checked}
      onPress={onGear}
      {...(gearDropdown === undefined ? {} : { dropdown: gearDropdown })}
      {...(gearOpened === undefined ? {} : { opened: gearOpened })}
      {...(onGearOpenedChange === undefined ? {} : { onOpenedChange: onGearOpenedChange })}
    >
      {described}
    </CornerGear>
  );
}
