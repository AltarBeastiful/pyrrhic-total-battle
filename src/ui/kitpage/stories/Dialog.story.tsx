import { Button, Group } from '@mantine/core';
import { useState } from 'react';

import { Dialog } from '../../kit';
import type { KitStory } from '../story';

function Live({ role }: { role: 'dialog' | 'alertdialog' }) {
  const [opened, setOpened] = useState(false);
  const close = () => {
    setOpened(false);
  };
  return (
    <>
      <Button
        variant={role === 'alertdialog' ? 'outline' : 'default'}
        color={role === 'alertdialog' ? 'red' : 'brass'}
        onClick={() => {
          setOpened(true);
        }}
      >
        {role === 'alertdialog' ? 'Reset everything' : 'Load shared setup'}
      </Button>
      <Dialog
        opened={opened}
        onClose={close}
        role={role}
        title={role === 'alertdialog' ? 'Reset the setup?' : 'Load this shared setup?'}
        description={
          role === 'alertdialog'
            ? 'Every tier, mercenary and bonus goes back to its default. This cannot be undone.'
            : 'It replaces what is on screen; your own setup stays saved under its own name.'
        }
        footer={
          <Group justify="flex-end">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button color={role === 'alertdialog' ? 'red' : 'brass'} onClick={close}>
              {role === 'alertdialog' ? 'Reset' : 'Load it'}
            </Button>
          </Group>
        }
      />
    </>
  );
}

const story: KitStory = {
  name: 'Dialog',
  group: 'kit',
  render: () => (
    <Group gap="sm">
      <Live role="dialog" />
      <Live role="alertdialog" />
    </Group>
  ),
};

export default story;
