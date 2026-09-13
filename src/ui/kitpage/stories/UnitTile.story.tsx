import { Group, Stack, Text } from '@mantine/core';

import { SAMPLE_UNITS } from '../../domain/fixtures';
import { UnitTile, type UnitTileState } from '../../domain';
import type { KitStory } from '../story';

const STATES: UnitTileState[] = ['on', 'off', 'pinned', 'leftOut'];

const story: KitStory = {
  name: 'UnitTile',
  group: 'domain',
  render: () => (
    <Stack gap="md">
      {(['sm', 'md', 'lg'] as const).map((size) => (
        <Group key={size} gap="sm" align="center">
          <Text size="xs" c="dimmed" w={24}>
            {size}
          </Text>
          {SAMPLE_UNITS.map((unit) => (
            <UnitTile key={unit.id} unit={unit} size={size} />
          ))}
        </Group>
      ))}
      <Group gap="sm" align="center">
        <Text size="xs" c="dimmed" w={24}>
          states
        </Text>
        {STATES.map((state) => (
          <UnitTile key={state} unit={SAMPLE_UNITS[0]!} size="md" state={state} onPress={() => {}} />
        ))}
        <UnitTile unit={SAMPLE_UNITS[0]!} size="md" selected onPress={() => {}} />
      </Group>
    </Stack>
  ),
};

export default story;
