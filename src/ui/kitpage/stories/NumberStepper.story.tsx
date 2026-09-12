import { useState } from 'react';

import { NumberStepper } from '../../kit';
import type { KitStory } from '../story';

function LiveStepper(props: {
  label: string;
  start?: number | null;
  size?: 'sm' | 'md';
  suffix?: string;
  description?: string;
  errorMessage?: string;
  allowEmpty?: boolean;
  max?: number;
}) {
  const { label, start = 12, size, suffix, description, errorMessage, allowEmpty, max } = props;
  const [value, setValue] = useState<number | null>(start);
  return (
    <NumberStepper
      label={label}
      value={value}
      onChange={setValue}
      min={0}
      {...(max === undefined ? {} : { max })}
      {...(size === undefined ? {} : { size })}
      {...(suffix === undefined ? {} : { suffix })}
      {...(description === undefined ? {} : { description })}
      {...(errorMessage === undefined ? {} : { errorMessage })}
      {...(allowEmpty === undefined ? {} : { allowEmpty })}
    />
  );
}

const story: KitStory = {
  name: 'NumberStepper',
  group: 'kit',
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <LiveStepper label="Leadership (md)" start={84300} />
      <LiveStepper label="Owned (sm)" start={22} size="sm" />
      <LiveStepper label="Health bonus" start={39} suffix="%" description="Shift steps by 10, Ctrl by 100" />
      <LiveStepper label="Empty is allowed" start={null} allowEmpty />
      <LiveStepper label="Over the limit" start={120} max={100} errorMessage="More than the pool holds" />
      <NumberStepper label="Disabled" value={7} onChange={() => {}} isDisabled />
    </div>
  ),
};

export default story;
