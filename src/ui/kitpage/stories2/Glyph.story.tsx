import { SimpleGrid, Stack, Text } from '@mantine/core';

import { GLYPHS, Glyph, type GlyphKind } from '../../domain2';
import type { KitStory } from '../story';

const KINDS = Object.keys(GLYPHS) as GlyphKind[];

const story: KitStory = {
  name: 'Glyph',
  group: 'domain',
  render: () => (
    <SimpleGrid cols={{ base: 3, sm: 6 }} spacing="sm">
      {KINDS.map((kind) => (
        <Stack key={kind} gap={2} align="center">
          <Text span fz={24} lh={1}>
            <Glyph kind={kind} />
          </Text>
          <Text size="xs" c="dimmed" ta="center">
            {kind}
          </Text>
        </Stack>
      ))}
    </SimpleGrid>
  ),
};

export default story;
