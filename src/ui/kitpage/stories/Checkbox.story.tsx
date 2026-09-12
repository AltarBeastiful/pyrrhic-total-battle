import { useState } from 'react';

import { Checkbox } from '../../kit';
import type { KitStory } from '../story';

function LiveCheckbox({ label, start }: { label: string; start: boolean }) {
  const [isSelected, setSelected] = useState(start);
  return <Checkbox label={label} isSelected={isSelected} onChange={setSelected} />;
}

const story: KitStory = {
  name: 'Checkbox',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-2">
      <LiveCheckbox label="Off" start={false} />
      <LiveCheckbox label="On" start />
      <Checkbox label="Some of these are on" isSelected={false} onChange={() => {}} isIndeterminate />
      <Checkbox label="Disabled, off" isSelected={false} onChange={() => {}} isDisabled />
      <Checkbox label="Disabled, on" isSelected onChange={() => {}} isDisabled />
    </div>
  ),
};

export default story;
