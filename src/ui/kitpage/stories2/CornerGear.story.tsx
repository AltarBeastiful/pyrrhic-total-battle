import { Group } from '@mantine/core';
import { useState } from 'react';

import { CornerGear } from '../../kit2';
import { CaptainChip } from '../../domain2';
import type { KitStory } from '../story';

function Live() {
  const [enlisted, setEnlisted] = useState<string[]>(['Aydae']);
  const toggle = (name: string) => {
    setEnlisted((current) =>
      current.includes(name) ? current.filter((entry) => entry !== name) : [...current, name],
    );
  };
  return (
    <Group gap="sm">
      {['Aydae', 'Ardan', 'Bjorn'].map((name) => (
        <CornerGear
          key={name}
          label={`Set ${name}’s level`}
          active={enlisted.includes(name)}
          onPress={() => {}}
        >
          <CaptainChip
            name={name}
            enlisted={enlisted.includes(name)}
            onToggle={() => {
              toggle(name);
            }}
          />
        </CornerGear>
      ))}
    </Group>
  );
}

const story: KitStory = { name: 'CornerGear', group: 'kit', render: () => <Live /> };

export default story;
