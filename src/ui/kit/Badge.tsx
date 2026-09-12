/**
 * A short, non-interactive mark: a count, a tier, a state word. Semantic tones say what something
 * *is*; the five group tones identify a troop group and are never used for a state — the design
 * plan keeps those two colour systems apart on purpose.
 */
import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { cn } from './cn';

const badge = tv({
  base: 'inline-flex shrink-0 items-center gap-1 rounded-chip border font-sans font-medium whitespace-nowrap tabular-nums',
  variants: {
    tone: {
      neutral: 'border-line bg-raised text-fg',
      accent: 'border-accent-line bg-accent-soft text-accent',
      info: 'border-info bg-info-soft text-info',
      ok: 'border-ok bg-ok-soft text-ok',
      warn: 'border-warn bg-warn-soft text-warn',
      danger: 'border-danger bg-danger-soft text-danger',
      guardsmen: 'border-group-guardsmen-edge bg-group-guardsmen-soft text-group-guardsmen-strong',
      specialists: 'border-group-specialists-edge bg-group-specialists-soft text-group-specialists-strong',
      engineers: 'border-group-engineers-edge bg-group-engineers-soft text-group-engineers-strong',
      monsters: 'border-group-monsters-edge bg-group-monsters-soft text-group-monsters-strong',
      mercenaries: 'border-group-mercenaries-edge bg-group-mercenaries-soft text-group-mercenaries-strong',
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
