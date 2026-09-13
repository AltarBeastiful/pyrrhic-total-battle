import { Stack } from '@mantine/core';

import { count, DeltaText } from '../../domain';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'DeltaText',
  group: 'domain',
  render: () => (
    <Stack gap="xs">
      <DeltaText value={12480} format={count} betterWhen="higher" />
      <DeltaText value={12480} previous={12000} format={count} betterWhen="higher" />
      <DeltaText value={9000} previous={12000} format={count} betterWhen="higher" />
      <DeltaText value={9000} previous={12000} format={count} betterWhen="lower" />
      <DeltaText value={12000} previous={12000} format={count} betterWhen="higher" />
    </Stack>
  ),
};

export default story;
