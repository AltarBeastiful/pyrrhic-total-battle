/**
 * The artifacts, in the same chips the captains use (design plan §7.3, D-34): all sixteen on screen,
 * "0/3" beside the heading, a gear on every one of them, three at a time and the fourth refused.
 *
 * The gear opens an anchored popover holding the level and the star rating the artifact's card
 * shows, which is all it takes: the bonuses are the game's own (B-39). The bonus the artifact rolled sits
 * behind a fold — it is one option out of forty and it belongs next to the option it was rolled on.
 */
import { ActionIcon, Box, Divider, Group, Select, Stack, Text } from '@mantine/core';
import { Minus, Plus } from 'lucide-react';
import { memo, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

import { updateSources } from '@/state/actions/bonuses';
import type { ProfileSources } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { Disclosure, NumberField, useRovingTabs } from '@/ui/kit';

import classes from './bonuses.module.css';
import type { ArtifactChipRow } from './chips';
import { humanizeOption, rowValue } from './labels';
import { artifactRecord, artifactWorth } from './rows';
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
  const worth = rowValue(artifactWorth(record, entry, marchType));

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
      <Disclosure title="Random bonus" summary={entry.random === undefined ? 'none' : 'set'}>
        <Stack gap="xs">
          <Select
            label="Rolled on"
            size="xs"
            data={[
              { value: '', label: 'None' },
              ...(record?.randomBonusOptions ?? []).map((option) => ({
                value: option,
                label: humanizeOption(option),
              })),
            ]}
            value={entry.random?.option ?? ''}
            allowDeselect={false}
            comboboxProps={{ withinPortal: false }}
            onChange={(next) => {
              patch((current) => {
                if ((next ?? '') === '') {
                  const { random: _dropped, ...rest } = current;
                  return rest;
                }
                return { ...current, random: { option: next ?? '', value: current.random?.value ?? 0 } };
              });
            }}
          />
          <NumberField
            label="Random bonus"
            allowEmpty
            allowDecimal
            disabled={entry.random === undefined}
            value={entry.random?.value ?? null}
            onChange={(next) => {
              patch((current) =>
                current.random === undefined
                  ? current
                  : { ...current, random: { ...current.random, value: next ?? 0 } },
              );
            }}
          />
        </Stack>
      </Disclosure>
      <Divider />
      <Text size="xs" c="dimmed">
        {worth === '' ? 'Nothing recorded yet.' : worth}
      </Text>
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
