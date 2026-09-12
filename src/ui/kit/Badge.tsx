/**
 * A short, non-interactive mark: a count, a tier, a state word. Semantic tones say what something
 * *is*; the five group tones identify a troop group and are never used for a state — the design
 * plan keeps those two colour systems apart on purpose.
 *
 * A badge is a tonal fill and nothing else: the outline it used to carry made every count on the
 * page read as a control you could press.
 */
import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { cn } from './cn';

const badge = tv({
  base: 'inline-flex shrink-0 items-center gap-1 rounded-chip font-sans font-medium whitespace-nowrap tabular-nums',
  variants: {
    tone: {
      neutral: 'bg-raised text-fg',
      accent: 'bg-accent text-accent-fg',
      info: 'bg-info-soft text-info',
      ok: 'bg-ok-soft text-ok',
      warn: 'bg-warn-soft text-warn',
      danger: 'bg-danger-soft text-danger',
      guardsmen: 'bg-group-guardsmen-soft text-group-guardsmen-strong',
      specialists: 'bg-group-specialists-soft text-group-specialists-strong',
      engineers: 'bg-group-engineers-soft text-group-engineers-strong',
      monsters: 'bg-group-monsters-soft text-group-monsters-strong',
      mercenaries: 'bg-group-mercenaries-soft text-group-mercenaries-strong',
    },
    size: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2.5 py-1 text-sm',
    },
  },
  defaultVariants: { tone: 'neutral', size: 'sm' },
});

/** The unit groups that own a colour of their own. */
export type BadgeGroupTone = 'guardsmen' | 'specialists' | 'engineers' | 'monsters' | 'mercenaries';

export interface BadgeProps {
  tone?: 'neutral' | 'accent' | 'info' | 'ok' | 'warn' | 'danger' | BadgeGroupTone;
  size?: 'sm' | 'md';
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', size = 'sm', className, children }: BadgeProps) {
  return <span className={cn(badge({ tone, size }), className)}>{children}</span>;
}
