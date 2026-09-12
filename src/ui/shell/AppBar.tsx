/**
 * The app bar (Material 3's small top app bar, 64 dp — design plan §5.0/§5.2). The one bar that
 * follows the page down, and with the floating button the only thing that does.
 *
 * Its anatomy is M3's: a leading brand mark, a headline area, trailing actions. The headline is not
 * a title — the page has one of those in every card you are reading — it is the **answer**: the
 * figures the last run produced, a mark when the setup has moved under them, and from a medium
 * window (600 dp) the unit tiles of the march they describe. That is what makes 64 dp of sticky
 * chrome worth having: you can edit anything and still see what you last got.
 */
import { unitById } from '@/data';

import { UnitTile } from '../domain';
import { GenerateIcon, GuardsmenIcon } from '../icons';
import { Badge, Button, Tooltip } from '../kit';
import { Cluster } from '../layout';
import { useResultStore } from '../resultStore';
import { amount, compact } from '../sections/results/format';
import { AccountMenu } from './AccountMenu';
import { useGenerateRun } from './useGenerateRun';
import { MEDIUM, useMediaQuery } from './useMediaQuery';

/** As many tiles as the bar can carry without crowding the figures; the rest are counted. */
const MAX_TILES = 6;

/** "avg 1.67M · min 1.29M · 2 hits", the march it belongs to, and whether it still stands. */
function MarchAnswer({ stale }: { stale: boolean }) {
  const last = useResultStore((state) => state.last);
  const medium = useMediaQuery(MEDIUM);

  // A compact window has room for the brand and the two controls, and nothing else.
  if (!medium) return null;

  if (last === null) {
    return (
      <Cluster gap={2} wrap={false} className="min-w-0 flex-1">
        <span className="text-muted text-sm">No march yet</span>
      </Cluster>
    );
  }

  const { summary, result } = last;
  const hits = summary.journals.enemyFirst.friendlyHits;
  const units = result.stacks.slice(0, MAX_TILES).flatMap((stack) => {
    const unit = unitById(stack.unitId);
    return unit === undefined ? [] : [unit];
  });
  const rest = result.stacks.length - units.length;

  return (
    <Cluster gap={3} wrap={false} className="min-w-0 flex-1">
      <span className="text-muted nums truncate text-sm">
        {`avg ${compact(summary.avgDamage)} · min ${compact(summary.minDamage)} · ${amount(hits)} `}
        {hits === 1 ? 'hit' : 'hits'}
      </span>

      {/* The mark is a word, never a colour on its own; what it means is spoken in full. */}
      {stale ? (
        <Badge tone="warn" size="sm">
          changed<span className="sr-only"> since this result</span>
        </Badge>
      ) : null}

      <Cluster gap={1} wrap={false} className="min-w-0 overflow-hidden">
        {units.map((unit) => (
          <UnitTile key={unit.id} unit={unit} size="sm" />
        ))}
        {rest > 0 ? <Badge>+{amount(rest)}</Badge> : null}
      </Cluster>
    </Cluster>
  );
}

/**
 * Generate, for a screen wide enough to show the supporting pane. Below `xl` the floating button is
 * the one on screen instead, so the two are never visible together.
 */
function GenerateAction() {
  const { state, hint, press } = useGenerateRun();
  const name = hint === null ? 'Generate march' : `Generate march: ${hint}`;

  return (
    <span data-state={state} className="hidden xl:block">
      <Tooltip content={hint ?? 'Ctrl + Enter'}>
        <Button
          variant="primary"
          aria-label={name}
          icon={<GenerateIcon />}
          isPending={state === 'running'}
          isDisabled={state === 'blocked'}
          onPress={press}
        >
          {state === 'running' ? 'Cancel' : 'Generate'}
        </Button>
      </Tooltip>
    </span>
  );
}

export function AppBar() {
  const { state } = useGenerateRun();

  return (
    <header className="bg-bg sticky top-0 z-30">
      <div className="border-line border-b px-4 sm:px-6">
        <Cluster justify="between" wrap={false} gap={3} className="h-appbar mx-auto max-w-screen-2xl">
          <Cluster gap={2} align="baseline" wrap={false}>
            <span aria-hidden="true" className="text-accent">
              <GuardsmenIcon />
            </span>
            <h1 className="font-display text-lg">Pyrrhic</h1>
            <span className="text-muted hidden text-xs sm:inline">Total Battle</span>
          </Cluster>

          <MarchAnswer stale={state === 'stale'} />

          <Cluster gap={2} wrap={false}>
            <GenerateAction />
            <AccountMenu />
          </Cluster>
        </Cluster>
      </div>
    </header>
  );
}
