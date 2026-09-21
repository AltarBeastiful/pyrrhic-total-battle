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
import { Group, Progress, Table, Text } from '@mantine/core';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

import type { PlanRow } from '@/engine/plan';

import { Glyph } from '@/ui/domain';

import { amount, compact, duration, per, ratio } from './format';
import { bestForWords, planWords, spendsStock, tableMarks } from './picks';
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

/**
 * "Per silver" is printed to **three** decimals on the trade. At two it printed `0.54` on all three of the
 * owner's plans beside a row *named* "Best for silver" (S-59 screen review, 2026-09-16) — a column that
 * decides a name was rounding the decision away. Three is enough on a real account (1.89 · 2.37 · 2.96 at
 * the app's horizon); a seeded army whose plans tie at three decimals is showing the same figure, and a
 * sixth decimal would be noise dressed as a difference (rule 5).
 */
const PER_SILVER_DECIMALS = 3;

export function PlanTrade({ rows, position, hovered, onSelect }: PlanTradeProps) {
  // Whether this bar trades a hired stock at all; the two stock columns hang off it (S-112, `./picks`).
  const spendsHired = spendsStock(rows);
  /**
   * **The other purse, in a column of its own** (owner, 2026-09-21: *"monsters are revived using gold for a
   * substantial sum and mercs aren't cheap either if there's many — why not comparing, or at least inform?
   * … using revive the highest elite, it should say the gold anyway, as we're not training, we're reviving
   * with gold"*).
   *
   * It was measured before it was drawn and refused once, the same day (experiment 126): the stop that
   * spends least gold is the stop that burns least stock on fourteen benchmark armies of fourteen, so the
   * column looked like "Hired lost" in another unit. **Thirteen of those fourteen field no monster** — the
   * measurement answered "does gold *rank* the stops differently", and the owner is asking the other
   * question, which is what a march *costs*. Under the plan a new setup now opens on, a monster stack is
   * revived rather than trained: its price leaves the silver column altogether and lands here, and a bar
   * whose stops differ by a monster differs by thousands of gold that nothing on screen said.
   *
   * So: **the gold**, drawn only on a bar that spends any (design rule 15), which is every army that hires or
   * revives and no other.
   *
   * **And the gold alone** (owner, 2026-09-21: *"in the plan table, let's remove dragon coins below gold; we
   * can keep it in the battle summary, it's enough there"*). The coins rode here under the gold for an hour,
   * as the queue rides under the silver; two muted second lines in a seven-column table is a table being read
   * twice. The recap says the coins with their own mark and their own ratio, which is where a player meets
   * them (`MarchRecap`, design rule 5).
   */
  const spendsGold = rows.some((row) => row.repeat.gold > 0);
  /**
   * **The best figure in each column, marked** (S-113). Measured before it was drawn (experiment 120, over
   * the sixteen benchmark armies): the marks land on **2.38 different stops on average**, and a single stop
   * wins everything on only three armies — the ones whose bar is one or two stops long. So the marks are
   * the table doing its job rather than a ranking with extra steps.
   *
   * Read once, here, so a row cannot be called best two different ways (`tableMarks`, `./picks`), and
   * **never on Per hired**: 0019 §2.3 measured that ratio rising while the march collapses.
   */
  const marks = tableMarks(rows);
  const loudest = Math.max(1, ...rows.map((row) => row.repeat.damage));
  // Two module classes on one cell: the name's own width rules, and the pin that keeps it on the left edge
  // while the figures scroll. Composed here because `className` may only ever carry a module value
  // (`src/ui/kit/README.md` rule 3, which the linter holds).
  const nameCell = `${classes.planCell ?? ''} ${classes.pinned ?? ''}`;

  return (
    <div className={classes.compareScroll}>
      <Table
        className={classes.compare}
        // 4 rather than 6: measured at 1400×900, the heads on one line each made a 498 px table in a
        // 462 px pane — a sideways scroller in the March where there was none (design rule 17 allows the
        // table one, the desktop has never needed it). Four pixels a side over six cells is 24 of the 36.
        // 2 since the gold took a column back (2026-09-21): seven heads over six, and the pixels a cell are
        // what keep the whole table inside a 462 px pane — the pane's own e2e refuses a scroller anywhere
        // inside it (`paneFrame().scrollers`), which is the rule that cut this column in 2026-09-16. The
        // figures are right-aligned under heads wider than themselves, so the air between two columns is
        // the head's, not the padding's.
        horizontalSpacing={2}
        verticalSpacing={6}
        // A `grid` rather than a plain table, because every row is a control the player picks between:
        // that is the role that lets a *row* carry `aria-selected`, and it is what the raised ground
        // says in colour (design rule 24 — never colour alone).
        role="grid"
        // The heads print "Damage" and "Silver" with no unit and no reading, so both are said once, here,
        // where a reader meets the table (design rule 5: say it where it is expected, not five times over).
        aria-label="Every plan on the trade, one repeated march each"
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
            {/* **The recap's own 🔒 over the word the column is about** (S-94, 2026-09-19; the word since
                the owner's read of 2026-09-21: *"worst column in plan table should read Damage, it's easier
                to understand"*). The head was "🎯 Damage", which is the recap's mark and word for the
                *expected* damage — the midpoint of the two openings the game's coin decides — while the
                figure under it has been the **enemy-first** journal since the owner said he would not spend
                3M silver on a coin flip. Two names and two glyphs for one number, on two blocks of one
                screen, is what design rules 5 and 26 are about and rule 21 says of the marks.

                So the **mark** is what keeps the two apart and the word says what the column holds: 🔒 is the
                worst opening wherever it is drawn — the recap's row, the objectives strip, this head — and 🎯
                stays the expected damage. "Worst" alone was a superlative that never said *of what*, which is
                the one thing a column of seven-figure numbers has to say. The whole phrase does not fit: at
                1400×900 the pane is 420 px and "🔒 Worst opening" widens the table past its column, which
                design rule 17 and `e2e/generate.spec.ts` both refuse. The word the head drops is said once,
                in the table's own name above — which is where its unit is said too. */}
            <Table.Th scope="col" ta="end">
              <Glyph kind="minimumDamage" /> Damage
            </Table.Th>
            <Table.Th scope="col" ta="end">
              <Glyph kind="silver" /> Silver
            </Table.Th>
            {spendsGold && (
              <Table.Th scope="col" ta="end">
                <Glyph kind="gold" /> Gold
              </Table.Th>
            )}
            {/* **The two stock columns draw only where there is a stock** (S-112, design rule 15). On an
                army that hires nothing — which has had a bar of its own since S-111 — "Hired lost" was a
                column of noughts and "Per hired" a column of dashes: four cells of width, in a 420 px pane
                where a seventh column was measured at 505 px and cut, spent saying nothing. The same
                reading decides the bar's ends and the recap's row (`spendsStock`, `./picks`), so the block
                either speaks of a stock throughout or never. */}
            {/* **"Hired"**, not "Hired lost", since the gold took a column back (2026-09-21): the same cut
                as "Worst opening" → "Worst" two heads along, for the same reason and with the same answer —
                what is lost is said in the table's own name, in the row's, and by the axis under the bar. It
                is 28 px of a 462 px pane. */}
            {spendsHired && (
              <Table.Th scope="col" ta="end">
                <Glyph kind="mercenaries" /> Hired
              </Table.Th>
            )}
            <Table.Th scope="col" ta="end">
              Per silver
            </Table.Th>
            {spendsHired && (
              <Table.Th scope="col" ta="end">
                Per hired
              </Table.Th>
            )}
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
                // **Every figure of the row, in the order the cells stand.** Gold was the one figure with no
                // cell of its own from the review of 2026-09-16 — built as a seventh column, measured at
                // 1400×900 as a **505 px table in a 462 px pane**, and cut back to this name and the bar's
                // tip. It has a column again since 2026-09-21 (the owner: *"we're not training, we're
                // reviving with gold"*), so the table takes the sideways scroller design rule 17 allows it
                // and the plan's name is pinned through it; the tip stopped saying it the same day (rule 5).
                aria-label={`${planWords(point)}: ${compact(point.repeat.damage)} damage, ${compact(
                  point.repeat.silver,
                )} silver, ${duration(point.repeat.seconds)} to recover, ${compact(
                  point.repeat.gold,
                )} gold, ${
                  // The coins are **not** in the row's name: they are not in the row (owner, 2026-09-21).
                  // The recap carries them, with their mark and the ratio they bought (`MarchRecap`).
                  ''
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
                    spendsGold && marks.gold === index ? 'least gold' : null,
                    spendsHired && marks.hiredLost === index ? 'fewest hired lost' : null,
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
                      the same glyph heading the Damage column two cells along — and "the sweet spot"
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
                  {/* 6 px between the bar and its figure, and a 28 px bar: the column gave 18 px to the
                      gold's on 2026-09-21, and a bar is a *shape* — it is read against the row above it,
                      not measured, so what it costs the table matters and what it is worth in pixels does
                      not (design rule 15). */}
                  <Group gap={6} wrap="nowrap" justify="flex-end">
                    {/* The bar is decoration beside its own figure, and `StatBar` draws one this way:
                        a role, its bounds and the figure as the value text. `brass` is the theme's
                        damage accent, the same one `StatBar` paints a boosted stat in. */}
                    <Progress.Root
                      size="sm"
                      radius="xs"
                      w={28}
                      role="progressbar"
                      aria-label={`${planWords(point)}, damage a march`}
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
                  </Text>
                </Table.Td>
                {/* **What this march costs that silver does not pay**: the Temple's gold, one figure and
                    nothing under it. */}
                {spendsGold && (
                  <Table.Td ta="end" data-best={marks.gold === index ? 'true' : undefined}>
                    {compact(point.repeat.gold)}
                  </Table.Td>
                )}
                {spendsHired && (
                  <Table.Td ta="end" data-best={marks.hiredLost === index ? 'true' : undefined}>
                    {amount(point.repeat.mercLost)}
                  </Table.Td>
                )}
                {/* The rate's own mark **is** the note already under this row's name: experiment 120 asked
                    the engine's `bestFor.silver` and this column's best cell of all sixteen benchmark
                    armies and they named the same row **16 times of 16**. So the cell shows *where* and the
                    note says *what*, and the row's accessible name says it once (below). */}
                <Table.Td ta="end" data-best={marks.perSilver === index ? 'true' : undefined}>
                  {ratio(per(point.repeat.damage, point.repeat.silver), PER_SILVER_DECIMALS)}
                </Table.Td>
                {/* **Per hired is the hired stacks' own damage over the hired units lost** (S-105,
                    2026-09-19; the owner, reading this column: *"it says over a million but in total they
                    do less than 1M"*, then *"dmg per hired is still broken: it shows a damage per hired
                    almost above total damage"*). It divided the **whole** march's worst opening — the
                    figure two cells to the left — by the chunks the hired stock loses, so on a march whose
                    troops do most of the hitting it printed nearly the Damage column again. The numerator is
                    the part of that opening the hired stacks struck for (`PlanRepeat.hiredDamage`), which
                    is the one reading of "a hired" the engine has (design rule 5). */}
                {spendsHired && (
                  <Table.Td ta="end">{ratio(per(point.repeat.hiredDamage, point.repeat.mercLost))}</Table.Td>
                )}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
        {/* **What the mark means, said once, under the thing it marks** (design rule 5). A mark nobody can
            decode is decoration, and the alternative — a key beside every head — is the width this table
            has never had. `Table.Caption` is the designed slot for it (rule 23) and Mantine puts it below
            the table, where a reader meets it after the figures rather than before them. */}
      </Table>
    </div>
  );
}
