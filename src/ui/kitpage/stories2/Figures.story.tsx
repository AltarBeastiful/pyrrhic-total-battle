import { Group } from '@mantine/core';

import { Figures } from '../../kit2';
import { Glyph } from '../../domain2';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Figures',
  group: 'kit',
  render: () => (
    <Group gap="xl" align="flex-start" wrap="wrap">
      <Figures
        label="Battle summary"
        items={[
          { key: 'min', label: 'Minimum damage', value: '13 840 219', glyph: <Glyph kind="minimumDamage" /> },
          { key: 'avg', label: 'Average damage', value: '15 143 235', glyph: <Glyph kind="averageDamage" /> },
          { key: 'silver', label: 'Damage / silver', value: '7.2' },
        ]}
      />
      <Figures
        label="Army recovery cost"
        withDivider
        items={[
          { key: 'time', label: 'Time', value: '14d 14h', glyph: <Glyph kind="time" /> },
          { key: 'silver', label: 'Silver', value: '2 100 000', glyph: <Glyph kind="silver" /> },
          { key: 'coins', label: 'Dragon coins', value: '0', glyph: <Glyph kind="dragonCoin" /> },
          { key: 'gold', label: 'Gold', value: '8 576', glyph: <Glyph kind="gold" /> },
        ]}
      />
    </Group>
  ),
};

export default story;
