import { Button, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { NumberField, Sheet } from '../../kit';
import type { KitStory } from '../story';

function Live() {
  const [opened, setOpened] = useState(false);
  return (
    <>
      <Button
        onClick={() => {
          setOpened(true);
        }}
      >
        Edit the unit
      </Button>
      <Sheet
        opened={opened}
        onClose={() => {
          setOpened(false);
        }}
        title="Archer III"
        description="Guardsmen · tier 3 · leadership 3"
        footer={
          <Group justify="flex-end">
            <Button
              variant="default"
              onClick={() => {
                setOpened(false);
              }}
            >
              Leave out
            </Button>
            <Button
              onClick={() => {
                setOpened(false);
              }}
            >
              Edit count
            </Button>
          </Group>
        }
      >
        <Stack gap="sm">
          <NumberField label="Count" value={1500} onChange={() => {}} />
          <Text size="sm" c="dimmed">
            The sheet is anchored at the bottom on a phone and on the right from 768 px up.
          </Text>
        </Stack>
      </Sheet>
    </>
  );
}

const story: KitStory = { name: 'Sheet', group: 'kit', render: () => <Live /> };

export default story;
