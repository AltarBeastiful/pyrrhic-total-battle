/**
 * The first thing in the March card (design plan §7.5, amended): the six figures a player compares
 * marches by, each with the way it moved since the previous run.
 *
 * The expected damage is the one figure the eye should land on, so it is the only one set at the
 * stat size; the rest share one line and wrap. Nothing here is a control — this is the answer.
 */
import type { BattleSummary } from '@/engine/types';
import { DeltaText } from '@/ui/domain';
import { Cluster, Stack } from '@/ui/layout';

import { amount, ratio } from './format';

interface FigureProps {
  label: string;
  value: number;
  /** The same figure in the previous run; without it the value stands alone. */
  previous: number | undefined;
  format: (value: number) => string;
  betterWhen: 'higher' | 'lower';
  /** The expected damage is the headline; everything else is body size. */
  headline?: boolean;
}

function Figure({ label, value, previous, format, betterWhen, headline = false }: FigureProps) {
  const figure = (
    <DeltaText
      value={value}
      {...(previous === undefined ? {} : { previous })}
      format={format}
      betterWhen={betterWhen}
      className={headline ? 'text-hero hero-face' : 'nums text-base'}
    />
  );

  // The headline is the one thing on the page set in the display face, and its name is a caption
  // under it rather than a label over it (D-19): the figure is what you came for, the word explains
  // it afterwards. Every other figure keeps its label first, because they are read as a list.
  return headline ? (
    <Stack gap={1} className="min-w-0">
      {figure}
      <span className="text-muted text-sm">{label}</span>
    </Stack>
  ) : (
    <Stack gap={1} className="min-w-0">
      <span className="text-muted text-sm">{label}</span>
      {figure}
    </Stack>
  );
}

export interface RecapProps {
  summary: BattleSummary;
  /** The run before this one, when there was one. */
  previous?: BattleSummary | undefined;
}

export function Recap({ summary, previous }: RecapProps) {
  const hits = summary.journals.enemyFirst.friendlyHits;
  const was = <T,>(pick: (value: BattleSummary) => T): T | undefined =>
    previous === undefined ? undefined : pick(previous);

  return (
    <Stack gap={4} aria-label="This march in figures">
      <Figure
        headline
        label="Expected damage"
        value={summary.avgDamage}
        previous={was((value) => value.avgDamage)}
        format={amount}
        betterWhen="higher"
      />
      <Cluster gap={4} align="start">
        <Figure
          label="Damage if the monster strikes first"
          value={summary.minDamage}
          previous={was((value) => value.minDamage)}
          format={amount}
          betterWhen="higher"
        />
        <Figure
          label="Hits landed"
          value={hits}
          previous={was((value) => value.journals.enemyFirst.friendlyHits)}
          format={amount}
          betterWhen="higher"
        />
        <Figure
          label="Silver to recover"
          value={summary.recovery.silver}
          previous={was((value) => value.recovery.silver)}
          format={amount}
          betterWhen="lower"
        />
        <Figure
          label="Gold to recover"
          value={summary.recovery.gold}
          previous={was((value) => value.recovery.gold)}
          format={amount}
          betterWhen="lower"
        />
        <Figure
          label="Value per silver"
          value={summary.damagePerSilver}
          previous={was((value) => value.damagePerSilver)}
          format={ratio}
          betterWhen="higher"
        />
      </Cluster>
    </Stack>
  );
}
