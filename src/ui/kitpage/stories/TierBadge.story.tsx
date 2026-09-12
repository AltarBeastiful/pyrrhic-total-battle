import { TierBadge } from '../../domain';
import type { KitStory } from '../story';

const TIERS = [5, 6, 7, 8, 9];

const story: KitStory = {
  name: 'TierBadge',
  group: 'domain',
  render: () => (
    <div className="flex flex-col gap-4">
      {/* On the setup sheet. */}
      <div className="bg-surface flex flex-wrap items-center gap-3 p-3">
        {TIERS.map((tier) => (
          <TierBadge key={tier} tier={tier} />
        ))}
        <TierBadge tier={3} />
      </div>
      {/* On the picker's own ground, where the same badge has to stay readable. */}
      <div className="bg-raised flex flex-wrap items-center gap-3 p-3">
        {TIERS.map((tier) => (
          <TierBadge key={tier} tier={tier} />
        ))}
        <TierBadge tier={3} />
      </div>
      {/* Beside a name, the way a row carries it. */}
      <div className="flex flex-wrap items-center gap-2">
        <span>Abomination VI</span>
        <TierBadge tier={6} />
        <span className="text-muted text-sm">×22</span>
      </div>
    </div>
  ),
};

export default story;
