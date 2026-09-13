/**
 * What the command bar writes, at both widths (design plan §5.6, story D-56).
 *
 * Leadership, authority and dominance change with every march, and so does what a Generate aims
 * at, so they left the Battle card and joined Generate on the bottom edge. The *words* stay where
 * the glossary put them — `sections/battle/choices.ts` — because they are the same words the card
 * still uses for everything else it offers; only the place they are typed in has moved.
 *
 * One hook for both bars: the desktop bar draws the three pools as wells and the objective as a
 * select, the phone's draws them as chips and a popover, and neither of them owns the state.
 */
import type { BattleSetup } from '@/state/schema';
import type { Pool } from '@/engine/types';
import { selectActiveSetup, useStore } from '@/state/store';
import { isPriority, OBJECTIVE_CHOICES, POOL_LABELS, POOLS } from '@/ui/sections/battle/choices';
import type { Priority } from '@/ui/sections/battle/choices';

export { OBJECTIVE_CHOICES, POOL_LABELS, POOLS };
export type { Priority };

export interface CommandBarState {
  /** `null` while no march is selected, which is the one state the bar draws nothing for. */
  housing: BattleSetup['housing'] | null;
  priority: Priority;
  /** The chosen objective in the words the player picked it by. */
  objectiveTitle: string;
  setPool: (pool: Pool, value: number | null) => void;
  setObjective: (value: string) => void;
}

export function useCommandBar(): CommandBarState {
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const priority: Priority = setup?.priority ?? 'none';

  return {
    housing: setup?.housing ?? null,
    priority,
    objectiveTitle: OBJECTIVE_CHOICES.find((choice) => choice.value === priority)?.title ?? '',
    setPool: (pool, value) => {
      const housing = setup?.housing;
      if (housing === undefined) return;
      updateActiveSetup({ housing: { ...housing, [pool]: value ?? 0 } });
    },
    setObjective: (value) => {
      if (isPriority(value)) updateActiveSetup({ priority: value });
    },
  };
}
