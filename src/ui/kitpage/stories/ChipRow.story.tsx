import { Stack } from '@mantine/core';
import { useState } from 'react';

import { ChipRow } from '../../kit';
import { Glyph } from '../../domain';
import type { KitStory } from '../story';

const CATEGORIES = [
  { value: 'melee', label: 'Melee', glyph: <Glyph kind="melee" /> },
  { value: 'ranged', label: 'Ranged', glyph: <Glyph kind="ranged" /> },
  { value: 'mounted', label: 'Mounted', glyph: <Glyph kind="mounted" /> },
  { value: 'flying', label: 'Flying', glyph: <Glyph kind="flying" /> },
];

const TITLES = [
  { value: 'warlord', label: 'Warlord', sublabel: 'HP +25 %' },
  { value: 'marshal', label: 'Marshal', sublabel: 'Attack +18 %' },
  { value: 'strategist', label: 'Strategist', sublabel: 'Defence +12 %' },
];

function Live() {
  const [categories, setCategories] = useState<string[]>(['melee', 'ranged']);
  const [titles, setTitles] = useState<string[]>([]);
  return (
    <Stack gap="md">
      <ChipRow label="Include at G4" items={CATEGORIES} value={categories} onChange={setCategories} />
      <ChipRow
        label="Titles"
        items={TITLES}
        value={titles}
        onChange={setTitles}
        max={2}
        refusal="Two titles at most. Remove one before adding another."
      />
    </Stack>
  );
}

const story: KitStory = { name: 'ChipRow', group: 'kit', render: () => <Live /> };

export default story;
