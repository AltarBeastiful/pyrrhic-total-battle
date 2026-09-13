import { Group, Text } from '@mantine/core';
import { useState } from 'react';

import { TierSelect } from '../../kit';
import { GroupMarker } from '../../domain';
import type { KitStory } from '../story';

const TIERS = [1, 2, 3, 4, 5];

function Range() {
  const [from, setFrom] = useState<number | null>(1);
  const [to, setTo] = useState<number | null>(4);
  return (
    <Group gap="sm" wrap="wrap" align="center">
      <GroupMarker group="guardsmen" label="Guardsmen" />
      <Text size="xs" c="dimmed">
        from
      </Text>
      <TierSelect
        label="Guardsmen from"
        prefix="G"
        tiers={TIERS}
        value={from}
        max={to ?? undefined}
        onChange={setFrom}
      />
      <Text size="xs" c="dimmed">
        to
      </Text>
      <TierSelect
        label="Guardsmen to"
        prefix="G"
        tiers={TIERS}
        value={to}
        min={from ?? undefined}
        allowNone
        onChange={setTo}
      />
    </Group>
  );
}

const story: KitStory = {
  name: 'TierSelect',
  group: 'kit',
  render: () => (
    <Group gap="lg" wrap="wrap" align="flex-end">
      <Range />
      <TierSelect label="Engineers to" prefix="E" tiers={TIERS} value={null} allowNone onChange={() => {}} />
      <TierSelect label="Monsters to" prefix="M" tiers={TIERS} value={3} disabled onChange={() => {}} />
    </Group>
  ),
};

export default story;
