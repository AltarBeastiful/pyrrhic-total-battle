/**
 * The phone's command bar (design plan §5.6, story D-56; artboard `PhoneBar.dc.html`, `.bar2`).
 *
 * Below 1024 px the bottom edge carries the same four things the desktop bar carries, in two rows
 * of 44 and 48 px (the review of 2026-09-13: a 34 px chip is under every touch-target floor there
 * is, and the row is the one thing on this page a thumb lands on all day):
 *
 * - **row 1** — the three housing pools as *value chips* ("🛡️ Lead 84 300"), and a fourth chip
 *   carrying the objective by name. A chip is the figure, not a field, until a thumb lands on it:
 *   then it becomes a plain input **in its own place**, with its value selected so the next
 *   keystroke replaces it, and `Enter` or leaving it puts the figure back (design rule 9). The
 *   glyph and the pool's short name stay put through all of it — an emoji is never the only label,
 *   and a chip that loses its word when it opens is a chip you have to remember the meaning of.
 * - **row 2** — the answer in one line, whose whole half opens the March sheet, and Generate.
 *
 * Sticky rather than fixed: as the last block of the frame it is pinned to the bottom edge while
 * the page scrolls and lands in the flow at the end of it, so the page reserves its ~120 px and the
 * bar covers nothing. `interactive-widget=resizes-content` (`index.html`) is the other half of
 * that promise: the on-screen keyboard shrinks the page rather than covering it, so the bar and the
 * field being typed in stay above the keys.
 *
 * A finished run has to be visible *here*, because this summary is the only place a phone shows the
 * answer while the sheet is shut: `pulse` counts the runs, and a new count restarts the one short
 * flash on the summary. It is a count rather than a flag so that a second run flashes again; it is
 * honoured only where the player has not asked for stillness (`prefers-reduced-motion`), and the
 * sentence the shell announces says the same thing without it.
 */
import { NumberInput, Popover, UnstyledButton } from '@mantine/core';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

import type { Pool } from '@/engine/types';
import { Glyph } from '@/ui/domain';
import { ChoiceList } from '@/ui/kit';
import { amount, MarchGenerateButton, MarchQuickSummary } from '@/ui/sections/march';

import { OBJECTIVE_CHOICES, POOL_LABELS, POOL_SHORT, POOLS, useCommandBar } from './command';
import classes from './shell.module.css';
import { useBarForm } from './useGenerateRun';

/** The objective as a short list: in a popover this narrow, the sentences are the card's job. */
const OBJECTIVE_ITEMS = OBJECTIVE_CHOICES.map((choice) => ({ value: choice.value, title: choice.title }));

export interface BottomBarProps {
  /** Opens the March sheet: the answer half of the bar is one big target. */
  onOpenRecap: () => void;
  /** How many runs have finished with the sheet shut; each one flashes the summary once. */
  pulse?: number;
}

export function BottomBar({ onOpenRecap, pulse = 0 }: BottomBarProps) {
  const { housing, priority, objectiveTitle, problems, message, setPool, setObjective } = useCommandBar();
  const form = useBarForm();

  return (
    /* The same form the desktop bar is (`CommandBar.tsx`): `Enter` in a chip's field puts the
       figure back and generates. */
    <form className={classes.bottomBar} aria-label="This march" {...form}>
      {message !== null && (
        <p className={classes.barMessage} role="alert">
          {message}
        </p>
      )}
      {housing !== null && (
        <div className={classes.housingRow}>
          {POOLS.map((pool) => (
            <HousingChip
              key={pool}
              pool={pool}
              value={housing[pool]}
              problem={problems[pool]}
              onChange={(value) => {
                setPool(pool, value);
              }}
            />
          ))}
          <ObjectiveChip value={priority} title={objectiveTitle} onChange={setObjective} />
        </div>
      )}
      <div className={classes.answerRow}>
        <UnstyledButton
          type="button"
          className={classes.answerTap}
          aria-label="Open the march recap"
          onClick={onOpenRecap}
        >
          {/* Keyed on the run count so the animation is re-run rather than re-declared: a CSS
              animation only restarts when the element it is on is a new one. */}
          <div key={pulse} className={pulse > 0 ? classes.pulse : undefined}>
            <MarchQuickSummary />
          </div>
        </UnstyledButton>
        <MarchGenerateButton size="sm" />
      </div>
    </form>
  );
}

interface HousingChipProps {
  pool: Pool;
  value: number;
  /** What is wrong with the figure, or `null`; the words are the bar's one message line. */
  problem: string | null;
  onChange: (value: number) => void;
}

/** One pool: a figure to read under its name, and — once tapped — the field that figure is typed in. */
function HousingChip({ pool, value, problem, onChange }: HousingChipProps) {
  const [editing, setEditing] = useState(false);
  const label = POOL_LABELS[pool];
  const short = POOL_SHORT[pool];

  if (editing) {
    return (
      <div className={classes.chipField} data-error={problem === null ? undefined : true}>
        <span className={classes.chipGlyph}>
          <Glyph kind={pool} />
        </span>
        <span className={classes.chipBody}>
          <span className={classes.chipWord}>{short}</span>
          <NumberInput
            // The label is the word standing above the field, and there is no room for a second
            // one: the pool's full name reaches a screen reader as the field's own name.
            aria-label={label}
            // The theme selects the whole value on focus, so the keyboard that opens replaces it.
            autoFocus
            variant="unstyled"
            classNames={{ input: classes.chipInput }}
            value={value === 0 ? '' : value}
            min={0}
            allowDecimal={false}
            allowNegative={false}
            error={problem !== null}
            // The digits pad, and an Enter key that says "go". Through `attributes` because
            // Mantine writes `inputMode` itself after the props it was given (`NumberField`).
            attributes={{ input: { inputMode: 'numeric' } }}
            enterKeyHint="go"
            onChange={(next) => {
              const parsed = typeof next === 'number' ? next : Number(String(next).replace(/\D/g, ''));
              onChange(Number.isNaN(parsed) ? 0 : parsed);
            }}
            onKeyDown={(event) => {
              // Enter puts the figure back in its chip; the *bar* is what turns the same key into
              // a Generate (`useBarForm`), one handler for every field at both widths, so nothing
              // is prevented here — the key goes on bubbling to the form.
              if (event.key === 'Enter') setEditing(false);
            }}
            onBlur={() => {
              setEditing(false);
            }}
          />
        </span>
      </div>
    );
  }

  return (
    <UnstyledButton
      type="button"
      className={classes.chip}
      data-empty={value === 0 ? true : undefined}
      data-error={problem === null ? undefined : true}
      // The glyph and the short word are what the eye reads; the full name is what a screen
      // reader is given, with the figure, because "Lead" is not a word for anybody's ears.
      aria-label={`${label} ${amount(value)}`}
      onClick={() => {
        setEditing(true);
      }}
    >
      <span className={classes.chipGlyph}>
        <Glyph kind={pool} />
      </span>
      <span className={classes.chipBody}>
        <span className={classes.chipWord}>{short}</span>
        <span className={classes.chipValue}>{amount(value)}</span>
      </span>
    </UnstyledButton>
  );
}

interface ObjectiveChipProps {
  value: string;
  title: string;
  onChange: (value: string) => void;
}

/**
 * The fourth chip: what this Generate is aiming at, by name, with the chevron that opens the five
 * objectives as rows (design rule 8). A bare chevron was a control with no label at all — the
 * review of 2026-09-13 could not tell what it opened without pressing it.
 */
function ObjectiveChip({ value, title, onChange }: ObjectiveChipProps) {
  const [opened, setOpened] = useState(false);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="top-end"
      withArrow
      shadow="md"
      trapFocus
      width={260}
    >
      <Popover.Target>
        <UnstyledButton
          type="button"
          className={classes.objectiveChip}
          aria-label={`Objective: ${title}`}
          aria-expanded={opened}
          onClick={() => {
            setOpened((open) => !open);
          }}
        >
          <span className={classes.objectiveName}>{title}</span>
          <ChevronDown size={14} aria-hidden className={classes.chipChevron} />
        </UnstyledButton>
      </Popover.Target>
      <Popover.Dropdown>
        <ChoiceList
          label="Objective"
          value={value}
          items={OBJECTIVE_ITEMS}
          onChange={(next) => {
            onChange(next);
            setOpened(false);
          }}
        />
      </Popover.Dropdown>
    </Popover>
  );
}
