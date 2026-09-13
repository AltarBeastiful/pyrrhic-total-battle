/**
 * Troops (design plan §7.1, amended twice) — the first form a player meets, and the one TotalStack
 * gets right: for each group, pick the lowest and the highest tier you own, then click out the
 * top-tier types you have not unlocked yet.
 *
 * The block does not collapse: **the form is the summary** (R6). Four short rows, always on screen,
 * readable at a glance and editable in place. No `Paper` and no padding of its own either — the
 * setup column is one continuous sheet, so the section is a title and its rows and the shell owns
 * the space and the rule that tell it from Mercenaries under it (D-19). That leaves the March as
 * the page's only elevated object.
 *
 * Rebuilt on Mantine at M-04, copying the reference row for row (investigation 0009, `v1-desktop`):
 * a coloured `GroupMarker`, the group's name, "from [G1] to [G4]" as two tiny `TierSelect`s, then
 * "at G4:" and one emoji `Chip` per top-tier type — checked means "I own it". Engineers and
 * monsters read "—" at both ends when the group is not used at all.
 *
 * Lower tiers are always in. A type the March left out below the top tier is named under its row
 * with a way to put it back, so nothing the account fields is ever hidden. The block describes the
 * *account*, not one march: everything here is written straight to the active profile.
 */
import { Box, Button, Flex, Group, Stack, Text } from '@mantine/core';
import { useId } from 'react';

import { CATEGORIES } from '@/data/types';
import type { UnitDef } from '@/data/types';
import type { ProfileTroops, TierRange } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { Glyph, GroupMarker } from '@/ui/domain';
import type { GlyphKind } from '@/ui/domain';
import { ChipRow, Panel, TierSelect } from '@/ui/kit';
import type { ChipRowItem } from '@/ui/kit';

import {
  isChipRow,
  isEmptyArmy,
  leftOutUnits,
  rangeSummary,
  rowBounds,
  rowTiers,
  topTierIncluded,
  topTierUnits,
  TROOP_ROWS,
} from './rows';
import type { TroopRow, TroopRowId } from './rows';

/**
 * How wide the group's name is before the ranges start. A fixed column is what lines the four
 * "from" selects up under each other, as the reference does; it still leaves the two selects room
 * on a 390 px screen, where only the chips wrap to a second line.
 */
const NAME_WIDTH = 120;

/** The theme's chip height (`--chip-size`, 2 rem): how tall a row of chips is allowed to be. */
const CHIP_HEIGHT = 32;

export function TroopsSection() {
  const profile = useStore(selectActiveProfile);
  const updateProfile = useStore((state) => state.updateProfile);
  const titleId = useId();

  if (profile === undefined) return null;
  const troops = profile.troops;
  const profileId = profile.id;
  // A profile with no troops is a profile being filled in: the block says how, above the rows.
  const empty = isEmptyArmy(troops);

  const patch = (next: Partial<ProfileTroops>): void => {
    updateProfile(profileId, (current) => ({ troops: { ...current.troops, ...next } }));
  };

  /** Writes one group's range. The chips describe one tier, so a moved top tier forgets them. */
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
   * The top tier's chips, written back the way the schema stores them: guardsmen and specialists
   * have one type per category per tier, so a chip drops the *category* (`topTierExcluded`);
   * monsters have four unrelated types at one tier, so a chip drops the *unit id*. Checking a chip
   * always clears both, because the March leaves types out by id.
   */
  const setIncluded = (row: TroopRowId, nextIds: string[]): void => {
    const units = topTierUnits(troops, row);
    const included = new Set(nextIds);
    const dropped = units.filter((unit) => !included.has(unit.id));
    const topTierExcluded = { ...troops.topTierExcluded };
    if (isChipRow(row)) {
      const categories = new Set(dropped.map((unit) => unit.category));
      topTierExcluded[row] = CATEGORIES.filter((category) => categories.has(category));
    }
    const ofTopTier = new Set(units.map((unit) => unit.id));
    patch({
      topTierExcluded,
      excludedUnitIds: [
        ...troops.excludedUnitIds.filter((id) => !ofTopTier.has(id)),
        ...(isChipRow(row) ? [] : dropped.map((unit) => unit.id)),
      ],
    });
  };

  const putBack = (ids: string[]): void => {
    patch({ excludedUnitIds: troops.excludedUnitIds.filter((id) => !ids.includes(id)) });
  };

  return (
    <Panel
      component="section"
      id="troops"
      aria-labelledby={titleId}
      title="Troops"
      titleId={titleId}
      meta={rangeSummary(troops)}
    >
      <Stack gap={6}>
        {empty && (
          <Text size="sm" c="dimmed">
            Add your troops: pick the lowest and highest tier you own.
          </Text>
        )}
        {TROOP_ROWS.map((row) => (
          <GroupRow
            key={row.id}
            row={row}
            troops={troops}
            onFrom={setFrom}
            onTo={setTo}
            onIncluded={setIncluded}
            onPutBack={putBack}
          />
        ))}
      </Stack>
    </Panel>
  );
}

interface GroupRowProps {
  row: TroopRow;
  troops: ProfileTroops;
  onFrom: (row: TroopRowId, value: number | null) => void;
  onTo: (row: TroopRowId, value: number | null) => void;
  onIncluded: (row: TroopRowId, unitIds: string[]) => void;
  onPutBack: (ids: string[]) => void;
}

/**
 * One group on one line: its marker and name, the two ends of the range, and the chips of the top
 * tier. The line wraps rather than scrolls, so on a phone the chips drop under the two selects —
 * which is the second line the design allows the row (R14).
 */
function GroupRow({ row, troops, onFrom, onTo, onIncluded, onPutBack }: GroupRowProps) {
  const range = troops[row.id];
  const tiers = rowTiers(row.id);
  const bounds = rowBounds(row.id);
  // Guardsmen and specialists cannot be switched off — unless they already are, and someone has to
  // be able to step out of that.
  const allowNone = row.allowNone || range === null;
  const units = row.tiles ? topTierUnits(troops, row.id) : [];
  const leftOut = leftOutUnits(troops, row.id);
  const top = range === null ? '' : `${row.prefix}${range.max}`;

  const items: ChipRowItem[] = units.map((unit) => ({
    value: unit.id,
    label: shortCode(unit.label),
    glyph: <Glyph kind={chipGlyph(unit)} />,
    color: row.id,
    // The chip's words are a code; a screen reader gets the type's real name instead.
    name: unit.name,
  }));
  const included = units.filter((unit) => topTierIncluded(troops, row.id, unit)).map((unit) => unit.id);

  return (
    <Stack gap={2}>
      {/* `Flex` rather than `Group` for the one thing a group cannot say: a line that wraps stays
          closer to itself (4 px) than two groups are to each other (8 px), so the chips read as
          part of the row above them on a phone. */}
      <Flex wrap="wrap" align="center" columnGap="sm" rowGap={4} mih={40}>
        <Box w={NAME_WIDTH}>
          <GroupMarker group={row.id} label={row.label} />
        </Box>
        <Group gap={6} wrap="nowrap">
          <Text size="xs" c="dimmed">
            from
          </Text>
          <TierSelect
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
          <Text size="xs" c="dimmed">
            to
          </Text>
          <TierSelect
            label={`${row.label} to`}
            prefix={row.prefix}
            tiers={tiers}
            value={range?.max ?? null}
            allowNone={allowNone}
            min={range?.min ?? bounds.min}
            max={bounds.max}
            onChange={(value) => {
              onTo(row.id, value);
            }}
          />
        </Group>
        {range !== null && items.length > 0 && (
          <Group gap={6} wrap="nowrap">
            <Text size="xs" c="dimmed">{`at ${top}:`}</Text>
            {/* The kit's chip row keeps a live region under the chips for the "N at most" refusal.
                A troop row has no maximum and never says it, so the row is held to the height of a
                chip and the empty line overflows into the gap instead of adding a line to the card
                and pushing "at G4:" off the chips' centre. */}
            <Box h={CHIP_HEIGHT}>
              <ChipRow
                label={`${row.label} at ${top}`}
                items={items}
                value={included}
                gap={4}
                onChange={(next) => {
                  onIncluded(row.id, next);
                }}
              />
            </Box>
          </Group>
        )}
      </Flex>
      {leftOut.length > 0 && (
        <Group gap={6} wrap="wrap" align="center" pl={{ base: 0, sm: NAME_WIDTH }}>
          <Text size="xs" c="dimmed">
            {/* No middle dot before the button: facts are separated by space, not by punctuation
                (docs/design.md §8 rule 5). */}
            {`Left out: ${leftOut.map((unit) => unit.name).join(', ')}`}
          </Text>
          <Button
            variant="subtle"
            size="xs"
            aria-label={`Put back left-out ${row.label.toLowerCase()}`}
            onClick={() => {
              onPutBack(leftOut.map((unit) => unit.id));
            }}
          >
            Put back
          </Button>
        </Group>
      )}
    </Stack>
  );
}

/**
 * Which emoji opens a chip. Troops are recognised by the category the whole game reasons in;
 * monsters by their race, because a monster tier holds four unrelated beasts and dragons — the same
 * choice `UnitTile` makes, so the chip here and the tile in the March read alike.
 */
function chipGlyph(unit: UnitDef): GlyphKind {
  if (unit.kind === 'monster' && unit.race !== undefined) return unit.race;
  return unit.category ?? 'army';
}

/** The short code without its tier digits: "ARC1" is drawn as "ARC", the row already said "at G4". */
function shortCode(label: string): string {
  return label.replace(/\d+$/, '') || label;
}
