# 0021 — TotalStack's tier colours, observed (2026-09-18)

Observed live on totalstack.ca (the owner's Pro trial, dark theme, 1512 px), Troop Selection, by stepping the
guardsmen "to" control from G1 to G9 and reading the computed style of the value element
(`.td-v2-tier-selector__value`, 13.28 px / 700, Tailwind text classes). Noted to be mimicked on our own
stepper (`TierSelect`, story S-92). No screenshots kept (third-party UI).

## What is coloured

- **The value text only.** The well (`rgba` dark ground, pill radius), the two arrow buttons
  (`--td-v2-text-muted`) and the group label are the same for every tier and every group.
- **One colour a tier, whatever the group**: G1, S1 and E1 all `slate-400`; G3 and M3 `sky-500`; S9, E9 and
  M9 `green-500`. The selected mercenary pill "EMH 6" is written in the same `red-600` as G6 — the picker and
  the steppers share one tier palette.

## The nine, as observed

| Tier | Tailwind class | Computed colour | Ours (`SEEDS.tierN`, design.md §1) |
|---|---|---|---|
| 1 | `text-slate-400` | rgb(148 163 184) | slate — agrees |
| 2 | `text-emerald-200` | rgb(167 243 208) | green — agrees in hue |
| 3 | `text-sky-500` | rgb(14 165 233) | blue — agrees |
| 4 | `text-violet-600` | rgb(124 58 237) | violet — agrees |
| 5 | `text-orange-400` | rgb(251 146 60) | gold — agrees in hue (ours is the warmer metal) |
| 6 | `text-red-600` | rgb(220 38 38) | crimson — agrees |
| 7 | `text-yellow-300` | rgb(253 224 71) | **violet — differs** |
| 8 | `text-slate-200` | rgb(203 213 225) | **teal — differs** |
| 9 | `text-green-500` | rgb(34 197 94) | **white-gold — differs** |

## What we took, and what we did not

Taken: the value written in its tier's ink and nothing else coloured, the ink shared with the tier badge and
the march pill (`tierInk`, now in `kit/tiers.ts`), the muted ink for the "—" position.

Not taken — **tiers VII–IX, left for the owner's call.** Design plan §7.2 called our V–IX inks "a hypothesis
to confirm against an in-game screenshot" (V gold, VI crimson, VII violet, VIII teal, IX white-gold);
TotalStack is a proxy for the game, not the game, and it has VII yellow, VIII silver and IX green. Those
three cannot be copied as they stand into a palette whose nine tier inks sit at one luminance (design.md
§1): at ink luminance a yellow is an olive next to tier V's gold, a silver lands on tier I's slate, and a
second green beside tier II's is the collision the tier-II choice was made to avoid. TotalStack keeps them
apart by *lightness* (a pale emerald II against a saturated green IX), which our ladder gives up on purpose.
The owner's own account tops out at tier VI today, where the two palettes agree.
