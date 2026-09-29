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
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import { Copy, Pencil, Undo2 } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';

import type { StackResult, UnitDef } from '@/engine/types';
import { Glyph, LeftOutPill, poolInk, StackPill } from '@/ui/domain';
import domainClasses from '@/ui/domain/domain.module.css';
import { copyText } from '@/ui/profile/download';

import { putBackAllInMarch, putBackInMarch, removeFromFormation } from './formation';
import { amount, bonusLines } from './format';
import classes from './march.module.css';
import { isExhaustive, raisesPool } from './raise';
import type { RaiseMode, RaiseModes, RaisedPool } from './raise';
import { countsText, resizeWords } from './rows';
import type { LeftOutUnit, MarchStackRow, PoolRow } from './rows';
import { useRunStore } from './runStore';
import { shelterNote } from './shelter';

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
  editing: boolean;
  onCount: (unitId: string, count: number) => void;
  /** A pill's corner mark: the unit sheet for that one type. */
  onDetails: (unit: UnitDef) => void;
  /** The sheltered raise (S-142): the position of each hired pool's control, and whether it is offered. */
  raiseModes: RaiseModes;
  canRaise: boolean;
  /** A `Best v2` search is in flight (`raiseSearch.ts`): the position is chosen, the answer is not in. */
  searching: boolean;
  onRaise: (pool: RaisedPool, mode: RaiseMode) => void;
}

/** What each position of the raise control is called, and the one line that explains it (rule 26). */
const RAISE_CHOICES: readonly { mode: RaiseMode; label: string; help: string }[] = [
  {
    mode: 'off',
    label: 'As is',
    help: 'The counts the march was generated with.',
  },
  {
    mode: 'tens',
    label: 'Most, in tens',
    help: 'Every stack as high as it can go and still fall after your troops, in tens of units.',
  },
  {
    mode: 'most',
    label: 'Most',
    help: 'Every stack as high as it can go and still fall after your troops.',
  },
  {
    mode: 'v2',
    label: 'Best v2',
    help: 'The counts this march hits hardest with under your troops, searched exhaustively over the mercenaries and the monsters together. Slower, and never worse than the counts drawn while it runs.',
  },
  {
    mode: 'safe',
    label: 'Safe',
    help: 'Best v2 held to the mercenary stock the march already burns on screen: no extra chunks of hired units, and never worse than those counts.',
  },
  {
    mode: 'tight',
    label: 'Tight',
    help: 'Best v2 held to the stock the march was generated with — not one extra chunk — so it can only improve on those counts.',
  },
];

/** What the control is called, per pool: the group carries the pool's own name. */
const RAISE_LABEL: Record<RaisedPool, string> = {
  authority: 'Mercenary counts',
  dominance: 'Monster counts',
};

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
 * are derived from the march in `useMarch`, which is what lets the position survive a Generate.
 */
export function MarchRaiseControl({
  pool,
  value,
  searching,
  onChange,
}: {
  pool: RaisedPool;
  value: RaiseMode;
  /** The exhaustive search is still running: `Best v2` is chosen, and its answer is not in yet. */
  searching: boolean;
  onChange: (mode: RaiseMode) => void;
}) {
  const helpId = useId();
  return (
    <>
      <SegmentedControl
        size="xs"
        fullWidth
        maw={360}
        value={value}
        aria-label={RAISE_LABEL[pool]}
        aria-describedby={helpId}
        // A search in flight is a state of this control and of nothing else on the page.
        aria-busy={searching}
        data={RAISE_CHOICES.map((choice) => ({
          value: choice.mode,
          label: (
            <Tooltip label={choice.help} withinPortal withArrow>
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
        {RAISE_CHOICES.map((choice) => `${choice.label}: ${choice.help}`).join(' ')}
        {searching ? ' Searching every combination.' : ''}
      </VisuallyHidden>
    </>
  );
}

/**
 * The march at a glance: the pools, their stacks, and what was left out. On a desktop the whole
 * pane stays on screen while the setup scrolls past it (`shell/MarchPane.tsx`), so this block and
 * the whole-march actions under it travel together and neither can cover the other.
 */
export function MarchPills({
  rows,
  editing,
  onCount,
  onDetails,
  raiseModes,
  canRaise,
  searching,
  onRaise,
}: MarchPillsProps) {
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
              if (event.key !== 'Escape') return;
              event.stopPropagation();
              useRunStore.getState().setEditingCounts(false);
            }
          : undefined
      }
    >
      {rows.map((row) => {
        const over = row.used > row.capacity;
        // The pool this row's raise control speaks for, or `null` when there is none to draw — a named
        // `const` because a narrowing on `row.pool` does not survive into the control's own callbacks.
        const raisable = canRaise && raisesPool(row.pool) && row.entries.length > 0 ? row.pool : null;
        return (
          <Stack key={row.pool} gap="xs">
            {/* The pool line, to the spacing contract (`MarchPaneSpacing.dc.html`, `.pool`): the
                figure **22/700** in the pool's colour, the glyph in a 20 px box, and "of 20 000
                leadership" at 12 px muted — the pool's *name*, which the line never said, so three
                figures over three grids of pills were told apart by an emoji alone. */}
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
            {/* How high these stacks are asked to stand, read with the stacks it moves (S-142). Drawn on the
                hired pools of a plan's march only, and only while there is a stack to raise. */}
            {raisable !== null && (
              <MarchRaiseControl
                pool={raisable}
                value={raiseModes[raisable]}
                // **Only the control whose pool is being searched says it is waiting.** The search walks the
                // pools standing on an exhaustive position, and a mixed control (the mercenaries on one of
                // them, the monsters on `Most`) still runs one — so a plain `searching` here put a spinner,
                // `aria-busy` and the hidden "Searching every combination." on a block that was not the one
                // being searched.
                searching={searching && isExhaustive(raiseModes[raisable])}
                onChange={(mode) => {
                  onRaise(raisable, mode);
                }}
              />
            )}
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
}

export function MarchAction({ label, icon, onClick, pressed }: MarchActionProps) {
  return (
    <Tooltip label={label} withinPortal>
      <ActionIcon
        size="lg"
        variant={pressed === true ? 'filled' : 'subtle'}
        {...(pressed === true ? {} : { color: 'gray' })}
        aria-label={label}
        {...(pressed === undefined ? {} : { 'aria-pressed': pressed })}
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
