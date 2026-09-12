/**
 * The action of the kit. Four voices — `primary` carries the accent and there is at most one on a
 * screen, `secondary` is Material 3's outlined button (one hairline, no fill), `quiet` is the text
 * button (no hairline, no fill), `danger` is the destructive one.
 *
 * Hover, press and keyboard focus are Material 3 **state layers** rather than a second colour per
 * variant: 8 % of the on-colour on hover, 10 % on press and on focus. Over a neutral ground that is
 * a tint of `fg`; over the accent and the danger fills it is an `::after` in the on-colour, because
 * a tint of the foreground would be invisible there.
 *
 * Looks are declared once with `tv()`; state comes from React Aria's data attributes through the
 * `tailwindcss-react-aria-components` variants (`hover:`, `pressed:`, `disabled:` — the plugin maps
 * `hover:` and `focus:` onto React Aria's `data-hovered`/`data-focused`), never from a
 * ternary that builds a class string.
 */
import type { ReactNode, Ref } from 'react';
import { Button as RACButton, type ButtonProps as RACButtonProps } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { controlHeight, disabledLook, ring, stateLayer, stateLayerOn } from './styles';

/** The state layer an accent- or danger-filled button wears, clipped to the control radius. */
const filledLayer = cn(stateLayerOn, 'after:rounded-control');

const button = tv({
  base: [
    'inline-flex items-center justify-center gap-2 rounded-control font-sans font-medium',
    'transition-colors motion-safe:duration-fast',
    'pending:cursor-progress',
    controlHeight,
    ring,
    disabledLook,
  ],
  variants: {
    variant: {
      primary: cn('bg-accent text-accent-fg', filledLayer),
      secondary: cn('border-field/60 text-fg border bg-transparent', stateLayer),
      quiet: cn('text-fg bg-transparent', stateLayer),
      danger: cn('bg-danger text-danger-fg', filledLayer),
    },
    size: {
      sm: 'px-3 text-sm min-h-10 sm:min-h-9',
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
