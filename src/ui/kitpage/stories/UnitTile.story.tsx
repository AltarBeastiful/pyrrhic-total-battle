import { UnitTile } from '../../domain';
import { SAMPLE_UNITS } from '../../domain/fixtures';
import type { UnitTileSize, UnitTileState } from '../../domain';
import type { KitStory } from '../story';

const sizes: UnitTileSize[] = ['sm', 'md', 'lg'];
const states: UnitTileState[] = ['on', 'off', 'pinned', 'leftOut'];

const story: KitStory = {
  name: 'UnitTile',
  group: 'domain',
  render: () => (
    <div className="flex flex-col gap-6">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <p className="text-muted text-sm">{size} — one per group</p>
          <div className="flex flex-wrap items-center gap-2">
            {SAMPLE_UNITS.map((unit) => (
              <UnitTile key={unit.id} unit={unit} size={size} />
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-col gap-2">
        <p className="text-muted text-sm">states (md, pressable)</p>
        <div className="flex flex-wrap items-center gap-2">
          {states.map((state) => (
            <UnitTile key={state} unit={SAMPLE_UNITS[0]!} size="md" state={state} onPress={() => {}} />
          ))}
          <UnitTile unit={SAMPLE_UNITS[0]!} size="md" isSelected onPress={() => {}} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-muted text-sm">states (lg)</p>
        <div className="flex flex-col gap-2">
          {states.map((state) => (
            <UnitTile key={state} unit={SAMPLE_UNITS[3]!} size="lg" state={state} onPress={() => {}} />
          ))}
          <UnitTile unit={SAMPLE_UNITS[4]!} size="lg" isSelected onPress={() => {}} />
        </div>
      </div>
    </div>
  ),
};

export default story;
