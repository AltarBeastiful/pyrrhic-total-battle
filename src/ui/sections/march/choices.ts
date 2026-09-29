/**
 * **What each position of the raise control is called, and the one line that explains it** (design rule 26).
 *
 * One list, read by the two blocks that speak of the same five answers: the control in the battle summary,
 * where a segment is chosen (`MarchPills.tsx`), and the table under the plan, where all five are priced
 * side by side (`PositionTrade.tsx`). It sits in a module of its own because a file of components may not
 * export anything else (`react-refresh/only-export-components`) — and because a name is not a component in
 * the first place (design rule 5: one name per thing, said the same way wherever a reader meets it).
 */
import type { RaiseMode } from './raise';

export const RAISE_CHOICES: readonly { mode: RaiseMode; label: string; help: string }[] = [
  {
    mode: 'off',
    label: 'As is',
    help: 'The counts the march was generated with.',
  },
  {
    mode: 'tens',
    label: 'Most, in tens',
    help: 'Every stack as high as it can go and still fall after your troops, in tens of units.',
  },
  {
    mode: 'most',
    label: 'Most',
    help: 'Every stack as high as it can go and still fall after your troops.',
  },
  {
    mode: 'v2',
    label: 'Best v2',
    help: 'The counts this march hits hardest with under your troops, searched exhaustively over the mercenaries and the monsters together. Slower, and never worse than the counts drawn while it runs.',
  },
  {
    mode: 'safe',
    label: 'Safe',
    help: 'Best v2 held to the mercenary stock the march already burns on screen: no extra chunks of hired units, and never worse than those counts.',
  },
  {
    mode: 'tight',
    label: 'Tight',
    help: 'Best v2 held to the stock the march was generated with — not one extra chunk — so it can only improve on those counts.',
  },
];
