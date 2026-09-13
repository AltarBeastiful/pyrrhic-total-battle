/**
 * The bar at the top of the page (design plan §5.1); it scrolls away with the page. A `Paper`, not `AppShell.Header`: the
 * app is one scrolling page with a supporting pane, not a shell with panels, and `AppShell` would
 * take the page's scroll away from it.
 *
 * It is a `<header>` with a `banner` role, so the skip link and every landmark check have something
 * to land on.
 */
import { Group, Paper } from '@mantine/core';
import type { ReactNode } from 'react';

import classes from './kit.module.css';

export interface AppBarProps {
  /** The product's mark and name, at the start. */
  brand: ReactNode;
  /** The middle: the answer in one line, on the screens wide enough for it. */
  children?: ReactNode;
  /** The end: Generate, the account menu. */
  actions?: ReactNode;
}

export function AppBar({ brand, children, actions }: AppBarProps) {
  return (
    <Paper component="header" className={classes.appBar} radius={0} py="xs">
      <Group justify="space-between" wrap="nowrap" gap="sm" h="100%">
        <Group gap="xs" wrap="nowrap" miw={0}>
          {brand}
        </Group>
        {children}
        <Group gap="xs" wrap="nowrap">
          {actions}
        </Group>
      </Group>
    </Paper>
  );
}
