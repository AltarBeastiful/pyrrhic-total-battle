import { Stack, Text } from '@mantine/core';

import { newRoot } from '@/state/defaults';
import { EquipmentSets, SlotCounter } from '../../sections/bonuses/EquipmentSets';
import type { KitStory } from '../story';

/** Two captains, each in a set of mixed qualities, and two loose pieces: the case the layout was drawn on. */
function example() {
  const root = newRoot('desktop');
  const profile = structuredClone(root.profiles[0]!);
  const setup = structuredClone(profile.setups[0]!);
  const pieces = [
    ['a1', 'emerald-guardian', 'godlike', 's1'],
    ['a2', 'war-master', 'legendary', 's1'],
    ['a3', 'steppe-enslaver', 'epic', 's1'],
    ['b1', 'guardian-of-justice', 'rare', 's2'],
    ['b2', 'sagittariuss-fury', 'epic', 's2'],
    ['b3', 'skillful-engineer', 'uncommon', 's2'],
    ['l1', 'path-of-the-skybreaker', 'common', undefined],
    ['l2', 'immortal-warrior', 'uncommon', undefined],
  ] as const;
  profile.sources.equipment = pieces.map(([id, equipmentId, quality, setId]) => ({
    id,
    equipmentId,
    quality,
    ...(setId === undefined ? {} : { setId }),
  }));
  profile.sources.equipmentSetNames = { s1: 'Alexander', s2: 'Caesar' };
  setup.active.equipment = ['a1', 'a2', 'a3', 'b1', 'b2'];
  return { profile, setup };
}

const story: KitStory = {
  name: 'EquipmentSets',
  group: 'domain',
  render: () => {
    const { profile, setup } = example();
    return (
      <Stack gap="xs">
        <Text size="xs" c="dimmed">
          Read-only: the whole row is disabled, so this page never writes to an account.
        </Text>
        <SlotCounter worn={setup.active.equipment.length} captains={2} />
        <fieldset disabled style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
          <EquipmentSets
            profile={profile}
            setup={setup}
            onEdit={() => undefined}
            onAdd={() => undefined}
            addDisabled={false}
          />
        </fieldset>
      </Stack>
    );
  },
};

export default story;
