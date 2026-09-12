import type { UnitDef } from '@/engine/types';
import { UnitBadge } from '@/ui/icons';
import { Card, cn } from '@/ui/primitives';

import { amount, delta } from './format';
import { KeepButton } from './KeepButton';
import type { SearchTradeoff, TradeoffFigures } from './runStore';
import { findUnit, unitBadge } from './units';

interface Row {
  label: string;
  read: (figures: TradeoffFigures) => number;
  /** Which way is the good way: more damage, fewer coins. */
  better: 'high' | 'low';
}

const ROWS: Row[] = [
  {
    label: 'Hits your army lands (monster first)',
    read: (figures) => figures.friendlyHits,
    better: 'high',
  },
  { label: 'Damage if the monster strikes first', read: (figures) => figures.minDamage, better: 'high' },
  { label: 'Damage if you strike first', read: (figures) => figures.maxDamage, better: 'high' },
  { label: 'Expected damage', read: (figures) => figures.avgDamage, better: 'high' },
  { label: 'Retrain silver', read: (figures) => figures.silver, better: 'low' },
  { label: 'Revive gold', read: (figures) => figures.gold, better: 'low' },
  { label: 'Dragon coins', read: (figures) => figures.dragonCoins, better: 'low' },
];

export interface TradeoffPanelProps {
  tradeoff: SearchTradeoff;
  units: readonly UnitDef[];
  /** Unit ids already kept in the march by hand. */
  kept: readonly string[];
  /** A run is in flight: the keep buttons would queue a second one. */
  busy?: boolean;
}

/**
 * What the priority bought, and what it cost (PLAN §3.6).
 *
 * A search wins by leaving unit types at home, and the winning number is the only one it reports — so
 * every other figure moved without anyone saying so. This table puts the selection next to the army you
 * would have marched with every type in it, row by row, and hands back the types it dropped.
 */
export function TradeoffPanel({ tradeoff, units, kept, busy = false }: TradeoffPanelProps) {
  const dropped = tradeoff.excludedUnitIds;

  return (
    <Card tone="raised" padded={false} className="p-3">
      <h3 className="text-sm font-semibold">This selection vs all types</h3>
      <p className="text-muted mt-1 text-xs">
        The priority kept {String(tradeoff.includedUnitIds.length)} unit type
        {tradeoff.includedUnitIds.length === 1 ? '' : 's'}
        {dropped.length === 0
          ? ' — every type you own is in the march.'
          : ` and left ${String(dropped.length)} out. Here is what that changed.`}
      </p>

      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[22rem] text-xs">
          <thead>
            <tr className="text-muted text-left">
              <th scope="col" className="py-1.5 pr-3 font-medium">
                Figure
              </th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                This selection
              </th>
              <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                All types
              </th>
              <th scope="col" className="py-1.5 text-right font-medium">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const mine = row.read(tradeoff.selection);
              const all = row.read(tradeoff.baseline);
              const difference = mine - all;
              const rounded = Math.round(difference);
              const good = row.better === 'high' ? rounded > 0 : rounded < 0;
              return (
                <tr key={row.label} className="border-line border-t">
                  <th scope="row" className="text-muted py-1.5 pr-3 text-left font-medium">
                    {row.label}
                  </th>
                  <td className="nums py-1.5 pr-3 text-right font-semibold">{amount(mine)}</td>
                  <td className="nums text-muted py-1.5 pr-3 text-right">{amount(all)}</td>
                  <td
                    className={cn(
                      'nums py-1.5 text-right font-medium',
                      rounded === 0 ? 'text-muted' : good ? 'text-ok' : 'text-warn',
                    )}
                  >
                    {delta(difference)}
                    {rounded !== 0 && <span className="sr-only">{good ? ' (better)' : ' (worse)'}</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dropped.length > 0 && (
        <div className="mt-3">
          <h4 className="text-sm font-semibold">Left out by the priority</h4>
          <ul className="mt-1.5 space-y-1.5">
            {dropped.map((unitId) => {
              const unit = findUnit(unitId, units);
              const name = unit?.name ?? unitId;
              return (
                <li key={unitId} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-xs">
                    <UnitBadge {...unitBadge(unit)} size="sm" />
                    <span className="truncate">{name}</span>
                  </span>
                  <KeepButton unitId={unitId} name={name} kept={kept.includes(unitId)} disabled={busy} />
                </li>
              );
            })}
          </ul>
          <p className="text-muted mt-2 text-xs">
            A type you keep in is never dropped again — by this search or by any later one — until you stop
            keeping it.
          </p>
        </div>
      )}
    </Card>
  );
}
