import { useEffect, useState } from 'react';

import { selectTheme, useStore } from '@/state/store';
import { THEMES, type Theme } from '@/state/schema';

import { AboutDialog } from './AboutDialog';
import { InfoIcon } from './icons';
import { Button, NativeSelect } from './primitives';
import { LoadSharedDialog } from './profile/LoadSharedDialog';
import { ProfileBar } from './profile/ProfileBar';
import { SECTIONS } from './sections';
import { applyTheme, watchSystemTheme } from './theme';
import { useUiStore } from './uiStore';

const THEME_LABELS: Record<Theme, string> = { system: 'System', light: 'Light', dark: 'Dark' };

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value);
}

/** Header, profile bar and the seven sections of PLAN §4, in order. */
export function AppShell() {
  const theme = useStore(selectTheme);
  const setTheme = useStore((state) => state.setTheme);
  const pendingShare = useUiStore((state) => state.pendingShare);
  const shareError = useUiStore((state) => state.shareError);
  const [about, setAbout] = useState(false);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => watchSystemTheme(() => useStore.getState().doc.ui.theme), []);

  const dismissShare = (): void => {
    useUiStore.getState().setPendingShare(null);
    useUiStore.getState().setShareError(null);
  };

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="focus:bg-surface sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded-lg focus:px-3 focus:py-2"
      >
        Skip to the calculator
      </a>

      <header className="border-line bg-bg border-b">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-3 py-3 sm:px-4">
          <div className="flex-1">
            <h1 className="text-lg font-semibold tracking-tight">Pyrrhic</h1>
            <p className="text-muted text-xs">Epic monster stacking for Total Battle</p>
          </div>
          <NativeSelect
            label="Theme"
            className="w-28"
            value={theme}
            options={THEMES.map((value) => ({ value, label: THEME_LABELS[value] }))}
            onChange={(event) => {
              const next = event.target.value;
              if (isTheme(next)) setTheme(next);
            }}
          />
          <Button
            icon={<InfoIcon />}
            onClick={() => {
              setAbout(true);
            }}
          >
            About
          </Button>
        </div>
      </header>

      <ProfileBar />

      <main id="main" className="mx-auto max-w-5xl space-y-3 px-3 py-4 sm:px-4">
        {SECTIONS.map(({ id, Component }) => (
          <Component key={id} />
        ))}
      </main>

      <footer className="text-muted mx-auto max-w-5xl px-3 pb-8 text-xs sm:px-4">
        Nothing leaves your browser. Free and open source under the AGPL-3.0.
      </footer>

      <AboutDialog open={about} onOpenChange={setAbout} />
      <LoadSharedDialog payload={pendingShare} error={shareError} onClose={dismissShare} />
    </div>
  );
}
