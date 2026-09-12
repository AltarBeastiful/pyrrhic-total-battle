/**
 * The TOTAL, as the card's header carries it and as every editor repeats it (design plan §7.3):
 * three labelled figures side by side — what the whole army gains in health, in strength and in
 * double damage — then how many sources are feeding them.
 *
 * Each figure is a real label over a real number (D-19: no eyebrow caps, no middle-dot meta string),
 * set in tabular figures so the three of them move without the line reflowing. They are marked up as
 * a description list, because that is what they are: four names and their values.
 *
 * A source switched on with nothing typed in it is the one thing that silently makes a march wrong,
 * so the header counts those out loud instead of hiding them behind the fold.
 */
import { Badge } from '@/ui/kit';
import { Cluster } from '@/ui/layout';

import { formatPercent } from './labels';
import type { TotalsSummary } from './rows';

function Figure({ label, value, size }: { label: string; value: string; size: 'sm' | 'md' }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted text-sm">{label}</dt>
      <dd className={size === 'md' ? 'nums text-xl font-semibold' : 'nums text-base font-semibold'}>
        {value}
      </dd>
    </div>
  );
}

export interface TotalsFiguresProps {
  summary: TotalsSummary;
  /** `md` heads the card; `sm` repeats it inside an editor, where it is a reminder, not a title. */
  size?: 'sm' | 'md';
}

export function TotalsFigures({ summary, size = 'md' }: TotalsFiguresProps) {
  const empty = summary.empty;
  return (
    <Cluster gap={4} align="end" wrap>
      <Cluster as="dl" gap={6} align="end" wrap aria-label="Army bonus totals">
        <Figure label="Health" value={formatPercent(summary.health)} size={size} />
        <Figure label="Strength" value={formatPercent(summary.strength)} size={size} />
        <Figure label="Special" value={formatPercent(summary.special)} size={size} />
        <Figure label="Sources on" value={String(summary.on)} size="sm" />
      </Cluster>
      {empty > 0 && (
        <Badge tone="warn" size="md">
          {`${String(empty)} on but empty`}
        </Badge>
      )}
    </Cluster>
  );
}
