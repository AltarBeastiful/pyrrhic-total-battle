/**
 * S-11 — Troops section (PLAN §4.2).
 *
 * Four tier ranges, per-category chips for the highest tier of guardsmen and specialists, and a preview
 * grid of every unit type the march can field, where a single tap drops a unit the account has not
 * upgraded yet. Everything is written straight to the active profile: this section describes the *account*,
 * not one march, so it never touches the battle setup.
 */
import { useId } from 'react';

import type { Category, UnitDef } from '@/data/types';
import type { ProfileTroops } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';

import { Button, HelpNote, Pill, RangeSelect, Section, cn } from '../../primitives';
import type { TierRangeValue } from '../../primitives';
import { CATEGORY_LABELS, categoriesAtTier, isChipRow, rowBounds, selectionByRow } from './rows';
import type { ChipRowId, TroopRowId } from './rows';

const number = new Intl.NumberFormat('en-US');

const POOL_WORDS = { leadership: 'leadership', authority: 'authority', dominance: 'dominance' } as const;

const HELP = (
  <>
    <p>
      A tier is the roman numeral on a unit&apos;s card: Archer I is tier 1, Archer II tier 2. Set the lowest
      and the highest tier you can train for each family. Switch engineers or monsters off when your account
      has none.
    </p>
    <p>
      You rarely unlock a whole tier at once, so the highest one gets a chip per category: switch off the ones
      you have not upgraded. For anything finer — you trained the archers but not the spearmen — tap that unit
      in the grid below and it stays out until you tap it again.
    </p>
    <p>
      <strong>Where to find it in game:</strong> the Barracks lists every tier you can train, and tapping a
      unit opens the sheet with the health, strength and leadership cost we repeat in the grid. Monsters have
      the same sheet in their own training building.
    </p>
  </>
);

function tierLabel(prefix: string, tier: number): string {
  return `${prefix}${tier}`;
}

export function TroopsSection() {
  const profile = useStore(selectActiveProfile);
  const updateProfile = useStore((state) => state.updateProfile);
  const gridId = useId();

  if (profile === undefined) return null;

  const troops = profile.troops;
  const excluded = new Set(troops.excludedUnitIds);
  const rows = selectionByRow(troops);
  const prefixes = new Map<string, string>();
  for (const { row, units } of rows) {
    for (const unit of units) prefixes.set(unit.id, row.prefix);
  }
  const all = rows.flatMap((entry) => entry.units);
  const includedCount = all.filter((unit) => !excluded.has(unit.id)).length;
  const excludedHere = all.filter((unit) => excluded.has(unit.id));

  const patch = (next: Partial<ProfileTroops>): void => {
    updateProfile(profile.id, (current) => ({ troops: { ...current.troops, ...next } }));
  };

  const setRange = (row: TroopRowId, value: TierRangeValue | null): void => {
    const ranges = {
      guardsmen: troops.guardsmen,
      specialists: troops.specialists,
      engineers: troops.engineers,
      monsters: troops.monsters,
    };
    const topTierMoved = (ranges[row]?.max ?? null) !== (value?.max ?? null);
    ranges[row] = value;
    // The chips describe one tier; when that tier moves they no longer mean anything.
    const topTierExcluded = { ...troops.topTierExcluded };
    if (topTierMoved && isChipRow(row)) topTierExcluded[row] = [];
    patch({ ...ranges, topTierExcluded });
  };

  const setCategory = (row: ChipRowId, category: Category, on: boolean): void => {
    const current = troops.topTierExcluded[row];
    const topTierExcluded = { ...troops.topTierExcluded };
    topTierExcluded[row] = on ? current.filter((item) => item !== category) : [...current, category];
    patch({ topTierExcluded });
  };

  const setUnit = (unitId: string, on: boolean): void => {
    patch({
      excludedUnitIds: on
        ? troops.excludedUnitIds.filter((id) => id !== unitId)
        : [...troops.excludedUnitIds, unitId],
    });
  };

  const restoreAll = (): void => {
    const here = new Set(all.map((unit) => unit.id));
    patch({ excludedUnitIds: troops.excludedUnitIds.filter((id) => !here.has(id)) });
  };

  return (
    <Section
      id="troops"
      title="Troops"
      description="The tiers your account has unlocked, and the unit types to leave out."
      help={HELP}
      summary={
        <span className="text-muted">
          {includedCount} unit {includedCount === 1 ? 'type' : 'types'} included
          {excludedHere.length > 0 && ` · ${excludedHere.length} left out`}
        </span>
      }
    >
      <div className="space-y-4">
        <div className="space-y-3">
          {rows.map(({ row, units }) => {
            const range = troops[row.id];
            const bounds = rowBounds(row.id);
            const chipRow = isChipRow(row.id) ? row.id : null;
            const categories = range === null || chipRow === null ? [] : categoriesAtTier(chipRow, range.max);
            return (
              <div key={row.id} className="space-y-2">
                <RangeSelect
                  label={row.label}
                  value={range}
                  min={bounds.min}
                  max={bounds.max}
                  allowNone={row.allowNone}
                  optionLabel={(tier) => tierLabel(row.prefix, tier)}
                  onChange={(value) => {
                    setRange(row.id, value);
                  }}
                />
                {chipRow !== null && range !== null && categories.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-muted text-xs">
                      Unlocked at {tierLabel(row.prefix, range.max)}:
                    </span>
                    {categories.map((category) => (
                      <Pill
                        key={category}
                        label={`${tierLabel(row.prefix, range.max)} ${CATEGORY_LABELS[category]}`}
                        on={!troops.topTierExcluded[chipRow].includes(category)}
                        onToggle={(on) => {
                          setCategory(chipRow, category, on);
                        }}
                      />
                    ))}
                  </div>
                )}
                {range !== null && units.length === 0 && row.chips && (
                  <p className="text-muted text-xs">
                    Every category of this family is switched off, so it fields nothing.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {all.length === 0 && (
          <HelpNote tone="warn">
            No unit type is selected, so there is nothing to stack. Open at least one family above.
          </HelpNote>
        )}

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id={gridId} className="text-sm font-semibold">
              Units in this march
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-muted text-xs">
                {includedCount} of {all.length} included
              </span>
              <Button
                size="sm"
                onClick={restoreAll}
                disabled={excludedHere.length === 0}
                aria-label="Restore all units"
              >
                Restore all
              </Button>
            </div>
          </div>
          {all.length === 0 ? (
            <HelpNote>Pick a tier range above and the unit types appear here.</HelpNote>
          ) : (
            <ul aria-labelledby={gridId} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {all.map((unit) => (
                <li key={unit.id}>
                  <UnitCard
                    unit={unit}
                    prefix={prefixes.get(unit.id) ?? ''}
                    included={!excluded.has(unit.id)}
                    onToggle={(on) => {
                      setUnit(unit.id, on);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
          <HelpNote>
            Tap a unit to leave it out — useful when a tier is unlocked but one of its units is still waiting
            for an upgrade. Left-out units stay in the list so you can put them back.
          </HelpNote>
        </div>
      </div>
    </Section>
  );
}

interface UnitCardProps {
  unit: UnitDef;
  prefix: string;
  included: boolean;
  onToggle: (included: boolean) => void;
}

/** One cell of the preview grid: a toggle whose accessible name is the unit, so it reads as a checkbox. */
function UnitCard({ unit, prefix, included, onToggle }: UnitCardProps) {
  return (
    <button
      type="button"
      aria-pressed={included}
      aria-label={unit.name}
      onClick={() => {
        onToggle(!included);
      }}
      className={cn(
        'tap block w-full rounded-lg border px-2.5 py-2 text-left transition-colors',
        included ? 'border-accent bg-accent-soft text-fg' : 'border-line bg-surface text-muted opacity-70',
      )}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="truncate text-sm font-semibold">{unit.label}</span>
        <span className="text-xs opacity-80">{tierLabel(prefix, unit.tier)}</span>
      </span>
      <span className="mt-0.5 block truncate text-xs opacity-80">{unit.name}</span>
      <span className="mt-0.5 block text-xs opacity-80">
        {unit.category ? CATEGORY_LABELS[unit.category] : 'No category'} · {number.format(unit.cost)}{' '}
        {POOL_WORDS[unit.pool]}
      </span>
      <span className="mt-0.5 block text-xs opacity-80">
        {number.format(unit.health)} HP · {number.format(unit.strength)} STR
      </span>
      {!included && <span className="text-xs font-medium">Left out — tap to restore</span>}
    </button>
  );
}
