import { Box, Card, Divider, Stack, Text, Title } from '@mantine/core';

import { AppBar } from '../../shell/AppBar';
import { BottomBar } from '../../shell/BottomBar';
import type { KitStory } from '../story';

/**
 * The frame of design plan §5.1 (V1, spike 0009) in three pieces: the top app bar as the page
 * mounts it, the head of the 360 dp supporting pane, and the Material bottom app bar a phone gets.
 * Both bars are the app's own components — the story only stands them still, so the gallery shows
 * what the page shows.
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
      <Divider label="Bottom app bar, below 1200 px" labelPosition="left" />
      <BottomBar onOpenRecap={() => undefined} />
    </Stack>
  ),
};

export default story;
