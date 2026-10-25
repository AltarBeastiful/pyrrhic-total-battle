/**
 * **The hero champion's story** (`docs/plans/the-hero-champion.md`), told with interface: the roster as tiles in S / A / B
 * tiers with a today → potential curve, the champion and the challenger, the valleys, the level road beside the star
 * road, the trios. Explanations live in tooltips (design rule 23: stock Mantine; rule 19: text 13 px and up; a glyph
 * is never the only signal).
 */
import { Badge, Group, Paper, SimpleGrid, Stack, Text, Tooltip } from '@mantine/core';

import type { ChampionTile, GridRating, HeroChampion, Tier, Valley } from '@/engine/heroChampion';
import { Disclosure } from '@/ui/kit';

const signed = (value: number): string => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1)}`;
/** The game counts stars from ★1 (the default); the tables store them from 0. Everything the report writes goes through this. */
const starName = (star: number): string => `★${String(star + 1)}`;
const at = (point: { star: number; level: number }): string =>
  `${starName(point.star)} · L${String(point.level)}`;

/** The words of a valley: the package with its catch-up, or the rung to stop at. */
function valleyWords(valley: Valley): string {
  const loss = valley.loss.toFixed(1);
  return valley.kind === 'package' && valley.to !== undefined
    ? `${starName(valley.dip)} loses ${loss}, ${starName(valley.to)} recovers it and gains ${signed(valley.gain)} over ${starName(valley.from)}`
    : `${starName(valley.dip)} loses ${loss}: don't star past ${starName(valley.from)}`;
}

const W = 160;
const H = 44;

/** Which points of the road earn a visible marker, and why: where it starts, its peak, where it dips. */
function markerKinds(values: number[]): Map<number, string> {
  const kinds = new Map<number, string>();
  const last = values.length - 1;
  kinds.set(0, 'Now');
  kinds.set(last, 'Top of the road');
  const peak = values.indexOf(Math.max(...values));
  if (peak !== 0) kinds.set(peak, peak === last ? 'Peak (the top)' : 'Peak');
  for (let index = 1; index < last; index += 1) {
    if (values[index]! < values[index - 1]!) kinds.set(index, 'Dip');
  }
  return kinds;
}

/**
 * One road from where the hero stands (the stars, or the levels): a dot where it is now, markers at the peak and the
 * dips, every point hoverable. `range` is shared by the tile's two roads so their heights compare.
 */
function Curve({
  tile,
  points,
  road,
  colour: lineColour,
  range,
}: {
  tile: ChampionTile;
  points: GridRating[];
  road: 'star' | 'level';
  colour: string;
  range: { low: number; high: number };
}) {
  if (points.length < 2) return null;
  const values = points.map((point) => point.rating);
  const low = range.low;
  const span = Math.max(1e-9, range.high - low);
  const x = (index: number): number => 5 + (index * (W - 10)) / (points.length - 1);
  const y = (value: number): number => H - 5 - ((value - low) * (H - 10)) / span;
  const line = points.map((point, index) => `${x(index).toFixed(1)},${y(point.rating).toFixed(1)}`).join(' ');
  const kinds = markerKinds(values);
  return (
    <svg
      viewBox={`0 0 ${String(W)} ${String(H)}`}
      width="100%"
      style={{ maxWidth: W * 1.25, display: 'block' }}
      role="img"
      aria-label={`${road === 'star' ? 'Star' : 'Level'} road, rating from ${at(points[0]!)} to ${at(points.at(-1)!)}`}
    >
      <polyline points={line} fill="none" stroke={lineColour} strokeWidth={2} />
      {points.map((point, index) => {
        const kind = kinds.get(index);
        const colour =
          kind === 'Now'
            ? 'var(--mantine-color-orange-6)'
            : kind === 'Dip'
              ? 'var(--mantine-color-red-6)'
              : kind === undefined
                ? lineColour
                : 'var(--mantine-color-green-6)';
        const previous = points[index - 1];
        const step = previous === undefined ? null : point.rating - previous.rating;
        return (
          <Tooltip
            key={`${road}-${String(point.star)}-${String(point.level)}`}
            label={`${kind === undefined ? '' : `${kind} · `}${at(point)} · rating ${point.rating.toFixed(1)}${step === null ? '' : ` (${signed(step)} from the step before)`}`}
          >
            <circle
              cx={x(index)}
              cy={y(point.rating)}
              r={kind === undefined ? 2 : 4}
              fill={colour}
              stroke="var(--mantine-color-body)"
              strokeWidth={1}
              data-testid={`champion-${road}-point-${tile.captainId}-${String(index)}`}
              style={{ cursor: 'pointer' }}
            />
          </Tooltip>
        );
      })}
    </svg>
  );
}

/** The star road (blue) and the level road (teal) of a tile, on one height scale, each named. */
function Roads({ tile }: { tile: ChampionTile }) {
  const all = [...tile.starPath, ...tile.levelPath].map((point) => point.rating);
  if (all.length === 0) return null;
  const range = { low: Math.min(...all), high: Math.max(...all) };
  return (
    <Stack gap={0}>
      <Text size="xs" c="dimmed" lh={1.2}>
        Stars
      </Text>
      <Curve
        tile={tile}
        points={tile.starPath}
        road="star"
        colour="var(--mantine-color-blue-6)"
        range={range}
      />
      <Text size="xs" c="dimmed" lh={1.2} mt={2}>
        Levels
      </Text>
      <Curve
        tile={tile}
        points={tile.levelPath}
        road="level"
        colour="var(--mantine-color-teal-6)"
        range={range}
      />
    </Stack>
  );
}

function roads(tile: ChampionTile): { stars: number | null; levels: number | null } {
  const gain = (path: GridRating[]): number | null =>
    path.length < 2 ? null : (path.at(-1)?.rating ?? 0) - (path[0]?.rating ?? 0);
  return { stars: gain(tile.starPath), levels: gain(tile.levelPath) };
}

/** A hero whose planned points were partly cut: its lead is read on fewer points than the others'. */
function CutBadge({ cut, id }: { cut: number; id: string }) {
  if (cut <= 0) return null;
  return (
    <Tooltip
      label={`${String(cut)} planned star/level points were not read: the lead is told on fewer points`}
    >
      <Badge size="sm" variant="light" color="yellow" tt="none" data-testid={`champion-partial-${id}`}>
        partial
      </Badge>
    </Tooltip>
  );
}

function Tile({ tile, champion }: { tile: ChampionTile; champion: boolean }) {
  const { stars, levels } = roads(tile);
  return (
    <Paper withBorder p="xs" radius="sm" data-testid={`champion-tile-${tile.captainId}`}>
      <Group justify="space-between" wrap="nowrap" gap={6}>
        <Text size="sm" fw={600} truncate>
          {tile.name}
          {champion ? ' 👑' : ''}
        </Text>
        <CutBadge cut={tile.cut} id={tile.captainId} />
        <Tooltip label="Average lead over the best other hero at every point this hero reaches">
          <Text size="sm" c="dimmed">
            {signed(tile.lead)}
          </Text>
        </Tooltip>
      </Group>
      <Text size="sm" c="dimmed">
        L{tile.level} · {starName(tile.star)}
      </Text>
      <Roads tile={tile} />
      <Text size="sm" data-testid={`champion-roads-${tile.captainId}`}>
        {tile.today === null ? '' : `${tile.today.toFixed(1)} → ${tile.potential.toFixed(1)}`}
      </Text>
      <Tooltip label="Levels are the quick road, stars the long one">
        <Text size="sm" c="dimmed">
          {levels === null ? '' : `⬆️ ${signed(levels)}`}
          {levels !== null && stars !== null ? ' · ' : ''}
          {stars === null ? '' : `⭐ ${signed(stars)}`}
        </Text>
      </Tooltip>
    </Paper>
  );
}

const TIERS: { tier: Tier; hint: string }[] = [
  { tier: 'S', hint: 'The champion zone' },
  { tier: 'A', hint: 'Serious challengers' },
  { tier: 'B', hint: 'Useful in some marches' },
];

/** The roster in tiers, then the heroes another hero beats everywhere, one click away. */
function Roster({ champion, nameOf }: { champion: HeroChampion; nameOf: (id: string) => string }) {
  return (
    <Stack gap="xs" data-testid="champion-roster">
      {TIERS.map(({ tier, hint }) => {
        const tiles = champion.tiles.filter((tile) => tile.tier === tier);
        if (tiles.length === 0) return null;
        return (
          <Stack key={tier} gap={4} data-testid={`champion-tier-${tier}`}>
            <Tooltip label={hint}>
              <Text fw={700} w="fit-content">
                {tier}
              </Text>
            </Tooltip>
            <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="xs">
              {tiles.map((tile) => (
                <Tile
                  key={tile.captainId}
                  tile={tile}
                  champion={champion.champion?.captainId === tile.captainId}
                />
              ))}
            </SimpleGrid>
          </Stack>
        );
      })}
      {champion.replaced.length > 0 && (
        <Disclosure title="Replaced" summary={String(champion.replaced.length)}>
          <Stack gap={2} data-testid="champion-replaced">
            {champion.replaced.map((entry) => (
              <Text key={entry.captainId} size="sm">
                {nameOf(entry.captainId)} — beaten everywhere by {nameOf(entry.by)}
              </Text>
            ))}
          </Stack>
        </Disclosure>
      )}
    </Stack>
  );
}

/** One champion, a challenger, where the challenger would overtake. */
function Race({ champion, nameOf }: { champion: HeroChampion; nameOf: (id: string) => string }) {
  const { champion: first, challenger, overtakes, noClearMargin } = champion;
  if (first === null) return null;
  return (
    <Paper withBorder p="sm" radius="sm" data-testid="champion-card">
      <Group gap="sm" wrap="wrap">
        <Text fw={700} data-testid="champion-name">
          👑 {nameOf(first.captainId)}
        </Text>
        <Tooltip label="Average lead over the best other hero, over every star and level point the hero reaches">
          <Badge size="sm" variant="light" tt="none">
            {signed(first.lead)}
          </Badge>
        </Tooltip>
        <Text size="sm" c="dimmed">
          leads at {first.leadsAt.wins} of {first.leadsAt.of}
        </Text>
        {noClearMargin && (
          <Tooltip label="Champion and challenger are nearly level: do not over-read the lead">
            <Badge size="sm" variant="light" color="yellow" tt="none" data-testid="champion-no-margin">
              no clear margin
            </Badge>
          </Tooltip>
        )}
      </Group>
      {challenger !== null && (
        <Text size="sm" data-testid="champion-challenger">
          Challenger {nameOf(challenger.captainId)} ({signed(challenger.lead)}) —{' '}
          {overtakes.length === 0
            ? 'never overtakes'
            : `overtakes at ${overtakes.slice(0, 6).map(at).join(', ')}${overtakes.length > 6 ? ` and ${String(overtakes.length - 6)} more` : ''}`}
        </Text>
      )}
    </Paper>
  );
}

/** The valleys told for the champion, the challenger and the advised trio members. */
function Valleys({ champion, nameOf }: { champion: HeroChampion; nameOf: (id: string) => string }) {
  const rows = [
    ...Object.entries(champion.valleys).flatMap(([id, list]) =>
      list.map((valley) => ({ who: nameOf(id), valley })),
    ),
    ...(champion.trios?.advised?.order ?? []).flatMap((member) =>
      (member.valleys ?? []).map((valley) => ({ who: `${nameOf(member.captainId)} in the trio`, valley })),
    ),
  ];
  if (rows.length === 0) return null;
  return (
    <Stack gap={2} data-testid="champion-valleys">
      {rows.map(({ who, valley }) => (
        <Text key={`${who}-${String(valley.dip)}`} size="sm">
          {valley.kind === 'package' ? '📦' : '⛔'} <b>{who}</b>: {valleyWords(valley)}
        </Text>
      ))}
    </Stack>
  );
}

function Trios({ champion, nameOf }: { champion: HeroChampion; nameOf: (id: string) => string }) {
  const trios = champion.trios;
  if (trios === undefined || trios.ranked.length === 0) return null;
  const { advised, surprising } = trios;
  return (
    <Stack gap={4} data-testid="champion-trios">
      <Text fw={600}>Trios</Text>
      {advised !== null && (
        <Text size="sm" data-testid="champion-trio-advised">
          Grow {advised.captainIds.map(nameOf).join(' · ')} — {advised.now.toFixed(1)} →{' '}
          {advised.ceiling.toFixed(1)}:{' '}
          {advised.order
            .filter((member) => member.gain > 0)
            .map(
              (member) => `${nameOf(member.captainId)} ${starName(member.bestStar)} ${signed(member.gain)}`,
            )
            .join(' · ')}
        </Text>
      )}
      {surprising.map((trio) => (
        <Text key={trio.captainIds.join()} size="sm" data-testid="hero-surprise">
          Surprising match: {trio.captainIds.map(nameOf).join(' · ')} — {trio.rating.toFixed(1)};{' '}
          {trio.outsiders.map(nameOf).join(', ')} {trio.outsiders.length === 1 ? 'is' : 'are'} no top-three
          solo hero
        </Text>
      ))}
    </Stack>
  );
}

/** The whole story. `nameOf` resolves any hero id. */
export function ChampionStory({
  champion,
  nameOf,
}: {
  champion: HeroChampion;
  nameOf: (id: string) => string;
}) {
  return (
    <Stack gap="md" data-testid="champion-story">
      <Race champion={champion} nameOf={nameOf} />
      <Valleys champion={champion} nameOf={nameOf} />
      <Roster champion={champion} nameOf={nameOf} />
      <Trios champion={champion} nameOf={nameOf} />
    </Stack>
  );
}
