/**
 * The frame (design plan §5.1 and §5.6, frame V1 adopted after spike 0009, command bar chosen by the
 * owner on 2026-09-13). **One page scroll**, one bar per edge, no floating button:
 *
 * - the top app bar carries the brand and the account, and nothing else;
 * - the bottom edge carries the **command bar**: the three housing pools, the objective and
 *   Generate — the four things that change with every march (design rule 2 as amended, story D-56).
 *   It is wells and a select from 1024 px (`DESKTOP_BAR`, M3's expanded window) and two rows of
 *   chips and the answer below that, but it is the same bar, the same form and the same state. Its
 *   ground is full bleed at both widths, so no live page scrolls past under it;
 * - from `lg` (1200 px) the setup is the focus pane and the March is M3's 360 dp supporting pane on
 *   the right, without a Generate of its own — which now lives in the bar alone. The whole pane
 *   sticks while the March fits the window and travels with the page once it does not, so the March
 *   never takes a scroll of its own (design rule 17, `MarchPane.tsx`);
 * - below that the page is the setup and nothing else, and **the March itself is in the sheet the
 *   bar's answer opens**.
 *
 * That last line is design rule 5 as resolved on 2026-09-13 (investigation 0011: 97 of the sheet's
 * 98 lines were repeated from the section under it). On a phone the sheet *is* the March: the page
 * holds the setup, the bar holds the answer, and the whole march — recap, tiles, counts, trade-off,
 * details — is one tap away at full height. Nothing scrolls the page on the player's behalf any
 * more, so a Generate leaves the thumb exactly where it was; the bar's summary changes under it, and
 * says so out loud for anyone who cannot see it change.
 *
 * The width decides in JavaScript rather than in CSS because the March section itself moves: it is
 * in the pane on a desktop and in the sheet on a phone, and rendering it in both places would put
 * the same anchor on the page twice.
 */
import { Container, Drawer, Grid, Stack, Text, VisuallyHidden } from '@mantine/core';
import { lazy, useEffect, useState } from 'react';

import { selectTheme, useStore } from '@/state/store';
import { amount, MarchFoot, MarchSection, restoreLastResult } from '@/ui/sections/march';

import { LazySurface } from '../lazy';
import { initResultPersistence, useResultStore } from '../resultStore';
import { SECTIONS } from '../sections';
import { applyTheme, watchSystemTheme } from '../theme';
import { useUiStore } from '../uiStore';
import { AppBar } from './AppBar';
import { BottomBar } from './BottomBar';
import { DESKTOP_BAR } from './command';
import { CommandBar } from './CommandBar';
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
  // The bar changes shape one window class before the March does: from 1024 px there is room for
  // four wells in a row, and the phone bar's chips would be 341 px each (the review of 2026-09-13).
  const barWide = useMediaQuery(DESKTOP_BAR);
  const [recapOpen, setRecapOpen] = useState(false);
  const pendingShare = useUiStore((state) => state.pendingShare);
  const shareError = useUiStore((state) => state.shareError);

  // `Ctrl`/`⌘ + Enter` generates from anywhere; it is bound once, here, rather than on a control
  // that only exists at one width.
  useGenerateShortcut();

  // The cached result of the last visit, and the writer that keeps the cache in step. The frame owns
  // both since the March moved into the sheet: on a phone the section is unmounted until the sheet
  // is opened, and the bar's summary has to be right before anybody opens anything.
  useEffect(() => {
    restoreLastResult();
    return initResultPersistence();
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => watchSystemTheme(() => useStore.getState().doc.ui.theme), []);

  // A run that lands while the March is off screen is a change nobody can see: the bar says so.
  const run = useLastRun();
  const announcement = recapOpen ? '' : run.sentence;

  const openRecap = (): void => {
    setRecapOpen(true);
  };

  const dismissShare = (): void => {
    useUiStore.getState().setPendingShare(null);
    useUiStore.getState().setShareError(null);
  };

  /**
   * The setup is four **panels** (design plan §5.5, direction A — this replaces D-19's one
   * continuous sheet split by hairlines): each section is a lit block with its own edge and its own
   * shadow, and the frame's only job is the 16 px of air between them. The rule that used to tell
   * them apart is gone — the panel's own border does it.
   *
   * **The March's second half is the fifth**, and only where there is a pane to shorten (owner,
   * 2026-09-15): the panes only stick while the March fits the room the window leaves them, and the
   * objective comparison, the battle story, the saved list and the whole-march actions were most of
   * what stopped it. Below 1200 px there is no pane, so the March is the sheet and carries them
   * itself (`MarchSection.tsx`) — the same flag, one decision.
   */
  const setup = (
    <Stack gap="lg">
      {SETUP.map(({ id, Component }) => (
        <Component key={id} />
      ))}
      {wide && <MarchFoot />}
    </Stack>
  );

  return (
    <div className={classes.frame}>
      <a href="#main" className={classes.skip}>
        Skip to the calculator
      </a>

      <AppBar />

      <Container id="main" component="main" size={CONTENT_WIDTH} py="xl" className={classes.main}>
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
          setup
        )}
      </Container>

      <Container component="footer" size={CONTENT_WIDTH} pb="md">
        <Text size="xs" c="dimmed">
          Nothing leaves your browser. Free and open source under the AGPL-3.0.
        </Text>
      </Container>

      {/* The bar is the last block of the frame, so a sticky `bottom: 0` pins it to the window
          while the page scrolls and leaves it in the flow at the end: its height is reserved and
          the last row of the setup can always be scrolled clear of it. The dock is what sticks —
          a sticky element travels only inside its own containing block — and it carries the ground
          from edge to edge, with a `Container` inside it so the content starts and ends on the same
          lines as the panels above it. */}
      {barWide ? (
        <div className={classes.commandDock}>
          <Container component="div" size={CONTENT_WIDTH}>
            {/* Between 1024 and 1199 px the March has no pane, so the bar carries the answer and
                the sheet opens from it: the answer and Generate travel together (design rule 2). */}
            <CommandBar {...(wide ? {} : { onOpenRecap: openRecap, pulse: run.index })} />
          </Container>
        </div>
      ) : (
        <BottomBar pulse={run.index} onOpenRecap={openRecap} />
      )}

      {!wide && (
        <>
          {/* The answer changed while the sheet was shut: the summary pulses once for the eye and
              this sentence says the same thing for everyone else (design rule 24 — colour and
              motion are never the only signal). */}
          <VisuallyHidden role="status">{announcement}</VisuallyHidden>
          {/* Full height under the app bar, and the whole March inside it: the recap, the army, the
              counts, everything. The sheet sits *over* the command bar rather than under it (M-09
              polish list): a control outside a focus trap that the pointer can still reach is a trap
              that does not hold, so the bar goes under the scrim and the sheet carries its own
              Generate — the answer and the action still travel together. */}
          <Drawer
            opened={recapOpen}
            onClose={() => {
              setRecapOpen(false);
            }}
            position="bottom"
            size="calc(100dvh - var(--pyr-appbar-height))"
            radius={0}
            padding="lg"
            // Over both bars (250) and under a kit `Sheet` (320), so a unit sheet raised from the
            // March inside this one lands on top of it rather than behind it (`theme.ts`).
            zIndex={300}
            title="March"
            // The sheet is the March pane's own material, with 20 px on its two top corners alone
            // (artboard `PhoneSheetA.dc.html`, `.sheet`); Mantine's `radius` would round all four.
            classNames={{ content: classes.sheet }}
            closeButtonProps={{ 'aria-label': 'Close' }}
          >
            <MarchSection />
          </Drawer>
        </>
      )}

      <LazySurface isOpen={pendingShare !== null || shareError !== null}>
        <LoadSharedDialog payload={pendingShare} error={shareError} onClose={dismissShare} />
      </LazySurface>
    </div>
  );
}

/**
 * What the last finished run was, for a phone that cannot see the March while the sheet is shut.
 *
 * The store is subscribed to rather than watched with an effect, because that is what it is: an
 * external source of changes, and the sentence is written in its callback. The run that was already
 * in the cache when the app opened is not a run — restoring yesterday's march is not news.
 */
function useLastRun(): { index: number; sentence: string } {
  const [run, setRun] = useState({ index: 0, sentence: '' });

  useEffect(() => {
    // The restore above has already landed by now: effects run in the order they are written.
    let seen = useResultStore.getState().last?.at ?? null;
    return useResultStore.subscribe((state) => {
      const last = state.last;
      if (last === null || last.at === seen) return;
      seen = last.at;
      setRun((current) => ({
        index: current.index + 1,
        sentence: `March generated: ${amount(last.result.stacks.length)} stacks, ${amount(
          last.summary.avgDamage,
        )} expected damage. Open the summary to read it.`,
      }));
    });
  }, []);

  return run;
}
