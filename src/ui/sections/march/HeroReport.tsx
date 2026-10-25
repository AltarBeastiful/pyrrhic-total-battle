/**
 * **The Heroes report** (`docs/plans/hero-report.md`): a launcher button and the full-page popup it opens. The popup
 * holds the report until the next ask. Blocks in the plan's order: verdict banner, roster board, what to do on the top
 * three, best trio, situation matrix, worth getting. Stock Mantine only (design rule 23); text 13 px and up (rule 19);
 * emoji glyphs for the verdicts, never the only signal (rules 21, 24).
 */
import { Alert, Badge, Button, Group, Stack, Table, Text, Tooltip } from '@mantine/core';

import { type HeroAction, type HeroReport, type RoleUp, type SituationId } from '@/engine/heroReport';
import { Dialog, Disclosure } from '@/ui/kit';

import { planWords } from './picks';
import { ChampionStory } from './HeroChampionView';
import { useHeroReport, type HeroEntry, type HeroView } from './heroReportSearch';

const SITUATION_WORD: Record<SituationId, string> = {
  default: 'As is',
  monsters: 'More monsters',
  moreMercs: 'More mercs',
  otherMercs: 'Other mercs',
};

const signed = (value: number): string => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1)}`;

/** What a situational hero's best upgrade is, in words. */
function upWords(up: RoleUp | undefined, star: number): string {
  return [up?.level, up?.star]
    .filter((action): action is HeroAction => action !== undefined)
    .map((action) =>
      action.kind === 'star'
        ? `+${String(action.size)} stars (★${String(star + 1)} → ★${String(star + 1 + action.size)}) ${signed(action.gain)}`
        : `+${String(action.size)} levels ${signed(action.gain)}`,
    )
    .join(' · ');
}

/** Who is best right now: the top three by their solo gain as the army stands, the podium. */
function Podium({ report }: { report: HeroReport }) {
  const top = [...report.tiles]
    .sort((a, b) => b.solo - a.solo)
    .slice(0, 3)
    .filter((tile) => tile.solo > 0);
  if (top.length === 0) return null;
  return (
    <Group gap="md" data-testid="hero-podium">
      <Tooltip label="Best right now, with the levels and stars you have">
        <Text fw={600}>Right now</Text>
      </Tooltip>
      {top.map((tile, index) => (
        <Text key={tile.captainId} size="sm">
          {['🥇', '🥈', '🥉'][index]} {tile.name} {tile.solo.toFixed(1)}
        </Text>
      ))}
    </Group>
  );
}

const ONLY_ON_WORD: Record<string, string> = { group: 'group marches and raids', epic: 'epic monsters' };

/** Heroes that count on one kind of march only: their gain where they apply, with the upgrade that pays. */
function Situational({ tiles }: { tiles: readonly HeroReport['tiles'][number][] }) {
  return (
    <Stack gap={4}>
      <Text fw={600}>Situational heroes</Text>
      <Text size="sm" c="dimmed">
        They count on one kind of march only, so they take no solo or trio place and no line of the banner
        above.
      </Text>
      {tiles.map((tile) => {
        const words = upWords(tile.soloUp, tile.star);
        return (
          <Text key={tile.captainId} size="sm">
            <b>{tile.name}</b> — {ONLY_ON_WORD[tile.onlyOn ?? ''] ?? tile.onlyOn}: +{tile.solo.toFixed(1)}{' '}
            rating where it applies{words === '' ? '' : ` · ${words}`}
          </Text>
        );
      })}
    </Stack>
  );
}

function Matrix({ report }: { report: HeroReport }) {
  const name = (id: string | null): string => report.tiles.find((tile) => tile.captainId === id)?.name ?? '—';
  const shown = report.tiles.filter((tile) => tile.matters);
  return (
    <Table.ScrollContainer minWidth={420}>
      <Table withTableBorder withColumnBorders data-testid="hero-matrix">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Solo score</Table.Th>
            {report.situations.map((row) => (
              <Table.Th key={row.id}>{SITUATION_WORD[row.id]}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {shown.map((tile) => (
            <Table.Tr key={tile.captainId}>
              <Table.Td>{tile.name}</Table.Td>
              {report.situations.map((row) => (
                <Table.Td key={row.id} fw={row.bestSolo === tile.captainId ? 700 : 400}>
                  {(row.solo[tile.captainId] ?? 0).toFixed(1)}
                  {row.bestSolo === tile.captainId ? ' 👑' : ''}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
          <Table.Tr>
            <Table.Td fw={600}>Best trio</Table.Td>
            {report.situations.map((row) => (
              <Table.Td key={row.id}>{row.bestTrio?.map(name).join(', ') ?? '—'}</Table.Td>
            ))}
          </Table.Tr>
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

/** The trios close to the best: a surprising match is told, the lesser ones stay folded. */
function OtherTrios({ report }: { report: HeroReport }) {
  const name = (id: string): string => report.tiles.find((tile) => tile.captainId === id)?.name ?? id;
  const line = (trio: HeroReport['otherTrios'][number]): string =>
    `${trio.captainIds.map(name).join(' · ')} — +${trio.gain.toFixed(1)}`;
  const surprising = report.otherTrios.filter((trio) => trio.surprise.length > 0).slice(0, 2);
  const lesser = report.otherTrios.filter((trio) => !surprising.includes(trio));
  return (
    <Stack gap={4}>
      {surprising.map((trio) => (
        <Text key={trio.captainIds.join()} size="sm" data-testid="hero-surprise">
          Surprising match: {line(trio)} — {trio.surprise.map(name).join(', ')}{' '}
          {trio.surprise.length === 1 ? 'is' : 'are'} no top-three solo hero and works through the match.
        </Text>
      ))}
      {lesser.length > 0 && (
        <Disclosure title="Other close trios" summary={String(lesser.length)}>
          <Stack gap={2} data-testid="hero-other-trios">
            {lesser.map((trio) => (
              <Text key={trio.captainIds.join()} size="sm">
                {line(trio)}
              </Text>
            ))}
          </Stack>
        </Disclosure>
      )}
    </Stack>
  );
}

function Body({ report, stale }: { report: HeroReport; stale: boolean }) {
  const trioNames = report.bestTrio?.captainIds.map(
    (id) => report.tiles.find((tile) => tile.captainId === id)?.name ?? id,
  );
  return (
    <Stack gap="lg">
      {stale && (
        <Text size="sm" c="dimmed">
          Asked about an earlier state of your account. Analyse again to refresh it.
        </Text>
      )}
      {report.cuts.length > 0 && (
        <Alert color="yellow" variant="light" data-testid="hero-cut">
          The time limit cut this analysis short: {report.cuts.join('; ')}. Some figures are missing or
          rougher, and the order may change on a full read.
        </Alert>
      )}
      <Podium report={report} />
      {report.champion !== undefined && (
        <ChampionStory
          champion={report.champion}
          nameOf={(id) =>
            report.tiles.find((tile) => tile.captainId === id)?.name ??
            report.situational.find((tile) => tile.captainId === id)?.name ??
            id
          }
        />
      )}

      {report.situational.length > 0 && <Situational tiles={report.situational} />}

      {report.champion?.trios === undefined && report.bestTrio !== null && trioNames !== undefined && (
        <Stack gap={4}>
          <Text fw={600}>Best trio across all plans</Text>
          <Text size="sm">
            {trioNames.join(' · ')} — +{report.bestTrio.gain.toFixed(1)} rating on average over the{' '}
            {String(report.stops.length)}
            stops.
          </Text>
          <Text size="sm" c="dimmed">
            {report.stops
              .map(
                (pick, index) => `${planWords({ pick })} +${(report.bestTrio?.stops[index] ?? 0).toFixed(1)}`,
              )
              .join(' · ')}
            {report.stopTrios
              .map((trio, index) =>
                trio === null || trio.captainIds.join() === report.bestTrio?.captainIds.join()
                  ? null
                  : `${planWords({ pick: report.stops[index] ?? 'sweet-spot' })} alone: ${trio.captainIds
                      .map((id) => report.tiles.find((tile) => tile.captainId === id)?.name ?? id)
                      .join(', ')}`,
              )
              .filter((note): note is string => note !== null)
              .map((note) => ` · ${note}`)
              .join('')}
          </Text>
          <OtherTrios report={report} />
        </Stack>
      )}

      <Stack gap="xs">
        <Group gap="xs">
          <Text fw={600}>Situations</Text>
          <Badge size="sm" variant="light" color="yellow" tt="none">
            pending validation
          </Badge>
        </Group>
        <Matrix report={report} />
        {report.skipped.map((skip) => (
          <Text key={skip.id} size="sm" c="dimmed">
            {SITUATION_WORD[skip.id]} not read: {skip.why}
          </Text>
        ))}
      </Stack>

      {report.getting !== null && (
        <Stack gap={4}>
          <Text fw={600}>Worth getting</Text>
          <Text size="sm">
            {report.getting.name} — the best of the easiest heroes you do not own yet (difficulty{' '}
            {report.getting.difficulty} of 10, a draft).
          </Text>
        </Stack>
      )}
    </Stack>
  );
}

function Status({ entry, onCancel }: { entry: HeroEntry; onCancel: () => void }) {
  if (entry.status === 'running')
    return (
      <Group gap="sm">
        <Text size="sm" c="dimmed" aria-live="polite">
          Reading your heroes… {entry.done} of {entry.total}
        </Text>
        <Button size="xs" variant="default" onClick={onCancel}>
          Cancel
        </Button>
      </Group>
    );
  if (entry.status === 'failed')
    return (
      <Text size="sm" c="red">
        The heroes could not be read: {entry.error}
      </Text>
    );
  if (entry.status === 'cancelled')
    return (
      <Text size="sm" c="dimmed">
        Cancelled.
      </Text>
    );
  return null;
}

/** The popup, controlled by the view. */
export function HeroReportDialog({ view }: { view: HeroView }) {
  const { entry } = view;
  return (
    <Dialog
      opened={view.open}
      onClose={() => {
        view.setOpen(false);
      }}
      title="Heroes report"
      size="full"
    >
      <Stack gap="md" data-testid="hero-report">
        {entry !== null && <Status entry={entry} onCancel={view.cancel} />}
        {entry?.report != null && <Body report={entry.report} stale={view.stale} />}
        <Group>
          <Button
            size="xs"
            variant="default"
            disabled={!view.ready || entry?.status === 'running'}
            onClick={view.analyse}
          >
            Analyse my heroes again
          </Button>
        </Group>
      </Stack>
    </Dialog>
  );
}

/** The one button, under the captain chips: it asks, and opens the popup (or reopens the kept report). */
export function HeroReportLauncher() {
  const view = useHeroReport();
  if (view.owned === 0) return null;
  const kept = view.entry?.report != null;
  return (
    <>
      <Group gap="sm">
        <Button
          size="xs"
          variant="default"
          disabled={!view.ready && !kept}
          onClick={() => {
            if (kept) view.setOpen(true);
            else view.analyse();
          }}
        >
          {kept ? 'Heroes report' : 'Analyse my heroes'}
        </Button>
        {!view.ready && !kept && (
          <Text size="sm" c="dimmed">
            Generate a march first.
          </Text>
        )}
      </Group>
      <HeroReportDialog view={view} />
    </>
  );
}
