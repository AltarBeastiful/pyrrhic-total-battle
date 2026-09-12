import { useState } from 'react';

import { captains as captainTable, orders } from '@/data';
import type { CaptainRecord } from '@/data/types';
import { mintSourceId, removeSourceEntry, toggleActiveSource, updateSources } from '@/state/actions/bonuses';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';
import { captainValue } from '@/state/derive';

import { PlusIcon } from '../../icons';
import { Button, HelpNote, NativeSelect, NumberField, Pill } from '../../primitives';
import { BONUS_LABELS, formatPercent, SPECIAL_LABELS } from './labels';
import { Block, FieldGroup, PillRow, SourceDialog } from './parts';

type CaptainEntry = ProfileSources['captains'][number];

/** Three captains ride with one march, the same limit the game puts on the march screen. */
export const MAX_ACTIVE_CAPTAINS = 3;

const NOTE =
  'Captains screen: open a captain and read its base level and its star level. The bonus is the level times the captain’s own rate, plus what the stars add.';

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

/** The three lines the editor shows: what this level and star combination is worth right now. */
function computedLines(record: CaptainRecord | undefined, entry: CaptainEntry): string[] {
  if (!record) return [];
  const lines: string[] = [];
  if (record.health) {
    const value = captainValue(record.health, entry.level, entry.star);
    lines.push(`${BONUS_LABELS[record.health.key]} health ${formatPercent(value)}`);
  }
  if (record.strength) {
    const value = captainValue(record.strength, entry.level, entry.star);
    lines.push(`${BONUS_LABELS[record.strength.key]} strength ${formatPercent(value)}`);
  }
  if (record.special) {
    const value = captainValue(record.special, entry.level, entry.star);
    lines.push(`${SPECIAL_LABELS[record.special.key]} ${formatPercent(value)}`);
  }
  return lines;
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
      note="Captains screen: your captains and their levels. Add the ones you own, then switch on the three riding with this march."
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
      <PillRow>
        {entries.map((current) => {
          const captain = recordOf(current.captainId);
          const on = active.includes(current.id);
          return (
            <Pill
              key={current.id}
              label={captain?.name ?? current.captainId}
              detail={`L${String(current.level)} ★${String(current.star)}`}
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
      </PillRow>
      {entries.length === 0 && <HelpNote>No captain added yet.</HelpNote>}
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
              <ul className="text-sm">
                {computedLines(record, entry).map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </FieldGroup>
          ) : (
            <HelpNote tone="warn">
              No bonus data yet for this captain. It stays in the list, and counts as 0 until the tables carry
              its numbers.
            </HelpNote>
          )}
        </SourceDialog>
      )}
    </Block>
  );
}
