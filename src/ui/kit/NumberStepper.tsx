import { useContext } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import {
  Button,
  Group,
  Input,
  Label,
  NumberField,
  NumberFieldStateContext,
  Text,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { MinusIcon, PlusIcon } from '../icons';
import { cn } from './cn';
import {
  fieldBox,
  fieldDescription,
  fieldError,
  fieldInput,
  fieldLabel,
  fieldRoot,
  ringWithin,
} from './fieldStyles';
import { ring } from './styles';

export interface NumberStepperProps {
  /** The visible name of the number ("Leadership", "Owned"). */
  label: string;
  /** `null` is an empty field; the stepper never invents a 0 the player did not type. */
  value: number | null;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  /** How far `Shift` + an arrow key moves. */
  bigStep?: number;
  /** How far `Ctrl` (`⌘` on a Mac) + an arrow key moves. */
  hugeStep?: number;
  /** A glyph inside the field before the value (a pool badge, a coin). Decorative. */
  prefix?: ReactNode;
  /** A unit inside the field after the value, e.g. "%". */
  suffix?: string;
  /** Clearing the field reports `null` instead of snapping back to the last value. */
  allowEmpty?: boolean;
  size?: 'sm' | 'md';
  description?: string;
  errorMessage?: string;
  /** Passed to `Intl.NumberFormat`: decides grouping, decimals and what may be typed. */
  formatOptions?: Intl.NumberFormatOptions;
  isDisabled?: boolean;
  className?: string;
}

const stepperStyles = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    box: cn(fieldBox, 'overflow-hidden', ringWithin),
    input: cn(fieldInput, 'px-1 text-center'),
    step: cn(
      'text-muted hover:text-fg hover:bg-raised focus-visible:bg-raised flex shrink-0 items-center justify-center',
      'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
      ring,
    ),
    affix: 'text-muted shrink-0 px-1 text-sm',
    description: fieldDescription,
    error: fieldError,
  },
  variants: {
    size: {
      sm: {
        box: 'min-h-9 sm:min-h-8',
        input: 'text-sm',
        step: 'size-9 sm:size-8',
      },
      md: {
        box: 'min-h-11 sm:min-h-9',
        input: 'text-base sm:text-sm',
        step: 'size-11 sm:size-9',
      },
    },
    isInvalid: {
      true: { box: 'border-danger' },
      false: {},
    },
  },
  defaultVariants: { size: 'md', isInvalid: false },
});

function clamp(value: number, min: number | undefined, max: number | undefined): number {
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}

/**
 * The input of the stepper, with the modifier jumps on top of React Aria's plain arrow keys.
 * React Aria's own shortcuts are registered for bare `ArrowUp`/`ArrowDown`, so a held `Shift` or
 * `Ctrl`/`⌘` never reaches them and there is no double step to undo.
 */
function StepperInput({
  bigStep,
  hugeStep,
  className,
}: {
  bigStep: number;
  hugeStep: number;
  className: string;
}) {
  const state = useContext(NumberFieldStateContext);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (state === null) return;
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    const jump = event.ctrlKey || event.metaKey ? hugeStep : event.shiftKey ? bigStep : 0;
    if (jump === 0) return;

    event.preventDefault();
    const from = Number.isNaN(state.numberValue) ? (state.minValue ?? 0) : state.numberValue;
    const next = event.key === 'ArrowUp' ? from + jump : from - jump;
    state.setNumberValue(clamp(next, state.minValue, state.maxValue));
  };

  return <Input className={className} onKeyDown={onKeyDown} />;
}

/**
 * A number with a minus and a plus button inside the field. Arrow keys and the wheel step by
 * `step`, `Shift` by `bigStep` and `Ctrl`/`⌘` by `hugeStep`; pasted or typed figures are parsed in
 * the player's locale, so "84 300", "84,300" and "84300" all land on 84 300.
 */
export function NumberStepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  bigStep = 10,
  hugeStep = 100,
  prefix,
  suffix,
  allowEmpty = false,
  size = 'md',
  description,
  errorMessage,
  formatOptions,
  isDisabled = false,
  className,
}: NumberStepperProps) {
  const styles = stepperStyles({ size, isInvalid: errorMessage !== undefined });

  const bounds: { minValue?: number; maxValue?: number; formatOptions?: Intl.NumberFormatOptions } = {};
  if (min !== undefined) bounds.minValue = min;
  if (max !== undefined) bounds.maxValue = max;
  if (formatOptions !== undefined) bounds.formatOptions = formatOptions;

  return (
    <NumberField
      className={cn(styles.root(), className)}
      value={value ?? Number.NaN}
      onChange={(next) => {
        if (Number.isNaN(next)) {
          if (allowEmpty) onChange(null);
          return;
        }
        onChange(next);
      }}
      step={step}
      isDisabled={isDisabled}
      isInvalid={errorMessage !== undefined}
      decrementAriaLabel={`Decrease ${label}`}
      incrementAriaLabel={`Increase ${label}`}
      {...bounds}
    >
      <Label className={styles.label()}>{label}</Label>
      <Group className={styles.box()}>
        <Button slot="decrement" className={styles.step()}>
          <MinusIcon />
        </Button>
        {prefix !== undefined && <span className={styles.affix()}>{prefix}</span>}
        <StepperInput className={styles.input()} bigStep={bigStep} hugeStep={hugeStep} />
        {suffix !== undefined && <span className={styles.affix()}>{suffix}</span>}
        <Button slot="increment" className={styles.step()}>
          <PlusIcon />
        </Button>
      </Group>
      {description !== undefined && (
        <Text slot="description" className={styles.description()}>
          {description}
        </Text>
      )}
      {errorMessage !== undefined && (
        <Text slot="errorMessage" className={styles.error()}>
          {errorMessage}
        </Text>
      )}
    </NumberField>
  );
}
