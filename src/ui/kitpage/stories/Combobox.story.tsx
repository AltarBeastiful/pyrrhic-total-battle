import { useState } from 'react';

import { Combobox } from '../../kit';
import type { ComboboxSection } from '../../kit';
import type { KitStory } from '../story';

const SECTIONS: ComboboxSection[] = [
  {
    id: 'tier-7',
    title: 'Tier VII',
    tone: 'text-tier-7',
    items: [
      { id: 'arbalester-7', label: 'Arbalester VII, tier 7' },
      { id: 'bone-golem-7', label: 'Bone Golem VII, tier 7' },
    ],
  },
  {
    id: 'tier-6',
    title: 'Tier VI',
    tone: 'text-tier-6',
    items: [
      { id: 'abomination-6', label: 'Abomination VI, tier 6' },
      { id: 'archdemon-6', label: 'Archdemon VI, tier 6' },
    ],
  },
  {
    id: 'tier-5',
    title: 'Tier V',
    tone: 'text-tier-5',
    items: [{ id: 'bear-5', label: 'Bear V, tier 5' }],
  },
];

/** The shape the Mercenaries card uses: pick a row, the field empties, the list stays open. */
function Hiring() {
  const [hired, setHired] = useState<string[]>([]);

  return (
    <div className="flex flex-col gap-2">
      <Combobox
        label="Add a mercenary"
        placeholder="Name or code"
        description="Type a name, or open the list: mercenaries are grouped by tier, strongest first."
        sections={SECTIONS.map((section) => ({
          ...section,
          items: section.items.filter((item) => !hired.includes(item.id)),
        })).filter((section) => section.items.length > 0)}
        onSelect={(id) => {
          setHired((current) => [...current, id]);
        }}
        emptyState="No mercenary of that name."
      />
      <p className="text-muted text-sm">Hired: {hired.length === 0 ? 'nobody yet' : hired.join(', ')}</p>
    </div>
  );
}

/** Rows that draw more than their label, through each item's `render`. */
const DRAWN: ComboboxSection[] = SECTIONS.map((section) => ({
  ...section,
  items: section.items.map((item) => ({
    ...item,
    render: () => (
      <>
        <span className="min-w-0 flex-1 truncate">{item.label.split(',')[0]}</span>
        <span className={`text-xs ${section.tone ?? ''}`}>{section.title}</span>
      </>
    ),
  })),
}));

const story: KitStory = {
  name: 'Combobox',
  group: 'kit',
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <Hiring />
      <Combobox
        label="With drawn rows"
        placeholder="Name or code"
        sections={DRAWN}
        onSelect={() => {}}
        emptyState="No mercenary of that name."
      />
      <Combobox
        label="Nothing left to pick"
        placeholder="Name or code"
        sections={[]}
        onSelect={() => {}}
        emptyState="You already own every mercenary the tables carry."
      />
      <Combobox
        label="Disabled"
        placeholder="Name or code"
        sections={SECTIONS}
        onSelect={() => {}}
        isDisabled
      />
    </div>
  ),
};

export default story;
