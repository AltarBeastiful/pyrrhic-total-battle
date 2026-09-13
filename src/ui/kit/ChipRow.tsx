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
 *
 * The row is **one tab stop** (design rule 24): `useRovingTabs` puts the arrows in charge of moving
 * between the chips, so a keyboard crosses a row of thirty in one `Tab` and `Space` still toggles.
 */
import { Chip, Group, Stack, Text } from '@mantine/core';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';

import { useRovingTabs } from './useRovingTabs';

/**
 * The **dense** row (the owner's phone review, 2026-09-13): a Troops include chip is a glyph and a
 * three-letter code, and at 30 px with a 13 px label it was the tallest thing on the row. 26 px and
 * 12 px of type is TotalStack's own size for the same chip. Said as the four variables Mantine
 * documents for a `Chip`, on the instance, so nothing else on the page changes size with it.
 */
const DENSE: CSSProperties = {
  '--chip-size': '1.625rem',
  '--chip-fz': '0.75rem',
  '--chip-padding': '0.4375rem',
  '--chip-checked-padding': '0.4375rem',
} as CSSProperties;

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
  /** 26 px and 12 px of type: a row of codes, not of names (the Troops include chips). */
  dense?: boolean;
  /** The id of the caption that says what the row is for; a screen reader reads it after the name. */
  describedBy?: string;
}

interface ChipRowItemProps {
  item: ChipRowItem;
  checked: boolean;
  single: boolean;
  dense: boolean;
  onToggle: (value: string) => void;
}

const RowChip = memo(function RowChip({ item, checked, single, dense, onToggle }: ChipRowItemProps) {
  return (
    <Chip
      value={item.value}
      checked={checked}
      disabled={item.disabled ?? false}
      type={single ? 'radio' : 'checkbox'}
      color={item.color ?? 'brass'}
      aria-label={item.name}
      {...(dense ? { style: DENSE } : {})}
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
  dense = false,
  describedBy,
}: ChipRowProps) {
  const [notice, setNotice] = useState('');
  const selected = useMemo(() => new Set(value), [value]);
  const roving = useRovingTabs();

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
      <Group
        role="group"
        aria-label={label}
        {...(describedBy === undefined ? {} : { 'aria-describedby': describedBy })}
        gap={gap}
        wrap="wrap"
        {...roving}
      >
        {items.map((item) => (
          <RowChip
            key={item.value}
            item={item}
            checked={selected.has(item.value)}
            single={single}
            dense={dense}
            onToggle={onToggle}
          />
        ))}
      </Group>
      {/* Always mounted so screen readers announce a refusal; takes no space while silent. */}
      <Text role="status" size="xs" c="dimmed" mih={notice ? '1.125rem' : 0} {...(notice ? {} : { lh: 0 })}>
        {notice}
      </Text>
    </Stack>
  );
}
