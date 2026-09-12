import { version as gameData } from '@/data';

import { GuardsmenIcon } from './icons';
import { Banner, Card, Dialog } from './kit';

export interface AboutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** What this is, which game data it ships, and the one privacy promise that matters (ADR-0002). */
export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog isOpen={open} onOpenChange={onOpenChange} title="About Pyrrhic" size="sm">
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="border-accent-line bg-accent-soft text-accent mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-base"
          >
            <GuardsmenIcon />
          </span>
          <p>
            Plan your epic-monster march: enter your account once, switch on the bonuses that apply, and get
            the stack sizes and the damage they should do.
          </p>
        </div>
        <Banner tone="info">
          Nothing leaves your browser. No account, no server, no analytics: your profiles live in this
          browser&apos;s storage until you export or share them yourself, and a share link keeps its data
          after the <code>#</code>, which browsers never send anywhere.
        </Banner>
        <Card tone="sunken" padding="sm">
          <dl className="divide-line divide-y">
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-muted">Game data version</dt>
              <dd className="nums font-medium">{String(gameData.dataVersion)}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1.5">
              <dt className="text-muted">Values verified</dt>
              <dd className="nums font-medium">{gameData.verifiedOn}</dd>
            </div>
          </dl>
        </Card>
        <p className="text-muted text-xs">{gameData.notes}</p>
        <p className="text-muted text-xs">
          Free and open source under the AGPL-3.0. Unit values are game facts, contributed and checked by
          players.
        </p>
        <p className="text-muted text-xs">
          Unit icons from game-icons.net, CC BY 3.0; interface icons from Lucide, ISC; type set in Inter and
          Fraunces, SIL Open Font License. All bundled with the app — nothing is fetched from anyone else.
        </p>
      </div>
    </Dialog>
  );
}
