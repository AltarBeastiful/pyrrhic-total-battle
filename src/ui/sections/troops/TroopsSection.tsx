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
 * the top tier as a muted caption and one emoji `Chip` per type at it — checked means "I own it".
 * Engineers and monsters read "—" at both ends when the group is not used at all.
 *
 * Lower tiers are always in. The block describes **technology** — what the account has unlocked —
 * and nothing else: everything here is written straight to the active profile, and what one march
 * leaves out is the March's own business, kept with the answer on screen and nowhere else (S-53).
 * A type taken out of a march therefore never appears here, and no press here can change a march
 * the player is not looking at.
 */
import { Box, Flex, Group, Stack, Text, Tooltip } from '@mantine/core';
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

/**
 * The dense chip's height (`ChipRow`'s `DENSE`, 26 px): how tall a row of chips is allowed to be.
 * The owner's phone review of 2026-09-13 cut them from 30 px — on a phone the three include chips
 * were the tallest thing on the row and read as buttons rather than as the ticks they are.
 */
const CHIP_HEIGHT = 26;

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
   * monsters have four unrelated types at one tier, which no category tells apart, so a chip drops
   * the *unit id* (`excludedUnitIds`). Both say the same thing — "the account has not unlocked
   * this" — and neither has anything to do with a march.
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
}

/**
 * One group on one line: its marker and name, the two ends of the range, and the chips of the top
 * tier. The line wraps rather than scrolls, so on a phone the chips drop under the two selects —
 * which is the second line the design allows the row (R14).
 */
function GroupRow({ row, troops, onFrom, onTo, onIncluded }: GroupRowProps) {
  const hintId = useId();
  const range = troops[row.id];
  const tiers = rowTiers(row.id);
  const bounds = rowBounds(row.id);
  // Guardsmen and specialists cannot be switched off — unless they already are, and someone has to
  // be able to step out of that.
  const allowNone = row.allowNone || range === null;
  const units = row.tiles ? topTierUnits(troops, row.id) : [];
  const top = range === null ? '' : `${row.prefix}${range.max}`;
  const hint = `Untick the ${top} types you have not unlocked`;

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
            {/* The tier, once, at the start of the row — not "at G3:" and not on the chips, which
                say a type and nothing else (owner, 2026-09-13). What the row is *for* is a
                sentence, and a sentence on every troop row is four sentences nobody reads twice:
                it is the caption's tooltip, and its description for a screen reader. */}
            <Tooltip label={hint} withinPortal>
              <Text size="xs" c="dimmed" id={hintId}>
                {top}
              </Text>
            </Tooltip>
            {/* The kit's chip row keeps a live region under the chips for the "N at most" refusal.
                A troop row has no maximum and never says it, so the row is held to the height of a
                chip and the empty line overflows into the gap instead of adding a line to the card
                and pushing the tier caption off the chips' centre. */}
            <Box h={CHIP_HEIGHT}>
              <ChipRow
                label={`${row.label} at ${top}`}
                items={items}
                value={included}
                gap={6}
                dense
                describedBy={hintId}
                onChange={(next) => {
                  onIncluded(row.id, next);
                }}
              />
            </Box>
          </Group>
        )}
      </Flex>
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
