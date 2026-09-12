import { useState } from 'react';

import { equipment as equipmentTable } from '@/data';
import { QUALITIES } from '@/data/types';
import type { EquipmentRecord, Quality } from '@/data/types';
import { mintSourceId, removeSourceEntry, toggleActiveSource, updateSources } from '@/state/actions/bonuses';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';

import { PlusIcon } from '../../icons';
import { Button, HelpNote, NativeSelect, Pill } from '../../primitives';
import { BonusKeyGrid } from './BonusKeyGrid';
import { describeContribution, QUALITY_LABELS } from './labels';
import { Block, FieldGroup, PillRow, SourceDialog } from './parts';

type EquipmentEntry = ProfileSources['equipment'][number];

/** Three captains carry five pieces each, so a march never has more than fifteen. */
export const MAX_EQUIPMENT = 15;

const NOTE =
  'Captain screen → equipment slots: each piece shows its type and its quality. Gems and enchantments are typed separately, because the quality table does not include them.';

const recordOf = (equipmentId: string): EquipmentRecord | undefined =>
  equipmentTable.find((record) => record.id === equipmentId);

/** Qualities the tables actually carry for this piece (a few start at uncommon). */
function qualitiesOf(record: EquipmentRecord | undefined): Quality[] {
  return QUALITIES.filter((quality) => record?.byQuality[quality] !== undefined);
}

function firstQuality(record: EquipmentRecord | undefined): Quality {
  return qualitiesOf(record)[0] ?? 'poor';
}

/** The gem / enchantment values, in the shape the 13-key grid speaks. */
function readExtra(entry: EquipmentEntry) {
  const extra = entry.extra;
  return {
    health: extra?.health ?? {},
    strength: extra?.strength ?? {},
    ...(extra?.special === undefined ? {} : { special: extra.special }),
  };
}

/**
 * Equipment (S-15): up to fifteen pieces. The bonus comes from the piece's quality row; anything a gem
 * or an enchantment adds on top is typed by hand.
 */
export function EquipmentBlock({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const [editing, setEditing] = useState<string | null>(null);

  const entries = profile.sources.equipment;
  const active = setup.active.equipment;
  const entry = entries.find((candidate) => candidate.id === editing);
  const record = entry ? recordOf(entry.equipmentId) : undefined;
  const full = entries.length >= MAX_EQUIPMENT;

  const patch = (id: string, update: (current: EquipmentEntry) => EquipmentEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      equipment: sources.equipment.map((current) => (current.id === id ? update(current) : current)),
    }));
  };

  const add = (): void => {
    const first = equipmentTable[0];
    if (!first) return;
    const created: EquipmentEntry = {
      id: mintSourceId(),
      equipmentId: first.id,
      quality: firstQuality(first),
    };
    updateSources(profile.id, (sources) => ({ ...sources, equipment: [...sources.equipment, created] }));
    toggleActiveSource('equipment', created.id, true);
    setEditing(created.id);
  };

  return (
    <Block
      title="Equipment"
      note="Captain screen: the five slots of each captain. Add one entry per piece you actually march with."
      actions={
        <Button icon={<PlusIcon />} disabled={full} onClick={add}>
          Add a piece
        </Button>
      }
    >
      <PillRow>
        {entries.map((current) => {
          const piece = recordOf(current.equipmentId);
          const label =
            current.name !== undefined && current.name !== ''
              ? current.name
              : (piece?.name ?? current.equipmentId);
          return (
            <Pill
              key={current.id}
              label={label}
              detail={QUALITY_LABELS[current.quality]}
              on={active.includes(current.id)}
              onToggle={(next) => {
                toggleActiveSource('equipment', current.id, next);
              }}
              editLabel={`Edit ${label}`}
              onEdit={() => {
                setEditing(current.id);
              }}
            />
          );
        })}
      </PillRow>
      {entries.length === 0 && <HelpNote>No piece added yet.</HelpNote>}
      {full && <HelpNote>Fifteen pieces is the most three captains can carry.</HelpNote>}

      {entry !== undefined && (
        <SourceDialog
          open
          onClose={() => {
            setEditing(null);
          }}
          title={record?.name ?? entry.equipmentId}
          note={NOTE}
          onRemove={() => {
            removeSourceEntry(profile.id, 'equipment', entry.id);
            setEditing(null);
          }}
          removeLabel="Remove piece"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <NativeSelect
              label="Equipment type"
              hideLabel={false}
              value={entry.equipmentId}
              options={equipmentTable.map((piece) => ({ value: piece.id, label: piece.name }))}
              onChange={(event) => {
                const equipmentId = event.target.value;
                const next = recordOf(equipmentId);
                patch(entry.id, (current) => ({
                  ...current,
                  equipmentId,
                  quality: qualitiesOf(next).includes(current.quality) ? current.quality : firstQuality(next),
                }));
              }}
            />
            <NativeSelect
              label="Quality"
              hideLabel={false}
              value={entry.quality}
              options={qualitiesOf(record).map((quality) => ({
                value: quality,
                label: QUALITY_LABELS[quality],
              }))}
              onChange={(event) => {
                const quality = event.target.value as Quality;
                patch(entry.id, (current) => ({ ...current, quality }));
              }}
            />
          </div>
          <label className="block">
            <span className="text-muted text-xs font-medium">Name (optional)</span>
            <input
              value={entry.name ?? ''}
              placeholder="Which captain wears it"
              onChange={(event) => {
                const name = event.target.value;
                patch(entry.id, (current) => ({ ...current, name }));
              }}
              className="tap border-field bg-surface text-fg mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
            />
          </label>

          <FieldGroup label="Worth right now">
            <ul className="text-sm">
              {describeContribution(record?.byQuality[entry.quality] ?? {}).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </FieldGroup>

          <details className="border-line rounded-lg border px-3 py-2">
            <summary className="text-muted tap flex cursor-pointer items-center text-xs font-semibold tracking-wide uppercase">
              Gem and enchantment
            </summary>
            <div className="mt-2">
              <BonusKeyGrid
                scope="Gem"
                value={readExtra(entry)}
                onChange={(next) => {
                  patch(entry.id, (current) => ({
                    ...current,
                    extra: {
                      health: next.health,
                      strength: next.strength,
                      ...(next.special === undefined ? {} : { special: next.special }),
                    },
                  }));
                }}
              />
            </div>
          </details>
        </SourceDialog>
      )}
    </Block>
  );
}
