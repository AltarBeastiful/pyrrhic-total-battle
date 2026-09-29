/**
 * The unit sheet (design plan §7.6, design rule 27), which replaced the old popover: no grid of
 * twelve labelled numbers. Each figure appears once, inside the sentence that gives it meaning.
 *
 * It opens from the figure under a tile and from a row's info button, and it is the one place that
 * holds every action about a single type: leave it out, put it back, edit its count.
 */
import { Alert, Button, Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { healthMultiplier, strengthMultiplier } from '@/engine';
import type { BonusTotals, ResolvedSource, UnitDef } from '@/engine/types';
import {
  facetWords,
  GROUP_LABEL,
  romanTier,
  squadUnknown,
  StatBar,
  unitGroupOf,
  UnitTile,
} from '@/ui/domain';
import { Figures, Sections, Sheet } from '@/ui/kit';

import classes from './march.module.css';

import { putBackInMarch, removeFromFormation } from './formation';
import { amount, duration, percent, ratio, signedPercent } from './format';
import { unitBonus, unitBonusSources, type MarchStackRow, type UnitBonusSource } from './rows';

/**
 * One part of the sheet: the same head every figure on the page wears — **12 px muted above what it
 * is about** — and then the sentences (design rule 27: a unit's details read as prose, never as a
 * grid of labelled numbers). The parts themselves are told apart by `Sections`, so this sheet has
 * the March's rhythm rather than one of its own.
 */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={6}>
      <Text component="h4" className={classes.meta} c="dimmed" fw={500}>
        {title}
      </Text>
      {children}
    </Stack>
  );
}

/**
 * What one source is worth to the type, in the two words the bars above are labelled with: "+50% health /
 * +12% strength". A source that feeds only one of the two says only that one — a "+0%" beside a name would
 * be a figure the reader has to subtract.
 */
function feedAmount(feed: UnitBonusSource): string {
  const parts: string[] = [];
  if (feed.health !== 0) parts.push(`${signedPercent(feed.health)} health`);
  if (feed.strength !== 0) parts.push(`${signedPercent(feed.strength)} strength`);
  return parts.join(' / ');
}

export interface UnitSheetProps {
  /** The type the sheet is about; `null` closes it. */
  unit: UnitDef | null;
  /** Its stack, when it is marching. */
  row?: MarchStackRow | undefined;
  /**
   * The bonuses the march on screen was computed under (`StackRequest.totals`), so the sheet can say what
   * they give **this** type — the two figures beside its bars, and the tooltip on the pill that opens it.
   */
  totals: BonusTotals;
  /**
   * The march's own sources, resolved the way the Bonuses card resolves them, for the names and the order
   * of the list under the bars (`unitBonusSources`). Only the labels are read off them: the amounts come
   * from the totals above.
   */
  sources: readonly ResolvedSource[];
  /** Damage of the whole march, so the stack's share can be said as a share. */
  totalDamage: number;
  onClose: () => void;
  /** Turns the counts into fields; the sheet closes behind it. */
  onEditCount: () => void;
}

export function UnitSheet({ unit, row, totals, sources, totalDamage, onClose, onEditCount }: UnitSheetProps) {
  if (unit === null) return null;

  const group = unitGroupOf(unit);
  const stack = row?.stack;
  const share =
    row === undefined || totalDamage <= 0 ? 0 : (row.stack.damagePerHit * row.hits * 100) / totalDamage;
  /**
   * **What this march's bonuses do to this type** (owner, 2026-09-28) — the engine's own two sums for it
   * (`unitBonus`, `./rows`), printed beside the bars they move.
   *
   * For a type that is **not marching** there is no stack to read them off, and the bars are computed from
   * the same two multipliers the engine stacks a marching one with (`effectiveUnit`, `src/engine/units.ts`)
   * — so the percent and the gap between the bars agree on every type the sheet can be opened on, marching
   * or not. A flat pair of bars under "+43.5 %" would be the sheet arguing with itself.
   */
  const bonus = unitBonus(unit, totals);
  const boostedHealth = stack?.hpPerUnit ?? Math.round(unit.health * healthMultiplier(unit, totals));
  const boostedStrength = stack?.strengthPerUnit ?? unit.strength * strengthMultiplier(unit, totals);
  /**
   * **What this type is filed under** (owner, 2026-09-28: *"add the category it fits in (guardsmen, mounted
   * for RD2; specialist melee for SW1…)"*), read off the keys the bonuses reach (`facetWords`, `domain`) and
   * written under the name: "Guardsmen II · Mounted", "Specialists I · Melee", "Monsters III · Mounted,
   * Beast". The heading carries the family and the tier, so the line adds only the squads and races the type
   * also answers to — the ones a bonus can be bought for.
   */
  const facets = facetWords(unit);
  /** The two bars above, source by source (`unitBonusSources`). */
  const feeds = unitBonusSources(unit, totals, sources);

  return (
    <Sheet
      opened
      onClose={onClose}
      title={unit.name}
      description={`${GROUP_LABEL[group]} ${romanTier(unit.tier)}${
        facets.length === 0 ? '' : ` · ${facets.join(', ')}`
      }`}
      footer={
        <Group gap="xs">
          {row === undefined && (
            <Button
              variant="default"
              onClick={() => {
                putBackInMarch(unit.id);
                onClose();
              }}
            >
              Put back in the march
            </Button>
          )}
          {row !== undefined && (
            <Button
              variant="default"
              onClick={() => {
                onEditCount();
                onClose();
              }}
            >
              Edit count
            </Button>
          )}
          {row !== undefined && (
            <Button
              color="red"
              onClick={() => {
                removeFromFormation(unit.id);
                onClose();
              }}
            >
              Leave out
            </Button>
          )}
        </Group>
      }
    >
      <Sections>
        <UnitTile unit={unit} size="lg" state={row === undefined ? 'leftOut' : 'on'} />

        <Block title="In this march">
          {row === undefined || stack === undefined ? (
            <Text size="sm">
              Left out of this march. Putting it back adds it to the march and re-sizes the rest around it.
            </Text>
          ) : (
            <Stack gap={4}>
              <Text size="sm">
                {`${amount(stack.count)} ${unit.name} land ${amount(row.hits)} `}
                {row.hits === 1 ? 'hit' : 'hits'}
                {` and deal ${percent(share)} of the damage.`}
              </Text>
              <Text size="xs" c="dimmed">
                {row.position === undefined ? 'Not in the battle.' : `Falls number ${String(row.position)}.`}
                {` All ${amount(row.lost)} are lost: ${amount(row.reviveGold)} gold to revive them,`}
                {` or ${amount(row.retrainSilver)} silver and ${duration(row.retrainSeconds)} to retrain.`}
              </Text>
            </Stack>
          )}
        </Block>

        {stack !== undefined && (
          <Block title="Why this size">
            <Text size="sm">
              {`The stack has to reach ${amount(stack.totalHp)} health: ${amount(
                stack.hpPerUnit,
              )} each × ${amount(stack.count)} units.`}
            </Text>
          </Block>
        )}

        <Block title="Unit">
          <Stack gap="sm">
            {/* **The one facet the app can be missing, said out loud** (owner, 2026-09-28: *"alert if
                something is missing"*). A type with no squad in its keys is a type no squad bonus reaches —
                which is what its bars show — and a reader who cannot find the squad anywhere on the sheet
                would take the shorter list for the whole truth. Brass, the app's own "worth a look" ink, and
                not an error: the type plays perfectly well, its bonuses are just narrower than they look. */}
            {squadUnknown(unit) && (
              <Alert color="brass" title="Worth a look">
                {`No squad is recorded for ${unit.name} — melee, ranged, mounted or flying — so no squad bonus ` +
                  `reaches it. Everything else it is filed under still applies.`}
              </Alert>
            )}
            <StatBar
              label="Health"
              base={unit.health}
              boosted={boostedHealth}
              bonus={signedPercent(bonus.health)}
              format={amount}
            />
            <StatBar
              label="Strength"
              base={unit.strength}
              boosted={boostedStrength}
              bonus={signedPercent(bonus.strength)}
              format={ratio}
            />
          </Stack>
        </Block>

        {/* **Where those two figures come from** (owner, 2026-09-28: *"add a field that details where they
            get their bonuses from for a troop, listing the bonuses applied source and amount"*). The
            Summary block of the Bonuses card, narrowed to the keys this type answers to, so a player
            reconciling a battle report reads the same names in the same order for one stack. The amounts
            are read off the march's own totals, so they add up to the percentages on the two bars above. */}
        <Block title="Where the bonuses come from">
          {feeds.length === 0 ? (
            <Text size="sm">No bonus source on this march reaches this type.</Text>
          ) : (
            <Figures
              label="Where the bonuses come from"
              items={feeds.map((feed) => ({
                key: feed.id,
                label: feed.label,
                value: feedAmount(feed),
              }))}
            />
          )}
        </Block>
      </Sections>
    </Sheet>
  );
}
