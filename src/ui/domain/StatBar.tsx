/**
 * One statistic of the unit sheet (design plan §7.6 step 4): the base value and the value with every
 * bonus applied, as two bars on the same scale so the gap between them *is* the bonus. The numbers
 * stay visible — a bar alone is a shape, not a figure.
 */
import { tv } from 'tailwind-variants';

import { cn } from '../kit/cn';

const block = tv({
  base: 'flex min-w-0 flex-col gap-1.5',
});

const row = tv({
  base: 'flex min-w-0 items-center gap-2 text-sm',
});

const track = tv({
  base: 'rounded-chip bg-sunken h-2 min-w-0 flex-1 overflow-hidden',
});

const fill = tv({
  base: 'rounded-chip block h-full',
  variants: { kind: { base: 'bg-line', boosted: 'bg-accent' } },
  defaultVariants: { kind: 'base' },
});

export interface StatBarProps {
  label: string;
  base: number;
  boosted: number;
  format: (n: number) => string;
  className?: string;
}

export function StatBar({ label, base, boosted, format, className }: StatBarProps) {
  const max = Math.max(base, boosted, 1);
  const bars = [
    { kind: 'base' as const, name: 'Base', amount: base },
    { kind: 'boosted' as const, name: 'With bonuses', amount: boosted },
  ];

  return (
    <div className={cn(block(), className)}>
      <span className="text-muted text-sm">{label}</span>
      {bars.map((bar) => (
        <div key={bar.kind} className={row()}>
          <span className="text-muted w-24 shrink-0 truncate">{bar.name}</span>
          <div
            role="meter"
            aria-label={`${label}, ${bar.name.toLowerCase()}`}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={bar.amount}
            aria-valuetext={format(bar.amount)}
            className={track()}
          >
            <span
              className={fill({ kind: bar.kind })}
              style={{ width: `${Math.min(100, Math.max(0, (bar.amount / max) * 100))}%` }}
            />
          </div>
          <span className="w-20 shrink-0 text-right font-medium tabular-nums">{format(bar.amount)}</span>
        </div>
      ))}
    </div>
  );
}
