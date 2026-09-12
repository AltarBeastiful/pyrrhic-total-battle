import type { ImportMode, ParsedImport } from '@/share/exportImport';

import { Button, Dialog, HelpNote } from '../primitives';

export interface ImportDialogProps {
  /** The validated file, or null while only an error has to be shown. */
  parsed: ParsedImport | null;
  error: string | null;
  onApply: (mode: ImportMode) => void;
  onClose: () => void;
}

const date = (at: number): string => new Date(at).toLocaleDateString();

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/** Preview of an imported file; nothing touches the store until the user picks add or replace. */
export function ImportDialog({ parsed, error, onApply, onClose }: ImportDialogProps) {
  const open = parsed !== null || error !== null;
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Import"
      description="Check what the file contains before it is added to this browser."
      size="sm"
      footer={
        parsed === null ? (
          <Button onClick={onClose}>Close</Button>
        ) : (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              onClick={() => {
                onApply('replace');
              }}
            >
              Replace active
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onApply('add');
              }}
            >
              Add as new
            </Button>
          </>
        )
      }
    >
      {error !== null && <HelpNote tone="danger">{error}</HelpNote>}
      {parsed !== null && (
        <div className="divide-line divide-y">
          <Row label="Kind" value={parsed.kind === 'profile' ? 'Profile' : 'Saved stack'} />
          <Row label="Name" value={parsed.preview.name} />
          <Row label="Created" value={date(parsed.preview.createdAt)} />
          {parsed.kind === 'profile' ? (
            <>
              <Row label="Battle setups" value={String(parsed.preview.setups)} />
              <Row label="Saved stacks" value={String(parsed.preview.savedStacks)} />
              <Row label="Mercenaries" value={String(parsed.preview.mercenaries)} />
              <Row label="Bonus sources" value={String(parsed.preview.bonusSources)} />
            </>
          ) : (
            <>
              <Row label="Stacks" value={String(parsed.preview.stacks)} />
              <Row label="Units" value={parsed.preview.units.toLocaleString('en-US')} />
              <Row
                label="Average damage"
                value={Math.round(parsed.preview.avgDamage).toLocaleString('en-US')}
              />
            </>
          )}
          <Row label="Game data version" value={String(parsed.dataVersion)} />
        </div>
      )}
    </Dialog>
  );
}
