import { titles as titleTable } from '@/data';
import { setTitleOwned, toggleActiveSource } from '@/state/actions/bonuses';
import type { BattleSetup, Profile } from '@/state/schema';

import { Button, HelpNote, Pill, Popover, Toggle } from '../../primitives';
import { BlockGlyph, KeyGlyph } from './glyphs';
import { chipValue, describeContribution } from './labels';
import { Block, ChipGrid, ChipValueText } from './parts';

const SORTED = [...titleTable].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Titles (D-02, kept simple on purpose): the account owns a set of titles, and a march wears the ones
 * that apply. A title the tables do not know yet can still be typed as a source of your own.
 */
export function TitlesBlock({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const owned = profile.sources.titles;
  const active = setup.active.titles;
  const ownedRecords = SORTED.filter((record) => owned.includes(record.id));

  return (
    <Block
      title="Titles"
      icon={<BlockGlyph name="titles" />}
      description="Tick the titles you hold, then switch on the one you wear for this march."
      where="Kingdom → Titles — the holder is named next to each title."
      actions={
        <Popover
          label="Titles you own"
          trigger={<Button>Manage titles</Button>}
          className="max-w-[min(26rem,calc(100vw-1.5rem))]"
        >
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {SORTED.map((record) => (
              <div key={record.id} className="border-line flex items-start gap-3 border-b pb-2 last:border-0">
                <Toggle
                  label={record.name}
                  hideLabel
                  checked={owned.includes(record.id)}
                  onChange={(next) => {
                    setTitleOwned(profile.id, record.id, next);
                  }}
                />
                <span className="min-w-0">
                  <span className="text-sm font-medium">{record.name}</span>
                  <span className="text-muted nums block text-xs">
                    {describeContribution(record.bonus).join(' · ') || 'No bonus'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Popover>
      }
    >
      <ChipGrid>
        {ownedRecords.map((record) => {
          const value = chipValue(record.bonus, 1);
          return (
            <Pill
              key={record.id}
              label={record.name}
              badge={<KeyGlyph name={value.key} />}
              {...(value.text === '' ? {} : { detail: <ChipValueText>{value.text}</ChipValueText> })}
              on={active.includes(record.id)}
              onToggle={(next) => {
                toggleActiveSource('titles', record.id, next);
              }}
            />
          );
        })}
      </ChipGrid>
      {ownedRecords.length === 0 && (
        <HelpNote>
          No title yet. Open &ldquo;Manage titles&rdquo; and tick the ones your account holds; a title the
          list is missing can be typed as a source of your own below.
        </HelpNote>
      )}
    </Block>
  );
}
