/**
 * The phone's command bar (design plan §5.6, story D-56; artboard `PhoneBar.dc.html`, `.bar2`).
 *
 * Below 1200 px the bottom edge carries the same four things the desktop bar carries, in two rows
 * of 34 and 40 px:
 *
 * - **row 1** — the three housing pools as *value chips* ("🛡️ 84 300"), and a fourth chip that
 *   opens the objective. A chip is the figure, not a field, until a thumb lands on it: then it
 *   becomes a plain input in its own place, with its value selected so the next keystroke replaces
 *   it, and `Enter` or leaving it puts the figure back (design rule 9). Nothing moves when it
 *   swaps — the field is the chip's own 34 px box.
 * - **row 2** — the answer in one line, whose whole half opens the March sheet, and Generate.
 *
 * Sticky rather than fixed: as the last block of the frame it is pinned to the bottom edge while
 * the page scrolls and lands in the flow at the end of it, so the page reserves its ~102 px and the
 * bar covers nothing.
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

import { OBJECTIVE_CHOICES, POOL_LABELS, POOLS, useCommandBar } from './command';
import classes from './shell.module.css';

/** The objective as a short list: in a popover this narrow, the sentences are the card's job. */
const OBJECTIVE_ITEMS = OBJECTIVE_CHOICES.map((choice) => ({ value: choice.value, title: choice.title }));

export interface BottomBarProps {
  /** Opens the March sheet: the answer half of the bar is one big target. */
  onOpenRecap: () => void;
  /** How many runs have finished with the sheet shut; each one flashes the summary once. */
  pulse?: number;
}

export function BottomBar({ onOpenRecap, pulse = 0 }: BottomBarProps) {
  const { housing, priority, objectiveTitle, setPool, setObjective } = useCommandBar();

  return (
    <div className={classes.bottomBar}>
      {housing !== null && (
        <div className={classes.housingRow}>
          {POOLS.map((pool) => (
            <HousingChip
              key={pool}
              pool={pool}
              value={housing[pool]}
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
          className={classes.tapRow}
          style={{ flex: '1 1 auto' }}
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
    </div>
  );
}

interface HousingChipProps {
  pool: Pool;
  value: number;
  onChange: (value: number) => void;
}

/** One pool: a figure to read, and — once tapped — the field that figure is typed in. */
function HousingChip({ pool, value, onChange }: HousingChipProps) {
  const [editing, setEditing] = useState(false);
  const label = POOL_LABELS[pool];

  if (editing) {
    return (
      <NumberInput
        className={classes.chipField}
        // The label is the chip it replaced, and there is no room for one over a 34 px box: the
        // pool's name reaches a screen reader as the field's own name instead.
        aria-label={label}
        // The theme selects the whole value on focus, so the keyboard that opens replaces it.
        autoFocus
        value={value === 0 ? '' : value}
        min={0}
        max={100_000_000}
        allowDecimal={false}
        allowNegative={false}
        onChange={(next) => {
          const parsed = typeof next === 'number' ? next : Number(String(next).replace(/\D/g, ''));
          onChange(Number.isNaN(parsed) ? 0 : parsed);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
        onBlur={() => {
          setEditing(false);
        }}
      />
    );
  }

  return (
    <UnstyledButton
      className={value === 0 ? classes.chipEmpty : classes.chip}
      // The glyph is decoration beside the figure, so the chip says which pool it is in words.
      aria-label={`${label} ${amount(value)}`}
      onClick={() => {
        setEditing(true);
      }}
    >
      <Glyph kind={pool} />
      <span>{amount(value)}</span>
    </UnstyledButton>
  );
}

interface ObjectiveChipProps {
  value: string;
  title: string;
  onChange: (value: string) => void;
}

/** The fourth chip: a chevron that opens the five objectives as rows (design rule 8). */
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
          className={classes.objectiveChip}
          aria-label={`Objective: ${title}`}
          aria-expanded={opened}
          onClick={() => {
            setOpened((open) => !open);
          }}
        >
          <ChevronDown size={16} aria-hidden />
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
