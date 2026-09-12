import { useState } from 'react';

import { Switch } from '../../kit';
import type { KitStory } from '../story';

function LiveSwitch({ label, description, start }: { label: string; description?: string; start: boolean }) {
  const [isSelected, setSelected] = useState(start);
  return (
    <Switch
      label={label}
      {...(description === undefined ? {} : { description })}
      isSelected={isSelected}
      onChange={setSelected}
    />
  );
}

const story: KitStory = {
  name: 'Switch',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <LiveSwitch label="Off" start={false} />
      <LiveSwitch label="On" start />
      <LiveSwitch label="Ignore housing limits" description="Stacks as if every pool were unlimited" start />
      <Switch label="Disabled, off" isSelected={false} onChange={() => {}} isDisabled />
      <Switch
        label="Disabled, on"
        description="Turned on somewhere else"
        isSelected
        onChange={() => {}}
        isDisabled
      />
    </div>
  ),
};

export default story;
