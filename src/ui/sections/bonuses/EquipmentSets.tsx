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
  Badge,
  Box,
  Button,
  Checkbox,
  CloseButton,
  Group,
  Paper,
  type PaperProps,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { useRef, useState } from 'react';

import { toggleActiveSource } from '@/state/actions/bonuses';
import {
  addEmptySet,
  deleteSetAndPieces,
  moveToSet,
  renameSet,
  setPiecesOn,
} from '@/state/actions/equipmentSets';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';

import { GRADES, gradeInk, layoutOf, slotsFor, tightLine } from './equipmentSets';
import type { EquipmentSet } from './equipmentSets';
import { describeContribution, QUALITY_LABELS } from './labels';
import type { EditorTarget } from './rows';
import { equipmentRecord, equipmentWorth } from './rows';
import bonusClasses from './bonuses.module.css';
import classes from './EquipmentSets.module.css';
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
      c={gradeInk(piece.quality)}
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
  onEdit: (target: EditorTarget) => void;
}

/** The id a drop target answers to; "No set" is the one that is not a set. */
const NO_SET = 'no-set';
const setTarget = (setId: string): string => `set:${setId}`;

/**
 * The release that ends a drag is also a click on whatever is under the pointer, and a chip under it
 * would switch the piece (B-20, story 7). The next click is swallowed, and only that one.
 */
function swallowNextClick(): void {
  const stop = (event: Event) => {
    event.stopPropagation();
    event.preventDefault();
  };
  document.addEventListener('click', stop, { capture: true, once: true });
  setTimeout(() => {
    document.removeEventListener('click', stop, { capture: true });
  }, 0);
}

/** What a drop does: the menu's own move, and nothing when the piece lands where it already is. */
function dropPiece(profileId: string, pieces: readonly Piece[], event: DragEndEvent): void {
  const over = event.over?.id;
  if (over === undefined) return;
  const piece = pieces.find((candidate) => candidate.id === event.active.id);
  if (piece === undefined) return;
  const target = over === NO_SET ? null : String(over).slice('set:'.length);
  if ((piece.setId ?? null) === target) return;
  moveToSet(profileId, piece.id, target);
}

/** A card that takes a dragged piece, outlined while one hovers over it. */
function DropZone({
  id,
  children,
  ...rest
}: PaperProps & { id: string; children: React.ReactNode; role: string; 'aria-label': string }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <Paper
      ref={setNodeRef}
      {...rest}
      style={
        isOver ? { outline: '2px solid var(--mantine-color-brass-filled)', outlineOffset: 2 } : undefined
      }
    >
      {children}
    </Paper>
  );
}

/** A piece that follows the pointer once pressed and moved a few pixels; a plain press is still a click. */
function Draggable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, listeners, transform, isDragging } = useDraggable({ id });
  return (
    <Box
      ref={setNodeRef}
      data-piece-id={id}
      {...listeners}
      style={{
        position: 'relative',
        zIndex: isDragging ? 100 : undefined,
        opacity: isDragging ? 0.85 : undefined,
        transform:
          transform === null
            ? undefined
            : `translate3d(${String(transform.x)}px, ${String(transform.y)}px, 0)`,
      }}
    >
      {children}
    </Box>
  );
}

function PieceChip({ piece, on, onEdit }: PieceProps) {
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
        details={[
          { text: `${QUALITY_LABELS[piece.quality]} quality`, color: gradeInk(piece.quality) },
          ...describeContribution(worth),
        ]}
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
    </Group>
  );
}

function PieceGrid({ children }: { children: React.ReactNode }) {
  return (
    <Group gap={8} wrap="wrap" className={bonusClasses.gearGrid}>
      {children}
    </Group>
  );
}

/**
 * A set's name, written in place: it reads as text, shows a line under it when hovered or focused, and
 * is kept on Enter or on leaving the field. Escape gives the edit up. Left empty, the set takes the name
 * its pieces suggest.
 */
function SetName({ profileId, set }: { profileId: string; set: EquipmentSet }) {
  const [draft, setDraft] = useState<string | null>(null);
  const given = useRef(false);
  const keep = () => {
    if (!given.current && draft !== null && draft.trim() !== set.name) renameSet(profileId, set.id, draft);
    given.current = false;
    setDraft(null);
  };
  return (
    <TextInput
      variant="unstyled"
      size="sm"
      aria-label={`Name of set ${set.name}`}
      value={draft ?? set.name}
      onFocus={(event) => {
        setDraft(set.name);
        event.currentTarget.select();
      }}
      onChange={(event) => {
        setDraft(event.currentTarget.value);
      }}
      onBlur={keep}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
        if (event.key === 'Escape') {
          given.current = true;
          event.currentTarget.blur();
        }
      }}
      // As wide as the text, so the click target is the name and not the line.
      style={{
        flex: '0 1 auto',
        minWidth: 0,
        width: `${String(Math.max(4, (draft ?? set.name).length + 1))}ch`,
      }}
      styles={{
        input: {
          fontWeight: 600,
          height: 24,
          minHeight: 24,
          borderBottom: '1px solid transparent',
          borderRadius: 0,
          textOverflow: 'ellipsis',
        },
      }}
      classNames={{ input: classes.setName }}
    />
  );
}

export interface EquipmentSetsProps {
  profile: Profile;
  setup: BattleSetup;
  onEdit: (target: EditorTarget) => void;
  onAdd: () => void;
  addDisabled: boolean;
}

export function EquipmentSets({ profile, setup, onEdit, onAdd, addDisabled }: EquipmentSetsProps) {
  const { sets, loose } = layoutOf(profile, setup);
  const [dragging, setDragging] = useState(false);
  // A mouse drags after a few pixels, so a click stays a click; a finger must rest first, so a swipe still scrolls the page (B-20).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
  );
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
      <Draggable key={piece.id} id={piece.id}>
        <PieceChip piece={piece} on={active.has(piece.id)} onEdit={onEdit} />
      </Draggable>
    ));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={() => {
        setDragging(true);
      }}
      onDragCancel={() => {
        setDragging(false);
        swallowNextClick();
      }}
      onDragEnd={(event) => {
        setDragging(false);
        swallowNextClick();
        dropPiece(profile.id, profile.sources.equipment, event);
      }}
    >
      <Stack gap="xs">
        <Stack gap="xs" role="group" aria-label="Equipment">
          {sets.map((set) => (
            <DropZone
              key={set.id}
              id={setTarget(set.id)}
              bd="1px solid color-mix(in srgb, var(--mantine-color-default-border) 40%, transparent)"
              bg="transparent"
              p="xs"
              role="group"
              aria-label={`Set ${set.name}`}
            >
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
                  <SetName profileId={profile.id} set={set} />
                  {set.pieces.length === 0 && (
                    <CloseButton
                      ml="auto"
                      size="sm"
                      aria-label={`Delete empty set ${set.name}`}
                      onClick={() => {
                        deleteSetAndPieces(profile.id, set.id);
                      }}
                    />
                  )}
                </Group>
                {set.pieces.length === 0 ? (
                  <Text size="xs" c="dimmed">
                    Empty. Drag a piece here, or choose this set when adding one.
                  </Text>
                ) : (
                  <PieceGrid>{pieces(set.pieces)}</PieceGrid>
                )}
              </Stack>
            </DropZone>
          ))}
          {(loose.length > 0 || dragging) && (
            // The gear stands half above its chip, so the first row needs room under the card above.
            <DropZone
              id={NO_SET}
              bg="transparent"
              role="group"
              aria-label="No set"
              pt={sets.length > 0 ? 10 : 0}
            >
              {loose.length > 0 ? (
                <PieceGrid>{pieces(loose)}</PieceGrid>
              ) : (
                <Text size="xs" c="dimmed" ta="center" py="sm">
                  Drop here to take a piece out of its set.
                </Text>
              )}
            </DropZone>
          )}
        </Stack>
        {addButtons}
      </Stack>
    </DndContext>
  );
}
