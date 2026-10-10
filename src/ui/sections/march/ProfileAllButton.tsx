/**
 * **The profiling run's button**: Generate plus every advisor question, measured (see
 * `profileRun.ts`). Drawn only where `profilingEnabled()` says so (`pnpm dev`, or a build the owner switched it
 * on in), as a quiet text button under the Generate in the March sheet; the answer is in the browser console.
 */
import { Button } from '@mantine/core';
import { Gauge } from 'lucide-react';
import { useState } from 'react';

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
    <Button
      variant="subtle"
      color="gray"
      size="compact-sm"
      leftSection={<Gauge size={14} aria-hidden />}
      loading={running}
      onClick={press}
      aria-label="Profile: generate and ask every question (see the console)"
    >
      Profile everything
    </Button>
  );
}
