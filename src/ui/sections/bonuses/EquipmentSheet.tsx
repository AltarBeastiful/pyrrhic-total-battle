/**
 * The equipment editor (S-15): which piece this is, its quality, and the name of the captain wearing
 * it. What a gem or an enchantment adds sits behind a fold, because the quality table does not carry
 * it and most pieces have none.
 */
import { Select, SimpleGrid, Stack, TextInput } from '@mantine/core';

import { equipment as equipmentTable } from '@/data';
import type { Quality } from '@/data/types';
import { removeSourceEntry, updateSources } from '@/state/actions/bonuses';
import type { Profile, ProfileSources } from '@/state/schema';
import { Disclosure } from '@/ui/kit';

import { BonusKeyGrid } from './BonusKeyGrid';
import { describeContribution, QUALITY_LABELS } from './labels';
import { equipmentRecord, firstQuality, qualitiesOf, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet, WorthList } from './SourceSheet';

type EquipmentEntry = ProfileSources['equipment'][number];

export interface EquipmentSheetProps {
  profile: Profile;
  entryId: string;
  summary: TotalsSummary;
  onClose: () => void;
}

export function EquipmentSheet({ profile, entryId, summary, onClose }: EquipmentSheetProps) {
  const entry = profile.sources.equipment.find((candidate) => candidate.id === entryId);
  if (entry === undefined) return null;
  const record = equipmentRecord(entry.equipmentId);

  const patch = (update: (current: EquipmentEntry) => EquipmentEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      equipment: sources.equipment.map((current) => (current.id === entry.id ? update(current) : current)),
    }));
  };

  return (
    <SourceSheet
      title={record?.name ?? entry.equipmentId}
      where={WHERE.equipment}
      summary={summary}
      onClose={onClose}
      removeLabel="Remove piece"
      onRemove={() => {
        removeSourceEntry(profile.id, 'equipment', entry.id);
        onClose();
      }}
    >
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          <Select
            label="Equipment type"
            data={equipmentTable.map((piece) => ({ value: piece.id, label: piece.name }))}
            value={entry.equipmentId}
            allowDeselect={false}
            onChange={(next) => {
              const equipmentId = next ?? entry.equipmentId;
              const swapped = equipmentRecord(equipmentId);
              patch((current) => ({
                ...current,
                equipmentId,
                quality: qualitiesOf(swapped).includes(current.quality)
                  ? current.quality
                  : firstQuality(swapped),
              }));
            }}
          />
          <Select
            label="Quality"
            data={qualitiesOf(record).map((quality) => ({
              value: quality,
              label: QUALITY_LABELS[quality],
            }))}
            value={entry.quality}
            allowDeselect={false}
            onChange={(next) => {
              patch((current) => ({ ...current, quality: (next ?? current.quality) as Quality }));
            }}
          />
        </SimpleGrid>
        <TextInput
          label="Name"
          placeholder="Which captain wears it"
          description="Optional, so two pieces of the same type stay apart."
          value={entry.name ?? ''}
          onChange={(event) => {
            const name = event.currentTarget.value;
            patch((current) => ({ ...current, name }));
          }}
        />
        <FieldGroup label="Worth right now">
          <WorthList
            lines={describeContribution(record?.byQuality[entry.quality] ?? {})}
            empty="We have no figures for this piece at this quality yet."
          />
        </FieldGroup>
        <Disclosure title="Gem and enchantment" summary="What is set into the piece, typed by hand">
          <BonusKeyGrid
            value={{
              health: entry.extra?.health ?? {},
              strength: entry.extra?.strength ?? {},
              ...(entry.extra?.special === undefined ? {} : { special: entry.extra.special }),
            }}
            onChange={(next) => {
              patch((current) => ({
                ...current,
                extra: {
                  health: next.health,
                  strength: next.strength,
                  ...(next.special === undefined ? {} : { special: next.special }),
                },
              }));
            }}
          />
        </Disclosure>
      </Stack>
    </SourceSheet>
  );
}
