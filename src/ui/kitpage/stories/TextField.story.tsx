import { useState } from 'react';

import { TextField } from '../../kit';
import type { KitStory } from '../story';

function LiveText(props: {
  label: string;
  start: string;
  description?: string;
  errorMessage?: string;
  inputMode?: 'text' | 'numeric';
}) {
  const { label, start, description, errorMessage, inputMode } = props;
  const [value, setValue] = useState(start);
  return (
    <TextField
      label={label}
      value={value}
      onChange={setValue}
      placeholder="Type here"
      {...(description === undefined ? {} : { description })}
      {...(errorMessage === undefined ? {} : { errorMessage })}
      {...(inputMode === undefined ? {} : { inputMode })}
    />
  );
}

const story: KitStory = {
  name: 'TextField',
  group: 'kit',
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <LiveText label="Profile name" start="Main army" />
      <LiveText label="Empty" start="" description="Shown in the account menu" />
      <LiveText label="Share code" start="PYR-8842" inputMode="numeric" />
      <LiveText label="Taken" start="Main army" errorMessage="A profile already has that name" />
      <TextField label="Disabled" value="Locked" onChange={() => {}} isDisabled />
      <TextField label="Password" value="secret" onChange={() => {}} type="password" />
    </div>
  ),
};

export default story;
