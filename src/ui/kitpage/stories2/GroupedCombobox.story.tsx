import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { GroupedCombobox } from '../../kit2';
import { Glyph, TierBadge } from '../../domain2';
import type { KitStory } from '../story';

const GROUPS = [5, 6, 7, 9].map((tier) => ({
  key: String(tier),
  label: (
    <Group gap={6} component="span">
      <TierBadge tier={tier} />
      <Text span size="xs">
        Tier {tier}
      </Text>
    </Group>
  ),
  options: ['Bear', 'Archdemon', 'Epic Monster Hunter', 'Frost Wyrm'].map((name) => ({
    value: `${name}-${tier}`,
    searchText: name,
    label: (
      <Group gap="xs" wrap="nowrap">
        <Glyph kind="epicMonster" />
        <Text size="xs">{name}</Text>
      </Group>
    ),
  })),
}));

const FILTERS = ['monsters', 'guardsmen', 'specialists', 'beast'] as const;

function Live() {
  const [picked, setPicked] = useState<string[]>([]);
  const [filters, setFilters] = useState<string[]>([]);
  return (
    <Stack gap="xs" align="flex-start">
      <GroupedCombobox
        triggerLabel="Hire mercenary…"
        searchLabel="Search mercenaries"
        groups={GROUPS}
        onPick={(value) => {
          setPicked((current) => (current.includes(value) ? current : [...current, value]));
        }}
        filters={
          <ActionIcon.Group>
            {FILTERS.map((filter) => (
              <ActionIcon
                key={filter}
                size="sm"
                aria-label={filter}
                aria-pressed={filters.includes(filter)}
                variant={filters.includes(filter) ? 'filled' : 'default'}
                onClick={() => {
                  setFilters((current) =>
                    current.includes(filter)
                      ? current.filter((entry) => entry !== filter)
                      : [...current, filter],
                  );
                }}
              >
                <Glyph kind={filter === 'beast' ? 'beast' : filter} />
              </ActionIcon>
            ))}
          </ActionIcon.Group>
        }
      />
      <Text size="xs" c="dimmed">
        {picked.length === 0 ? 'Nothing hired yet.' : `Hired: ${picked.join(', ')}`}
      </Text>
    </Stack>
  );
}

const story: KitStory = { name: 'GroupedCombobox', group: 'kit', render: () => <Live /> };

export default story;
