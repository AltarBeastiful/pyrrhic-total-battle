import { useState } from 'react';

import { Banner, Button, Tabs } from '../../kit';
import { Cluster, Stack } from '../../layout';
import type { KitStory } from '../story';

function SyncTabs() {
  const [value, setValue] = useState('sync');
  return (
    <Tabs
      label="Sync"
      value={value}
      onChange={setValue}
      items={[
        {
          value: 'sync',
          label: 'Pull / Push',
          content: (
            <Stack gap={3}>
              <Banner tone="warn">Add a GitHub token in Settings first.</Banner>
              <Cluster gap={2}>
                <Button variant="primary">Check the gist</Button>
                <Button isDisabled>Apply plan</Button>
              </Cluster>
            </Stack>
          ),
        },
        { value: 'settings', label: 'Settings', content: <p>The token, the gist and the passphrase.</p> },
        { value: 'log', label: 'Last run', content: <p>Nothing has been sent yet.</p> },
      ]}
    />
  );
}

const story: KitStory = {
  name: 'Tabs',
  group: 'kit',
  render: () => <SyncTabs />,
};

export default story;
