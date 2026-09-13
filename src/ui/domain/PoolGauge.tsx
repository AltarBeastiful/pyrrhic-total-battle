/**
 * A housing pool at rest (design plan §7.4): its glyph, its name, "used of total" in tabular
 * figures, and the bar that shows how full it is. Read-only — the pool's *limit* is typed into the
 * Battle card; this is what the march did with it.
 *
 * "84 300 of 84 300" rather than a fraction slash: a pool is a vessel filled to the brim on the
 * game's Start March screen, and a slash reads as arithmetic rather than as capacity.
 */
import { Group, Progress, Stack, Text } from '@mantine/core';

import type { Pool } from '../../data/types';
import { Glyph } from './Glyph';
import type { GlyphKind } from './glyphs';
import { count } from './format';

const POOL_LABEL: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

const POOL_GLYPH: Record<Pool, GlyphKind> = {
  leadership: 'leadership',
  authority: 'authority',
  dominance: 'dominance',
};

export interface PoolGaugeProps {
  pool: Pool;
  used: number;
  total: number;
}

export function PoolGauge({ pool, used, total }: PoolGaugeProps) {
  const label = POOL_LABEL[pool];
  const over = used > total;
  const percent = total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 1000) / 10)) : 0;
  const text = `${count(used)} of ${count(total)}`;

  return (
    <Stack gap={4} miw={0}>
      <Group gap={6} wrap="nowrap">
        <Glyph kind={POOL_GLYPH[pool]} />
        <Text span size="xs" c="dimmed">
          {label}
        </Text>
      </Group>
      <Text span size="sm" fw={500} {...(over ? { c: 'red' as const } : {})}>
        {text}
      </Text>
      {/* The bar carries the real figures rather than a percentage: Mantine's own `withAria` writes
          `aria-valuetext="100%"` over anything passed in, and "84 300 of 84 300" is the sentence. */}
      <Progress.Root
        size="sm"
        radius="xs"
        role="progressbar"
        aria-label={`${label} used`}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={used}
        aria-valuetext={text}
      >
        <Progress.Section withAria={false} value={percent} color={over ? 'red' : 'brass'} />
      </Progress.Root>
    </Stack>
  );
}
