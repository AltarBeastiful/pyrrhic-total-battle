/**
 * **Analyze all, above the tree** (B-28): one button that ranks every talent the battle rating can read, its
 * progress and cancel, and a ranking card, collapsed until pressed, that exists only once a run has finished (or one kept from an earlier run). The state is the store's
 * (`allAnalysisStore`), so the card holds nothing a later story would have to pull out of it.
 */
import { Button, Group, Progress, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';

import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { allTalentsKey } from '@/state/talentAnalysis';
import { rankTalents, type RankingRow, type RankingSort } from '@/state/talentRanking';

import { analyzeAll, cancelAll, rankingOf, useAllAnalysisStore } from './allAnalysisStore';
import classes from './talents.module.css';

const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`;

const COLUMNS: { sort: RankingSort | null; label: string }[] = [
  { sort: 'name', label: 'Talent' },
  { sort: null, label: 'Held' },
  { sort: null, label: 'Max' },
  { sort: 'gainAtMax', label: 'Gain at max' },
  { sort: 'perPoint', label: 'Per point' },
];

function Ranking({
  rows,
  sort,
  onSort,
  stale,
  onSelect,
}: {
  rows: RankingRow[];
  sort: RankingSort;
  onSort: (s: RankingSort) => void;
  stale: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <div
      className={classes.rankBox}
      role="region"
      aria-label="Talent ranking"
      tabIndex={0}
      data-stale={stale ? 'true' : undefined}
    >
      <table className={classes.ranks}>
        <thead>
          <tr>
            {COLUMNS.map(({ sort: own, label }) => (
              <th
                key={label}
                scope="col"
                aria-sort={
                  own === null
                    ? undefined
                    : own === sort
                      ? own === 'name'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                }
              >
                {own === null ? (
                  label
                ) : (
                  <button
                    type="button"
                    className={classes.sortButton}
                    onClick={() => {
                      onSort(own);
                    }}
                  >
                    {label}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <button
                  type="button"
                  className={classes.sortButton}
                  aria-label={`Select ${row.name}`}
                  onClick={() => {
                    onSelect(row.id);
                  }}
                >
                  {row.name}
                </button>
              </td>
              <td>{row.held}</td>
              <td>{row.max}</td>
              <td>{signed(row.gainAtMax)}</td>
              <td>{row.perPoint === null ? 'none left' : signed(row.perPoint)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AllTalentsAnalysis({ onSelect }: { onSelect: (id: number) => void }) {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const run = useAllAnalysisStore((state) => state.run);
  const [sort, setSort] = useState<RankingSort>('perPoint');
  // The card is collapsed until pressed; the ranking itself lives in the store, so closing it loses nothing.
  const [open, setOpen] = useState(false);
  // The question as it stands now; a kept ranking asked another one is out of date and never shown as current.
  const key = useMemo(
    () => (profile === undefined || setup === undefined ? null : allTalentsKey(profile, setup)),
    [profile, setup],
  );
  if (profile === undefined || setup === undefined) return null;
  const running = run?.status === 'running';
  const ranking = rankingOf(run);
  const stale = ranking !== null && ranking.key !== key;
  const rows = ranking === null ? null : rankTalents(ranking.entries, sort);
  return (
    <Stack gap="xs" component="section" aria-label="Analyze all talents">
      <Group gap="xs" align="center">
        {running ? (
          <Button size="xs" variant="default" onClick={cancelAll}>
            Cancel
          </Button>
        ) : (
          <Button
            size="xs"
            variant="light"
            onClick={() => {
              void analyzeAll(profile, setup);
            }}
          >
            {stale ? 'Re-analyze' : 'Analyze all'}
          </Button>
        )}
        {running && (
          <Text size="sm" role="status">
            {run.total > 0 ? `Analyzing, ${String(run.done)} of ${String(run.total)}` : 'Analyzing'}
          </Text>
        )}
        {stale && run?.status !== 'running' && (
          <Text size="sm" c="dimmed">
            Out of date: your army or bonuses changed since.
          </Text>
        )}
        {run?.status === 'cancelled' && (
          <Text size="sm" c="dimmed" role="status">
            Cancelled.
          </Text>
        )}
        {run?.status === 'failed' && (
          <Text size="sm" role="alert">{`Analysis failed: ${run.error ?? 'unknown error'}`}</Text>
        )}
      </Group>
      {running && (
        <Progress
          size="sm"
          value={run.total > 0 ? (run.done / run.total) * 100 : 0}
          aria-label="Analyze all progress"
        />
      )}
      <Text size="sm" c="dimmed">
        Ranks every talent the battle rating reads by what its remaining ranks add to your march.
      </Text>
      {rows !== null && ranking !== null && (
        <>
          <Group gap="xs" align="center">
            <Button
              size="compact-xs"
              variant="subtle"
              aria-expanded={open}
              onClick={() => {
                setOpen((now) => !now);
              }}
            >
              {open ? 'Hide ranking' : `Show ranking (${String(rows.length)} talents)`}
            </Button>
            <Text size="sm">{`${String(ranking.notRated)} not rated in battle`}</Text>
          </Group>
          {open && <Ranking rows={rows} sort={sort} onSort={setSort} stale={stale} onSelect={onSelect} />}
        </>
      )}
    </Stack>
  );
}
