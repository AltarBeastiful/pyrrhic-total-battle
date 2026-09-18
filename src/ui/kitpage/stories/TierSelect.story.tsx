import { Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { TierSelect } from '../../kit';
import { GroupMarker } from '../../domain';
import type { KitStory } from '../story';

const TIERS = [1, 2, 3, 4, 5];
const NINE = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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
    <Stack gap="md">
      <Group gap="lg" wrap="wrap" align="flex-end">
        <Range />
        <TierSelect
          label="Engineers to"
          prefix="E"
          tiers={TIERS}
          value={null}
          allowNone
          onChange={() => {}}
        />
        <TierSelect label="Monsters to" prefix="M" tiers={TIERS} value={3} disabled onChange={() => {}} />
      </Group>
      {/* One of each tier, so the nine inks can be read against the well in both schemes. */}
      <Group gap="xs" wrap="wrap">
        {NINE.map((tier) => (
          <TierSelect
            key={tier}
            label={`Tier ${String(tier)}`}
            prefix="G"
            tiers={NINE}
            value={tier}
            onChange={() => {}}
          />
        ))}
      </Group>
    </Stack>
  ),
};

export default story;
