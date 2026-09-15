/**
 * A set of mutually exclusive choices where each one needs a sentence (plan §3): the stacking
 * method, the objective, the tie-break. `Radio.Group` + `Radio.Card` gives a full-target row with
 * the radio's keyboard contract intact — arrows move *and* choose, which is what a radio group owes
 * — and leaves room for a description under the title.
 *
 * Two layouts, one composite (M-09 polish list; the Battle worker had built the second one locally
 * as `ChoiceCards`). They are the same control and the same props, arranged differently:
 *
 * - `list` stacks full-width rows with the mark at the start and an optional figure at the end. Use
 *   it for a long list, or one whose rows carry a trailing value.
 * - `cards` lays the options out as a grid of equal columns with the mark in the **top-right
 *   corner** (design overhaul §7.4, investigation 0008's "Stacking method") — **from the medium
 *   window up**. Inside Material 3's compact window a card grid is a column of cards with nothing a
 *   grid buys, so it falls back to `list` there (D-54): the row is shorter, and a long one may fold
 *   to the chosen option behind a "Change …" button. A card's accessible name is the *title alone*;
 *   the sentence reaches a screen reader as its description instead of being glued onto its name.
 *
 * `collapsible` folds either shape, because the question it answers — "is this window too narrow to
 * carry every option at once?" — is the same one the layout asks.
 */
import { Button, Group, Radio, SimpleGrid, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useId, useState, type ReactNode } from 'react';

/**
 * Material 3's compact window ends at 600 dp; 40 em is the first step past it in our own type scale,
 * and the width at which two option cards stop being a column of one. Under it a `cards` list is
 * drawn as rows and a `collapsible` one folds.
 */
const WIDE = '(min-width: 40em)';

export interface ChoiceItem {
  value: string;
  title: string;
  description?: ReactNode;
  /** The end of a `list` row: a figure, a badge, a hint. Ignored by `cards`. */
  trailing?: ReactNode;
  disabled?: boolean;
}

export interface ChoiceListProps {
  label: string;
  description?: ReactNode;
  value: string | null;
  onChange: (value: string) => void;
  items: readonly ChoiceItem[];
  /** Stacked rows (the default) or a grid of cards from the medium window up. */
  layout?: 'list' | 'cards';
  /** `cards` only: how many columns the grid has where there is room for one. */
  columns?: number;
  /** A long list folds to the chosen option on a phone, behind a "Change …" button. */
  collapsible?: boolean;
  /** Groups the radios for the keyboard; generated from the label when left out. */
  name?: string;
}

export function ChoiceList({
  label,
  description,
  value,
  onChange,
  items,
  layout = 'list',
  columns = 1,
  collapsible = false,
  name,
}: ChoiceListProps) {
  // The first paint is already the right shape: a fold that appears a frame later moves the page
  // under the thumb. jsdom has no `matchMedia`, and its fallback is the phone, which is what tests.
  const wide = useMediaQuery(WIDE, false, { getInitialValueInEffect: false });
  const [expanded, setExpanded] = useState(false);

  // A grid of one column is not a grid: inside the compact window the cards are rows (D-54).
  const cards = layout === 'cards' && wide;
  const chosen = items.filter((item) => item.value === value);
  const folded = collapsible && !wide && !expanded && chosen.length > 0;
  const shown = folded ? chosen : items;

  return (
    <Radio.Group
      label={label}
      description={description}
      value={value}
      onChange={(next) => {
        onChange(next);
        // Picking one answers the question the fold asked: close it again.
        if (collapsible) setExpanded(false);
      }}
      name={name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
    >
      {cards ? (
        <SimpleGrid cols={folded ? 1 : columns} spacing="xs" mt={6}>
          {shown.map((item) => (
            <Card key={item.value} item={item} />
          ))}
        </SimpleGrid>
      ) : (
        <Stack gap="xs" mt="xs">
          {shown.map((item) => (
            <Row key={item.value} item={item} />
          ))}
        </Stack>
      )}
      {folded && (
        <Button
          variant="subtle"
          size="compact-sm"
          mt={6}
          onClick={() => {
            setExpanded(true);
          }}
        >
          {`Change ${label}`}
        </Button>
      )}
    </Radio.Group>
  );
}

function Row({ item }: { item: ChoiceItem }) {
  const descriptionId = useId();

  return (
    // The same name and the same description as a card, and said the same way: a row's own name is
    // nothing at all to a browser's accessibility tree — measured on the built app, the phones' rows
    // came out as bare `radio` with no name while the cards were named — so the title is written on
    // the control and the sentence is *described by* it, exactly as `Card` below does it. A radio a
    // screen reader cannot name is a control with no name at all (WCAG 4.1.2).
    <Radio.Card
      value={item.value}
      withBorder
      radius="sm"
      p="sm"
      disabled={item.disabled ?? false}
      aria-label={item.title}
      {...(item.description === undefined ? {} : { 'aria-describedby': descriptionId })}
    >
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <Radio.Indicator />
        <Stack gap={2} flex={1} miw={0}>
          <Text size="sm" fw={500}>
            {item.title}
          </Text>
          {item.description !== undefined && (
            <Text id={descriptionId} size="xs" c="dimmed">
              {item.description}
            </Text>
          )}
        </Stack>
        {item.trailing}
      </Group>
    </Radio.Card>
  );
}

function Card({ item }: { item: ChoiceItem }) {
  const descriptionId = useId();

  return (
    <Radio.Card
      value={item.value}
      p="sm"
      radius="md"
      disabled={item.disabled ?? false}
      aria-label={item.title}
      {...(item.description === undefined ? {} : { 'aria-describedby': descriptionId })}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
        <Stack gap={2} miw={0}>
          <Text size="sm" fw={600}>
            {item.title}
          </Text>
          {item.description !== undefined && (
            <Text id={descriptionId} size="xs" c="dimmed">
              {item.description}
            </Text>
          )}
        </Stack>
        <Radio.Indicator />
      </Group>
    </Radio.Card>
  );
}
