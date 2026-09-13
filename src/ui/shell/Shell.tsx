/**
 * The frame (design plan §5.1, frame V1 adopted after spike 0009). **One page scroll**, two bars,
 * no floating button:
 *
 * - the top app bar carries the brand and the account, and nothing else;
 * - from `lg` (1200 px) the setup is the focus pane and the March is M3's 360 dp supporting pane on
 *   the right, sticky under the app bar, its header holding the recap and Generate;
 * - below that the page is one column — setup, then the March — with a Material bottom app bar
 *   carrying the quick summary and Generate, and the full recap one tap away in a bottom sheet.
 *
 * The width decides in JavaScript rather than in CSS because the March section itself moves: it is
 * in the pane on a desktop and in the page flow on a phone, and rendering it in both places would
 * put the same anchor on the page twice.
 */
import { Container, Divider, Drawer, Grid, Stack, Text } from '@mantine/core';
import { Fragment, lazy, useEffect, useState } from 'react';

import { selectTheme, useStore } from '@/state/store';
import { MarchGenerateButton, MarchRecap, MarchSection } from '@/ui/sections/march';

import { LazySurface } from '../lazy';
import { SECTIONS } from '../sections';
import { applyTheme, watchSystemTheme } from '../theme';
import { useUiStore } from '../uiStore';
import { AppBar } from './AppBar';
import { BottomBar } from './BottomBar';
import { MarchPane } from './MarchPane';
import classes from './shell.module.css';
import { useGenerateShortcut } from './useGenerateRun';
import { TWO_PANES, useMediaQuery } from './useMediaQuery';

// Most sessions are not opened on a share link, and the ones that are can wait a frame for the
// prompt: the decoder and the dialog are a chunk of their own (ui-foundation plan §6).
const LoadSharedDialog = lazy(() =>
  import('../profile/LoadSharedDialog').then((module) => ({ default: module.LoadSharedDialog })),
);

/** What the player edits, in the order the registry fixes; the March is the other column. */
const SETUP = SECTIONS.filter((section) => section.id !== 'march');

/** The page's own width, not Mantine's: `Container` keeps the content off the edges (M3 margins). */
const CONTENT_WIDTH = 1600;

export function Shell() {
  const theme = useStore(selectTheme);
  const wide = useMediaQuery(TWO_PANES);
  const [recapOpen, setRecapOpen] = useState(false);
  const pendingShare = useUiStore((state) => state.pendingShare);
  const shareError = useUiStore((state) => state.shareError);

  // `Ctrl`/`⌘ + Enter` generates from anywhere; it is bound once, here, rather than on a control
  // that only exists at one width.
  useGenerateShortcut();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => watchSystemTheme(() => useStore.getState().doc.ui.theme), []);

  const dismissShare = (): void => {
    useUiStore.getState().setPendingShare(null);
    useUiStore.getState().setShareError(null);
  };

  /**
   * The setup is one continuous sheet, not four floating cards (design direction D-19): a section
   * draws no rule of its own, so the frame is what tells them apart — a full-width hairline and
   * 24 px of air either side of it.
   */
  const setup = (
    <Stack gap="xl">
      {SETUP.map(({ id, Component }, index) => (
        <Fragment key={id}>
          {index > 0 ? <Divider /> : null}
          <Component />
        </Fragment>
      ))}
    </Stack>
  );

  return (
    <div className={classes.frame}>
      <a href="#main" className={classes.skip}>
        Skip to the calculator
      </a>

      <AppBar />

      <Container id="main" component="main" size={CONTENT_WIDTH} py="md" className={classes.main}>
        {wide ? (
          <Grid gap="xl">
            <Grid.Col span="auto" miw={0}>
              {setup}
            </Grid.Col>
            <Grid.Col span="content">
              <MarchPane />
            </Grid.Col>
          </Grid>
        ) : (
          <Stack gap="xl">
            {setup}
            <MarchSection />
          </Stack>
        )}
      </Container>

      <Container component="footer" size={CONTENT_WIDTH} pb="md">
        <Text size="xs" c="dimmed">
          Nothing leaves your browser. Free and open source under the AGPL-3.0.
        </Text>
      </Container>

      {wide ? null : (
        <>
          <BottomBar
            onOpenRecap={() => {
              setRecapOpen(true);
            }}
          />
          {/* Half height, from the bottom: the figures and the first tiles. The sheet sits *over*
              the bottom bar rather than under it (M-09 polish list): a control outside a focus trap
              that the pointer can still reach is a trap that does not hold, so the bar goes under
              the scrim and the sheet carries its own Generate — the answer and the action still
              travel together (investigation 0009, "to decide" 3). */}
          <Drawer
            opened={recapOpen}
            onClose={() => {
              setRecapOpen(false);
            }}
            position="bottom"
            size="60%"
            radius="md"
            padding="md"
            zIndex={300}
            title="March"
            closeButtonProps={{ 'aria-label': 'Close' }}
          >
            <Stack gap="md">
              <MarchRecap variant="sheet" />
              <MarchGenerateButton fullWidth />
            </Stack>
          </Drawer>
        </>
      )}

      <LazySurface isOpen={pendingShare !== null || shareError !== null}>
        <LoadSharedDialog payload={pendingShare} error={shareError} onClose={dismissShare} />
      </LazySurface>
    </div>
  );
}
