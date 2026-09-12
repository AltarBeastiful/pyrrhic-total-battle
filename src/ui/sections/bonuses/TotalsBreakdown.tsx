/**
 * What the three header figures are made of, key by key, with the sources that fed each one — the
 * block a player opens when the game's own march window disagrees with ours and the difference has
 * to go into the unexplained remainder.
 *
 * It is folded away by default: the header is the answer, this is the audit.
 */
import { aggregateBonuses } from '@/engine/bonuses';
import { describeTotals, resolveSources, sourceCaveats } from '@/state/derive';
import type { TotalRow } from '@/state/derive';
import type { BattleSetup, Profile } from '@/state/schema';
import { Banner, Disclosure } from '@/ui/kit';
import { Stack } from '@/ui/layout';

import { AGAINST_LABELS, BONUS_LABELS, formatPercent, sourceLabel } from './labels';

/** Keys nothing feeds are not worth a line. */
const carries = (row: TotalRow): boolean => row.value !== 0 || row.contributors.length > 0;

function Rows({ rows, empty }: { rows: TotalRow[]; empty: string }) {
  const used = rows.filter(carries);
  if (used.length === 0) return <p className="text-muted text-sm">{empty}</p>;
  return (
    <ul className="text-sm">
      {used.map((row) => (
        <li key={row.key} className="border-line border-b py-1 last:border-b-0">
          <p className="flex items-baseline justify-between gap-2">
            <span className="truncate">{row.label}</span>
            <span className="nums font-medium">{formatPercent(row.value)}</span>
          </p>
          <ul className="text-muted text-xs">
            {row.contributors.map((contributor, index) => (
              <li
                key={`${contributor.sourceId}-${String(index)}`}
                className="flex items-baseline justify-between gap-2"
              >
                <span className="truncate">{sourceLabel(contributor.label)}</span>
                <span className="nums">{formatPercent(contributor.value)}</span>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack gap={1} as="section" aria-label={title}>
      <h5 className="text-sm font-medium">{title}</h5>
      {children}
    </Stack>
  );
}

export function TotalsBreakdown({ profile, setup }: { profile: Profile; setup: BattleSetup }) {
  const sources = resolveSources(profile, setup);
  const totals = describeTotals(aggregateBonuses(sources), sources);
  const caveats = sourceCaveats(profile, setup);

  return (
    <Stack gap={3}>
      {caveats.map((caveat) => (
        <Banner key={caveat} tone="warn">
          {caveat}
        </Banner>
      ))}
      <Disclosure title="Every key and what feeds it" summary="Check these against a battle report">
        <Stack gap={4}>
          <Block title="Health">
            <Rows rows={totals.health} empty="No health bonus is switched on." />
          </Block>
          <Block title="Strength">
            <Rows rows={totals.strength} empty="No strength bonus is switched on." />
            {totals.eventStrength !== 0 && (
              <p className="nums flex items-baseline justify-between gap-2 text-sm">
                <span>From events</span>
                <span className="font-medium">{formatPercent(totals.eventStrength)}</span>
              </p>
            )}
            {totals.matchup.length > 0 && (
              <ul className="text-sm">
                {totals.matchup.map((entry, index) => (
                  <li
                    key={`${entry.attacker}-${entry.target}-${String(index)}`}
                    className="flex items-baseline justify-between gap-2"
                  >
                    <span className="truncate">
                      {`${BONUS_LABELS[entry.attacker]} against ${AGAINST_LABELS[entry.target]}`}
                    </span>
                    <span className="nums font-medium">{formatPercent(entry.value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>
          <Block title="Special">
            <Rows rows={totals.special} empty="No special bonus is switched on." />
          </Block>
        </Stack>
      </Disclosure>
    </Stack>
  );
}
