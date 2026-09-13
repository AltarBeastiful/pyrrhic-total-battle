/**
 * Compared with all types (design plan §7.5 step 4, PLAN §3.6, design rule 29).
 *
 * A priority search wins by leaving unit types at home, and the winning number is the only one it
 * reports — so every other figure moved without anyone saying so. This strip puts each figure of
 * the winning selection next to the army you would have marched with every type in it. Putting a
 * dropped type back is done on its tile above, where its cost is visible.
 *
 * Rule 29 has a second half: saying so is not enough, the **other objectives are offered beside the
 * answer**. They are two light buttons under the sentence — the worst-case and the per-silver
 * objective, whichever of them is not the one that just ran — and pressing one sets the objective in
 * the Battle card and generates again, so the comparison is one tap rather than a scroll and a form.
 */
import { Button, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';

import { selectActiveSetup, useStore } from '@/state/store';
import { DeltaText } from '@/ui/domain';

import { amount } from './format';
import { runGenerate } from './generate';
import type { SearchTradeoff, TradeoffFigures } from './runStore';

interface Figure {
  label: string;
  read: (figures: TradeoffFigures) => number;
  /** Which way is the good way: more damage, fewer coins. */
  betterWhen: 'higher' | 'lower';
}

const FIGURES: Figure[] = [
  { label: 'Hits your army lands', read: (figures) => figures.friendlyHits, betterWhen: 'higher' },
  { label: 'Worst opening', read: (figures) => figures.minDamage, betterWhen: 'higher' },
  { label: 'Best opening', read: (figures) => figures.maxDamage, betterWhen: 'higher' },
  { label: 'Expected damage', read: (figures) => figures.avgDamage, betterWhen: 'higher' },
  { label: 'Retrain silver', read: (figures) => figures.silver, betterWhen: 'lower' },
  { label: 'Revive gold', read: (figures) => figures.gold, betterWhen: 'lower' },
  { label: 'Dragon coins', read: (figures) => figures.dragonCoins, betterWhen: 'lower' },
];

/**
 * The two honest alternatives of design rule 29, in the Battle card's own words. The ids are the
 * schema's objectives; the labels are what the card calls them, prefixed with the verb that says
 * pressing runs the search again.
 */
const ALTERNATIVES = [
  { priority: 'minDamage', label: 'Try best worst case' },
  { priority: 'damagePerSilver', label: 'Try damage per silver' },
] as const;

export interface TradeoffStripProps {
  tradeoff: SearchTradeoff;
}

export function TradeoffStrip({ tradeoff }: TradeoffStripProps) {
  const setup = useStore(selectActiveSetup);
  const kept = tradeoff.includedUnitIds.length;
  const dropped = tradeoff.excludedUnitIds.length;

  const tryObjective = (priority: (typeof ALTERNATIVES)[number]['priority']): void => {
    useStore.getState().updateActiveSetup({ priority });
    void runGenerate();
  };

  return (
    <Paper p="sm" radius="sm" bg="var(--pyr-sunken)">
      <Stack gap="xs">
        <Text component="h3" size="lg" fw={600}>
          Compared with all types
        </Text>
        <Text size="xs" c="dimmed">
          {`The priority kept ${String(kept)} unit ${kept === 1 ? 'type' : 'types'} and left ${String(
            dropped,
          )} out. Tap a dimmed tile above to keep one in.`}
        </Text>
        {/* Rule 29's second half: the alternatives, beside the answer rather than in the form. */}
        <Group gap="xs">
          {ALTERNATIVES.filter((alternative) => alternative.priority !== setup?.priority).map(
            (alternative) => (
              <Button
                key={alternative.priority}
                variant="light"
                size="compact-sm"
                onClick={() => {
                  tryObjective(alternative.priority);
                }}
              >
                {alternative.label}
              </Button>
            ),
          )}
        </Group>
        {/* A container query, not a viewport one: this strip is as often inside the 360 px March
            pane on a 1400 px desktop as it is across a phone, and two columns in 360 px break a
            figure across two lines ("75 870" / "000" — investigation 0011). */}
        <SimpleGrid type="container" cols={{ base: 1, '340px': 2 }} spacing="xs">
          {FIGURES.map((figure) => {
            const all = figure.read(tradeoff.baseline);
            return (
              <Stack key={figure.label} gap={0}>
                <Text span size="xs" c="dimmed">
                  {figure.label}
                </Text>
                <DeltaText
                  value={figure.read(tradeoff.selection)}
                  previous={all}
                  format={amount}
                  betterWhen={figure.betterWhen}
                />
                <Text span size="xs" c="dimmed">
                  {`All types ${amount(all)}`}
                </Text>
              </Stack>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
