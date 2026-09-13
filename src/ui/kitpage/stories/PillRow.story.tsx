import { Group, Text } from '@mantine/core';
import { useState } from 'react';

import { PillRow } from '../../kit';
import { Glyph, TierBadge } from '../../domain';
import type { KitStory } from '../story';

interface Hired {
  id: string;
  code: string;
  name: string;
  tier: number;
  cap: string;
}

const START: Hired[] = [
  { id: 'hunter-5', code: 'EMH', name: 'Epic Monster Hunter', tier: 5, cap: '∞' },
  { id: 'bear-5', code: 'BER', name: 'Bear', tier: 5, cap: '240' },
  { id: 'archdemon-6', code: 'ARD', name: 'Archdemon', tier: 6, cap: '30' },
];

function Live() {
  const [hired, setHired] = useState(START);
  return (
    <PillRow
      label="Hired mercenaries"
      empty={
        <Text size="sm" c="dimmed">
          No mercenaries hired yet.
        </Text>
      }
      items={hired.map((merc) => ({
        id: merc.id,
        removeLabel: `Dismiss ${merc.name}`,
        onRemove: () => {
          setHired((current) => current.filter((entry) => entry.id !== merc.id));
        },
        label: (
          <Group gap={5} wrap="nowrap" component="span">
            <Glyph kind="epicMonster" />
            <Text span size="xs" fw={600}>
              {merc.code}
            </Text>
            <TierBadge tier={merc.tier} />
            <Text span size="xs">
              {merc.cap}
            </Text>
          </Group>
        ),
      }))}
    />
  );
}

const story: KitStory = { name: 'PillRow', group: 'kit', render: () => <Live /> };

export default story;
