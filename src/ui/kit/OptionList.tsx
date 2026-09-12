/**
 * One choice out of a handful of unlike rules — Material 3's **single-select list** (design plan
 * §7.4). Every option is a full-width list item: a leading radio mark, the title, one quiet line of
 * supporting text, and an optional trailing control. The row itself is the target, so there is
 * nothing small to hit; the chosen row is tonal with a rule down its leading edge, and the others
 * wear a state layer.
 *
 * This is not a `Select`: a select hides the choices behind a trigger and reads its options one at a
 * time. Use `OptionList` when the *reasons* matter (the stacking method, the objective) and `Select`
 * when the list is long and the labels speak for themselves.
 *
 * The radio's spoken name is the title alone (`aria-label`), with the supporting text wired as its
 * description — otherwise a screen reader would read a paragraph where a player hears three words.
 * A trailing control sits outside the row's label, so pressing it never moves the selection.
 *
 * `collapsible` is the phone form: only the chosen row shows, with a "Change" button that unfolds
 * the rest; choosing folds it back.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Label, RadioButton, RadioField, RadioGroup, Text } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { Button } from './Button';
import { cn } from './cn';
import { fieldDescription, fieldLabel, fieldRoot } from './fieldStyles';
import { ring, stateLayerDom, tapTarget } from './styles';

export interface OptionListItem {
  value: string;
  /** The row's name, and everything a screen reader says about it. */
  title: string;
  /** One line under the title, in the glossary's words. */
  description?: string;
  /** A control at the end of the row (a Button). It is its own target, never the row's. */
  trailing?: ReactNode;
  isDisabled?: boolean;
}

export interface OptionListProps {
  /** The visible name of the choice ("Stacking method", "Objective"). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionListItem[];
  /** Show the chosen row alone, with a "Change" button that unfolds the list (phones). */
  collapsible?: boolean;
  isDisabled?: boolean;
  className?: string;
}

const optionList = tv({
  slots: {
    root: fieldRoot,
    label: fieldLabel,
    list: 'rounded-card border-line divide-line flex flex-col divide-y border',
    // The row is the container: it carries the tonal fill and the state layer, so hovering
    // anywhere on the line — the trailing button included — lights the whole option.
    row: cn('flex w-full items-center gap-2 pr-2', stateLayerDom, 'motion-safe:transition-colors'),
    target: cn(
      'group flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2 pl-3',
      tapTarget,
      ring,
      'focus-visible:-outline-offset-2',
    ),
    mark: cn(
      'rounded-chip border-field/60 flex size-5 shrink-0 items-center justify-center border-2',
      'group-selected:border-accent motion-safe:transition-colors',
    ),
    dot: cn(
      'rounded-chip bg-accent size-2.5 scale-0',
      'group-selected:scale-100 motion-safe:transition-transform motion-safe:duration-fast',
    ),
    text: 'flex min-w-0 flex-1 flex-col',
    title: 'text-fg text-sm font-medium',
    description: cn(fieldDescription, 'truncate'),
    trailing: 'flex shrink-0 items-center gap-2',
  },
  variants: {
    isSelected: {
      // A tonal step plus a rule down the leading edge: the accent is a metal, so the chosen row is
      // marked by structure rather than by a coloured block (D-19).
      true: { row: 'bg-accent-soft selection-rule-start' },
      false: {},
    },
    isDisabled: {
      true: { row: 'opacity-50', target: 'cursor-not-allowed' },
      false: {},
    },
  },
  defaultVariants: { isSelected: false, isDisabled: false },
});

export function OptionList({
  label,
  value,
  onChange,
  options,
  collapsible = false,
  isDisabled = false,
  className,
}: OptionListProps) {
  const [isExpanded, setExpanded] = useState(false);
  const styles = optionList();

  const chosen = options.find((option) => option.value === value);
  // Nothing chosen yet is no time to hide the choices: the folded form needs a row to fold to.
  const isFolded = collapsible && !isExpanded && chosen !== undefined;
  const shown = isFolded && chosen !== undefined ? [chosen] : options;

  return (
    <RadioGroup
      className={cn(styles.root(), className)}
      value={value}
      onChange={(next) => {
        onChange(next);
        setExpanded(false);
      }}
      isDisabled={isDisabled}
    >
      <Label className={styles.label()}>{label}</Label>
      <div className={styles.list()}>
        {shown.map((option) => {
          const row = optionList({
            isSelected: option.value === value,
            isDisabled: option.isDisabled ?? false,
          });
          return (
            <RadioField
              key={option.value}
              value={option.value}
              aria-label={option.title}
              isDisabled={option.isDisabled ?? false}
              className={row.row()}
            >
              <RadioButton className={row.target()}>
                <span aria-hidden="true" className={row.mark()}>
                  <span className={row.dot()} />
                </span>
                <span className={row.text()}>
                  <span className={row.title()}>{option.title}</span>
                  {option.description !== undefined && (
                    <Text slot="description" className={row.description()}>
                      {option.description}
                    </Text>
                  )}
                </span>
              </RadioButton>
              {isFolded ? (
                <span className={row.trailing()}>
                  <Button
                    variant="quiet"
                    size="sm"
                    aria-label={`Change ${label}`}
                    onPress={() => {
                      setExpanded(true);
                    }}
                  >
                    Change
                  </Button>
                </span>
              ) : option.trailing === undefined ? null : (
                <span className={row.trailing()}>{option.trailing}</span>
              )}
            </RadioField>
          );
        })}
      </div>
    </RadioGroup>
  );
}
