import type { ReactNode } from 'react';

import { Button, Dialog, HelpNote } from '../../primitives';

export interface BlockProps {
  title: string;
  /** The one-line "where to find it in game" note every sub-block carries. */
  note: ReactNode;
  /** Controls on the title row: an Add button, a picker, a count. */
  actions?: ReactNode;
  children: ReactNode;
}

/** One sub-block of the Bonuses section: a title, its in-game note, then the pills or fields. */
export function Block({ title, note, actions, children }: BlockProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {actions !== undefined && <div className="flex flex-wrap items-end gap-2">{actions}</div>}
      </div>
      <HelpNote>{note}</HelpNote>
      {children}
    </div>
  );
}

/** The row every group of pills sits in. */
export function PillRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
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

/** The editor behind a pill's gear: a modal with its in-game note, the fields, Done and maybe Remove. */
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
        <HelpNote>{note}</HelpNote>
        {children}
      </div>
    </Dialog>
  );
}

/** A labelled group of fields inside an editor. */
export function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-muted text-xs font-semibold tracking-wide uppercase">{label}</p>
      {children}
    </div>
  );
}
