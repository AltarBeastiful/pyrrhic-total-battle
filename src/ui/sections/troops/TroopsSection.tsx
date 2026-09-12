/**
 * Troops (design plan §7.1, amended) — the first form a player meets, and the one TotalStack gets
 * right: for each group, pick the lowest and the highest tier you own, then click out the top-tier
 * types you have not unlocked yet.
 *
 * Lower tiers are always in. A type the March left out below the top tier is named under its row
 * with a way to put it back, so nothing the account fields is ever hidden. The card describes the
 * *account*, not one march: everything here is written straight to the active profile.
 */
import { useState } from 'react';

import type { UnitDef } from '@/data/types';
import type { ProfileTroops, TierRange } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { GroupMarker, SummaryLine, UnitTile } from '@/ui/domain';
import type { SummaryPart } from '@/ui/domain';
import { Button, Disclosure, TierStepper } from '@/ui/kit';
import { Cluster, Stack } from '@/ui/layout';

import {
  isChipRow,
  isEmptyArmy,
  leftOutUnits,
  rowBounds,
  rowTiers,
  topTierIncluded,
  topTierUnits,
  TROOP_ROWS,
  troopsSummary,
} from './rows';
import type { TroopRow, TroopRowId } from './rows';
import { readUiFlag, TROOPS_EXPANDED, writeUiFlag } from './uiPrefs';

export function TroopsSection() {
  const profile = useStore(selectActiveProfile);
  const updateProfile = useStore((state) => state.updateProfile);
  // A profile with no troops is a profile being filled in: the card opens itself and says how.
  const empty = profile === undefined || isEmptyArmy(profile.troops);
  const [expanded, setExpanded] = useState(() => readUiFlag(TROOPS_EXPANDED) ?? empty);

  if (profile === undefined) return null;
  const troops = profile.troops;
  const profileId = profile.id;

  const patch = (next: Partial<ProfileTroops>): void => {
    updateProfile(profileId, (current) => ({ troops: { ...current.troops, ...next } }));
  };

  /** Writes one group's range. The tiles describe one tier, so a moved top tier forgets them. */
  const setRange = (row: TroopRowId, next: TierRange | null): void => {
    const ranges: Record<TroopRowId, TierRange | null> = {
      guardsmen: troops.guardsmen,
      specialists: troops.specialists,
      engineers: troops.engineers,
      monsters: troops.monsters,
    };
    ranges[row] = next;
    const topTierExcluded = { ...troops.topTierExcluded };
    const moved = (troops[row]?.max ?? null) !== (next?.max ?? null);
    if (moved && isChipRow(row)) topTierExcluded[row] = [];
    patch({ ...ranges, topTierExcluded });
  };

  const setFrom = (row: TroopRowId, value: number | null): void => {
    const range = troops[row];
    if (value === null) {
      setRange(row, null);
      return;
    }
    setRange(row, { min: value, max: range === null ? value : Math.max(range.max, value) });
  };

  const setTo = (row: TroopRowId, value: number | null): void => {
    const range = troops[row];
    if (value === null) {
      setRange(row, null);
      return;
    }
    setRange(row, { min: range === null ? value : Math.min(range.min, value), max: value });
  };

  /**
   * A top-tier tile. Guardsmen and specialists have one type per category per tier, so the tile
   * writes the category the whole game reasons in; monsters have four unrelated types, so the tile
   * writes the unit id. Putting a type back always clears both, because the March writes ids.
   */
  const setTile = (row: TroopRowId, unit: UnitDef, on: boolean): void => {
    const chipRow = isChipRow(row) ? row : null;
    const topTierExcluded = { ...troops.topTierExcluded };
    const category = unit.category;
    if (chipRow !== null && category !== undefined) {
      const rest = topTierExcluded[chipRow].filter((item) => item !== category);
      topTierExcluded[chipRow] = on ? rest : [...rest, category];
    }
    const excludedUnitIds = on
      ? troops.excludedUnitIds.filter((id) => id !== unit.id)
      : chipRow === null
        ? [...troops.excludedUnitIds.filter((id) => id !== unit.id), unit.id]
        : troops.excludedUnitIds;
    patch({ topTierExcluded, excludedUnitIds });
  };

  const putBack = (ids: string[]): void => {
    patch({ excludedUnitIds: troops.excludedUnitIds.filter((id) => !ids.includes(id)) });
  };

  const toggleCard = (next: boolean): void => {
    setExpanded(next);
    writeUiFlag(TROOPS_EXPANDED, next);
  };

  const parts: SummaryPart[] = troopsSummary(troops).map((part) => ({
    group: part.row.id,
    text: part.text,
    muted: !part.present,
  }));

  return (
    <Stack as="section" id="troops" aria-label="Troops" gap={2}>
      <Disclosure
        title="Troops"
        summary={<SummaryLine parts={parts} />}
        isExpanded={expanded}
        onExpandedChange={toggleCard}
      >
        <Stack gap={4}>
          {empty && (
            <p className="text-muted text-sm">Add your troops: pick the lowest and highest tier you own.</p>
          )}
          {TROOP_ROWS.map((row) => (
            <GroupRow
              key={row.id}
              row={row}
              troops={troops}
              onFrom={setFrom}
              onTo={setTo}
              onTile={setTile}
              onPutBack={putBack}
            />
          ))}
        </Stack>
      </Disclosure>
    </Stack>
  );
}

interface GroupRowProps {
  row: TroopRow;
  troops: ProfileTroops;
  onFrom: (row: TroopRowId, value: number | null) => void;
  onTo: (row: TroopRowId, value: number | null) => void;
  onTile: (row: TroopRowId, unit: UnitDef, on: boolean) => void;
  onPutBack: (ids: string[]) => void;
}

/**
 * One group: its marker, the two ends of the range, and the tiles of the top tier. A group set to
 * "none" is one stepper and nothing else, which is what keeps the card four short rows (R4).
 */
function GroupRow({ row, troops, onFrom, onTo, onTile, onPutBack }: GroupRowProps) {
  const range = troops[row.id];
  const tiers = rowTiers(row.id);
  const bounds = rowBounds(row.id);
  // Guardsmen and specialists cannot be switched off — unless they already are, and someone has to
  // be able to step out of that.
  const allowNone = row.allowNone || range === null;
  const tiles = row.tiles ? topTierUnits(troops, row.id) : [];
  const leftOut = leftOutUnits(troops, row.id);

  return (
    <Stack gap={1}>
      <Cluster gap={2} align="end">
        {/* The group is named by the steppers ("Guardsmen from"); the marker is its colour, and its
            name for a screen reader. Repeating it here costs the row its second line on a phone. */}
        <GroupMarker group={row.id} />
        <TierStepper
          label={`${row.label} from`}
          prefix={row.prefix}
          tiers={tiers}
          value={range?.min ?? null}
          allowNone={allowNone}
          min={bounds.min}
          max={range?.max ?? bounds.max}
          onChange={(value) => {
            onFrom(row.id, value);
          }}
        />
        {range !== null && (
          <TierStepper
            label={`${row.label} to`}
            prefix={row.prefix}
            tiers={tiers}
            value={range.max}
            allowNone={row.allowNone}
            min={range.min}
            max={bounds.max}
            onChange={(value) => {
              onTo(row.id, value);
            }}
          />
        )}
        {range !== null && tiles.length > 0 && (
          <Cluster gap={1} role="group" aria-label={`${row.label} at ${row.prefix}${range.max}`}>
            <span className="text-muted text-sm">{`at ${row.prefix}${range.max}:`}</span>
            {tiles.map((unit) => {
              const on = topTierIncluded(troops, row.id, unit);
              return (
                <UnitTile
                  key={unit.id}
                  unit={unit}
                  size="md"
                  state={on ? 'on' : 'off'}
                  onPress={() => {
                    onTile(row.id, unit, !on);
                  }}
                />
              );
            })}
          </Cluster>
        )}
      </Cluster>
      {leftOut.length > 0 && (
        <Cluster gap={1} align="center">
          <span className="text-muted text-sm">Left out:</span>
          {leftOut.map((unit) => (
            <Button
              key={unit.id}
              size="sm"
              variant="quiet"
              aria-label={`Put back ${unit.name}`}
              onPress={() => {
                onPutBack([unit.id]);
              }}
            >
              {unit.name}
            </Button>
          ))}
          {leftOut.length > 1 && (
            <Button
              size="sm"
              variant="quiet"
              aria-label={`Put back all ${row.label.toLowerCase()}`}
              onPress={() => {
                onPutBack(leftOut.map((unit) => unit.id));
              }}
            >
              Put back all
            </Button>
          )}
        </Cluster>
      )}
    </Stack>
  );
}
