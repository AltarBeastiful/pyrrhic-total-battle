/**
 * The artifact editor (S-15): which artifact, its level, its star rating and the bonus it rolled.
 * When the tables carry the artifact's level curve the value is read from it; the ones we have not
 * measured yet are typed by hand and say so.
 */
import { artifacts as artifactTable } from '@/data';
import type { BonusKey, SpecialKey } from '@/data/types';
import { removeSourceEntry, updateSources } from '@/state/actions/bonuses';
import type { Profile, ProfileSources } from '@/state/schema';
import { Banner, NumberStepper, Select } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';

import { BONUS_LABELS, describeContribution, humanizeOption, SPECIAL_LABELS } from './labels';
import { artifactHasLevels, artifactRecord, artifactWorth, starKeys, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet, WorthList } from './SourceSheet';
import { singleKey } from './values';

type ArtifactEntry = ProfileSources['artifacts'][number];

/** Percentages typed by hand: up to two decimals, no grouping. */
const PERCENT: Intl.NumberFormatOptions = { maximumFractionDigits: 2, useGrouping: false };

export interface ArtifactSheetProps {
  profile: Profile;
  entryId: string;
  summary: TotalsSummary;
  onClose: () => void;
}

export function ArtifactSheet({ profile, entryId, summary, onClose }: ArtifactSheetProps) {
  const entry = profile.sources.artifacts.find((candidate) => candidate.id === entryId);
  if (entry === undefined) return null;
  const record = artifactRecord(entry.artifactId);
  const specialKey: SpecialKey | undefined = record?.special?.key;

  const patch = (update: (current: ArtifactEntry) => ArtifactEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      artifacts: sources.artifacts.map((current) => (current.id === entry.id ? update(current) : current)),
    }));
  };

  const manualField = (bucket: 'health' | 'strength', key: BonusKey) => (
    <NumberStepper
      label={`${BONUS_LABELS[key]} ${bucket}`}
      size="sm"
      suffix="%"
      step={0.1}
      allowEmpty
      formatOptions={PERCENT}
      value={entry.manual?.[bucket]?.[key] ?? null}
      onChange={(next) => {
        patch((current) => ({
          ...current,
          manual: { ...current.manual, [bucket]: singleKey(key, next) },
        }));
      }}
    />
  );

  return (
    <SourceSheet
      title={record?.name ?? entry.artifactId}
      where={WHERE.artifact}
      summary={summary}
      onClose={onClose}
      removeLabel="Remove artifact"
      onRemove={() => {
        removeSourceEntry(profile.id, 'artifacts', entry.id);
        onClose();
      }}
    >
      <Stack gap={3}>
        <Select
          label="Artifact"
          value={entry.artifactId}
          options={artifactTable.map((artifact) => ({ value: artifact.id, label: artifact.name }))}
          onChange={(artifactId) => {
            const next = artifactRecord(artifactId);
            patch((current) => ({
              ...current,
              artifactId,
              star: starKeys(next).includes(current.star) ? current.star : (starKeys(next)[0] ?? '0.0'),
            }));
          }}
        />
        <Grid cols={{ base: 1, sm: 2 }} gap={3}>
          <NumberStepper
            label="Level"
            value={entry.level}
            min={1}
            max={60}
            onChange={(next) => {
              patch((current) => ({ ...current, level: next ?? 1 }));
            }}
          />
          <Select
            label="Star rating"
            value={entry.star}
            options={starKeys(record).map((star) => ({ value: star, label: `★ ${star}` }))}
            onChange={(star) => {
              patch((current) => ({ ...current, star }));
            }}
          />
        </Grid>

        {artifactHasLevels(record) ? (
          <FieldGroup label="Worth right now">
            <WorthList
              lines={describeContribution(artifactWorth(record, entry))}
              empty="Nothing at this level yet."
            />
          </FieldGroup>
        ) : (
          <FieldGroup label="Values you type">
            <Banner tone="warn">
              We have not measured this artifact&apos;s table yet, so the level and stars above only record
              what you own. Type what its card shows.
            </Banner>
            <Grid cols={{ base: 1, sm: 2 }} gap={2}>
              {record?.health && manualField('health', record.health.key)}
              {record?.strength && manualField('strength', record.strength.key)}
              {specialKey !== undefined && (
                <NumberStepper
                  label={SPECIAL_LABELS[specialKey]}
                  size="sm"
                  suffix="%"
                  step={0.1}
                  allowEmpty
                  formatOptions={PERCENT}
                  value={entry.manual?.special?.[specialKey] ?? null}
                  onChange={(next) => {
                    patch((current) => ({
                      ...current,
                      manual: { ...current.manual, special: singleKey(specialKey, next) },
                    }));
                  }}
                />
              )}
            </Grid>
          </FieldGroup>
        )}

        <FieldGroup label="Random bonus">
          <Grid cols={{ base: 1, sm: 2 }} gap={2}>
            <Select
              label="Rolled on"
              size="sm"
              value={entry.random?.option ?? ''}
              options={[
                { value: '', label: 'None' },
                ...(record?.randomBonusOptions ?? []).map((option) => ({
                  value: option,
                  label: humanizeOption(option),
                })),
              ]}
              onChange={(option) => {
                patch((current) => {
                  if (option === '') {
                    const { random: _dropped, ...rest } = current;
                    return rest;
                  }
                  return { ...current, random: { option, value: current.random?.value ?? 0 } };
                });
              }}
            />
            <NumberStepper
              label="Random bonus"
              size="sm"
              suffix="%"
              step={0.1}
              allowEmpty
              formatOptions={PERCENT}
              isDisabled={entry.random === undefined}
              value={entry.random?.value ?? null}
              onChange={(next) => {
                patch((current) =>
                  current.random === undefined
                    ? current
                    : { ...current, random: { ...current.random, value: next ?? 0 } },
                );
              }}
            />
          </Grid>
        </FieldGroup>
      </Stack>
    </SourceSheet>
  );
}
