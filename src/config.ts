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
   * The most plans the S-55 bar may carry. Since S-59 the engine offers only its four named answers (sweet
   * spot, most damage, best for silver, spare the stock — `PlanPick`), deduplicated, so this only ever
   * truncates that list and never pads it; four is "every answer", which is what the owner's review of
   * 2026-09-15 asked for ("we should have less option").
   */
  planAlternatives: 4,
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
   * Both are **off**: with them off the app behaves exactly as it did before the flags existed, which is
   * what makes the two experiments (`tools/theorycraft/80`, `81`) a comparison rather than a re-measurement.
   */
  planFixes: { tokenFloor: false, refuseDroppedTypes: false },
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
