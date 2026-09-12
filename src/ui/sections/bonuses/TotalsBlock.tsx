import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { aggregateBonuses } from '@/engine/bonuses';
import { describeTotals, resolveSources, sourceCaveats } from '@/state/derive';
import type { TotalRow } from '@/state/derive';
import type { BattleSetup, Profile } from '@/state/schema';

import { ChevronDownIcon } from '../../icons';
import { Card, HelpNote, Toggle } from '../../primitives';
import { BlockGlyph, KeySlot } from './glyphs';
import { AGAINST_LABELS, BONUS_LABELS, formatPercent, sourceLabel } from './labels';
import { Block } from './parts';

/** One key: its glyph, its name, what it is worth, and the sources that got it there. */
function Rows({ rows, empty }: { rows: TotalRow[]; empty: string }) {
  if (rows.length === 0) return <p className="text-muted text-xs">{empty}</p>;
  return (
    <ul className="divide-line divide-y text-sm">
      {rows.map((row) => (
        <li key={row.key}>
          <details className="group">
            <summary className="tap flex cursor-pointer list-none items-center gap-2 py-1.5">
              <KeySlot name={row.key} />
              <span className="truncate">{row.label}</span>
              <span className="nums ml-auto font-medium">{formatPercent(row.value)}</span>
              <span
                aria-hidden="true"
                className="text-muted shrink-0 text-xs transition-transform group-open:rotate-180"
              >
                <ChevronDownIcon />
              </span>
            </summary>
            <ul className="text-muted space-y-0.5 pb-2 pl-6 text-xs">
              {row.contributors.length === 0 ? (
                <li>Nothing feeds this key yet.</li>
              ) : (
                row.contributors.map((contributor, index) => (
                  <li
                    key={`${contributor.sourceId}-${String(index)}`}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{sourceLabel(contributor.label)}</span>
                    <span className="nums">{formatPercent(contributor.value)}</span>
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

/** One of the three totals: the whole-army figure first, then every key that carries something. */
function TotalCard({
  name,
  headline,
  headlineLabel,
  children,
}: {
  name: string;
  headline: number;
  headlineLabel: string;
  children: ReactNode;
}) {
  return (
    <Card tone="raised" role="region" aria-label={`${name} totals`} className="space-y-1">
      <div className="flex items-baseline justify-between gap-2">
        <h4>{name}</h4>
        <span className="text-muted text-xs">{headlineLabel}</span>
      </div>
      <p className="nums text-2xl leading-tight font-semibold">{formatPercent(headline)}</p>
      {children}
    </Card>
  );
}

const valueOf = (rows: TotalRow[], key: string): number => rows.find((row) => row.key === key)?.value ?? 0;

/**
 * The TOTAL cards (S-14): what the sources switched on add up to, key by key, with the breakdown a
 * battle report has to be reconciled against. Keys nothing feeds stay hidden until you ask for them.
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
    <Block
      title="Totals"
      icon={<BlockGlyph name="totals" />}
      description="What the sources switched on add up to. Open a key to see which of them feed it."
      where="open the march window on a monster — the army bonuses it lists are these same numbers."
      actions={<Toggle label="Show every key" checked={showAll} onChange={setShowAll} />}
    >
      <div className="grid gap-3 lg:grid-cols-3">
        <TotalCard name="Health" headline={valueOf(totals.health, 'army')} headlineLabel="Whole army">
          <Rows rows={used(totals.health)} empty="No health bonus is switched on." />
        </TotalCard>

        <TotalCard name="Strength" headline={valueOf(totals.strength, 'army')} headlineLabel="Whole army">
          <Rows rows={used(totals.strength)} empty="No strength bonus is switched on." />
          {totals.eventStrength !== 0 && (
            <p className="border-line mt-2 flex items-center justify-between gap-2 border-t pt-2 text-sm">
              <span>From events</span>
              <span className="nums font-medium">{formatPercent(totals.eventStrength)}</span>
            </p>
          )}
          {totals.matchup.length > 0 && (
            <ul className="text-muted nums mt-2 space-y-0.5 text-xs">
              {totals.matchup.map((entry, index) => (
                <li key={`${entry.attacker}-${entry.target}-${String(index)}`}>
                  {BONUS_LABELS[entry.attacker]} against {AGAINST_LABELS[entry.target]}{' '}
                  {formatPercent(entry.value)}
                </li>
              ))}
            </ul>
          )}
        </TotalCard>

        <TotalCard
          name="Special"
          headline={valueOf(totals.special, 'doubleDamageChance')}
          headlineLabel="Double damage"
        >
          <Rows rows={used(totals.special)} empty="No special bonus is switched on." />
        </TotalCard>
      </div>

      {caveats.length > 0 && (
        <div className="space-y-2">
          {caveats.map((caveat) => (
            <HelpNote key={caveat} tone="warn">
              {caveat}
            </HelpNote>
          ))}
        </div>
      )}
    </Block>
  );
}
