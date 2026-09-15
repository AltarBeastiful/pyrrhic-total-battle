/**
 * The plan behind "Complete optimization" (S-55).
 *
 * The method answers a different question from every other one on the Battle card: not "what is the best
 * march", but "what is the best **plan**" — how many marches to spread the army over, how big each one
 * should be, and how much of the mercenary stock to spend each time. The march itself is drawn exactly as
 * every other march is; what this file adds is what would otherwise be invisible.
 *
 * **The plan is read a march at a time** (owner's review of 2026-09-15: "I'm not going to commit to 14
 * marches anyway"). A campaign total is a figure nobody marches: what a player decides is what one march
 * fields, what it costs and what it burns of the stock that does not come back. So the fold is built in that
 * order —
 *
 * - **the thesis, in words, first**: damage is paid for with silver, which comes back, or with the hired
 *   stock, which does not; the whole sequence is what shows where the two balance, and the plan the engine
 *   weighed both resources to choose is named, with its own figures, in the same breath (design rule 29: an
 *   answer says what it did);
 * - **the bar** (design rule 23: a stock Mantine slider, named for screen readers and driven by the arrow
 *   keys, design rule 24): one tick per plan kept, a **marker on the sweet spot**, and — once the bar has
 *   been moved off it — the one control that puts it back;
 * - **the trade, as a table of marches**: one row per plan kept, and what a march of it hits for, costs in
 *   silver and burns of the hired stock. That is the question the method exists to answer, and the row on
 *   screen and the sweet spot are both said in words under it rather than by colour (rule 24).
 *
 * **Every plan on the trade is fought over the same marches** — the horizon `src/config.ts` sets, which
 * the Battle card no longer asks for (S-56). That is the owner's decision of the same review, and it is what makes the table
 * a table of marches rather than of campaigns: without a horizon the search answers with the campaign that
 * maximises total damage, which on a real account is 66 marches and 313 days of training, and it leaves the
 * hired stock out of the repeated march to get there (`tools/theorycraft/out/73-plan-horizon.md`).
 *
 * Nothing here computes anything: the engine returns the plan and its frontier, and the run store holds it.
 */
import { Button, Group, Slider, Stack, Table, Text } from '@mantine/core';

import { planMarch, withMethod } from '@/engine';
import type { CampaignPlan, PlanTotals } from '@/engine/plan';
import { buildStackRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Glyph } from '@/ui/domain';
import { useResultStore } from '@/ui/resultStore';
import { Disclosure } from '@/ui/kit';

import { amount, compact, ratio } from './format';
import classes from './march.module.css';

import { pickOf, sweetSpotOf, useRunStore } from './runStore';
import { useMarch } from './useMarch';

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
 * Where on the trade the plan on screen sits, in words (design rule 29: an answer says what it did). It is
 * read off the plan's *position* on the frontier rather than off a name, so it stays true when the search
 * returns a different set of plans — and when the engine has a sweet spot, the distance to it is what the
 * player wants to know rather than the index in a list.
 */
function readAt(count: number, position: number, sweet: number | null): string {
  if (count < 2) return 'the only plan the search kept';
  if (sweet === null) {
    if (position <= 0) return 'the least silver of the plans kept';
    if (position >= count - 1) return 'the most silver of the plans kept';
    return `plan ${position + 1} of the ${count} kept, cheapest first`;
  }
  if (position === sweet) return 'the sweet spot between the two resources';
  const away = Math.abs(position - sweet);
  return `${away} plan${away === 1 ? '' : 's'} ${position < sweet ? 'cheaper' : 'pricier'} than the sweet spot`;
}

/** What the plan decided, in one line, in the muted meta ink (it explains an answer). */
export function PlanSizing() {
  const plan = useRunStore((state) => state.plan);
  const position = useRunStore((state) => state.planPick);
  const { stale } = useMarch();
  if (plan === null) return null;

  const point = pickOf(plan, position);
  const repeated = point.marches - (point.finaleCounts ? 1 : 0);
  return (
    <Text size="sm" c="dimmed" className={stale ? classes.outOfDate : undefined}>
      {`Planned from the army: ${repeated} identical march${repeated === 1 ? '' : 'es'} of ${
        Object.keys(point.counts).length
      } stacks${point.finaleCounts ? ` and a final march for what is left` : ''} — ${readAt(
        plan.alternatives.length,
        position,
        sweetSpotOf(plan),
      )}.`}
    </Text>
  );
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

/** The plan, folded (design rule 4): what it decided, the trade it chose from, and what each march is. */
export function PlanFold() {
  const plan = useRunStore((state) => state.plan);
  const position = useRunStore((state) => state.planPick);
  const setPlanPick = useRunStore((state) => state.setPlanPick);
  const edited = useRunStore((state) => state.leftOutByPlayer.length > 0);
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
      summary={`${compact(each.damage)} damage a march · ${amount(repeated)} march${
        repeated === 1 ? '' : 'es'
      }${shown.finaleCounts ? ' + a last one' : ''}`}
    >
      <Stack gap="md">
        {/* What the method brings, before any of its figures (the owner asked for it in so many words). The
            whole point of planning a sequence rather than a march is that the two resources run out at
            different times, and that is a sentence before it is a table. */}
        <Stack gap={6}>
          <Text size="sm" c="dimmed">
            Damage is paid for twice over: with silver, which you earn back, and with the hired stock, which
            is gone for good. Silver buys a deeper march — more of it, and every march hits harder for it. The
            hired stock hits harder still and takes no leadership, but a stack loses a tenth of itself every
            march it is fielded, so the same stock is worth more spent thinly over many marches than all at
            once. Which of the two runs out first is only visible over a whole sequence of marches, and
            planning the sequence is what this method does.
          </Text>
          {/* And where that lands for *this* army, in its own figures — the analysis, not a general remark. */}
          {best === null ? (
            <Text size="sm" c="dimmed">
              {`It spends the silver box you set: ${amount(each.damage)} damage a march for ${amount(
                each.silver,
              )} silver, using ${mercsAMarch(shown)} of the hired stock each time.`}
            </Text>
          ) : (
            <Text size="sm" c="dimmed">
              {`The sweet spot it found for this army is ${best.label} — ${amount(
                best.repeat.damage,
              )} damage a march, spending ${mercsAMarch(best)} of the hired stock each time.`}
            </Text>
          )}
        </Stack>

        {/* One control over the whole trade: the frontier *is* the axis — cheapest plan at one end, kindest
            to the hired stock at the other — so a position on it is the choice. A stock Mantine slider
            (design rule 23), named for screen readers and driven by the arrow keys as well as the mouse
            (design rule 24). Every plan kept is a tick, so where the control can stop is visible without
            dragging it, and the sweet spot carries a marker and the one control that returns to it. */}
        {rows.length > 1 && (
          <>
            <Slider
              min={0}
              max={rows.length - 1}
              step={1}
              value={position}
              onChange={read}
              thumbLabel="Where on the trade to read the plan"
              thumbValueText={(value) => rows[Math.round(value)]?.label ?? ''}
              label={(value) => rows[Math.round(value)]?.label ?? ''}
              marks={rows.map((_row, index) =>
                index === sweet
                  ? {
                      value: index,
                      label: (
                        // Mantine centres a mark's label on its own mark, so a label on the **end** marks
                        // hangs half a word off the track and is clipped by the pane (measured at 390 px,
                        // where the band leaves the sweet spot as the cheapest plan — stop 0). Nudging the
                        // label back inside by half its own width is what keeps the marker on the bar when
                        // the sweet spot is an end; a missing marker would be the alternative, and the owner
                        // asked for a marker.
                        <Text
                          span
                          size="xs"
                          fw={600}
                          c="var(--mantine-color-brass-filled)"
                          style={{
                            display: 'inline-block',
                            transform:
                              sweet === 0
                                ? 'translateX(50%)'
                                : sweet === rows.length - 1
                                  ? 'translateX(-50%)'
                                  : undefined,
                          }}
                        >
                          Sweet spot
                        </Text>
                      ),
                    }
                  : { value: index },
              )}
            />
            {/* The two ends are named **under** the bar, not as mark labels: Mantine centres a mark's label
                on its own mark, so a label naming an end would hang half a word off the track — the same
                clipping the marker above is nudged out of, done in words instead. */}
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text size="xs" c="dimmed">
                Least silver
              </Text>
              {/* The way back to the marker above, in words: the mark says where the sweet spot is, this
                  says how to get there, and it is only drawn while the bar is somewhere else. */}
              {sweet !== null && position !== sweet && (
                <Button variant="subtle" size="compact-xs" onClick={() => read(sweet)}>
                  Back to the sweet spot
                </Button>
              )}
              <Text size="xs" c="dimmed">
                Most silver
              </Text>
            </Group>
          </>
        )}

        {/* The trade itself. Every plan the search kept, cheapest first, read as marches rather than as
            campaigns: what one of them hits for, what it costs in silver and what it burns of the stock that
            does not come back. Wider than the pane, so it takes the same scroller the campaign's tables use
            (design rule 17). */}
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
                <Table.Th scope="col" ta="end">
                  Damage a march
                </Table.Th>
                <Table.Th scope="col" ta="end">
                  Silver a march
                </Table.Th>
                <Table.Th scope="col" ta="end">
                  Mercs a march
                </Table.Th>
                <Table.Th scope="col" ta="end">
                  Per silver
                </Table.Th>
                <Table.Th scope="col" ta="end">
                  Per mercenary
                </Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((point, index) => {
                const marked = point.totalDamage === shown.totalDamage && point.silver === shown.silver;
                return (
                  <Table.Tr
                    key={`${point.label}-${point.silver}-${point.totalDamage}`}
                    data-marked={marked || undefined}
                    {...(marked ? { 'aria-current': 'true' } : {})}
                  >
                    {/* The row is the control (design rule 8: the whole item is the target): pressing a
                        plan's name puts that plan's march on screen, the same answer the bar reads. */}
                    <Table.Th scope="row" className={classes.planCell}>
                      <Button
                        variant="subtle"
                        size="compact-xs"
                        px={4}
                        className={classes.compareName}
                        aria-label={
                          marked ? `${point.label}, the plan on screen` : `Read the plan ${point.label}`
                        }
                        onClick={() => read(index)}
                      >
                        {marked && <Glyph kind="averageDamage" scale={0.75} />}
                        {point.label}
                      </Button>
                      {/* Two things can be true of one row, and colour may not be the only signal saying so
                          (design rule 24): the plan on screen is marked, and the sweet spot is named. */}
                      {index === sweet && (
                        <Text size="xs" c="var(--mantine-color-brass-filled)">
                          the sweet spot
                        </Text>
                      )}
                    </Table.Th>
                    <Table.Td>{amount(point.repeat.damage)}</Table.Td>
                    <Table.Td>{amount(point.repeat.silver)}</Table.Td>
                    <Table.Td>{mercsAMarch(point)}</Table.Td>
                    <Table.Td>{ratio(point.damagePerSilver)}</Table.Td>
                    <Table.Td>{ratio(point.damagePerMercenary)}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
        {/* Every plan is fought over the same marches — the horizon `src/config.ts` sets — so the table
            needs no column for length: a row is *the march you repeat*, which is the march the recap above
            is drawing, and the two ratio columns weigh the whole plan. */}
        <Text size="sm" c="dimmed">
          Every plan here is fought over the same marches — the horizon the app plans over — so a row is the
          march you repeat: what it hits for, what it costs in silver and what it burns of the hired stock for
          good. The two ratio columns weigh the whole plan, final march included.
        </Text>

        {/* The extremes are not offered (owner, 2026-09-15: "just don't show the extremes"), so the fold says
            what was cut rather than letting the bar look like the whole trade. The count is the engine's
            (`CampaignPlan.leftOut`); the words are ours. */}
        {plan.leftOut > 0 && (
          <Text size="sm" c="dimmed">
            {`${amount(plan.leftOut)} of the plans the search kept are off the goal — a march that fields a ` +
              `token share of the hired stock, or silver spent far past what it returns — and are not offered ` +
              `here.`}
          </Text>
        )}

        {/* What the sequence adds up to if it is fought to the end — one line, not a headline: nobody
            commits to a hundred marches at once, and the figures above are the ones they march. */}
        <Text size="sm" c="dimmed">
          {`Fought to the end: ${amount(plan.totalDamage)} damage and ${amount(
            plan.silver,
          )} silver over ${amount(plan.marches)} marches, with ${amount(plan.mercLost)} of the hired stock gone.`}
        </Text>

        {/* What the plan ran out of — the one thing a player would otherwise have to work out. */}
        <Text size="sm" c="dimmed">
          {bindingSentence(plan.binding)}
        </Text>

        {/* The curve behind the frontier: what N silver buys, and what it buys a mercenary. Six points of it,
            evenly spaced, because the frontier list above is thinned for the eye while this is the shape —
            and the shape is what says how far silver is worth spending. */}
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
                    <Table.Td>{amount(point.damage)}</Table.Td>
                    <Table.Td>{ratio(point.damagePerSilver)}</Table.Td>
                    <Table.Td>{ratio(point.damage / Math.max(1, point.mercLost))}</Table.Td>
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
