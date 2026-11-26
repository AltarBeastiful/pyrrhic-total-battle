/**
 * The Prime Arena's answer, in the March pane's place and, below 1200 px, in the sheet the bar opens (B-35).
 *
 * It follows the March's own shape (design rule 28): the recap first, then the army as the March's own pool blocks and tier pills, then the
 * story folded into one log per round, in the same `Sections` rhythm the March uses. Colours are the unit's group
 * and tier colours through the shared badge (rules 20, 23), words are ours (rule 26).
 */
import { Badge, Group, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { useId } from 'react';

import { otherSide, roundsWonBy } from '@/engine/primeArena';
import type {
  PrimeArenaRound,
  PrimeArenaSide,
  PrimeArenaSideOutcome,
  PrimeArenaStep,
} from '@/engine/primeArena';
import type { PrimeArenaPlan } from '@/engine/primeArenaPlanner';
import { PoolGauge, TierBadge } from '@/ui/domain';
import { count } from '@/ui/domain/format';
import { Disclosure, Sections } from '@/ui/kit';
import { arenaPoolRows, PoolFigure, PoolStacks } from '@/ui/sections/march';

import { usePrimeArenaStore } from './primeArenaStore';

export const SIDE_NAME = { attacker: 'Attacker', defender: 'Defender', draw: 'Nobody' } as const;

/** The side's name, with "(you)" on the one the plan plays: the headline match has our squad in the chosen role. */
const sideLabel = (side: PrimeArenaSide, plan: PrimeArenaPlan): string =>
  side === plan.role ? `${SIDE_NAME[side]} (you)` : SIDE_NAME[side];

const POOLS = ['leadership', 'dominance'] as const;

const pct = (share: number): string => `${(share * 100).toFixed(1)} %`;

/**
 * The match in a line, read for our side: the in-game wording (victory, defeat, draw) from the plan's own score,
 * then the rounds each side took. For a defender plan the score is the defender's, so "victory" means the defence held.
 */
export function verdictOf(plan: PrimeArenaPlan): string {
  const { match, score } = plan;
  const word = score.result === 2 ? 'Victory' : score.result === 1 ? 'Draw' : 'Defeat';
  const theirs = roundsWonBy(match, otherSide(plan.role));
  return `${word}, ${String(score.roundsWon)} to ${String(theirs)}`;
}

export interface ArenaMatchProps {
  /** True where the March has a pane to put a heading in; the sheet's own header is the heading below it. */
  titled?: boolean;
}

export function ArenaMatch({ titled = true }: ArenaMatchProps = {}) {
  const plan = usePrimeArenaStore((state) => state.plan);
  const titleId = useId();

  return (
    <Sections component="section" {...(titled ? { 'aria-labelledby': titleId } : { 'aria-label': 'Match' })}>
      <Stack gap="md">
        {titled && (
          <Title order={2} id={titleId}>
            Match
          </Title>
        )}
        {plan === null ? (
          <Text size="sm" c="dimmed">
            Generate to plan the attack and see the two rounds.
          </Text>
        ) : (
          <Recap plan={plan} />
        )}
      </Stack>
      {plan !== null && <ArmyBlocks plan={plan} />}
      {plan !== null && (
        <Disclosure title="Battle log" summary="two rounds" defaultOpened>
          <Stack gap="md">
            {plan.match.rounds.map((round, i) => (
              <RoundLog key={i} plan={plan} round={round} index={i + 1} />
            ))}
          </Stack>
        </Disclosure>
      )}
    </Sections>
  );
}

function Recap({ plan }: { plan: PrimeArenaPlan }) {
  const { score, spent, unspent, maxed } = plan;
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Badge variant="light" size="lg" radius="sm">
          {verdictOf(plan)}
        </Badge>
      </Group>
      <Text size="sm">
        Your survivor share {score.survivorShare.toFixed(2)} of 2 over both rounds, against an equal army.
      </Text>
      <PanelNote plan={plan} />
      {/* The same gauge the March shows: used of available, so the owner can check the army is maxed out. */}
      <SimpleGrid cols={2} aria-label="Housing">
        {POOLS.map((pool) => (
          <Stack key={pool} gap={2}>
            <PoolGauge pool={pool} used={spent[pool]} total={spent[pool] + unspent[pool]} />
            <Text size="xs" c={maxed[pool] && spent[pool] > 0 ? 'dimmed' : 'orange'}>
              {housingSentence(pool, spent[pool], unspent[pool], maxed[pool])}
            </Text>
          </Stack>
        ))}
      </SimpleGrid>
      <Text size="xs" c="dimmed">
        Damage the game lists as blocked is not modelled here.
      </Text>
    </Stack>
  );
}

const POOL_WORD = {
  leadership: { name: 'Leadership', units: 'troops' },
  dominance: { name: 'Dominance', units: 'monsters' },
} as const;

/**
 * The check the March makes of its pools, for a typed figure: is the army held back by the housing the player
 * typed (the March's `bindingSentence`: every point is spent, so a bigger army needs more of it), or does the
 * figure leave housing no unit can fill, or is it zero? The figure is typed by hand, so it asks the player to
 * confirm it is the real maximum.
 */
export function housingSentence(
  pool: (typeof POOLS)[number],
  spent: number,
  unspent: number,
  maxed: boolean,
): string {
  const { name, units } = POOL_WORD[pool];
  if (spent + unspent === 0) {
    return `No ${name} typed, so no ${units} are fielded. Type your real maximum if you have one.`;
  }
  if (!maxed) return `${count(unspent)} left`;
  const left = unspent > 0 ? ` (${count(unspent)} left, buys no unit)` : '';
  return `Maxed out${left}. Your ${name} is what ends the plan: every point of it that buys a unit is spent, so check that ${count(spent + unspent)} is your real maximum.`;
}

/** What the squad was ranked on: the opponent panel (sizes, fills) and how its results combine, against the even split. */
function PanelNote({ plan }: { plan: PrimeArenaPlan }) {
  const { panel, aggregate, panelScore, start } = plan;
  const how = aggregate === 'mean' ? 'the average' : 'the worst case';
  const each = aggregate === 'mean' ? 'on average' : 'in the worst of them';
  return (
    <Stack gap={2}>
      <Text size="sm" c="dimmed">
        Ranked on {how} of {panel.length} opponents: {panel.map((member) => member.label).join('; ')}.
      </Text>
      <Text size="sm" c="dimmed">
        Against them the squad takes {panelScore.roundsWon.toFixed(2)} of 2 rounds {each} and keeps a survivor
        share of {panelScore.survivorShare.toFixed(2)}; the even split takes{' '}
        {start.panelScore.roundsWon.toFixed(2)} and {start.panelScore.survivorShare.toFixed(2)}.
      </Text>
    </Stack>
  );
}

/** The planned army: the March's own pool blocks (pool figure, tier-coloured pills), without its controls. */
function ArmyBlocks({ plan }: { plan: PrimeArenaPlan }) {
  const housing = usePrimeArenaStore((state) => state.setup.housing);
  const rows = arenaPoolRows(plan.stacks, plan.spent, housing);
  return (
    <Stack gap="lg">
      {rows.map((row) => (
        <Stack key={row.pool} gap="xs">
          <Group gap={8} wrap="nowrap" align="center">
            <PoolFigure row={row} />
          </Group>
          <PoolStacks row={row} readOnly />
        </Stack>
      ))}
    </Stack>
  );
}

function RoundLog({ plan, round, index }: { plan: PrimeArenaPlan; round: PrimeArenaRound; index: number }) {
  const first = `${sideLabel(round.first, plan)} strikes first`;
  const result = round.winner === 'draw' ? 'Draw' : `${sideLabel(round.winner, plan)} takes the round`;
  return (
    <Stack gap={6}>
      <Title order={4} size="h5">
        Round {index}
      </Title>
      <Text size="sm" c="dimmed">
        {first}. {result}.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <SideTable name={sideLabel('attacker', plan)} side={round.attacker} />
        <SideTable name={sideLabel('defender', plan)} side={round.defender} />
      </SimpleGrid>
      <Disclosure title="Turn by turn" summary={`${String(round.steps.length)} hits`}>
        <Stack gap={2}>
          {round.steps.map((step, i) => (
            <Text key={i} size="xs">
              {stepLine(plan, round, step)}
            </Text>
          ))}
        </Stack>
      </Disclosure>
    </Stack>
  );
}

function SideTable({ name, side }: { name: string; side: PrimeArenaSideOutcome }) {
  return (
    <Table aria-label={name} withRowBorders verticalSpacing={2}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{name}</Table.Th>
          <Table.Th ta="right">Start</Table.Th>
          <Table.Th ta="right">Left</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {side.stacks.map((s) => (
          <Table.Tr key={s.unit.id}>
            <Table.Td>
              <Group gap={6} wrap="nowrap">
                <TierBadge tier={s.unit.tier} size="sm" />
                <Text size="sm">{s.unit.name}</Text>
              </Group>
            </Table.Td>
            <Table.Td ta="right">
              <Text size="sm">{count(s.start)}</Text>
            </Table.Td>
            <Table.Td ta="right">
              <Text size="sm">{count(s.survivors)}</Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
      <Table.Tfoot>
        <Table.Tr>
          <Table.Td colSpan={3}>
            <Text size="sm" c="dimmed">
              {pct(side.share)} of the troops survive
            </Text>
          </Table.Td>
        </Table.Tr>
      </Table.Tfoot>
    </Table>
  );
}

/** One hit in words: who struck with which stack, what it hit, the damage and the units it killed. */
function stepLine(plan: PrimeArenaPlan, round: PrimeArenaRound, step: PrimeArenaStep): string {
  const other = otherSide(step.side);
  const striker = round[step.side].stacks[step.stack]?.unit.name ?? 'a stack';
  const target = round[other].stacks[step.target]?.unit.name ?? 'a stack';
  return `${sideLabel(step.side, plan)} ${striker} hits ${sideLabel(other, plan)} ${target} for ${count(Math.round(step.damage))}, ${count(step.kills)} killed.`;
}
