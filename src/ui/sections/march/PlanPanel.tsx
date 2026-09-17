/**
 * The plan behind "Complete optimization" (S-55; the owner's own screen review since, S-59).
 *
 * The method answers a different question from every other one on the Battle card: not "what is the best
 * march", but "what is the best **plan**" — how many marches to spread the army over, how big each one
 * should be, and how much of the mercenary stock to spend each time. The march itself is drawn exactly as
 * every other march is; what this file adds is what would otherwise be invisible.
 *
 * **The plan is read a march at a time** (owner's review of 2026-09-15: "I'm not going to commit to 14
 * marches anyway"). A campaign total is a figure nobody marches: what a player decides is what one march
 * fields, what it costs and what it burns of the stock that does not come back. So the block is built in
 * that order —
 *
 * - **what the plan did for this army**, in its own figures, in one line of the muted meta ink, with the
 *   general why behind the glyph beside it (`docs/investigations/0020-the-plan-screen.md` §D-4: the owner
 *   asked for the explanation on 2026-09-15 and cut it back on 2026-09-16, so it is **moved, not
 *   deleted**);
 * - **the bar** (`PlanBar.tsx`): four stops at most, running along the hired units a march burns for good
 *   (owner, 2026-09-17) — a **marker on the sweet spot**, and, once the bar has been moved off it, the one
 *   control that puts it back;
 * - **the trade** (`PlanTrade.tsx`): one row per stop, named, with what a march of it hits for, costs in
 *   silver and burns of the hired stock, and a muted note on the two stops that are the bar's best damage
 *   a silver and its best damage a hired unit. That is the question the method exists to answer;
 * - **one line of totals**, "Fought to the end", because a player who has read the trade still asks what the
 *   whole sequence comes to;
 * - **the reference tail, folded** (the owner, 2026-09-16: the prose goes). What silver buys (the curve),
 *   what the plan ran out of, how a row is to be read and how many plans were left off are four dimmed
 *   paragraphs and a table that nobody reads twice, so they sit behind one nested fold named "Reference",
 *   closed until it is asked for (design rule 4). What stays out of it is the one line above and the
 *   warning that the march on screen has been hand-edited since — a warning behind a chevron is not a
 *   warning.
 *
 * **Every plan on the trade is fought over the same marches** — the horizon `src/config.ts` sets, which the
 * Battle card no longer asks for (S-56). That is the owner's decision of the same review, and it is what makes
 * the table a table of marches rather than of campaigns: without a horizon the search answers with the
 * campaign that maximises total damage, which on a real account is 66 marches and 313 days of training, and
 * it leaves the hired stock out of the repeated march to get there (`tools/theorycraft/out/73-plan-horizon.md`).
 *
 * Nothing here computes anything: the engine returns the plan and its picks, and the run store holds them.
 */
import { ActionIcon, Group, Popover, Stack, Table, Text, VisuallyHidden } from '@mantine/core';
import { Info } from 'lucide-react';
import { useId, useState } from 'react';

import { planMarch, withMethod } from '@/engine';
import type { CampaignPlan, PlanTotals } from '@/engine/plan';
import { buildStackRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Disclosure } from '@/ui/kit';
import { useResultStore } from '@/ui/resultStore';

import { PlanBar } from './PlanBar';
import { PlanTrade } from './PlanTrade';
import { amount, compact, ratio } from './format';

import { pickOf, sweetSpotOf, useRunStore } from './runStore';

/**
 * The figures of one plan, as the engine carries them: a row of the trade, or the plan itself when the
 * search kept no list to read it off.
 */
type PlanFigures = Pick<PlanTotals, 'repeat'>;

/**
 * How much of the hired stock a march burns, in words a figure can carry: "1.5" or "0".
 *
 * The figure is `repeat` and not a share of the plan's losses — see the column note under the table: what a
 * player marches is the repeated march, and it is the one the March at the top of the pane is drawing.
 * `PlanTotals.repeat` agrees with that battle **to the unit** (`tools/theorycraft/out/74-row-figures.md` §1),
 * which is what makes the row and the recap above it say the same thing.
 */
function mercsAMarch(point: PlanFigures): string {
  const each = point.repeat.mercLost;
  return each >= 10 ? amount(each) : each.toFixed(1);
}

/**
 * Where silver stops buying: the last level at which the next slice still returns a damage a silver. It is
 * read off the curve the engine measured, not assumed — the owner's own plan spends a little under it.
 */
function efficientCeiling(curve: CampaignPlan['curve']): number {
  let ceiling = curve[0]?.silver ?? 0;
  for (let index = 1; index < curve.length; index += 1) {
    const previous = curve[index - 1];
    const point = curve[index];
    if (!previous || !point) continue;
    const marginal = (point.damage - previous.damage) / Math.max(1, point.silver - previous.silver);
    if (marginal < 1) break;
    ceiling = point.silver;
  }
  return ceiling;
}

/** Six points of the curve, evenly spaced: the shape of what silver buys, at a length a 420 px pane takes. */
function sampledCurve(curve: CampaignPlan['curve']): CampaignPlan['curve'] {
  if (curve.length <= 6) return curve;
  return Array.from(
    { length: 6 },
    (_unused, index) => curve[Math.round((index * (curve.length - 1)) / 5)] as CampaignPlan['curve'][number],
  );
}

/** What the plan ran out of, in one sentence (the one thing a player would otherwise have to work out). */
function bindingSentence(binding: CampaignPlan['binding']): string {
  if (binding.mercenaries && binding.silver)
    return 'Both resources are spent: more silver and more mercenaries would each buy more damage.';
  if (binding.mercenaries)
    return 'The mercenary stock is what ends the plan: silver alone would not buy more damage.';
  if (binding.silver) return 'The silver box is what ends the plan: more silver would buy more marches.';
  return 'Nothing binds yet — the plan stops where more troops stop paying for themselves.';
}

/**
 * The thesis, behind the glyph that explains the line beside it (S-59, `docs/investigations/0020` §D-4).
 *
 * The owner asked for this paragraph on 2026-09-15 (`0018-plan-horizon-and-the-fold.md:8`) and cut it back
 * the next day — *"The text above is wayyy too big and might even be unecessary if the form itself is
 * clear"* — so it is moved rather than deleted: it is the answer to "why weigh silver against mercenaries
 * at all", which is a question the figures on the trade cannot state, and it is asked rarely enough to be
 * behind a glyph. Unchanged, sentence for sentence.
 */
const WHY = [
  'Damage is paid for twice over: with silver, which you earn back, and with the hired stock, which is gone',
  'for good. Silver buys a deeper march — more of it, and every march hits harder for it. The hired stock',
  'hits harder still and takes no leadership, but a stack loses a tenth of itself every march it is fielded,',
  'so the same stock is worth more spent thinly over many marches than all at once. Which of the two runs out',
  'first is only visible over a whole sequence of marches, and planning the sequence is what this method does.',
  // One sentence added on 2026-09-17, when the bar became the hired stock's: the paragraph said why the two
  // resources are weighed and never what the control under it is ordered by. The owner's own words that
  // day — the bar is *"about balancing between burning silver efficiently, which is constrained, and
  // burning mercs efficiently, which is constrained as well"* — and the two efficiencies are notes on the
  // stops that have them rather than stops of their own (`PlanRow.bestFor`, `PlanTrade.tsx`).
  'The bar runs along that stock, fewest hired lost to most, and each plan says whether it is the one that',
  'does most with a silver or the one that does most with a hired unit.',
].join(' ');

/** The plan, open when it arrives and still collapsible: it is part of the answer (design rule 1). */
export function PlanFold() {
  const plan = useRunStore((state) => state.plan);
  const position = useRunStore((state) => state.planPick);
  const setPlanPick = useRunStore((state) => state.setPlanPick);
  const edited = useRunStore((state) => state.leftOutByPlayer.length > 0);
  // Which of the trade's rows the bar's pointer is on. It lives here because the bar and the table are one
  // thing (invariants 0020 §D-2): the bar says which plan, the table says what it is worth, and the two
  // must be reading the same row.
  const [hovered, setHovered] = useState<number | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const whyId = useId();
  if (plan === null) return null;

  const shown = pickOf(plan, position);
  const rows = plan.alternatives;
  const sweet = sweetSpotOf(plan);
  const each = shown.repeat;
  const repeated = shown.marches - (shown.finaleCounts ? 1 : 0);
  const best = sweet === null ? null : (rows[sweet] ?? null);

  /**
   * Reading the plan another way puts *that* plan's march on screen: every plan on the frontier is computed
   * together, so the position is a choice between answers rather than another run. Everything else about the
   * run is left alone.
   */
  const read = (next: number): void => {
    setPlanPick(next);
    const state = useStore.getState();
    const profile = selectActiveProfile(state);
    const setup = selectActiveSetup(state);
    if (!profile || !setup) return;
    const request = buildStackRequest(profile, setup);
    const point = pickOf(plan, next);
    const its = planMarch(request, point.counts);
    useRunStore.getState().setIncluded(Object.keys(point.counts), []);
    useResultStore.getState().setResult({
      request: { ...withMethod(request, 'elite'), caps: { ...request.caps, ...point.counts } },
      result: its.result,
      summary: its.summary,
      profileId: profile.id,
      setupId: setup.id,
    });
  };

  return (
    // The row describes the plan the fold is *reading*, not the one the search settled on: the two are
    // different plans as soon as the control moves, and a headline that outlives its body is a lie. It is
    // written a march at a time like everything else: the figure a player commits to is one march's.
    <Disclosure
      title="Plan"
      defaultOpened
      summary={`${compact(each.damage)} damage a march · ${amount(repeated)} march${
        repeated === 1 ? '' : 'es'
      }${shown.finaleCounts ? ' + a last one' : ''}`}
    >
      <Stack gap="md">
        {/* What the plan did for *this* army, in its own figures, with the general why behind the glyph
            (S-59). The ⓘ is interface chrome and not a game glyph, so it is a Lucide icon rather than a
            `Glyph` (design rule 21). */}
        <Group gap="xs" align="flex-start" wrap="nowrap">
          <Text size="sm" c="dimmed">
            {best === null
              ? `It spends the silver box you set: ${amount(each.damage)} damage a march for ${amount(
                  each.silver,
                )} silver, using ${mercsAMarch(shown)} of the hired stock each time.`
              : `The sweet spot it found for this army is ${amount(
                  best.repeat.damage,
                )} damage a march, spending ${mercsAMarch(best)} of the hired stock each time.`}
          </Text>
          {/* **A popover and not a tooltip** (design rules 18 and 24). It was a `Tooltip` with
              `touch: false`, which on a phone — the frame this app is designed at first — meant the
              paragraph the owner asked for on 2026-09-15 could not be reached at all: hover is not a
              thing a thumb has. A `Popover` opens on the press, closes on a press outside it or on
              Escape, and works identically for a pointer, a thumb and a keyboard. The words are still
              carried beside the button as its description, because a popover's contents are not in the
              accessibility tree until it is open. */}
          <Popover
            opened={whyOpen}
            onChange={setWhyOpen}
            width={320}
            position="bottom-end"
            withArrow
            shadow="md"
            withinPortal
          >
            <Popover.Target>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Why the plan weighs silver against the hired stock"
                aria-describedby={whyId}
                onClick={() => {
                  setWhyOpen((open) => !open);
                }}
              >
                <Info size={16} aria-hidden />
              </ActionIcon>
            </Popover.Target>
            <Popover.Dropdown>
              <Text size="sm">{WHY}</Text>
            </Popover.Dropdown>
          </Popover>
          <VisuallyHidden id={whyId}>{WHY}</VisuallyHidden>
        </Group>

        {/* One control over the whole trade: the frontier *is* the axis — the hired units a march burns,
            fewest at one end and most at the other (owner, 2026-09-17) — so a position on it is the choice.
            The two words under the bar name that resource (`BAR_ENDS`, `./picks`), never silver on a list
            silver does not order. */}
        {rows.length > 1 && (
          <PlanBar
            rows={rows}
            position={position}
            hovered={hovered}
            onHover={setHovered}
            onSelect={read}
            sweet={sweet}
          />
        )}

        <PlanTrade rows={rows} position={position} hovered={hovered} onSelect={read} />

        {/* What the sequence adds up to if it is fought to the end — one line, not a headline: nobody commits
            to a hundred marches at once, and the figures above are the ones they march. It is the one line of
            the old tail that stays out of the fold below, because it answers a question the trade raises. */}
        <Text size="sm" c="dimmed">
          {`Fought to the end: ${amount(plan.totalDamage)} damage and ${amount(
            plan.silver,
          )} silver over ${amount(plan.marches)} marches, with ${amount(plan.mercLost)} of the hired stock gone.`}
        </Text>

        {/* **The prose goes behind a chevron** (the owner, 2026-09-16; design rule 4 — fold what is read
            once). Four dimmed paragraphs and a table stood under the trade: how to read a row, how many
            plans the band refused, what the plan ran out of, what silver buys along the curve and where it
            stops buying. None of them is the answer and all of them are true, so they are folded rather than
            cut, closed until a player asks — which is the same treatment the bonus sources and the battle
            story get. */}
        <Disclosure title="Reference">
          <Stack gap="md">
            {/* Every plan is fought over the same marches — the horizon `src/config.ts` sets — so the table
                needs no column for length: a row is *the march you repeat*, which is the march the recap
                above is drawing, and the two ratio columns weigh that one march. */}
            <Text size="sm" c="dimmed">
              Every plan here is fought over the same marches — the horizon the app plans over — so a row is
              the march you repeat: what it hits for, what it costs in silver and what it burns of the hired
              stock for good. The two ratio columns divide that one march's damage by its own silver and by
              its own hired losses.
            </Text>

            {/* The extremes are not offered (owner, 2026-09-15: "just don't show the extremes"), so the fold
                says what was cut rather than letting the bar look like the whole trade. The count is the
                engine's (`CampaignPlan.leftOut`); the words are ours. */}
            {plan.leftOut > 0 && (
              <Text size="sm" c="dimmed">
                {`${amount(plan.leftOut)} of the plans the search kept are off the goal — a march that fields a ` +
                  `token share of the hired stock, or silver spent far past what it returns — and are not offered ` +
                  `here.`}
              </Text>
            )}

            {/* What the plan ran out of — the one thing a player would otherwise have to work out. */}
            <Text size="sm" c="dimmed">
              {bindingSentence(plan.binding)}
            </Text>

            {/* The curve behind the frontier: what N silver buys, and what it buys a mercenary. Six points of
                it, evenly spaced, because the frontier list above is thinned for the eye while this is the
                shape — and the shape is what says how far silver is worth spending. */}
            {plan.curve.length > 2 && (
              <>
                <Table
                  horizontalSpacing={6}
                  verticalSpacing={4}
                  aria-label="What silver buys along the plan curve"
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th scope="col">Silver</Table.Th>
                      <Table.Th scope="col" ta="end">
                        Damage
                      </Table.Th>
                      <Table.Th scope="col" ta="end">
                        A silver
                      </Table.Th>
                      <Table.Th scope="col" ta="end">
                        A mercenary
                      </Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {sampledCurve(plan.curve).map((point) => (
                      <Table.Tr key={point.silver}>
                        <Table.Td>{amount(point.silver)}</Table.Td>
                        <Table.Td ta="end">{amount(point.damage)}</Table.Td>
                        <Table.Td ta="end">{ratio(point.damagePerSilver)}</Table.Td>
                        <Table.Td ta="end">{ratio(point.damage / Math.max(1, point.mercLost))}</Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
                <Text size="sm" c="dimmed">
                  {`Past about ${amount(efficientCeiling(plan.curve))} silver, the next slice buys less than one damage a silver — ` +
                    `beyond that the plan is buying damage with the hired stock rather than with silver.`}
                </Text>
              </>
            )}
          </Stack>
        </Disclosure>

        {/* Not folded: a warning behind a chevron is not a warning. The figures above are of a march the
            player has since changed by hand, which is the one thing on this block that can be out of date. */}
        {edited && (
          <Text size="sm" c="dimmed">
            The march on screen has been edited by hand since it was planned; the plan behind it has not
            moved.
          </Text>
        )}
      </Stack>
    </Disclosure>
  );
}
