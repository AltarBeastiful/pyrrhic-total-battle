import { Select, Stack, Text } from '@mantine/core';
import { Group } from '@mantine/core';
import { useState } from 'react';

import { NumberField } from '../../kit';
import { CaptainChip } from '../../domain';
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

/**
 * Every case of a recorded level (owner, 2026-10-02, proposal G): no star to ★6 at a one-, two- and
 * three-digit level, riding and not. Each chip ends the same distance after its last mark.
 */
function Levels() {
  return (
    <Stack gap="md">
      {[0, 1, 2, 3, 4, 5, 6].map((star) => (
        <Group key={star} gap={8} wrap="wrap" style={{ rowGap: '1rem' }} data-star-row={star}>
          {[7, 45, 120].flatMap((level) =>
            [false, true].map((enlisted) => (
              <CaptainChip
                key={`${String(level)}-${String(enlisted)}`}
                name="Heimdall"
                enlisted={enlisted}
                levelSet
                level={level}
                star={star}
                onToggle={() => {}}
                onEditLevel={() => {}}
              />
            )),
          )}
        </Group>
      ))}
    </Stack>
  );
}

const story: KitStory = {
  name: 'CaptainChip',
  group: 'domain',
  render: () => (
    <Stack gap="xl">
      <Live />
      <Levels />
    </Stack>
  ),
};

export default story;
