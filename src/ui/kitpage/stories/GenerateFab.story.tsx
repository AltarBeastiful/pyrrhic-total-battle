import { Box, Group, Stack, Text } from '@mantine/core';

import { GenerateFab } from '../../kit';
import type { KitStory } from '../story';

/**
 * The real button is fixed to the corner of the viewport, which a story cannot show four times at
 * once; each state is drawn inside its own relatively-positioned box instead.
 */
function Framed({ children, caption }: { children: React.ReactNode; caption: string }) {
  return (
    <Stack gap={4}>
      {/* `Affix` is `position: fixed`, so a frame only contains it if the frame is a containing
          block: `transform` makes one. Without it the four states pile up in the viewport's corner
          and push the page sideways on a phone. */}
      <Box pos="relative" h={110} w={210} style={{ overflow: 'hidden', transform: 'translateZ(0)' }}>
        {children}
      </Box>
      <Text size="xs" c="dimmed">
        {caption}
      </Text>
    </Stack>
  );
}

const story: KitStory = {
  name: 'GenerateFab',
  group: 'shell',
  render: () => (
    <Group gap="lg" wrap="wrap">
      <Framed caption="ready">
        <GenerateFab label="Generate" state="ready" hiddenFrom="xl" onGenerate={() => {}} />
      </Framed>
      <Framed caption="stale">
        <GenerateFab
          label="Update"
          state="stale"
          hint="The setup moved."
          hiddenFrom="xl"
          onGenerate={() => {}}
        />
      </Framed>
      <Framed caption="running">
        <GenerateFab label="Generate" state="running" hiddenFrom="xl" onGenerate={() => {}} />
      </Framed>
      <Framed caption="blocked">
        <GenerateFab
          label="Generate"
          state="blocked"
          hint="Choose at least one unit."
          hiddenFrom="xl"
          onGenerate={() => {}}
        />
      </Framed>
    </Group>
  ),
};

export default story;
