/**
 * **What each raise position offers, under the plan's own trade** (S-147; owner, 2026-09-29: *"take all
 * positions remaining and implement them in assemblyscript. Goal is to offer them as precomputed with the
 * trades they offer visible to the user. For now you'll output the trades in a table below the plan slider
 * table and keep the slider leading to the ts version in the summary defaulting it to as is to avoid
 * duplication"*).
 *
 * The control in the battle summary is a question a player asks one answer at a time — press `Best v2`, wait
 * for a search of up to tens of seconds, read the pane, press `Safe`, read it again. This block answers all
 * five before it is asked: **the five positions priced on the stop the bar is standing on**, and — since the
 * owner asked for the bar rather than one stop (*"all those should have their table when clicking on the plan
 * slider. Best is to compute it ahead for all like the slider spots"*) — **every other stop of the bar is
 * priced too**, so a press on the slide is another table rather than another wait (`positionsSearch.ts`).
 *
 * **And the control reads it** (S-149; owner, 2026-09-30: *"make the positions selector (as is, tight…) use
 * the already computed assemblyscript values (should be same as engine/TS)"*): a press lands on the row of the
 * stop and the position on screen, so the search behind that press is not run a second time. What the table
 * says and what a press does are one answer — the same counts the March's own path produces, held to each
 * other on every stop of every benchmark army (experiment 184) — and the control keeps its other job, the one
 * this table cannot do: standing the march's stacks where the row says.
 *
 * **The columns are the trade and not a score**: *Damage* — the march's worst opening, the figure every other
 * block on the page is ranked on (S-94, S-108) — then the three things it is paid with, *Silver*, *Gold* and
 * *Merc*. Units are deliberately not among them (owner, 2026-09-29: *"i don't care about units, they're
 * cheap. I care about silver, gold and merc"*): the units a raise fields are the *claw*, and what a player
 * spends is the three purses — silver to retrain, gold the Temple asks, and the mercenaries that never come
 * back. The note under a figure is its change **against the plan's own march**, which is the row the bar is
 * standing on one block above: no baseline row is drawn, because that row is already on screen (rule 5).
 *
 * **Gold is drawn only where a march pays any** (design rule 15), exactly as the plan's own trade decides its
 * column (`PlanTrade.tsx`): an army that revives nothing and retrains no mercenary has no gold to compare, and
 * a column of noughts is four cells of a narrow pane spent saying nothing.
 *
 * **Nothing here is a control.** The plan's trade above is a list a player picks from and every row is a
 * target (design rule 8); these five are all reachable from the summary's own control, which is where a press
 * acts on the march rather than on the plan. So the rows are read, not pressed, and the table says so by
 * being a table — no `grid` role, no focus, no `aria-selected`.
 *
 * **Drawn where the raise is offered at all**: a plan's march, with troops to shelter a hired stack by
 * (`useMarch`'s own two facts). On a sizer's march the control is not drawn either (design rule 15), and the
 * two are never apart.
 */
import { Table, Text } from '@mantine/core';

import { Glyph } from '@/ui/domain';
import { useResultStore } from '@/ui/resultStore';
import { useRunStore } from './runStore';

import { RAISE_CHOICES } from './choices';
import { amount, compact, signedPercent } from './format';
import { usePositions } from './positionsSearch';
import type { PositionReading, PositionTrade, PositionTrades } from './positions';
import { troopFloor } from './raise';

/** What a position is called on this table: the control's own name for it (design rule 5). */
const LABEL = new Map(RAISE_CHOICES.map((choice) => [choice.mode, choice.label]));

/** The sentence the control carries for a position, so the row can be read without it (design rule 26). */
const HELP = new Map(RAISE_CHOICES.map((choice) => [choice.mode, choice.help]));

/** A figure and, under it, how it moved against the plan's own march — the trade's own idiom. */
function Figure({ value, change }: { value: string; change: string | null }) {
  return (
    <>
      {value}
      {change !== null && (
        <Text span inherit display="block" fw={400} c="dimmed">
          {change}
        </Text>
      )}
    </>
  );
}

/**
 * **How a figure moved, as a note under it** — a percentage, and nothing when it did not move (design rule
 * 15). Percentage and not a difference because the four columns are four different units: "+7.8 %" is read
 * the same way under a damage, a silver and a gold, where "+82 000" under one and "+2" under another are two
 * scales in one column of notes (rule 5 — one figure, one shape).
 */
function changeOf(to: number, from: number): string | null {
  if (to === from || from === 0) return null;
  return signedPercent(((to - from) / from) * 100);
}

/** One row's accessible name: what a reader would otherwise have to work out from the cells. */
function rowWords(row: PositionTrade, own: PositionReading, withGold: boolean): string {
  const label = LABEL.get(row.mode) ?? row.mode;
  const said = (value: string, moved: string | null): string =>
    `${value}${moved === null ? '' : ` (${moved} against the plan's own march)`}`;
  return [
    `${label}: ${said(`${compact(row.damage)} damage`, changeOf(row.damage, own.damage))}`,
    said(`${compact(row.silver)} silver`, changeOf(row.silver, own.silver)),
    ...(withGold ? [said(`${compact(row.gold)} gold`, changeOf(row.gold, own.gold))] : []),
    said(
      `${amount(row.mercLost)} ${row.mercLost === 1 ? 'merc' : 'mercs'} lost a march`,
      changeOf(row.mercLost, own.mercLost),
    ),
    HELP.get(row.mode) ?? '',
  ].join('. ');
}

/** The table itself, given the answer: four columns, one row a position, in the control's own order. */
function TradeTable({ trades }: { trades: PositionTrades }) {
  const { own, rows } = trades;
  // Gold only where a march pays any, the same reading the plan's own trade makes of its bar (S-112's rule).
  const withGold = [own, ...rows].some((reading) => reading.gold > 0);
  return (
    <Table horizontalSpacing={6} verticalSpacing={4} captionSide="top">
      {/* The caption is the table's accessible name as well as its sentence (design rule 5: say what a
          figure is where a reader meets it), and it is where the baseline is named — the two notes under
          the figures are read against the row the bar is on, one block above. */}
      <Table.Caption>
        What each raise position makes of the plan's own march: the damage a march hits for, and what it is
        paid with — silver, the Temple's gold, and the mercenaries it burns for good. The notes under a figure
        are its change against the march the bar is on.
      </Table.Caption>
      <Table.Thead>
        <Table.Tr>
          <Table.Th scope="col">Position</Table.Th>
          {/* **The same mark and the same word** the plan's trade uses for the same figure: the glyph is
              the game's own and comes from `Glyph` (design rule 21), and the word is the one the recap, the
              bar and the fold already use for it (design rule 5). */}
          <Table.Th scope="col" ta="end">
            <Glyph kind="minimumDamage" /> Damage
          </Table.Th>
          <Table.Th scope="col" ta="end">
            <Glyph kind="silver" /> Silver
          </Table.Th>
          {withGold && (
            <Table.Th scope="col" ta="end">
              <Glyph kind="gold" /> Gold
            </Table.Th>
          )}
          <Table.Th scope="col" ta="end">
            Merc
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {rows.map((row) => (
          <Table.Tr key={row.mode} aria-label={rowWords(row, own, withGold)}>
            <Table.Th scope="row" fw={400}>
              {LABEL.get(row.mode) ?? row.mode}
            </Table.Th>
            <Table.Td ta="end">
              <Figure value={compact(row.damage)} change={changeOf(row.damage, own.damage)} />
            </Table.Td>
            <Table.Td ta="end">
              <Figure value={compact(row.silver)} change={changeOf(row.silver, own.silver)} />
            </Table.Td>
            {withGold && (
              <Table.Td ta="end">
                <Figure value={compact(row.gold)} change={changeOf(row.gold, own.gold)} />
              </Table.Td>
            )}
            <Table.Td ta="end">
              <Figure value={amount(row.mercLost)} change={changeOf(row.mercLost, own.mercLost)} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
}

/**
 * The block, drawn only when the stop on screen has been priced. `null` while its job runs or when it failed:
 * it is the foot of the plan's fold and an offer rather than an answer, so nothing appears until there is one
 * — and a slide to a stop the bar has already priced draws immediately.
 */
export function PositionTable() {
  const snapshot = useResultStore((state) => state.last);
  const plan = useRunStore((state) => state.plan);
  // Which stop of the bar the March is showing: the same position the trade above is read at.
  const position = useRunStore((state) => state.planPick);
  // The raise's own two facts (`useMarch`): a plan's march, with a troop to shelter a hired stack under.
  const canRaise = plan !== null && snapshot !== null && troopFloor(snapshot.result) !== null;
  const trades = usePositions(snapshot, plan, position, canRaise);
  if (trades === null) return null;
  return <TradeTable trades={trades} />;
}
