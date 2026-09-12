/**
 * A button whose whole content is a glyph. The `label` prop is required by the type: a control with
 * no visible text has no accessible name unless one is given, and the tests select by that name.
 */
import type { ReactNode, Ref } from 'react';
import { Button as RACButton, type ButtonProps as RACButtonProps } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { disabledLook, ring, stateLayer } from './styles';

const iconButton = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center rounded-control',
    'transition-colors motion-safe:duration-fast',
    stateLayer,
    ring,
    disabledLook,
  ],
  variants: {
    variant: {
      quiet: 'text-fg bg-transparent',
      secondary: 'border-field/60 text-fg border bg-transparent',
    },
    size: {
      sm: 'min-h-11 min-w-11 text-sm sm:min-h-8 sm:min-w-8',
      md: 'min-h-11 min-w-11 text-base sm:min-h-10 sm:min-w-10',
    },
  },
  defaultVariants: { variant: 'quiet', size: 'md' },
});

export interface IconButtonProps extends Omit<RACButtonProps, 'className' | 'children' | 'aria-label'> {
  /** The accessible name. Required: the glyph alone says nothing to a screen reader. */
  label: string;
  size?: 'sm' | 'md';
  variant?: 'quiet' | 'secondary';
  /** The glyph. */
  children: ReactNode;
  className?: string;
  ref?: Ref<HTMLButtonElement>;
}

export function IconButton({
  label,
  size = 'md',
  variant = 'quiet',
  className,
  children,
  ...rest
}: IconButtonProps) {
  return (
    <RACButton {...rest} aria-label={label} className={cn(iconButton({ variant, size }), className)}>
      {children}
    </RACButton>
  );
}
