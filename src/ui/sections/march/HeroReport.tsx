/**
 * **The Heroes report** (`docs/plans/hero-report.md`): a launcher button and the full-page popup it opens. The popup
 * holds the report until the next ask. Blocks in the plan's order: verdict banner, roster board, what to do on the top
 * three, best trio, situation matrix, worth getting. Stock Mantine only (design rule 23); text 13 px and up (rule 19);
 * emoji glyphs for the verdicts, never the only signal (rules 21, 24).
 */
import { Badge, Button, Group, Paper, Progress, SimpleGrid, Stack, Table, Text } from '@mantine/core';

import {
  type HeroAction,
  type HeroReport,
  type HeroTile,
  type Role,
  type RoleUp,
  type SituationId,
  type Verdict,
} from '@/engine/heroReport';
import { Dialog, Disclosure } from '@/ui/kit';

import { planWords } from './picks';
import { useHeroReport, type HeroEntry, type HeroView } from './heroReportSearch';

const VERDICT: Record<Verdict, { glyph: string; word: string }> = {
  level: { glyph: '⬆️', word: 'Level' },
  star: { glyph: '⭐', word: 'Stars' },
  both: { glyph: '⬆️⭐', word: 'Both' },
  hold: { glyph: '⏸️', word: 'Hold' },
};

const SITUATION_WORD: Record<SituationId, string> = {
  default: 'As is',
  monsters: 'More monsters',
  moreMercs: 'More mercs',
  otherMercs: 'Other mercs',
};

/** The figure of an action, with its unit on every row: gain per cost where a cost was typed, raw gain otherwise. */
function figure(action: HeroAction): string {
  const value =
    action.score >= 100 ? Math.round(action.score).toLocaleString('en') : action.score.toPrecision(3);
  if (action.unit !== null) return `+${value} per ${action.unit}`;
  return action.kind === 'star' ? `+${value} rating per star` : `+${value} rating`;
}

/** What to do: the stars to add and the star it ends on, or the levels to add. */
function actionWords(action: HeroAction, star?: number): string {
  if (action.kind !== 'star') return `+${String(action.size)} levels`;
  const to = star === undefined ? '' : ` (★${String(star)} → ★${String(star + action.size)})`;
  return `+${String(action.size)} ${action.size === 1 ? 'star' : 'stars'}${to}`;
}

const signed = (value: number): string => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1)}`;

/** The trade side of a star step: the next star's change, and any star count that worsens the trade by far. */
function tradeNote(action: HeroAction): string {
  const parts: string[] = [];
  if (action.next !== undefined)
    parts.push(
      action.next.delta < 0
        ? `a further star (to +${String(action.next.size)}) loses ${Math.abs(action.next.delta).toFixed(1)}`
        : `a further star (to +${String(action.next.size)}) adds ${signed(action.next.delta)}`,
    );
  if (action.most !== undefined)
    parts.push(
      `all the way, +${String(action.most.size)} stars, gives +${action.most.gain.toFixed(1)} in all`,
    );
  for (const worse of action.worse)
    parts.push(
      `⚠️ +${String(worse.size)} stars worsen the trade by ${Math.abs(worse.trade).toFixed(1)} over the bar`,
    );
  return parts.join(' · ');
}

/** What the hero's lines are for, and the mercenaries of the account that match. */
function pairsWords(pairs: NonNullable<HeroTile['pairs']>): string {
  if (pairs.types.length === 0) return 'Pairs with any merc';
  const kinds = pairs.types.join(' · ');
  return pairs.mercs.length === 0
    ? `Pairs with ${kinds} mercs`
    : `Pairs with ${kinds}: ${pairs.mercs.join(', ')}`;
}

function Stars({ star }: { star: number }) {
  return (
    <span aria-label={`${String(Math.min(star + 1, 7))} stars`}>{'★'.repeat(Math.min(star + 1, 7))}</span>
  );
}

/** Bars on one scale: solo and trio contribution, each against the best of its own kind. */
function Bars({ tile, maxSolo, maxTrio }: { tile: HeroTile; maxSolo: number; maxTrio: number }) {
  return (
    <Stack gap={2}>
      <Progress value={maxSolo > 0 ? (100 * tile.solo) / maxSolo : 0} size="sm" aria-label="Solo" />
      <Progress
        value={maxTrio > 0 ? (100 * tile.trio) / maxTrio : 0}
        size="sm"
        color="grape"
        aria-label="Trio"
      />
    </Stack>
  );
}

function Tile({ tile, maxSolo, maxTrio }: { tile: HeroTile; maxSolo: number; maxTrio: number }) {
  const solo = VERDICT[tile.soloUp.verdict];
  const trio = tile.trioUp === undefined ? null : VERDICT[tile.trioUp.verdict];
  return (
    <Paper withBorder p="xs" radius="sm" data-testid={`hero-${tile.captainId}`}>
      <Group justify="space-between" wrap="nowrap" gap={6}>
        <Text size="sm" fw={600} truncate>
          {tile.name}
        </Text>
        <Text size="sm" aria-label={`Solo ${solo.word}${trio === null ? '' : `, trio ${trio.word}`}`}>
          {solo.glyph}
          {trio === null ? '' : ` ${trio.glyph}`}
        </Text>
      </Group>
      <Text size="sm" c="dimmed">
        L{tile.level} <Stars star={tile.star} />
      </Text>
      <Bars tile={tile} maxSolo={maxSolo} maxTrio={maxTrio} />
      {tile.pairs !== undefined && (
        <Text size="sm" c="dimmed" data-testid={`hero-pairs-${tile.captainId}`}>
          {pairsWords(tile.pairs)}
        </Text>
      )}
      <Group gap={4} mt={4}>
        {tile.onlyOn !== undefined && (
          <Badge size="sm" variant="light" color="gray" tt="none">
            {tile.onlyOn} only
          </Badge>
        )}
        {tile.flips.length > 0 && (
          <Badge size="sm" variant="light" color="orange" tt="none">
            flips: {tile.flips.map((id) => SITUATION_WORD[id].toLowerCase()).join(', ')}
          </Badge>
        )}
      </Group>
    </Paper>
  );
}

function Banner({ report, role }: { report: HeroReport; role: Role }) {
  const banner = report.banner[role];
  if (banner.length === 0)
    return (
      <Text size="sm" data-testid={`hero-banner-${role}`}>
        No upgrade of yours gains in {role === 'solo' ? 'a solo march' : 'your best trio'}.
      </Text>
    );
  return (
    <Stack gap={4} data-testid={`hero-banner-${role}`}>
      {banner.map((action, index) => {
        const tile = report.tiles.find((candidate) => candidate.captainId === action.captainId);
        const note = tradeNote(action);
        return (
          <Text key={`${action.captainId}-${action.kind}`} size="sm">
            <Text span fw={700}>
              {index + 1}.{' '}
            </Text>
            {tile?.name ?? action.captainId} {actionWords(action, tile?.star)} — {figure(action)}
            {note === '' ? '' : ` · ${note}`}
          </Text>
        );
      })}
    </Stack>
  );
}

function upWords(up: RoleUp | undefined, star: number): string {
  return [up?.level, up?.star]
    .filter((action): action is HeroAction => action !== undefined)
    .map((action) => `${actionWords(action, action.kind === 'star' ? star : undefined)} (${figure(action)})`)
    .join(' · ');
}

function Plan({ report, role }: { report: HeroReport; role: Role }) {
  return (
    <Stack gap={4}>
      {report.plan[role].map((tile) => {
        const up = role === 'solo' ? tile.soloUp : tile.trioUp;
        const verdict = VERDICT[up?.verdict ?? 'hold'];
        const words = upWords(up, tile.star);
        return (
          <Text key={tile.captainId} size="sm">
            {verdict.glyph}{' '}
            <Text span fw={600}>
              {tile.name}
            </Text>
            : {verdict.word.toLowerCase()}
            {up?.verdict === 'hold' || words === '' ? '' : ` — ${words}`}
          </Text>
        );
      })}
    </Stack>
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
  const maxSolo = Math.max(0, ...report.tiles.map((tile) => tile.solo));
  const maxTrio = Math.max(0, ...report.tiles.map((tile) => tile.trio));
  const folded = report.tiles.filter((tile) => !tile.matters);
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
      <Stack gap={4}>
        <Text fw={600}>Where to put effort next</Text>
        <Text size="sm" c="dimmed">
          Solo and trio marches weigh the same, so each is rated apart, on the upgrade read in the lineup it
          plays in.
        </Text>
        <Text size="sm" fw={600}>
          Solo marches
        </Text>
        <Banner report={report} role="solo" />
        <Text size="sm" fw={600}>
          Trio marches
        </Text>
        <Banner report={report} role="trio" />
      </Stack>

      <Stack gap="xs">
        <Text fw={600}>Your heroes</Text>
        <Text size="sm" c="dimmed">
          Blue: alone with troops. Violet: what the hero adds to your best trio. ⬆️ level · ⭐ stars · ⏸️
          hold; solo first, then trio.
        </Text>
        <SimpleGrid cols={{ base: 2, sm: 3, md: 5 }} spacing="xs">
          {report.tiles
            .filter((tile) => tile.matters)
            .map((tile) => (
              <Tile key={tile.captainId} tile={tile} maxSolo={maxSolo} maxTrio={maxTrio} />
            ))}
        </SimpleGrid>
        {folded.length > 0 && (
          <Text size="sm" c="dimmed">
            Matter nowhere: {folded.map((tile) => tile.name).join(', ')}.
          </Text>
        )}
      </Stack>

      {report.situational.length > 0 && <Situational tiles={report.situational} />}

      <Stack gap={4}>
        <Text fw={600}>The top three</Text>
        <Text size="sm" fw={600}>
          Solo marches
        </Text>
        <Plan report={report} role="solo" />
        <Text size="sm" fw={600}>
          Trio marches
        </Text>
        <Plan report={report} role="trio" />
      </Stack>

      {report.bestTrio !== null && trioNames !== undefined && (
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
