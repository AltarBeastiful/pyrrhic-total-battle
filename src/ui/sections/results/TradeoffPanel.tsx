/**
 * Compared with all types (design plan §7.5 step 4, PLAN §3.6).
 *
 * A priority search wins by leaving unit types at home, and the winning number is the only one it
 * reports — so every other figure moved without anyone saying so. This strip puts each figure of the
 * selection next to the army you would have marched with every type in it, and says which way it
 * moved. Putting a dropped type back is done on its tile above, where its cost is visible.
 */
import { Card } from '@/ui/kit';
import { DeltaText } from '@/ui/domain';
import { Grid, Stack } from '@/ui/layout';

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
  {
    label: 'Damage if the monster strikes first',
    read: (figures) => figures.minDamage,
    betterWhen: 'higher',
  },
  { label: 'Damage if you strike first', read: (figures) => figures.maxDamage, betterWhen: 'higher' },
  { label: 'Expected damage', read: (figures) => figures.avgDamage, betterWhen: 'higher' },
  { label: 'Retrain silver', read: (figures) => figures.silver, betterWhen: 'lower' },
  { label: 'Revive gold', read: (figures) => figures.gold, betterWhen: 'lower' },
  { label: 'Dragon coins', read: (figures) => figures.dragonCoins, betterWhen: 'lower' },
];

export interface TradeoffPanelProps {
  tradeoff: SearchTradeoff;
}

export function TradeoffPanel({ tradeoff }: TradeoffPanelProps) {
  const kept = tradeoff.includedUnitIds.length;
  const dropped = tradeoff.excludedUnitIds.length;

  return (
    <Card tone="raised" padding="sm">
      <Stack gap={2}>
        <h3 className="text-lg">Compared with all types</h3>
        <p className="text-muted text-sm">
          {`The priority kept ${String(kept)} unit ${kept === 1 ? 'type' : 'types'} and left ${String(
            dropped,
          )} out. Tap a dimmed tile above to keep one in.`}
        </p>
        <Grid cols={{ base: 1, sm: 2 }} gap={2}>
          {FIGURES.map((figure) => {
            const mine = figure.read(tradeoff.selection);
            const all = figure.read(tradeoff.baseline);
            return (
              <Stack key={figure.label} gap={1}>
                <span className="text-muted text-sm">{figure.label}</span>
                <DeltaText
                  value={mine}
                  previous={all}
                  format={amount}
                  betterWhen={figure.betterWhen}
                  className="nums text-base"
                />
                <span className="text-muted text-sm">{`All types ${amount(all)}`}</span>
              </Stack>
            );
          })}
        </Grid>
      </Stack>
    </Card>
  );
}
