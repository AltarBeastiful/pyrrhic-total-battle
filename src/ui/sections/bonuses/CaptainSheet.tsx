/**
 * The captain editor (S-15): which captain this is, its base level and its stars. The bonus is the
 * level times the captain's own rate plus what the stars add, so the three fields are the whole
 * source and the TOTAL above them moves on every step.
 */
import type { CaptainRecord } from '@/data/types';
import { removeSourceEntry, updateSources } from '@/state/actions/bonuses';
import type { Profile, ProfileSources } from '@/state/schema';
import { Banner, NumberStepper, Select } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';

import { describeContribution } from './labels';
import { captainRecord, captainWorth, SORTED_CAPTAINS, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet, WorthList } from './SourceSheet';

type CaptainEntry = ProfileSources['captains'][number];

const hasFigures = (record: CaptainRecord | undefined): boolean =>
  record?.health !== undefined || record?.strength !== undefined || record?.special !== undefined;

export interface CaptainSheetProps {
  profile: Profile;
  entryId: string;
  summary: TotalsSummary;
  onClose: () => void;
}

export function CaptainSheet({ profile, entryId, summary, onClose }: CaptainSheetProps) {
  const entry = profile.sources.captains.find((candidate) => candidate.id === entryId);
  if (entry === undefined) return null;
  const record = captainRecord(entry.captainId);
  const takenElsewhere = new Set(
    profile.sources.captains.filter((other) => other.id !== entry.id).map((other) => other.captainId),
  );

  const patch = (update: (current: CaptainEntry) => CaptainEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      captains: sources.captains.map((current) => (current.id === entry.id ? update(current) : current)),
    }));
  };

  return (
    <SourceSheet
      title={record?.name ?? entry.captainId}
      where={WHERE.captain}
      summary={summary}
      onClose={onClose}
      removeLabel="Remove captain"
      onRemove={() => {
        removeSourceEntry(profile.id, 'captains', entry.id);
        onClose();
      }}
    >
      <Stack gap={3}>
        <Select
          label="Captain"
          value={entry.captainId}
          options={SORTED_CAPTAINS.map((candidate) => ({
            value: candidate.id,
            label: candidate.name,
            isDisabled: takenElsewhere.has(candidate.id),
          }))}
          onChange={(captainId) => {
            patch((current) => ({ ...current, captainId }));
          }}
        />
        <Grid cols={2} gap={3}>
          <NumberStepper
            label="Base level"
            value={entry.level}
            min={0}
            max={999}
            onChange={(next) => {
              patch((current) => ({ ...current, level: next ?? 0 }));
            }}
          />
          <NumberStepper
            label="Stars"
            value={entry.star}
            min={0}
            max={6}
            bigStep={1}
            hugeStep={1}
            onChange={(next) => {
              patch((current) => ({ ...current, star: next ?? 0 }));
            }}
          />
        </Grid>
        {hasFigures(record) ? (
          <FieldGroup label="Worth right now">
            <WorthList
              lines={describeContribution(captainWorth(record, entry))}
              empty="Nothing at this level yet."
            />
          </FieldGroup>
        ) : (
          <Banner tone="warn">
            We have no figures for this captain yet. It stays in your list and counts as 0 until the tables
            carry its numbers.
          </Banner>
        )}
      </Stack>
    </SourceSheet>
  );
}
