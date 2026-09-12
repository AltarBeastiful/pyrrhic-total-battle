import type { ReactNode } from 'react';

import { InfoIcon, WarningIcon } from '../icons';
import { cn } from './cn';

export type HelpTone = 'info' | 'warn' | 'danger';

export interface HelpNoteProps {
  children: ReactNode;
  tone?: HelpTone;
  /** Replace the tone's glyph; pass `null` for a note with no glyph at all. */
  icon?: ReactNode | null;
  className?: string;
}

const TONES: Record<HelpTone, string> = {
  info: 'border-line bg-raised text-muted',
  warn: 'border-warn/50 bg-warn-soft text-fg',
  danger: 'border-danger/50 bg-danger-soft text-fg',
};

const MARKS: Record<HelpTone, string> = {
  info: 'text-info',
  warn: 'text-warn',
  danger: 'text-danger',
};

const GLYPHS: Record<HelpTone, ReactNode> = {
  info: <InfoIcon />,
  warn: <WarningIcon />,
  danger: <WarningIcon />,
};

/**
 * A short explanatory note: where to find a value in game, why a field is disabled, a warning.
 * The glyph repeats the tone so the note is not colour alone, and it is decorative — the sentence
 * carries everything a screen reader needs.
 */
export function HelpNote({ children, tone = 'info', icon, className }: HelpNoteProps) {
  const mark = icon === undefined ? GLYPHS[tone] : icon;
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed',
        TONES[tone],
        className,
      )}
    >
      {mark !== null && (
        <span aria-hidden="true" className={cn('mt-px shrink-0', MARKS[tone])}>
          {mark}
        </span>
      )}
      <span className="min-w-0">{children}</span>
    </div>
  );
}
