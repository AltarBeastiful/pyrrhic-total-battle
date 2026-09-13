/**
 * The floating Generate (plan §3), for the screens too narrow to carry it in the app bar. Four
 * states, and each one says what it is in words as well as in colour: ready, stale (the setup moved
 * under the last answer), running, blocked (something upstream is missing — the hint says what).
 *
 * `withinPortal={false}` keeps the button inside `<main>`. Mantine's `Affix` portals to the body by
 * default, which put the spike's sticky bar outside every landmark and was its last axe finding.
 */
import { Affix, Button, Stack, Text } from '@mantine/core';
import { Play, RefreshCw } from 'lucide-react';

import classes from './kit.module.css';

export type GenerateState = 'ready' | 'stale' | 'running' | 'blocked';

export interface GenerateFabProps {
  /** The button's text and its accessible name. */
  label: string;
  state: GenerateState;
  /** Why it is blocked, or what changed since the last run. */
  hint?: string;
  onGenerate: () => void;
  /** The breakpoint the app bar takes over at. */
  hiddenFrom?: 'sm' | 'md' | 'lg' | 'xl';
}

export function GenerateFab({ label, state, hint, onGenerate, hiddenFrom = 'lg' }: GenerateFabProps) {
  const blocked = state === 'blocked';
  const running = state === 'running';

  const button = (
    <Button
      size="md"
      radius="xl"
      color="brass"
      variant={state === 'stale' ? 'filled' : blocked ? 'default' : 'filled'}
      loading={running}
      disabled={blocked}
      aria-describedby={hint === undefined ? undefined : 'pyr-fab-hint'}
      leftSection={state === 'stale' ? <RefreshCw size={16} aria-hidden /> : <Play size={16} aria-hidden />}
      onClick={onGenerate}
    >
      {label}
    </Button>
  );

  return (
    <Affix
      className={classes.fab}
      withinPortal={false}
      hiddenFrom={hiddenFrom}
      position={{ bottom: 16, right: 16 }}
    >
      <Stack gap={4} align="flex-end">
        {button}
        {/* Written out rather than hidden in a tooltip: a disabled button fires no hover, and the
            one reason a player cannot press Generate is the thing they most need to read. */}
        {hint !== undefined && (
          <Text id="pyr-fab-hint" size="xs" ta="right" c="dimmed">
            {hint}
          </Text>
        )}
      </Stack>
    </Affix>
  );
}
