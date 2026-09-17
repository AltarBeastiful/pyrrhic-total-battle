/**
 * Where this march's damage came from, at the head of the Details fold (owner, 2026-09-18: "let's at
 * least add a recap of troop damage and merc damage in the battle detail on top to help guide us").
 *
 * The fold used to open on a story and a chart and say nothing about the one split a player steers
 * by — how much of the damage the troops did and how much the hired units did. It is the engine's
 * own `damageByPool`, so **the mark on each figure is the housing pool's** (🛡️ 👑 💀, the same
 * glyphs the pool lines in the March pane wear) and the label says what that pool pays for, the way
 * `docs/design.md` §Elsewhere words it: troops, mercenaries, monsters (design rule 21 — one meaning
 * per glyph; 🪖 stays the *hired stock* on the plan's trade, which is a count of units and not a
 * pool). The dominance line is drawn only when a monster fought: an empty pool is a line without
 * value (rule 15).
 *
 * The fourth figure is the one the recap above has never carried (backlog, 2026-09-17: "the recap
 * shows no damage per hired unit") — the expected damage over the hired units this march burns for
 * good. **Ten hired units cost one** (`chunks()`, the engine's own recovery rule), which is the same
 * count the plan's trade prints as "Hired lost", so the two agree on a march. Like every ratio in
 * this app it wears no glyph, exactly as "Damage per silver" and "Per silver" do.
 *
 * The figures are `Figures` in the contract's grid, all on one line while there is room and two
 * across below the two-pane width, where a 390 px sheet has no room for three seven-figure numbers.
 */
import type { BattleSummary } from '@/engine/types';
import { Glyph } from '@/ui/domain';
import { Figures } from '@/ui/kit';
import type { Figure } from '@/ui/kit';
import { TWO_PANES, useMediaQuery } from '@/ui/shell/useMediaQuery';

import { compact, per, percent, ratio } from './format';
import { hiredLost, type HiredStack } from './hired';

/**
 * The two figures this block reads, and nothing else: a fixture in a test is the pair of numbers, not
 * a whole battle (`Pick` the way `battle.ts` picks a stack's one field it needs).
 */
export type DamageSplitSummary = Pick<BattleSummary, 'avgDamage' | 'damageByPool'>;
/** A stack, as far as the hired count is concerned. */
export type DamageSplitStack = HiredStack;

export interface DamageSplitProps {
  summary: DamageSplitSummary;
  /** The march on screen, in kill order: what it burns of the hired stock is counted off these. */
  stacks: readonly DamageSplitStack[];
}

export function DamageSplit({ summary, stacks }: DamageSplitProps) {
  const wide = useMediaQuery(TWO_PANES);
  const { leadership, authority, dominance } = summary.damageByPool;
  // The three pools *are* the damage, so the shares are read off their own total and add to 100 %.
  const total = leadership + authority + dominance;
  const share = (value: number): string =>
    total > 0 ? ` · ${percent(Math.round((value / total) * 100))}` : '';

  const items: Figure[] = [
    {
      key: 'troops',
      label: 'Troops',
      glyph: <Glyph kind="leadership" />,
      value: `${compact(leadership)}${share(leadership)}`,
    },
    {
      key: 'hired',
      label: 'Hired',
      glyph: <Glyph kind="authority" />,
      value: `${compact(authority)}${share(authority)}`,
    },
    ...(dominance === 0
      ? []
      : [
          {
            key: 'monsters',
            label: 'Monsters',
            glyph: <Glyph kind="dominance" />,
            value: `${compact(dominance)}${share(dominance)}`,
          },
        ]),
    {
      key: 'perHired',
      label: 'Damage a hired unit',
      value: ratio(per(summary.avgDamage, hiredLost(stacks))),
    },
  ];

  return (
    <Figures
      label="Where this march's damage came from"
      layout="grid"
      columns={wide ? items.length : 2}
      items={items}
    />
  );
}
