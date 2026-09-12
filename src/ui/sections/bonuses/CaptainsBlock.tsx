import { useState } from 'react';

import { captains as captainTable, orders } from '@/data';
import type { CaptainRecord } from '@/data/types';
import { mintSourceId, removeSourceEntry, toggleActiveSource, updateSources } from '@/state/actions/bonuses';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';
import { captainValue } from '@/state/derive';

import { PlusIcon } from '../../icons';
import { Button, HelpNote, NativeSelect, NumberField, Pill } from '../../primitives';
import { BlockGlyph, KeyGlyph } from './glyphs';
import { chipValue, describeContribution } from './labels';
import type { BonusLike } from './labels';
import { Block, ChipGrid, ChipValueText, FieldGroup, SourceDialog, WorthList } from './parts';
import { singleKey } from './values';

type CaptainEntry = ProfileSources['captains'][number];

/** Three captains ride with one march, the same limit the game puts on the march screen. */
export const MAX_ACTIVE_CAPTAINS = 3;

const NOTE =
  'the Captains screen — open a captain to read its level and its stars. The bonus is the level times the captain’s own rate, plus what the stars add.';

const RANK = new Map<string, number>(orders.captains.map((id, index) => [id, index]));

/** The picker order of the data tables, with anything the order table misses appended by name. */
function sortRecords(records: readonly CaptainRecord[]): CaptainRecord[] {
  return [...records].sort((a, b) => {
    const rankA = RANK.get(a.id);
    const rankB = RANK.get(b.id);
    if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
    if (rankA !== undefined) return -1;
    if (rankB !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });
}

const SORTED = sortRecords(captainTable);

const recordOf = (captainId: string): CaptainRecord | undefined =>
  captainTable.find((record) => record.id === captainId);

const hasData = (record: CaptainRecord | undefined): boolean =>
  record?.health !== undefined || record?.strength !== undefined || record?.special !== undefined;

/** What this level and star combination is worth right now, in the shape every value helper reads. */
function worthNow(record: CaptainRecord | undefined, entry: CaptainEntry): BonusLike {
  if (!record) return {};
  return {
    ...(record.health
      ? { health: singleKey(record.health.key, captainValue(record.health, entry.level, entry.star)) }
      : {}),
    ...(record.strength
      ? {
          strength: singleKey(record.strength.key, captainValue(record.strength, entry.level, entry.star)),
        }
      : {}),
    ...(record.special
      ? { special: singleKey(record.special.key, captainValue(record.special, entry.level, entry.star)) }
      : {}),
  };
}

/**
 * Captains (S-15). The profile owns a captain once, with its level and stars; a setup decides which
 * three of them ride on this march.
 */
export function CaptainsBlock({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [picked, setPicked] = useState('');

  const entries = profile.sources.captains;
  const owned = new Set(entries.map((entry) => entry.captainId));
  const available = SORTED.filter((record) => !owned.has(record.id));
  const choice =
    picked !== '' && available.some((record) => record.id === picked) ? picked : available[0]?.id;
  const active = setup.active.captains;
  const atLimit = active.length >= MAX_ACTIVE_CAPTAINS;
  const entry = entries.find((candidate) => candidate.id === editing);
  const record = entry ? recordOf(entry.captainId) : undefined;

  const patch = (id: string, update: (current: CaptainEntry) => CaptainEntry): void => {
    updateSources(profile.id, (sources: ProfileSources) => ({
      ...sources,
      captains: sources.captains.map((current) => (current.id === id ? update(current) : current)),
    }));
  };

  const add = (): void => {
    if (choice === undefined) return;
    const created: CaptainEntry = { id: mintSourceId(), captainId: choice, level: 0, star: 0 };
    updateSources(profile.id, (sources) => ({ ...sources, captains: [...sources.captains, created] }));
    if (!atLimit) toggleActiveSource('captains', created.id, true);
    setEditing(created.id);
  };

  return (
    <Block
      title="Captains"
      icon={<BlockGlyph name="captains" />}
      description="The captains you own. Switch on the three riding with this march."
      where="Captains — each card shows the level and the stars you type here."
      actions={
        <>
          <NativeSelect
            label="Captain to add"
            className="w-44"
            value={choice ?? ''}
            disabled={available.length === 0}
            options={
              available.length === 0
                ? [{ value: '', label: 'All captains added' }]
                : available.map((record) => ({ value: record.id, label: record.name }))
            }
            onChange={(event) => {
              setPicked(event.target.value);
            }}
          />
          <Button icon={<PlusIcon />} disabled={available.length === 0} onClick={add}>
            Add captain
          </Button>
        </>
      }
    >
      <ChipGrid>
        {entries.map((current) => {
          const captain = recordOf(current.captainId);
          const on = active.includes(current.id);
          const value = chipValue(worthNow(captain, current));
          const detail = `L${String(current.level)} ★${String(current.star)}${value.text === '' ? '' : ` · ${value.text}`}`;
          return (
            <Pill
              key={current.id}
              label={captain?.name ?? current.captainId}
              badge={<KeyGlyph name={value.key} />}
              detail={<ChipValueText>{detail}</ChipValueText>}
              on={on}
              disabled={!on && atLimit}
              onToggle={(next) => {
                toggleActiveSource('captains', current.id, next);
              }}
              editLabel={`Edit ${captain?.name ?? current.captainId}`}
              onEdit={() => {
                setEditing(current.id);
              }}
            />
          );
        })}
      </ChipGrid>
      {entries.length === 0 && (
        <HelpNote>No captain yet. Pick one above and add it, then set its level in the editor.</HelpNote>
      )}
      {atLimit && (
        <HelpNote>Three captains ride at once. Switch one off before switching another on.</HelpNote>
      )}

      {entry !== undefined && (
        <SourceDialog
          open
          onClose={() => {
            setEditing(null);
          }}
          title={record?.name ?? entry.captainId}
          note={NOTE}
          onRemove={() => {
            removeSourceEntry(profile.id, 'captains', entry.id);
            setEditing(null);
          }}
          removeLabel="Remove captain"
        >
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Base level"
              value={entry.level}
              min={0}
              max={999}
              onChange={(next) => {
                patch(entry.id, (current) => ({ ...current, level: next ?? 0 }));
              }}
            />
            <NativeSelect
              label="Star level"
              hideLabel={false}
              value={String(entry.star)}
              options={[0, 1, 2, 3, 4, 5, 6].map((star) => ({
                value: String(star),
                label: `★ ${String(star)}`,
              }))}
              onChange={(event) => {
                const star = Number.parseInt(event.target.value, 10);
                patch(entry.id, (current) => ({ ...current, star }));
              }}
            />
          </div>
          {hasData(record) ? (
            <FieldGroup label="Worth right now">
              <WorthList
                lines={describeContribution(worthNow(record, entry))}
                empty="Nothing at this level yet."
              />
            </FieldGroup>
          ) : (
            <HelpNote tone="warn">
              We have no figures for this captain yet. It stays in your list and counts as 0 until the tables
              carry its numbers.
            </HelpNote>
          )}
        </SourceDialog>
      )}
    </Block>
  );
}
