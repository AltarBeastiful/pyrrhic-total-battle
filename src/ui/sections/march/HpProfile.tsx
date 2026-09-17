/**
 * The HP profile: one bar per stack, total HP, first to fall on top.
 *
 * The enemy always hits the stack with the most health left, so the bars fall from top to bottom in
 * the order the battle destroys the army, and a profile whose bars are nearly the same length is a
 * march where every stack gets to hit before it dies. It lives inside the folded details — it
 * explains the counts, it is not one of them.
 *
 * The bars use a square-root scale so a 260 K troop stack stays visible next to a 6.5 M mercenary
 * one; the figures beside them are exact.
 */
import { Group, Progress, Stack, Text } from '@mantine/core';

import type { Stack as StackType, UnitDef } from '@/engine/types';
import { groupInk, unitGroupOf, UnitTile } from '@/ui/domain';

import { amount } from './format';
import { findUnit } from './units';

export interface HpProfileProps {
  /** Stacks in kill order: the first to fall first. */
  stacks: readonly StackType[];
  units: readonly UnitDef[];
}

export function HpProfile({ stacks, units }: HpProfileProps) {
  if (stacks.length === 0) return null;
  const widest = Math.max(...stacks.map((stack) => stack.totalHp), 1);
  const rows = stacks.flatMap((stack) => {
    const unit = findUnit(stack.unitId, units);
    return unit === undefined ? [] : [{ stack, unit }];
  });

  return (
    <Stack gap="xs">
      {/* The block wears its name since it moved above the battle story (owner, 2026-09-18): the
          story has always had a heading, and the first of two blocks in one fold cannot be the
          unnamed one. It is the story's own heading, at the same level and weight — and it sits
          *outside* the `<figure>`, because a `<figcaption>` has to be that element's first or last
          child and the caption under it already is. */}
      <Text component="h4" size="md" fw={600}>
        HP profile
      </Text>
      <Stack component="figure" gap="xs" m={0}>
        <Text component="figcaption" size="xs" c="dimmed">
          Total health per stack, first to fall on top. The bars are drawn on a square-root scale so the small
          stacks stay visible; the figures beside them are exact.
        </Text>
        <Stack component="ul" gap={4} aria-label="Total HP per stack, first to fall first">
          {rows.map(({ stack, unit }) => {
            // One scale for the whole list: two per-group scales would put a short bar above a long
            // one and lie about who falls first.
            const width = Math.max(2, Math.round(Math.sqrt(Math.max(0, stack.totalHp) / widest) * 100));
            return (
              <Group component="li" key={stack.unitId} gap="xs" wrap="nowrap">
                <UnitTile unit={unit} size="sm" label={unit.name} />
                <Text span size="sm" truncate w={120}>
                  {unit.name}
                </Text>
                <Progress.Root
                  size="md"
                  radius="xs"
                  flex={1}
                  miw={0}
                  role="progressbar"
                  aria-label={`${unit.name} total health`}
                  aria-valuemin={0}
                  aria-valuemax={widest}
                  aria-valuenow={stack.totalHp}
                  aria-valuetext={amount(stack.totalHp)}
                >
                  <Progress.Section
                    withAria={false}
                    value={width}
                    color={groupInk(unitGroupOf(unit))}
                    data-hp-bar={String(width)}
                  />
                </Progress.Root>
                <Text span size="xs" c="dimmed" ta="right" w={96}>
                  {amount(stack.totalHp)}
                </Text>
              </Group>
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  );
}
