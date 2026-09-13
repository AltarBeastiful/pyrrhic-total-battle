import { Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { ChoiceList } from '../../kit';
import type { KitStory } from '../story';

function Live() {
  const [value, setValue] = useState('ladder');
  const [card, setCard] = useState('average');
  return (
    <Stack gap="lg">
      <ChoiceList
        label="Method"
        description="How the stacker fills the march."
        value={value}
        onChange={setValue}
        items={[
          {
            value: 'ladder',
            title: 'Tier ladder',
            description: 'Fill from the top tier down, one stack per tier.',
            trailing: (
              <Text size="xs" c="dimmed">
                fastest
              </Text>
            ),
          },
          {
            value: 'troops',
            title: 'Troops first',
            description: 'Spend leadership before authority, mercenaries last.',
          },
          {
            value: 'own',
            title: 'Your own order',
            description: 'Follow the order you set in Troops.',
          },
          { value: 'locked', title: 'Every combination', description: 'Not available yet.', disabled: true },
        ]}
      />
      <ChoiceList
        layout="cards"
        columns={3}
        label="Objective"
        description="What a Generate aims at."
        value={card}
        onChange={setCard}
        items={[
          { value: 'average', title: 'Best average', description: 'The most damage over many fights.' },
          { value: 'worst', title: 'Best worst case', description: 'The best opening you can be sure of.' },
          { value: 'cheap', title: 'Cheapest win', description: 'The least silver spent recovering.' },
        ]}
      />
    </Stack>
  );
}

const story: KitStory = { name: 'ChoiceList', group: 'kit', render: () => <Live /> };

export default story;
