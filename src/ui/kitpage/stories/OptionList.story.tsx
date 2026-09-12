import { useState } from 'react';

import { Button, OptionList } from '../../kit';
import type { OptionListItem } from '../../kit';
import type { KitStory } from '../story';

const METHODS: OptionListItem[] = [
  {
    value: 'elite',
    title: 'Tier ladder',
    description: 'Your cheapest, lowest-tier stacks take the hits first.',
  },
  {
    value: 'ms',
    title: 'Troops first',
    description: 'Hired units only fall after all of your troops.',
  },
  {
    value: 'custom',
    title: 'Your own order',
    description: 'You decide which stack falls first.',
    trailing: <Button size="sm">Edit order</Button>,
  },
];

const OBJECTIVES: OptionListItem[] = [
  { value: 'none', title: 'No priority', description: 'March with every unit type you own.' },
  {
    value: 'avgDamage',
    title: 'Highest average damage',
    description: 'The best expected damage over both openings.',
  },
  {
    value: 'minDamage',
    title: 'Best worst case',
    description: 'The most damage when the monster strikes first.',
  },
  {
    value: 'damagePerSilver',
    title: 'Damage per silver',
    description: 'The most damage for what the losses cost in silver.',
  },
];

function Live({
  label,
  options,
  collapsible = false,
  start,
}: {
  label: string;
  options: OptionListItem[];
  collapsible?: boolean;
  start?: string;
}) {
  const [value, setValue] = useState(start ?? options[0]?.value ?? '');
  return (
    <OptionList label={label} value={value} onChange={setValue} options={options} collapsible={collapsible} />
  );
}

const story: KitStory = {
  name: 'OptionList',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <Live label="Stacking method" options={METHODS} start="custom" />
      <Live label="Objective" options={OBJECTIVES} />
      <Live label="Objective, folded (phones)" options={OBJECTIVES} collapsible start="minDamage" />
      <OptionList
        label="One option unavailable"
        value="elite"
        onChange={() => {}}
        options={[...METHODS.slice(0, 2), { ...METHODS[2]!, isDisabled: true }]}
      />
      <OptionList label="Disabled" value="ms" onChange={() => {}} options={METHODS.slice(0, 2)} isDisabled />
    </div>
  ),
};

export default story;
