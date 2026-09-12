import type { HTMLAttributes } from 'react';

import { cn } from './cn';

export type CardTone = 'surface' | 'raised' | 'sunken' | 'accent' | 'info' | 'warn' | 'danger';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  /**
   * Which surface the card sits on. `surface` is the default panel; `raised` is a block *inside* a
   * panel; `sunken` is a well (a read-only figure, a preview); the coloured tones call out a state.
   */
  tone?: CardTone;
  /** Lift it off the page — for anything that floats above the rest of the section. */
  elevated?: boolean;
}

const TONES: Record<CardTone, string> = {
  surface: 'border-line bg-surface',
  raised: 'border-line bg-raised',
  sunken: 'border-line bg-sunken',
  accent: 'border-accent-line bg-accent-soft',
  info: 'border-info/40 bg-info-soft',
  warn: 'border-warn/40 bg-warn-soft',
  danger: 'border-danger/40 bg-danger-soft',
};

/** The one surface every panel sits on. */
export function Card({
  padded = true,
  tone = 'surface',
  elevated = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border',
        TONES[tone],
        elevated ? 'shadow-pop' : 'shadow-card',
        padded && 'p-3 sm:p-4',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
