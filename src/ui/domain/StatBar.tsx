/**
 * One statistic of the unit sheet (design plan §7.6): the base value and the value with every bonus
 * applied, as two bars on the same scale — so the gap between them *is* the bonus. The numbers stay
 * visible; a bar alone is a shape, not a figure.
 *
 * **And the bonus itself is written out** (owner, 2026-09-28: *"in the detail of a troop … add the percent of
 * bonus in health and strength in a good place"*). The gap between the two bars is only a *length*: a player
 * comparing an archer against a horseman can see one gap is longer, and cannot read either of them. So the
 * figure the gap measures sits on the label line, right-aligned over the values it explains — "+43.5%"
 * beside Health, its own signed percentage (`signedPercent`, the March's notation).
 *
 * The words are the caller's, not this component's: a percent is written the way its section writes figures,
 * and this one is drawn in the unit sheet and on the kit page both (`StatBarProps.bonus`).
 */
import { Group, Progress, Stack, Text } from '@mantine/core';

export interface StatBarProps {
  label: string;
  base: number;
  boosted: number;
  format: (n: number) => string;
  /**
   * The bonus the boosted bar is, already written ("+43.5%"). The unit sheet always passes it — a type no
   * bonus of the account's touches reads "0%", which is the answer to the question the line is asked — and
   * a caller with nothing to say leaves it out rather than inventing a figure (design rule 15).
   */
  bonus?: string;
}

export function StatBar({ label, base, boosted, format, bonus }: StatBarProps) {
  const max = Math.max(base, boosted, 1);
  const bars = [
    { key: 'base', name: 'Base', amount: base, color: 'slate.5' },
    { key: 'boosted', name: 'With bonuses', amount: boosted, color: 'brass' },
  ] as const;

  return (
    <Stack gap={4} miw={0}>
      {/* The label line carries the figure as well as the name, so the two rows under it are the *same*
          figure twice — and the percent is aligned with the values' own right edge, above them. */}
      <Group justify="space-between" gap="xs" wrap="nowrap">
        <Text span size="xs" c="dimmed">
          {label}
        </Text>
        {bonus !== undefined && (
          <Text span size="xs" c="dimmed" data-bonus>
            {bonus}
          </Text>
        )}
      </Group>
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
