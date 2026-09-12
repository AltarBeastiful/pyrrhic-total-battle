import { useState } from 'react';

import { TierStepper } from '../../kit';
import type { KitStory } from '../story';

const TIERS = [1, 2, 3, 4, 5, 6];

/** The Troops row: two ends of one range, each clamped by the other (design plan §7.1). */
function Range({ prefix, name, allowNone = false }: { prefix: string; name: string; allowNone?: boolean }) {
  const [from, setFrom] = useState<number | null>(allowNone ? null : 1);
  const [to, setTo] = useState<number | null>(4);
  return (
    <div className="flex flex-wrap items-end gap-3">
      <TierStepper
        label={`${name} from`}
        prefix={prefix}
        tiers={TIERS}
        value={from}
        onChange={setFrom}
        allowNone={allowNone}
        {...(to === null ? {} : { max: to })}
      />
      <TierStepper
        label={`${name} to`}
        prefix={prefix}
        tiers={TIERS}
        value={to}
        onChange={setTo}
        {...(from === null ? {} : { min: from })}
      />
    </div>
  );
}

function Small() {
  const [value, setValue] = useState<number | null>(3);
  return <TierStepper label="Small" prefix="S" tiers={TIERS} value={value} onChange={setValue} size="sm" />;
}

const story: KitStory = {
  name: 'TierStepper',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <Range prefix="G" name="Guardsmen" />
      <Range prefix="M" name="Monsters" allowNone />
      <Small />
      <TierStepper label="Disabled" prefix="E" tiers={TIERS} value={2} onChange={() => {}} isDisabled />
    </div>
  ),
};

export default story;
