/**
 * A list of mutually exclusive choices where each one needs a sentence (plan §3): the stacking
 * method, the objective, the tie-break. `Radio.Group` + `Radio.Card` gives a full-row target with
 * the radio's keyboard contract intact — arrows move *and* choose, which is what a radio group owes
 * — and leaves room for a description under the title and a figure at the end of the row.
 */
import { Group, Radio, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

export interface ChoiceItem {
  value: string;
  title: string;
  description?: ReactNode;
  /** The end of the row: a figure, a badge, a hint. */
  trailing?: ReactNode;
  disabled?: boolean;
}

export interface ChoiceListProps {
  label: string;
  description?: ReactNode;
  value: string | null;
  onChange: (value: string) => void;
  items: ChoiceItem[];
  /** Groups the radios for the keyboard; generated from the label when left out. */
  name?: string;
}

export function ChoiceList({ label, description, value, onChange, items, name }: ChoiceListProps) {
  return (
    <Radio.Group
      label={label}
      description={description}
      value={value}
      onChange={onChange}
      name={name ?? label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
    >
      <Stack gap="xs" mt="xs">
        {items.map((item) => (
          <Radio.Card
            key={item.value}
            value={item.value}
            withBorder
            radius="sm"
            p="sm"
            disabled={item.disabled ?? false}
          >
            <Group wrap="nowrap" align="flex-start" gap="sm">
              <Radio.Indicator />
              <Stack gap={2} flex={1} miw={0}>
                <Text size="sm" fw={500}>
                  {item.title}
                </Text>
                {item.description !== undefined && (
                  <Text size="xs" c="dimmed">
                    {item.description}
                  </Text>
                )}
              </Stack>
              {item.trailing}
            </Group>
          </Radio.Card>
        ))}
      </Stack>
    </Radio.Group>
  );
}
