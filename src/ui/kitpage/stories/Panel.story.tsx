import { Stack, Text } from '@mantine/core';

import { Panel } from '../../kit';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Panel',
  group: 'layout',
  render: () => (
    <Stack gap="lg">
      <Panel title="Troops" meta="G1–G3 · S1">
        <Text size="sm" c="dimmed">
          A setup section: the lit block every form sits in.
        </Text>
      </Panel>
      <Panel surface="pane" title="March" meta="10 stacks">
        <Text size="sm" c="dimmed">
          The March: one step brighter and one step deeper, so it reads as the object in front.
        </Text>
      </Panel>
      <Panel surface="well">
        <Text size="sm" c="dimmed" p="sm">
          A well: anything sunk into a panel.
        </Text>
      </Panel>
    </Stack>
  ),
};

export default story;
