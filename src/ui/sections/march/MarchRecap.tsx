/**
 * The answer, in figures (design plan §7.5 step 1, design rule 1). The expected damage is the one
 * number the eye should land on, so it is the only thing on the page set in the display face; the
 * five figures a player compares marches by follow it as a list, each carrying the way it moved
 * since the previous run.
 *
 * Two variants, one component (M-08's contract). `pane` is the March pane header on desktop and the
 * head of the section on a phone: figures and nothing else. `sheet` is what opens from the bottom
 * bar's quick summary, where there is room for the whole answer — the figures, then what each
 * housing pool bought, then the types left at home.
 */
import { Group, Paper, Stack, Text } from '@mantine/core';

import type { BattleSummary, Pool, Stack as StackType } from '@/engine/types';
import { DeltaText, Glyph, PoolGauge, UnitTile } from '@/ui/domain';
import { Figures } from '@/ui/kit';

import { keepInMarch } from './formation';
import { amount, ratio } from './format';
import classes from './march.module.css';
import { findUnit } from './units';
import { useMarch } from './useMarch';

const POOLS: Pool[] = ['leadership', 'authority', 'dominance'];

/**
 * The hero prints its own number, so the line under it carries only the change. `DeltaText` is
 * still the one place that decides what "better" means for a figure, which is the point.
 */
const CHANGE_ONLY = (): string => '';

export interface MarchRecapProps {
  /** 'pane' = March pane header on desktop; 'sheet' = the phone recap sheet (adds the stacks). */
  variant: 'pane' | 'sheet';
}

export function MarchRecap({ variant }: MarchRecapProps) {
  const { snapshot, result, summary, previous, leftOut } = useMarch();

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

  const stacksIn = (pool: Pool): StackType[] => result.stacks.filter((stack) => stack.pool === pool);

  return (
    <Stack gap="md" aria-label="This march in figures">
      <Stack gap={2}>
        <Text variant="numeral" fz="2rem" lh={1.1} fw={600}>
          {amount(summary.avgDamage)}
        </Text>
        <Group gap="xs" wrap="nowrap">
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

      {variant === 'sheet' && (
        <>
          {POOLS.filter((pool) => result.pools[pool].capacity > 0 || result.pools[pool].used > 0).map(
            (pool) => (
              <Stack key={pool} gap="xs">
                <PoolGauge pool={pool} used={result.pools[pool].used} total={result.pools[pool].capacity} />
                <div className={classes.stackGrid}>
                  {stacksIn(pool).map((stack) => {
                    const unit = findUnit(stack.unitId, snapshot.request.units);
                    if (unit === undefined) return null;
                    return (
                      <Paper key={stack.unitId} p="xs" radius="sm" bg="var(--pyr-sunken)">
                        <Group gap="xs" wrap="nowrap">
                          <UnitTile unit={unit} size="sm" />
                          <Stack gap={0} miw={0}>
                            <Text span size="xs" c="dimmed" truncate>
                              {unit.name}
                            </Text>
                            <Text span size="md" fw={600}>
                              {amount(stack.count)}
                            </Text>
                          </Stack>
                        </Group>
                      </Paper>
                    );
                  })}
                </div>
              </Stack>
            ),
          )}

          {leftOut.length > 0 && (
            <Stack gap="xs">
              <Text span size="xs" c="dimmed">
                Left out — tap to put back
              </Text>
              <Group gap="xs">
                {leftOut.map((unit) => (
                  <UnitTile
                    key={unit.id}
                    unit={unit}
                    size="sm"
                    state="leftOut"
                    label={`${unit.name}, tier ${String(unit.tier)}, left out — keep in march`}
                    onPress={() => {
                      keepInMarch(unit.id);
                    }}
                  />
                ))}
              </Group>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
