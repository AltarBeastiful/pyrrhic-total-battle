import { Text } from '@mantine/core';
import { useState } from 'react';

import { ChoiceList } from '../../kit2';
import type { KitStory } from '../story';

function Live() {
  const [value, setValue] = useState('ladder');
  return (
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
        { value: 'locked', title: 'Total optimisation', description: 'Not available yet.', disabled: true },
      ]}
    />
  );
}

const story: KitStory = { name: 'ChoiceList', group: 'kit', render: () => <Live /> };

export default story;
