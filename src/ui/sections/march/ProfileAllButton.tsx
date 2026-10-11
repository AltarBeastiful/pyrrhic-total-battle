/**
 * **The profiling run's button**: Generate plus every advisor question, measured (see
 * `profileRun.ts`). Drawn only where `profilingEnabled()` says so (`pnpm dev`, or a build the owner switched it
 * on in), as a quiet text button under the Generate in the March sheet; the answer is in the browser console.
 *
 * Beside it, a timer: it counts while the run is going and stops at the final time once every phase is done
 * (or has failed), so the number on screen is the run's wall time.
 */
import { Button, Group, Text } from '@mantine/core';
import { Gauge } from 'lucide-react';
import { useEffect, useState } from 'react';

import { profilingEnabled } from './profiling';

const TICK_MS = 100;

export function ProfileAllButton() {
  const [started, setStarted] = useState<number | null>(null);
  const [ended, setEnded] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const running = started !== null && ended === null;

  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setNow(performance.now()), TICK_MS);
    return () => clearInterval(tick);
  }, [running]);

  if (!profilingEnabled()) return null;
  const press = (): void => {
    const began = performance.now();
    setStarted(began);
    setNow(began);
    setEnded(null);
    void import('./profileRun')
      .then(({ profileEverything }) => profileEverything())
      .finally(() => {
        setEnded(performance.now());
      });
  };
  const seconds = started === null ? 0 : ((ended ?? now) - started) / 1000;
  return (
    <Group gap="xs" wrap="nowrap">
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
      {started !== null && (
        <Text size="sm" c="dimmed" aria-live="off" data-running={String(running)}>
          {running ? `running ${seconds.toFixed(1)} s` : `done in ${seconds.toFixed(1)} s`}
        </Text>
      )}
    </Group>
  );
}
