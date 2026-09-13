/**
 * The top app bar (design plan §5.1 as revised by spike 0009 — frame V1 adopted): M3's small top
 * app bar, 64 px, scrolling away with the page, carrying **two things only**. The brand on the left, the account on the
 * right, and nothing else.
 *
 * The figures used to live here. They moved to where the action they belong with is — the March
 * pane's header on a desktop, the bottom app bar on a phone — because a bar that repeats the pane
 * eighty pixels above it is what `v4-desktop.jpg` shows and design rule 5 forbids.
 */
import { Box, Title } from '@mantine/core';

import { AppBar as BarSurface } from '../kit';
import { AccountMenu } from './AccountMenu';
import themeClasses from '../theme.module.css';

/**
 * Our own mark: a gilded square, the game's trim turned 45° (design plan §5.5, artboard `.mark`).
 * Decorative — the word beside it is the name, and a logotype is what design rule 25 forbids.
 */
function BrandMark() {
  return <Box className={themeClasses.mark} aria-hidden="true" />;
}

export function AppBar() {
  return (
    <BarSurface
      brand={
        <>
          <BrandMark />
          <Title order={1} size="1.125rem" fw={600} lh={1.4}>
            Pyrrhic
          </Title>
        </>
      }
      actions={<AccountMenu />}
    />
  );
}
