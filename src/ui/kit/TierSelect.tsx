/**
 * One end of a group's tier range (plan §3, TotalStack's "from G1 to G4"), as a **stepper** — the
 * owner's correction of 2026-09-13 and design rule 10: a tier list is at most nine ordered values,
 * which is exactly what a stepper is for, and a native select on a phone opens a modal wheel for a
 * choice between "G3" and "G4".
 *
 * A 30 px well — the same well every figure on the page sits in — with a quiet arrow at each end and
 * the tier written between them. The clamping is the whole reason this is a composite rather than
 * two buttons at the call site: the two ends of a range constrain each other, so the "from" stepper
 * may not step past the "to" value and a value outside the window is shown, and reported, clamped.
 *
 * The value carries `role="spinbutton"` and the arrows are siblings of it rather than its children,
 * so a keyboard gets the arrow keys on the value itself *and* two real buttons, and no widget ends
 * up nested inside another (investigation 0007's own lesson, and axe's `nested-interactive`).
 *
 * **A live end is a key; a dead end is the same arrow, greyed** (owner, 2026-09-21: *"it's actually
 * hard to distinguish at first glance which arrow is movable and which is not"*, then *"can't we
 * still use arrows … and grey them out a bit"*). Stock `ActionIcon`s left the whole difference to a
 * shade of grey, which is a signal you can only read by holding the two arrows side by side — and
 * at rest the dead ones sit at opposite ends of two different wells, with nothing beside them to
 * compare against. Worse, Mantine's `--mantine-color-disabled` is `dark-6`, 1.42:1 lighter than our
 * dark well, so in the dark scheme the arrow that *cannot* be pressed was the only one wearing a
 * box. Both ends keep their chevron; what carries the state is **the box, and only then the grey**
 * (design rule 24 — the grey is never on its own): an end that can still be stepped wears the
 * raised ground and hairline every pressable thing on the page wears, and an end that cannot wears
 * no ground at all and is faded to 2.6:1 light / 3.5:1 dark against the live arrow's 13.0 / 17.6.
 *
 * **The value is written in its tier's ink** (owner, 2026-09-18: *"G1-G2 S1 … should have colors …
 * the colors are the same for all troops, only the mnemonic Gx Sx should be colored"*), as
 * TotalStack's stepper does (investigation 0021): one colour a tier whatever the group, on the text
 * alone — the well, the arrows and the "—" position stay as they are. The ink is `tierInk`, the same
 * one a tier badge and a march pill are drawn in, so "G3" here and "III" on the pill agree.
 */
import { ActionIcon, Group, Text } from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import classes from './kit.module.css';
import { clampTier, tierInk, type TierPrefix } from './tiers';

const NONE = '—';

export interface TierSelectProps {
  /** The accessible name of this end ("Guardsmen from", "Monsters to"); no visible label. */
  label: string;
  prefix: TierPrefix;
  /** Every tier the group has, lowest first. */
  tiers: number[];
  /** `null` is the "none" position, only reachable when `allowNone`. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Adds a "—" position below the first tier. */
  allowNone?: boolean;
  /**
   * Lowest tier this end may take — how a "to" value clamps its "from" stepper, and back. Explicitly
   * `undefined` is allowed: a section computes these from the other end, which may be "none".
   */
  min?: number | undefined;
  /** Highest tier this end may take. */
  max?: number | undefined;
  disabled?: boolean;
  w?: number | string;
}

const CHEVRON = { down: ChevronLeft, up: ChevronRight } as const;

/**
 * One end of the well. `atLimit` is the range ending here — the tier is the lowest the other end
 * still allows, or the highest the group has — and it is the whole of the difference between a key
 * and a faded arrow. The button is disabled either way, so a screen reader and a keyboard read the
 * end exactly as they did before; what changed is what a glance gets.
 */
function StepperEnd({
  direction,
  label,
  atLimit,
  disabled,
  onPress,
}: {
  direction: 'down' | 'up';
  label: string;
  atLimit: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const Chevron = CHEVRON[direction];
  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size={22}
      disabled={disabled || atLimit}
      className={atLimit ? classes.stepperEnd : classes.stepperKey}
      aria-label={`${label}: one tier ${direction}`}
      onClick={onPress}
    >
      <Chevron size={13} aria-hidden />
    </ActionIcon>
  );
}

export function TierSelect({
  label,
  prefix,
  tiers,
  value,
  onChange,
  allowNone = false,
  min,
  max,
  disabled = false,
  w = 84,
}: TierSelectProps) {
  const shown = clampTier(value, min, max);
  // Every position this end may take, in order: "none" first when it has one, then the tiers the
  // other end still allows.
  const steps: (number | null)[] = [
    ...(allowNone ? [null] : []),
    ...tiers.filter((tier) => (min === undefined || tier >= min) && (max === undefined || tier <= max)),
  ];
  const at = steps.indexOf(shown);
  const text = shown === null ? NONE : `${prefix}${String(shown)}`;

  const step = (delta: number): void => {
    if (disabled || steps.length === 0) return;
    const next = steps[Math.min(steps.length - 1, Math.max(0, (at === -1 ? 0 : at) + delta))];
    if (next === undefined || next === shown) return;
    onChange(next);
  };

  const jump = (index: number): void => {
    const next = steps[index];
    if (next === undefined || next === shown) return;
    onChange(next);
  };

  return (
    <Group gap={0} wrap="nowrap" w={w} className={classes.stepper}>
      <StepperEnd
        direction="down"
        label={label}
        atLimit={at <= 0}
        disabled={disabled}
        onPress={() => {
          step(-1);
        }}
      />
      <Text
        component="div"
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuenow={shown ?? 0}
        aria-valuemin={allowNone ? 0 : (steps[0] ?? 0)}
        aria-valuemax={steps.at(-1) ?? 0}
        aria-valuetext={text}
        {...(disabled ? { 'aria-disabled': true } : {})}
        className={classes.stepperValue}
        fz="0.8125rem"
        fw={600}
        c={shown === null ? 'dimmed' : tierInk(shown)}
        onKeyDown={(event) => {
          const key = event.key;
          if (key === 'ArrowUp' || key === 'ArrowRight') step(1);
          else if (key === 'ArrowDown' || key === 'ArrowLeft') step(-1);
          else if (key === 'Home') jump(0);
          else if (key === 'End') jump(steps.length - 1);
          else return;
          event.preventDefault();
        }}
      >
        {text}
      </Text>
      <StepperEnd
        direction="up"
        label={label}
        atLimit={at === steps.length - 1}
        disabled={disabled}
        onPress={() => {
          step(1);
        }}
      />
    </Group>
  );
}
