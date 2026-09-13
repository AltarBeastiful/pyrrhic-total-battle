/**
 * The TOTAL, as the card's header carries it and as every editor repeats it (design plan §7.3):
 * four labelled figures side by side — what the whole army gains in health, in strength and in
 * double damage, then how many sources are feeding them.
 *
 * `Figures` is the kit's block of read-only pairs, on Mantine's `DataList`, so the pairing is in the
 * markup (`<dl>`/`<dt>`/`<dd>`) rather than in a grid of divs, and every value is tabular so the
 * three of them move without the line reflowing.
 *
 * A source switched on with nothing typed in it is the one thing that silently makes a march wrong,
 * so the header counts those out loud in a badge instead of hiding them behind the fold.
 */
import { Box } from '@mantine/core';

import { Figures } from '@/ui/kit';

import classes from './bonuses.module.css';
import { formatPercent } from './labels';
import type { TotalsSummary } from './rows';

export interface TotalsFiguresProps {
  summary: TotalsSummary;
  /** `md` heads the card; `sm` repeats it inside an editor, where it is a reminder, not a title. */
  size?: 'sm' | 'md';
}

export function TotalsFigures({ summary, size = 'md' }: TotalsFiguresProps) {
  return (
    <Box className={classes.totals}>
      <Figures
        label="Army bonus totals"
        orientation="vertical"
        size={size === 'md' ? 'xs' : size}
        // The card's TOTAL is four columns of "label over figure", the figure at 22 px and 600
        // (design plan §5.5, artboard `.figs`); an editor repeats it small, as a reminder.
        {...(size === 'md' ? { valueFz: '1.375rem', valueFw: 600 } : {})}
        items={[
          { key: 'health', label: 'Health', value: formatPercent(summary.health) },
          { key: 'strength', label: 'Strength', value: formatPercent(summary.strength) },
          { key: 'special', label: 'Special', value: formatPercent(summary.special) },
          { key: 'on', label: 'Sources on', value: String(summary.on) },
        ]}
      />
    </Box>
  );
}
