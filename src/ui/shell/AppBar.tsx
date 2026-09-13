/**
 * The top app bar (design plan §5.1 as revised by spike 0009 — frame V1 adopted): M3's small top
 * app bar, 64 px, sticky, carrying **two things only**. The brand on the left, the account on the
 * right, and nothing else.
 *
 * The figures used to live here. They moved to where the action they belong with is — the March
 * pane's header on a desktop, the bottom app bar on a phone — because a bar that repeats the pane
 * eighty pixels above it is what `v4-desktop.jpg` shows and design rule 5 forbids.
 */
import { Box, Text, Title } from '@mantine/core';

import { AppBar as BarSurface } from '../kit2';
import { AccountMenu } from './AccountMenu';
import classes from './shell.module.css';

/** Our own mark: a tonal square with a diamond in it. Decorative — the word beside it is the name. */
function BrandMark() {
  return (
    <Box className={classes.mark} aria-hidden="true">
      <Text span size="sm" fw={600}>
        ◆
      </Text>
    </Box>
  );
}

export function AppBar() {
  return (
    <BarSurface
      brand={
        <>
          <BrandMark />
          <Title order={1} size="h5">
            Pyrrhic
          </Title>
        </>
      }
      actions={<AccountMenu />}
    />
  );
}
