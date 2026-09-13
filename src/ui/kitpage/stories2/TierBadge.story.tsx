import { Group, Paper, Text } from '@mantine/core';

import { TierBadge } from '../../domain2';
import type { KitStory } from '../story';

const TIERS = [5, 6, 7, 8, 9];

const story: KitStory = {
  name: 'TierBadge',
  group: 'domain',
  render: () => (
    <Group gap="lg" align="flex-start" wrap="wrap">
      <Group gap="sm">
        {TIERS.map((tier) => (
          <TierBadge key={tier} tier={tier} />
        ))}
        <TierBadge tier={3} />
      </Group>
      <Paper p="sm" bg="var(--pyr-raised)">
        <Group gap="sm">
          {TIERS.map((tier) => (
            <TierBadge key={tier} tier={tier} size="sm" />
          ))}
        </Group>
      </Paper>
      <Group gap={6}>
        <Text size="sm">Abomination</Text>
        <TierBadge tier={6} />
        <Text size="sm" c="dimmed">
          ×22
        </Text>
      </Group>
    </Group>
  ),
};

export default story;
