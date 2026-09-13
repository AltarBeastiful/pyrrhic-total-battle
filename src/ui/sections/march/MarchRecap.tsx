/**
 * The answer, in figures (design plan §7.5 step 1, design rule 1). The expected damage is the one
 * number the eye should land on, so it is the only thing on the page set in the display face, at the
 * 48 px `docs/design.md` §3 gives it; the five figures a player compares marches by follow it as a
 * list, each carrying the way it moved since the previous run.
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

import { amount, ratio, relativeTime } from './format';
import classes from './march.module.css';
import { useMarch } from './useMarch';

/**
 * The hero prints its own number, so the line under it carries only the change. `DeltaText` is
 * still the one place that decides what "better" means for a figure, which is the point.
 */
const CHANGE_ONLY = (): string => '';

export function MarchRecap() {
  const { snapshot, result, summary, previous } = useMarch();

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
  const hits = summary.journals.enemyFirst.friendlyHits;

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
      key: 'hits',
      label: 'Hits landed',
      value: hits,
      previous: was((value) => value.journals.enemyFirst.friendlyHits),
      format: amount,
      betterWhen: 'higher' as const,
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
      <Stack gap={2}>
        {/* The hero figure at `docs/design.md` §3's own 48 px, and free to shrink rather than to
            break: it is the widest thing in a 360 dp pane. */}
        <Text variant="numeral" fz={{ base: '2.5rem', lg: '3rem' }} lh={1} fw={300} className={classes.hero}>
          {amount(summary.avgDamage)}
        </Text>
        <Group gap="xs" wrap="nowrap">
          {/* The one figure that carried no mark while the four under it did (rule 21). */}
          <Glyph kind="averageDamage" />
          {/* "Expected damage · generated just now" — the artboard's own label line. When the run
              landed is a fact about this figure, not a second heading (design rule 5). */}
          <Text span size="sm" c="dimmed">
            {`Expected damage · generated ${relativeTime(snapshot.at)}`}
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

      <Figures
        label="March figures"
        labelWidth="11rem"
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
  );
}
