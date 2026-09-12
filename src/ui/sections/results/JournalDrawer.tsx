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
      <p className="text-muted text-xs" role="status">
        {journalHeader(journal, request.enemy)}
      </p>
      <ol className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line) => (
          <li key={line.n} className="border-line flex gap-2 border-b pb-1.5 last:border-0">
            <span className="text-muted w-6 shrink-0 text-right tabular-nums">{String(line.n)}</span>
            <span className="min-w-0 flex-1">
              {line.text} <span className="text-muted whitespace-nowrap">({String(line.hits)} hits)</span>
            </span>
          </li>
        ))}
      </ol>
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
