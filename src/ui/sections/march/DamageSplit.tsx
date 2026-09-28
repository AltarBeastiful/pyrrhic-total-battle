/**
 * Where this march's damage came from, at the head of the Details fold (owner, 2026-09-18: "let's at
 * least add a recap of troop damage and merc damage in the battle detail on top to help guide us").
 *
 * The fold used to open on a story and a chart and say nothing about the one split a player steers
 * by — how much of the damage the troops did and how much the mercs did. It is the engine's
 * own `damageByPool`, so **the mark on each figure is the housing pool's** (🛡️ 👑 💀, the same
 * glyphs the pool lines in the March pane wear) and the label says what that pool pays for, the way
 * `docs/design.md` §Elsewhere words it: troops, mercenaries, monsters (design rule 21 — one meaning
 * per glyph; the merc stock on the plan's trade is a count of units and not a pool, and its head wears no
 * mark since 2026-09-28). The dominance line is drawn only when a monster fought: an empty pool is a line
 * without value (rule 15).
 *
 * The fourth figure is the one the recap above has never carried (backlog, 2026-09-17: "the recap
 * shows no damage per merc unit") — **the merc line's own damage** over the merc units this march
 * burns for good. **Ten merc units cost one** (`chunks()`, the engine's own recovery rule), which is
 * the same count the plan's trade prints as "Merc", so the two agree on a march. Like every
 * ratio in this app it wears no glyph, exactly as "Damage per silver" and "Per silver" do.
 *
 * **The numerator is 👑 Mercs, not the whole march** (S-105, 2026-09-19; the owner: *"it says over a
 * million but in total they do less than 1M"*, and *"dmg per hired is still broken: it shows a damage
 * per hired almost above total damage"*). It divided `avgDamage` — the three figures beside it added
 * up — by the merc units lost, so on a march whose troops do most of the hitting it printed more than
 * the Mercs figure two cells to its left, which is what he read. It is the Mercs figure over the
 * chunks that bought it: one line of this block divided by another, both already on screen, and the
 * same reading the plan's trade prints as "Per merc" (design rule 5 — one name, one thing).
 *
 * **And it prints short, like the three places that print it** (owner, 2026-09-28: *"simplify the plan table
 * display of merc damage: use 3 digits at most … like nnnK or nnnM or n.nnM"*). It is the same figure the
 * trade's "Per merc", the fold's "Damage a merc" and the recap's own line carry, and on a real account it is
 * a six-figure one — so this figure, the trade's and the fold's wear `compactRatio` ("325K") where the recap
 * already wore `compactTwo` ("325K"), rather than three of the four agreeing and this one printing
 * "325 000" (rule 5).
 *
 * **And the whole block is the worst opening** (S-108, 2026-09-19; the owner: *"damage/silver differs in
 * the plan table and in the battle summary"*). `summary.damageByPool` is the **midpoint** of the two
 * openings; the plan's bar reads the hired stacks' damage off the enemy-first journal (`PlanRepeat.
 * hiredDamage`, S-94 and S-105), so a ratio taken from the midpoint here printed a different number for the
 * same march. The four figures are summed from that journal instead (`./worst`), which keeps the ratio one
 * line of this block divided by another *and* makes it the bar's own — one name, one thing (rule 5).
 *
 * The figures are `Figures` in the contract's grid, all on one line while there is room and two
 * across below the two-pane width, where a 390 px sheet has no room for three seven-figure numbers.
 */
import type { BattleJournal } from '@/engine/types';
import { Glyph } from '@/ui/domain';
import { Figures } from '@/ui/kit';
import type { Figure } from '@/ui/kit';
import { TWO_PANES, useMediaQuery } from '@/ui/shell/useMediaQuery';

import { compact, compactRatio, per, percent } from './format';
import { hiredLost, type HiredStack } from './hired';
import { worstDamageByPool, type SplitStack } from './worst';

/**
 * The one thing this block reads, and nothing else: a fixture in a test is that journal, not a whole battle
 * (`Pick` the way `battle.ts` picks a stack's one field it needs). It read `avgDamage` until S-105 and
 * `damageByPool` until S-108; it is the **enemy-first** journal now, which is where the damage column of
 * the bar and of the recap both come from.
 */
export type DamageSplitSummary = { journals: { enemyFirst: Pick<BattleJournal, 'entries'> } };
/** A stack, as far as this block is concerned: its pool, its type and its count. */
export type DamageSplitStack = HiredStack & SplitStack;

export interface DamageSplitProps {
  summary: DamageSplitSummary;
  /** The march on screen, in kill order: what it burns of the merc stock is counted off these. */
  stacks: readonly DamageSplitStack[];
}

export function DamageSplit({ summary, stacks }: DamageSplitProps) {
  const wide = useMediaQuery(TWO_PANES);
  const { leadership, authority, dominance } = worstDamageByPool(summary.journals.enemyFirst, stacks);
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
      label: 'Mercs',
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
      label: 'Damage a merc',
      value: compactRatio(per(authority, hiredLost(stacks))),
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
