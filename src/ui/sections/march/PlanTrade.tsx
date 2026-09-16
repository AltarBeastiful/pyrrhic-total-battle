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
 * The whole row's name is the control (design rule 8), the row on screen is raised with `--pyr-raised` and
 * `aria-current` exactly as the objectives strip's row is, and the sweet spot is said in words on its own
 * row rather than only marked in colour (rule 24).
 */
import { Button, Group, Progress, Table, Text } from '@mantine/core';

import type { PlanRow } from '@/engine/plan';

import { Glyph } from '@/ui/domain';

import { amount, compact, ratio } from './format';
import { PICK_WORD } from './picks';
import classes from './march.module.css';

export interface PlanTradeProps {
  /** Every plan the search kept, cheapest first. */
  rows: PlanRow[];
  /** Which of them the March is showing. */
  position: number;
  /** The row the bar's pointer is on, lit here so the bar and the table read as one thing. */
  hovered: number | null;
  onSelect: (index: number) => void;
  /** Where the sweet spot sits among `rows`, or `null` when the engine weighed no two resources. */
  sweet: number | null;
}

/**
 * `damage / resource`, with a resource of zero reading as "—" rather than as infinity: `ratio` prints any
 * non-finite value that way, and a plan that burns no hired unit has no damage a hired unit rather than an
 * infinite one.
 */
function per(damage: number, resource: number): number {
  return resource > 0 ? damage / resource : Number.NaN;
}

export function PlanTrade({ rows, position, hovered, onSelect, sweet }: PlanTradeProps) {
  const loudest = Math.max(1, ...rows.map((row) => row.repeat.damage));

  return (
    <div className={classes.compareScroll}>
      <Table
        className={classes.compare}
        horizontalSpacing={6}
        verticalSpacing={6}
        aria-label="Every plan on the trade"
      >
        <Table.Thead>
          <Table.Tr>
            <Table.Th scope="col">Plan</Table.Th>
            {/* The glyphs are the three columns that name a game resource — damage, silver, the hired
                stock — and they come from `GLYPHS` (design rule 21: emoji are the game's vocabulary, and
                one component draws them). The row's own name and the two ratios derived from these three
                carry none. */}
            <Table.Th scope="col" ta="end">
              <Glyph kind="averageDamage" /> Damage a march
            </Table.Th>
            <Table.Th scope="col" ta="end">
              <Glyph kind="silver" /> Silver a march
            </Table.Th>
            <Table.Th scope="col" ta="end">
              <Glyph kind="authority" /> Hired lost
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
            return (
              <Table.Tr
                key={point.pick}
                // The row on screen, the way the objectives strip says it: one tonal step, plus
                // `aria-current` for a reader, plus the button's own name. Never colour alone (rule 24).
                data-current={current ? 'true' : undefined}
                aria-current={current ? 'true' : undefined}
                // The row the bar is pointing at. A hover is not a selection, so it is not the raised
                // step — what it gets is the same hairline the parts use, on the edge nearest the finger.
                data-lit={index === hovered ? 'true' : undefined}
              >
                {/* The row is the control (design rule 8: the whole item is the target): pressing a
                    plan's name reads that plan, the same answer the bar reads. */}
                <Table.Th scope="row" className={classes.planCell}>
                  <Button
                    variant="subtle"
                    size="compact-xs"
                    px={4}
                    className={classes.compareName}
                    aria-label={
                      current
                        ? `${PICK_WORD[point.pick]}, the plan on screen`
                        : `Read the plan ${PICK_WORD[point.pick]}`
                    }
                    onClick={() => {
                      onSelect(index);
                    }}
                  >
                    {current && <Glyph kind="averageDamage" scale={0.75} />}
                    {PICK_WORD[point.pick]}
                  </Button>
                  {/* Two things can be true of one row, and colour may not be the only signal saying so
                      (design rule 24): the plan on screen is raised and marked, and the sweet spot is
                      named. */}
                  {index === sweet && (
                    <Text size="xs" c="var(--mantine-color-brass-filled)">
                      the sweet spot
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
                      w={48}
                      role="progressbar"
                      aria-label={`${PICK_WORD[point.pick]}, damage a march`}
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
                    <Text span w={44} ta="end">
                      {compact(point.repeat.damage)}
                    </Text>
                  </Group>
                </Table.Td>
                <Table.Td ta="end">{compact(point.repeat.silver)}</Table.Td>
                <Table.Td ta="end">{amount(point.repeat.mercLost)}</Table.Td>
                <Table.Td ta="end">{ratio(per(point.repeat.damage, point.repeat.silver))}</Table.Td>
                <Table.Td ta="end">{ratio(per(point.repeat.damage, point.repeat.mercLost))}</Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  );
}
