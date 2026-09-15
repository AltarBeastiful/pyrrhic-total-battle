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
   * Marches a plan is planned over — the horizon the plan method answers at: about a week of fighting
   * before the army is hired again.
   *
   * The plan's own search has no opinion about the future. Left to itself it answers with the campaign that
   * maximises total damage, which on a real account is 66 marches and 313 days of training
   * (`tools/theorycraft/out/73-plan-horizon.md`) — a figure to read, not a plan to march. That horizon is
   * also what puts the hired stock back into the repeated march: fielding a tenth of a stack per march is
   * only worth it over a campaign short enough to survive it. And it is the *dominant* lever of the
   * answer, not a detail — measured on the owner's account, damage a silver reads 1.36 unbounded, 2.18 at
   * ten marches and 2.54 at six — which is why it is a number to change here rather than a field to retype.
   */
  marches: 10,
  /**
   * Plans the S-55 trade carries for the slider, besides the ones the engine insists on (the sweet spot,
   * the two ends and the plan itself). Every stop is a plan the player may be asked to choose, so this is
   * the knob between "a control I can read" and "a table I have to read": at 4 the bar carries about eight
   * stops at a 360 px pane, which is what the owner's review of 2026-09-15 asked for ("we should have less
   * option"). The engine samples that many evenly from the plans nothing beats — at a horizon they sit
   * close enough together that a stop lands next to the sweet spot (`out/73-plan-horizon.md` §6).
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
