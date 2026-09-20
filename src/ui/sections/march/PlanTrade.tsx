/**
 * The trade, as a table of marches (S-59). Owned by `docs/design.md` §7's glossary and §8's ornament
 * amendment.
 *
 * The owner, 2026-09-16: *"the table below, same plan name is hard to catch and some info in it is already
 * in the table. better names. then the table itself needs more styling to be more visual… Or redrawn in
 * another way."* It is still a table — he chose "table, made visual" — and four things changed:
 *
 * - **every row is named**, and the name is the engine's `pick` in our words (`./picks`), because the
 *   shape sentence it wore before named a silver figure that is a *column* of this very table and counted
 *   "stacks" one way where the table counts them another;
 * - **Per silver and Per hired are the march's own ratios** (`repeat.damage` over `repeat.silver`, and
 *   `repeat.hiredDamage` over `repeat.mercLost`), not the campaign's. They were the campaign's beside three
 *   columns that were the
 *   march's, which is what let a row named for a ratio be *beaten* on that ratio by the row above it; now
 *   every figure on a row is a fact about the one march the recap above is drawing, and the campaign totals
 *   still live in "Fought to the end" at the foot of the block;
 * - **a damage bar on every row**, scaled to the loudest plan on the list. It is a second ornament on the
 *   page and `docs/design.md` §8 says so — it is amended there rather than broken quietly here. It means
 *   damage wherever it is drawn, its length is that row measured against its own list, and no other block
 *   joins it;
 * - the two seven-figure columns print in `compact` figures ("6.83M"), because a seven-digit number beside
 *   a bar is a number nobody reads at a glance.
 *
 * The owner's screen review of the built table (2026-09-16) took four more things off it, and each is a rule:
 *
 * - **the whole `<tr>` is the control**, not the name inside it (design rule 8: whole rows are targets). The
 *   row is the one focusable thing on its line, it answers a click and Enter or Space, and it says which plan
 *   is on screen with `aria-selected` and `aria-current` rather than with a button's label. The table is a
 *   `grid`, which is what makes a selected *row* a thing ARIA can say;
 * - **one glyph, one meaning** (rule 21, `docs/design.md`): "Hired lost" wore 👑, which is the authority
 *   pool's glyph two blocks above it on the same screen, and the plan on screen wore a second 🎯 beside its
 *   name while 🎯 already headed "Damage". The hired stock has its own glyph now and the row on screen is
 *   marked by the raised ground and its heavier name alone;
 * - **the heads are a glyph and two words**, never three lines of "Silver / a / march" (rule 19). Every row of
 *   this table *is* one march — the line above the bar and the fold's own summary both say so — so the unit
 *   belongs in the table's name, not repeated in five heads;
 * - **"the sweet spot" is not printed under a row named "Sweet spot"** (rule 5).
 *
 * The row on screen is raised with `--pyr-raised` exactly as the objectives strip's row is.
 */
import { Group, Progress, SegmentedControl, Table, Text } from '@mantine/core';
import { useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';

import type { PlanRow } from '@/engine/plan';

import { Glyph } from '@/ui/domain';

import { amount, compact, duration, ratio } from './format';
import { bestForWords, planWords, rateColumn, rateColumns, spendsStock, tableMarks } from './picks';
import type { RateKey } from './picks';
import classes from './march.module.css';

export interface PlanTradeProps {
  /** Every plan the bar offers, thriftiest first — the hired units a march burns is what sorts them. */
  rows: PlanRow[];
  /** Which of them the March is showing. */
  position: number;
  /** The row the bar's pointer is on, lit here so the bar and the table read as one thing. */
  hovered: number | null;
  onSelect: (index: number) => void;
}

export function PlanTrade({ rows, position, hovered, onSelect }: PlanTradeProps) {
  // Whether this bar trades a hired stock at all; the two stock columns hang off it (S-112, `./picks`).
  const spendsHired = spendsStock(rows);
  /**
   * **The best figure in each column, marked** (S-113). Measured before it was drawn (experiment 120, over
   * the sixteen benchmark armies): the marks land on **2.38 different stops on average**, and a single stop
   * wins everything on only three armies — the ones whose bar is one or two stops long. So the marks are
   * the table doing its job rather than a ranking with extra steps.
   *
   * Read once, here, so a row cannot be called best two different ways (`tableMarks`, `./picks`), and
   * **never on Per hired**: 0019 §2.3 measured that ratio rising while the march collapses.
   */
  /**
   * **One rate column, and the player chooses which** (S-113; the owner, 2026-09-20: *"letting you choose
   * easily and switch between objective with added knowledge"*).
   *
   * The table drew two rate columns and could never draw a third — a seventh head measured **505 px in a
   * 462 px pane** and was cut. Collapsing them into one switch **gives a column back**, and that column is
   * what lets *Per gold* exist at all. It earns the place: experiment 120 measured it as the **only fact
   * naming its stop on 7 of the 16 benchmark armies**, while *per hour of queue* was the sole namer on
   * **none** (it always agrees with Silver or Per silver) and *per dragon coin* exists on two armies and is
   * sole on none — so the queue stays the note under Silver and the coins stay beside it.
   *
   * The choice lives here rather than in the store: it is a way of *reading* this table, not a setting of
   * the march, and nothing else on the screen or in a share link depends on it.
   */
  const [wanted, setWanted] = useState<RateKey>('silver');
  const offered = rateColumns(rows);
  const rate = rateColumn(rows, wanted);
  const marks = tableMarks(rows, rate);
  const loudest = Math.max(1, ...rows.map((row) => row.repeat.damage));
  // Two module classes on one cell: the name's own width rules, and the pin that keeps it on the left edge
  // while the figures scroll. Composed here because `className` may only ever carry a module value
  // (`src/ui/kit/README.md` rule 3, which the linter holds).
  const nameCell = `${classes.planCell ?? ''} ${classes.pinned ?? ''}`;

  return (
    <>
      {/* **Drawn only where there is something to switch** (design rule 15): an army that hires nothing and
          buys no gold has one rate, and a control with one option is a label pretending to be a choice.
          `SegmentedControl` is the kit's own radio group (rule 23), so the keyboard and the screen reader
          come with it and nothing is hand-built. */}
      {offered.length > 1 && (
        <Group justify="flex-end" mb={6}>
          <SegmentedControl
            size="xs"
            value={rate.key}
            onChange={(next) => {
              setWanted(next as RateKey);
            }}
            data={offered.map((column) => ({ value: column.key, label: column.head }))}
            aria-label="Which rate the trade shows"
          />
        </Group>
      )}
      <div className={classes.compareScroll}>
        <Table
          className={classes.compare}
          // 4 rather than 6: measured at 1400×900, the heads on one line each made a 498 px table in a
          // 462 px pane — a sideways scroller in the March where there was none (design rule 17 allows the
          // table one, the desktop has never needed it). Four pixels a side over six cells is 24 of the 36.
          horizontalSpacing={4}
          verticalSpacing={6}
          // A `grid` rather than a plain table, because every row is a control the player picks between:
          // that is the role that lets a *row* carry `aria-selected`, and it is what the raised ground
          // says in colour (design rule 24 — never colour alone).
          role="grid"
          // The heads print "Worst" and "Silver" with no unit and no reading, so both are said once, here,
          // where a reader meets the table (design rule 5: say it where it is expected, not five times over).
          aria-label="Every plan on the trade, one repeated march each, at its worst opening"
        >
          <Table.Thead>
            <Table.Tr>
              <Table.Th scope="col" className={classes.pinned}>
                Plan
              </Table.Th>
              {/* The glyphs are the three columns that name a game resource — damage, silver, the hired
                stock — and they come from `GLYPHS` (design rule 21: emoji are the game's vocabulary, and
                one component draws them). The row's own name and the two ratios derived from these three
                carry none.

                **A glyph and a two-word head at most, all on one line** (design rule 19). They read
                "🎯 Damage a march" and "🪙 Silver a march" until 2026-09-16, which an auto-laid table in a
                420 px pane broke as "Damage a / march" and "Silver / a / march" — three and four lines of
                head over one line of figures, with 👑 alone on a line of its own above "Hired / lost". The
                unit those heads were carrying is the table's own (`aria-label` above): every row here is one
                repeated march, which the line over the bar and the fold's summary both say already.

                TotalStack is no help on the wording — the one screen of theirs ever observed has no such
                table (`docs/investigations/0008-totalstack-method-enemy-results.md`; `0006` is the captain
                picker and has no column heads at all) — but its figure tiles are exactly this shape, a glyph
                then a short caps label ("🔒 MINIMUM DAMAGE", "🪙 SILVER"), and its ratios are written as
                "DAMAGE / SILVER". Ours stay our own words (rule 26): "Per silver", "Per hired". */}
              {/* **The recap's own 🔒, and its word shortened to one** (S-94, 2026-09-19). The column was
                "🎯 Damage", which is the recap's mark and word for the *expected* damage — the midpoint of
                the two openings the game's coin decides — while the figure under it has been the
                **enemy-first** journal since the owner said he would not spend 3M silver on a coin flip.
                Two names and two glyphs for one number, on two blocks of one screen, is what design rules 5
                and 26 are about and rule 21 says of the marks.

                The recap calls it "Worst opening" and this head says **"Worst"**, for the same reason the
                objectives strip does (`TradeoffStrip.tsx`, where the four figures share one line): at
                1400×900 the pane is 420 px and "🔒 Worst opening" widens the table past its column, which
                design rule 17 and `e2e/generate.spec.ts` both refuse. The word the head drops is said once,
                in the table's own name above — which is where its unit is said too. */}
              <Table.Th scope="col" ta="end">
                <Glyph kind="minimumDamage" /> Worst
              </Table.Th>
              <Table.Th scope="col" ta="end">
                <Glyph kind="silver" /> Silver
              </Table.Th>
              {/* **The two stock columns draw only where there is a stock** (S-112, design rule 15). On an
                army that hires nothing — which has had a bar of its own since S-111 — "Hired lost" was a
                column of noughts and "Per hired" a column of dashes: four cells of width, in a 420 px pane
                where a seventh column was measured at 505 px and cut, spent saying nothing. The same
                reading decides the bar's ends and the recap's row (`spendsStock`, `./picks`), so the block
                either speaks of a stock throughout or never. */}
              {spendsHired && (
                <Table.Th scope="col" ta="end">
                  <Glyph kind="mercenaries" /> Hired lost
                </Table.Th>
              )}
              {/* The head is the rate on screen, and the control above the table wears the same words — one
                name per thing (design rule 5). */}
              <Table.Th scope="col" ta="end">
                {rate.head}
              </Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((point, index) => {
              const current = index === position;
              // Which of the two efficiencies this stop is the bar's best at, or `null` (`./picks`,
              // `PlanRow.bestFor`). Read once and written in both places the row says anything: under the
              // name, and in the accessible name below (design rule 5 — one name per thing).
              const note = bestForWords(point);
              return (
                <Table.Tr
                  // A row is its answer, and the engine never offers the same answer twice (two stops that are
                  // one plan collapse to one), so the pick is the key.
                  key={point.pick}
                  // **The whole row is the target** (design rule 8), which is what it claimed to be while only
                  // the name inside it answered a press. It is the one focusable thing on its line — a row of
                  // six figures with a button in the first cell is a tab stop that lands nowhere a finger
                  // aims — and it answers the two keys a control answers. Its focus ring is the theme's, drawn
                  // by `march.module.css` off Mantine's own variables.
                  tabIndex={0}
                  // **Gold a march, where the table has no room for it** (review of 2026-09-16). It was built
                  // as a seventh column first and measured at 1400×900: the heads came to a **505 px table in
                  // a 462 px pane**, which is the sideways scroller the six-column table was tuned down to
                  // `horizontalSpacing={4}` to avoid (design rule 17, and `e2e/generate.spec.ts` holds it). So
                  // the figure is read off the bar's tip (`PlanBar.tsx`) and carried here as the row's own
                  // name, where a screen reader meets it — never colour, never a column that pushes the table
                  // off its pane. The ratio cells are unchanged and still read as cells.
                  aria-label={`${planWords(point)}: ${compact(point.repeat.damage)} worst opening, ${compact(
                    point.repeat.silver,
                  )} silver, ${duration(point.repeat.seconds)} to recover, ${compact(
                    point.repeat.gold,
                  )} gold, ${
                    // The third currency, in the row's own name and only while the march spends one (design
                    // rule 15). A reader meets it in the same breath as the silver and the queue it rides
                    // with in the cell (S-102).
                    (point.repeat.dragonCoins ?? 0) > 0
                      ? `${amount(point.repeat.dragonCoins ?? 0)} dragon coins, `
                      : ''
                  }${
                    // Said in the row's own name only where the bar trades a stock, for the same reason the
                    // column is drawn only there (S-112): a reader is told what the march spends, not what it
                    // does not have.
                    spendsHired ? `${amount(point.repeat.mercLost)} hired lost a march` : ''
                  }${note === null ? '' : `${spendsHired ? ', ' : ''}${note}`}${
                    // **The marks, for a reader who cannot see them** (design rule 24). The rate's mark is
                    // deliberately absent: `note` above is the same fact in the same breath, and saying it
                    // twice is what rule 5 is about.
                    [
                      marks.damage === index ? 'most damage' : null,
                      marks.silver === index ? 'least silver' : null,
                      spendsHired && marks.hiredLost === index ? 'fewest hired lost' : null,
                      // The silver rate's mark is `note` above, said once; gold has no note of its own.
                      rate.key === 'gold' && marks.rate === index ? 'best a gold' : null,
                    ]
                      .filter((word): word is string => word !== null)
                      .map((word) => `, ${word} on the bar`)
                      .join('')
                  }`}
                  aria-selected={current}
                  // The row on screen, the way the objectives strip says it: one tonal step for the eye, and
                  // for a reader the two attributes that mean it. Never colour alone (rule 24) — and the
                  // name is set heavier with it (`march.module.css`), which is weight and not hue.
                  data-current={current ? 'true' : undefined}
                  aria-current={current ? 'true' : undefined}
                  // The row the bar is pointing at. A hover is not a selection, so it is not the raised
                  // step — what it gets is the same hairline the parts use, on the edge nearest the finger.
                  data-lit={index === hovered ? 'true' : undefined}
                  onClick={() => {
                    onSelect(index);
                  }}
                  onKeyDown={(event: ReactKeyboardEvent<HTMLTableRowElement>) => {
                    // Enter and Space, the two a control answers; Space is also the page's scroll, so it is
                    // only taken when the row itself has the focus.
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    if (event.target !== event.currentTarget) return;
                    event.preventDefault();
                    onSelect(index);
                  }}
                >
                  <Table.Th scope="row" className={nameCell}>
                    {/* The name, and nothing beside it. It wore a 🎯 when the row was the one on screen —
                      the same glyph heading the Worst column two cells along — and "the sweet spot"
                      under a row already named "Sweet spot" (design rules 5 and 21). The raised ground,
                      the heavier name and `aria-selected` say the first; the row's own name says the
                      second, as does the marker on the bar above. */}
                    {planWords(point)}
                    {/* **The two efficiencies, said on the stops that have them** (owner, 2026-09-17: the bar
                      is *"about balancing between burning silver efficiently, which is constrained, and
                      burning mercs efficiently, which is constrained as well"*, and a stop of its own for
                      one of them was *"inefficient and causes frustration"* — it measured as the "Most
                      damage" stop to 0.2 %). So they stopped being rows and became a note on a row: one
                      muted line under the name, in the same words as the columns it is read off, "Per
                      silver" and "Per hired" (design rule 5).

                      `size="xs"` is the table's own 13 px and not `--pyr-meta`'s 12: this is information a
                      player chooses by, and design rule 19 puts a floor under that. The ink is the muted
                      one the heads and every explaining line in this block already use (`c="dimmed"`), so
                      no colour is invented for it — and the words are never the only signal, because the
                      same note is in the row's accessible name above. */}
                    {note !== null && (
                      <Text size="xs" c="dimmed" className={classes.planNote ?? undefined}>
                        {note}
                      </Text>
                    )}
                  </Table.Th>
                  {/* `data-best` is the mark, and `march.module.css` gives it **weight and ink, in that
                    order**: colour is never the only signal (design rule 24), and the weight is what a
                    reader sees first when the two schemes render the ink differently. */}
                  <Table.Td ta="end" data-best={marks.damage === index ? 'true' : undefined}>
                    <Group gap="xs" wrap="nowrap" justify="flex-end">
                      {/* The bar is decoration beside its own figure, and `StatBar` draws one this way:
                        a role, its bounds and the figure as the value text. `brass` is the theme's
                        damage accent, the same one `StatBar` paints a boosted stat in. */}
                      <Progress.Root
                        size="sm"
                        radius="xs"
                        w={40}
                        role="progressbar"
                        aria-label={`${planWords(point)}, worst opening a march`}
                        aria-valuemin={0}
                        aria-valuemax={loudest}
                        aria-valuenow={point.repeat.damage}
                        aria-valuetext={amount(point.repeat.damage)}
                      >
                        <Progress.Section
                          withAria={false}
                          value={Math.min(100, Math.max(0, (point.repeat.damage / loudest) * 100))}
                          color="brass"
                        />
                      </Progress.Root>
                      <Text span w={40} ta="end">
                        {compact(point.repeat.damage)}
                      </Text>
                    </Group>
                  </Table.Td>
                  {/* **Silver, and the training queue under it** (owner, 2026-09-18: *"troops of higher
                    tier are longer to train"*). Time is the second price a march is paid in and the one the
                    silver figure hides: two stops an hour apart in silver can be a week apart in training,
                    which is exactly the trade this table exists to show.

                    Under the figure rather than in a column of its own. A seventh head measured 505 px in a
                    462 px pane when gold was tried as one (see the row's accessible name above), and the
                    heads are what set these columns' widths — "🪙 Silver" is wider than either figure — so a
                    second line inside the cell costs the table nothing sideways. It is the same muted ink
                    and the same regular weight every explaining line in this block uses, at the table's own
                    size (`inherit`, which is 12 px here): the silver is the figure, the queue is the note
                    under it, and the row's accessible name says both. */}
                  <Table.Td ta="end" data-best={marks.silver === index ? 'true' : undefined}>
                    {compact(point.repeat.silver)}
                    <Text span inherit display="block" fw={400} c="dimmed">
                      {duration(point.repeat.seconds)}
                      {/* **And the dragon coins, on the marches that spend any** (S-102; the owner,
                        2026-09-19: *"they have a cost in silver but in dragon coins also, which are both
                        constrained"*). A dominance monster is trained rather than hired, so it leaves the
                        "Hired lost" column two cells along and its whole price is here: the silver above,
                        the queue beside it and this. Same muted ink, same line, no seventh head — the
                        table measured 505 px in a 462 px pane the last time a price was tried as a column
                        of its own (see the row's accessible name above).

                        **Drawn only while the figure is positive** (design rule 15: nothing on screen
                        without a value). Every army in this repo but a monster camp spends no coin at all,
                        and a "· 0 dragon coins" on every row of every bar would be a column of noughts. */}
                      {(point.repeat.dragonCoins ?? 0) > 0 &&
                        ` · ${amount(point.repeat.dragonCoins ?? 0)} dragon coins`}
                    </Text>
                  </Table.Td>
                  {spendsHired && (
                    <Table.Td ta="end" data-best={marks.hiredLost === index ? 'true' : undefined}>
                      {amount(point.repeat.mercLost)}
                    </Table.Td>
                  )}
                  {/* The rate's own mark **is** the note already under this row's name where the rate is the
                    silver one: experiment 120 asked the engine's `bestFor.silver` and this column's best
                    cell of all sixteen benchmark armies and they named the same row **16 times of 16**. So
                    the cell shows *where* and the note says *what*, and the row's accessible name says it
                    once (below). Gold has no note, so its mark goes into the name. */}
                  <Table.Td ta="end" data-best={marks.rate === index ? 'true' : undefined}>
                    {ratio(rate.of(point), rate.decimals)}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
          {/* **What the mark means, said once, under the thing it marks** (design rule 5). A mark nobody can
            decode is decoration, and the alternative — a key beside every head — is the width this table
            has never had. `Table.Caption` is the designed slot for it (rule 23) and Mantine puts it below
            the table, where a reader meets it after the figures rather than before them. */}
          <Table.Caption className={classes.compareKey ?? undefined}>
            The heavier figure in a column is the best of the bar.
          </Table.Caption>
        </Table>
      </div>
    </>
  );
}
