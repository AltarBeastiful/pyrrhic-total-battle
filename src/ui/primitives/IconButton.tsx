import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cn } from './cn';
import type { ButtonVariant } from './Button';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Accessible name; also used as the native tooltip. */
  label: string;
  icon: ReactNode;
  variant?: ButtonVariant;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-accent-fg border-transparent hover:opacity-90',
  secondary: 'bg-surface text-fg border-line hover:bg-raised',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-raised hover:text-fg',
  danger: 'bg-transparent text-danger border-transparent hover:bg-raised',
};

/** A square button whose only content is a glyph: the name lives in `label`. */
export function IconButton({
  label,
  icon,
  variant = 'ghost',
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
        'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition-colors sm:h-9 sm:w-9',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
}
