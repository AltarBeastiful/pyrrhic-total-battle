import { useState } from 'react';

import { ToggleGroup, ToggleItem } from '../../kit';
import type { KitStory } from '../story';

const ROLES = [
  { id: 'melee', label: 'Melee' },
  { id: 'ranged', label: 'Ranged' },
  { id: 'mounted', label: 'Mounted' },
  { id: 'flying', label: 'Flying' },
];

function Multiple({ size }: { size?: 'sm' | 'md' }) {
  const [value, setValue] = useState<string[]>(['melee', 'flying']);
  return (
    <ToggleGroup
      label={`Roles (multiple, ${size ?? 'md'})`}
      selectionMode="multiple"
      value={value}
      onChange={setValue}
      {...(size ? { size } : {})}
    >
      {ROLES.map((role) => (
        <ToggleItem key={role.id} id={role.id} label={role.label}>
          {role.label}
        </ToggleItem>
      ))}
    </ToggleGroup>
  );
}

function Single({ orientation }: { orientation?: 'horizontal' | 'vertical' }) {
  const [value, setValue] = useState<string | null>('damage');
  return (
    <ToggleGroup
      label={`Objective (single, ${orientation ?? 'horizontal'})`}
      selectionMode="single"
      value={value}
      onChange={setValue}
      {...(orientation ? { orientation } : {})}
    >
      <ToggleItem id="damage" label="Most damage">
        Most damage
      </ToggleItem>
      <ToggleItem id="survival" label="Best survival">
        Best survival
      </ToggleItem>
      <ToggleItem id="cheap" label="Cheapest">
        Cheapest
      </ToggleItem>
    </ToggleGroup>
  );
}

const story: KitStory = {
  name: 'ToggleGroup',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <Multiple />
      <Multiple size="sm" />
      <Single />
      <Single orientation="vertical" />
      <ToggleGroup label="Disabled" selectionMode="single" value="damage" onChange={() => {}} isDisabled>
        <ToggleItem id="damage" label="Most damage">
          Most damage
        </ToggleItem>
        <ToggleItem id="survival" label="Best survival">
          Best survival
        </ToggleItem>
      </ToggleGroup>
      <ToggleGroup
        label="One item unavailable"
        selectionMode="multiple"
        value={['melee']}
        onChange={() => {}}
      >
        <ToggleItem id="melee" label="Melee">
          Melee
        </ToggleItem>
        <ToggleItem id="ranged" label="Ranged" isDisabled>
          Ranged
        </ToggleItem>
      </ToggleGroup>
    </div>
  ),
};

export default story;
