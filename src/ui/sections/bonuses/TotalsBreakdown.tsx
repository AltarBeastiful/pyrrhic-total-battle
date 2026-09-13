/**
 * What the three header figures are made of, key by key, with the sources that fed each one — the
 * block a player opens when the game's own march window disagrees with ours and the difference has
 * to go into the unexplained remainder.
 *
 * It is the last fold of the card: the header is the answer, this is the audit.
 */
import { Group, Stack, Text } from '@mantine/core';

import { aggregateBonuses } from '@/engine/bonuses';
import { describeTotals, resolveSources } from '@/state/derive';
import type { TotalRow } from '@/state/derive';
import type { BattleSetup, Profile } from '@/state/schema';

import { AGAINST_LABELS, BONUS_LABELS, formatPercent, sourceLabel } from './labels';

/** Keys nothing feeds are not worth a line. */
const carries = (row: TotalRow): boolean => row.value !== 0 || row.contributors.length > 0;

const NUMS = { fontVariantNumeric: 'tabular-nums' } as const;

function Line({ label, value, dim = false }: { label: string; value: string; dim?: boolean }) {
  const tone = dim ? { size: 'xs' as const, c: 'dimmed', fw: 400 } : { size: 'sm' as const, fw: 500 };
  return (
    <Group justify="space-between" gap="xs" wrap="nowrap" align="baseline">
      <Text size={tone.size} {...(dim ? { c: 'dimmed' } : {})} truncate>
        {label}
      </Text>
      <Text size={tone.size} {...(dim ? { c: 'dimmed' } : {})} fw={tone.fw} style={NUMS}>
        {value}
      </Text>
    </Group>
  );
}

function Rows({ rows, empty }: { rows: TotalRow[]; empty: string }) {
  const used = rows.filter(carries);
  if (used.length === 0)
    return (
      <Text size="sm" c="dimmed">
        {empty}
      </Text>
    );
  return (
    <Stack gap="xs">
      {used.map((row) => (
        <Stack key={row.key} gap={0}>
          <Line label={row.label} value={formatPercent(row.value)} />
          {row.contributors.map((contributor, index) => (
            <Line
              key={`${contributor.sourceId}-${String(index)}`}
              dim
              label={sourceLabel(contributor.label)}
              value={formatPercent(contributor.value)}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap={4} component="section" aria-label={title}>
      <Text size="sm" fw={500}>
        {title}
      </Text>
      {children}
    </Stack>
  );
}

export function TotalsBreakdown({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const sources = resolveSources(profile, setup);
  const totals = describeTotals(aggregateBonuses(sources), sources);

  return (
    <Stack gap="lg">
      <Block title="Health">
        <Rows rows={totals.health} empty="No health bonus is switched on." />
      </Block>
      <Block title="Strength">
        <Rows rows={totals.strength} empty="No strength bonus is switched on." />
        {totals.eventStrength !== 0 && (
          <Line label="From events" value={formatPercent(totals.eventStrength)} />
        )}
        {totals.matchup.map((entry, index) => (
          <Line
            key={`${entry.attacker}-${entry.target}-${String(index)}`}
            label={`${BONUS_LABELS[entry.attacker]} against ${AGAINST_LABELS[entry.target]}`}
            value={formatPercent(entry.value)}
          />
        ))}
      </Block>
      <Block title="Special">
        <Rows rows={totals.special} empty="No special bonus is switched on." />
      </Block>
    </Stack>
  );
}
