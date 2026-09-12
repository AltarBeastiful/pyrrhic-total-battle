import { titles as titleTable } from '@/data';
import { setTitleOwned, toggleActiveSource } from '@/state/actions/bonuses';
import type { BattleSetup, Profile } from '@/state/schema';

import { Button, HelpNote, Pill, Popover, Toggle } from '../../primitives';
import { describeContribution } from './labels';
import { Block, PillRow } from './parts';

const SORTED = [...titleTable].sort((a, b) => a.name.localeCompare(b.name));

/**
 * Titles (D-02, kept simple on purpose): the account owns a set of titles, and a march wears the ones
 * that apply. A title the tables do not know yet can still be entered as a custom source.
 */
export function TitlesBlock({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const owned = profile.sources.titles;
  const active = setup.active.titles;
  const ownedRecords = SORTED.filter((record) => owned.includes(record.id));

  return (
    <Block
      title="Titles"
      note="Kingdom → Titles: the titles your account currently holds. Tick the ones you own, then switch on the one you are wearing for this march."
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
                  <span className="text-muted block text-xs">
                    {describeContribution(record.bonus).join(' · ') || 'No bonus'}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </Popover>
      }
    >
      <PillRow>
        {ownedRecords.map((record) => (
          <Pill
            key={record.id}
            label={record.name}
            on={active.includes(record.id)}
            onToggle={(next) => {
              toggleActiveSource('titles', record.id, next);
            }}
          />
        ))}
      </PillRow>
      {ownedRecords.length === 0 && (
        <HelpNote>
          No title owned yet. Open &ldquo;Manage titles&rdquo; to tick the ones your account holds; a title
          the list is missing can be typed as a custom source below.
        </HelpNote>
      )}
    </Block>
  );
}
