/**
 * The artifacts, in the same chips the captains use (design plan §7.3, D-34): all sixteen on screen,
 * "0/3" beside the heading, a gear on every one of them, three at a time and the fourth refused.
 *
 * The gear opens an anchored popover holding what the artifact's card shows in game: its level, its star
 * rating and the random bonuses it rolled, one line per whole star reached. The figures are all the game's
 * (B-39, B-42), so the player picks and types no percentage.
 */
import { ActionIcon, Box, Divider, Group, SegmentedControl, Select, Stack, Text } from '@mantine/core';
import { Check, Minus, Plus } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { ARTIFACT_RARITIES } from '@/data/types';
import type { ArtifactRandomOption, ArtifactRarity } from '@/data/types';
import { updateSources } from '@/state/actions/bonuses';
import { artifactLineCount } from '@/state/derive';
import type { ArtifactLine, ProfileSources, SetupMarchType } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { NumberField, useRovingTabs } from '@/ui/kit';

import classes from './bonuses.module.css';
import type { ArtifactChipRow } from './chips';
import { formatPercent, humanizeOption, optionFigure, RARITY_LABELS, rowLines } from './labels';
import { artifactRecord, artifactWorth, optionNote } from './rows';
import { useBoundMarchType } from './SetupBindingContext';
import { SourceChip } from './SourceChip';

/** What the card says when a fourth artifact is tapped. */
export const ARTIFACT_CAP_MESSAGE = 'Three artifacts at most. Take one out first.';

type ArtifactEntry = ProfileSources['artifacts'][number];

/**
 * A field between its − and its + (B-40, design rule 10: sixty levels, twenty-five star steps). A press moves
 * one place along the table's ladder. At an end the button is marked off with `data-disabled`, not `disabled`:
 * a natively disabled button drops a keyboard player's focus to the page, out of the editor.
 */
function Stepped<T>({
  what,
  ladder,
  value,
  onStep,
  children,
}: {
  /** What the buttons move, as their names say it: "level", "star rating". */
  what: string;
  /** Every value the field may take, lowest first. */
  ladder: readonly T[];
  value: T;
  onStep: (next: T) => void;
  children: ReactNode;
}) {
  const at = ladder.indexOf(value);
  const end = (verb: string, next: T | undefined, Icon: typeof Plus) => (
    <ActionIcon
      variant="default"
      size={36}
      aria-label={`${verb} ${what}`}
      {...(next === undefined ? { 'data-disabled': true, 'aria-disabled': true } : {})}
      onClick={() => {
        if (next !== undefined) onStep(next);
      }}
    >
      <Icon size={16} aria-hidden />
    </ActionIcon>
  );
  return (
    <Group gap="xs" align="flex-end" wrap="nowrap">
      {end('Lower', ladder[at - 1], Minus)}
      <Box flex={1} miw={0}>
        {children}
      </Box>
      {end('Raise', ladder[at + 1], Plus)}
    </Group>
  );
}

/** `entry` with line `index` set. The other lines stay, those the star hides too. */
function withLine(entry: ArtifactEntry, index: number, next: ArtifactLine): ArtifactEntry {
  const { lines = [], ...rest } = entry;
  const written = Array.from({ length: Math.max(lines.length, index + 1) }, (_, at) =>
    at === index ? next : (lines[at] ?? null),
  );
  while (written.at(-1) === null) written.pop();
  return written.length === 0 ? rest : { ...rest, lines: written };
}

/**
 * One random bonus: which of the artifact's options it rolled, then which of that option's three values. An
 * option that moves no total on this page stays selectable and says so (B-42).
 */
function RandomLine({
  number,
  options,
  line,
  marchType,
  onChange,
}: {
  number: number;
  options: readonly ArtifactRandomOption[];
  line: ArtifactLine;
  marchType: SetupMarchType;
  onChange: (next: ArtifactLine) => void;
}) {
  const name = `Random bonus ${String(number)}`;
  const picked = options.find((option) => option.id === line?.option);
  const note = picked === undefined ? null : optionNote(picked, marchType).note;
  const notCounted = new Set(
    options.filter((option) => !optionNote(option, marchType).counted).map((option) => option.id),
  );

  return (
    <Stack gap={4}>
      <Select
        aria-label={name}
        // Under the field, and read with it: a long option is cut off inside, so the note names its kind.
        description={note}
        inputWrapperOrder={['input', 'description']}
        data={[
          { value: '', label: 'Empty' },
          ...options.map((option) => ({ value: option.id, label: humanizeOption(option.id) })),
        ]}
        value={picked?.id ?? ''}
        allowDeselect={false}
        comboboxProps={{ withinPortal: false }}
        renderOption={({ option, checked }) => (
          <Group gap="xs" wrap="nowrap" justify="space-between" w="100%">
            <Stack gap={0}>
              <span>{option.label}</span>
              {notCounted.has(option.value) && (
                <Text size="xs" c="dimmed">
                  Not counted
                </Text>
              )}
            </Stack>
            {checked === true && <Check size={14} aria-hidden />}
          </Group>
        )}
        onChange={(next) => {
          // A new line starts on the smallest value, the bottom of the ladder; a change of option keeps it.
          onChange(next === null || next === '' ? null : { option: next, rarity: line?.rarity ?? 'rare' });
        }}
      />
      {picked !== undefined && line !== null && (
        <SegmentedControl
          fullWidth
          aria-label={`${name} value`}
          data={ARTIFACT_RARITIES.map((rarity) => ({
            value: rarity,
            label: (
              <>
                <Text span size="sm" display="block">
                  {formatPercent(optionFigure(picked.values[rarity]))}
                </Text>
                <Text span size="xs" c="dimmed" display="block">
                  {RARITY_LABELS[rarity]}
                </Text>
              </>
            ),
          }))}
          value={line.rarity}
          onChange={(next) => {
            onChange({ option: picked.id, rarity: next as ArtifactRarity });
          }}
        />
      )}
    </Stack>
  );
}

function ArtifactEditor({ artifactId }: { artifactId: string }) {
  const profile = useStore(selectActiveProfile);
  const marchType = useBoundMarchType();
  if (profile === undefined) return null;

  const record = artifactRecord(artifactId);
  const entry = profile.sources.artifacts.find((candidate) => candidate.artifactId === artifactId);
  if (entry === undefined) return null;

  const patch = (update: (current: ArtifactEntry) => ArtifactEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      artifacts: sources.artifacts.map((current) => (current.id === entry.id ? update(current) : current)),
    }));
  };

  // The table's own ladders: levels from 1, star steps from 0.1.
  const levels = Object.keys(record?.levels ?? {}).map(Number);
  const topLevel = levels.length;
  const starSteps = Object.keys(record?.stars ?? {});
  const lineCount = artifactLineCount(entry.star);
  const worth = rowLines(artifactWorth(record, entry, marchType));

  return (
    <Stack gap="xs" w={240}>
      <Text size="sm" fw={600}>
        {record?.name ?? artifactId}
      </Text>
      <Stepped
        what="level"
        ladder={levels}
        value={entry.level}
        onStep={(level) => {
          patch((current) => ({ ...current, level }));
        }}
      >
        <NumberField
          label="Level"
          value={entry.level}
          min={1}
          max={topLevel}
          onChange={(next) => {
            // The field reports what is typed before it clamps; the saved level never leaves the ladder.
            const level = Math.min(topLevel, Math.max(1, next ?? 1));
            patch((current) => ({ ...current, level }));
          }}
        />
      </Stepped>
      <Stepped
        what="star rating"
        ladder={starSteps}
        value={entry.star}
        onStep={(star) => {
          patch((current) => ({ ...current, star }));
        }}
      >
        <Select
          label="Star rating"
          data={starSteps.map((star) => ({ value: star, label: `★ ${star}` }))}
          value={entry.star}
          allowDeselect={false}
          comboboxProps={{ withinPortal: false }}
          onChange={(next) => {
            if (next !== null) patch((current) => ({ ...current, star: next }));
          }}
        />
      </Stepped>
      {lineCount === 0 ? (
        <Text size="xs" c="dimmed">
          Random bonus lines open from star 1.0.
        </Text>
      ) : (
        Array.from({ length: lineCount }, (_, index) => (
          <RandomLine
            key={index}
            number={index + 1}
            options={record?.randomOptions ?? []}
            line={entry.lines?.[index] ?? null}
            marchType={marchType}
            onChange={(next) => {
              patch((current) => withLine(current, index, next));
            }}
          />
        ))
      )}
      <Divider />
      {worth.length === 0 ? (
        <Text size="xs" c="dimmed">
          Nothing recorded yet.
        </Text>
      ) : (
        <Stack gap={0}>
          {worth.map((line) => (
            <Text key={line} size="xs" c="dimmed">
              {line}
            </Text>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

interface ArtifactChipProps {
  chip: ArtifactChipRow;
  opened: boolean;
  onToggle: (id: string) => void;
  onGear: (id: string) => void;
  onOpenedChange: (id: string, opened: boolean) => void;
}

const MemoArtifactChip = memo(function MemoArtifactChip({
  chip,
  opened,
  onToggle,
  onGear,
  onOpenedChange,
}: ArtifactChipProps) {
  return (
    <SourceChip
      name={chip.name}
      value={chip.value}
      dotted={chip.levelSet}
      checked={chip.on}
      toggleLabel={chip.on ? `${chip.name}, equipped for this march` : `Equip ${chip.name}`}
      gearLabel={`${chip.levelSet ? 'Change' : 'Set'} ${chip.name}’s level`}
      onToggle={() => {
        onToggle(chip.id);
      }}
      onGear={() => {
        onGear(chip.id);
      }}
      gearDropdown={opened ? <ArtifactEditor artifactId={chip.id} /> : null}
      gearOpened={opened}
      onGearOpenedChange={(next) => {
        onOpenedChange(chip.id, next);
      }}
    />
  );
});

export interface ArtifactChipsProps {
  chips: ArtifactChipRow[];
  isRefused: boolean;
  onToggle: (artifactId: string) => void;
  onConfigure: (artifactId: string) => void;
}

export function ArtifactChips({ chips, isRefused, onToggle, onConfigure }: ArtifactChipsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const roving = useRovingTabs();
  const latest = useRef({ onToggle, onConfigure });
  useEffect(() => {
    latest.current = { onToggle, onConfigure };
  });

  const toggle = useCallback((id: string) => {
    latest.current.onToggle(id);
  }, []);

  const gear = useCallback((id: string) => {
    setOpenId((current) => (current === id ? null : id));
    latest.current.onConfigure(id);
  }, []);

  const openedChange = useCallback((id: string, opened: boolean) => {
    setOpenId(opened ? id : null);
  }, []);

  return (
    <Stack gap="xs">
      <Group role="group" aria-label="Artifacts" className={classes.gearGrid} gap={8} wrap="wrap" {...roving}>
        {chips.map((chip) => (
          <MemoArtifactChip
            key={chip.id}
            chip={chip}
            opened={openId === chip.id}
            onToggle={toggle}
            onGear={gear}
            onOpenedChange={openedChange}
          />
        ))}
      </Group>
      <Text role="status" size="xs" c="dimmed" mih="1.125rem">
        {isRefused ? ARTIFACT_CAP_MESSAGE : ''}
      </Text>
    </Stack>
  );
}
