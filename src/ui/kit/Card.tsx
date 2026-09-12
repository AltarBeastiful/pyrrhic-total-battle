/**
 * A panel. Two shapes since the design-direction pass (D-19): `card`, Material 3's filled card at
 * the medium shape, which only the **answer** wears — and `flat`, a square block of the continuous
 * setup sheet, told from the block above it by a hairline and by space rather than by a box of its
 * own. `tone` moves the panel up or down the neutral stack, or tints it when the panel itself
 * carries a meaning; `none` leaves the ground to the sheet around it.
 *
 * Elevation is for what floats — the March card, menus, popovers, sheets, dialogs. Nothing else in
 * the kit draws a box.
 */
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { cn } from './cn';

const card = tv({
  base: '',
  variants: {
    tone: {
      surface: 'bg-surface text-fg',
      raised: 'bg-raised text-fg',
      sunken: 'bg-sunken text-fg',
      accent: 'bg-accent-soft text-fg',
      info: 'bg-info-soft text-fg',
      warn: 'bg-warn-soft text-fg',
      danger: 'bg-danger-soft text-fg',
      /** No ground of its own: a block of the setup sheet, which carries the surface for all of them. */
      none: 'text-fg',
    },
    shape: {
      /** Material 3's medium shape. The March card is the one panel on the page that wears it. */
      card: 'rounded-card',
      /** Square: the panel is part of a continuous sheet, not an object floating on the page. */
      flat: 'rounded-none',
    },
    elevation: {
      none: '',
      /** Reserved for the answer; everything else separates by tone and by a hairline (D-19). */
      card: 'shadow-card',
    },
    padding: {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4 sm:p-5',
    },
  },
  defaultVariants: { tone: 'surface', shape: 'card', elevation: 'none', padding: 'md' },
});

export interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {
  tone?: 'surface' | 'raised' | 'sunken' | 'accent' | 'info' | 'warn' | 'danger' | 'none';
  /** `card` for the one panel that floats, `flat` for a block of the continuous setup sheet. */
  shape?: 'card' | 'flat';
  /** Only the March card is elevated; the setup separates by tone and hairline. */
  elevation?: 'none' | 'card';
  padding?: 'none' | 'sm' | 'md';
  /** The element to render; pick the one that says what the panel is in the document outline. */
  as?: 'div' | 'section' | 'article';
  className?: string;
  children?: ReactNode;
}

export function Card({
  tone = 'surface',
  shape = 'card',
  elevation = 'none',
  padding = 'md',
  as = 'div',
  className,
  children,
  ...rest
}: CardProps) {
  const Tag: ElementType = as;
  return (
    <Tag {...rest} className={cn(card({ tone, shape, elevation, padding }), className)}>
      {children}
    </Tag>
  );
}
