/**
 * **What each position of the raise control is called, and the one line that explains it** (design rule 26).
 *
 * Two answers are offered since the owner's call of 2026-10-07: *"Tight almost always feels better than as is
 * and no other even compares as they always use more mercs. [...] removing the table and other options on the
 * selector; lets keep as is for now"*, and `Tight (old)` beside it for the comparison. The other positions stay in the kernel and in experiments 180/184; the
 * control just stops offering them, and the table that priced all five side by side is gone with them.
 *
 * It sits in a module of its own because a file of components may not export anything else
 * (`react-refresh/only-export-components`) — and because a name is not a component in the first place
 * (design rule 5: one name per thing, said the same way wherever a reader meets it).
 */
import type { RaiseMode } from './raise';

export const RAISE_CHOICES: readonly { mode: RaiseMode; label: string; help: string }[] = [
  {
    mode: 'off',
    label: 'As is',
    help: 'The counts the march was generated with.',
  },
  {
    mode: 'tight',
    label: 'Tight',
    help: 'Raises the hired stacks without burning one more chunk of mercs than the march was generated with, and only where the extra damage is worth the silver and gold it costs.',
  },
  /**
   * **The Tight that shipped before experiment 188, for comparison** (owner, 2026-10-07: *"add tight-old using
   * previous way to compute tight (only added damage) so we can compare"*): the same search and cap, ranked
   * on damage alone. A comparison position, to be taken out once the owner has settled between the two.
   */
  {
    mode: 'tightOld',
    label: 'Tight (old)',
    help: 'The previous Tight: the same cap on mercs, but every extra unit that adds damage is taken, whatever silver and gold it costs.',
  },
];
