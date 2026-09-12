/**
 * S-11 — Troops section (PLAN §4.2).
 *
 * Four tier ranges, per-category chips for the highest tier of guardsmen and specialists, and a grid of
 * every unit type the march can field, where a single tap drops a unit the account has not upgraded yet.
 * Everything is written straight to the active profile: this section describes the *account*, not one
 * march, so it never touches the battle setup — the only thing it reads from the setup is the list of
 * pinned units, to mark them.
 */
import { Fragment, useId } from 'react';
import type { ReactNode } from 'react';

import type { Category, UnitDef } from '@/data/types';
import type { ProfileTroops } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import {
  CheckIcon,
  CloseIcon,
  EngineersIcon,
  GuardsmenIcon,
  MonstersIcon,
  PinIcon,
  ResetIcon,
  SpecialistsIcon,
  TroopsIcon,
  UnitBadge,
} from '../../icons';
import { Button, HelpNote, Pill, RangeSelect, Section, cn } from '../../primitives';
import {
  CATEGORY_LABELS,
  ROW_GROUP,
  categoriesAtTier,
  isChipRow,
  rowBounds,
  selectionByRow,
  troopsCountText,
  troopsSummary,
} from './rows';
import type { ChipRowId, TroopRowId } from './rows';
import type { TierRangeValue } from '../../primitives';

const number = new Intl.NumberFormat('en-US');

const POOL_WORDS = { leadership: 'leadership', authority: 'authority', dominance: 'dominance' } as const;

const GROUP_WORDS = {
  guardsmen: 'guardsman',
  specialists: 'specialist',
  engineers: 'engineer',
  monsters: 'monster',
} as const;

const ROW_ICONS: Record<TroopRowId, ReactNode> = {
  guardsmen: <GuardsmenIcon />,
  specialists: <SpecialistsIcon />,
  engineers: <EngineersIcon />,
  monsters: <MonstersIcon />,
};

/** One hue per family, written out so Tailwind generates every class. */
const ROW_TONES: Record<TroopRowId, string> = {
  guardsmen: 'text-group-guardsmen',
  specialists: 'text-group-specialist',
  engineers: 'text-group-engineers',
  monsters: 'text-group-monster',
};

const HELP = (
  <>
    <p>
      A tier is the roman numeral on a unit&apos;s card. Set the lowest and the highest tier you can train for
      each family, switch off a family you have nothing in, then drop the odd type you have not upgraded yet
      by tapping it in the grid. The chips on the top tier do the same for a whole category at once.
    </p>
    <p>
      <strong>Where to find it in game:</strong> the Barracks lists the tiers you can train and each unit card
      carries the health, strength and cost repeated here; monsters have the same card in their own building.
    </p>
  </>
);

function tierLabel(prefix: string, tier: number): string {
  return `${prefix}${tier}`;
}

export function TroopsSection() {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const updateProfile = useStore((state) => state.updateProfile);
  const gridId = useId();

  if (profile === undefined) return null;

  const troops = profile.troops;
  const excluded = new Set(troops.excludedUnitIds);
  const pinned = new Set(setup?.pinnedUnitIds ?? []);
  const rows = selectionByRow(troops);
  const rowOf = new Map<string, TroopRowId>();
  for (const { row, units } of rows) {
    for (const unit of units) rowOf.set(unit.id, row.id);
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
      icon={<TroopsIcon />}
      help={HELP}
      summary={
        <p id="troops-summary" className="text-muted text-xs leading-relaxed">
          {troopsSummary(troops).map((part, index) => (
            <Fragment key={part.row.id}>
              {index > 0 && ' \u00b7 '}
              <span className="whitespace-nowrap">
                <span
                  aria-hidden="true"
                  className={cn(
                    'mr-1 inline-flex align-[-0.15em]',
                    part.present ? ROW_TONES[part.row.id] : 'opacity-50',
                  )}
                >
                  {ROW_ICONS[part.row.id]}
                </span>
                <span className={part.present ? 'text-fg' : 'text-muted'}>{part.text}</span>
              </span>
            </Fragment>
          ))}
          {' \u00b7 '}
          <span className="nums whitespace-nowrap">{troopsCountText(all.length, excludedHere.length)}</span>
        </p>
      }
    >
      <div className="space-y-3">
        <div className="divide-line -mt-1 divide-y">
          {rows.map(({ row, units }) => {
            const range = troops[row.id];
            const bounds = rowBounds(row.id);
            const chipRow = isChipRow(row.id) ? row.id : null;
            const categories = range === null || chipRow === null ? [] : categoriesAtTier(chipRow, range.max);
            return (
              <div key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5">
                <span
                  aria-hidden="true"
                  className={cn('flex w-5 shrink-0 justify-center', ROW_TONES[row.id])}
                >
                  {ROW_ICONS[row.id]}
                </span>
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
                  <div className="flex flex-wrap items-center gap-1">
                    {categories.map((category) => (
                      <Pill
                        key={category}
                        label={`${tierLabel(row.prefix, range.max)} ${CATEGORY_LABELS[category]}`}
                        badge={<UnitBadge group={ROW_GROUP[row.id]} category={category} size="sm" />}
                        on={!troops.topTierExcluded[chipRow].includes(category)}
                        onToggle={(on) => {
                          setCategory(chipRow, category, on);
                        }}
                      />
                    ))}
                  </div>
                )}
                {range !== null && units.length === 0 && row.chips && (
                  <span className="text-muted text-xs">every category switched off</span>
                )}
              </div>
            );
          })}
        </div>

        {all.length === 0 && (
          <HelpNote tone="warn">
            Nothing is selected, so there is nothing to stack. Open at least one family above.
          </HelpNote>
        )}

        {all.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 id={gridId} className="text-sm font-semibold">
                Your unit types{' '}
                <span className="text-muted nums font-normal">
                  ({includedCount} in, {excludedHere.length} out)
                </span>
              </h3>
              <Button
                size="sm"
                variant="ghost"
                icon={<ResetIcon />}
                onClick={restoreAll}
                disabled={excludedHere.length === 0}
                aria-label="Restore all units"
              >
                Put them all back
              </Button>
            </div>
            <ul aria-labelledby={gridId} className="grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-7">
              {all.map((unit) => (
                <li key={unit.id}>
                  <UnitChip
                    unit={unit}
                    row={rowOf.get(unit.id) ?? 'guardsmen'}
                    included={!excluded.has(unit.id)}
                    pinned={pinned.has(unit.id)}
                    onToggle={(on) => {
                      setUnit(unit.id, on);
                    }}
                  />
                </li>
              ))}
            </ul>
            <p className="text-muted text-xs">
              Tap a type to leave it out; it stays here, struck through, until you tap it back in. Point at
              one to read its health, strength and cost.
            </p>
          </div>
        )}
      </div>
    </Section>
  );
}

interface UnitChipProps {
  unit: UnitDef;
  row: TroopRowId;
  included: boolean;
  pinned: boolean;
  onToggle: (included: boolean) => void;
}

/** One cell of the grid: a toggle whose accessible name is the unit, so it reads as a checkbox. */
function UnitChip({ unit, row, included, pinned, onToggle }: UnitChipProps) {
  const kind =
    unit.category === undefined ? GROUP_WORDS[row] : `${CATEGORY_LABELS[unit.category]} ${GROUP_WORDS[row]}`;
  const facts = [
    `${unit.name} — ${kind}, tier ${unit.tier}`,
    `${number.format(unit.health)} HP · ${number.format(unit.strength)} strength`,
    `${number.format(unit.cost)} ${POOL_WORDS[unit.pool]}`,
    pinned ? 'Pinned to this march' : '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  return (
    <button
      type="button"
      aria-pressed={included}
      aria-label={unit.name}
      title={facts}
      onClick={() => {
        onToggle(!included);
      }}
      className={cn(
        'tap flex w-full items-center gap-1 rounded-lg border px-1.5 text-left transition-colors',
        included
          ? 'border-accent-line bg-surface text-fg hover:bg-accent-soft'
          : 'border-line bg-raised text-muted opacity-70',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('shrink-0 text-[0.7rem]', included ? 'text-accent' : 'text-muted')}
      >
        {included ? <CheckIcon /> : <CloseIcon />}
      </span>
      <UnitBadge
        group={ROW_GROUP[row]}
        {...(unit.category === undefined ? {} : { category: unit.category })}
        tier={unit.tier}
        size="sm"
      />
      <span className={cn('nums truncate text-xs font-medium', !included && 'line-through')}>
        {unit.label}
      </span>
      {pinned && (
        <span aria-hidden="true" className="text-accent ml-auto shrink-0 text-[0.7rem]">
          <PinIcon />
        </span>
      )}
    </button>
  );
}
