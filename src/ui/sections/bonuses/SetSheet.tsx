/**
 * The sheet behind a set's gear (B-19): its name, the pieces in it, and the three ways to take it
 * apart. Type and quality are left to the piece editor, which every piece opens from here.
 */
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';

import { deleteSetAndPieces, moveToSet, renameSet, ungroupSet } from '@/state/actions/equipmentSets';
import type { BattleSetup, Profile } from '@/state/schema';

import { layoutOf } from './equipmentSets';
import { equipmentRecord } from './rows';
import type { TotalsSummary } from './rows';
import { SourceSheet } from './SourceSheet';

export interface SetSheetProps {
  profile: Profile;
  setup: BattleSetup;
  setId: string;
  summary: TotalsSummary;
  onClose: () => void;
  onEditPiece: (pieceId: string) => void;
}

export function SetSheet({ profile, setup, setId, summary, onClose, onEditPiece }: SetSheetProps) {
  const set = layoutOf(profile, setup).sets.find((candidate) => candidate.id === setId);
  if (set === undefined) return null;
  const stored = profile.sources.equipmentSetNames?.[setId] ?? '';

  return (
    <SourceSheet
      title={set.name}
      where="Your own grouping of pieces. A set adds nothing by itself: each piece counts as before."
      summary={summary}
      onClose={onClose}
      removeLabel="Delete set and pieces"
      onRemove={() => {
        deleteSetAndPieces(profile.id, setId);
        onClose();
      }}
    >
      <Stack gap="sm">
        <TextInput
          label="Name"
          placeholder={set.name}
          description="Left empty, the set is named after its type when its pieces share one."
          value={stored}
          onChange={(event) => {
            renameSet(profile.id, setId, event.currentTarget.value);
          }}
        />
        <Stack gap={6} component="section" aria-label="Pieces in this set">
          {set.pieces.map((piece) => {
            const name = equipmentRecord(piece.equipmentId)?.name ?? piece.equipmentId;
            return (
              <Group key={piece.id} justify="space-between" wrap="nowrap">
                <Button
                  variant="subtle"
                  size="compact-sm"
                  aria-label={`Edit ${name}`}
                  onClick={() => {
                    onEditPiece(piece.id);
                  }}
                >
                  {name}
                </Button>
                <Button
                  variant="subtle"
                  color="slate"
                  size="compact-sm"
                  aria-label={`Remove ${name} from set`}
                  onClick={() => {
                    moveToSet(profile.id, piece.id, null);
                  }}
                >
                  Remove from set
                </Button>
              </Group>
            );
          })}
        </Stack>
        <Button
          variant="default"
          w="fit-content"
          onClick={() => {
            ungroupSet(profile.id, setId);
            onClose();
          }}
        >
          Ungroup all
        </Button>
        <Text size="xs" c="dimmed">
          Ungrouping keeps every piece. Deleting the set deletes them too.
        </Text>
      </Stack>
    </SourceSheet>
  );
}
