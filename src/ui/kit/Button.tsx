/**
 * The action of the kit. Four voices — `primary` carries the accent and there is at most one on a
 * screen, `secondary` is the ordinary bordered action, `quiet` is plain text on a hover surface
 * (never underlined, never accent-coloured), `danger` is the destructive one.
 *
 * Looks are declared once with `tv()`; state comes from React Aria's data attributes through the
 * `tailwindcss-react-aria-components` variants (`hovered:`, `pressed:`, `disabled:`), never from a
 * ternary that builds a class string.
 */
import type { ReactNode, Ref } from 'react';
import { Button as RACButton, type ButtonProps as RACButtonProps } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { disabledLook, ring, tapTarget } from './styles';

const button = tv({
  base: [
    'inline-flex items-center justify-center gap-2 rounded-control border font-sans font-medium',
    'transition-colors motion-safe:duration-fast',
    'pending:cursor-progress',
    tapTarget,
    ring,
    disabledLook,
  ],
  variants: {
    variant: {
      primary: 'border-transparent bg-accent text-accent-fg hovered:opacity-90 pressed:opacity-80',
      secondary: 'border-field bg-surface text-fg hovered:bg-raised pressed:bg-sunken',
      quiet: 'border-transparent bg-transparent text-fg hovered:bg-raised pressed:bg-sunken',
      danger: 'border-transparent bg-danger text-danger-fg hovered:opacity-90 pressed:opacity-80',
    },
    size: {
      sm: 'px-3 text-sm',
      md: 'px-4 text-base',
      lg: 'px-5 text-lg min-h-12 sm:min-h-11',
    },
    fullWidth: {
      true: 'w-full',
      false: '',
    },
  },
  defaultVariants: { variant: 'secondary', size: 'md', fullWidth: false },
});

/** The only moving glyph in the kit: a ring that spins while something is running. */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'rounded-chip inline-block size-4 shrink-0 border-2 border-current border-t-transparent',
        'motion-safe:animate-spin',
        className,
      )}
    />
  );
}

export interface ButtonProps extends Omit<RACButtonProps, 'className' | 'children'> {
  /** Which voice the action speaks in. */
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Glyph before the label; decorative, the label carries the meaning. */
  icon?: ReactNode;
  /** Glyph after the label (a chevron on a menu trigger, for instance). */
  iconRight?: ReactNode;
  fullWidth?: boolean;
  /** Swaps the leading glyph for a spinner and tells assistive tech the action is running. */
  isPending?: boolean;
  className?: string;
  children?: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  isPending = false,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <RACButton
      {...rest}
      isPending={isPending}
      className={cn(button({ variant, size, fullWidth }), className)}
    >
      {isPending ? <Spinner /> : icon}
      {children}
      {iconRight}
    </RACButton>
  );
}
