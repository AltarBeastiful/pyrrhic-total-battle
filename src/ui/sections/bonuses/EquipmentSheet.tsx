/**
 * The equipment editor (S-15): which piece this is, its quality, and the set it is grouped in (B-19). What a gem or an enchantment adds sits behind a fold, because the quality table does not carry
 * it and most pieces have none.
 */
import { Select, SimpleGrid, Stack } from '@mantine/core';

import { equipment as equipmentTable } from '@/data';
import type { Quality } from '@/data/types';
import { removeSourceEntry, updateSources } from '@/state/actions/bonuses';
import { mintSetId, moveToSet } from '@/state/actions/equipmentSets';
import type { Profile, ProfileSources } from '@/state/schema';
import { Disclosure } from '@/ui/kit';

import { BonusKeyGrid } from './BonusKeyGrid';
import { describeContribution, QUALITY_LABELS } from './labels';
import { equipmentRecord, firstQuality, qualitiesOf, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet, WorthList } from './SourceSheet';

const NO_SET = '__none__';
const NEW_SET = '__new__';

type EquipmentEntry = ProfileSources['equipment'][number];

export interface EquipmentSheetProps {
  profile: Profile;
  entryId: string;
  summary: TotalsSummary;
  /** Every set the profile has, for the Set field. */
  sets: readonly { id: string; name: string }[];
  /** Told which set the player chose, so the next piece added starts in it. */
  onSetChosen?: (setId: string | undefined) => void;
  onClose: () => void;
}

export function EquipmentSheet({
  profile,
  entryId,
  summary,
  sets,
  onSetChosen,
  onClose,
}: EquipmentSheetProps) {
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
            // Typed, not scrolled (rule 11): a player knows the name of the piece on the captain,
            // and the twelve sets run from "Emerald Guardian" to "Warrior of Ragnarök" — three
            // letters land on one of them.
            //
            // The whole value is selected on focus, the rule every typed figure on this page already
            // follows (rule 9, `NumberInput`): a searchable `Select` holds the chosen label in its
            // field, so typing without this *appends* to it — "guard" over "Emerald Guardian" filters
            // on "Emerald Guardianguard" and the list comes back empty.
            searchable
            onFocus={(event) => {
              event.currentTarget.select();
            }}
            nothingFoundMessage="No piece by that name"
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
        <Select
          label="Set"
          description="Optional. A set switches its pieces on together; each piece still switches alone."
          data={[
            { value: NO_SET, label: 'No set' },
            ...sets.map((set) => ({ value: set.id, label: set.name })),
            { value: NEW_SET, label: 'New set' },
          ]}
          value={entry.setId ?? NO_SET}
          allowDeselect={false}
          onChange={(next) => {
            const chosen =
              next === null || next === NO_SET ? undefined : next === NEW_SET ? mintSetId() : next;
            moveToSet(profile.id, entry.id, chosen ?? null);
            onSetChosen?.(chosen);
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
