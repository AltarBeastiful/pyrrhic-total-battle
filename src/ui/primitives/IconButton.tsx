import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';
import type { ButtonVariant } from './Button';

export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name; also used as the native tooltip. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
  /** `sm` for a glyph that rides inside a heading or a dense row; `md` everywhere else. */
  size?: IconButtonSize;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg border-accent hover:brightness-110',
  secondary: 'bg-surface text-fg border-field hover:bg-raised',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-raised hover:text-accent',
  danger: 'bg-transparent text-danger border-transparent hover:bg-danger-soft',
};

const SIZES: Record<IconButtonSize, string> = {
  sm: 'h-8 w-8 sm:h-7 sm:w-7 text-sm',
  md: 'h-11 w-11 sm:h-9 sm:w-9',
};

/** A square button whose only content is a glyph: the name lives in `label`. */
export function IconButton({
  label,
  icon,
  variant = 'ghost',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-lg border transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
