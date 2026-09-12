/**
 * The editor behind a row's gear (design plan §7.3): a sheet — from the bottom on a phone, from the
 * right once there is room — whose description line is where the figures are read in game, and
 * whose first block repeats the TOTAL, so the player sees the three figures move as they type.
 *
 * Every editor in this folder is this shell plus its own fields. Nothing is edited inline any more.
 */
import type { ReactNode } from 'react';

import { Button, Card, Sheet } from '@/ui/kit';
import { Stack } from '@/ui/layout';

import type { TotalsSummary } from './rows';
import { TotalsFigures } from './TotalsFigures';

export interface SourceSheetProps {
  /** The source's own name; it is the sheet's accessible name too. */
  title: string;
  /** Where to find it in game, in our words. */
  where: string;
  summary: TotalsSummary;
  onClose: () => void;
  /** Given when the entry can be deleted; shown as the destructive button beside Done. */
  onRemove?: () => void;
  removeLabel?: string;
  size?: 'md' | 'lg';
  children: ReactNode;
}

export function SourceSheet({
  title,
  where,
  summary,
  onClose,
  onRemove,
  removeLabel = 'Remove',
  size = 'md',
  children,
}: SourceSheetProps) {
  return (
    <Sheet
      isOpen
      size={size}
      title={title}
      description={where}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      footer={
        <>
          {onRemove !== undefined && (
            <Button variant="danger" onPress={onRemove}>
              {removeLabel}
            </Button>
          )}
          <Button variant="primary" onPress={onClose}>
            Done
          </Button>
        </>
      }
    >
      <Stack gap={4}>
        <Card tone="sunken" padding="sm">
          <TotalsFigures summary={summary} size="sm" />
        </Card>
        {children}
      </Stack>
    </Sheet>
  );
}

/** A labelled block of fields inside an editor. */
export function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap={2} as="section" aria-label={label}>
      <h5 className="text-sm font-medium">{label}</h5>
      {children}
    </Stack>
  );
}

/** What a source is worth right now, one line per key, as the editors list it. */
export function WorthList({ lines, empty }: { lines: string[]; empty: string }) {
  if (lines.length === 0) return <p className="text-muted text-sm">{empty}</p>;
  return (
    <ul className="nums text-sm">
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}
