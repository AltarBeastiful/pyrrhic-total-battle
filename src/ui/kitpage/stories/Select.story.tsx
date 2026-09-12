import { useState } from 'react';

import { EngineersIcon, GuardsmenIcon, MonstersIcon } from '../../icons';
import { Select } from '../../kit';
import type { SelectOption } from '../../kit';
import type { KitStory } from '../story';

const METHODS: SelectOption[] = [
  { value: 'ladder', label: 'Tier ladder', description: 'The highest tiers go in first' },
  { value: 'troops', label: 'Troops first', description: 'Fill the leadership pool before the rest' },
  { value: 'own', label: 'Your own order', description: 'The order you set by hand' },
];

const GROUPS: SelectOption[] = [
  { value: 'guardsmen', label: 'Guardsmen', icon: <GuardsmenIcon /> },
  { value: 'engineers', label: 'Engineers', icon: <EngineersIcon /> },
  { value: 'monsters', label: 'Monsters', icon: <MonstersIcon /> },
  { value: 'mercenaries', label: 'Mercenaries', isDisabled: true },
];

function LiveSelect(props: {
  label: string;
  options: SelectOption[];
  start?: string | null;
  size?: 'sm' | 'md';
  description?: string;
}) {
  const { label, options, start = null, size, description } = props;
  const [value, setValue] = useState<string | null>(start);
  return (
    <Select
      label={label}
      value={value}
      onChange={setValue}
      options={options}
      placeholder="Choose one"
      {...(size === undefined ? {} : { size })}
      {...(description === undefined ? {} : { description })}
    />
  );
}

const story: KitStory = {
  name: 'Select',
  group: 'kit',
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <LiveSelect label="Method (md)" options={METHODS} start="ladder" />
      <LiveSelect label="Method (sm)" options={METHODS} start="troops" size="sm" />
      <LiveSelect label="Nothing chosen yet" options={METHODS} />
      <LiveSelect
        label="Group, with glyphs"
        options={GROUPS}
        start="guardsmen"
        description="One option is off"
      />
      <Select
        label="Disabled"
        value="ladder"
        onChange={() => {}}
        options={METHODS}
        placeholder="Choose one"
        isDisabled
      />
    </div>
  ),
};

export default story;
