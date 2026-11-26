/**
 * The Prime Arena's answer, in the March pane's place and, below 1200 px, in the sheet the bar opens (B-35).
 *
 * It follows the March's own shape (design rule 28): the recap first, then the army as the March's own pool blocks and tier pills, then the
 * story folded into one log per round, in the same `Sections` rhythm the March uses. Colours are the unit's group
 * and tier colours through the shared badge (rules 20, 23), words are ours (rule 26).
 */
import { Badge, Group, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { useId } from 'react';

import type { PrimeArenaRound, PrimeArenaSideOutcome } from '@/engine/primeArena';
import type { PrimeArenaPlan } from '@/engine/primeArenaPlanner';
import { TierBadge } from '@/ui/domain';
import { count } from '@/ui/domain/format';
import { Disclosure, Sections } from '@/ui/kit';
import { arenaPoolRows, PoolFigure, PoolStacks } from '@/ui/sections/march';

import { usePrimeArenaStore } from './primeArenaStore';

const SIDE_NAME = { attacker: 'Attacker', defender: 'Defender', draw: 'Nobody' } as const;

const pct = (share: number): string => `${(share * 100).toFixed(1)} %`;

/** "Attacker wins 2 to 0": the match in a line, for the recap and for the bar's answer. */
export function verdictOf(plan: PrimeArenaPlan): string {
  const { match } = plan;
  return match.winner === 'draw'
    ? 'A draw'
    : `${SIDE_NAME[match.winner]} wins ${String(Math.max(match.attackerRoundsWon, match.defenderRoundsWon))} to ${String(
        Math.min(match.attackerRoundsWon, match.defenderRoundsWon),
      )}`;
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
              <RoundLog key={i} round={round} index={i + 1} />
            ))}
          </Stack>
        </Disclosure>
      )}
    </Sections>
  );
}

function Recap({ plan }: { plan: PrimeArenaPlan }) {
  const { score, spent } = plan;
  return (
    <Stack gap="xs">
      <Group gap="xs">
        <Badge variant="light" size="lg" radius="sm">
          {verdictOf(plan)}
        </Badge>
      </Group>
      <Text size="sm">
        Survivor share {score.survivorShare.toFixed(2)} of 2 over both rounds. Leadership spent{' '}
        {count(spent.leadership)}, Dominance spent {count(spent.dominance)}.
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

function RoundLog({ round, index }: { round: PrimeArenaRound; index: number }) {
  const first = round.first === 'attacker' ? 'Attacker strikes first' : 'Defender strikes first';
  const result = round.winner === 'draw' ? 'Draw' : `${SIDE_NAME[round.winner]} takes the round`;
  return (
    <Stack gap={6}>
      <Title order={4} size="h5">
        Round {index}
      </Title>
      <Text size="sm" c="dimmed">
        {first}. {result}.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <SideTable name="Attacker" side={round.attacker} />
        <SideTable name="Defender" side={round.defender} />
      </SimpleGrid>
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
