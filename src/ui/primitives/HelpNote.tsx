import type { ReactNode } from 'react';

import { cn } from './cn';

export type HelpTone = 'info' | 'warn' | 'danger';

export interface HelpNoteProps {
  children: ReactNode;
  tone?: HelpTone;
  className?: string;
}

const TONES: Record<HelpTone, string> = {
  info: 'border-line bg-raised text-muted',
  warn: 'border-warn/40 bg-warn/10 text-fg',
  danger: 'border-danger/40 bg-danger/10 text-fg',
};

/** A short explanatory note: where to find a value in game, why a field is disabled, a warning. */
export function HelpNote({ children, tone = 'info', className }: HelpNoteProps) {
  return (
    <p className={cn('rounded-lg border px-3 py-2 text-xs leading-relaxed', TONES[tone], className)}>
      {children}
    </p>
  );
}
