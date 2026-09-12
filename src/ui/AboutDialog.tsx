import { version as gameData } from '@/data';

import { Dialog, HelpNote } from './primitives';

export interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** What this is, which game data it ships, and the one privacy promise that matters (ADR-0002). */
export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="About Pyrrhic" size="sm">
      <div className="space-y-3 text-sm">
        <p>
          A free stacking calculator for Total Battle epic monsters: enter your account once, pick the bonuses
          that apply to a march, and get the stack sizes and the damage it should do.
        </p>
        <HelpNote tone="info">
          Nothing leaves your browser. No account, no server, no analytics: your profiles live in this
          browser&apos;s storage until you export or share them yourself, and a share link keeps its data
          after the <code>#</code>, which browsers never send anywhere.
        </HelpNote>
        <dl className="divide-line divide-y">
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-muted">Game data version</dt>
            <dd className="font-medium">{String(gameData.dataVersion)}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-muted">Values verified</dt>
            <dd className="font-medium">{gameData.verifiedOn}</dd>
          </div>
        </dl>
        <p className="text-muted text-xs">{gameData.notes}</p>
        <p className="text-muted text-xs">
          Free and open source under the AGPL-3.0. Unit values are game facts, contributed and checked by
          players.
        </p>
      </div>
    </Dialog>
  );
}
