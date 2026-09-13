import { Alert, Button, Group, Stack, Text } from '@mantine/core';

import type { ImportMode, ParsedImport } from '@/share/exportImport';

import { Dialog } from '../kit';

export interface ImportDialogProps {
  /** The validated file, or null while only an error has to be shown. */
  parsed: ParsedImport | null;
  error: string | null;
  onApply: (mode: ImportMode) => void;
  onClose: () => void;
}

const date = (at: number): string => new Date(at).toLocaleDateString();

function Row({ label, value }: { label: string; value: string }) {
  return (
    <Text component="div" size="sm" style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
      <Text span c="dimmed" inherit>
        {label}
      </Text>
      <Text span fw={500} inherit style={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Text>
    </Text>
  );
}

/** Preview of an imported file; nothing touches the store until the user picks add or replace. */
export function ImportDialog({ parsed, error, onApply, onClose }: ImportDialogProps) {
  const open = parsed !== null || error !== null;
  return (
    <Dialog
      opened={open}
      onClose={onClose}
      title="Import"
      description="Check what the file contains before it is added to this browser."
      size="sm"
      footer={
        parsed === null ? (
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Close
            </Button>
          </Group>
        ) : (
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => {
                onApply('replace');
              }}
            >
              Replace active
            </Button>
            <Button
              onClick={() => {
                onApply('add');
              }}
            >
              Add as new
            </Button>
          </Group>
        )
      }
    >
      <Stack gap="sm">
        {error !== null && (
          <Alert color="danger" variant="light">
            {error}
          </Alert>
        )}
        {parsed !== null && (
          <Stack gap={6}>
            <Row label="Kind" value={parsed.kind === 'profile' ? 'Profile' : 'Saved stack'} />
            <Row label="Name" value={parsed.preview.name} />
            <Row label="Created" value={date(parsed.preview.createdAt)} />
            {parsed.kind === 'profile' ? (
              <>
                <Row label="Battle setups" value={String(parsed.preview.setups)} />
                <Row label="Saved stacks" value={String(parsed.preview.savedStacks)} />
                <Row label="Mercenaries" value={String(parsed.preview.mercenaries)} />
                <Row label="Bonus sources" value={String(parsed.preview.bonusSources)} />
              </>
            ) : (
              <>
                <Row label="Stacks" value={String(parsed.preview.stacks)} />
                <Row label="Units" value={parsed.preview.units.toLocaleString('en-US')} />
                <Row
                  label="Average damage"
                  value={Math.round(parsed.preview.avgDamage).toLocaleString('en-US')}
                />
              </>
            )}
            <Row label="Game data version" value={String(parsed.dataVersion)} />
          </Stack>
        )}
      </Stack>
    </Dialog>
  );
}
