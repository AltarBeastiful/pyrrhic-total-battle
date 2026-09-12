import { useId, useState } from 'react';
import type { ReactNode } from 'react';

import type { Profile, SavedStack } from '@/state/schema';
import { useStore } from '@/state/store';
import { Button, Card, Dialog, HelpNote, IconButton } from '@/ui/primitives';
import { PencilIcon, TrashIcon } from '@/ui/icons';

import { amount, duration, ratio } from './format';
import { unitLabel } from './units';

const DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

/** How many saved stacks fit side by side before the table stops being readable on a phone. */
export const MAX_COMPARED = 3;

// ---- Name dialog -------------------------------------------------------------------------------------
export interface StackNameDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

/** Save and Rename share one dialog: a single name, Enter to confirm. */
export function StackNameDialog({
  open,
  title,
  description,
  confirmLabel,
  initialName,
  onConfirm,
  onCancel,
}: StackNameDialogProps) {
  const fieldId = useId();
  const [name, setName] = useState(initialName);
  const [seed, setSeed] = useState(initialName);
  if (seed !== initialName) {
    setSeed(initialName);
    setName(initialName);
  }
  const trimmed = name.trim();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
      title={title}
      {...(description === undefined ? {} : { description })}
      size="sm"
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (trimmed !== '') onConfirm(trimmed);
        }}
      >
        <label className="text-muted text-xs font-medium" htmlFor={fieldId}>
          Stack name
        </label>
        <input
          id={fieldId}
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          className="tap border-field bg-surface text-fg mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
        />
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={trimmed === ''}>
            {confirmLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

// ---- Comparison --------------------------------------------------------------------------------------
interface Row {
  label: string;
  values: number[];
  format: (value: number) => string;
  /** Which end of the row is the good one; `none` for plain counts. */
  best: 'high' | 'low' | 'none';
}

function bestIndexes(row: Row): Set<number> {
  if (row.best === 'none' || row.values.length < 2) return new Set();
  const unique = new Set(row.values);
  if (unique.size === 1) return new Set();
  const target = row.best === 'high' ? Math.max(...row.values) : Math.min(...row.values);
  const winners = new Set<number>();
  row.values.forEach((value, index) => {
    if (value === target) winners.add(index);
  });
  return winners;
}

function compareRows(stacks: SavedStack[]): { metrics: Row[]; counts: Row[] } {
  const pick = (
    label: string,
    read: (stack: SavedStack) => number,
    format: (value: number) => string,
    best: Row['best'],
  ): Row => ({ label, values: stacks.map(read), format, best });

  const metrics: Row[] = [
    pick('Stacks', (stack) => stack.counts.length, amount, 'none'),
    pick('Expected damage', (stack) => stack.summary.avgDamage, amount, 'high'),
    pick('Damage if the monster strikes first', (stack) => stack.summary.minDamage, amount, 'high'),
    pick('Damage if you strike first', (stack) => stack.summary.maxDamage, amount, 'high'),
    pick('Value per silver', (stack) => stack.summary.damagePerSilver, ratio, 'high'),
    pick('Value per gold', (stack) => stack.summary.damagePerGold, ratio, 'high'),
    pick('Value per dragon coin', (stack) => stack.summary.damagePerDragonCoin, ratio, 'high'),
    pick('Recovery silver', (stack) => stack.summary.recovery.silver, amount, 'low'),
    pick('Recovery gold', (stack) => stack.summary.recovery.gold, amount, 'low'),
    pick('Recovery dragon coins', (stack) => stack.summary.recovery.dragonCoins, amount, 'low'),
    pick('Recovery time', (stack) => stack.summary.recovery.seconds, duration, 'low'),
  ];

  const unitIds: string[] = [];
  for (const stack of stacks) {
    for (const entry of stack.counts) if (!unitIds.includes(entry.unitId)) unitIds.push(entry.unitId);
  }
  const counts: Row[] = unitIds.map((unitId) => ({
    label: unitLabel(unitId),
    values: stacks.map((stack) => stack.counts.find((entry) => entry.unitId === unitId)?.count ?? 0),
    format: amount,
    best: 'none',
  }));

  return { metrics, counts };
}

function CompareTable({ stacks }: { stacks: SavedStack[] }) {
  const { metrics, counts } = compareRows(stacks);
  const renderRows = (rows: Row[]): ReactNode =>
    rows.map((row) => {
      const winners = bestIndexes(row);
      return (
        <tr key={row.label} className="border-line border-t">
          <th scope="row" className="text-muted py-1.5 pr-3 text-left font-medium">
            {row.label}
          </th>
          {row.values.map((value, index) => (
            <td
              key={`${row.label}-${String(index)}`}
              className={
                winners.has(index)
                  ? 'text-accent nums py-1.5 text-right font-semibold'
                  : 'nums py-1.5 text-right'
              }
            >
              {row.format(value)}
              {winners.has(index) && <span className="sr-only"> (best)</span>}
            </td>
          ))}
        </tr>
      );
    });

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[24rem] text-xs">
        <thead>
          <tr>
            <th scope="col" className="py-1.5 pr-3 text-left">
              Metric
            </th>
            {stacks.map((stack) => (
              <th key={stack.id} scope="col" className="py-1.5 text-right">
                {stack.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {renderRows(metrics)}
          <tr className="border-line border-t">
            <th scope="row" colSpan={stacks.length + 1} className="text-muted pt-3 pb-1 text-left">
              Unit counts
            </th>
          </tr>
          {renderRows(counts)}
        </tbody>
      </table>
    </div>
  );
}

// ---- Saved stacks panel -------------------------------------------------------------------------------
export interface SavedStacksPanelProps {
  profile: Profile;
}

/** The saved stacks of the active profile, with rename, delete and side-by-side comparison (S-43). */
export function SavedStacksPanel({ profile }: SavedStacksPanelProps) {
  const renameSavedStack = useStore((state) => state.renameSavedStack);
  const removeSavedStack = useStore((state) => state.removeSavedStack);
  const [selected, setSelected] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<SavedStack | null>(null);
  const [deleting, setDeleting] = useState<SavedStack | null>(null);
  const [comparing, setComparing] = useState(false);

  const stacks = profile.savedStacks;
  const chosen = stacks.filter((stack) => selected.includes(stack.id));

  const toggle = (id: string): void => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : current.length >= MAX_COMPARED
          ? current
          : [...current, id],
    );
  };

  return (
    <Card tone="raised" padded={false} className="p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Saved stacks</h3>
        <Button
          size="sm"
          disabled={chosen.length < 2}
          onClick={() => {
            setComparing(true);
          }}
        >
          Compare ({String(chosen.length)})
        </Button>
      </div>

      {stacks.length === 0 ? (
        <p className="text-muted text-xs">
          Nothing saved yet. Generate a march and use “Save stack” to keep it for later.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {stacks.map((stack) => (
            <li
              key={stack.id}
              className="border-line bg-surface flex items-center gap-2 rounded-lg border px-2 py-1.5"
            >
              <input
                type="checkbox"
                id={`compare-${stack.id}`}
                checked={selected.includes(stack.id)}
                disabled={!selected.includes(stack.id) && selected.length >= MAX_COMPARED}
                onChange={() => {
                  toggle(stack.id);
                }}
                className="tap-area h-4.5 w-4.5 shrink-0"
              />
              <label
                htmlFor={`compare-${stack.id}`}
                className="tap flex min-w-0 flex-1 cursor-pointer flex-col justify-center py-1"
              >
                <span className="block truncate text-sm font-medium">{stack.name}</span>
                <span className="text-muted nums block text-xs">
                  {DATE.format(stack.createdAt)} · {amount(stack.summary.avgDamage)} expected damage ·{' '}
                  {String(stack.counts.length)} stacks
                </span>
              </label>
              <IconButton
                label={`Rename ${stack.name}`}
                icon={<PencilIcon />}
                onClick={() => {
                  setRenaming(stack);
                }}
              />
              <IconButton
                label={`Delete ${stack.name}`}
                icon={<TrashIcon />}
                variant="danger"
                onClick={() => {
                  setDeleting(stack);
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {stacks.length > 1 && chosen.length < 2 && (
        <p className="text-muted mt-2 text-xs">Tick two or three stacks to compare them side by side.</p>
      )}

      <StackNameDialog
        open={renaming !== null}
        title="Rename saved stack"
        confirmLabel="Save"
        initialName={renaming?.name ?? ''}
        onConfirm={(name) => {
          if (renaming) renameSavedStack(renaming.id, name);
          setRenaming(null);
        }}
        onCancel={() => {
          setRenaming(null);
        }}
      />

      <Dialog
        open={deleting !== null}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete saved stack"
        description={`“${deleting?.name ?? ''}” will be removed from this profile.`}
        size="sm"
        footer={
          <>
            <Button
              onClick={() => {
                setDeleting(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleting) {
                  removeSavedStack(deleting.id);
                  setSelected((current) => current.filter((id) => id !== deleting.id));
                }
                setDeleting(null);
              }}
            >
              Delete stack
            </Button>
          </>
        }
      >
        <HelpNote tone="warn">
          The result itself is not stored anywhere else — this cannot be undone.
        </HelpNote>
      </Dialog>

      <Dialog
        open={comparing}
        onOpenChange={setComparing}
        title="Compare saved stacks"
        description="The best figure in each row is marked."
        size="lg"
      >
        {chosen.length >= 2 ? (
          <CompareTable stacks={chosen} />
        ) : (
          <HelpNote>Pick at least two saved stacks.</HelpNote>
        )}
      </Dialog>
    </Card>
  );
}
