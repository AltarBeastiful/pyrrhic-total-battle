import { ActionIcon, Button, Group, Text, Title } from '@mantine/core';
import { Menu as MenuIcon } from 'lucide-react';

import { AppBar } from '../../kit2';
import { Glyph } from '../../domain2';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'AppBar',
  group: 'shell',
  render: () => (
    <AppBar
      brand={
        <Group gap={6} wrap="nowrap">
          <Glyph kind="army" label="Pyrrhic" />
          <Title order={1} size="h5">
            Pyrrhic
          </Title>
        </Group>
      }
      actions={
        <>
          <Button visibleFrom="sm">Generate</Button>
          <ActionIcon size="lg" variant="default" aria-label="Account">
            <MenuIcon size={16} aria-hidden />
          </ActionIcon>
        </>
      }
    >
      <Text size="sm" c="dimmed" visibleFrom="md">
        15 143 235 average damage · 5 stacks
      </Text>
    </AppBar>
  ),
};

export default story;
