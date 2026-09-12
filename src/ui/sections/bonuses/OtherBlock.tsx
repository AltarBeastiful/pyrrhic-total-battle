import { useState } from 'react';

import { heroes as heroTable, otherPills as otherPillTable, vip as vipTable } from '@/data';
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
import { BlockGlyph, KeyGlyph } from './glyphs';
import { chipValue, describeContribution } from './labels';
import type { BonusLike } from './labels';
import { Block, ChipGrid, ChipValueText, FieldGroup, SourceDialog } from './parts';
import { applyBonusValues, readBonusValues } from './values';

type CustomEntry = ProfileSources['custom'][number];
type Editor = 'vip' | 'dragon' | 'remainder' | { custom: string };

/** The highest VIP level the game currently sells. */
const MAX_VIP_LEVEL = 15;

const VIP_NOTE = 'the VIP screen — your level, and the army bonus written next to it.';
const DRAGON_NOTE =
  'the Dragon screen — the army bonuses it grants at its current level, plus what its equipped runes add.';
const REMAINDER_NOTE =
  'a real battle report, or the march window on a monster: compare the army bonuses it lists with the totals below and type the difference here.';
const CUSTOM_NOTE =
  'wherever the bonus comes from — a title we do not know, a temporary buff, a new source. Type the percentage on the key it applies to.';

/** What VIP is worth right now: the table row, or the values you typed when we have no row. */
function vipBonus(profile: Profile): BonusLike {
  const { vipLevel, vipManual } = profile.sources;
  if (!vipNeedsManual(profile)) {
    return vipTable.find((entry) => entry.level === vipLevel)?.bonus ?? {};
  }
  if (!vipManual) return {};
  return { health: { army: vipManual.health }, strength: { army: vipManual.strength } };
}

/**
 * Other sources (S-16): the ones that live on their own screen — VIP, your dragon, your hero, the clan
 * and kingdom bonuses — plus the remainder a battle report leaves unexplained and any source you type
 * yourself.
 */
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

  const vipValue = chipValue(vipBonus(profile), 1);
  const dragonValue = chipValue(sources.dragon, 1);
  const remainderValue = chipValue(sources.unknown, 1);

  return (
    <Block
      title="Other"
      icon={<BlockGlyph name="other" />}
      description="VIP, your dragon, your hero, the clan and kingdom bonuses, and anything left over."
      where="each of these has a screen of its own — open a chip's gear and the editor names it."
      actions={
        <Button icon={<PlusIcon />} onClick={addCustom}>
          Add a source
        </Button>
      }
    >
      <ChipGrid>
        <Pill
          label="VIP"
          badge={<KeyGlyph name={vipValue.key} />}
          detail={
            <ChipValueText>
              {`Level ${String(sources.vipLevel)}${vipValue.text === '' ? '' : ` · ${vipValue.text}`}`}
            </ChipValueText>
          }
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
          badge={<KeyGlyph name={dragonValue.key} />}
          detail={<ChipValueText>{dragonValue.text || 'nothing typed yet'}</ChipValueText>}
          on={active.dragon}
          onToggle={(next) => {
            setActiveFlag('dragon', next);
          }}
          onEdit={() => {
            setEditor('dragon');
          }}
        />
        <Pill
          label="Unexplained remainder"
          badge={<KeyGlyph name={remainderValue.key} />}
          detail={<ChipValueText>{remainderValue.text || 'nothing typed yet'}</ChipValueText>}
          on={active.unknown}
          onToggle={(next) => {
            setActiveFlag('unknown', next);
          }}
          onEdit={() => {
            setEditor('remainder');
          }}
        />
        {otherPillTable.map((record) => {
          const value = chipValue(record.bonus, 1);
          return (
            <Pill
              key={record.id}
              label={record.name}
              badge={<KeyGlyph name={value.key} />}
              {...(value.text === '' ? {} : { detail: <ChipValueText>{value.text}</ChipValueText> })}
              on={active.otherPills.includes(record.id)}
              onToggle={(next) => {
                toggleActiveSource('otherPills', record.id, next);
              }}
            />
          );
        })}
        {sources.custom.map((entry) => {
          const value = chipValue(entry, 1);
          return (
            <Pill
              key={entry.id}
              label={entry.name || 'Source of your own'}
              badge={<KeyGlyph name={value.key} />}
              detail={<ChipValueText>{value.text || 'nothing typed yet'}</ChipValueText>}
              on={active.custom.includes(entry.id)}
              onToggle={(next) => {
                toggleActiveSource('custom', entry.id, next);
              }}
              editLabel={`Edit ${entry.name || 'source of your own'}`}
              onEdit={() => {
                setEditor({ custom: entry.id });
              }}
            />
          );
        })}
      </ChipGrid>

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
        <HelpNote>We have no figures for {hero.name} yet; it counts as 0 until the tables carry it.</HelpNote>
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
          <FieldGroup label="Values you type">
            <HelpNote tone="warn">
              We have not measured the VIP table yet. Type the army health and strength your VIP screen shows
              for this level.
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

      <SourceDialog
        open={editor === 'remainder'}
        onClose={close}
        title="Unexplained remainder"
        note={REMAINDER_NOTE}
      >
        <BonusKeyGrid
          scope="Remainder"
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
          title={customEntry.name || 'Source of your own'}
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
              className="tap border-field bg-surface text-fg mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
            />
          </label>
          <BonusKeyGrid
            scope={customEntry.name || 'Source'}
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
