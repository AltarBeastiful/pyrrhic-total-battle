/**
 * **The separation language**, in one place (the owner's review of 2026-09-13: "hard to distinguish
 * parts", "the battle summary is crammed and misses clear separation", "clearer separation, it's a
 * bit all over"). `docs/design.md` §4 records it; this is the only thing that draws it.
 *
 * Inside a card, the parts of that card are separated by **one hairline with 16 px above and below**
 * and by nothing else: no second rule, no tonal block, no card inside the card. The first part has
 * no line and no space above it, the last none below, so the card's own 20 px of padding is what
 * closes it at both ends — which is why the rhythm reads as one object with parts rather than as a
 * stack of boxes.
 *
 * Written as a class on the container rather than as a `Divider` between children, because a
 * `Divider` is an element a caller has to remember, count and keep in step with conditional
 * children — and the March has seven of those, half of them conditional. Here a part that is not on
 * screen takes no line with it.
 *
 * Every direct child is a part. Wrap anything that must stay together in one element.
 */
import type { ReactNode } from 'react';

import classes from '../theme.module.css';

export interface SectionsProps {
  children: ReactNode;
  /** Names the block when it has no heading of its own. */
  'aria-label'?: string;
  component?: 'div' | 'section';
  id?: string;
  'aria-labelledby'?: string;
  className?: string;
}

export function Sections({ children, component = 'div', className, ...rest }: SectionsProps) {
  const Element = component;
  return (
    <Element
      className={className === undefined ? classes.sections : `${classes.sections} ${className}`}
      {...rest}
    >
      {children}
    </Element>
  );
}
