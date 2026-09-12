/**
 * The captain editor (S-15): the base level and the stars, and nothing else. Which captain this is
 * no longer belongs here — the grid picks it (D-33) — so the sheet is the two fields the badge
 * promised, with the TOTAL above them moving on every step.
 *
 * A captain carrying only one of the two keys is filled in exactly the same way: the keys describe
 * what the figure boosts, not what you type. The description says which, so nobody hunts for a
 * missing field.
 */
import type { CaptainRecord } from '@/data/types';
import { removeSourceEntry, updateSources } from '@/state/actions/bonuses';
import type { Profile, ProfileSources } from '@/state/schema';
import { Banner, NumberStepper } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';

import { describeContribution } from './labels';
import { captainBoosts, captainRecord, captainWorth, WHERE } from './rows';
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
  const boosts = captainBoosts(record);

  const patch = (update: (current: CaptainEntry) => CaptainEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      captains: sources.captains.map((current) => (current.id === entry.id ? update(current) : current)),
    }));
  };

  return (
    <SourceSheet
      title={record?.name ?? entry.captainId}
      where={boosts === '' ? WHERE.captain : `${WHERE.captain} ${boosts}`}
      summary={summary}
      onClose={onClose}
      removeLabel="Forget this captain"
      onRemove={() => {
        // The captain stays in the grid; what goes is the level, the stars and its place in a march.
        removeSourceEntry(profile.id, 'captains', entry.id);
        onClose();
      }}
    >
      <Stack gap={3}>
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
