import { useState } from 'react';

import type { BattleJournal, StackRequest } from '@/engine/types';
import { CheckIcon, CopyIcon } from '@/ui/icons';
import { Button, Drawer, HelpNote, Tabs } from '@/ui/primitives';
import { copyText } from '@/ui/profile/download';

import { amount } from './format';
import { journalHeader, journalLines, journalText } from './journal';
import { unitLabel } from './units';

export interface JournalDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: StackRequest;
  journals: { enemyFirst: BattleJournal; armyFirst: BattleJournal };
}

function JournalList({ journal, request }: { journal: BattleJournal; request: StackRequest }) {
  const lines = journalLines(journal, request.enemy, (unitId) => unitLabel(unitId, request.units));
  return (
    <div className="space-y-2">
      {/* A numbered hit list with a count per row is a table, and reads as one: every cell says
          which hit it belongs to, the same way the report in game numbers them. */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs leading-relaxed">
          <caption className="text-muted pb-1 text-left text-xs">
            {journalHeader(journal, request.enemy)}
          </caption>
          <thead>
            <tr className="text-muted text-left">
              <th scope="col" className="w-8 pr-2 pb-1 text-right font-medium">
                Hit
              </th>
              <th scope="col" className="pb-1 font-medium">
                What happens
              </th>
              <th scope="col" className="w-14 pb-1 pl-2 text-right font-medium">
                Hits
              </th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.n} className="border-line border-t align-top">
                <th scope="row" className="text-muted py-1.5 pr-2 text-right font-normal tabular-nums">
                  {String(line.n)}
                </th>
                <td className="py-1.5">{line.text}</td>
                <td className="text-muted py-1.5 pl-2 text-right tabular-nums">{String(line.hits)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-muted text-xs">Total damage {amount(journal.totalDamage)}.</p>
    </div>
  );
}

/** The battle journal (S-34): the same numbered hit list the game prints, in both strike orders. */
export function JournalDrawer({ open, onOpenChange, request, journals }: JournalDrawerProps) {
  const [tab, setTab] = useState<'enemyFirst' | 'armyFirst'>('enemyFirst');
  const [copied, setCopied] = useState(false);

  const journal = tab === 'armyFirst' ? journals.armyFirst : journals.enemyFirst;
  const title = tab === 'armyFirst' ? 'Your army strikes first' : 'The monster strikes first';

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title="Battle journal"
      description="Who hits what, in order, so you can hold it next to the report in game."
      footer={
        <>
          <span role="status" className="sr-only">
            {copied ? 'The battle journal is on your clipboard.' : ''}
          </span>
          <Button
            icon={copied ? <CheckIcon /> : <CopyIcon />}
            onClick={() => {
              void copyText(
                journalText(title, journal, request.enemy, (unitId) => unitLabel(unitId, request.units)),
              ).then((ok) => {
                setCopied(ok);
                setTimeout(() => {
                  setCopied(false);
                }, 2000);
              });
            }}
          >
            {copied ? 'Copied' : 'Copy as text'}
          </Button>
        </>
      }
    >
      <Tabs
        label="Who strikes first"
        value={tab}
        onValueChange={(next) => {
          setTab(next === 'armyFirst' ? 'armyFirst' : 'enemyFirst');
        }}
        items={[
          {
            value: 'enemyFirst',
            label: 'Monster first',
            content: <JournalList journal={journals.enemyFirst} request={request} />,
          },
          {
            value: 'armyFirst',
            label: 'Army first',
            content: <JournalList journal={journals.armyFirst} request={request} />,
          },
        ]}
      />
      <HelpNote className="mt-3">
        Who strikes first is a coin flip in game, which is why the summary shows a minimum and a maximum.
        Enemy squads are named in formation order: the model gives each squad one attack per round but does
        not know which of them the game shows first.
      </HelpNote>
    </Drawer>
  );
}
