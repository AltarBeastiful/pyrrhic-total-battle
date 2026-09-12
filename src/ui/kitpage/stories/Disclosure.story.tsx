import { Badge, Disclosure } from '../../kit';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Disclosure',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-3">
      <Disclosure title="Bonuses" summary="Health +312 %, strength +198 %, special +40 %">
        <p className="text-sm">Every bonus, one line each.</p>
      </Disclosure>

      <Disclosure title="Battle story" defaultExpanded summary="6 rounds">
        <p className="text-sm">Round one: the ladder walks tiers from the top down.</p>
      </Disclosure>

      <Disclosure
        title={
          <span className="flex items-center gap-2">
            Mercenaries <Badge tone="mercenaries">4</Badge>
          </span>
        }
        summary="ABM6 ×22, ABT6 ×24"
      >
        <p className="text-sm">A title may carry its own marks.</p>
      </Disclosure>

      <Disclosure title="Sync" isDisabled summary="Not set up on this device">
        <p className="text-sm">Never seen while disabled.</p>
      </Disclosure>
    </div>
  ),
};

export default story;
