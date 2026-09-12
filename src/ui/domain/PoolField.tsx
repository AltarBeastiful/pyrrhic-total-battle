/**
 * A housing pool at rest: its glyph, its name, "used / total" in tabular figures, and a hairline
 * bar that shows how full it is (design plan §7.4). Read-only — the pool's *limit* is edited with a
 * `NumberStepper`; this is what the march did with it.
 */
import { tv } from 'tailwind-variants';

import type { Pool } from '../../data/types';
import { AuthorityIcon, DominanceIcon, LeadershipIcon } from '../icons';
import { cn } from '../kit/cn';

const NUMBER = new Intl.NumberFormat('en-US');

const POOL_LABEL: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

const POOL_GLYPH = {
  leadership: LeadershipIcon,
  authority: AuthorityIcon,
  dominance: DominanceIcon,
} as const;

const field = tv({
  base: 'flex min-w-0 flex-col gap-1',
});

const value = tv({
  base: 'text-base leading-none font-medium tabular-nums',
  variants: { over: { true: 'text-danger', false: 'text-fg' } },
  defaultVariants: { over: false },
});

const track = tv({
  base: 'rounded-chip bg-sunken h-1 w-full overflow-hidden',
});

const fill = tv({
  base: 'rounded-chip block h-full',
  variants: { over: { true: 'bg-danger', false: 'bg-accent' } },
  defaultVariants: { over: false },
});

export interface PoolFieldProps {
  pool: Pool;
  used: number;
  total: number;
  className?: string;
}

export function PoolField({ pool, used, total, className }: PoolFieldProps) {
  const Glyph = POOL_GLYPH[pool];
  const label = POOL_LABEL[pool];
  const over = used > total;
  const ratio = total > 0 ? used / total : 0;
  const percent = Math.min(100, Math.max(0, Math.round(ratio * 1000) / 10));
  const text = `${NUMBER.format(used)} / ${NUMBER.format(total)}`;

  return (
    <div className={cn(field(), className)}>
      <span className="text-muted flex items-center gap-1.5 text-sm">
        <Glyph aria-hidden="true" className="h-4 w-4 shrink-0" />
        {label}
      </span>
      <span className={value({ over })}>{text}</span>
      <div
        role="meter"
        aria-label={`${label} used`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={used}
        aria-valuetext={text}
        className={track()}
      >
        <span className={fill({ over })} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
