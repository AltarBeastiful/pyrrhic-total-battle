import { useState } from 'react';

import { NumberStepper, SelectableItem, SelectableList, Switch } from '../../kit';
import type { KitStory } from '../story';

const OWNED = [
  { id: 'abomination-6', name: 'Abomination VI', facts: 'Tier 6, monster, beast' },
  { id: 'arbalester-6', name: 'Arbalester VI', facts: 'Tier 6, guardsmen, ranged' },
];

const PICKER = [
  { id: 'bear-5', name: 'Bear V', facts: 'Tier 5, monster, beast' },
  { id: 'bone-golem-6', name: 'Bone Golem VI', facts: 'Tier 6, monster' },
  { id: 'archdemon-6', name: 'Archdemon VI', facts: 'Tier 6, monster, giant' },
];

function Row({ name, facts }: { name: string; facts: string }) {
  return (
    <span className="min-w-0">
      <span className="block truncate">{name}</span>
      <span className="text-muted block truncate text-sm">{facts}</span>
    </span>
  );
}

/** The shape the Mercenaries card uses: ticked rows, each with a stepper that never ticks its row. */
function Owned() {
  const [selected, setSelected] = useState<string[]>(OWNED.map((row) => row.id));
  const [caps, setCaps] = useState<Record<string, number | null>>({ 'abomination-6': 22 });

  return (
    <SelectableList label="Mercenaries you own" selectedKeys={selected} onSelectionChange={setSelected}>
      {OWNED.map((row) => (
        <SelectableItem
          key={row.id}
          id={row.id}
          label={`${row.name}, tier 6`}
          actions={
            <>
              <NumberStepper
                label="Owned"
                size="sm"
                min={0}
                allowEmpty
                value={caps[row.id] ?? null}
                onChange={(value) => {
                  setCaps((current) => ({ ...current, [row.id]: value }));
                }}
              />
              <Switch
                label="Unlimited"
                isSelected={(caps[row.id] ?? null) === null}
                onChange={(on) => {
                  setCaps((current) => ({ ...current, [row.id]: on ? null : 0 }));
                }}
              />
            </>
          }
        >
          <Row name={row.name} facts={row.facts} />
        </SelectableItem>
      ))}
    </SelectableList>
  );
}

/** The picker below it: compact rows, its own scrollbar, nothing ticked yet. */
function Picker() {
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <SelectableList
      label="Add a mercenary"
      density="compact"
      scrolls
      selectedKeys={selected}
      onSelectionChange={setSelected}
    >
      {PICKER.map((row) => (
        <SelectableItem key={row.id} id={row.id} label={`${row.name}, tier 5`}>
          <Row name={row.name} facts={row.facts} />
        </SelectableItem>
      ))}
    </SelectableList>
  );
}

const story: KitStory = {
  name: 'SelectableList',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <Owned />
      <Picker />
      <SelectableList
        label="Nothing matches"
        selectedKeys={[]}
        onSelectionChange={() => {}}
        emptyState="Nothing matches those filters."
      >
        {[]}
      </SelectableList>
      <SelectableList label="Unavailable" selectedKeys={['bear-5']} onSelectionChange={() => {}} isDisabled>
        <SelectableItem id="bear-5" label="Bear V, tier 5">
          <Row name="Bear V" facts="Tier 5, monster, beast" />
        </SelectableItem>
      </SelectableList>
    </div>
  ),
};

export default story;
