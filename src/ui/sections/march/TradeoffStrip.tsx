/**
 * Compared with all types (design plan §7.5 step 4, PLAN §3.6, design rule 29).
 *
 * A priority search wins by leaving unit types at home, and the winning number is the only one it
 * reports — so every other figure moved without anyone saying so. This strip puts each figure of
 * the winning selection next to the army you would have marched with every type in it. Putting a
 * dropped type back is done on its tile above, where its cost is visible.
 */
import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';

import { DeltaText } from '@/ui/domain2';

import { amount } from './format';
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

export interface TradeoffStripProps {
  tradeoff: SearchTradeoff;
}

export function TradeoffStrip({ tradeoff }: TradeoffStripProps) {
  const kept = tradeoff.includedUnitIds.length;
  const dropped = tradeoff.excludedUnitIds.length;

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
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
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
