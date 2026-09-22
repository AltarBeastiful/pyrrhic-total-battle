/**
 * **Dominance at matched spend** — the reading the owner's own definition of *beating* TotalStack reduces to
 * (S-121, 2026-09-22; owner, 2026-09-21: *"beat means using constrained resources to produce better damage
 * with a fixed silver/merc/gold/dragon coins set. So we can derive its being more efficient in the markers
 * related."*).
 *
 * > Take any march another calculator answers with. Read its costs. **We beat it when the bar offers a stop
 * > that spends no more of any of them — within the tolerance — and deals more damage.**
 *
 * Every marker ratio follows by construction: more damage at no more cost makes `damage / silver`,
 * `damage / soldier`, `damage / monster` and `damage / dragon coin` each at least theirs, which is why his
 * *"all four ≥ 1.0 everywhere"* is the **derived** reading here and not a second target. The ratio floors in
 * `plan-scenarios.ts` (`Pinned.totalOptimization`) stay exactly as they are: they are the derived reading,
 * and this file is the thing they are derived from.
 *
 * Nothing in here touches the engine. It is arithmetic over campaigns two calculators already produced, and
 * `plan-benchmark.test.ts` is the only caller — kept in its own module so the comparison has unit tests of
 * its own (`matched-spend.test.ts`) rather than being checked only by the 200-second suite that uses it.
 */

/**
 * **The five costs a march charges**, each one a resource the player does not get back inside the horizon.
 *
 * They are the whole of the *spend* side of the owner's sentence — *"a fixed silver/merc/gold/dragon coins
 * set"* — plus the training queue, which S-107 added to the baseline for the same reason: a march that buys
 * damage by parking the army in the queue for a day has spent something.
 *
 * `damage` is deliberately **not** here. It is the objective, not a cost, and keeping the two apart is what
 * stops `fitsInside` from quietly ranking.
 */
export interface Spend {
  /** Retraining silver over the campaign. */
  silver: number;
  /** Gold the hired stacks cost to revive. */
  gold: number;
  /** Dragon coins the monsters cost to recruit again. */
  dragonCoins: number;
  /** Chunks of ten out of the **authority** pool — the stock a march does not get back (S-102). */
  burned: number;
  /** Seconds the losses sit in the training queue. */
  seconds: number;
}

/** A campaign to compare: a stop of ours, or a march a calculator outside this repo answered. */
export interface Contender extends Spend {
  name: string;
  damage: number;
}

/**
 * **The tolerance the owner set** (2026-09-22: *"ok to exceed within reasonable bounds"*).
 *
 * **Swept, and the sweep says two different things** (re-measured S-121b; the figure written here first —
 * *"3 → 4 → 4 → 5 → 5"* — matched no payload in the repo and is withdrawn). Over the payload of 2026-09-22
 * the verdict reads **4 / 5 / 5 / 6 / 6 beats at 0 / 5 / 10 / 20 / 50 %**:
 *
 *  - **On the armies we are merely behind on, loosening does not rescue us.** One army crosses between 5 %
 *    and 50 %, and the deficits of §3 — −77.9 %, −20.2 %, −13.9 %, −12.5 % — are nowhere near a gate.
 *  - **On the three armies no stop of ours fits at all (§3's G0), it does.** At 20 % the count drops
 *    **3 → 1**: the 12 000 export becomes a −8.9 % short, and his camp of 2026-09-19 as his message reads
 *    it becomes a **+54.2 % beat**. Only the monster camp stays out at every tolerance, and it is out on
 *    **gold** rather than by a near miss.
 *
 * That second reading is a finding about G0 rather than about the gate: two of those three armies are a
 * *coverage* defect a few per cent wide, which is what W4 is for — and it is why this constant is recorded
 * and swept rather than tuned. It stays at 5 % because 5 % is what he said.
 */
export const TOLERANCE = 0.05;

/**
 * **The four costs the match is made on** — and the reason the training queue is not among them.
 *
 * The owner's sentence names exactly these four: *"a fixed **silver/merc/gold/dragon coins** set"*. The queue
 * is the fifth thing a march spends and it is read on every table here, but it is **reported, not gated**,
 * and that is a measured decision rather than a reading of his words alone.
 *
 * `docs/plans/beating-totalstack.md` §8 asked whether the queue should gate, and guessed that *"it is our
 * second-best marker, so gating it costs nothing today"*. **Measured on the payload of 2026-09-22, that guess
 * is wrong**: adding `seconds` to this list takes the standing from **5 beats, 9 short, 3 with no stop
 * inside their budget** to **3 beats, 10 short, 4 with none** — his own TotalStack profile falls +20.7 % →
 * −27.4 %, his camp of 2026-09-19 goes from +17.7 % to no stop fitting at all, and the live camp from
 * −77.9 % to −81.8 %. Gating the queue costs two of the five armies we beat.
 *
 * So it stays out until he says otherwise, and the cost of putting it in is written down rather than
 * guessed at. `MARKERS` below still reads it, so a change that buys damage by parking the army in the queue
 * for a day is visible as exactly that.
 */
export const COSTS = ['silver', 'gold', 'dragonCoins', 'burned'] as const;
export type Cost = (typeof COSTS)[number];

/**
 * **Does our campaign fit inside theirs?** Every cost marker of ours is at or under theirs, allowing the
 * tolerance.
 *
 * **A marker they spend nothing of is a hard gate**, and knowingly so: `0 × 1.05` is still `0`, so a rival
 * that pays no gold can only be matched by a stop that pays none either. That is the one place the uniform
 * tolerance bites hardest, and it is §8's first open question — *"may a marker be exceeded beyond 5 % when
 * the damage plainly pays for it?"* Until the owner answers it, the strict reading is the honest one: a stop
 * that buys its damage with a resource the rival never touched has not matched their spend, it has outspent
 * them on an axis where they scored a perfect zero.
 */
export function fitsInside(ours: Spend, theirs: Spend, tolerance: number = TOLERANCE): boolean {
  return COSTS.every((cost) => ours[cost] <= theirs[cost] * (1 + tolerance));
}

/** Which markers put a campaign outside another's budget — for the report, so a refusal names its reason. */
export function overspentOn(ours: Spend, theirs: Spend, tolerance: number = TOLERANCE): Cost[] {
  return COSTS.filter((cost) => ours[cost] > theirs[cost] * (1 + tolerance));
}

/** How one of their rows went: the best stop of ours that fits inside it, and by how much it wins or loses. */
export interface RowVerdict {
  /** Their march. */
  theirs: Contender;
  /** Our best-damage stop inside their budget, or `null` where none of ours fits. */
  ours: Contender | null;
  /** `ours.damage / theirs.damage - 1`, or `NaN` where nothing fits. */
  delta: number;
  /**
   * **True where a stop of ours dominates their march**: it fits inside their budget, hits at least as hard,
   * and is strictly better on *something* — more damage, or the same damage for strictly less of one of the
   * four costs.
   *
   * The strictness matters on one case that actually happens here: a stop of ours that is their march, to
   * the unit. Ties like that are real on the small armies (Bear V ×1 and ×2 tail into the Tier ladder
   * sizer's own campaign, to the unit — `Pinned.sweetNotAheadOnEither` says so), and *"better damage"* is
   * what the owner asked for, so matching a march exactly is not beating it.
   */
  beaten: boolean;
  /** Where nothing fits: the markers every stop of ours overspends on, so the reason is named. */
  over: Cost[];
}

/** One army's whole standing at matched spend. */
export interface MatchedSpend {
  /**
   * **Their hardest row and how we do against it** — the reading `docs/plans/beating-totalstack.md` §2 is
   * tabled on, kept so that table is reproducible from a run. `null` on an army with no comparable row.
   */
  hardest: RowVerdict | null;
  /**
   * **Every comparable row of theirs, and how many we dominate** — the strict reading of §0, *"take any
   * march TotalStack answers with"*, and the *everywhere* of the plan's title. Beating their hardest march
   * is not the same as beating all of them: their cheap rows have small budgets, and a bar that offers five
   * coarse stops can miss one entirely.
   */
  rows: RowVerdict[];
  rowsBeaten: number;
  /**
   * **The rows of theirs no stop of ours fits inside at all.** They are worse than any deficit — on those
   * marches the bar is not losing the comparison, it is not in it — so they are counted apart rather than
   * folded into `worst`, which would otherwise read the army as healthier than it is by averaging over the
   * rows we did manage to enter.
   */
  unfitted: number;
  /**
   * The row we come up shortest on **among the ones a stop of ours fits inside** — `null` where none of ours
   * fits anywhere. Read it beside `unfitted`, never instead of it.
   */
  worst: RowVerdict | null;
}

/**
 * The hardest of a set of marches: most damage, then the smaller total of the four costs, then the name.
 *
 * **The tie-break exists for determinism, and that is all it claims.** Twelve of the seventeen armies have
 * two or more captured rows at their top damage — six of them on the live account of 2026-09-18 — and on the
 * evening account three tied rows carry very different budgets (62,040 gold and 864 burned against 30,616
 * and 428). Left to array order, *which* row a pin is measured against would be decided by the order a
 * capture fixture happens to list its answers in, so re-ordering a dataset could silently re-point a pin
 * while the pin itself never changed.
 *
 * **The second key is a crude one and is not defended as a ranking**: silver, gold, coins and burn are
 * summed, and silver runs to millions where burn runs to tens, so in practice it reads "the row that spent
 * less silver". There is no exchange rate between these four anywhere in this repo — §0 is a *dominance*
 * test precisely so that none has to exist — and inventing one here would be the wrong place. What earns it
 * its keep is measured rather than argued: over the payload of 2026-09-22 it leaves **every army's delta
 * identical** to array order while pinning the choice down, on the ten armies whose named row it moves.
 *
 * The principled alternative — *the tied row inside whose budget fewest of our stops fit*, which is what
 * "hardest" would really mean — needs `ours` to decide `theirs`, and has not been measured. If a future
 * capture makes this choice matter to a delta, that is the version to reach for.
 */
const byDamage = (rows: readonly Contender[]): Contender | null =>
  rows.reduce<Contender | null>((best, row) => {
    if (!best) return row;
    if (row.damage !== best.damage) return row.damage > best.damage ? row : best;
    const spend = (one: Contender): number => COSTS.reduce((sum, cost) => sum + one[cost], 0);
    if (spend(row) !== spend(best)) return spend(row) < spend(best) ? row : best;
    return row.name < best.name ? row : best;
  }, null);

/**
 * One row of theirs against all of ours: the best-damage stop that fits inside their budget wins the
 * comparison, because among stops that all cost no more than they did, damage is the only thing left to rank
 * on. A stop that hits harder *and* costs less than another fitting stop is not preferred here — it is
 * already better on the derived ratios, and this reading is about the ceiling their budget buys us.
 */
function against(theirs: Contender, ours: readonly Contender[], tolerance: number): RowVerdict {
  const fitting = ours.filter((one) => fitsInside(one, theirs, tolerance));
  const best = byDamage(fitting);
  const delta = best && theirs.damage > 0 ? best.damage / theirs.damage - 1 : Number.NaN;
  const dominates =
    best !== null &&
    best.damage >= theirs.damage &&
    (best.damage > theirs.damage || COSTS.some((cost) => best[cost] < theirs[cost]));
  return {
    theirs,
    ours: best,
    delta,
    beaten: dominates,
    over:
      best !== null
        ? []
        : // Which markers stopped *every* stop of ours: a marker is named only where no stop of ours came
          // in under it, so the list is the army's real obstruction rather than the nearest stop's.
          // Read through `overspentOn`, so the report and the gate are one comparison, not two spellings.
          COSTS.filter((cost) => ours.every((one) => overspentOn(one, theirs, tolerance).includes(cost))),
  };
}

export function matchedSpend(
  ours: readonly Contender[],
  theirs: readonly Contender[],
  tolerance: number = TOLERANCE,
): MatchedSpend {
  const rows = theirs.filter((row) => row.damage > 0).map((row) => against(row, ours, tolerance));
  const hardestRow = byDamage(rows.map((row) => row.theirs));
  const hardest = rows.find((row) => row.theirs === hardestRow) ?? null;
  const fitted = rows.filter((row) => row.ours !== null);
  const worst = fitted.reduce<RowVerdict | null>(
    (low, row) => (!low || row.delta < low.delta ? row : low),
    null,
  );
  return {
    hardest,
    rows,
    rowsBeaten: rows.filter((row) => row.beaten).length,
    unfitted: rows.length - fitted.length,
    worst,
  };
}

/** The word the report and the pins use for one row's outcome. */
export function verdictWord(row: RowVerdict | null): 'beat' | 'short' | 'no stop fits' | 'not measured' {
  if (!row) return 'not measured';
  if (!row.ours) return 'no stop fits';
  return row.beaten ? 'beat' : 'short';
}

// ---- the six markers (§1) ---------------------------------------------------------------------------------

/**
 * **The six markers a march is read on**, and which way is better. Damage is the only one maximised; the
 * other five are the `Spend` above, which is why they are listed here in one place rather than twice.
 *
 * These are **floors, not the goal**: winning a marker by fielding a tiny march is not winning, which is what
 * `matchedSpend` above exists to stop. They are reported beside it so that a change which buys damage by
 * spending freely is visible as what it is — *"a different product, not a better one"* (§7).
 *
 * **`seconds` is here and not in `COSTS`**: the training queue is read on every army and gates nothing, for
 * the measured reason written above `COSTS`.
 */
export const MARKERS = [
  ['damage', 'max'],
  ['silver', 'min'],
  ['burned', 'min'],
  ['gold', 'min'],
  ['dragonCoins', 'min'],
  ['seconds', 'min'],
] as const;
export type Marker = (typeof MARKERS)[number][0];

export interface MarkerFloor {
  marker: Marker;
  /** Our best value on this marker alone, over every stop. */
  ours: number;
  /** Their best value on this marker alone, over every comparable row. */
  theirs: number;
  standing: 'win' | 'tie' | 'lose';
}

/**
 * Our best against their best **on each marker alone** — the §1 table, per army.
 *
 * A marker neither side spends anything of reads `0` against `0` and stands as a **tie**: fourteen of the
 * seventeen armies spend no dragon coin, and a "win" on a currency nobody paid would be an arithmetic, not
 * an answer.
 */
export function markerFloors(ours: readonly Contender[], theirs: readonly Contender[]): MarkerFloor[] {
  // A march that dealt nothing is not a march, and it would win every *cost* marker by not fighting — the
  // same filter `matchedSpend` puts on their rows, for the same reason.
  const rivals = theirs.filter((row) => row.damage > 0);
  if (ours.length === 0 || rivals.length === 0) return [];
  return MARKERS.map(([marker, direction]) => {
    const pick = (rows: readonly Contender[]): number =>
      direction === 'max'
        ? Math.max(...rows.map((row) => row[marker]))
        : Math.min(...rows.map((row) => row[marker]));
    const us = pick(ours);
    const them = pick(rivals);
    const better = direction === 'max' ? us > them : us < them;
    const worse = direction === 'max' ? us < them : us > them;
    return { marker, ours: us, theirs: them, standing: better ? 'win' : worse ? 'lose' : 'tie' };
  });
}
