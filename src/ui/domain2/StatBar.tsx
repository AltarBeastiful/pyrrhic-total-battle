/**
 * One statistic of the unit sheet (design plan §7.6): the base value and the value with every bonus
 * applied, as two bars on the same scale — so the gap between them *is* the bonus. The numbers stay
 * visible; a bar alone is a shape, not a figure.
 */
import { Group, Progress, Stack, Text } from '@mantine/core';

export interface StatBarProps {
  label: string;
  base: number;
  boosted: number;
  format: (n: number) => string;
}

export function StatBar({ label, base, boosted, format }: StatBarProps) {
  const max = Math.max(base, boosted, 1);
  const bars = [
    { key: 'base', name: 'Base', amount: base, color: 'slate.5' },
    { key: 'boosted', name: 'With bonuses', amount: boosted, color: 'brass' },
  ] as const;

  return (
    <Stack gap={4} miw={0}>
      <Text span size="xs" c="dimmed">
        {label}
      </Text>
      {bars.map((bar) => (
        <Group key={bar.key} gap="xs" wrap="nowrap">
          <Text span size="xs" c="dimmed" w={96}>
            {bar.name}
          </Text>
          <Progress.Root
            size="sm"
            radius="xs"
            flex={1}
            miw={0}
            role="progressbar"
            aria-label={`${label}, ${bar.name.toLowerCase()}`}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-valuenow={bar.amount}
            aria-valuetext={format(bar.amount)}
          >
            <Progress.Section
              withAria={false}
              value={Math.min(100, Math.max(0, (bar.amount / max) * 100))}
              color={bar.color}
            />
          </Progress.Root>
          <Text span size="sm" fw={500} w={80} ta="right">
            {format(bar.amount)}
          </Text>
        </Group>
      ))}
    </Stack>
  );
}
