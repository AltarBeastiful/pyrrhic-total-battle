import { Box, Card, Divider, Stack, Text, Title } from '@mantine/core';

import { AppBar } from '../../shell/AppBar';
import { BottomBar } from '../../shell/BottomBar';
import { CommandBar } from '../../shell/CommandBar';
import classes from '../../shell/shell.module.css';
import type { KitStory } from '../story';

/**
 * The frame of design plan §5.1 and §5.6 in four pieces: the top app bar as the page mounts it, the
 * head of the 360 dp supporting pane, the desktop command bar, and the phone's two-row one. Every
 * bar is the app's own component — the story only stands them still, so the gallery shows what the
 * page shows.
 */
function PaneHead() {
  return (
    <Box w={360} maw="100%">
      <Card withBorder radius="md" padding="md" bg="var(--mantine-color-default)">
        <Stack gap="md">
          <Title order={2} size="h5">
            March
          </Title>
          <Text size="sm" c="dimmed">
            The recap figures and Generate, from the March section (M-08). The pane sticks under the app bar
            and scrolls inside itself only when it is taller than the window.
          </Text>
        </Stack>
      </Card>
    </Box>
  );
}

const story: KitStory = {
  name: 'Shell',
  group: 'shell',
  render: () => (
    <Stack gap="lg">
      <AppBar />
      <Divider label="Supporting pane, from 1200 px" labelPosition="left" />
      <PaneHead />
      <Divider label="Command bar, from 1024 px" labelPosition="left" />
      {/* In the page the ground is the dock's, full bleed under the bar's own content; the story
          puts the bar back inside it so the gallery shows the material and not bare fields. */}
      <div className={classes.commandDock}>
        <CommandBar />
      </div>
      <Divider label="Command bar, below 1024 px" labelPosition="left" />
      <BottomBar onOpenRecap={() => undefined} />
    </Stack>
  ),
};

export default story;
