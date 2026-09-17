/**
 * The numbers the app decides for itself: how long a campaign is planned over, how long a search may run,
 * how many plans a trade carries. They are a **policy**, not a fact — the game's own numbers live in
 * `src/data/`, and the player's own live in the profile — so they are gathered here, in one file, where
 * changing how the app behaves does not mean hunting for a constant in the middle of a schema.
 *
 * (Owner, 2026-09-15: "number of marches could be a config in our config files so we can easily set it.
 * Maybe later an advanced options in a menu in the UI." As of S-56 there is no field on the card for the
 * horizon or the silver either, so this file *is* the menu: the reading of a value that looks like a
 * decision starts here.)
 */

export const CAMPAIGN = {
  /**
   * Marches a plan is planned over — the horizon the plan method answers at. Four is the owner's own
   * cadence: an epic event every three days, about three or four marches each.
   *
   * The plan's own search has no opinion about the future. Left to itself it answers with the campaign that
   * maximises total damage, which on a real account is 66 marches and 313 days of training
   * (`tools/theorycraft/out/73-plan-horizon.md`) — a figure to read, not a plan to march. The horizon is
   * the *dominant* lever of the answer, which is why it is a number to change here rather than a field to
   * retype, and why it is worth the measurement below.
   *
   * **Why four** (owner, 2026-09-15; experiments 82–85, `out/85-horizon-merc-cost.md`). The horizon buys
   * the hired stock endurance and pays for it with damage: a fielded stack loses `ceil(n/10)` for good, so
   * a longer plan can field less of every type. On the owner's account, a march at each horizon:
   *
   *   | horizon | hired a march | burned a march | damage a march | damage a silver |
   *   |---|---|---|---|---|
   *   | 3 | 227 | 24 | 5,983,998 | 3.63 |
   *   | **4** | 205 | **21** | **6,826,445** | 3.02 |
   *   | 10 | 135 | 14 | 4,638,724 | 2.72 |
   *
   * Four **burns fewer mercenaries than three and does 14 % more damage a march** — it is the peak damage
   * of all ten horizons, and the only one the owner's cadence reaches. Ten (the old default) gave up a
   * third of the damage for endurance nobody was using. Three keeps the best *silver* rate (3.63 against
   * 3.02); four is the better trade when the hired stock is the resource that does not come back.
   */
  marches: 4,
  /**
   * The most plans the S-55 bar may carry. **Three** (owner, 2026-09-17: *"my definite verdict is keep 3 spot
   * on the slider each time"*): the thrift end, the sweet spot and the most damage, and never a filler
   * between them. The engine only ever truncates to this; it never pads.
   */
  planAlternatives: 3,
  /**
   * **S-58 — the two candidate fixes for "the plan drops a whole hired type"**, each behind its own flag so
   * they can be measured against each other before either ships (owner, 2026-09-15: *"implement both behind
   * feature flags and lets compare them after with an experiment for each"*).
   *
   * - `tokenFloor` — fix A: the thrift end of the plan's grid samples **one chunk** of every hired type
   *   instead of none of it (`engine/plan.ts`). A plan may still be thrifty; it cannot be thrifty by
   *   fielding none of a type the account holds.
   * - `refuseDroppedTypes` — fix B: the grid keeps its zero samples and the frontier **band** refuses to
   *   offer a plan that fields none of a stocked type, counting them in `leftOut` like its other refusals.
   *
   * **A is on, B is off** (owner, 2026-09-17: *"A alone"*), from the cross review `tools/theorycraft/out/91`:
   * on his export at horizon 4, A moves the sweet spot from 5 333 606 to **5 518 119** damage a march for
   * 2 331 500 silver at the same 17 burned, and the thrift end fields 10 legionaries instead of none; B only
   * hides the legionary-free plan, and with A on it has nothing left to hide.
   */
  planFixes: { tokenFloor: true, refuseDroppedTypes: false, sizerShape: false },
  /**
   * **The bar's axis** — `'burn'` since the owner's decision of 2026-09-17 (review of 2026-09-16 put both
   * axes behind this flag so `tools/theorycraft/91` could measure them; this is the answer it produced).
   *
   * The slider is, in his own words, *"about balancing between burning silver efficiently, which is
   * constrained, and burning mercs efficiently, which is constrained as well"*, and **the sweet spot keeps
   * the middle**. So the bar runs along the resource a player is actually trading away: `'burn'` orders the
   * stops by the hired units a march burns for good — one plan a burn level, thriftiest first, the same
   * sweet spot — because on his own account silver barely moves across the bar (1.97–2.35 M a march) while
   * the burn runs 12→22. The two efficiencies are then **said on the stops that have them**
   * (`PlanRow.bestFor`, drawn by `PlanTrade.tsx`) rather than offered as stops of their own: a separate
   * "Best for silver" stop measured as the "Most damage" stop to 0.2 % is, again in his words, *"inefficient
   * and causes frustration"*.
   *
   * - `axis: 'silver'` is S-59 as built — the four named answers sorted by campaign silver — and stays
   *   selectable so the two can still be compared side by side.
   * - `mergeNear` is the fix to the *silver* axis: stops that burn the same and sit within this fraction of
   *   each other on damage and silver a march are one stop. `0` is off; `0.02` merges the pair above. The
   *   burn axis has nothing for it to do (one plan a burn level), so it stays off.
   */
  planBar: { axis: 'burn' as 'silver' | 'burn', mergeNear: 0 },
  /**
   * Wall-clock budgets, in milliseconds: how long a search may run before it answers with the best it has
   * found. They are caps and not durations — the engine stops when it has finished — so raising one buys a
   * better answer on a slow device and never a different kind of one.
   */
  budgets: {
    /** One march: the sizing, or the priority search behind it. */
    search: 8_000,
    /** The S-55 plan: far more candidates than a single-march search, so a longer cap — and still a
     * bounded one. */
    plan: 25_000,
  },
} as const;
