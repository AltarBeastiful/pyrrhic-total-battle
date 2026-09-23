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
   * **A and B are on.** A alone on 2026-09-17 (*"A alone"*, from the cross review `tools/theorycraft/out/91`);
   * B joined it on 2026-09-18 (*"mercs still are being left out, which I find odd — I prefer to have multiple
   * stacks of mercs, it seems to work best"*): the bar never offers a plan that fields none of a hired type
   * the account holds. From the cross review:
   * on his export at horizon 4, A moves the sweet spot from 5 333 606 to **5 518 119** damage a march for
   * 2 331 500 silver at the same 17 burned, and the thrift end fields 10 legionaries instead of none; B only
   * hides the legionary-free plan, and with A on it has nothing left to hide.
   *
   * - `burnSaver` — W10 (`docs/plans/the-stops-the-bar-offers.md`, 2026-09-23): the bar also offers the
   *   band's fewest-burn plan (`CampaignInput.burnSaver`), everywhere, and leaves it to the fold below.
   * - `foldTo` — the fold (owner, 2026-09-23: *"ok allow 5 stops"*): the bar re-chosen as a whole, over the
   *   stops and the band, to at most five stops that keep its order, the sweet spot and a real low-silver
   *   stop, losing as little as possible of the ten readings. Experiment 149, against the guard of 54c7e3d:
   *   no benchmark army worse on any reading, no criterion broken, and TotalStack's rows no stop fits
   *   17 → 13 (47 dominated either way).
   */
  planFixes: {
    tokenFloor: true,
    refuseDroppedTypes: true,
    sizerShape: true,
    burnSaver: 'silver' as const,
    foldTo: 5,
  },
  /**
   * **The bar** is three stops along the hired units a march burns for good — the thriftiest rung the band
   * keeps, the sweet spot in the middle of the rungs nothing beats on both ratios, and the most damage —
   * with the two efficiencies said on the stops that have them (`PlanRow.bestFor`). Owner, 2026-09-17: the
   * slider is *"about balancing between burning silver efficiently, which is constrained, and burning mercs
   * efficiently, which is constrained as well"*, *"keep 3 spot on the slider each time"*, and a stop that is
   * another to 0.2 % *"is inefficient and causes frustration"*. The silver axis and the near-stop merge that
   * were measured against it (`tools/theorycraft/out/91`, `92`) were retired with the review of 2026-09-18:
   * nothing here is left to set.
   */
  /**
   * **What a put-back is worth**, in the owner's own exchange rates (2026-09-18: *"generation sometimes skips
   * low-level stacks and misses some damage that seems cheap … troops of higher tier are longer to train …
   * add a pass to consider again lower level troops if the cost for them (silver, silver/damage, total
   * damage) is not too high and we get a nice reduction in training time"*).
   *
   * The plan's own shapes cannot find these marches: a ladder is built over a **prefix** of the damage-per-HP
   * ranking, so a low tier never enters one, and the sizer's shapes are sized over **every** type at once. The
   * family "the march's types plus one more" is the one nobody scored — and it is where the cheap damage is.
   * The pass that scores it (`putBackOn`, `engine/plan.ts`) needs one thing this file can give it: how much
   * silver and how much queue a percent of damage is worth. Those are a **decision**, not a fact, so they are
   * three numbers here rather than a constant in the middle of a search:
   *
   * ```
   * score = (silver saved %) / silverPerDamage + (time to recover saved %) / timePerDamage + (damage change %)
   * take the put-back when it recovers faster, scores ≥ 0, and loses at most damageLossCap of the damage
   * ```
   *
   * **Recovering faster is a condition and not a number**, which is why it has no entry below. The owner asked
   * for a pass over the low tiers *"if the cost for them … is not too high and we get a nice reduction in
   * training time"*: the queue is what the pass is for, and a march that sits longer in the barracks is not a
   * put-back however hard it hits. The score cannot say that on its own — a large enough damage gain outvotes
   * any rise — so the engine tests it separately (`putBackOn`, `engine/plan.ts`).
   *
   * **The owner's own anchors** (2026-09-18, asked for the rate and answering with two points): *"2 % damage
   * is okay if there's a reduction in time and a bit of silver; 3 % for a lot of silver and training time."*
   * Five and ten are the rates those two points fix — 5 % of silver and 10 % of queue come to exactly the 2 %
   * of damage of the first, 10 % and 10 % to the 3 % of the second — and three is where he stops trading at
   * all, whatever the saving.
   *
   * **Calibrated against experiment 103** (`tools/theorycraft/out/103-put-back-time.md`), which tabled every
   * put-back on four setups the day the rule was written. On his live army (Aydae 43 ★3 alone, 4 975
   * leadership) the steady max is a three-type ladder — RD2 984 · ARC2 1931 · RD3 532, 4 777 523 damage for
   * 2 694 300 silver and 13d 7h of queue — and putting **Archer I** back scores 10.2: +2.7 % damage, 18.2 %
   * of the silver and 38.3 % of the queue saved, better on every count. At the other end, his export at
   * 12 000 leadership takes Spearman I on a 2.6 % **loss** (1.2, on 8.1 % of silver and 21.8 % of queue) and
   * refuses Archer I there, which costs 5.8 % — past the cap, and negative besides. Three of the twelve
   * put-backs measured that day are refused, which is the point: the rule says no as often as it says yes.
   */
  putBack: { silverPerDamage: 5, timePerDamage: 10, damageLossCap: 3 },
  /**
   * **What a percent of each cost is worth against a percent of damage** (S-135, 2026-09-22) — the rates the
   * rating uses to choose between two marches that **dominance cannot separate**, and nothing else.
   *
   * They are policy, not fact, which is why they are here beside `putBack` rather than inside an engine. The
   * two that were already measured stay exactly as `putBack` set them from the owner's own anchors of
   * 2026-09-18: **silver 5**, **queue 10**. The other three are his of 2026-09-22, asked for in the same
   * form: *"silver/gold/merc seems almost same … dragon coins a bit less important, training time almost
   * never unless entirely free."*
   *
   * Read a number as *"this many percent of this cost equals one percent of damage"*, so **larger means less
   * important**. Silver, gold and the hired burn sit together at 5; dragon coins are a step behind; the
   * training queue is the thing he will trade away almost without limit.
   *
   * **Damage is the worst opening, never the average** (S-134). The rates were given against reliable
   * damage, and applying them to the coin-flip midpoint would be a different bargain than the one he struck.
   *
   * **The rates alone are not the rule.** He also fixed *when* a cost difference counts at all: *"sometimes
   * gold is low (if only reviving mercs per ex) so a 30 % drop on a 100 gold coins is meaningless to me as I
   * have around 170k … but a 10 % drop on an 8k revival is."* A percentage of a trivial bill is noise, and
   * **170 000 is explicitly not a constant to write down** (*"other players might vary so not to be used as
   * a literal figure in calculations"*). The significance therefore comes from the **spread of that cost
   * across the marches being rated** — where every candidate pays about the same gold, the gold axis
   * carries no weight however large its percentages look — which needs no figure from the player and no
   * magic number here.
   */
  markerRates: { silver: 5, gold: 5, hired: 5, dragonCoins: 8, seconds: 40 },
  /**
   * **The fills of the leadership pool a March edit re-sizes at** (S-117; owner, 2026-09-20: *"I'm not that
   * sure any more that when removing or adding a troop … we should not compute again the best possible
   * outcome, checking if less leadership buys us something"*).
   *
   * Every march the app offers fills the leadership pool to its last point. Experiment 119 asked whether a
   * smaller fill was worth offering on a **generated stop** and answered no — 12 stops × 10 fills, **0**
   * marches with at least the stop's damage for no more silver and no more burn — and S-115 was retired on
   * it. After an **edit** the question is a different one: the type set is not the stop's, the troop floor
   * has moved and the kill order with it. Measured there (experiment 124 §B,
   * `tools/theorycraft/out/124-what-the-edit-answers-with.md`), 33 edits × 11 fills gave **9 dominations** —
   * at least the damage, no more silver, no more hired burnt — and the engine takes **only** those, so this
   * list can add damage or take away cost and can never trade one for the other.
   *
   * **Why these six.** Every domination measured sits at 98, 96, 94, 92 or 90 % of the pool, and none was
   * ever found below 90 — under the crossover the fill starts taking mercenaries with it (investigation
   * 0023's `(stock × hpPerUnit) / troopFloor`) and the damage falls off a cliff the dominance test refuses
   * anyway. Sampling the five that pay and stopping is the whole of the list; each one costs about
   * **0.25 ms** (§D), so the press stays a press.
   *
   * There is deliberately **no control on screen** for this. A win needs no control: the player is not being
   * asked to trade anything. The fills that merely *trade* — 25 of the 363 pass `putBack`'s own rates above —
   * are **not** taken, because the plan applies those rates at Generate time where the owner registered
   * them, and a trade swapped into a march the player is holding is a different promise.
   */
  editFills: [98, 96, 94, 92, 90],
  /**
   * Wall-clock budgets, in milliseconds: how long a search may run before it answers with the best it has
   * found. They are caps and not durations — the engine stops when it has finished — so raising one buys a
   * better answer on a slow device and never a different kind of one.
   */
  budgets: {
    /** One march: the sizing, or the priority search behind it. */
    search: 8_000,
    /**
     * The S-55 plan: far more candidates than a single-march search, so a longer cap — and still a bounded
     * one.
     *
     * **40 s since 2026-09-22 (S-119), raised from 25 s at the owner's word** (*"raise budget"*).
     *
     * **What it does not do is let the 20 000-dominance camp finish, and that was the premise** — measured
     * in `tools/theorycraft/129-the-big-monster-camp.test.ts`. Experiment 110's larger camp (monster tiers
     * 3–7, twenty uncapped types) was read on 2026-09-19 as running **25 846–28 009 ms** against a 25 000 ms
     * cap, which looked like a search that just overran. It is not: at a 40 000 ms cap it runs **40 843–
     * 40 934 ms**. The search is **budget-bound at every budget** — it fills whatever clock it is given — so
     * that camp still cannot be registered as a benchmark scenario, because its bar would be the machine's
     * rather than the engine's. Making it converge is engine work, not a number here.
     *
     * **The raise is kept because a longer clock is a strictly better bar on it** (§B of the same
     * experiment): at 25 s that camp offers **2** stops and a hardest campaign of 1,916,803,326 for
     * 89,969,600 silver; at 40 s it offers **4** — a silver saver at 24 chunks and a steady max at 32 join
     * it — and 1,924,609,434 for **88,360,000**, more damage for less silver. The cap is not a duration, so
     * a player who does not own a five-figure dominance pool never meets it.
     *
     * **It costs an ordinary account nothing, and that is measured rather than argued.** The slowest of the
     * seventeen benchmark armies is the **900**-dominance camp at 8 598–8 750 ms, and every army he actually
     * plays is under 4 200 ms (`benchmark-latest.json`, `planMs`). Raising the ceiling moves no wait a
     * player will meet.
     */
    plan: 40_000,
  },
} as const;
