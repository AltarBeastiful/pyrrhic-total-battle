/**
 * The command bar (design plan §5.6, story D-56; artboard `CommandBar.dc.html`, `.cmd`).
 *
 * From 1024 px the bottom edge of the page carries what changes with every march: the three
 * housing pools as plain wells with their glyph, the objective as one compact select, and the gold
 * Generate. It is the only thing sticky on that edge — the app bar is the other edge's one bar
 * (design rule 2 as amended) — and it is **full bleed**: its ground reaches the bottom and both
 * sides of the window, 12 px of radius on its two top corners alone, so nothing of the page shows
 * under it (the review of 2026-09-13 found 24 px of live page scrolling past beneath the bar).
 * Its content still stops on the page's own lines, because the dock holds a `Container`.
 *
 * The bar is in the flow, at the end of the frame: the page reserves its height and the last row of
 * the setup can always be scrolled clear of it. The March pane measures the same height out of the
 * window (`shell/usePaneStick.ts`), so the bar never lands on the pills.
 *
 * Between 1024 and 1199 px the March has no pane to live in, so the bar carries the answer too and
 * the sheet opens from it: the answer and Generate travel together at every width (design rule 2).
 *
 * Tab order is the order a march is set up in: leadership → authority → dominance → objective →
 * Generate. `Ctrl`/`⌘ + Enter` still generates from anywhere; so does a plain `Enter`, because the
 * bar is a form and Generate is the button it submits with.
 */
import { ActionIcon, Select, Text, UnstyledButton } from '@mantine/core';

import { Glyph } from '@/ui/domain';
import { NumberField } from '@/ui/kit';

import { useCalculatorBar, type BarFrame } from './barFrame';
import { OBJECTIVE_CHOICES, OBJECTIVE_LOCKED_REASON, POOL_LABELS } from './command';
import { ObjectiveWhy } from './ObjectiveWhy';
import classes from './shell.module.css';
import { TWO_PANES, useMediaQuery } from './useMediaQuery';

/** The objective in one line each: the sentence under it is the Battle card's business, not a bar's. */
const OBJECTIVE_DATA = OBJECTIVE_CHOICES.map((choice) => ({ value: choice.value, label: choice.title }));

export interface CommandBarProps {
  /** What the bar draws; the calculator's own when absent (`useCalculatorBar`). */
  frame?: BarFrame;
  /** Given only where the March is in the sheet (1024–1199 px): the bar shows the answer as well. */
  onOpenRecap?: () => void;
  /** How many runs have finished with the sheet shut; each one flashes the summary once. */
  pulse?: number;
}

/**
 * The two columns the objective's field becomes while it is locked: `['label', 'input', 'description']`
 * puts the sentence *after* the well in the DOM, and the grid in `shell.module.css` puts it beside it —
 * reading order and drawing order the same way round (`OBJECTIVE_LOCKED_REASON`).
 */
const BESIDE: ('label' | 'input' | 'description' | 'error')[] = ['label', 'input', 'description', 'error'];

export function CommandBar(props: CommandBarProps) {
  const calculator = useCalculatorBar();
  return <CommandBarView {...props} frame={props.frame ?? calculator} />;
}

/** The bar over a frame config: the same form, wells and Generate for whatever fight fills the frame. */
export function CommandBarView({ frame, onOpenRecap, pulse = 0 }: CommandBarProps & { frame: BarFrame }) {
  const { housing, problems, message, setPool, maximum, objective, form } = frame;
  const objectiveLocked = objective?.locked === true;
  // Room, not width for its own sake: from 1200 px the March is a pane and the bar's row is the wells
  // and Generate alone, which is the only state the sentence fits into (owner, 2026-09-21).
  const beside = useMediaQuery(TWO_PANES);
  const printed = objectiveLocked && beside;

  if (housing === null) return null;

  return (
    /* A real form, and submitting it is generating: `Enter` in any of these fields runs the march
       (`useBarForm`), `Ctrl`/`⌘ + Enter` still does it from anywhere on the page. */
    <form className={classes.commandBar} aria-label={frame.label} {...form}>
      {/* One line for the three pools, above the fields rather than under each of them: the bar is
          the height of one row of wells and a message under a field would push Generate off it. */}
      {message !== null && (
        <p className={classes.barMessage} role="alert">
          {message}
        </p>
      )}
      <div className={classes.commandRow}>
        <div className={classes.commandFields}>
          {frame.pools.map((pool) => (
            <NumberField
              key={pool}
              label={POOL_LABELS[pool]}
              leftSection={<Glyph kind={pool} />}
              // A pool at zero is one nobody has filled in yet, so the field stands empty and invites
              // the number instead of showing a 0 the player never typed.
              value={housing[pool] === 0 ? null : housing[pool]}
              min={0}
              allowEmpty
              // The field is marked, the words are the line above: three copies of the same
              // sentence in a 92 px bar is three times the noise and none of the clarity.
              error={problems[pool] !== null}
              enterKeyHint="go"
              onChange={(value) => {
                setPool(pool, value);
              }}
            />
          ))}
          {maximum !== undefined && (
            <>
              <NumberField
                label={maximum.label}
                value={maximum.percent}
                min={0}
                max={maximum.max}
                allowDecimal
                decimalScale={2}
                enterKeyHint="go"
                onChange={(value) => {
                  maximum.setPercent(value ?? 0);
                }}
              />
              {/* `type="button"`: pressing it fills the pools, it does not generate. As tall as the wells
                  (40 px): an ActionIcon, so the bar's rule for its buttons (44 px, for Generate) leaves it alone. */}
              <ActionIcon
                type="button"
                variant="default"
                size={40}
                w={64}
                flex="0 0 auto"
                aria-label={maximum.fillLabel}
                onClick={maximum.fill}
              >
                <Text span size="sm" fw={600}>
                  Max
                </Text>
              </ActionIcon>
            </>
          )}
          {/* Five objectives and "no priority", each a short line: the one control on the page a
              dropdown is honestly better at than a list of cards, because it sits in a bar 92 px
              tall (design plan §5.6; design rule 8 is about a choice that needs its sentence on
              screen). */}
          {objective !== null && (
            <Select
              label="Objective"
              data={OBJECTIVE_DATA}
              value={objective.priority}
              allowDeselect={false}
              comboboxProps={{ withinPortal: true }}
              // Locked while the plan decides it (owner, 2026-09-15). The reason goes in Mantine's own
              // `description` slot rather than a paragraph of our own: a caller's `aria-describedby` is
              // overwritten by the input's (`Input.mjs`), so the slot is the only way the sentence is
              // *linked* to the control instead of merely sitting near it — and it renders at `xs`,
              // which this theme sets to 13 px, inside rule 19's floor.
              //
              // **Beside the well, never under it** (owner, 2026-09-21): the slot under a field costs the
              // bar ~32 px of height (measured 2026-09-15: 88 px to 119.7) on the one edge of the window
              // a thumb and a Generate share. Re-ordered and laid out in two columns, the same slot is
              // two lines in the room the label and the well already take, and the bar does not move.
              disabled={objectiveLocked}
              {...(printed
                ? {
                    description: OBJECTIVE_LOCKED_REASON,
                    inputWrapperOrder: BESIDE,
                    classNames: { root: classes.objectiveBeside, description: classes.objectiveNote },
                  }
                : {})}
              onChange={(value) => {
                if (value !== null) objective.onChange(value);
              }}
            />
          )}
          {/* Below 1200 px the row has the answer on it too and there is no column to give the
              sentence, so it goes behind the ⓘ instead of standing the bar up another line. */}
          {objectiveLocked && !beside && <ObjectiveWhy className={classes.objectiveWhy} />}
        </div>
        {onOpenRecap !== undefined && (
          <UnstyledButton
            type="button"
            className={classes.answerTap}
            aria-label={frame.answerLabel}
            onClick={onOpenRecap}
          >
            {/* Keyed on the run count so the animation is re-run rather than re-declared. */}
            <div key={pulse} className={pulse > 0 ? classes.pulse : undefined}>
              {frame.answer}
            </div>
          </UnstyledButton>
        )}
        {frame.generate}
      </div>
    </form>
  );
}
