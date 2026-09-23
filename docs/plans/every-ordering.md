# Every ordering, rated — implementation plan (W13)

**Status: 2026-09-23. Drafted, checked by a subagent against the code, and corrected (this version). Work starts after
166/167 land in `plan.ts`.**

The owner, 2026-09-23: *"Still think it should be offered as an alternative … so we can improve some stack that actually
benefit from it. Also I thought we already were exploring all possible ordering … start with the optional rule anyway
and try to build from here, only committing if we improve everywhere as we're pretty good now."*

## 0. What is measured (experiment 168, `tools/theorycraft/out/168-do-the-low-tiers-die-first.md`)

- 59 of 61 stops put a higher tier above a lower one. All are near-ties: the worst is ×1.10 HP. No hired stack stands
  above a troop.
- Tier order imposed after the fact, march level: 12 of 119 rate > 0, the best **+0.08** (§B's table; §Z's "under
  +0.005" is wrong), and 107 rate < 0 (worst −22.59). Low tiers attack last in a round, so as the first stacks the
  enemy wipes, they die before their turn.
- Tier order forced at sizing: 9 stops better / 1 equal / 47 worse, TotalStack 70 → 59.
- The owner's current setup, replayed in the browser: his hand-crafted march is what the silver saver generates now
  (1.768 against 1.777 damage a silver). His "+13 %" was against an older build.

## 1. Where orderings are explored today (checked against the code)

| step | orderings compared | criterion |
|---|---|---|
| ladders (`orderFor`, plan.ts ~1565) | pairwise swaps, learned once per depth and cached; the finale's ladders share the cache; the all-in builds a new scorer per march and relearns | damage |
| S-97 / S-99 / 165 maxima (`biggestLadder` → `buildLadder`, ~3082) | none: the ranking's order | — |
| winner rungs | none | — |
| `resizeMarchOver` ladders (~2045) | none: the order it is handed | — |
| `tighterShape`, the tail (~4350, ~2318) | none: the sizer's order | — |
| sizer shapes, put-back rungs | none: S-22's tier order (Elite, MS), apart from rounding near-ties | — |
| re-typing (`retypeMarch`) | every assignment ≤ 5 000, else a swap/replace climb from the march as it is | `rate()`, only above the march's own damage (retype.ts ~120), then the hired/shelter guard, the silver-saver rule, `keepReadings` and the deadline in `plan.ts` |
| band rows | none | — |

**The finding the draft missed:** 87 of 120 marches fall back to the climb, not the exhaustive walk (159). It is enough
to have 5 stacks over 9 types (15 120 > 5 000). So tier order is searched on only about a quarter of marches, and the
climb starts only from the march as it is.

## 2. Work, each step measured and committed only if it improves everywhere

**The gate:**
- 0 stops rated worse (`rate()` against HEAD on every army; stops paired by pick, a stop the bar re-chose is listed
  and rated against the stop it replaced);
- no bar reading worse on any army;
- TotalStack at matched spend no worse (70/13);
- the bar criteria hold (order, no stop beaten, shelter, sustain, ≤ 5 stops, sweet spot, S-58 B);
- the suite's reds unchanged by name.

Runs are measured with `budgetMs` off, so the deadline cannot make a result depend on the machine. A step that fails
the gate is reported and not committed.

1. **Tier order and more seeds, inside `retypeMarch`** (the old steps 1 and 3 merged). Always try the march's own types
   in tier order over its own slots (one battle), and seed the climb from three starts: the march as it is, tier
   order, and the ranking's order. It keeps every guard downstream and cannot disturb the search. Flag:
   `CAMPAIGN.planFixes.tierCandidate`. Experiment 169: the counts of marches where each seed wins, the gate, and the
   time against `RETYPE_SHARE`.
2. **A tier-order seed in `orderFor`**, still on damage. Tier order is one more starting order for the swap climb;
   the rating stays with the re-typing. Experiment 170: the gate and the time.
3. **Last, and only if the cost is acceptable: rung order keyed by (depth, mercenary vector, scale).** Up to about
   5 000 vectors × 8 depths × ~84 battles is roughly 3–4 × 10⁵ battles against about 300 today. Measure the cost
   first. The criterion stays damage (168: silver moves ≤ 0.6 %), unless measured otherwise.

## 3. The permanent test (owner, 2026-09-23), made sound

*"No generated march is beaten by its own tier order"*. The twin is defined as the engine builds it: the march's own
types, in S-22's kill order, over its own slots, each type at least its slot's HP, **not re-scaled**. The test asserts
`rate(march, twin) ≤ 0.01` for every march on the bar, except twins the engine's rules make inadmissible (damage
under the march's own, a silver saver's silver rise, over the leadership); those are listed, not asserted. After step
1 it must hold on every benchmark army. Before step 1, 168's 12 marches are its expected failures.

## 4. Risks

- The rung-order cache is shared with the finale, which 166/167 are changing: steps 2–3 wait for them.
- Near-ties: `rate` is relative, and ±0.01 can flip sign; hence the test's tolerance.
- The bar may re-choose stops (as in 168's prototype), which is why the gate pairs and rates stops rather than
  marches.
