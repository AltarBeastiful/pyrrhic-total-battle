import { useState } from 'react';

import { SearchField } from '../../kit';
import type { KitStory } from '../story';

function LiveSearch({ label, start }: { label: string; start: string }) {
  const [value, setValue] = useState(start);
  return <SearchField label={label} value={value} onChange={setValue} placeholder="Name or code" />;
}

const story: KitStory = {
  name: 'SearchField',
  group: 'kit',
  render: () => (
    <div className="grid gap-4 sm:grid-cols-2">
      <LiveSearch label="Find a mercenary" start="" />
      <LiveSearch label="Something typed" start="berserker" />
      <SearchField label="Disabled" value="" onChange={() => {}} placeholder="Name or code" isDisabled />
    </div>
  ),
};

export default story;
