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

import { amount, ratio } from './format';
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
    {
      key: 'perSilver',
      label: 'Damage per silver',
      value: summary.damagePerSilver,
      previous: was((value) => value.damagePerSilver),
      format: ratio,
      betterWhen: 'higher' as const,
    },
  ];

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
            {/* The one figure that carried no mark while the four under it did (rule 21). */}
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

        {/* The four figures as the spacing contract draws them: a **2-column grid, 8 × 16 gaps**,
            the label 12 px muted with its glyph in the fixed box over a 15/600 tabular figure
            (`MarchPaneSpacing.dc.html`, `.figs`). They were four full-width rows of label-then-value
            before, which is four lines of a 420 px pane spent on four numbers. */}
        <Figures
          label="March figures"
          layout="grid"
          items={figures.map((figure) => ({
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
          }))}
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
