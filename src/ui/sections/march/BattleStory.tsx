/**
 * The battle, told (design plan §7.5 step 5). Folded away by default, because a player copying
 * counts into the game does not need it — and when they do, the story is the same numbered hits the
 * game's own report prints, in sentences, round by round.
 *
 * The raw journal sits behind one more fold: it is the table you hold next to the in-game report,
 * not something to read.
 */
import { Button, Group, SegmentedControl, Stack, Table, Text } from '@mantine/core';
import { Copy } from 'lucide-react';
import { useState } from 'react';

import type { BattleSummary, StackRequest } from '@/engine/types';
import { Disclosure } from '@/ui/kit';
import { copyText } from '@/ui/profile/download';

import { amount } from './format';
import { journalHeader, journalText, storyLines } from './journal';
import { unitLabel } from './units';

export interface BattleStoryProps {
  request: StackRequest;
  summary: BattleSummary;
}

export function BattleStory({ request, summary }: BattleStoryProps) {
  const [order, setOrder] = useState<'enemyFirst' | 'armyFirst'>('enemyFirst');
  const [copied, setCopied] = useState(false);

  const journal = order === 'armyFirst' ? summary.journals.armyFirst : summary.journals.enemyFirst;
  const title = order === 'armyFirst' ? 'If you strike first' : 'If the monster strikes first';
  const label = (unitId: string): string => unitLabel(unitId, request.units);
  const lines = storyLines(journal, request.enemy, label);

  return (
    <Stack gap="xs">
      <Group justify="space-between" gap="xs">
        <Text component="h4" size="md" fw={600}>
          Battle story
        </Text>
        <SegmentedControl
          size="xs"
          aria-label="Who strikes first"
          value={order}
          data={[
            { value: 'enemyFirst', label: 'Monster first' },
            { value: 'armyFirst', label: 'You first' },
          ]}
          onChange={(value) => {
            setOrder(value === 'armyFirst' ? 'armyFirst' : 'enemyFirst');
          }}
        />
      </Group>

      <Text size="xs" c="dimmed">
        {journalHeader(journal, request.enemy)}
      </Text>

      <Stack component="ol" gap={2} aria-label={title}>
        {lines.map((line) => (
          <Text key={line.n} component="li" size="sm">
            <Text span size="xs" c="dimmed">
              {`Round ${String(line.round)}: `}
            </Text>
            {line.text}
          </Text>
        ))}
      </Stack>

      <Disclosure title="Raw journal" summary={`${amount(journal.totalDamage)} damage in all`}>
        <Stack gap="xs">
          <Table.ScrollContainer minWidth={360} type="native">
            <Table verticalSpacing={4} horizontalSpacing="xs">
              <Table.Caption>{`${title}: every hit, numbered`}</Table.Caption>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Hit</Table.Th>
                  <Table.Th>What happens</Table.Th>
                  <Table.Th ta="right">Hits</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {lines.map((line) => (
                  <Table.Tr key={line.n}>
                    <Table.Th scope="row">{line.n}</Table.Th>
                    <Table.Td>{line.text}</Table.Td>
                    <Table.Td ta="right">{line.hits}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          <Group gap="xs">
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<Copy size={14} aria-hidden />}
              onClick={() => {
                void copyText(journalText(title, journal, request.enemy, label)).then((ok) => {
                  setCopied(ok);
                });
              }}
            >
              Copy the journal
            </Button>
            <Text span role="status" size="xs" c="dimmed">
              {copied ? 'Copied' : ''}
            </Text>
          </Group>
        </Stack>
      </Disclosure>
    </Stack>
  );
}
