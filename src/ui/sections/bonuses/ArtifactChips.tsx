/**
 * The artifacts, in the same chips the captains use (design plan §7.3, D-34): all fifteen on screen,
 * "0/3" beside the heading, a gear on every one of them, three at a time and the fourth refused.
 *
 * The gear opens an anchored popover holding the level and the star rating the artifact's card
 * shows. Only one artifact's level curve has been measured so far, so the rest also carry the two
 * percentages read straight off the card, and the bonus the artifact rolled sits behind a fold —
 * it is one option out of forty and it belongs next to the option it was rolled on.
 */
import { Divider, Group, Select, Stack, Text } from '@mantine/core';
import { memo, useCallback, useEffect, useRef, useState } from 'react';

import type { BonusKey } from '@/data/types';
import { updateSources } from '@/state/actions/bonuses';
import type { ProfileSources } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { BONUS_KEY_GLYPHS, Glyph } from '@/ui/domain';
import { Disclosure, NumberField, useRovingTabs } from '@/ui/kit';

import classes from './bonuses.module.css';
import type { ArtifactChipRow } from './chips';
import { BONUS_LABELS, humanizeOption, rowValue, SPECIAL_LABELS } from './labels';
import { artifactHasLevels, artifactRecord, artifactWorth, starKeys } from './rows';
import { SourceChip } from './SourceChip';
import { singleKey } from './values';

/** What the card says when a fourth artifact is tapped. */
export const ARTIFACT_CAP_MESSAGE = 'Three artifacts at most. Take one out first.';

type ArtifactEntry = ProfileSources['artifacts'][number];

function ArtifactEditor({ artifactId }: { artifactId: string }) {
  const profile = useStore(selectActiveProfile);
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

  const manualField = (bucket: 'health' | 'strength', key: BonusKey) => (
    <NumberField
      key={`${bucket}-${key}`}
      label={`${BONUS_LABELS[key]} ${bucket}`}
      leftSection={<Glyph kind={BONUS_KEY_GLYPHS[key]} />}
      allowEmpty
      allowDecimal
      value={entry.manual?.[bucket]?.[key] ?? null}
      onChange={(next) => {
        patch((current) => ({ ...current, manual: { ...current.manual, [bucket]: singleKey(key, next) } }));
      }}
    />
  );

  const worth = rowValue(artifactWorth(record, entry));
  const specialKey = record?.special?.key;

  return (
    <Stack gap="xs" w={240}>
      <Text size="sm" fw={600}>
        {record?.name ?? artifactId}
      </Text>
      <NumberField
        label="Level"
        value={entry.level}
        min={0}
        max={60}
        onChange={(next) => {
          patch((current) => ({ ...current, level: next ?? 0 }));
        }}
      />
      <Select
        label="Star rating"
        size="xs"
        data={starKeys(record).map((star) => ({ value: star, label: `★ ${star}` }))}
        value={entry.star}
        allowDeselect={false}
        comboboxProps={{ withinPortal: false }}
        onChange={(next) => {
          patch((current) => ({ ...current, star: next ?? '0.0' }));
        }}
      />
      {!artifactHasLevels(record) && (
        <>
          {record?.health && manualField('health', record.health.key)}
          {record?.strength && manualField('strength', record.strength.key)}
          {specialKey !== undefined && (
            <NumberField
              label={SPECIAL_LABELS[specialKey]}
              allowEmpty
              allowDecimal
              value={entry.manual?.special?.[specialKey] ?? null}
              onChange={(next) => {
                patch((current) => ({
                  ...current,
                  manual: { ...current.manual, special: singleKey(specialKey, next) },
                }));
              }}
            />
          )}
        </>
      )}
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
