import { useState } from 'react';

import { mintSourceId, removePermanentSource, updateSources } from '@/state/actions/bonuses';
import { BUILTIN_PERMANENT_SOURCES } from '@/state/schema';
import type { BuiltinPermanentSource, Profile, ProfileSources } from '@/state/schema';

import { PlusIcon } from '../../icons';
import { Button, Pill } from '../../primitives';
import { BonusKeyGrid } from './BonusKeyGrid';
import { Block, PillRow, SourceDialog } from './parts';
import { applyBonusValues, readBonusValues } from './values';

type PermanentEntry = ProfileSources['permanent'][number];

/** Where each of the eight builtin editors is read in game. Our own wording, one line each. */
const WHERE: Record<BuiltinPermanentSource, string> = {
  heroTalents: 'Hero screen → Talents: add up the health and strength lines of the talents you unlocked.',
  hallOfFame: 'City → Hall of Fame: the army bonuses the building lists on its info panel.',
  customization: 'Profile → Customization: frames, portraits and city looks that carry an army bonus.',
  armyModernization: 'Academy → Research → the Army Modernization branch totals.',
  monstersBoost: 'Academy → Research → the Monsters branch, one line per race.',
  clanTechnologies: 'Clan → Technologies: the army lines your clan has already researched.',
  clanCapitalAppearance: 'Clan → Capital: the bonuses the capital appearance grants every member.',
  unionOfTriumph: 'Union of Triumph: the bonus for the number of Golden Passes on the account.',
};

const CUSTOM_NOTE =
  'Anything permanent the list above misses. Read the percentage off the screen that grants it and type it on the key it applies to.';

const ORDER = new Map<string, number>(BUILTIN_PERMANENT_SOURCES.map((id, index) => [id, index]));

/** Builtin editors first, in the order the schema fixes them, then the rows the player added. */
function sortEntries(entries: readonly PermanentEntry[]): PermanentEntry[] {
  return [...entries].sort((a, b) => (ORDER.get(a.id) ?? 99) - (ORDER.get(b.id) ?? 99));
}

function noteFor(entry: PermanentEntry): string {
  return entry.builtin === undefined ? CUSTOM_NOTE : WHERE[entry.builtin];
}

/** How many keys an editor has values on, shown on its pill so a filled source is visible at a glance. */
function filledCount(entry: PermanentEntry): number {
  return (
    Object.keys(entry.health).length +
    Object.keys(entry.strength).length +
    Object.keys(entry.special ?? {}).length
  );
}

/**
 * Permanent sources (S-14): the eight editors every account has, plus any the player adds. They are
 * always counted — there is no march where the Hall of Fame stops working — so the pills only carry a
 * gear, no on/off.
 */
export function PermanentBlock({ profile }: { profile: Profile }) {
  const [editing, setEditing] = useState<string | null>(null);
  const entries = sortEntries(profile.sources.permanent);
  const entry = entries.find((candidate) => candidate.id === editing);

  const patch = (id: string, update: (current: PermanentEntry) => PermanentEntry): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      permanent: sources.permanent.map((current) => (current.id === id ? update(current) : current)),
    }));
  };

  const add = (): void => {
    const created: PermanentEntry = {
      id: mintSourceId(),
      name: 'New permanent source',
      health: {},
      strength: {},
    };
    updateSources(profile.id, (sources) => ({ ...sources, permanent: [...sources.permanent, created] }));
    setEditing(created.id);
  };

  return (
    <Block
      title="Permanent"
      note="Bonuses your account always has. Type each one once; they count on every march, so they have no on/off switch."
      actions={
        <Button icon={<PlusIcon />} onClick={add}>
          Add a permanent source
        </Button>
      }
    >
      <PillRow>
        {entries.map((source) => {
          const filled = filledCount(source);
          return (
            <Pill
              key={source.id}
              locked
              on
              label={source.name || 'Permanent source'}
              detail={filled === 0 ? 'empty' : `${String(filled)} keys`}
              editLabel={`Edit ${source.name || 'permanent source'}`}
              onToggle={() => undefined}
              onEdit={() => {
                setEditing(source.id);
              }}
            />
          );
        })}
      </PillRow>

      {entry !== undefined && (
        <SourceDialog
          open
          onClose={() => {
            setEditing(null);
          }}
          title={entry.name || 'Permanent source'}
          note={noteFor(entry)}
          {...(entry.builtin === undefined
            ? {
                onRemove: () => {
                  removePermanentSource(profile.id, entry.id);
                  setEditing(null);
                },
                removeLabel: 'Remove this source',
              }
            : {})}
        >
          {entry.builtin === undefined && (
            <label className="block">
              <span className="text-muted text-xs font-medium">Name</span>
              <input
                value={entry.name}
                onChange={(event) => {
                  const name = event.target.value;
                  patch(entry.id, (current) => ({ ...current, name }));
                }}
                className="tap border-line bg-surface text-fg mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
              />
            </label>
          )}
          <BonusKeyGrid
            scope={entry.name || 'Permanent'}
            value={readBonusValues(entry)}
            onChange={(next) => {
              patch(entry.id, (current) => applyBonusValues(current, next));
            }}
          />
        </SourceDialog>
      )}
    </Block>
  );
}
