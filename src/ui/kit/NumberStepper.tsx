import { useContext, useRef } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent, ReactNode } from 'react';
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
  fieldButton,
  fieldDescription,
  fieldError,
  fieldHeight,
  fieldInput,
  fieldLabel,
  fieldRoot,
  ringWithin,
} from './fieldStyles';

export interface NumberInputProps {
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
  /**
   * Draw the minus and plus buttons. Off by default: a step button is only worth its place on a
   * **short ordered list** — a tier, a star level, a dozen values at most — and every other number
   * here is typed or pasted rather than walked to (owner, 2026-09-13). `NumberStepper` is the same
   * control with this turned on.
   */
  buttons?: boolean;
  /** Focusing or clicking the field selects all of it, so the next keystroke replaces the value. */
  selectOnFocus?: boolean;
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
    box: cn(fieldBox, fieldHeight, 'overflow-hidden', ringWithin),
    input: cn(fieldInput, 'px-1 text-center'),
    step: fieldButton,
    affix: 'text-muted shrink-0 px-1 text-sm',
    description: fieldDescription,
    error: fieldError,
  },
  variants: {
    size: {
      sm: {
        box: 'min-h-10 sm:min-h-9',
        input: 'text-sm',
        step: 'size-10 sm:size-9',
      },
      md: {
        input: 'text-base sm:text-sm',
        step: 'size-11 sm:size-10',
      },
    },
    isInvalid: {
      true: { box: 'border-danger focus-within:border-danger focus-within:outline-danger' },
      false: {},
    },
    /** Without the two buttons the value is the whole field, so it sits where you read it: left. */
    bare: {
      true: { input: 'px-3 text-left' },
      false: {},
    },
  },
  defaultVariants: { size: 'md', isInvalid: false, bare: false },
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
  selectOnFocus,
  className,
}: {
  bigStep: number;
  hugeStep: number;
  selectOnFocus: boolean;
  className: string;
}) {
  const state = useContext(NumberFieldStateContext);
  // A click both focuses and places a caret. The flag lets the focus select the value and the click
  // that caused it select it again (the browser collapses the selection in between), while a second
  // click inside an already-focused field still puts the caret where the player aimed.
  const fresh = useRef(false);

  const onFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (!selectOnFocus) return;
    fresh.current = true;
    event.currentTarget.select();
  };

  const onClick = (event: MouseEvent<HTMLInputElement>) => {
    if (!selectOnFocus || !fresh.current) return;
    fresh.current = false;
    event.currentTarget.select();
  };

  const onBlur = () => {
    fresh.current = false;
  };

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

  return (
    <Input className={className} onKeyDown={onKeyDown} onFocus={onFocus} onClick={onClick} onBlur={onBlur} />
  );
}

/**
 * A number you type. Arrow keys and the wheel step by `step`, `Shift` by `bigStep` and `Ctrl`/`⌘`
 * by `hugeStep`; pasted or typed figures are parsed in the player's locale, so "84 300", "84,300"
 * and "84300" all land on 84 300. Focusing or clicking selects the whole value, so the next
 * keystroke replaces it rather than appending to it.
 *
 * There are no minus and plus buttons: nobody walks a capacity to 84,300 one press at a time, and
 * two 44 px targets either side of every figure on the page is most of what made the form feel like
 * a wall of chrome (owner, 2026-09-13). Use `NumberStepper` — the same control with `buttons` on —
 * for the short ordered lists where stepping really is how you pick: a tier, a star level.
 */
export function NumberInput({
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
  buttons = false,
  selectOnFocus = true,
  size = 'md',
  description,
  errorMessage,
  formatOptions,
  isDisabled = false,
  className,
}: NumberInputProps) {
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
        {buttons && (
          <Button slot="decrement" className={styles.step()}>
            <MinusIcon />
          </Button>
        )}
        {prefix !== undefined && <span className={styles.affix()}>{prefix}</span>}
        <StepperInput
          className={styles.input({ bare: !buttons })}
          bigStep={bigStep}
          hugeStep={hugeStep}
          selectOnFocus={selectOnFocus}
        />
        {suffix !== undefined && <span className={styles.affix()}>{suffix}</span>}
        {buttons && (
          <Button slot="increment" className={styles.step()}>
            <PlusIcon />
          </Button>
        )}
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

/**
 * The same control with its two step buttons: for a value picked off a short ordered list, where
 * pressing "next" is the natural gesture and typing is the fallback (a captain's star level).
 */
export function NumberStepper(props: NumberInputProps) {
  return <NumberInput buttons {...props} />;
}
