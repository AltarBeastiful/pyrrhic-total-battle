/**
 * The title editor (D-02): which title of the kingdom this row is, and what it is worth. Giving one
 * up takes it out of every battle setup, which is what keeps the titles worn a subset of the titles
 * held.
 */
import { titles as titleTable } from '@/data';
import { setTitleOwned } from '@/state/actions/bonuses';
import type { Profile } from '@/state/schema';
import { Select } from '@/ui/kit';
import { Stack } from '@/ui/layout';

import { describeContribution } from './labels';
import { WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet, WorthList } from './SourceSheet';

export interface TitleSheetProps {
  profile: Profile;
  /** The table id of the title this row holds. */
  titleId: string;
  summary: TotalsSummary;
  /** Swapping the title swaps the row the sheet is editing. */
  onRetarget: (titleId: string) => void;
  onClose: () => void;
}

export function TitleSheet({ profile, titleId, summary, onRetarget, onClose }: TitleSheetProps) {
  const record = titleTable.find((entry) => entry.id === titleId);
  const heldElsewhere = new Set(profile.sources.titles.filter((id) => id !== titleId));

  return (
    <SourceSheet
      title={record?.name ?? titleId}
      where={WHERE.title}
      summary={summary}
      onClose={onClose}
      removeLabel="Give up this title"
      onRemove={() => {
        setTitleOwned(profile.id, titleId, false);
        onClose();
      }}
    >
      <Stack gap={3}>
        <Select
          label="Title"
          value={titleId}
          options={titleTable.map((entry) => ({
            value: entry.id,
            label: entry.name,
            isDisabled: heldElsewhere.has(entry.id),
          }))}
          onChange={(next) => {
            setTitleOwned(profile.id, titleId, false);
            setTitleOwned(profile.id, next, true);
            onRetarget(next);
          }}
        />
        <FieldGroup label="Worth right now">
          <WorthList
            lines={describeContribution(record?.bonus ?? {})}
            empty="We have no figures for this title yet."
          />
        </FieldGroup>
      </Stack>
    </SourceSheet>
  );
}
