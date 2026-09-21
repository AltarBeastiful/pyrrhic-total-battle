import { Group, Stack, Text } from '@mantine/core';

import { Figures, Panel, Sections } from '../../kit';
import { Glyph } from '../../domain';
import type { KitStory } from '../story';

/**
 * The separation language, drawn once so it can be looked at (docs/design.md §4): a card, its 20 px
 * of padding, a head of title and meta, and three parts told apart by one hairline with 16 px above
 * and below. Nothing else on this page is allowed to separate anything any other way.
 */
const story: KitStory = {
  name: 'Sections',
  group: 'kit',
  render: () => (
    <Panel title="A card" meta="three parts" style={{ maxWidth: 420 }}>
      <Sections>
        <Stack gap="xs">
          <Text size="sm">
            The first part carries no rule and no space above it: the card’s own padding closes it.
          </Text>
        </Stack>
        <Figures
          label="Figures in a part"
          layout="grid"
          items={[
            { key: 'min', label: 'Damage', value: '4 519 202', glyph: <Glyph kind="minimumDamage" /> },
            { key: 'silver', label: 'Silver to recover', value: '8 131 400', glyph: <Glyph kind="silver" /> },
            { key: 'gold', label: 'Gold to recover', value: '0', glyph: <Glyph kind="gold" /> },
            { key: 'ratio', label: 'Damage per silver', value: '0.57' },
          ]}
        />
        <Group gap="sm">
          <Text size="sm" c="dimmed">
            …and the last carries no space below it.
          </Text>
        </Group>
      </Sections>
    </Panel>
  ),
};

export default story;
