import { Alert, Paper, Stack, Text } from '@mantine/core';

import { version as gameData } from '@/data';

import { Glyph } from './domain';
import { Dialog } from './kit';

export interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** One row of the data table: the label on the left, the figure on the right. */
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

/** What this is, which game data it ships, and the one privacy promise that matters (ADR-0002). */
export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog
      opened={open}
      onClose={() => {
        onOpenChange(false);
      }}
      title="About Pyrrhic"
      size="sm"
    >
      <Stack gap="sm">
        <Text size="sm">
          <Glyph kind="guardsmen" scale={1.2} /> Plan your epic-monster march: enter your account once, switch
          on the bonuses that apply, and get the stack sizes and the damage they should do.
        </Text>

        <Alert variant="light" color="brass" radius="sm" p="sm">
          <Text size="sm">
            Nothing leaves your browser. No account, no server, no analytics: your profiles live in this
            browser&apos;s storage until you export or share them yourself, and a share link keeps its data
            after the{' '}
            <Text span ff="monospace">
              #
            </Text>
            , which browsers never send anywhere.
          </Text>
        </Alert>

        <Paper bg="var(--pyr-sunken)" p="sm" radius="sm">
          <Stack gap={6}>
            <Row label="Game data version" value={String(gameData.dataVersion)} />
            <Row label="Values verified" value={gameData.verifiedOn} />
          </Stack>
        </Paper>

        <Text size="xs" c="dimmed">
          {gameData.notes}
        </Text>
        <Text size="xs" c="dimmed">
          Free and open source under the AGPL-3.0. Unit values are game facts, contributed and checked by
          players.
        </Text>
        <Text size="xs" c="dimmed">
          Game concepts are drawn with the platform&apos;s own Unicode emoji; interface icons from Lucide,
          ISC; type set in Inter and Fraunces, SIL Open Font License. All bundled with the app — nothing is
          fetched from anyone else.
        </Text>
      </Stack>
    </Dialog>
  );
}
