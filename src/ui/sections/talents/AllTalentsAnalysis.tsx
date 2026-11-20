/**
 * **Analyze all, above the tree** (B-28): one button that ranks every talent the battle rating can read, its
 * progress and cancel, and a ranking card that exists only once a run has finished. The state is the store's
 * (`allAnalysisStore`), so the card holds nothing a later story would have to pull out of it.
 */
import { Button, Group, Progress, Stack, Text } from '@mantine/core';
import { useState } from 'react';

import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { rankTalents, type RankingRow, type RankingSort } from '@/state/talentRanking';

import { analyzeAll, cancelAll, useAllAnalysisStore } from './allAnalysisStore';
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
}: {
  rows: RankingRow[];
  sort: RankingSort;
  onSort: (s: RankingSort) => void;
}) {
  return (
    <div className={classes.rankBox} role="region" aria-label="Talent ranking" tabIndex={0}>
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
              <td>{row.name}</td>
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

export function AllTalentsAnalysis() {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const run = useAllAnalysisStore((state) => state.run);
  const [sort, setSort] = useState<RankingSort>('perPoint');
  if (profile === undefined || setup === undefined) return null;
  const running = run?.status === 'running';
  const rows = run?.entries == null ? null : rankTalents(run.entries, sort);
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
            Analyze all
          </Button>
        )}
        {running && (
          <Text size="sm" role="status">
            {run.total > 0 ? `Analyzing, ${String(run.done)} of ${String(run.total)}` : 'Analyzing'}
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
      {rows !== null && run !== null && (
        <>
          <Text size="sm">{`${String(run.notRated)} not rated in battle`}</Text>
          <Ranking rows={rows} sort={sort} onSort={setSort} />
        </>
      )}
    </Stack>
  );
}
