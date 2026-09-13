/**
 * A wrapping row of chips that choose from a fixed set (plan §3): the categories included at the top
 * tier, the captains riding along, the titles in play. `max` is TotalStack's captain rule — the
 * fourth pick is refused rather than swapping one out — and the refusal is said in words, in a live
 * region, because silence reads as a broken button.
 *
 * Built from `Chip` and `Group` rather than from `Chip.Group`. The group's context re-renders every
 * chip on every toggle, and Bonuses puts about eighty of them on one phone screen; keeping the
 * selection in the caller's hands and passing `checked` down lets `memo` stop the other seventy-nine
 * from re-rendering. The row still carries the group's role and name itself.
 */
import { Chip, Group, Stack, Text } from '@mantine/core';
import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export interface ChipRowItem {
  value: string;
  label: ReactNode;
  /** A second, dimmed line under the label: a title's "HP +25 %". */
  sublabel?: ReactNode;
  /** A mark before the label. */
  glyph?: ReactNode;
  /** A theme colour name; the group's or the tier's. */
  color?: string;
  disabled?: boolean;
  /** Replaces the generated accessible name when the label is not a string. */
  name?: string;
  /**
   * The whole chip body, when it has to know whether the chip is on — a hired mercenary showing
   * "∞" once it is chosen. Used in place of `glyph`/`label`/`sublabel`.
   */
  render?: (checked: boolean) => ReactNode;
}

export interface ChipRowProps {
  /** Names the row for a screen reader ("Include at G4", "Captains"). */
  label: string;
  items: ChipRowItem[];
  value: string[];
  onChange: (value: string[]) => void;
  /** At most this many at once. A pick past it is refused and the row says why. */
  max?: number;
  /** The sentence the refusal says; a default is generated from `max`. */
  refusal?: string;
  /** One at a time. */
  single?: boolean;
  gap?: number;
}

interface ChipRowItemProps {
  item: ChipRowItem;
  checked: boolean;
  single: boolean;
  onToggle: (value: string) => void;
}

const RowChip = memo(function RowChip({ item, checked, single, onToggle }: ChipRowItemProps) {
  return (
    <Chip
      value={item.value}
      checked={checked}
      disabled={item.disabled ?? false}
      type={single ? 'radio' : 'checkbox'}
      color={item.color ?? 'brass'}
      aria-label={item.name}
      onChange={() => {
        onToggle(item.value);
      }}
    >
      {item.render === undefined ? (
        <Group gap={5} wrap="nowrap" component="span">
          {item.glyph}
          <Stack gap={0} component="span">
            <Text span inherit>
              {item.label}
            </Text>
            {item.sublabel !== undefined && (
              <Text span size="xs" c="dimmed">
                {item.sublabel}
              </Text>
            )}
          </Stack>
        </Group>
      ) : (
        item.render(checked)
      )}
    </Chip>
  );
});

export function ChipRow({
  label,
  items,
  value,
  onChange,
  max,
  refusal,
  single = false,
  gap = 6,
}: ChipRowProps) {
  const [notice, setNotice] = useState('');
  const selected = useMemo(() => new Set(value), [value]);

  // The latest props, read inside a callback that never changes identity — which is what lets the
  // memoised chips above keep their props stable across a toggle. Written after the render rather
  // than during it, because a ref is not a rendering input.
  const latest = useRef({ value, onChange, max, refusal, single });
  useEffect(() => {
    latest.current = { value, onChange, max, refusal, single };
  });

  const onToggle = useCallback((id: string) => {
    const current = latest.current;
    if (current.single) {
      setNotice('');
      current.onChange(current.value[0] === id ? [] : [id]);
      return;
    }
    if (current.value.includes(id)) {
      setNotice('');
      current.onChange(current.value.filter((entry) => entry !== id));
      return;
    }
    if (current.max !== undefined && current.value.length >= current.max) {
      setNotice(current.refusal ?? `${current.max} at most. Remove one before adding another.`);
      return;
    }
    setNotice('');
    current.onChange([...current.value, id]);
  }, []);

  return (
    <Stack gap={4}>
      <Group role="group" aria-label={label} gap={gap} wrap="wrap">
        {items.map((item) => (
          <RowChip
            key={item.value}
            item={item}
            checked={selected.has(item.value)}
            single={single}
            onToggle={onToggle}
          />
        ))}
      </Group>
      <Text role="status" size="xs" c="dimmed" mih="1.125rem">
        {notice}
      </Text>
    </Stack>
  );
}
