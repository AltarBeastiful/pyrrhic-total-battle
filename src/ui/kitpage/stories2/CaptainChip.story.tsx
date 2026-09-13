import { Select, Stack, Text } from '@mantine/core';
import { Group } from '@mantine/core';
import { useState } from 'react';

import { NumberField } from '../../kit2';
import { CaptainChip } from '../../domain2';
import type { KitStory } from '../story';

const CAPTAINS = [
  { name: 'Aydae', key: 'melee', bonus: 'HP +25 %' },
  { name: 'Ardan', key: 'ranged', bonus: 'Attack +18 %' },
  { name: 'Bjorn', key: 'monsters', bonus: 'Monster HP +30 %' },
  { name: 'Cyra', key: 'army', bonus: 'Army defence +9 %' },
] as const;

function Live() {
  const [enlisted, setEnlisted] = useState<string[]>(['Aydae']);
  const [editing, setEditing] = useState<string | null>(null);
  const [level, setLevel] = useState<number | null>(20);

  return (
    <Group gap="sm" wrap="wrap">
      {CAPTAINS.map((captain) => (
        <CaptainChip
          key={captain.name}
          name={captain.name}
          bonusKey={captain.key}
          bonus={captain.bonus}
          enlisted={enlisted.includes(captain.name)}
          levelSet={captain.name === 'Aydae'}
          onToggle={() => {
            setEnlisted((current) =>
              current.includes(captain.name)
                ? current.filter((entry) => entry !== captain.name)
                : [...current, captain.name],
            );
          }}
          onEditLevel={() => {
            setEditing((current) => (current === captain.name ? null : captain.name));
          }}
          levelEditorOpened={editing === captain.name}
          onLevelEditorChange={(open) => {
            if (!open) setEditing(null);
          }}
          levelEditor={
            <Stack gap="xs" w={220}>
              <Text size="sm" fw={600}>
                {captain.name}
              </Text>
              <NumberField label="Base level" value={level} max={60} onChange={setLevel} />
              <Select
                size="xs"
                label="Star level"
                data={['—', '★1', '★2', '★3']}
                defaultValue="★3"
                allowDeselect={false}
              />
              <Text size="xs" c="dimmed">
                {captain.bonus} while {captain.name} marches.
              </Text>
            </Stack>
          }
        />
      ))}
    </Group>
  );
}

const story: KitStory = { name: 'CaptainChip', group: 'domain', render: () => <Live /> };

export default story;
