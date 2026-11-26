/**
 * The ground a wide command bar stands on: full bleed, sticky at the bottom edge, with a `Container` inside it so the
 * content starts and ends on the same lines as the panels above (see `Shell.tsx`). The calculator's bar and the Prime
 * Arena's both sit in it.
 */
import { Container } from '@mantine/core';
import type { ReactNode } from 'react';

import classes from './shell.module.css';

/** The page's own width, not Mantine's: `Container` keeps the content off the edges (M3 margins). */
export const CONTENT_WIDTH = 1600;

export function CommandDock({ children }: { children: ReactNode }) {
  return (
    <div className={classes.commandDock}>
      <Container component="div" size={CONTENT_WIDTH}>
        {children}
      </Container>
    </div>
  );
}
