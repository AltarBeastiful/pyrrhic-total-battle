/**
 * A number and how it moved since the last run (design plan §7.5): "12 480 (+4 %)". The change is
 * muted, sits in `ok` or `danger` ink, and always carries an arrow and a sign — colour is never the
 * only thing saying whether the march got better. `betterWhen` is what makes "lower" green for a
 * cost and red for damage.
 */
import { tv } from 'tailwind-variants';

import { ChevronDownIcon, ChevronUpIcon } from '../icons';
import { cn } from '../kit/cn';

const PERCENT = ' %'; // narrow no-break space, the typographic rule for a unit.
const MINUS = '−';

const wrapper = tv({
  base: 'inline-flex items-baseline gap-1.5',
});

const delta = tv({
  base: 'inline-flex items-baseline gap-0.5 text-sm tabular-nums',
  variants: {
    tone: {
      better: 'text-ok',
      worse: 'text-danger',
      same: 'text-muted',
    },
  },
  defaultVariants: { tone: 'same' },
});

export interface DeltaTextProps {
  value: number;
  /** The same number in the previous run. Without it, only the value is drawn. */
  previous?: number;
  format: (n: number) => string;
  /** Which direction counts as an improvement. */
  betterWhen: 'higher' | 'lower';
  className?: string;
}

export function DeltaText({ value, previous, format, betterWhen, className }: DeltaTextProps) {
  const change =
    previous === undefined || previous === 0 ? undefined : ((value - previous) / Math.abs(previous)) * 100;

  if (change === undefined) {
    return <span className={cn(wrapper(), className)}>{format(value)}</span>;
  }

  const rounded = Math.round(change);
  const up = change > 0;
  const tone = change === 0 ? 'same' : (betterWhen === 'higher') === up ? 'better' : 'worse';
  const sign = change === 0 ? '' : up ? '+' : MINUS;
  const Arrow = up ? ChevronUpIcon : ChevronDownIcon;

  return (
    <span className={cn(wrapper(), className)}>
      <span>{format(value)}</span>
      <span className={delta({ tone })}>
        {change !== 0 && <Arrow aria-hidden="true" className="h-3 w-3 self-center" />}
        <span>{`(${sign}${Math.abs(rounded)}${PERCENT})`}</span>
        {tone !== 'same' && <span className="sr-only">{tone}</span>}
      </span>
    </span>
  );
}
