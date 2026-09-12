import { useState } from 'react';
import type { ReactElement } from 'react';

import { artifacts as artifactTable } from '@/data';
import type { ArtifactRecord, BonusKey, SpecialKey } from '@/data/types';
import { mintSourceId, removeSourceEntry, toggleActiveSource, updateSources } from '@/state/actions/bonuses';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';

import { PlusIcon } from '../../icons';
import { Button, HelpNote, NativeSelect, NumberField, Pill } from '../../primitives';
import { BONUS_LABELS, FALLBACK_STAR_KEYS, humanizeOption, SPECIAL_LABELS } from './labels';
import { Block, FieldGroup, PillRow, SourceDialog } from './parts';

type ArtifactEntry = ProfileSources['artifacts'][number];

/** Three artifacts ride with one march. */
export const MAX_ACTIVE_ARTIFACTS = 3;

const NOTE =
  'Artifacts screen: each artifact shows its level and its star rating, and the random bonus it rolled. Type them exactly as the artifact card shows them.';

const recordOf = (artifactId: string): ArtifactRecord | undefined =>
  artifactTable.find((record) => record.id === artifactId);

/** The star ratings this artifact's table knows; artifacts without a table get the full notation. */
function starKeys(record: ArtifactRecord | undefined): string[] {
  const table =
    record?.health?.levels?.star ?? record?.strength?.levels?.star ?? record?.special?.levels?.star;
  const keys = table === undefined ? [] : Object.keys(table);
  return keys.length === 0 ? FALLBACK_STAR_KEYS : ['0.0', ...keys.filter((key) => key !== '0.0')];
}

const hasLevels = (record: ArtifactRecord | undefined): boolean =>
  (record?.health?.levels ?? record?.strength?.levels ?? record?.special?.levels) !== undefined;

/** A one-key map, which is all an artifact's hand-typed value ever needs. */
function singleKey<K extends string>(key: K, value: number | null): Partial<Record<K, number>> {
  return value === null ? {} : ({ [key]: value } as Partial<Record<K, number>>);
}

/**
 * Artifacts (S-15): up to three. When the tables carry the artifact's level curve the bonus is read from
 * it; the ones we have not measured yet are typed by hand and say so.
 */
export function ArtifactsBlock({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const [editing, setEditing] = useState<string | null>(null);

  const entries = profile.sources.artifacts;
  const active = setup.active.artifacts;
  const atLimit = active.length >= MAX_ACTIVE_ARTIFACTS;
  const entry = entries.find((candidate) => candidate.id === editing);
  const record = entry ? recordOf(entry.artifactId) : undefined;
  const specialKey: SpecialKey | undefined = record?.special?.key;
  const owned = new Set(entries.map((current) => current.artifactId));
  const nextArtifact = artifactTable.find((candidate) => !owned.has(candidate.id)) ?? artifactTable[0];

  const patch = (id: string, update: (current: ArtifactEntry) => ArtifactEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      artifacts: sources.artifacts.map((current) => (current.id === id ? update(current) : current)),
    }));
  };

  const add = (): void => {
    if (!nextArtifact) return;
    const created: ArtifactEntry = {
      id: mintSourceId(),
      artifactId: nextArtifact.id,
      level: 1,
      star: starKeys(nextArtifact)[0] ?? '0.0',
    };
    updateSources(profile.id, (sources) => ({ ...sources, artifacts: [...sources.artifacts, created] }));
    if (!atLimit) toggleActiveSource('artifacts', created.id, true);
    setEditing(created.id);
  };

  const manualField = (
    bucket: 'health' | 'strength',
    key: BonusKey,
    current: ArtifactEntry,
  ): ReactElement => (
    <NumberField
      label={`Hand-typed ${BONUS_LABELS[key]} ${bucket}`}
      decimal
      suffix="%"
      value={current.manual?.[bucket]?.[key] ?? null}
      onChange={(next) => {
        patch(current.id, (value) => ({
          ...value,
          manual: { ...value.manual, [bucket]: singleKey(key, next) },
        }));
      }}
    />
  );

  return (
    <Block
      title="Artifacts"
      note="Artifacts screen: the artifacts equipped on your hero. Three of them count on a march."
      actions={
        <Button icon={<PlusIcon />} disabled={nextArtifact === undefined} onClick={add}>
          Add an artifact
        </Button>
      }
    >
      <PillRow>
        {entries.map((current) => {
          const artifact = recordOf(current.artifactId);
          const on = active.includes(current.id);
          return (
            <Pill
              key={current.id}
              label={artifact?.name ?? current.artifactId}
              detail={`L${String(current.level)} ★${current.star}`}
              on={on}
              disabled={!on && atLimit}
              onToggle={(next) => {
                toggleActiveSource('artifacts', current.id, next);
              }}
              editLabel={`Edit ${artifact?.name ?? current.artifactId}`}
              onEdit={() => {
                setEditing(current.id);
              }}
            />
          );
        })}
      </PillRow>
      {entries.length === 0 && <HelpNote>No artifact added yet.</HelpNote>}
      {atLimit && <HelpNote>Three artifacts count at once. Switch one off to switch another on.</HelpNote>}

      {entry !== undefined && (
        <SourceDialog
          open
          onClose={() => {
            setEditing(null);
          }}
          title={record?.name ?? entry.artifactId}
          note={NOTE}
          onRemove={() => {
            removeSourceEntry(profile.id, 'artifacts', entry.id);
            setEditing(null);
          }}
          removeLabel="Remove artifact"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <NativeSelect
              label="Artifact"
              hideLabel={false}
              value={entry.artifactId}
              options={artifactTable.map((artifact) => ({ value: artifact.id, label: artifact.name }))}
              onChange={(event) => {
                const artifactId = event.target.value;
                const next = recordOf(artifactId);
                patch(entry.id, (current) => ({
                  ...current,
                  artifactId,
                  star: starKeys(next).includes(current.star) ? current.star : (starKeys(next)[0] ?? '0.0'),
                }));
              }}
            />
            <NumberField
              label="Level"
              value={entry.level}
              min={1}
              max={60}
              onChange={(next) => {
                patch(entry.id, (current) => ({ ...current, level: next ?? 1 }));
              }}
            />
            <NativeSelect
              label="Star rating"
              hideLabel={false}
              value={entry.star}
              options={starKeys(record).map((star) => ({ value: star, label: `★ ${star}` }))}
              onChange={(event) => {
                const star = event.target.value;
                patch(entry.id, (current) => ({ ...current, star }));
              }}
            />
          </div>

          {!hasLevels(record) && (
            <FieldGroup label="Values by hand">
              <HelpNote tone="warn">
                We have not measured this artifact&apos;s level table yet, so the level and star above are
                only a record of what you own. Type what the artifact card shows.
              </HelpNote>
              <div className="grid gap-3 sm:grid-cols-2">
                {record?.health && manualField('health', record.health.key, entry)}
                {record?.strength && manualField('strength', record.strength.key, entry)}
                {specialKey !== undefined && (
                  <NumberField
                    label={`Hand-typed ${SPECIAL_LABELS[specialKey]}`}
                    decimal
                    suffix="%"
                    value={entry.manual?.special?.[specialKey] ?? null}
                    onChange={(next) => {
                      patch(entry.id, (current) => ({
                        ...current,
                        manual: { ...current.manual, special: singleKey(specialKey, next) },
                      }));
                    }}
                  />
                )}
              </div>
            </FieldGroup>
          )}

          <FieldGroup label="Random bonus">
            <div className="grid gap-3 sm:grid-cols-2">
              <NativeSelect
                label="Random bonus"
                hideLabel={false}
                value={entry.random?.option ?? ''}
                options={[
                  { value: '', label: 'None' },
                  ...(record?.randomBonusOptions ?? []).map((option) => ({
                    value: option,
                    label: humanizeOption(option),
                  })),
                ]}
                onChange={(event) => {
                  const option = event.target.value;
                  patch(entry.id, (current) => {
                    if (option === '') {
                      const { random: _dropped, ...rest } = current;
                      return rest;
                    }
                    return { ...current, random: { option, value: current.random?.value ?? 0 } };
                  });
                }}
              />
              <NumberField
                label="Random bonus value"
                decimal
                suffix="%"
                disabled={entry.random === undefined}
                value={entry.random?.value ?? null}
                onChange={(next) => {
                  patch(entry.id, (current) =>
                    current.random === undefined
                      ? current
                      : { ...current, random: { ...current.random, value: next ?? 0 } },
                  );
                }}
              />
            </div>
          </FieldGroup>
        </SourceDialog>
      )}
    </Block>
  );
}
