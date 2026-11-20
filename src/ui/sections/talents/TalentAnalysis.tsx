/**
 * **Analyze, in a talent's detail** (B-24): the button, the progress and the cancel, then the table of ranks and,
 * after it, the chart. The result is the analysis store's, kept until the next ask; one asked about another army
 * or other bonuses says so and offers a fresh ask.
 */
import { Button, Group, Text } from '@mantine/core';
import { useEffect, useMemo } from 'react';

import type { TalentRecord } from '@/data/types';
import { isAnalyzable } from '@/engine/talentAnalysis';
import type { TalentAnalysis as Analysis } from '@/worker/talentAnalysis';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { talentAnalysisKey } from '@/state/talentAnalysis';

import { analyzeTalent, cancelAnalysis, useAnalysisStore } from './analysisStore';
import classes from './talents.module.css';

const signed = (value: number): string => `${value >= 0 ? '+' : ''}${value.toFixed(2)} %`;

const W = 300;
const H = 150;
const PAD = { left: 38, right: 10, top: 10, bottom: 22 };

/** The chart: rank across, rating gain up; the mean bold, each shape faint and named at its last point. */
function Chart({ analysis }: { analysis: Analysis }) {
  const { ranks, shapes, mean } = analysis;
  const all = [...mean, ...shapes.flatMap((shape) => shape.gains), 0];
  const low = Math.min(...all);
  const high = Math.max(...all);
  const span = Math.max(1e-9, high - low);
  const last = Math.max(1, ranks.at(-1) ?? 1);
  const x = (rank: number): number => PAD.left + (rank / last) * (W - PAD.left - PAD.right);
  const y = (value: number): number => PAD.top + (1 - (value - low) / span) * (H - PAD.top - PAD.bottom);
  const line = (values: readonly number[]): string =>
    values.map((value, i) => `${x(ranks[i] ?? 0).toFixed(1)},${y(value).toFixed(1)}`).join(' ');
  return (
    <svg
      viewBox={`0 0 ${String(W)} ${String(H)}`}
      width="100%"
      role="img"
      aria-label={`Rating gain by rank, from ${signed(mean[0] ?? 0)} at rank ${String(ranks[0] ?? 0)} to ${signed(mean.at(-1) ?? 0)} at rank ${String(last)}, average of ${shapes.map((s) => `${String(s.fill)} %`).join(' and ')} pool`}
      data-testid="analysis-chart"
    >
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={y(0)}
        y2={y(0)}
        stroke="var(--mantine-color-dimmed)"
        strokeDasharray="2 3"
      />
      {shapes.map((shape) => (
        <g key={shape.fill}>
          <polyline
            points={line(shape.gains)}
            fill="none"
            stroke="var(--mantine-color-dimmed)"
            strokeWidth={1.25}
            opacity={0.7}
          />
          <text
            x={x(last) - 4}
            y={y(shape.gains.at(-1) ?? 0) - 4}
            fontSize={9}
            textAnchor="end"
            fill="var(--mantine-color-dimmed)"
          >
            {`${String(shape.fill)} %`}
          </text>
        </g>
      ))}
      <polyline points={line(mean)} fill="none" stroke="var(--mantine-color-blue-6)" strokeWidth={2.5} />
      {mean.map((value, i) => (
        <circle key={ranks[i]} cx={x(ranks[i] ?? 0)} cy={y(value)} r={3} fill="var(--mantine-color-blue-6)" />
      ))}
      {ranks.map((rank) => (
        <text
          key={rank}
          x={x(rank)}
          y={H - 6}
          fontSize={9}
          textAnchor="middle"
          fill="var(--mantine-color-dimmed)"
        >
          {rank}
        </text>
      ))}
      <text x={PAD.left - 4} y={y(high) + 3} fontSize={9} textAnchor="end" fill="var(--mantine-color-dimmed)">
        {signed(high)}
      </text>
      <text x={PAD.left - 4} y={y(low) + 3} fontSize={9} textAnchor="end" fill="var(--mantine-color-dimmed)">
        {signed(low)}
      </text>
    </svg>
  );
}

/** The points a talent costs up to a rank. */
const costTo = (node: TalentRecord, rank: number): number =>
  node.costs.slice(0, rank).reduce((sum, c) => sum + c, 0);

function Results({ node, analysis }: { node: TalentRecord; analysis: Analysis }) {
  // The highest rank comes first: that is where the win is. Rank 0 is the baseline and says nothing.
  const rows = analysis.ranks
    .map((rank, i) => ({ rank, i, gain: analysis.mean[i] ?? 0, points: costTo(node, rank) }))
    .filter((row) => row.rank > 0)
    .reverse();
  const top = rows[0];
  const bestPerPoint = rows.reduce<(typeof rows)[number] | undefined>(
    (best, row) => (best === undefined || row.gain / row.points > best.gain / best.points ? row : best),
    undefined,
  );
  return (
    <>
      {top !== undefined && (
        <div className={classes.win} aria-label={`What ${node.name} can win`}>
          <Text fw={700} size="lg" className={classes.winFigure}>
            {`${signed(top.gain)} rating`}
          </Text>
          <Text size="sm">{`at rank ${String(top.rank)}, for ${String(top.points)} ${top.points === 1 ? 'point' : 'points'}.`}</Text>
          {bestPerPoint !== undefined && bestPerPoint.rank !== top.rank && (
            <Text size="sm" c="dimmed">
              {`Best value per point: rank ${String(bestPerPoint.rank)}, ${signed(bestPerPoint.gain)} for ${String(bestPerPoint.points)} points.`}
            </Text>
          )}
        </div>
      )}
      <div className={classes.rankBox} role="region" aria-label={`${node.name} rating by rank`} tabIndex={0}>
        <table className={classes.ranks}>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              {analysis.shapes.map((shape) => (
                <th key={shape.fill} scope="col">{`Pool ${String(shape.fill)} %`}</th>
              ))}
              <th scope="col">Average</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank}>
                <td>{row.rank}</td>
                {analysis.shapes.map((shape) => (
                  <td key={shape.fill}>{signed(shape.gains[row.i] ?? 0)}</td>
                ))}
                <td>
                  <b>{signed(row.gain)}</b>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Chart analysis={analysis} />
    </>
  );
}

export function TalentAnalysis({ node }: { node: TalentRecord }) {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const entry = useAnalysisStore((state) => state.entries[node.id]);
  // Leaving the talent stops the pass: its answer must never land under another tile.
  useEffect(() => cancelAnalysis, [node.id]);
  const key = useMemo(
    () => (profile !== undefined && setup !== undefined ? talentAnalysisKey(profile, setup, node) : null),
    [profile, setup, node],
  );
  if (!isAnalyzable(node)) {
    return (
      <Text size="sm" c="dimmed">
        The battle does not read this talent, so there is nothing to analyze.
      </Text>
    );
  }
  if (profile === undefined || setup === undefined || key === null) return null;
  const running = entry?.status === 'running';
  const stale = entry !== undefined && entry.analysis !== null && entry.key !== key;
  return (
    <section aria-label={`Analyze ${node.name}`}>
      <Group gap="xs" align="center">
        {running ? (
          <Button size="xs" variant="default" onClick={cancelAnalysis}>
            Cancel
          </Button>
        ) : (
          <Button
            size="xs"
            variant="light"
            onClick={() => {
              void analyzeTalent(node, profile, setup);
            }}
          >
            {stale ? 'Re-analyze' : 'Analyze'}
          </Button>
        )}
        {running && (
          <Text size="sm" role="status">
            {`Analyzing, ${String(entry.done)} of ${String(entry.total || 2)} shapes`}
          </Text>
        )}
        {stale && !running && (
          <Text size="sm" c="dimmed">
            Out of date: your army or bonuses changed since.
          </Text>
        )}
        {entry?.status === 'failed' && (
          <Text size="sm" role="alert">{`Analysis failed: ${entry.error ?? 'unknown error'}`}</Text>
        )}
        {entry?.status === 'cancelled' && (
          <Text size="sm" c="dimmed">
            Cancelled.
          </Text>
        )}
      </Group>
      <Text size="xs" c="dimmed">
        March rating gained by each rank over none, on the army selected in March, added to your bonuses as
        entered.
      </Text>
      {entry?.analysis != null && <Results node={node} analysis={entry.analysis} />}
    </section>
  );
}
