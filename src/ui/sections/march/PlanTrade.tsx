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
 * - **Per silver and Per hired are the march's own ratios** (`repeat.damage` over `repeat.silver` and over
 *   `repeat.mercLost`), not the campaign's. They were the campaign's beside three columns that were the
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

import { amount, compact, per, ratio } from './format';
import { bestForWords, planWords } from './picks';
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
        horizontalSpacing={4}
        verticalSpacing={6}
        // A `grid` rather than a plain table, because every row is a control the player picks between:
        // that is the role that lets a *row* carry `aria-selected`, and it is what the raised ground
        // says in colour (design rule 24 — never colour alone).
        role="grid"
        // The heads print "Damage" and "Silver" with no unit, so the unit is said once, here, where a
        // reader meets the table (design rule 5: say it where it is expected, not five times over).
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
            <Table.Th scope="col" ta="end">
              <Glyph kind="averageDamage" /> Damage
            </Table.Th>
            <Table.Th scope="col" ta="end">
              <Glyph kind="silver" /> Silver
            </Table.Th>
            <Table.Th scope="col" ta="end">
              <Glyph kind="mercenaries" /> Hired lost
            </Table.Th>
            <Table.Th scope="col" ta="end">
              Per silver
            </Table.Th>
            <Table.Th scope="col" ta="end">
              Per hired
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
                aria-label={`${planWords(point)}: ${compact(point.repeat.damage)} damage, ${compact(
                  point.repeat.silver,
                )} silver, ${compact(point.repeat.gold)} gold, ${amount(
                  point.repeat.mercLost,
                )} hired lost a march${note === null ? '' : `, ${note}`}`}
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
                <Table.Td ta="end">
                  <Group gap="xs" wrap="nowrap" justify="flex-end">
                    {/* The bar is decoration beside its own figure, and `StatBar` draws one this way:
                        a role, its bounds and the figure as the value text. `brass` is the theme's
                        damage accent, the same one `StatBar` paints a boosted stat in. */}
                    <Progress.Root
                      size="sm"
                      radius="xs"
                      w={40}
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
                <Table.Td ta="end">{compact(point.repeat.silver)}</Table.Td>
                <Table.Td ta="end">{amount(point.repeat.mercLost)}</Table.Td>
                <Table.Td ta="end">
                  {ratio(per(point.repeat.damage, point.repeat.silver), PER_SILVER_DECIMALS)}
                </Table.Td>
                <Table.Td ta="end">{ratio(per(point.repeat.damage, point.repeat.mercLost))}</Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  );
}
