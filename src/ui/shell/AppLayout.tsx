/**
 * The frame (design plan §5.1, revised after the design review): **one page scroll**. A sticky app
 * bar carries the brand, the answer and the two controls; the setup runs down the page with the
 * march beside it as a supporting pane from `xl` and under it below that; the floating button is
 * the same Generate on the screens too narrow for the bar's one.
 *
 * The app bar and the floating button are the only two things that do not scroll with the page, and
 * they are never both on screen.
 */
import { useEffect } from 'react';

import { selectTheme, useStore } from '@/state/store';

import { Badge } from '../kit';
import { Page, Split, Stack } from '../layout';
import { LoadSharedDialog } from '../profile/LoadSharedDialog';
import { SECTIONS } from '../sections';
import { applyTheme, watchSystemTheme } from '../theme';
import { useUiStore } from '../uiStore';
import { AppBar } from './AppBar';
import { GenerateFab } from './GenerateFab';
import { MarchStatus } from './MarchStatus';
import { TWO_PANES, useMediaQuery } from './useMediaQuery';

/** What the player edits, in the order the registry fixes; the march is the other column. */
const SETUP = SECTIONS.filter((section) => section.id !== 'results');
const RESULTS = SECTIONS.filter((section) => section.id === 'results');

export function AppLayout() {
  const theme = useStore(selectTheme);
  // `pane-sticky` carries no breakpoint of its own, so the frame decides when the march may stick:
  // only where it really sits beside the page. One column, one scrollbar.
  const twoPanes = useMediaQuery(TWO_PANES);
  const pendingShare = useUiStore((state) => state.pendingShare);
  const shareError = useUiStore((state) => state.shareError);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => watchSystemTheme(() => useStore.getState().doc.ui.theme), []);

  const dismissShare = (): void => {
    useUiStore.getState().setPendingShare(null);
    useUiStore.getState().setShareError(null);
  };

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only">
        <Badge tone="accent">Skip to the calculator</Badge>
      </a>

      <AppBar />

      <Page>
        <Split
          as="main"
          id="main"
          sticky={twoPanes}
          start={
            <Stack gap={3}>
              {SETUP.map(({ id, Component }) => (
                <Component key={id} />
              ))}
            </Stack>
          }
          end={
            <Stack gap={3}>
              <MarchStatus />
              {RESULTS.map(({ id, Component }) => (
                <Component key={id} />
              ))}
            </Stack>
          }
        />

        <footer className="text-muted text-xs">
          Nothing leaves your browser. Free and open source under the AGPL-3.0.
        </footer>
      </Page>

      <GenerateFab />

      <LoadSharedDialog payload={pendingShare} error={shareError} onClose={dismissShare} />
    </>
  );
}
