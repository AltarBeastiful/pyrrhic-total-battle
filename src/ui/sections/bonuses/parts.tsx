import type { ReactNode } from 'react';

import { InfoIcon } from '../../icons';
import { Button, Card, Dialog, HelpNote } from '../../primitives';

export interface BlockProps {
  title: string;
  /** The block's glyph, in a small chip left of the title. Decorative. */
  icon?: ReactNode;
  /** One line, in our words, saying what this block holds. */
  description: ReactNode;
  /** The screen the numbers are read on; shown as the block's footnote. */
  where: ReactNode;
  /** Controls on the title row: an Add button, a picker, a count. */
  actions?: ReactNode;
  children: ReactNode;
}

/** One block of the Bonuses section: a titled row, its chips, and where to find the numbers in game. */
export function Block({ title, icon, description, where, actions, children }: BlockProps) {
  return (
    <div className="space-y-2 py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2">
            {icon !== undefined && (
              <span
                aria-hidden="true"
                className="border-accent-line/60 bg-accent-soft text-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[0.8rem]"
              >
                {icon}
              </span>
            )}
            {title}
          </h3>
          <p className="text-muted mt-1 text-xs">{description}</p>
        </div>
        {actions !== undefined && <div className="flex flex-wrap items-end gap-2">{actions}</div>}
      </div>
      {children}
      <p className="text-muted flex items-start gap-1.5 text-xs">
        <span aria-hidden="true" className="text-info mt-px shrink-0">
          <InfoIcon />
        </span>
        <span className="min-w-0">
          <span className="font-semibold">Where to find it in game:</span> {where}
        </span>
      </p>
    </div>
  );
}

/** The tight grid every group of chips sits in: one column on a phone, as many as fit above it. */
export function ChipGrid({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

/**
 * The short value a chip carries. It wraps onto a second line rather than cutting a word in half,
 * and stops there — anything longer is in the editor behind the gear.
 */
export function ChipValueText({ children }: { children: string }) {
  return (
    <span className="nums line-clamp-2 block max-w-[13rem] text-left" title={children}>
      {children}
    </span>
  );
}

export interface SourceDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Where the numbers are read in game; shown at the top of every editor. */
  note: ReactNode;
  /** Shown as a destructive button next to Done when the entry can be deleted. */
  onRemove?: () => void;
  removeLabel?: string;
  children: ReactNode;
}

/** The editor behind a chip's gear: a modal with its in-game note, the fields, Done and maybe Remove. */
export function SourceDialog({
  open,
  onClose,
  title,
  note,
  onRemove,
  removeLabel = 'Remove',
  children,
}: SourceDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      footer={
        <>
          {onRemove !== undefined && (
            <Button variant="danger" onClick={onRemove}>
              {removeLabel}
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <HelpNote>
          <span className="font-semibold">Where to find it in game:</span> {note}
        </HelpNote>
        {children}
      </div>
    </Dialog>
  );
}

/** A labelled group of fields inside an editor, on the surface one step in from the dialog. */
export function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Card tone="raised" className="space-y-2">
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
      {children}
    </Card>
  );
}

/** What a source is worth right now, as the editors list it under a heading. */
export function WorthList({ lines, empty }: { lines: string[]; empty: string }) {
  if (lines.length === 0) return <p className="text-muted text-sm">{empty}</p>;
  return (
    <ul className="space-y-0.5 text-sm">
      {lines.map((line) => (
        <li key={line} className="nums">
          {line}
        </li>
      ))}
    </ul>
  );
}
