/**
 * The one line above the march: what the run is doing, announced politely, and — when the player
 * asked for no motion and the page is one column — the link that takes the place of the scroll the
 * frame would otherwise do for them (design plan §9).
 */
import { selectActiveSetup, useStore } from '@/state/store';

import { Cluster } from '../layout';
import { useResultStore } from '../resultStore';
import { amount, ratio } from '../sections/results/format';
import { useRunStore } from '../sections/results/runStore';
import { MARCH_ANCHOR } from './march';
import { ONE_COLUMN, REDUCED_MOTION, useMediaQuery } from './useMediaQuery';

export function MarchStatus() {
  const running = useResultStore((state) => state.running);
  const hasResult = useResultStore((state) => state.last !== null);
  const priority = useStore((state) => selectActiveSetup(state)?.priority ?? 'none');
  const progress = useRunStore((state) => state.progress);
  const oneColumn = useMediaQuery(ONE_COLUMN);
  const reduced = useMediaQuery(REDUCED_MOTION);

  const searching = running && priority !== 'none';
  const score = (value: number): string => (priority === 'avgDamage' ? amount(value) : ratio(value));
  const message = !running
    ? ''
    : !searching
      ? 'Generating…'
      : progress === null
        ? 'Trying formations…'
        : `Tried ${amount(progress.evaluated)} formations — best ${score(progress.bestScore)}`;

  return (
    <Cluster role="status" gap={2} align="baseline" className="text-muted text-sm">
      {message}
      {reduced && oneColumn && (running || hasResult) ? (
        <a href={`#${MARCH_ANCHOR}`} className="underline">
          Go to march
        </a>
      ) : null}
    </Cluster>
  );
}
