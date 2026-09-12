/**
 * A whole-width message about the page, not about one control: a warning the engine raised, a
 * confirmation, an explanation of why a result is empty. Colour is never the only signal — every
 * tone carries its own glyph — and the danger tone is announced as an alert rather than a status.
 */
import type { ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { CheckIcon, CloseIcon, InfoIcon, WarningIcon } from '../icons';
import { cn } from './cn';
import { IconButton } from './IconButton';

const banner = tv({
  slots: {
    root: 'flex items-start gap-3 rounded-card border p-3 sm:p-4',
    glyph: 'mt-0.5 shrink-0',
    title: 'font-sans text-base font-semibold',
    body: 'min-w-0 flex-1 text-sm',
    actions: 'mt-2 flex flex-wrap gap-2',
  },
  variants: {
    tone: {
      info: { root: 'border-info bg-info-soft text-fg', glyph: 'text-info' },
      warn: { root: 'border-warn bg-warn-soft text-fg', glyph: 'text-warn' },
      danger: { root: 'border-danger bg-danger-soft text-fg', glyph: 'text-danger' },
      ok: { root: 'border-ok bg-ok-soft text-fg', glyph: 'text-ok' },
    },
  },
  defaultVariants: { tone: 'info' },
});

const glyphs = {
  info: InfoIcon,
  warn: WarningIcon,
  danger: WarningIcon,
  ok: CheckIcon,
} as const;

export interface BannerProps {
  tone: 'info' | 'warn' | 'danger' | 'ok';
  /** A first line in bold; leave it out for a one-sentence message. */
  title?: string;
  children?: ReactNode;
  /** Buttons that act on the message ("Keep them in", "Undo"). */
  actions?: ReactNode;
  /** When given, a Close button appears and calls this. */
  onDismiss?: () => void;
  className?: string;
}

export function Banner({ tone, title, children, actions, onDismiss, className }: BannerProps) {
  const b = banner({ tone });
  const Glyph = glyphs[tone];
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn(b.root(), className)}>
      <Glyph className={b.glyph()} />
      <div className={b.body()}>
        {title === undefined ? null : <p className={b.title()}>{title}</p>}
        {children}
        {actions === undefined ? null : <div className={b.actions()}>{actions}</div>}
      </div>
      {onDismiss === undefined ? null : (
        <IconButton label="Dismiss" size="sm" onPress={onDismiss}>
          <CloseIcon />
        </IconButton>
      )}
    </div>
  );
}
