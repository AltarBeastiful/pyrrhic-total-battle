/**
 * The march as TotalStack's own recap, in our colours (design plan §5.5, the owner's corrections of
 * 2026-09-13): **one block per housing pool** — the pool's figure in the pool's colour beside its
 * glyph, then the stacks that pool paid for as two-line pills coloured by tier, as many across as
 * fit at 78 px. Under the pools, the types this march left out as a small outlined row. What a player
 * does with a whole march — copy every count, edit them by hand — is a row of marks on the March's own
 * title line, beside the answer it acts on (`MarchFoot.tsx`, `MarchActions`; owner, 2026-09-21).
 *
 * A press on a stack pill **takes that type out of the march** (owner, 2026-09-13): the march is
 * re-sized on the spot and the type drops into the "Left out" row, where a press puts it back. That
 * is the whole gesture — the ⓘ in the pill's corner is the unit sheet, and copying is "Copy all
 * counts" on the title line.
 *
 * It replaces three blocks that said the same thing three times (design rule 5): the grid of 44 px
 * unit tiles, the row of pool gauges, and the "counts to copy" table whose every figure is one
 * press away in the unit sheet. The pool's figure *is* the gauge, written rather than drawn; **the
 * pills are the counts**.
 */
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Indicator,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import { ChevronsUp, Copy, Pencil, Undo2 } from 'lucide-react';
import { useEffect, useEffectEvent, useId, useState } from 'react';
import type { ReactNode } from 'react';

import { CAMPAIGN } from '@/config';
import type { StackResult, UnitDef } from '@/engine/types';
import { Glyph, LeftOutPill, poolInk, StackPill } from '@/ui/domain';
import domainClasses from '@/ui/domain/domain.module.css';
import { isCommitEnter, NumberField } from '@/ui/kit';
import { copyText } from '@/ui/profile/download';

import { putBackAllInMarch, putBackInMarch, removeFromFormation } from './formation';
import { amount, bonusLines, compact, signedCompact, signedPercent } from './format';
import classes from './march.module.css';
import { RAISE_CHOICES } from './choices';
import type { PositionReading, PositionTrades } from './positions';
import { isExhaustive, offersPush, raisesPool } from './raise';
import type { RaiseMode, RaiseModes, RaisedPool } from './raise';
import { countsText, resizeWords } from './rows';
import type { LeftOutUnit, MarchStackRow, PoolRow } from './rows';
import { useRunStore } from './runStore';
import { shelterNote } from './shelter';
import type { PushOffer } from './useMarch';

/** How long "Copied" stays on screen. */
const COPIED_MS = 1500;

/** What a pool is called in a sentence; the glyph is the game's own. */
const POOL_LABEL = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
} as const;

/** A message that clears itself, for the one clipboard action left. */
function useFlash(): [string, (message: string) => void] {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (message === '') return;
    const timer = globalThis.setTimeout(() => {
      setMessage('');
    }, COPIED_MS);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [message]);
  return [message, setMessage];
}

export interface MarchPillsProps {
  rows: PoolRow[];
  /** The stacks are drawn in the kill order rather than the battle selection's; a view preference. */
  byHealth: boolean;
  onByHealth: (byHealth: boolean) => void;
  editing: boolean;
  onCount: (unitId: string, count: number) => void;
  /** A pill's corner mark: the unit sheet for that one type. */
  onDetails: (unit: UnitDef) => void;
  /** The sheltered raise (S-142): the position of each hired pool's control, and whether it is offered. */
  raiseModes: RaiseModes;
  canRaise: boolean;
  /** A `Best v2` search is in flight (`raiseSearch.ts`): the position is chosen, the answer is not in. */
  searching: boolean;
  /** The stop's priced positions, for the hover preview of each segment; `null` while they are coming. */
  trades: PositionTrades | null;
  /**
   * A segment was pressed. **No pool rides with it** (S-149): a position is one standing rule over both hired
   * blocks (`runStore.setRaiseMode`), so the block it was pressed on changes nothing about the answer.
   */
  onRaise: (mode: RaiseMode) => void;
  /**
   * **What each hired pool's push offers here** (S-159), and a press of the mark on that pool's own line. Per
   * pool, unlike the position above it: the two buttons sit on their own lines and move one resource each.
   */
  push: Record<RaisedPool, PushOffer | null>;
  onPush: (pool: RaisedPool) => void;
  /** **What rounding each hired pool to tens offers here** (owner, 2026-10-16), and a press of its mark. */
  round: Record<RaisedPool, PushOffer | null>;
  onRound: (pool: RaisedPool) => void;
  /** The mercs the march on screen burns (`MarchView.burn`): the `Burn ≤` field's placeholder. */
  burn?: number;
  /** The player's burn ceiling, `null` for none (`runStore.burnCeiling`). */
  burnCeiling?: number | null;
  /** A ceiling was typed (or cleared, `null`). Absent, the field is not drawn. */
  onBurnCeiling?: (ceiling: number | null) => void;
}

/** How long the `Burn ≤` field waits after the last keystroke before the march is re-read under it. */
const BURN_SETTLE_MS = 400;

/**
 * **The burn ceiling, at the foot of the army** (`docs/plans/burn-ceiling.md` §3.2; owner, 2026-10-18: *"there
 * should be a way to conserve merc burns"*). One plain number field (design rule 9), empty by default — the
 * march keeps the burn it was generated with — with that burn as its placeholder, so the figure to type under is
 * on screen. Typed, the march is trimmed to it and the raise, the push and a March edit keep under it.
 *
 * It sits where the raise selector does (hidden behind `CAMPAIGN.raiseControl` since 2026-10-13): one small row
 * under the pools, out of the way (owner, 2026-10-10). A help line under it says what it does in one sentence
 * (rule 26: our own words; "merc", never "hired"). Stock Mantine through the kit's `NumberField` (rule 23).
 *
 * **The figure settles before it is read** (`BURN_SETTLE_MS`): every keystroke would re-price the plan's bar, so
 * the field keeps its draft and hands the ceiling over once the typing pauses, or at once on Enter.
 */
export function MarchBurnCeiling({
  burn,
  ceiling,
  onChange,
}: {
  burn: number;
  ceiling: number | null;
  onChange: (ceiling: number | null) => void;
}) {
  const [draft, setDraft] = useState<number | null>(ceiling);
  // **The store is the truth**: a reset (another account) puts the field back on it — adjusted during the
  // render, React's own pattern for state that follows a prop.
  const [seen, setSeen] = useState<number | null>(ceiling);
  if (seen !== ceiling) {
    setSeen(ceiling);
    setDraft(ceiling);
  }
  // The handler read when the wait ends, so a parent's re-render does not restart it.
  const commit = useEffectEvent((next: number | null) => {
    onChange(next);
  });
  useEffect(() => {
    if (draft === ceiling) return undefined;
    const timer = globalThis.setTimeout(() => {
      commit(draft);
    }, BURN_SETTLE_MS);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [draft, ceiling]);
  return (
    <div
      onKeyDown={(event) => {
        if (!isCommitEnter(event) || draft === ceiling) return;
        onChange(draft);
      }}
    >
      <NumberField
        label="Burn ≤"
        accessibleName="Most mercs lost"
        value={draft}
        onChange={setDraft}
        allowEmpty
        placeholder={amount(burn)}
        enterKeyHint="done"
        w={120}
        description="Most mercs this march may lose. Empty keeps the burn it was generated with."
      />
    </div>
  );
}

/** What a pool's units are called in a sentence, where the plan's trade says "Merc" and the raise says "Mercenary counts". */
const POOL_NOUN: Record<RaisedPool, string> = { authority: 'mercs', dominance: 'monsters' };

// What the two segments are called, and the one line each explains itself with: `./choices`.

/** What the control is called, per pool: the group carries the pool's own name. */
const RAISE_LABEL: Record<RaisedPool, string> = {
  authority: 'Mercenary counts',
  dominance: 'Monster counts',
};

/** The reading a segment previews: `As is` is the plan's own march, any other position is its priced row. */
function readingOf(trades: PositionTrades | null, mode: RaiseMode): PositionReading | null {
  if (trades === null) return null;
  return mode === 'off' ? trades.own : (trades.rows.find((row) => row.mode === mode) ?? null);
}

/** One figure of a preview, and how it moves against the position on screen: nothing when it does not. */
interface PreviewFigure {
  kind: 'minimumDamage' | 'silver' | 'gold';
  label: string;
  value: string;
  /** A signed percentage against the chosen position, or `null` on the chosen one and where nothing moved. */
  change: string | null;
}

/**
 * **What a segment would make of the march, in the three figures the owner asked for** (2026-10-07: *"a hover
 * to preview the trade it offers (usually a bit less gold and less damage), showing only silver, gold and
 * damage"*). Gold only where either reading pays any (design rule 15). The change is read against the
 * position on screen, and a percentage for the reason the plan's trade gives: three units, one shape.
 */
function previewOf(shown: PositionReading, chosen: PositionReading, isChosen: boolean): PreviewFigure[] {
  const change = (to: number, from: number): string | null =>
    isChosen || to === from || from === 0 ? null : signedPercent(((to - from) / from) * 100);
  const figures: PreviewFigure[] = [
    {
      kind: 'minimumDamage',
      label: 'Damage',
      value: compact(shown.damage),
      change: change(shown.damage, chosen.damage),
    },
    {
      kind: 'silver',
      label: 'Silver',
      value: compact(shown.silver),
      change: change(shown.silver, chosen.silver),
    },
  ];
  if (shown.gold > 0 || chosen.gold > 0) {
    figures.push({
      kind: 'gold',
      label: 'Gold',
      value: compact(shown.gold),
      change: change(shown.gold, chosen.gold),
    });
  }
  return figures;
}

const figureWords = (figure: PreviewFigure): string =>
  `${figure.label} ${figure.value}${figure.change === null ? '' : ` (${figure.change})`}`;

const isRaiseMode = (value: string): value is RaiseMode =>
  RAISE_CHOICES.some((choice) => choice.mode === value);

/**
 * **How high this pool's stacks are asked to stand** (S-142; owner, 2026-09-29: *"a slider with three
 * options: default count, maximize number and spent (rounding to the nearest 10 number that's still
 * shielded), maximize global (going to nearest count that's still shielded not caring about rounding to
 * 10)"*), and the three damage positions the owner added the same day — *"give both positions but defer the
 * best damage option to after the most is implemented as a second step"* (S-143), then *"implement best V2
 * and add it to the interface"* (S-143b) and *"we could have a safe best-v2 that is bestv2 but accounting
 * for merc lost and dmg/merc"* (S-144).
 *
 * It sits under the pool's own figure and above its pills, so it is read with the stacks it moves, on the
 * mercenaries' block and the monsters' block and nowhere else — the troops are what shelters, never what is
 * sheltered. Stock Mantine, six short segments, no custom CSS (rule 23); each segment names itself in one
 * sentence for a pointer or a keyboard (the tooltip), and the group says the same thing once for a reader
 * that never sees it (the hidden line below).
 *
 * The damage positions are a **different promise** and not a better `Most`: `Most` fields the most units the
 * troops shelter, the three answer with the counts that hit hardest, which can be fewer (a stack with more
 * total HP climbs the kill order and strikes in fewer rounds — see `raise.ts`). All of them are raises,
 * because the march on screen is always the floor they start from. **The climb that used to be the `Best`
 * segment is still what they draw while their search runs** (S-145).
 *
 * Nothing here computes anything: the position is run state (`runStore.raiseModes`) and the counts it means
 * are derived in `useMarch`, which is what lets the position survive a Generate. **Those counts are the plan's
 * own table's when it has already priced the position** (S-149; `positionsSearch.ts`): the block under the
 * plan answers the same question for all five positions on every stop of the bar, in the wasm, so a press
 * lands on a value already in hand rather than on a search of up to 51 s.
 */
export function MarchRaiseControl({
  pool,
  value,
  searching,
  trades,
  onChange,
}: {
  pool: RaisedPool;
  value: RaiseMode;
  /** The exhaustive search is still running: `Best v2` is chosen, and its answer is not in yet. */
  searching: boolean;
  /** The stop's priced positions: each segment's tooltip previews its row against the chosen one. */
  trades: PositionTrades | null;
  onChange: (mode: RaiseMode) => void;
}) {
  const helpId = useId();
  const chosen = readingOf(trades, value);
  const previews = new Map(
    RAISE_CHOICES.map((choice) => {
      const shown = readingOf(trades, choice.mode);
      return [
        choice.mode,
        shown === null || chosen === null ? [] : previewOf(shown, chosen, choice.mode === value),
      ] as const;
    }),
  );
  return (
    <>
      <SegmentedControl
        // Small and grey, out of the way (owner, 2026-10-10): not full width and the smallest size.
        size="xs"
        w="fit-content"
        fz="xs"
        value={value}
        aria-label={RAISE_LABEL[pool]}
        aria-describedby={helpId}
        // A search in flight is a state of this control and of nothing else on the page.
        aria-busy={searching}
        data={RAISE_CHOICES.map((choice) => ({
          value: choice.mode,
          label: (
            <Tooltip
              label={
                <Stack gap={2}>
                  <Text size="xs">{choice.help}</Text>
                  {/* The three figures of the position, read off the row already priced; none while it is
                      still coming, and no note under the position already chosen. Stock Mantine (rule 23). */}
                  {(previews.get(choice.mode) ?? []).map((figure) => (
                    <Group key={figure.kind} gap={6} wrap="nowrap">
                      <Glyph kind={figure.kind} />
                      <Text span size="xs">
                        {figure.label} {figure.value}
                      </Text>
                      {figure.change !== null && (
                        <Text span size="xs" c="dimmed">
                          {figure.change}
                        </Text>
                      )}
                    </Group>
                  ))}
                </Stack>
              }
              multiline
              maw={280}
              withinPortal
              withArrow
            >
              {/*
                **The wait is drawn inside the segment, not beside it** (design rule 15: a state the player
                needs, and S-142's own note that a line arriving under the figures "moves the ui"): the label
                keeps its box, so choosing an exhaustive position shifts nothing while the search runs,
                however long it takes. **The mark goes in the segment that is chosen** and not in all three
                exhaustive ones — the control only ever reports a wait for the position standing on it — so
                the other five are drawn exactly as they were; a stock `Group` rather than a CSS rule, because
                a row with a mark in it is what the kit is for (design rule 23).
              */}
              {choice.mode === value && searching ? (
                <Group gap={4} wrap="nowrap" component="span">
                  {choice.label}
                  <Loader size={10} aria-hidden />
                </Group>
              ) : (
                <span>{choice.label}</span>
              )}
            </Tooltip>
          ),
        }))}
        onChange={(next) => {
          if (isRaiseMode(next)) onChange(next);
        }}
      />
      <VisuallyHidden id={helpId}>
        {RAISE_CHOICES.map((choice) => {
          const figures = (previews.get(choice.mode) ?? []).map(figureWords).join(', ');
          return `${choice.label}: ${choice.help}${figures === '' ? '' : ` ${figures}.`}`;
        }).join(' ')}
        {searching ? ' Searching every combination.' : ''}
      </VisuallyHidden>
    </>
  );
}

/**
 * **The pool's push, at the end of its own line** (S-159; owner, 2026-10-12: *"a button on the right of the merc
 * line … the position can be switched back by pressing again on the button"*).
 *
 * It is the sheltered raise's own extreme, asked one resource at a time: the most units of this pool that leave
 * the **kill order** exactly as it stands (`pushedCounts`). The plan stops the hired stacks at its trade, and the
 * only lever that bought the rest was moving up the bar — which pays for them in silver. This is the other lever,
 * and it changes nothing that is there.
 *
 * **A toggle**, so the mark carries `aria-pressed` and one name that says which way it goes; a filled mark while
 * on, the theme's own treatment and never colour alone (rule 24). Its **name carries the trade** — the signed
 * damage and the loss — because a thumb has no hover (rule 18), and the tooltip repeats the same two
 * figures for a pointer in the shape the raise control's own previews use. Chrome is Lucide, the figures wear the
 * game's own glyphs (rule 21); stock Mantine only (rule 23).
 *
 * It draws nothing at all where the push would add nothing, or where it would cost damage — the two states a
 * mark here would be a mark with nothing behind it (rule 15, and `useMarch`'s own offer holds both rules).
 */
export function MarchPushControl({
  pool,
  offer,
  onPush,
}: {
  pool: RaisedPool;
  offer: PushOffer;
  onPush: () => void;
}) {
  const trade = offer.trade;
  if (!offersPush(trade, offer.pressed)) return null;
  const gain = trade === null || trade.before <= 0 ? 0 : ((trade.damage - trade.before) / trade.before) * 100;
  /**
   * **What the push adds, and never the march's total** (owner, 2026-10-12: *"change the tooltip to show additional
   * damage only not total"*). The two figures are the same addition twice — the thousands and the percentage —
   * which is what makes the trade readable against any march: the total beside it said what the march hits for,
   * a number two blocks up the same screen already answers (`MarchRecap`), and rule 5 is one figure in one place.
   */
  const adds = trade === null ? '0' : signedCompact(trade.damage - trade.before);
  const figures =
    trade === null
      ? ''
      : `: ${adds} damage, ${signedPercent(gain)}, ${amount(trade.lost)} ${POOL_NOUN[pool]} lost`;
  const name = offer.pressed
    ? `Take the push off ${POOL_NOUN[pool]}${figures}.`
    : `Push ${POOL_NOUN[pool]} to the most the kill order allows${figures}.`;
  return (
    <Tooltip
      label={
        <Stack gap={2}>
          {trade !== null && (
            <>
              <Group gap={6} wrap="nowrap">
                <Glyph kind="minimumDamage" />
                <Text span size="xs">
                  {`Damage ${adds}`}
                </Text>
                <Text span size="xs" c="dimmed">
                  {signedPercent(gain)}
                </Text>
              </Group>
              <Group gap={6} wrap="nowrap">
                <Glyph kind={pool} />
                <Text span size="xs">
                  {`+${amount(trade.lost)} ${POOL_NOUN[pool]} lost`}
                </Text>
              </Group>
            </>
          )}
          {offer.pressed && <Text size="xs">{`Press again to put ${POOL_NOUN[pool]} back.`}</Text>}
        </Stack>
      }
      multiline
      maw={260}
      withinPortal
      withArrow
    >
      <ActionIcon
        size="sm"
        variant={offer.pressed ? 'filled' : 'subtle'}
        {...(offer.pressed ? {} : { color: 'gray' })}
        aria-label={name}
        aria-pressed={offer.pressed}
        onClick={onPush}
      >
        <ChevronsUp size={16} aria-hidden />
      </ActionIcon>
    </Tooltip>
  );
}

/**
 * **The pool's rounding to tens, right of its push** (owner, 2026-10-16: *"the same button with badge 10 on it
 * and put it to the right … same properties as the other button"*). The push's mark with a `10` on its corner:
 * a toggle with `aria-pressed`, the trade in its name and its tooltip — the signed damage and the loss, which
 * here can go either way, since a stack may be rounded down (`roundedCounts` takes the best trade). Drawn only
 * where there is something to round, or while it stands pressed.
 */
export function MarchRoundControl({
  pool,
  offer,
  onRound,
}: {
  pool: RaisedPool;
  offer: PushOffer;
  onRound: () => void;
}) {
  const trade = offer.trade;
  if (trade === null) return null;
  const gain = trade.before <= 0 ? 0 : ((trade.damage - trade.before) / trade.before) * 100;
  const adds = signedCompact(trade.damage - trade.before);
  const lost = `${trade.lost >= 0 ? '+' : '−'}${amount(Math.abs(trade.lost))}`;
  const figures = `: ${adds} damage, ${signedPercent(gain)}, ${lost} ${POOL_NOUN[pool]} lost`;
  const name = offer.pressed
    ? `Take the rounding off ${POOL_NOUN[pool]}${figures}.`
    : `Round ${POOL_NOUN[pool]} to tens, up or down by the best trade${figures}.`;
  return (
    <Tooltip
      label={
        <Stack gap={2}>
          <Group gap={6} wrap="nowrap">
            <Glyph kind="minimumDamage" />
            <Text span size="xs">
              {`Damage ${adds}`}
            </Text>
            <Text span size="xs" c="dimmed">
              {signedPercent(gain)}
            </Text>
          </Group>
          <Group gap={6} wrap="nowrap">
            <Glyph kind={pool} />
            <Text span size="xs">
              {`${lost} ${POOL_NOUN[pool]} lost`}
            </Text>
          </Group>
          {offer.pressed && <Text size="xs">{`Press again to put ${POOL_NOUN[pool]} back.`}</Text>}
        </Stack>
      }
      multiline
      maw={260}
      withinPortal
      withArrow
    >
      <Indicator label="10" size={12} offset={3} color="gray" styles={{ indicator: { fontSize: '0.5rem' } }}>
        <ActionIcon
          size="sm"
          variant={offer.pressed ? 'filled' : 'subtle'}
          {...(offer.pressed ? {} : { color: 'gray' })}
          aria-label={name}
          aria-pressed={offer.pressed}
          onClick={onRound}
        >
          <ChevronsUp size={16} aria-hidden />
        </ActionIcon>
      </Indicator>
    </Tooltip>
  );
}

/**
 * The march at a glance: the pools, their stacks, and what was left out. On a desktop the whole
 * pane stays on screen while the setup scrolls past it (`shell/MarchPane.tsx`), so this block and
 * the whole-march actions under it travel together and neither can cover the other.
 */
export function MarchPills({
  rows,
  byHealth,
  onByHealth,
  editing,
  onCount,
  onDetails,
  raiseModes,
  canRaise,
  searching,
  trades,
  onRaise,
  push,
  onPush,
  round,
  onRound,
  burn = 0,
  burnCeiling = null,
  onBurnCeiling,
}: MarchPillsProps) {
  // The pool the one raise control speaks for, or `null` when there is none to draw: a hired pool with a
  // stack to raise, on a plan's march.
  const hiredRow = canRaise ? rows.find((row) => raisesPool(row.pool) && row.entries.length > 0) : undefined;
  const raisable = hiredRow !== undefined && raisesPool(hiredRow.pool) ? hiredRow.pool : null;
  // **The ceiling is offered where the raise is, on a march with mercs** — and still while one stands, since a
  // ceiling of 0 empties the mercs' block and the field must stay to take it back.
  const burnable =
    canRaise &&
    onBurnCeiling !== undefined &&
    (burnCeiling !== null || rows.some((row) => row.pool === 'authority' && row.entries.length > 0));
  return (
    <Stack
      gap="lg"
      /**
       * **Esc is "Done editing"** (owner, 2026-09-21). The hand that is typing counts is already on the
       * keyboard, and the way out of the mode was a press on a mark at the other end of the card.
       *
       * On the grid rather than on the window, and the key is stopped here: the March is a focus trap
       * on a phone (`shell/MarchSheet.tsx`) and a sheet's own Esc closes the sheet — one Escape must
       * not do both. Anywhere else on the page the key still belongs to whatever is open there.
       */
      onKeyDown={
        editing
          ? (event) => {
              // Enter in a count field is "Done editing" too (owner, 2026-10-02): the figure is written,
              // and Enter is how a typed number is finished (`kit/enterCommits.ts`).
              if (event.key !== 'Escape' && !isCommitEnter(event)) return;
              event.preventDefault();
              event.stopPropagation();
              useRunStore.getState().setEditingCounts(false);
            }
          : undefined
      }
    >
      {rows.map((row, index) => {
        const over = row.used > row.capacity;
        // The pool as the push reads it: `null` on the leadership block, which is what shelters and never what
        // is sheltered (`raisesPool`).
        const pool = raisesPool(row.pool) ? row.pool : null;
        const offer = pool === null ? null : push[pool];
        const rounding = pool === null ? null : round[pool];
        return (
          <Stack key={row.pool} gap="xs">
            {/* The pool line, to the spacing contract (`MarchPaneSpacing.dc.html`, `.pool`): the
                figure **22/700** in the pool's colour, the glyph in a 20 px box, and "of 20 000
                leadership" at 12 px muted — the pool's *name*, which the line never said, so three
                figures over three grids of pills were told apart by an emoji alone. */}
            <Group justify="space-between" wrap="nowrap" align="center" gap={8}>
              <Group gap={8} wrap="nowrap" align="center">
                <Text
                  span
                  fz="1.375rem"
                  lh={1}
                  fw={700}
                  className={classes.poolFigure}
                  c={over ? 'var(--mantine-color-danger-filled)' : poolInk(row.pool)}
                >
                  {amount(row.used)}
                </Text>
                <Text span fz="1.25rem" lh={1}>
                  <Glyph kind={row.pool} label={POOL_LABEL[row.pool]} />
                </Text>
                <Text span className={classes.meta} c="dimmed">
                  {`of ${amount(row.capacity)} ${POOL_LABEL[row.pool].toLowerCase()}`}
                </Text>
              </Group>
              {/* **Top right of the first pool, on the pool's own line** (owner, 2026-10-10: *"on the same line as
                  the leadership number … to avoid new line … lower the size of font and check box again"*): a
                  quiet 11 px grey check, the exception to the battle selection order, costing no line of its own. */}
              {/* **And the hired pools' push beside it** (S-159), in the same right-hand group rather than a line of
                  its own — a march whose first drawn pool is a hired one has the two on one line, which is what
                  this group is for. A pool with nothing to push draws neither: the offer is `null` there. */}
              <Group gap={6} wrap="nowrap" align="center">
                {index === 0 && (
                  <Checkbox
                    size="14px"
                    label="Order by health"
                    checked={byHealth}
                    onChange={(event) => {
                      onByHealth(event.currentTarget.checked);
                    }}
                    styles={{
                      label: {
                        color: 'var(--mantine-color-dimmed)',
                        fontSize: '0.6875rem',
                        paddingInlineStart: 6,
                      },
                    }}
                  />
                )}
                {pool !== null && offer !== null && offersPush(offer.trade, offer.pressed) && (
                  <MarchPushControl
                    pool={pool}
                    offer={offer}
                    onPush={() => {
                      onPush(pool);
                    }}
                  />
                )}
                {pool !== null && rounding !== null && rounding.trade !== null && (
                  <MarchRoundControl
                    pool={pool}
                    offer={rounding}
                    onRound={() => {
                      onRound(pool);
                    }}
                  />
                )}
              </Group>
            </Group>
            {row.entries.length > 0 && (
              <div
                className={domainClasses.pillGrid}
                role="group"
                aria-label={`${POOL_LABEL[row.pool]} stacks`}
              >
                {row.entries.map((entry) => (
                  <StackPill
                    key={entry.unit.id}
                    unit={entry.unit}
                    count={entry.count}
                    // What the march's bonuses give this type, as the corner mark's tooltip — the same two
                    // figures the unit sheet draws beside its bars (`bonusLines`, `./format`).
                    bonus={bonusLines(entry.bonus.health, entry.bonus.strength)}
                    editing={editing}
                    onCount={(next) => {
                      onCount(entry.unit.id, next);
                    }}
                    onLeaveOut={() => {
                      removeFromFormation(entry.unit.id);
                    }}
                    onDetails={() => {
                      onDetails(entry.unit);
                    }}
                  />
                ))}
              </div>
            )}
          </Stack>
        );
      })}
      {/* **One control for the whole army, at the foot of the list** (owner, 2026-10-10: *"don't duplicate as is
          tight.. selector and make it minimal and out of the way, maybe on the bottom of the troops list"*). The
          position is one standing rule over both hired pools (S-149), so a copy under each pool said the same
          thing twice (design rule 5). It is named for the first hired pool the march has a stack in.

          **And the selector is behind a config entry now** (owner, 2026-10-13: *"hide the selector for as is
          tight and tight old. keep it as a config entry so I can enable it back"*): `CAMPAIGN.raiseControl`
          off draws nothing here, and the March stands on `Tight`. The bar's tables are unaffected — it still
          prices `Tight (old)` beside `Tight` (`OFFERED_POSITIONS`), so nothing under the plan moves. */}
      {raisable !== null && CAMPAIGN.raiseControl && (
        <MarchRaiseControl
          pool={raisable}
          value={raiseModes[raisable]}
          // Only while a pool on an exhaustive position is the one being searched (see `isExhaustive`).
          searching={searching && isExhaustive(raiseModes[raisable])}
          trades={trades}
          onChange={onRaise}
        />
      )}
      {burnable && <MarchBurnCeiling burn={burn} ceiling={burnCeiling} onChange={onBurnCeiling} />}
    </Stack>
  );
}

/**
 * The types this march does not field — **its own part of the pane**, under a hairline (the spacing
 * contract's third section, `MarchPaneSpacing.dc.html`). It used to hang off the bottom of the pools
 * inside the same block, which is why the owner read the pane as one undivided run: a footnote and
 * the army it is a footnote to had the same separation as two pools.
 */
export interface MarchLeftOutProps {
  /** Types this march does not field, with the reason; a press on one puts it back. */
  leftOut: LeftOutUnit[];
}

export function MarchLeftOut({ leftOut }: MarchLeftOutProps) {
  if (leftOut.length === 0) return null;
  return (
    <Stack gap={8}>
      <Text span className={classes.meta} c="dimmed">
        Left out
      </Text>
      {/* One row, two kinds: the pill carries `data-left-out="you" | "search"` and says which in
          its name, because a player wants to know whether they took a type out or the solver did.
          The press is the same either way — the type goes back in and the sizer decides its count. */}
      <Group gap={8} wrap="wrap" role="group" aria-label="Left out of this march">
        {leftOut.map((entry) => (
          <LeftOutPill
            key={entry.unit.id}
            unit={entry.unit}
            reason={entry.reason}
            onPutBack={() => {
              putBackInMarch(entry.unit.id);
            }}
          />
        ))}
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => {
            putBackAllInMarch(leftOut.map((entry) => entry.unit.id));
          }}
        >
          Put back all
        </Button>
      </Group>
    </Stack>
  );
}

/**
 * **What the last March edit did**, in one line under the pills (S-104; design rule 15, and rule 5 — the
 * pills say what is marching, the left-out row says what is not, and neither of them can say this).
 *
 * The owner, 2026-09-19: *"I'm able to put it back in and the plan then computes safely the best course of
 * action with the new parameters in mind … without putting out another, because then we're manually fixing
 * the reco without clicking Generate."* The plan bar keeps showing the plan's own stops — the bar's rows are
 * the plan's, the tweaked march is the pane's — so this line is where the pane says the two have parted, and
 * on what terms. It draws nothing until an edit has been computed (`RunState.resize`).
 */
export function MarchResized({ units }: { units: readonly UnitDef[] }) {
  const resize = useRunStore((state) => state.resize);
  if (resize === null) return null;
  return (
    <Text span role="status" className={classes.meta} c="dimmed">
      {resizeWords(resize, units)}
    </Text>
  );
}

/**
 * **A thin shelter, said under the army** (S-141; owner, 2026-09-24: *"Let's perhaps add a faint warning ? at
 * least if it at 0.01%"*). The pills are where a player reads the stacks, so the sentence about two of them is
 * the line under the pills, in the same 12 px muted ink as the other lines the pane writes about the march
 * it shows (`MarchResized`, `MarchEditedNote`) — no box and no icon: it is a caution, not an error (design
 * rules 15, 22 and 23). A hired stack the enemy reaches before the troops is the stronger fact, so it keeps
 * the size and takes the body ink instead of the muted one; colour stays out of it, because red is the
 * mercenaries' group colour (rule 20). Nothing is drawn while the shelter is wider than
 * `CAMPAIGN.shelterWarning`.
 */
export function MarchShelterNote({ result, units }: { result: StackResult; units: readonly UnitDef[] }) {
  const note = shelterNote(result, units);
  if (note === null) return null;
  return (
    <Text
      className={classes.meta}
      data-shelter={note.tone}
      {...(note.tone === 'thin' ? { c: 'dimmed' } : {})}
    >
      {note.text}
    </Text>
  );
}

export interface MarchCountsBarProps {
  /** Every stack, for "Copy all counts". */
  countRows: MarchStackRow[];
  editing: boolean;
  onEditing: (editing: boolean) => void;
  /** Some count was changed by hand, so there is something to undo. */
  edited: boolean;
  onUndo: () => void;
}

/**
 * **One whole-march action, as a mark** (owner, 2026-09-21: *"editing count, copy and share could be
 * closer to summary and use icons to avoid crowding the ui"*). Five labelled buttons were a row of
 * sentences wide enough to need a line of its own at the foot of the page; the same five as marks fit
 * on the March's own title line, beside the answer they act on.
 *
 * The **name is the label**, word for word, so nothing is lost with the words: a reader hears "Copy all
 * counts", and a pointer reads it in the tooltip the theme draws. These are interface chrome and
 * therefore Lucide, never emoji — the game's own vocabulary is what a `Glyph` is for (design rule 21).
 *
 * A toggle passes `pressed`, which fills the mark and says so (`aria-pressed`); a plain action leaves it
 * out.
 */
export interface MarchActionProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  /** A mode this mark switches: filled while it is on. */
  pressed?: boolean;
  /** An action with a wait on it (the profiling run): the mark turns into a spinner while it lasts. */
  loading?: boolean;
}

export function MarchAction({ label, icon, onClick, pressed, loading }: MarchActionProps) {
  return (
    <Tooltip label={label} withinPortal>
      <ActionIcon
        size="lg"
        variant={pressed === true ? 'filled' : 'subtle'}
        {...(pressed === true ? {} : { color: 'gray' })}
        aria-label={label}
        {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
        {...(loading === undefined ? {} : { loading })}
        onClick={onClick}
      >
        {icon}
      </ActionIcon>
    </Tooltip>
  );
}

/**
 * The two things a player does with the counts: copy every one of them at once, or turn each pill's
 * count into a field in place. **This is the copy control** (owner, 2026-09-13): a press on a pill
 * leaves its type out, so there is no second, smaller copy hiding in the grid — and the count on a pill
 * is still text a player can select by hand.
 *
 * Marks rather than sentences since 2026-09-21, and no row of their own: they are part of the toolbar
 * on the March's title line (`MarchFoot.tsx`, `MarchActions`), so this hands over the marks themselves
 * and lets its host space them.
 */
export function MarchCountsBar({ countRows, editing, onEditing, edited, onUndo }: MarchCountsBarProps) {
  const [flash, setFlash] = useFlash();

  return (
    <>
      {/* What the last press did, where a row of marks can still say it: 12 px muted, before the marks,
          and empty the rest of the time (design rule 15). */}
      <Text span role="status" size="xs" c="dimmed">
        {flash}
      </Text>
      <MarchAction
        label="Copy all counts"
        icon={<Copy size={16} aria-hidden />}
        onClick={() => {
          void copyText(countsText(countRows));
          setFlash('Copied');
        }}
      />
      {/* One toggle, not a pair of modes (owner, 2026-09-13): editing is a state the mark names, and
          there is only one copy on the page — the mark beside it. */}
      <MarchAction
        label={editing ? 'Done editing' : 'Edit counts'}
        pressed={editing}
        icon={<Pencil size={16} aria-hidden />}
        onClick={() => {
          onEditing(!editing);
        }}
      />
      {edited && <MarchAction label="Undo" icon={<Undo2 size={16} aria-hidden />} onClick={onUndo} />}
    </>
  );
}
