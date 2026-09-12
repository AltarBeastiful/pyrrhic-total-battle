/**
 * The one panel shape: 12 px corners, a hairline edge and a flat surface. `tone` moves it up or
 * down the neutral stack, or tints it when the panel itself carries a meaning (an accent summary,
 * an informational aside). Nothing else in the kit draws a box.
 */
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

import { cn } from './cn';

const card = tv({
  base: 'rounded-card border',
  variants: {
    tone: {
      surface: 'border-line bg-surface text-fg',
      raised: 'border-line bg-raised text-fg shadow-card',
      sunken: 'border-line bg-sunken text-fg',
      accent: 'border-accent-line bg-accent-soft text-fg',
      info: 'border-info bg-info-soft text-fg',
      warn: 'border-warn bg-warn-soft text-fg',
      danger: 'border-danger bg-danger-soft text-fg',
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
