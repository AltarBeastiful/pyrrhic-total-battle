import { ActionIcon } from '@mantine/core';
import { Menu as MenuIcon } from 'lucide-react';
import { useState } from 'react';

import { AppMenu } from '../../kit';
import type { KitStory } from '../story';

function Live() {
  const [theme, setTheme] = useState('system');
  return (
    <AppMenu
      label="Account"
      trigger={
        <ActionIcon size="lg" variant="default" aria-label="Account">
          <MenuIcon size={16} aria-hidden />
        </ActionIcon>
      }
      sections={[
        {
          id: 'profile',
          title: 'Profile — “Epic bears”',
          entries: [
            { id: 'share', label: 'Share this setup', onSelect: () => {} },
            { id: 'duplicate', label: 'Duplicate', onSelect: () => {} },
            { id: 'sync', label: 'Sync', description: 'Last synced 4 minutes ago', onSelect: () => {} },
          ],
        },
        {
          id: 'look',
          entries: [
            {
              kind: 'segment',
              id: 'theme',
              label: 'Theme',
              value: theme,
              onChange: setTheme,
              options: [
                { value: 'system', label: 'System' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ],
            },
          ],
        },
        {
          id: 'danger',
          entries: [{ id: 'reset', label: 'Reset everything', danger: true, onSelect: () => {} }],
        },
      ]}
    />
  );
}

const story: KitStory = { name: 'AppMenu', group: 'kit', render: () => <Live /> };

export default story;
