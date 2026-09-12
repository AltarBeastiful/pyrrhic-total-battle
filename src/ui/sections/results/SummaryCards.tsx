import type { BattleSummary, Pool } from '@/engine/types';
import { Card } from '@/ui/primitives';

import { amount, delta, deltaRatio, duration, ratio } from './format';

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Troops',
  authority: 'Mercenaries',
  dominance: 'Monsters',
};

interface MetricProps {
  label: string;
  value: string;
  /** Difference against the generated result, shown only while counts are edited by hand. */
  change?: string | undefined;
  hint?: string;
}

function Metric({ label, value, change, hint }: MetricProps) {
  return (
    <div className="border-line bg-raised rounded-lg border px-3 py-2">
      <p className="text-muted text-xs font-medium">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      {change !== undefined && change !== '0' && (
        <p className="text-accent text-xs tabular-nums">{change} vs generated</p>
      )}
      {hint !== undefined && <p className="text-muted text-xs">{hint}</p>}
    </div>
  );
}

export interface SummaryCardsProps {
  summary: BattleSummary;
  /** The generated summary when the counts have been edited by hand; the cards then show the deltas. */
  baseline?: BattleSummary | undefined;
}

/** Battle Summary (S-34): what the march does, and what getting it back costs. */
export function SummaryCards({ summary, baseline }: SummaryCardsProps) {
  const diff = (pick: (value: BattleSummary) => number): string | undefined =>
    baseline === undefined ? undefined : delta(pick(summary) - pick(baseline));
  const diffRatio = (pick: (value: BattleSummary) => number): string | undefined =>
    baseline === undefined ? undefined : deltaRatio(pick(summary) - pick(baseline));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">Battle summary</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          label="Stacks"
          value={amount(summary.stackCount)}
          change={diff((value) => value.stackCount)}
        />
        <Metric
          label="Minimum damage"
          value={amount(summary.minDamage)}
          change={diff((value) => value.minDamage)}
          hint="The monster strikes first"
        />
        <Metric
          label="Average damage"
          value={amount(summary.avgDamage)}
          change={diff((value) => value.avgDamage)}
        />
        <Metric
          label="Maximum damage"
          value={amount(summary.maxDamage)}
          change={diff((value) => value.maxDamage)}
          hint="Your army strikes first"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Metric
          label="Damage / silver"
          value={ratio(summary.damagePerSilver)}
          change={diffRatio((value) => value.damagePerSilver)}
        />
        <Metric
          label="Damage / gold"
          value={ratio(summary.damagePerGold)}
          change={diffRatio((value) => value.damagePerGold)}
        />
        <Metric
          label="Damage / dragon coin"
          value={ratio(summary.damagePerDragonCoin)}
          change={diffRatio((value) => value.damagePerDragonCoin)}
        />
      </div>

      <Card padded={false} className="p-3">
        <h4 className="text-muted mb-2 text-xs font-medium">Recovery</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric
            label="Silver"
            value={amount(summary.recovery.silver)}
            change={diff((value) => value.recovery.silver)}
          />
          <Metric
            label="Gold"
            value={amount(summary.recovery.gold)}
            change={diff((value) => value.recovery.gold)}
          />
          <Metric
            label="Dragon coins"
            value={amount(summary.recovery.dragonCoins)}
            change={diff((value) => value.recovery.dragonCoins)}
          />
          <Metric label="Time" value={duration(summary.recovery.seconds)} />
        </div>
      </Card>

      <Card padded={false} className="p-3">
        <h4 className="text-muted mb-2 text-xs font-medium">Damage by pool</h4>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {(Object.keys(POOL_LABELS) as Pool[]).map((pool) => (
            <Metric
              key={pool}
              label={POOL_LABELS[pool]}
              value={amount(summary.damageByPool[pool])}
              change={diff((value) => value.damageByPool[pool])}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
