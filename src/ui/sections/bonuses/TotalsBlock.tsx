import { useMemo, useState } from 'react';

import { aggregateBonuses } from '@/engine/bonuses';
import { describeTotals, resolveSources, sourceCaveats } from '@/state/derive';
import type { TotalRow } from '@/state/derive';
import type { BattleSetup, Profile } from '@/state/schema';

import { Card, HelpNote, Toggle } from '../../primitives';
import { AGAINST_LABELS, BONUS_LABELS, formatPercent } from './labels';

function Rows({ rows, empty }: { rows: TotalRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-muted text-xs">{empty}</p>;
  return (
    <ul className="divide-line divide-y text-sm">
      {rows.map((row) => (
        <li key={row.key}>
          <details>
            <summary className="flex cursor-pointer items-center justify-between gap-2 py-1.5">
              <span>{row.label}</span>
              <span className="font-medium tabular-nums">{formatPercent(row.value)}</span>
            </summary>
            <ul className="text-muted pb-2 pl-3 text-xs">
              {row.contributors.length === 0 ? (
                <li>No source feeds this key yet.</li>
              ) : (
                row.contributors.map((contributor, index) => (
                  <li
                    key={`${contributor.sourceId}-${String(index)}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{contributor.label}</span>
                    <span className="tabular-nums">{formatPercent(contributor.value)}</span>
                  </li>
                ))
              )}
            </ul>
          </details>
        </li>
      ))}
    </ul>
  );
}

/**
 * The TOTAL cards (S-14): what the sources switched on add up to, key by key, with the breakdown the
 * game's battle report has to be reconciled against. Keys nothing feeds are hidden until asked for.
 */
export function TotalsBlock({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const [showAll, setShowAll] = useState(false);

  const { totals, caveats } = useMemo(() => {
    const sources = resolveSources(profile, setup);
    return {
      totals: describeTotals(aggregateBonuses(sources), sources),
      caveats: sourceCaveats(profile, setup),
    };
  }, [profile, setup]);

  const used = (rows: TotalRow[]): TotalRow[] =>
    showAll ? rows : rows.filter((row) => row.value !== 0 || row.contributors.length > 0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Totals</h3>
        <Toggle label="Show every key" checked={showAll} onChange={setShowAll} />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card role="region" aria-label="Health totals">
          <h4 className="mb-1 text-sm font-semibold">Health</h4>
          <Rows rows={used(totals.health)} empty="No health bonus switched on." />
        </Card>

        <Card role="region" aria-label="Strength totals">
          <h4 className="mb-1 text-sm font-semibold">Strength</h4>
          <Rows rows={used(totals.strength)} empty="No strength bonus switched on." />
          {totals.eventStrength !== 0 && (
            <p className="border-line mt-2 flex items-center justify-between gap-2 border-t pt-2 text-sm">
              <span>Event strength</span>
              <span className="font-medium tabular-nums">{formatPercent(totals.eventStrength)}</span>
            </p>
          )}
          {totals.matchup.length > 0 && (
            <ul className="text-muted mt-2 text-xs">
              {totals.matchup.map((entry, index) => (
                <li key={`${entry.attacker}-${entry.target}-${String(index)}`}>
                  {BONUS_LABELS[entry.attacker]} against {AGAINST_LABELS[entry.target]}{' '}
                  {formatPercent(entry.value)}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card role="region" aria-label="Special totals">
          <h4 className="mb-1 text-sm font-semibold">Special</h4>
          <Rows rows={used(totals.special)} empty="No special bonus switched on." />
        </Card>
      </div>

      {caveats.map((caveat) => (
        <HelpNote key={caveat} tone="warn">
          {caveat}
        </HelpNote>
      ))}
    </div>
  );
}
