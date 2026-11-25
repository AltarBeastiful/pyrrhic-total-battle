/**
 * **Analyze all** (B-28, moved by B-30): a button in the tree strip opens a full dialog that ranks every talent the battle
 * rating can read: its progress and cancel, and the ranking, shown at once once a run has finished (or one kept from an earlier run). The state is the store's
 * (`allAnalysisStore`), so the card holds nothing a later story would have to pull out of it.
 */
import { Badge, Button, Group, Progress, SegmentedControl, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';

import type { RankingMethod } from '@/engine/talentAnalysis';
import { Dialog } from '@/ui/kit';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { allTalentsKey } from '@/state/talentAnalysis';
import { rankTalents, type RankingRow, type RankingSort } from '@/state/talentRanking';

import { analyzeAll, cancelAll, rankingOf, useAllAnalysisStore } from './allAnalysisStore';
import classes from './talents.module.css';

/** What each reading does, in the words the dialog shows under the selector. */
const METHOD_LABELS: Record<RankingMethod, { label: string; words: string }> = {
  current: {
    label: 'Plain',
    words: 'Re-sizes this march at each rank and reads the gain on this army and this enemy alone.',
  },
  march: {
    label: 'This march',
    words:
      'Keeps this march’s troop counts and reads what each rank adds to them, on this army and this enemy alone.',
  },
  balanced: {
    label: 'Balanced',
    words:
      'Re-sizes the march at army sizes from half to one and a half times yours, against four enemy mixes, and averages. Steadier than plain.',
  },
  steady: {
    label: 'Steady',
    words:
      'Keeps the troop counts, averages over the same sizes and enemy mixes. The steadiest: your army size and enemy hardly move it.',
  },
};
const METHOD_ORDER: RankingMethod[] = ['current', 'march', 'balanced', 'steady'];

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
      className={classes.rankBoxTall}
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
                {row.toReach > 0 && (
                  <Badge
                    size="xs"
                    variant="light"
                    color="gray"
                    ml={6}
                    title="Talent points to spend on the nodes above it before it opens"
                  >
                    {`${String(row.toReach)} pt${row.toReach === 1 ? '' : 's'} to reach`}
                  </Badge>
                )}
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
  const method = useAllAnalysisStore((state) => state.method);
  const setMethod = useAllAnalysisStore((state) => state.setMethod);
  const [sort, setSort] = useState<RankingSort>('perPoint');
  // The question as it stands now; a kept ranking asked another one is out of date and never shown as current.
  const key = useMemo(
    () =>
      profile === undefined || setup === undefined
        ? null
        : allTalentsKey(profile, setup, undefined, undefined, method),
    [profile, setup, method],
  );
  if (profile === undefined || setup === undefined) return null;
  const running = run?.status === 'running';
  const ranking = rankingOf(run);
  const stale = ranking !== null && ranking.key !== key;
  const rows = ranking === null ? null : rankTalents(ranking.entries, sort);
  return (
    <Stack gap="xs" component="section" aria-label="Analyze all talents">
      <SegmentedControl
        size="xs"
        aria-label="How the talents are ranked"
        value={method}
        data={METHOD_ORDER.map((one) => ({ value: one, label: METHOD_LABELS[one].label }))}
        onChange={(value) => {
          const next = METHOD_ORDER.find((one) => one === value);
          if (next === undefined) return;
          setMethod(next);
          const key = allTalentsKey(profile, setup, undefined, undefined, next);
          const held = rankingOf(run);
          if (held === null || held.key !== key || running) void analyzeAll(profile, setup, next);
        }}
      />
      <Text size="sm" c="dimmed">
        {METHOD_LABELS[method].words}
      </Text>
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
              void analyzeAll(profile, setup, method);
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
      <Text size="sm" c="dimmed">
        {method === 'balanced' || method === 'steady'
          ? `Centred on this march: ${setup.housing.leadership.toLocaleString('en')} leadership, ${setup.housing.authority.toLocaleString('en')} authority, ${setup.housing.dominance.toLocaleString('en')} dominance. Per point is the fitted gain over every priced rank.`
          : `Priced on this march: ${setup.housing.leadership.toLocaleString('en')} leadership, ${setup.housing.authority.toLocaleString('en')} authority, ${setup.housing.dominance.toLocaleString('en')} dominance, and its enemy formation. A smaller or larger army, or another enemy, can rank the talents differently; Balanced and Steady do not.`}
      </Text>
      {rows !== null && ranking !== null && (
        <>
          <Text size="sm">
            {`${String(ranking.notRated)} not rated in battle`}
            {ranking.levelLocked > 0 && `, ${String(ranking.levelLocked)} locked by hero level and left out`}
          </Text>
          <Ranking rows={rows} sort={sort} onSort={setSort} stale={stale} onSelect={onSelect} />
        </>
      )}
    </Stack>
  );
}

/** The strip's button and the dialog it opens; picking a row closes the dialog and shows that talent in the tree. */
export function AnalyzeAllDialog({ onSelect }: { onSelect: (id: number) => void }) {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const [open, setOpen] = useState(false);
  const run = useAllAnalysisStore((state) => state.run);
  const method = useAllAnalysisStore((state) => state.method);
  const running = run?.status === 'running';
  // Pressing the button asks the question at once, unless a run is going or a ranking for this very account is held.
  const start = (): void => {
    setOpen(true);
    if (running || profile === undefined || setup === undefined) return;
    const held = rankingOf(run);
    if (held === null || held.key !== allTalentsKey(profile, setup, undefined, undefined, method))
      void analyzeAll(profile, setup, method);
  };
  return (
    <>
      <Button size="compact-sm" variant="light" aria-haspopup="dialog" onClick={start}>
        {running ? `Ranking talents, ${String(run.done)} of ${String(run.total)}` : 'Rank all talents'}
      </Button>
      <Dialog
        opened={open}
        onClose={() => {
          setOpen(false);
        }}
        title="Analyze all talents"
        size="xl"
      >
        <AllTalentsAnalysis
          onSelect={(id) => {
            setOpen(false);
            onSelect(id);
          }}
        />
      </Dialog>
    </>
  );
}
