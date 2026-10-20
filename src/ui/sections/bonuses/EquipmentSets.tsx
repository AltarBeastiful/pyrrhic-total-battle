/**
 * The Equipment row (B-19): a card per set the player built, each with a tri-state toggle, then a
 * "No set" card for the pieces nobody grouped. A piece keeps its own switch, its grade badge, a tight
 * bonus line and a menu to move it; a set is a view, so no figure here adds up the pieces of a set.
 *
 * Nothing blocks and nothing speaks while pieces are chosen (the owner's rule): the counter in the
 * row's header tints faintly when more is worn than the selected captains have slots for, and says
 * why in its tooltip.
 */
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { Ellipsis, Plus, Settings } from 'lucide-react';

import { toggleActiveSource } from '@/state/actions/bonuses';
import { addEmptySet, mintSetId, moveToSet, setPiecesOn } from '@/state/actions/equipmentSets';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';
import { AppMenu } from '@/ui/kit';

import { GRADES, layoutOf, slotsFor, tightLine } from './equipmentSets';
import type { EquipmentSet } from './equipmentSets';
import { describeContribution, QUALITY_LABELS } from './labels';
import type { EditorTarget } from './rows';
import { equipmentRecord, equipmentWorth } from './rows';
import { SourceChip } from './SourceChip';

type Piece = ProfileSources['equipment'][number];

/** Worn against the slots of the selected captains: faint, and never a reason to stop. */
export function SlotCounter({ worn, captains }: { worn: number; captains: number }) {
  const slots = slotsFor(captains);
  const over = worn > slots;
  const reason =
    captains === 0
      ? 'No captain is selected, so six slots are counted.'
      : `${String(captains)} ${captains === 1 ? 'captain wears' : 'captains wear'} three pieces each, ${String(slots)} in all.`;
  return (
    <Tooltip
      label={over ? `${reason} More pieces are on than there are slots.` : reason}
      events={{ hover: true, focus: true, touch: true }}
      withinPortal
      multiline
      maw={260}
    >
      <Text span size="xs" c={over ? 'danger' : 'dimmed'} data-over={over ? 'true' : undefined} tabIndex={0}>
        {`${String(worn)} of ${String(slots)} worn`}
      </Text>
    </Tooltip>
  );
}

function Grade({ piece }: { piece: Piece }) {
  const grade = GRADES[piece.quality];
  // The hue is the letter's ink and the ground is the chip's own; the chip's ring and tint say on or off, the letter says the grade (rule 24).
  return (
    <Badge
      circle
      size="sm"
      color={grade.token as 'grade1'}
      variant="transparent"
      // The ink is the scheme's filled shade, the one `pnpm contrast` checks on every surface (as `tierInk`).
      c={`var(--mantine-color-${grade.token}-filled)`}
      fw={800}
      role="img"
      aria-label={`${QUALITY_LABELS[piece.quality]} grade`}
    >
      {grade.letter}
    </Badge>
  );
}

interface PieceProps {
  piece: Piece;
  on: boolean;
  sets: readonly EquipmentSet[];
  profileId: string;
  onEdit: (target: EditorTarget) => void;
}

function PieceChip({ piece, on, sets, profileId, onEdit }: PieceProps) {
  const record = equipmentRecord(piece.equipmentId);
  const name = record?.name ?? piece.equipmentId;
  const worth = equipmentWorth(record, piece);
  const editor: EditorTarget = { kind: 'equipment', id: piece.id };
  const tight = tightLine(worth);
  return (
    <Group gap={4} wrap="nowrap" align="center">
      <SourceChip
        name={name}
        badge={<Grade piece={piece} />}
        {...(tight === '' ? { value: '—' } : { value: tight })}
        details={[`${QUALITY_LABELS[piece.quality]} quality`, ...describeContribution(worth)]}
        checked={on}
        dotted
        toggleLabel={on ? `${name}, on for this march` : `Switch on ${name}`}
        onToggle={() => {
          toggleActiveSource('equipment', piece.id, !on);
        }}
        gearLabel={`Edit ${name}`}
        onGear={() => {
          onEdit(editor);
        }}
      />
      <AppMenu
        label={`Move ${name}`}
        trigger={
          <ActionIcon variant="subtle" color="slate" size="sm" aria-label={`Move ${name}`}>
            <Ellipsis size={14} aria-hidden />
          </ActionIcon>
        }
        sections={[
          {
            id: 'move',
            title: 'Move to',
            entries: [
              ...sets.map((set) => ({
                id: `set-${set.id}`,
                label: set.name,
                checked: piece.setId === set.id,
                disabled: piece.setId === set.id,
                onSelect: () => {
                  moveToSet(profileId, piece.id, set.id);
                },
              })),
              {
                id: 'new',
                label: 'New set',
                onSelect: () => {
                  moveToSet(profileId, piece.id, mintSetId());
                },
              },
              {
                id: 'none',
                label: 'No set',
                disabled: piece.setId === undefined,
                onSelect: () => {
                  moveToSet(profileId, piece.id, null);
                },
              },
            ],
          },
        ]}
      />
    </Group>
  );
}

function PieceGrid({ children }: { children: React.ReactNode }) {
  return (
    <SimpleGrid cols={{ base: 1, xs: 2, lg: 3 }} spacing={8} verticalSpacing="md">
      {children}
    </SimpleGrid>
  );
}

export interface EquipmentSetsProps {
  profile: Profile;
  setup: BattleSetup;
  onEdit: (target: EditorTarget) => void;
  onEditSet: (setId: string) => void;
  onAdd: () => void;
  addDisabled: boolean;
}

export function EquipmentSets({ profile, setup, onEdit, onEditSet, onAdd, addDisabled }: EquipmentSetsProps) {
  const { sets, loose } = layoutOf(profile, setup);
  const active = new Set(setup.active.equipment);
  const addButtons = (
    <Group gap="xs">
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<Plus size={14} aria-hidden />}
        disabled={addDisabled}
        onClick={onAdd}
      >
        Add equipment
      </Button>
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<Plus size={14} aria-hidden />}
        onClick={() => {
          addEmptySet(
            profile.id,
            sets.map((set) => set.name),
          );
        }}
      >
        Add set
      </Button>
    </Group>
  );
  if (profile.sources.equipment.length === 0 && sets.length === 0) return addButtons;

  const pieces = (list: readonly Piece[]) =>
    list.map((piece) => (
      <PieceChip
        key={piece.id}
        piece={piece}
        on={active.has(piece.id)}
        sets={sets}
        profileId={profile.id}
        onEdit={onEdit}
      />
    ));

  return (
    <Stack gap="xs">
      <Stack gap="xs" role="group" aria-label="Equipment">
        {sets.map((set) => (
          <Paper key={set.id} withBorder bg="transparent" p="xs" role="group" aria-label={`Set ${set.name}`}>
            <Stack gap="xs">
              <Group gap="xs" wrap="nowrap">
                <Checkbox
                  checked={set.state === 'all'}
                  indeterminate={set.state === 'some'}
                  disabled={set.pieces.length === 0}
                  aria-label={`${set.name}, ${String(set.on)} of ${String(set.pieces.length)} on`}
                  onChange={() => {
                    setPiecesOn(
                      set.pieces.map((piece) => piece.id),
                      set.state !== 'all',
                    );
                  }}
                />
                <Text size="sm" fw={600} style={{ flex: 1, minWidth: 0 }} truncate>
                  {set.name}
                </Text>
                <ActionIcon
                  variant="subtle"
                  color="slate"
                  size="sm"
                  aria-label={`Edit set ${set.name}`}
                  onClick={() => {
                    onEditSet(set.id);
                  }}
                >
                  <Settings size={14} aria-hidden />
                </ActionIcon>
              </Group>
              {set.pieces.length === 0 ? (
                <Text size="xs" c="dimmed">
                  Empty. Move a piece here from its ⋯ menu, or choose this set when adding one.
                </Text>
              ) : (
                <PieceGrid>{pieces(set.pieces)}</PieceGrid>
              )}
            </Stack>
          </Paper>
        ))}
        {loose.length > 0 && (
          <div role="group" aria-label="No set">
            <PieceGrid>{pieces(loose)}</PieceGrid>
          </div>
        )}
      </Stack>
      {addButtons}
    </Stack>
  );
}
