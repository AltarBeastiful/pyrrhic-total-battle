import { Stack, Text } from '@mantine/core';

import { LeftOutPill, StackPill } from '../../domain';
import { SAMPLE_UNITS } from '../../domain/fixtures';
import domainClasses from '../../domain/domain.module.css';
import type { KitStory } from '../story';

const COUNTS = [468, 3048, 12_846, 1_204_930, 96];

const story: KitStory = {
  name: 'StackPill',
  group: 'domain',
  render: () => (
    <Stack gap="md">
      <Text size="xs" c="dimmed">
        marching · the grid holds as many as fit at 78 px
      </Text>
      <div className={domainClasses.pillGrid}>
        {SAMPLE_UNITS.map((unit, index) => (
          <StackPill
            key={unit.id}
            unit={unit}
            count={COUNTS[index] ?? 100}
            state={index === 1 ? 'pinned' : 'on'}
            onCopy={() => {}}
            onDetails={() => {}}
          />
        ))}
      </div>

      <Text size="xs" c="dimmed">
        edit mode · the count is a field in place
      </Text>
      <div className={domainClasses.pillGrid}>
        {SAMPLE_UNITS.slice(0, 3).map((unit, index) => (
          <StackPill
            key={unit.id}
            unit={unit}
            count={COUNTS[index] ?? 100}
            editing
            onCount={() => {}}
            onDetails={() => {}}
          />
        ))}
      </div>

      <Text size="xs" c="dimmed">
        left out · a press puts the type back
      </Text>
      <div>
        {SAMPLE_UNITS.slice(0, 3).map((unit) => (
          <LeftOutPill key={unit.id} unit={unit} onPutBack={() => {}} />
        ))}
      </div>
    </Stack>
  ),
};

export default story;
