/**
 * The command bar (design plan §5.6, story D-56; artboard `CommandBar.dc.html`, `.cmd`).
 *
 * From 1200 px the bottom edge of the page carries what changes with every march: the three
 * housing pools as plain wells with their glyph, the objective as one compact select, and the gold
 * Generate. It is the only thing sticky on that edge — the app bar is the other edge's one bar
 * (design rule 2 as amended) — and it lives inside the page's own width, 24 px off the sides and
 * 24 px off the bottom, so it reads as a card that stays rather than as chrome bolted to the
 * window.
 *
 * The bar is in the flow, at the end of the frame: the page reserves its height and the last row of
 * the setup can always be scrolled clear of it. The March pane's sticky block subtracts the same
 * height from the window (`march.module.css`, `.glance`), so the bar never lands on the pills.
 *
 * Tab order is the order a march is set up in: leadership → authority → dominance → objective →
 * Generate. `Ctrl`/`⌘ + Enter` still generates from anywhere, including from inside these fields.
 */
import { Select } from '@mantine/core';

import { Glyph } from '@/ui/domain';
import { NumberField } from '@/ui/kit';
import { MarchGenerateButton } from '@/ui/sections/march';

import { OBJECTIVE_CHOICES, POOL_LABELS, POOLS, useCommandBar } from './command';
import classes from './shell.module.css';

/** The objective in one line each: the sentence under it is the Battle card's business, not a bar's. */
const OBJECTIVE_DATA = OBJECTIVE_CHOICES.map((choice) => ({ value: choice.value, label: choice.title }));

export function CommandBar() {
  const { housing, priority, setPool, setObjective } = useCommandBar();

  if (housing === null) return null;

  return (
    <div className={classes.commandBar}>
      {POOLS.map((pool) => (
        <NumberField
          key={pool}
          label={POOL_LABELS[pool]}
          leftSection={<Glyph kind={pool} />}
          // A pool at zero is one nobody has filled in yet, so the field stands empty and invites
          // the number instead of showing a 0 the player never typed.
          value={housing[pool] === 0 ? null : housing[pool]}
          min={0}
          max={100_000_000}
          allowEmpty
          onChange={(value) => {
            setPool(pool, value);
          }}
        />
      ))}
      {/* Five objectives and "no priority", each a short line: the one control on the page a
          dropdown is honestly better at than a list of cards, because it sits in a bar 88 px tall
          (design plan §5.6; design rule 8 is about a choice that needs its sentence on screen). */}
      <Select
        label="Objective"
        data={OBJECTIVE_DATA}
        value={priority}
        allowDeselect={false}
        comboboxProps={{ withinPortal: true }}
        onChange={(value) => {
          if (value !== null) setObjective(value);
        }}
      />
      <MarchGenerateButton size="sm" />
    </div>
  );
}
