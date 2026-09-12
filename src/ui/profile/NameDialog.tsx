import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button, Dialog } from '../primitives';

export interface NameDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  /** Label of the text field; "Profile name" unless a caller needs something else. */
  fieldLabel?: string;
  confirmLabel: string;
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

/** The one dialog behind New, Rename and Duplicate: a single name, Enter to confirm. */
export function NameDialog({
  open,
  title,
  description,
  fieldLabel = 'Profile name',
  confirmLabel,
  initialName,
  onConfirm,
  onCancel,
}: NameDialogProps) {
  const [name, setName] = useState(initialName);
  const [seed, setSeed] = useState(initialName);

  // A new invocation (different starting name) refills the field.
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
        <label className="text-muted text-xs font-medium" htmlFor="profile-name">
          {fieldLabel}
        </label>
        <input
          id="profile-name"
          autoFocus
          value={name}
          onChange={(event) => {
            setName(event.target.value);
          }}
          className="tap border-line bg-surface text-fg mt-1 w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
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
