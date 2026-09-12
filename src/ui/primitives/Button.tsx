import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading glyph; purely decorative, the label carries the meaning. */
  icon?: ReactNode;
  /** Trailing glyph (a chevron on a disclosure, an arrow on a "next"). Decorative too. */
  iconRight?: ReactNode;
  /** Stretch to the width of the row — the sticky Generate button on a phone. */
  fullWidth?: boolean;
}

/**
 * Four intents, and only four: `primary` is the bronze accent and there is at most one per view,
 * `secondary` is the default outlined button, `ghost` sits inside a dense row, `danger` destroys
 * something. Every one of them keeps the 44 px touch row on a phone (`tap`).
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg border-accent shadow-card hover:brightness-110 active:brightness-95',
  secondary: 'bg-surface text-fg border-field hover:bg-raised hover:border-accent-line',
  ghost:
    'bg-transparent text-accent border-transparent underline decoration-accent/40 underline-offset-4 hover:bg-raised hover:decoration-accent',
  danger: 'bg-danger text-danger-fg border-danger shadow-card hover:brightness-110 active:brightness-95',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3 py-1.5 text-sm gap-2',
  lg: 'px-4 py-2.5 text-base gap-2',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'tap inline-flex items-center justify-center rounded-lg border font-medium transition-[background-color,border-color,filter,box-shadow]',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {iconRight}
    </button>
  );
}
