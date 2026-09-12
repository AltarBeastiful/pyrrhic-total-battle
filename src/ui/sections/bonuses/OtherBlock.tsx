import { useState } from 'react';

import { heroes as heroTable, otherPills as otherPillTable } from '@/data';
import { vipNeedsManual } from '@/state/derive';
import {
  mintSourceId,
  removeSourceEntry,
  setActiveFlag,
  toggleActiveSource,
  updateSources,
} from '@/state/actions/bonuses';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';

import { PlusIcon } from '../../icons';
import { Button, HelpNote, NativeSelect, NumberField, Pill, Toggle } from '../../primitives';
import { BonusKeyGrid } from './BonusKeyGrid';
import { describeContribution } from './labels';
import { Block, FieldGroup, PillRow, SourceDialog } from './parts';
import { applyBonusValues, readBonusValues } from './values';

type CustomEntry = ProfileSources['custom'][number];
type Editor = 'vip' | 'dragon' | 'unknown' | { custom: string };

/** The highest VIP level the game currently sells. */
const MAX_VIP_LEVEL = 15;

const VIP_NOTE =
  'VIP screen: your current VIP level. The army bonus it grants is on the same screen, next to the level.';
const DRAGON_NOTE =
  'Dragon screen: the army bonuses your dragon grants at its current level, plus what its equipped runes add.';
const UNKNOWN_NOTE =
  'For the gap between this page and a real battle report: type here what is missing so the totals match the game.';
const CUSTOM_NOTE =
  'Anything the sections above do not cover — a title we do not know, a temporary buff, a new source. Type the percentage on the key it applies to.';

export function OtherBlock({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const { sources } = profile;
  const { active } = setup;
  const hero = heroTable.find((record) => record.id === sources.hero);
  const customEntry =
    editor !== null && typeof editor === 'object'
      ? sources.custom.find((entry) => entry.id === editor.custom)
      : undefined;
  const close = (): void => {
    setEditor(null);
  };

  const patchCustom = (id: string, update: (current: CustomEntry) => CustomEntry): void => {
    updateSources(profile.id, (current) => ({
      ...current,
      custom: current.custom.map((entry) => (entry.id === id ? update(entry) : entry)),
    }));
  };

  const addCustom = (): void => {
    const created: CustomEntry = { id: mintSourceId(), name: 'New source', health: {}, strength: {} };
    updateSources(profile.id, (current) => ({ ...current, custom: [...current.custom, created] }));
    toggleActiveSource('custom', created.id, true);
    setEditor({ custom: created.id });
  };

  const setHero = (heroId: string): void => {
    updateSources(profile.id, (current) => {
      if (heroId === '') {
        const { hero: _dropped, ...rest } = current;
        return rest;
      }
      return { ...current, hero: heroId };
    });
    setActiveFlag('hero', heroId !== '');
  };

  return (
    <Block
      title="Other"
      note="The sources that live on their own screens: VIP, your dragon, your hero, the three +25 % bonuses, and whatever is left over."
      actions={
        <Button icon={<PlusIcon />} onClick={addCustom}>
          Add a custom source
        </Button>
      }
    >
      <PillRow>
        <Pill
          label="VIP"
          detail={`level ${String(sources.vipLevel)}`}
          on={active.vip}
          onToggle={(next) => {
            setActiveFlag('vip', next);
          }}
          onEdit={() => {
            setEditor('vip');
          }}
        />
        <Pill
          label="Dragon"
          on={active.dragon}
          onToggle={(next) => {
            setActiveFlag('dragon', next);
          }}
          onEdit={() => {
            setEditor('dragon');
          }}
        />
        <Pill
          label="Unknown sources"
          on={active.unknown}
          onToggle={(next) => {
            setActiveFlag('unknown', next);
          }}
          onEdit={() => {
            setEditor('unknown');
          }}
        />
        {otherPillTable.map((record) => (
          <Pill
            key={record.id}
            label={record.name}
            on={active.otherPills.includes(record.id)}
            onToggle={(next) => {
              toggleActiveSource('otherPills', record.id, next);
            }}
          />
        ))}
        {sources.custom.map((entry) => (
          <Pill
            key={entry.id}
            label={entry.name || 'Custom source'}
            on={active.custom.includes(entry.id)}
            onToggle={(next) => {
              toggleActiveSource('custom', entry.id, next);
            }}
            editLabel={`Edit ${entry.name || 'custom source'}`}
            onEdit={() => {
              setEditor({ custom: entry.id });
            }}
          />
        ))}
      </PillRow>

      <div className="flex flex-wrap items-end gap-3">
        <NativeSelect
          label="Hero"
          hideLabel={false}
          className="w-44"
          value={sources.hero ?? ''}
          options={[
            { value: '', label: 'No hero' },
            ...heroTable.map((record) => ({ value: record.id, label: record.name })),
          ]}
          onChange={(event) => {
            setHero(event.target.value);
          }}
        />
        {hero !== undefined && (
          <Toggle
            label="Hero marches with this army"
            checked={active.hero}
            onChange={(next) => {
              setActiveFlag('hero', next);
            }}
          />
        )}
      </div>
      {hero?.aloneOnly === true && (
        <HelpNote tone="warn">
          {hero.name} only grants its bonus when you march alone. We count it as switched on; switch it off
          for a group march or a reinforcement.
        </HelpNote>
      )}
      {hero !== undefined && describeContribution(hero.bonus).length === 0 && (
        <HelpNote>No bonus data yet for {hero.name}; it counts as 0 until the tables carry it.</HelpNote>
      )}

      <SourceDialog open={editor === 'vip'} onClose={close} title="VIP" note={VIP_NOTE}>
        <NativeSelect
          label="VIP level"
          hideLabel={false}
          className="w-36"
          value={String(sources.vipLevel)}
          options={Array.from({ length: MAX_VIP_LEVEL + 1 }, (_unused, level) => ({
            value: String(level),
            label: String(level),
          }))}
          onChange={(event) => {
            const vipLevel = Number.parseInt(event.target.value, 10);
            updateSources(profile.id, (current) => ({ ...current, vipLevel }));
          }}
        />
        {vipNeedsManual(profile) && (
          <FieldGroup label="Values by hand">
            <HelpNote tone="warn">
              We have not measured the VIP table yet. Type the army health and strength the VIP screen shows
              for your level.
            </HelpNote>
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="VIP army health"
                decimal
                suffix="%"
                value={sources.vipManual?.health ?? null}
                onChange={(next) => {
                  updateSources(profile.id, (current) => ({
                    ...current,
                    vipManual: { health: next ?? 0, strength: current.vipManual?.strength ?? 0 },
                  }));
                }}
              />
              <NumberField
                label="VIP army strength"
                decimal
                suffix="%"
                value={sources.vipManual?.strength ?? null}
                onChange={(next) => {
                  updateSources(profile.id, (current) => ({
                    ...current,
                    vipManual: { health: current.vipManual?.health ?? 0, strength: next ?? 0 },
                  }));
                }}
              />
            </div>
          </FieldGroup>
        )}
      </SourceDialog>

      <SourceDialog open={editor === 'dragon'} onClose={close} title="Dragon" note={DRAGON_NOTE}>
        <BonusKeyGrid
          scope="Dragon"
          value={readBonusValues(sources.dragon)}
          onChange={(next) => {
            updateSources(profile.id, (current) => ({
              ...current,
              dragon: applyBonusValues(current.dragon, next),
            }));
          }}
        />
      </SourceDialog>

      <SourceDialog open={editor === 'unknown'} onClose={close} title="Unknown sources" note={UNKNOWN_NOTE}>
        <BonusKeyGrid
          scope="Unknown"
          withSpecial={false}
          value={{ health: sources.unknown.health, strength: sources.unknown.strength }}
          onChange={(next) => {
            updateSources(profile.id, (current) => ({
              ...current,
              unknown: { health: next.health, strength: next.strength },
            }));
          }}
        />
      </SourceDialog>

      {customEntry !== undefined && (
        <SourceDialog
          open
          onClose={close}
          title={customEntry.name || 'Custom source'}
          note={CUSTOM_NOTE}
          onRemove={() => {
            removeSourceEntry(profile.id, 'custom', customEntry.id);
            close();
          }}
          removeLabel="Remove source"
        >
          <label className="block">
            <span className="text-muted text-xs font-medium">Name</span>
            <input
              value={customEntry.name}
              onChange={(event) => {
                const name = event.target.value;
                patchCustom(customEntry.id, (current) => ({ ...current, name }));
              }}
              className="tap border-line bg-surface text-fg mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
            />
          </label>
          <BonusKeyGrid
            scope={customEntry.name || 'Custom'}
            value={readBonusValues(customEntry)}
            onChange={(next) => {
              patchCustom(customEntry.id, (current) => applyBonusValues(current, next));
            }}
          />
        </SourceDialog>
      )}
    </Block>
  );
}
