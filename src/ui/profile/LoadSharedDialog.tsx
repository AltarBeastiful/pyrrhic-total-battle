import { Alert, Button, Group, Text } from '@mantine/core';

import { version as gameData } from '@/data';
import type { SharePayload } from '@/share/codec';
import { cloneProfileWithNewIds, uniqueProfileName } from '@/state/defaults';
import { useStore } from '@/state/store';
import type { BattleSetup } from '@/state/schema';

import { Dialog } from '../kit';

export interface LoadSharedDialogProps {
  /** Decoded payload from the address bar; null when nothing is pending. */
  payload: SharePayload | null;
  /** Set when a link was present but could not be read. */
  error: string | null;
  onClose: () => void;
}

/** The parts of a shared setup we copy onto an existing one (ids and timestamps stay local). */
function setupPatch(setup: BattleSetup) {
  return {
    name: setup.name,
    active: setup.active,
    housing: setup.housing,
    enemy: setup.enemy,
    options: setup.options,
    priority: setup.priority,
    recoveryPlan: setup.recoveryPlan,
  };
}

/**
 * The prompt shown when the app is opened on a share link (ADR-0005). Nothing stored is touched until
 * the user chooses, and the address bar is cleaned up by the caller either way.
 */
export function LoadSharedDialog({ payload, error, onClose }: LoadSharedDialogProps) {
  const open = payload !== null || error !== null;
  const isProfile = payload?.kind === 'profile';
  const staleData = payload !== null && payload.dataVersion !== gameData.dataVersion;

  const addProfile = (): void => {
    if (payload?.kind !== 'profile') return;
    const state = useStore.getState();
    const name = uniqueProfileName(
      payload.profile.name,
      state.doc.profiles.map((profile) => profile.name),
    );
    state.addProfile(cloneProfileWithNewIds(payload.profile, state.doc.deviceId, name));
    onClose();
  };

  const replaceProfile = (): void => {
    if (payload?.kind !== 'profile') return;
    const state = useStore.getState();
    const { id: _id, rev: _rev, updatedAt: _updatedAt, deviceId: _deviceId, ...rest } = payload.profile;
    state.updateProfile(state.doc.activeProfileId, rest);
    onClose();
  };

  const addSetup = (): void => {
    if (payload?.kind !== 'battle') return;
    const state = useStore.getState();
    state.createSetup(payload.setup.name === '' ? 'Shared march' : payload.setup.name);
    state.updateActiveSetup(setupPatch(payload.setup));
    onClose();
  };

  const replaceSetup = (): void => {
    if (payload?.kind !== 'battle') return;
    useStore.getState().updateActiveSetup(setupPatch(payload.setup));
    onClose();
  };

  return (
    <Dialog
      opened={open}
      onClose={onClose}
      title={isProfile ? 'Load shared profile?' : 'Load shared march?'}
      description="This link was opened in your browser. Nothing has been changed yet."
      size="sm"
      footer={
        payload === null ? (
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          </Group>
        ) : isProfile ? (
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" onClick={replaceProfile}>
              Replace active profile
            </Button>
            <Button onClick={addProfile}>Add as new profile</Button>
          </Group>
        ) : (
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="default" onClick={replaceSetup}>
              Replace active march
            </Button>
            <Button onClick={addSetup}>Add as new march</Button>
          </Group>
        )
      }
    >
      {error !== null && (
        <Alert color="danger" variant="light" mb="sm">
          {error}
        </Alert>
      )}
      {payload?.kind === 'profile' && (
        <Text size="sm">
          Profile{' '}
          <Text span fw={500} inherit>
            {payload.profile.name}
          </Text>{' '}
          with {String(payload.profile.setups.length)} saved march
          {payload.profile.setups.length === 1 ? '' : 'es'}.
        </Text>
      )}
      {payload?.kind === 'battle' && (
        <Text size="sm">
          March{' '}
          <Text span fw={500} inherit>
            {payload.setup.name}
          </Text>{' '}
          with {String(payload.counts.length)} stack{payload.counts.length === 1 ? '' : 's'}
          {payload.summary === null
            ? ''
            : `, average damage ${Math.round(payload.summary.avgDamage).toLocaleString('en-US')}`}
          .
        </Text>
      )}
      {staleData && (
        <Alert color="brass" variant="light" mt="sm">
          This link was made with game data version {String(payload.dataVersion)}; this build ships version{' '}
          {String(gameData.dataVersion)}. Values may have changed since.
        </Alert>
      )}
    </Dialog>
  );
}
