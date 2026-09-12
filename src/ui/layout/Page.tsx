import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

/**
 * The page frame: side gutters that grow once there is room, a measure that stops the app from
 * stretching across a wide monitor, and bottom padding deep enough that the floating Generate
 * button never covers the last row of content.
 */
const page = tv({
  base: 'mx-auto w-full max-w-7xl px-4 pb-24 sm:px-6',
});

export interface PageProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  children?: ReactNode;
}

/** Gutters, measure and floating-button clearance — the outermost box of a screen. */
export function Page({ as: Tag = 'div', className, children, ...rest }: PageProps) {
  return (
    <Tag className={page({ className })} {...rest}>
      {children}
    </Tag>
  );
}
