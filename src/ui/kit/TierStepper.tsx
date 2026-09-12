import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Button, Popover, ToggleButton, ToggleButtonGroup } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { ChevronLeftIcon, ChevronRightIcon } from '../icons';
import { cn } from './cn';
import { fieldBox, fieldButton, fieldHeight, fieldLabel, fieldRoot, ringWithin } from './fieldStyles';
import { ring, stateLayer } from './styles';

export interface TierStepperProps {
  /** The visible name of the end being set ("Guardsmen from", "Monsters to"). */
  label: string;
  /** The letter a tier of this group is written with: "G", "S", "E", "M". */
  prefix: string;
  /** Every tier the group has, lowest first. */
  tiers: number[];
  /** `null` is the "none" position, only reachable when `allowNone`. */
  value: number | null;
  onChange: (value: number | null) => void;
  /** Adds a position below the first tier, shown as "none". */
  allowNone?: boolean;
  /** Lowest tier this end may take — how a "to" value clamps its "from" stepper, and back. */
  min?: number;
  /** Highest tier this end may take. */
  max?: number;
  size?: 'sm' | 'md';
  isDisabled?: boolean;
  className?: string;
}

/** The text of one position: "G3", or "none" for the empty position. */
function positionLabel(prefix: string, tier: number | null): string {
  return tier === null ? 'none' : `${prefix}${tier}`;
}

/** Which way each arrow key moves the stepper. */
const ARROW_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowDown: -1,
  ArrowRight: 1,
  ArrowUp: 1,
};

/** The key of one position inside the strip. */
function positionKey(tier: number | null): string {
  return tier === null ? 'none' : String(tier);
}

const tierStyles = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    box: cn(fieldBox, fieldHeight, 'w-fit overflow-hidden', ringWithin),
    arrow: cn(fieldButton, 'disabled:opacity-30'),
    value: cn(
      'nums text-fg rounded-control flex shrink-0 items-center justify-center px-2 text-center font-semibold',
      'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
      stateLayer,
      'outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2',
    ),
    popover: 'rounded-card bg-raised shadow-pop max-w-full p-3',
    strip: 'flex flex-wrap gap-2',
    chip: cn(
      'nums rounded-control border-field/60 text-fg flex min-h-11 min-w-11 items-center font-semibold',
      'justify-center border bg-transparent px-2 sm:min-h-10 sm:min-w-10',
      'selected:bg-accent-soft selected:border-transparent selected:text-fg',
      stateLayer,
      ring,
    ),
  },
  variants: {
    size: {
      sm: {
        box: 'min-h-10 sm:min-h-9',
        arrow: 'size-10 sm:size-9',
        value: 'min-h-10 min-w-12 text-base sm:min-h-9',
      },
      md: { arrow: 'size-11 sm:size-10', value: 'min-h-11 min-w-14 text-lg sm:min-h-10' },
    },
  },
  defaultVariants: { size: 'md' },
});

/**
 * A stepper over a discrete list of tiers, shown as the group letter and the tier number ("G3").
 * The arrow buttons and the arrow keys move one position; pressing the value opens a strip of every
 * position for a direct jump. `min` and `max` cut the reachable positions, which is how the "from"
 * end of a range is kept under the "to" end.
 */
export function TierStepper({
  label,
  prefix,
  tiers,
  value,
  onChange,
  allowNone = false,
  min,
  max,
  size = 'md',
  isDisabled = false,
  className,
}: TierStepperProps) {
  const labelId = useId();
  const valueRef = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setOpen] = useState(false);
  const styles = tierStyles({ size });

  const reachable = tiers.filter(
    (tier) => (min === undefined || tier >= min) && (max === undefined || tier <= max),
  );
  const positions: (number | null)[] = allowNone ? [null, ...reachable] : reachable;
  const index = positions.findIndex((position) => position === value);

  const move = (delta: number) => {
    const from = index === -1 ? (delta > 0 ? positions.length - 1 : 0) : index;
    const next = from + delta;
    if (next < 0 || next >= positions.length) return;
    const target = positions[next];
    if (target === undefined) return;
    onChange(target);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const delta = ARROW_STEPS[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    move(delta);
  };

  return (
    <div className={cn(styles.root(), className)}>
      <span id={labelId} className={styles.label()}>
        {label}
      </span>
      <div className={styles.box()} role="group" aria-labelledby={labelId} onKeyDown={onKeyDown}>
        <Button
          className={styles.arrow()}
          aria-label={`${label}, lower`}
          isDisabled={isDisabled || index === 0}
          onPress={() => move(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          ref={valueRef}
          className={styles.value()}
          isDisabled={isDisabled}
          onPress={() => setOpen(true)}
        >
          {positionLabel(prefix, value)}
        </Button>
        <Button
          className={styles.arrow()}
          aria-label={`${label}, higher`}
          isDisabled={isDisabled || index === positions.length - 1}
          onPress={() => move(1)}
        >
          <ChevronRightIcon />
        </Button>
      </div>
      <Popover
        triggerRef={valueRef}
        isOpen={isOpen}
        onOpenChange={setOpen}
        aria-label={`${label}, every tier`}
        className={styles.popover()}
      >
        <ToggleButtonGroup
          className={styles.strip()}
          aria-label={`${label}, every tier`}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={index === -1 ? [] : [positionKey(value)]}
          onSelectionChange={(keys) => {
            const [first] = [...keys];
            if (first === undefined) return;
            onChange(first === 'none' ? null : Number(first));
            setOpen(false);
          }}
        >
          {positions.map((position) => (
            <ToggleButton key={positionKey(position)} id={positionKey(position)} className={styles.chip()}>
              {positionLabel(prefix, position)}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Popover>
    </div>
  );
}
