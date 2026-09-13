/**
 * The full-card single-select the Battle card is built from (design overhaul §7.4; investigation
 * 0008, "Stacking method"): wide option cards laid out in one row, each with a title, the one line
 * the glossary gives it and the radio mark in the **top-right corner**, the whole card being the
 * target (design rule 8). On a phone they stack, and a long list may fold to the chosen card.
 *
 * `Radio.Group` + `Radio.Card`, the same two primitives the kit's `ChoiceList` is made of. It is
 * not that composite because this card needs two things `ChoiceList` has no prop for and that only
 * this screen wants: a grid of equal columns instead of a stack, and an accessible name that is the
 * *title alone* — the sentence reaches a screen reader as the card's description instead of being
 * glued onto its name, which is also the contract `e2e/helpers.ts` reads the objective by.
 */
import { Button, Group, Radio, SimpleGrid, Stack, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useId, useState } from 'react';

/** Wide enough for the cards to sit side by side; under it they stack (Material 3's compact window). */
const WIDE = '(min-width: 48em)';

export interface ChoiceCard {
  value: string;
  title: string;
  description: string;
}

export interface ChoiceCardsProps {
  /** Names the group for a screen reader, and heads it on screen. */
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: readonly ChoiceCard[];
  /** Columns from `sm` up; one on a phone whatever this says. */
  columns?: number;
  /** A long list folds to the chosen card on a phone, behind a "Change …" button (§7.4). */
  collapsible?: boolean;
}

export function ChoiceCards({
  label,
  value,
  onChange,
  items,
  columns = 1,
  collapsible = false,
}: ChoiceCardsProps) {
  // The first paint is already the right shape: a fold that appears a frame later moves the page
  // under the thumb. jsdom has no `matchMedia`, and its fallback is the phone, which is what tests.
  const wide = useMediaQuery(WIDE, false, { getInitialValueInEffect: false });
  const [expanded, setExpanded] = useState(false);

  const chosen = items.filter((item) => item.value === value);
  const folded = collapsible && !wide && !expanded && chosen.length > 0;
  const shown = folded ? chosen : items;

  return (
    <Radio.Group
      label={label}
      value={value}
      onChange={(next) => {
        onChange(next);
        // Picking one answers the question the fold asked: close it again.
        if (collapsible) setExpanded(false);
      }}
    >
      <SimpleGrid cols={{ base: 1, sm: folded ? 1 : columns }} spacing="xs" mt={6}>
        {shown.map((item) => (
          <ChoiceCardItem key={item.value} item={item} />
        ))}
      </SimpleGrid>
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

function ChoiceCardItem({ item }: { item: ChoiceCard }) {
  const descriptionId = useId();

  return (
    <Radio.Card
      value={item.value}
      p="sm"
      radius="md"
      aria-label={item.title}
      aria-describedby={descriptionId}
    >
      <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
        <Stack gap={2} miw={0}>
          <Text size="sm" fw={600}>
            {item.title}
          </Text>
          <Text id={descriptionId} size="xs" c="dimmed">
            {item.description}
          </Text>
        </Stack>
        <Radio.Indicator />
      </Group>
    </Radio.Card>
  );
}
