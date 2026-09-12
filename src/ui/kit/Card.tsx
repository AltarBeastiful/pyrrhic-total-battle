/**
 * The one panel shape: Material 3's **filled** card — 12 px corners (the medium shape), one tonal
 * step away from the surface under it, no outline and no shadow. `tone` moves it up or down the
 * neutral stack, or tints it when the panel itself carries a meaning (an accent summary, an
 * informational aside). Elevation is reserved for what floats: menus, popovers, sheets, dialogs.
 * Nothing else in the kit draws a box.
 */
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { cn } from './cn';

const card = tv({
  base: 'rounded-card',
  variants: {
    tone: {
      surface: 'bg-surface text-fg',
      raised: 'bg-raised text-fg',
      sunken: 'bg-sunken text-fg',
      accent: 'bg-accent-soft text-fg',
      info: 'bg-info-soft text-fg',
      warn: 'bg-warn-soft text-fg',
      danger: 'bg-danger-soft text-fg',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4 sm:p-5',
    },
  },
  defaultVariants: { tone: 'surface', padding: 'md' },
});

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {
  tone?: 'surface' | 'raised' | 'sunken' | 'accent' | 'info' | 'warn' | 'danger';
  padding?: 'none' | 'sm' | 'md';
  /** The element to render; pick the one that says what the panel is in the document outline. */
  as?: 'div' | 'section' | 'article';
  className?: string;
  children?: ReactNode;
}

export function Card({
  tone = 'surface',
  padding = 'md',
  as = 'div',
  className,
  children,
  ...rest
}: CardProps) {
  const Tag: ElementType = as;
  return (
    <Tag {...rest} className={cn(card({ tone, padding }), className)}>
      {children}
    </Tag>
  );
}
