/**
 * The three editors that are nothing but the 13-key grid: a permanent source, a source of your own,
 * and your dragon.
 *
 * They differ in one line of wording and in whether the row can be named or deleted, so they share
 * one shell here rather than repeating the grid three times.
 */
import { Stack, TextInput } from '@mantine/core';

import { removePermanentSource, removeSourceEntry, updateSources } from '@/state/actions/bonuses';
import type { Profile, ProfileSources } from '@/state/schema';

import { BonusKeyGrid } from './BonusKeyGrid';
import { PERMANENT_WHERE, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { SourceSheet } from './SourceSheet';
import { applyBonusValues, readBonusValues } from './values';

type PermanentEntry = ProfileSources['permanent'][number];
type CustomEntry = ProfileSources['custom'][number];

export interface FreeFormProps {
  profile: Profile;
  summary: TotalsSummary;
  onClose: () => void;
}

/** One of the eight builtin permanent editors, or a permanent row you added yourself. */
export function PermanentSheet({ profile, entryId, summary, onClose }: FreeFormProps & { entryId: string }) {
  const entry = profile.sources.permanent.find((candidate) => candidate.id === entryId);
  if (entry === undefined) return null;
  const isCustom = entry.builtin === undefined;

  const patch = (update: (current: PermanentEntry) => PermanentEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      permanent: sources.permanent.map((current) => (current.id === entry.id ? update(current) : current)),
    }));
  };

  return (
    <SourceSheet
      size="lg"
      title={entry.name === '' ? 'Permanent source' : entry.name}
      where={
        entry.builtin === undefined ? WHERE.permanent : (PERMANENT_WHERE[entry.builtin] ?? WHERE.permanent)
      }
      summary={summary}
      onClose={onClose}
      {...(isCustom
        ? {
            removeLabel: 'Remove this source',
            onRemove: () => {
              removePermanentSource(profile.id, entry.id);
              onClose();
            },
          }
        : {})}
    >
      <Stack gap="lg">
        {isCustom && (
          <TextInput
            label="Name"
            value={entry.name}
            onChange={(event) => {
              const name = event.currentTarget.value;
              patch((current) => ({ ...current, name }));
            }}
          />
        )}
        <BonusKeyGrid
          value={readBonusValues(entry)}
          onChange={(next) => {
            patch((current) => applyBonusValues(current, next));
          }}
        />
      </Stack>
    </SourceSheet>
  );
}

/** A source of your own: a temporary buff, a new bonus, anything the lists do not carry yet. */
export function CustomSheet({ profile, entryId, summary, onClose }: FreeFormProps & { entryId: string }) {
  const entry = profile.sources.custom.find((candidate) => candidate.id === entryId);
  if (entry === undefined) return null;

  const patch = (update: (current: CustomEntry) => CustomEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      custom: sources.custom.map((current) => (current.id === entry.id ? update(current) : current)),
    }));
  };

  return (
    <SourceSheet
      size="lg"
      title={entry.name === '' ? 'Source of your own' : entry.name}
      where={WHERE.custom}
      summary={summary}
      onClose={onClose}
      removeLabel="Remove source"
      onRemove={() => {
        removeSourceEntry(profile.id, 'custom', entry.id);
        onClose();
      }}
    >
      <Stack gap="lg">
        <TextInput
          label="Name"
          value={entry.name}
          onChange={(event) => {
            const name = event.currentTarget.value;
            patch((current) => ({ ...current, name }));
          }}
        />
        <BonusKeyGrid
          value={readBonusValues(entry)}
          onChange={(next) => {
            patch((current) => applyBonusValues(current, next));
          }}
        />
      </Stack>
    </SourceSheet>
  );
}

export function DragonSheet({ profile, summary, onClose }: FreeFormProps) {
  return (
    <SourceSheet size="lg" title="Dragon" where={WHERE.dragon} summary={summary} onClose={onClose}>
      <BonusKeyGrid
        value={readBonusValues(profile.sources.dragon)}
        onChange={(next) => {
          updateSources(profile.id, (current) => ({
            ...current,
            dragon: applyBonusValues(current.dragon, next),
          }));
        }}
      />
    </SourceSheet>
  );
}
