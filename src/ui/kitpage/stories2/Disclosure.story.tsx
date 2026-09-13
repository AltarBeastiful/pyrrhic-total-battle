import { Stack, Text } from '@mantine/core';

import { Disclosure, DisclosureGroup, Figures } from '../../kit2';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Disclosure',
  group: 'kit',
  render: () => (
    <Stack gap="md" maw={520}>
      <Disclosure title="Equipment" summary="+12 % attack" defaultOpened>
        <Figures
          items={[
            { key: 'helmet', label: 'Helmet', value: '+4 %' },
            { key: 'armour', label: 'Armour', value: '+5 %' },
            { key: 'boots', label: 'Boots', value: '+3 %' },
          ]}
        />
      </Disclosure>
      <DisclosureGroup
        defaultValue="captains"
        items={[
          {
            value: 'captains',
            title: 'Captains',
            summary: '2 of 3',
            children: <Text size="sm">Aydae and Ardan are riding with this march.</Text>,
          },
          {
            value: 'artifacts',
            title: 'Artifacts',
            summary: '4 equipped',
            children: <Text size="sm">Four artifacts, none of them legendary.</Text>,
          },
          {
            value: 'titles',
            title: 'Titles',
            summary: 'none',
            children: <Text size="sm">No title in play.</Text>,
          },
        ]}
      />
    </Stack>
  ),
};

export default story;
