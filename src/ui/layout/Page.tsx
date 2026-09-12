import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

/**
 * The page frame: Material 3 margins (16 px compact, 24 px from `sm`), a measure that stops the app
 * from stretching across a wide monitor, and bottom padding deep enough that the extended floating
 * button never covers the last row of the march.
 *
 * The measure is `max-w-screen-2xl` (96 rem / 1536 px), the widest token Tailwind ships and the
 * nearest one to the 1536–1600 px the design asks for; the app bar uses the same one so the bar's
 * contents line up with the page's.
 */
const page = tv({
  base: 'mx-auto w-full max-w-screen-2xl px-4 pb-24 sm:px-6',
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
