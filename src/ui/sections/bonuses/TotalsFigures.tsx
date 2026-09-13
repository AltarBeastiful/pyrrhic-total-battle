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
  /**
   * `md` heads the card, four across; `sm` repeats it inside an editor, two across, where it is a
   * reminder beside the field being typed in rather than the card's own answer. The figures
   * themselves are the same size in both — there is one figure style (`kit/Figures`).
   */
  size?: 'sm' | 'md';
}

export function TotalsFigures({ summary, size = 'md' }: TotalsFiguresProps) {
  return (
    <Box className={classes.totals}>
      {/* Four figures in the one style the whole page uses now (the owner's review of 2026-09-13:
          "the percentages could just be numbers with minimal text"): the label 12 px muted over the
          number, the number 15/600 tabular with its unit glued to it — "+312 %", never "Health
          bonus +312 %". The 22 px figure the artboard drew here is gone with it: this card's
          TOTAL is not louder than the March's, it is the same object on another card. */}
      <Figures
        label="Army bonus totals"
        layout="grid"
        columns={size === 'md' ? 4 : 2}
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
