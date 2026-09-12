import type { ReactNode } from 'react';

import type { BattleSummary, Pool } from '@/engine/types';
import { PoolBadge } from '@/ui/icons';
import { Card } from '@/ui/primitives';

import { amount, delta, deltaRatio, duration, ratio } from './format';

/** What each pool pays for — the words the summary uses for the damage split. */
const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Troops',
  authority: 'Mercenaries',
  dominance: 'Monsters',
};

const POOLS = Object.keys(POOL_LABELS) as Pool[];

interface MetricProps {
  label: string;
  value: string;
  /** Difference against the generated result, shown only while counts are edited by hand. */
  change?: string | undefined;
  caption?: string;
  badge?: ReactNode;
}

/** A headline figure: a small caption, a big tabular number. */
function Metric({ label, value, change, caption, badge }: MetricProps) {
  return (
    <Card tone="raised" padded={false} className="px-3 py-2">
      <p className="text-muted flex items-center gap-1.5 text-xs font-medium">
        {badge}
        {label}
      </p>
      <p className="nums mt-0.5 text-lg leading-tight font-semibold sm:text-xl">{value}</p>
      {change !== undefined && change !== '0' && (
        <p className="text-accent nums text-xs">{change} vs generated</p>
      )}
      {caption !== undefined && <p className="text-muted text-xs">{caption}</p>}
    </Card>
  );
}

/** A figure inside a grouped card (recovery, damage by pool): no box of its own. */
function Figure({ label, value, change, badge }: MetricProps) {
  return (
    <div>
      <p className="text-muted flex items-center gap-1.5 text-xs font-medium">
        {badge}
        {label}
      </p>
      <p className="nums text-sm font-semibold">{value}</p>
      {change !== undefined && change !== '0' && (
        <p className="text-accent nums text-xs">{change} vs generated</p>
      )}
    </div>
  );
}

export interface SummaryCardsProps {
  summary: BattleSummary;
  /** The generated summary when the counts have been edited by hand; the cards then show the deltas. */
  baseline?: BattleSummary | undefined;
}

/** Battle summary (S-34): what the march does, and what getting it back costs. */
export function SummaryCards({ summary, baseline }: SummaryCardsProps) {
  const diff = (pick: (value: BattleSummary) => number): string | undefined =>
    baseline === undefined ? undefined : delta(pick(summary) - pick(baseline));
  const diffRatio = (pick: (value: BattleSummary) => number): string | undefined =>
    baseline === undefined ? undefined : deltaRatio(pick(summary) - pick(baseline));
  const stackChange = diff((value) => value.stackCount);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 className="text-sm font-semibold">Battle summary</h3>
        <p className="text-muted nums text-xs">
          {amount(summary.stackCount)} stacks
          {stackChange !== undefined && stackChange !== '0' && (
            <span className="text-accent"> ({stackChange} vs generated)</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Metric
          label="Damage if the monster strikes first"
          value={amount(summary.minDamage)}
          change={diff((value) => value.minDamage)}
          caption="The worst case: it hits before you do."
        />
        <Metric
          label="Damage if you strike first"
          value={amount(summary.maxDamage)}
          change={diff((value) => value.maxDamage)}
          caption="The best case: you open the fight."
        />
        <Metric
          label="Expected damage"
          value={amount(summary.avgDamage)}
          change={diff((value) => value.avgDamage)}
          caption="Who strikes first is a coin flip."
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Metric
          label="Value per silver"
          value={ratio(summary.damagePerSilver)}
          change={diffRatio((value) => value.damagePerSilver)}
        />
        <Metric
          label="Value per gold"
          value={ratio(summary.damagePerGold)}
          change={diffRatio((value) => value.damagePerGold)}
        />
        <Metric
          label="Value per dragon coin"
          value={ratio(summary.damagePerDragonCoin)}
          change={diffRatio((value) => value.damagePerDragonCoin)}
        />
      </div>

      <Card tone="raised" padded={false} className="p-3">
        <h4 className="mb-2 text-sm font-semibold">Recovery</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Figure
            label="Silver"
            value={amount(summary.recovery.silver)}
            change={diff((value) => value.recovery.silver)}
          />
          <Figure
            label="Gold"
            value={amount(summary.recovery.gold)}
            change={diff((value) => value.recovery.gold)}
          />
          <Figure
            label="Dragon coins"
            value={amount(summary.recovery.dragonCoins)}
            change={diff((value) => value.recovery.dragonCoins)}
          />
          <Figure label="Time" value={duration(summary.recovery.seconds)} />
        </div>
      </Card>

      <Card tone="raised" padded={false} className="p-3">
        <h4 className="mb-2 text-sm font-semibold">Damage by pool</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {POOLS.map((pool) => (
            <Figure
              key={pool}
              label={POOL_LABELS[pool]}
              badge={<PoolBadge pool={pool} size="sm" />}
              value={amount(summary.damageByPool[pool])}
              change={diff((value) => value.damageByPool[pool])}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
