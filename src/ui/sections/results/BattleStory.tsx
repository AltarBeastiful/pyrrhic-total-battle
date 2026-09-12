/**
 * The battle, told (design plan §7.5 step 5). Folded away by default, because a player who is
 * copying counts into the game does not need it — and when they do, the story is the same numbered
 * hits the game's own report prints, in sentences, round by round.
 *
 * The raw journal sits behind one more toggle: it is the table you hold next to the in-game report,
 * not something to read.
 */
import { useState } from 'react';

import type { BattleSummary, StackRequest } from '@/engine/types';
import { Button, Disclosure, Segmented } from '@/ui/kit';
import { Cluster, Stack } from '@/ui/layout';
import { copyText } from '@/ui/profile/download';

import { CopyIcon } from '../../icons';
import { amount } from './format';
import { journalHeader, journalText, storyLines } from './journal';
import { unitLabel } from './units';

const ORDERS = [
  { value: 'enemyFirst', label: 'Monster first' },
  { value: 'armyFirst', label: 'You first' },
];

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
    <Stack gap={2}>
      <Cluster gap={2} justify="between">
        <h4 className="font-display text-lg">Battle story</h4>
        <Segmented
          size="sm"
          label="Who strikes first"
          value={order}
          onChange={(value) => {
            setOrder(value === 'armyFirst' ? 'armyFirst' : 'enemyFirst');
          }}
          options={ORDERS}
        />
      </Cluster>

      <p className="text-muted text-sm">{journalHeader(journal, request.enemy)}</p>

      <Stack as="ol" gap={1} aria-label={title}>
        {lines.map((line) => (
          <li key={line.n}>
            <span className="text-muted text-sm">{`Round ${String(line.round)}: `}</span>
            {line.text}
          </li>
        ))}
      </Stack>

      <Disclosure title="Raw journal" summary={`${amount(journal.totalDamage)} damage in all`}>
        <Stack gap={2}>
          <table className="w-full">
            <caption className="sr-only">{`${title}: every hit, numbered`}</caption>
            <thead>
              <tr>
                <th scope="col" className="text-muted text-sm">
                  Hit
                </th>
                <th scope="col" className="text-muted text-sm">
                  What happens
                </th>
                <th scope="col" className="text-muted text-sm">
                  Hits
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.n}>
                  <th scope="row" className="text-muted nums">
                    {line.n}
                  </th>
                  <td>{line.text}</td>
                  <td className="nums">{line.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Cluster gap={2}>
            <Button
              size="sm"
              icon={<CopyIcon />}
              onPress={() => {
                void copyText(journalText(title, journal, request.enemy, label)).then((ok) => {
                  setCopied(ok);
                });
              }}
            >
              Copy the journal
            </Button>
            <span role="status" className="text-muted text-sm">
              {copied ? 'Copied' : ''}
            </span>
          </Cluster>
        </Stack>
      </Disclosure>
    </Stack>
  );
}
