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
import { amount } from '@/ui/sections/march';

export { OBJECTIVE_CHOICES, POOL_LABELS, POOLS };
export type { Priority };

/**
 * The desktop bar's own width class — M3's *expanded* window, and the width the review of
 * 2026-09-13 found the phone bar stretched past any sense at: four chips sharing 1 100 px are
 * 341 px each. From here the bar is wells, a select and Generate, whether or not the March has
 * room for a pane of its own (that is `TWO_PANES`, 1 200 px, and it stays where it was).
 */
export const DESKTOP_BAR = '(min-width: 1024px)';

/**
 * The pool's name in a chip's worth of room (design rule 19 as the review of 2026-09-13 read it:
 * a glyph is never the only label, at any width). The full word is still the field's accessible
 * name and the desktop bar's label.
 */
export const POOL_SHORT: Record<Pool, string> = {
  leadership: 'Lead',
  authority: 'Auth',
  dominance: 'Dom',
};

/**
 * What one pool can hold. The schema asks for a number at or above zero and nothing else, so the
 * ceiling is the bar's: eight digits is already an order of magnitude past the biggest camp in the
 * game, and a figure past it is a typo — a pasted damage total, a doubled keystroke — not a march.
 */
export const POOL_MAX = 100_000_000;

/**
 * Why a pool's figure cannot be marched with, in the words the bar shows — or `null`. The bar does
 * not clamp: a silently corrected figure is a figure the player never sees is wrong (design rule
 * 24 — the form says what is wrong, in words).
 */
export function poolProblem(pool: Pool, value: number): string | null {
  if (!Number.isInteger(value)) return `${POOL_LABELS[pool]} has to be a whole number.`;
  if (value < 0) return `${POOL_LABELS[pool]} cannot be less than zero.`;
  if (value > POOL_MAX) return `${POOL_LABELS[pool]} is over the ${amount(POOL_MAX)} a pool can hold.`;
  return null;
}

/**
 * Why the Objective is locked while the plan method is chosen (owner, 2026-09-15), in the words the
 * bar shows it in.
 *
 * The plan weighs damage against what it costs, so there is no objective left to pick: `planCampaign`
 * declares an `objective` and never reads it (`engine/plan.ts`), `buildPlanRequest` never sends one,
 * and nothing else reads `setup.priority` for that method either — `generate.ts` returns the plan
 * before it reaches the priority search. Locking the control rather than hiding it is a **deliberate
 * exception** to §7.4's *"Toggles that do not apply to the chosen method are hidden, not disabled"*
 * (`docs/plans/design-overhaul.md`) and to rule 15's *"nothing on screen without value"*: the
 * objective is the *bar's* control rather than a rule of one method, so it keeps its place in the tab
 * order's story and says why it cannot be used. The owner chose it after seeing both alternatives —
 * hiding it, and making the plan honour it — and the second is still open as engine work.
 *
 * **Where the sentence goes is the bar's room, not the state** (owner, 2026-09-21: *"could be on the
 * right side of the objective to avoid too high bar… keep it on two lines though for readability, and
 * be aware of mobile"*). It used to be printed under the field on both bars, and both bars paid for it
 * in height — the one edge of the window a thumb and a Generate share: 88 px to 119.7 at 1400,
 * 87 to 134 at 1100, 120 to 164 at 390 (measured 2026-09-21). So:
 *
 * - **from 1200 px** (`TWO_PANES`, where the March has a pane of its own and the bar carries no answer)
 *   it stands **beside** the select, two lines in a column of its own, inside the height the labels and
 *   wells already take — the bar does not grow at all (`CommandBar.tsx`);
 * - **below it**, on the 1024–1199 bar and on the phone's, there is no such room — the four wells
 *   already share the row with the answer — so the sentence goes behind the **ⓘ** beside the control
 *   and is read on a press (`ObjectiveWhy.tsx`), never on a hover a thumb does not have.
 *
 * It is one sentence in one constant either way, and it reaches a screen reader at every width: as the
 * field's own `description` where it is drawn, and as the bubble's `aria-describedby` where it is not —
 * on top of the phone chip's accessible name, which has said *"Objective: decided by the plan"* since
 * the day the control was locked.
 */
export const OBJECTIVE_LOCKED_REASON =
  'The plan weighs damage against what it costs, so it decides this itself.';

export interface CommandBarState {
  /** `null` while no march is selected, which is the one state the bar draws nothing for. */
  housing: BattleSetup['housing'] | null;
  priority: Priority;
  /** The chosen objective in the words the player picked it by. */
  objectiveTitle: string;
  /** True while the method decides the objective for itself: both bars lock the control and say why. */
  objectiveLocked: boolean;
  /** Per pool: what is wrong with the figure it holds, or `null`. Marks the field, no words. */
  problems: Record<Pool, string | null>;
  /** The same thing said once, above the fields — or `null` while every pool is in range. */
  message: string | null;
  setPool: (pool: Pool, value: number | null) => void;
  setObjective: (value: string) => void;
}

export function useCommandBar(): CommandBarState {
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const priority: Priority = setup?.priority ?? 'none';
  const housing = setup?.housing ?? null;

  const problems = Object.fromEntries(
    POOLS.map((pool) => [pool, housing === null ? null : poolProblem(pool, housing[pool])]),
  ) as Record<Pool, string | null>;
  const said = POOLS.map((pool) => problems[pool]).filter((problem) => problem !== null);

  return {
    housing,
    priority,
    objectiveTitle: OBJECTIVE_CHOICES.find((choice) => choice.value === priority)?.title ?? '',
    objectiveLocked: setup?.options.method === 'plan',
    problems,
    message: said.length === 0 ? null : said.join(' '),
    setPool: (pool, value) => {
      if (housing === null) return;
      updateActiveSetup({ housing: { ...housing, [pool]: value ?? 0 } });
    },
    setObjective: (value) => {
      if (isPriority(value)) updateActiveSetup({ priority: value });
    },
  };
}
