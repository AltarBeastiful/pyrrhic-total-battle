/**
 * The HP profile: one bar per stack, total HP, first to fall on top.
 *
 * The enemy always hits the stack with the most health left, so the bars fall from top to bottom in
 * the order the battle destroys the army, and a profile whose bars are nearly the same length is a
 * march where every stack gets to hit before it dies. It lives inside the folded details — it
 * explains the counts, it is not one of them.
 *
 * The bars use a square-root scale so a 260 K troop stack stays visible next to a 6.5 M mercenary
 * one; the figures beside them are what tells the two apart, written short since S-148 ("6.5M" in the
 * 96 px box) with the exact count left to the bar's own `aria-valuetext`.
 */
import { Group, Progress, Stack, Text } from '@mantine/core';

import type { Stack as StackType, UnitDef } from '@/engine/types';
import { groupInk, unitGroupOf, UnitTile } from '@/ui/domain';

import { amount, compactTwo } from './format';
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
        {/* The caption **no longer promises exact figures** (S-148): the health beside each bar is printed in
            the owner's short notation since then ("6.5M" in a 96 px box), and a caption claiming the digits
            were exact would be the block arguing with its own figures. What the list is and how the bars are
            scaled is what is left to say, and it is what a reader cannot read off the bars themselves. */}
        <Text component="figcaption" size="xs" c="dimmed">
          Total health per stack, first to fall on top. The bars are drawn on a square-root scale so the small
          stacks stay visible.
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
                  // **Exact, where the label beside it is short** (S-148, and for `format.ts`'s own reason):
                  // a screen reader has no 96 px box to save, so a value it reads out is better read in full
                  // — the same call the unit sheet's counts and the clipboard text take. The notation is a
                  // *width* decision, and this is the one reader who pays no width for it.
                  aria-valuetext={amount(stack.totalHp)}
                >
                  <Progress.Section
                    withAria={false}
                    value={width}
                    color={groupInk(unitGroupOf(unit))}
                    data-hp-bar={String(width)}
                  />
                </Progress.Root>
                {/* **The bar's own figure, in the short notation since S-148** (the owner's 2026-09-29 ask:
                    *"to show the big numbers, we should use the shorter notation we've introduced already"*).
                    It stands in a **96 px box** at 12 px, dimmed — the tightest room on the sheet — so it
                    takes the tight budget of one decimal: "6.5M" where the exact count would push the row's
                    own tile sideways. The full figure is not lost with it: the bar's `aria-valuetext` above
                    carries it to the one reader who has no width to save, and the unit sheet's "Why this
                    size" sentence prints the stack's total health at the pane's two-decimal budget for
                    whoever wants it written out. */}
                <Text span size="xs" c="dimmed" ta="right" w={96}>
                  {compactTwo(stack.totalHp, 1)}
                </Text>
              </Group>
            );
          })}
        </Stack>
      </Stack>
    </Stack>
  );
}
