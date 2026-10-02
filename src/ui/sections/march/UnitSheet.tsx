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
import { amount, compactTwo, duration, percent, ratio, signedPercent } from './format';
import { stockRun, type StockRun } from './hired';
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

/**
 * **What a stock buys, in the sheet's own two sentences** (S-148; the owner, 2026-09-29: *"what would be good
 * for me is to know how much damage a stack does… and maybe add a small calculation there, computing how much
 * similar march I can do with my stock and showing the total damages. Also to show the big numbers, we should
 * use the shorter notation we've introduced already."*).
 *
 * Two lines because they answer two questions, and the second is the arithmetic the first sets up: the first
 * says what the account owns and what one march of this size burns of it **for good** (a hired unit never
 * comes back — the Temple gives nine in ten back, so every march loses its chunk of ten to the ground,
 * `chunks`), the second says what the marches it still carries come to. **One total, and it is this stack's
 * own** — what the type does with the stock it has left, which is the question the block exists to answer.
 * It carried the whole march's total beside it when the block shipped (his own choice then, 2026-09-29) and
 * he retired it on 2026-10-02: *"remove the total damage 570M from the march in all. its not helpful. I'm only
 * interested in the damage the specific merc can do in total using all its remaining quota."* The march's own
 * figure is one the pane already prints twice (the recap's Damage, the plan's trade), and a reader of *this*
 * sentence is asking what the hired type is worth, not what the march hits for.
 *
 * **The figures are the sheet's own, counted `marches` times** (design rule 27, *unit details read as
 * sentences*): the total is the figure the block above it prints — this stack's damage in one march — so a
 * reader who divides it by the count of marches lands back on that figure, to the digit the notation prints
 * and no further. It wears the pane's full budget of two decimals (`compactTwo`, S-148's parameter), because
 * it is the one figure in the block and the millions it speaks in are the reason to read it.
 *
 * **And "to the digit the notation prints" is the honest bound, not a hedge**: a figure is printed to the
 * digits its room allows (S-148's parameter, and the owner's amendment of it on 2026-09-30 — *"lets keep 30M
 * and 12K for tight line, longer version for large text only"*), so a total of 10 360 000 prints "10.4M" here
 * while the sentence above it prints "2.59M". A reader checking the arithmetic divides to the figure the
 * sheet prints and lands within the rounding of the last digit, which is what the rule asks for and not an
 * error in this one.
 *
 * **Three branches, and the one-march case is written rather than pluralised.** A stock that fields the count
 * exactly once is `lastsMarches`' own `+ 1`, which is the whole point of that arithmetic: the first march is
 * the one the count itself pays for. "1 marches like this one" beside a total would be a plural the sentence
 * does not mean, so the pointed answer says *that this is the last one* instead. The **negative** run is the
 * other end and it says the fact rather than the arithmetic: `marches` is deliberately unclamped (`./hired`),
 * a hand-typed count above the cap is reachable while the counts are edited, and the total would then be a
 * fiction about marches nothing can field. `null` for the second line is that case, and the caller draws the
 * one sentence it gets.
 */
function stockWords(unit: UnitDef, held: number, count: number, run: StockRun): [string, string | null] {
  if (run.marches < 1) {
    return [`You field ${amount(count)} and own ${amount(held)}, so this march runs past your stock.`, null];
  }
  const head = `You own ${amount(held)} ${unit.name}, and a march of this size burns ${amount(
    run.burn,
  )} of them for good.`;
  const tail =
    run.marches === 1
      ? `That is this march and no more: ${compactTwo(run.stackDamage, 2)} damage from this stack.`
      : `That is ${amount(run.marches)} marches like this one: ${compactTwo(
          run.stackDamage,
          2,
        )} damage from this stack in all.`;
  return [head, tail];
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
  /**
   * **The account's own stock** of this type: the cap the request carries for it, `request.caps[unit.id]`
   * (`buildUnits`, `state/derive.ts:505`) — the owned count the Mercenaries card records, and the same
   * figure `hiredStock` sums. `undefined` for every type the account holds no count of, which is every type
   * but a capped mercenary (`./hired`'s own doc says why), and the stock block is simply not drawn then.
   */
  held?: number | undefined;
  onClose: () => void;
  /** Turns the counts into fields; the sheet closes behind it. */
  onEditCount: () => void;
}

export function UnitSheet({
  unit,
  row,
  totals,
  sources,
  totalDamage,
  held,
  onClose,
  onEditCount,
}: UnitSheetProps) {
  if (unit === null) return null;

  const group = unitGroupOf(unit);
  const stack = row?.stack;
  const share =
    row === undefined || totalDamage <= 0 ? 0 : (row.stack.damagePerHit * row.hits * 100) / totalDamage;
  /**
   * **What the stock of this type buys, or nothing at all** (S-148).
   *
   * The block is drawn only for a **capped mercenary that is marching with a count**: `./hired`'s own doc
   * carries the engine's reasons, and every absence here is design rule 15, nothing on screen without value:
   *
   * - a **troop** or a **monster** has no cap written for it at all. `caps` is built from
   *   `profile.mercenaries.selected` alone (`buildUnits`, `state/derive.ts:505`), so `held` is `undefined`
   *   for both, and the engine says why a monster must not have one: a dominance type is `Infinity` in
   *   `sustain` because its pool is **housing, not a stock** — a monster is trained again where a hired unit
   *   is gone for good (`engine/plan.ts:3186-3204`, S-102);
   * - an **uncapped ("unlimited") mercenary** is absent from `caps` by construction (the same line), and
   *   "no count entered" is not a stock that can run out: there is no run-out to count;
   * - a **custom mercenary** is never capped — the form has no owned field for one — so it is the same case;
   * - a type **left out** of the march (`row === undefined`) or **edited down to nothing** has no stack, and
   *   nothing to repeat;
   * - `held <= 0` is no stock at all, which the Mercenaries card can record and the recap's own hired row
   *   already reads as "nothing held".
   */
  const stock =
    held !== undefined && held > 0 && row !== undefined && row.stack.count > 0
      ? { held, count: row.stack.count, run: stockRun(held, row.stack.count, row.damage) }
      : null;
  const stockLines = stock === null ? null : stockWords(unit, stock.held, stock.count, stock.run);
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
              {/* The stack's **absolute** damage beside its share (S-148, the owner's 2026-09-29 ask: *"we can
                  add this to the troop detail pane"*). `row.damage` and the share's numerator above it are
                  **one product**: the journal pushes `stack.damagePerHit` once per army move
                  (`src/engine/battle.ts:172-179`), so `row.damage` is `damagePerHit × hits` to the unit and
                  the two figures cannot disagree. The share's denominator is the sheet's own `totalDamage`,
                  which is what the recap prints as **Damage** — so the sentence names it ("of the march's")
                  rather than leaving the reader to guess which of the two totals it is a share of. */}
              <Text size="sm">
                {`${amount(stack.count)} ${unit.name} land ${amount(row.hits)} `}
                {row.hits === 1 ? 'hit' : 'hits'}
                {` and deal ${compactTwo(row.damage, 2)} damage, ${percent(share)} of the march's.`}
              </Text>
              {/* **The two prices take the notation too, at the tight budget** (S-148): they are costs a
                  player compares, not counts to retype, and the owner asked for the sheet's figures in the
                  short notation. This is a 12 px line sharing its room with prose, so the budget is the
                  tight one, one decimal (`format.ts`, `compactTwo` — "1 where text needs to be small");
                  the numbers that stay exact on this line are the ones a player types back into the game
                  above it, the count of units lost. */}
              <Text size="xs" c="dimmed">
                {row.position === undefined ? 'Not in the battle.' : `Falls number ${String(row.position)}.`}
                {` All ${amount(row.lost)} are lost: ${compactTwo(row.reviveGold, 1)} gold to revive them,`}
                {` or ${compactTwo(row.retrainSilver, 1)} silver and ${duration(row.retrainSeconds)} to retrain.`}
              </Text>
            </Stack>
          )}
        </Block>

        {/* **What the stock of this type buys** (S-148), between the line about this march's damage and the
            one about the size that decided it: it continues the sentence above — what that damage comes to
            when the stock pays for the marches it can — where "Why this size" changes subject to how the
            stack was sized. The title is a noun phrase like its neighbours', and it uses the app's own word
            for the thing: "stock", as the plan's line already calls it (`rows.ts:254`). */}
        {stockLines !== null && (
          <Block title="How many marches the stock lasts">
            <Stack gap={4}>
              <Text size="sm">{stockLines[0]}</Text>
              {stockLines[1] !== null && <Text size="sm">{stockLines[1]}</Text>}
            </Stack>
          </Block>
        )}

        {stack !== undefined && (
          <Block title="Why this size">
            {/* The product takes the notation and its two factors do not: the total health is a magnitude a
                reader compares against the other stacks, while the per-unit health and the count are the two
                figures the game's own card is read off and typed back in (`amount`, `format.ts`). */}
            <Text size="sm">
              {`The stack has to reach ${compactTwo(stack.totalHp, 2)} health: ${amount(
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
