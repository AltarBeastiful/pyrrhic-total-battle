/**
 * A number and how it moved since the last run (design plan §7.5): "12 480 (+4 %)". The change is
 * small, sits in the ok or danger ink, and always carries an arrow and a sign — colour is never the
 * only thing saying whether the march got better. `betterWhen` is what makes "lower" good for a cost
 * and bad for damage.
 */
import { Group, Text } from '@mantine/core';
import { ChevronDown, ChevronUp } from 'lucide-react';

const PERCENT = ' %'; // narrow no-break space, the typographic rule for a unit
const MINUS = '−';

export interface DeltaTextProps {
  value: number;
  /** The same number in the previous run. Without it, only the value is drawn. */
  previous?: number;
  format: (n: number) => string;
  /** Which direction counts as an improvement. */
  betterWhen: 'higher' | 'lower';
  size?: 'xs' | 'sm' | 'md';
}

export function DeltaText({ value, previous, format, betterWhen, size = 'sm' }: DeltaTextProps) {
  const change =
    previous === undefined || previous === 0 ? undefined : ((value - previous) / Math.abs(previous)) * 100;

  if (change === undefined) {
    return (
      <Text span size={size}>
        {format(value)}
      </Text>
    );
  }

  const up = change > 0;
  const tone = change === 0 ? 'same' : (betterWhen === 'higher') === up ? 'better' : 'worse';
  const sign = change === 0 ? '' : up ? '+' : MINUS;
  const Arrow = up ? ChevronUp : ChevronDown;

  return (
    <Group gap={4} wrap="nowrap" component="span" align="baseline">
      <Text span size={size}>
        {format(value)}
      </Text>
      {/* Only destruction keeps a hue (docs/design.md §1): a green `ok` would collide with the
          guardsmen, so an improvement is said by the arrow and the word and nothing else. */}
      <Text span size="xs" {...(tone === 'worse' ? { c: 'red' as const } : { c: 'dimmed' as const })}>
        {change !== 0 && <Arrow size={12} aria-hidden style={{ verticalAlign: '-0.1em' }} />}
        {`(${sign}${Math.abs(Math.round(change))}${PERCENT})`}
        {tone !== 'same' && <span> {tone}</span>}
      </Text>
    </Group>
  );
}
