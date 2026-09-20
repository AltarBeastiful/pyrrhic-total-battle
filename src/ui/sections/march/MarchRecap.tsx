/**
 * The answer, in figures (design plan §7.5 step 1, design rule 1). The expected damage is the one
 * number the eye should land on: **Inter at 700 and 36 px**, tabular, tightened a hundredth of an em
 * (owner, 2026-09-13 — the display face was the prettier of the two and the harder to read a figure
 * in; Fraunces is left to the roman tier numerals on tiles and pills, where it spells rather than
 * counts). The figures a player compares marches by follow it as a list, each carrying the way it
 * moved since the previous run.
 *
 * "Hits landed" is not among them any more (owner, 2026-09-13): how many times the army swings is a
 * fact about a stack, and it is said in the unit sheet, where it belongs to the type it describes.
 *
 * Neither is "generated just now" (owner, 2026-09-13): *when* a march was computed is not a question
 * anybody asks — **whether it still answers the form** is. So the clock is gone and the staleness it
 * was standing in for is said outright: once the setup moves under the answer, the figures and the
 * pills fall to 70 %, and one line in the warning ink under them says what happened and what to do.
 * Nothing at all is drawn while the answer is current.
 *
 * One shape, wherever it is shown (M-08's contract): the March pane's header on a desktop, the head
 * of the March section on a phone — and the March section is what the recap sheet holds, so the
 * figures are written once and never twice on one screen (design rule 5; investigation 0011 found
 * 97 of the sheet's 98 lines repeated from the page under it).
 */
import { Group, Stack, Text } from '@mantine/core';

import type { BattleSummary } from '@/engine/types';
import { DeltaText, Glyph } from '@/ui/domain';
import { Figures } from '@/ui/kit';

import { amount, compactTwo, duration, ratio } from './format';
import { hiredLost, hiredStock } from './hired';
import { worstDamageByPool, worstPer } from './worst';
import classes from './march.module.css';
import { useMarch } from './useMarch';

/**
 * The hero prints its own number, so the line under it carries only the change. `DeltaText` is
 * still the one place that decides what "better" means for a figure, which is the point.
 */
const CHANGE_ONLY = (): string => '';

export function MarchRecap() {
  const { snapshot, result, summary, previous, stale } = useMarch();

  if (snapshot === null || result === null || summary === null) {
    return (
      <Text size="sm" c="dimmed">
        Nothing generated yet. Set your housing, press Generate, and the figures, the army and the counts to
        copy appear here.
      </Text>
    );
  }

  const was = <T,>(pick: (value: BattleSummary) => T): T | undefined =>
    previous === null ? undefined : pick(previous);

  /**
   * **The third currency, and the ratio over it** (S-102, 2026-09-19; the owner: *"monsters have a 3-cost:
   * training time, silver and dragon coins. TotalStack computes the total of dragon coins needed for a stack
   * if present and the dmg/dragon coins."*).
   *
   * A dominance monster is **trained**, not hired: it does not come off the "Hired lost" figure below (that
   * count is the authority pool's, `./hired`, and so is the engine's own burn axis since S-102). What it
   * costs is on this block instead — the silver and the queue it shares with the troops, plus these coins,
   * which nothing else in the game spends.
   *
   * **Both lines only while the march spends a coin** (`docs/design-rules.md` rule 15, *nothing on screen
   * without value*). Every march that fields no monster spends none, which is every march an account without
   * a dominance pool can make, and a "0 dragon coins" beside a "∞ per dragon coin" would be two figures
   * saying nothing.
   *
   * The two names are the app's own, not new words for this block: **Dragon coins to recover** is the third
   * of "Silver to recover" and "Gold to recover", and **Damage per dragon coin** is what the Battle card's
   * objective picker and the saved-march table have called this ratio all along (rule 5, one name a thing;
   * rule 26, our own words).
   */
  const coins = summary.recovery.dragonCoins;
  const figures = [
    {
      key: 'worst',
      label: 'Worst opening',
      value: summary.minDamage,
      previous: was((value) => value.minDamage),
      format: amount,
      betterWhen: 'higher' as const,
      glyph: <Glyph kind="minimumDamage" />,
    },
    {
      key: 'silver',
      label: 'Silver to recover',
      value: summary.recovery.silver,
      previous: was((value) => value.recovery.silver),
      format: amount,
      betterWhen: 'lower' as const,
      glyph: <Glyph kind="silver" />,
    },
    {
      key: 'gold',
      label: 'Gold to recover',
      value: summary.recovery.gold,
      previous: was((value) => value.recovery.gold),
      format: amount,
      betterWhen: 'lower' as const,
      glyph: <Glyph kind="gold" />,
    },
    // The coins sit with the two prices they belong to — silver, gold, coins — because they are the same
    // question asked of a third purse, and the queue below is how long all three take to come back.
    ...(coins > 0
      ? [
          {
            key: 'dragonCoins',
            label: 'Dragon coins to recover',
            value: coins,
            previous: was((value) => value.recovery.dragonCoins),
            format: amount,
            betterWhen: 'lower' as const,
            glyph: <Glyph kind="dragonCoin" />,
          },
        ]
      : []),
    {
      /**
       * **What the march costs in time** (owner, 2026-09-18: *"generation sometimes skips low-level stacks
       * and misses some damage that seems cheap; it is mainly because one thing is not taken into account:
       * troops of higher tier are longer to train. Adding training time on the battle summary is the first
       * step."*).
       *
       * It sits with the two it belongs to — silver and gold are what the losses cost, this is how long they
       * take — and it is read the way the game writes a training queue ("5d 23h", `duration`). Lower is
       * better, like the two coins: a march that hits as hard and is back a day sooner is the better march,
       * and that is the comparison this figure exists to make.
       *
       * **One figure for the whole march**, not a split: the engine already sums the two halves the way the
       * recovery plan on the Battle card says (`recoveryCosts`), and a hired unit revives for gold in no
       * time at all, so the figure is the troops' training queue and nothing has to be said twice.
       */
      key: 'time',
      label: 'Time to recover',
      value: summary.recovery.seconds,
      previous: was((value) => value.recovery.seconds),
      format: duration,
      betterWhen: 'lower' as const,
      glyph: <Glyph kind="time" />,
    },
    /**
     * **On the worst opening, like the bar's** (S-108, 2026-09-19; the owner: *"damage/silver differs in the
     * plan table and in the battle summary"*). `summary.damagePerSilver` divides `avgDamage`, the midpoint
     * of the two openings, which is TotalStack's own reading of its Battle Summary and what the priority
     * search optimises — so that field stays as it is and this block divides `minDamage` instead, the figure
     * two rows above it and the one the plan's trade prints. One name, one thing (design rule 5).
     */
    {
      key: 'perSilver',
      label: 'Damage per silver',
      value: worstPer(summary, summary.recovery.silver),
      previous: was((value) => worstPer(value, value.recovery.silver)),
      format: ratio,
      betterWhen: 'higher' as const,
    },
    // Beside "Damage per silver" and read exactly as it is: what the rarest of the three purses bought.
    ...(coins > 0
      ? [
          {
            key: 'perDragonCoin',
            label: 'Damage per dragon coin',
            value: worstPer(summary, coins),
            previous: was((value) => worstPer(value, value.recovery.dragonCoins)),
            format: ratio,
            betterWhen: 'higher' as const,
          },
        ]
      : []),
  ];

  /**
   * **What this march burns of the hired stock, and what that bought** (owner, 2026-09-17: *"a merc lost
   * count with a percent of all mercs available, to see how big the drop is"*, then 2026-09-20: *"instead of
   * the percent of total mercs spent, replace it with the dmg per merc using a small notation: 265k,
   * 1.23m"*).
   *
   * The count is the one the plan's trade prints as "Hired lost" (`./hired`). Beside it used to sit the
   * share of the account's whole stock; it is **damage a hired unit** now — the one figure that says whether
   * spending the stock was worth it, and the same question the bar's "Per hired" column answers, so the two
   * screens agree (design rule 5).
   *
   * **One definition, and it is S-105's**: the *hired stacks' own* damage over the hired units lost, never
   * the whole march's damage over them — that was the defect the owner reported twice in one day (*"it says
   * over a million but in total they do less than 1M"*). And on the **worst opening**, like every other
   * ratio on this card since S-108, summed from the enemy-first journal by `worstDamageByPool` — the same
   * function the Details fold's split uses, so the split and this figure are terms of one sum.
   *
   * It is computed from `result.stacks` and this run's own journal, so it follows every recomputation the
   * card follows: a Generate, and a put-back or a leave-out re-sizing the march in place (`resizeMarch`
   * writes a new snapshot, `useMarch` re-reads it). No delta against the previous run: the previous run is
   * kept as a summary and a summary carries no stacks, so the numerator cannot be recomputed for it.
   */
  const lost = hiredLost(result.stacks);
  const stock = hiredStock(snapshot.request);
  const hiredDamage = worstDamageByPool(summary.journals.enemyFirst, result.stacks).authority;
  /**
   * **Drawn only where the march has a stock to lose** (S-112, design rule 15), the way the dragon-coin row
   * has been since S-102. A march that fields nothing hired printed "Hired lost 0 · 0 % of 0" — a row whose
   * figure, share and denominator are all nothing — and since S-111 a whole bar of such marches is an
   * ordinary answer rather than an oddity. The test is the *account's* stock and not the march's: a player
   * who holds mercenaries and is looking at a march that fields none needs to see that it fields none.
   */
  // `null` is *"a type is hired with no cap"* — an account that plainly holds stock — so it counts as held,
  // not as none. Reading it as zero would hide the row from exactly the players who spend the most of it.
  const holdsStock = stock === null || stock > 0 || lost > 0;
  const hired = {
    key: 'hired',
    label: 'Hired lost',
    glyph: <Glyph kind="mercenaries" />,
    value: (
      <Group gap={6} wrap="nowrap" align="baseline">
        <DeltaText value={lost} format={amount} betterWhen="lower" />
        {/* Drawn only while the march really lost some (design rule 15): with nothing burned there is no
            denominator, and "— a hired unit" beside a nought is a line about nothing. `compactTwo` is the
            owner's own notation for it — "325K", "1.2M": short, and never so short that two runs print the
            same figure (`./format`). */}
        {lost > 0 && (
          <Text span size="xs" c="dimmed">
            {`· ${compactTwo(hiredDamage / lost)} a hired unit`}
          </Text>
        )}
      </Group>
    ),
  };

  return (
    <Stack gap="md" aria-label="This march in figures">
      {/* Everything that *is* the answer dims together while the answer is out of date; the line
          that says so does not, because it is the one thing on the block still worth reading. */}
      <Stack gap="md" data-stale={String(stale)} className={stale ? classes.outOfDate : undefined}>
        <Stack gap={2}>
          {/* The hero figure: one size at every width now (36 px), Inter at 700, and free to break
              rather than to push the pane sideways — it is the widest thing in a 360 dp pane. The
              numerals and the tracking are the class's (`march.module.css`, `.hero`). */}
          <Text fz="2.25rem" lh={1} fw={700} className={classes.hero}>
            {amount(summary.avgDamage)}
          </Text>
          <Group gap="xs" wrap="nowrap">
            {/* The one figure that carried no mark while every figure under it did (rule 21). */}
            <Glyph kind="averageDamage" />
            <Text span size="sm" c="dimmed">
              Expected damage
            </Text>
            {previous !== null && (
              <DeltaText
                value={summary.avgDamage}
                previous={previous.avgDamage}
                format={CHANGE_ONLY}
                betterWhen="higher"
                size="xs"
              />
            )}
          </Group>
        </Stack>

        {/* The figures as the spacing contract draws them: a **2-column grid, 8 × 16 gaps**,
            the label 12 px muted with its glyph in the fixed box over a 15/600 tabular figure
            (`MarchPaneSpacing.dc.html`, `.figs`). They were four full-width rows of label-then-value
            before, which is four lines of a 420 px pane spent on four numbers. */}
        <Figures
          label="March figures"
          layout="grid"
          items={[
            ...figures.map((figure) => ({
              key: figure.key,
              label: figure.label,
              ...(figure.glyph === undefined ? {} : { glyph: figure.glyph }),
              value: (
                <DeltaText
                  value={figure.value}
                  {...(figure.previous === undefined ? {} : { previous: figure.previous })}
                  format={figure.format}
                  betterWhen={figure.betterWhen}
                />
              ),
            })),
            ...(holdsStock ? [hired] : []),
          ]}
        />
      </Stack>

      {/* One line, in the warning ink, and only while it is true. `role="status"` rather than an
          alert: it is a change in what is already on screen, not an interruption. */}
      {stale && (
        <Group gap={6} wrap="nowrap" role="status" c="var(--mantine-color-brass-filled)">
          <Glyph kind="warning" label="Out of date" />
          <Text span size="sm" fw={500} c="var(--mantine-color-brass-filled)">
            Setup changed since this march. Generate to refresh.
          </Text>
        </Group>
      )}
    </Stack>
  );
}
