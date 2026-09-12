import { useState } from 'react';

import { MoonIcon, SunIcon, GearIcon } from '../../icons';
import { Segmented } from '../../kit';
import type { KitStory } from '../story';

const FORMATIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'double', label: 'Double' },
  { value: 'custom', label: 'Custom' },
];

const THEMES = [
  { value: 'light', label: 'Light', icon: <SunIcon /> },
  { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
  { value: 'system', label: 'System', icon: <GearIcon /> },
];

function LiveSegmented({
  label,
  options,
  size,
}: {
  label: string;
  options: typeof FORMATIONS;
  size?: 'sm' | 'md';
}) {
  const [value, setValue] = useState(options[0]?.value ?? '');
  return (
    <Segmented
      label={label}
      value={value}
      onChange={setValue}
      options={options}
      {...(size ? { size } : {})}
    />
  );
}

const story: KitStory = {
  name: 'Segmented',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <LiveSegmented label="Enemy formation (md)" options={FORMATIONS} />
      <LiveSegmented label="Enemy formation (sm)" options={FORMATIONS} size="sm" />
      <LiveSegmented label="Theme, with glyphs" options={THEMES} />
      <Segmented
        label="One option unavailable"
        value="standard"
        onChange={() => {}}
        options={[...FORMATIONS.slice(0, 2), { value: 'custom', label: 'Custom', isDisabled: true }]}
      />
      <Segmented label="Disabled" value="double" onChange={() => {}} options={FORMATIONS} isDisabled />
    </div>
  ),
};

export default story;
