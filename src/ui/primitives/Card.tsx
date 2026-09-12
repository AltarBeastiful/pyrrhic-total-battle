import type { HTMLAttributes } from 'react';

import { cn } from './cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

/** The one surface every panel sits on. */
export function Card({ padded = true, className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn('border-line bg-surface rounded-xl border', padded && 'p-3 sm:p-4', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
