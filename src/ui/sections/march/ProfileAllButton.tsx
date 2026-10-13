/**
 * **The profiling run's mark**: Generate plus every advisor question, measured (see `profileRun.ts`). Drawn
 * only where `profilingEnabled()` says so (`pnpm dev`, or a build the owner switched it on in), as one of
 * the icons on the March's title line, beside Save (`MarchFoot.tsx`, `MarchActions`); the answer is in the
 * browser console.
 *
 * **A mark, not a labelled button** (owner, 2026-10-13: *"a simple button next to the save button keeping
 * only icons and getting a hover with the text"*): everything on that line is marks whose name is the
 * tooltip, so this one is drawn the same way — a `MarchAction`, the shared icon-with-tooltip the copy, edit
 * and save marks are (`MarchPills.tsx`). The spinner is the whole of the run's state on screen; the timer
 * that used to sit beside the button is gone with its line.
 */
import { Gauge } from 'lucide-react';
import { useState } from 'react';

import { MarchAction } from './MarchPills';
import { profilingEnabled } from './profiling';

export function ProfileAllButton() {
  const [running, setRunning] = useState(false);

  if (!profilingEnabled()) return null;
  const press = (): void => {
    setRunning(true);
    void import('./profileRun')
      .then(({ profileEverything }) => profileEverything())
      .finally(() => {
        setRunning(false);
      });
  };
  return (
    <MarchAction
      label="Profile everything"
      icon={<Gauge size={16} aria-hidden />}
      loading={running}
      onClick={press}
    />
  );
}
