/**
 * **The registered baseline** — the benchmark read as a non-regression suite (owner, 2026-09-19: *"the
 * benchmark is like non-regression tests. A given scenario should not be worse, or it's a discrepancy, or a
 * new baseline needs to be registered by me if the trade is ok."*).
 *
 * The hand pins beside this (`plan-scenarios.ts`: `stops`, `damageFloor`, `externals`; the floors in
 * `plan-criteria.test.ts`) say *how far above the sizers* a plan must stand, and each of them was chosen by a
 * person. This file says something narrower and stricter: **the figures the owner has registered as
 * acceptable, stop by stop**, and that no run may come in under them. Nothing in this repo may re-base it —
 * a run that comes in lower fails, and the owner decides whether the trade is worth a new baseline.
 *
 * **How it is registered.** `pnpm bench:baseline` runs the benchmark and writes
 * `tests/engine/plan-baseline.proposed.json` — a *proposal*, with `registeredBy: null`. Nothing reads a
 * proposal. The owner registers one by reading it, setting `registeredBy` to his own name and renaming it to
 * `tests/engine/plan-baseline.json`; from then on every benchmark run is measured against it. A file with
 * `registeredBy: null` is ignored wherever it sits, so a proposal renamed by mistake still does not become a
 * baseline by itself.
 *
 * **What is asserted**, per scenario, for every stop the baseline holds (`compareToBaseline`):
 *
 *  - its campaign **damage** is not lower, its **silver** not higher, the **hired units burned** not higher;
 *  - its **damage a silver** and **damage a hired unit** are not lower;
 *  - since S-98, and **only where the registered file carries them**: the **hired soldiers burned**, the
 *    **monsters burned** and the **dragon coins** are not higher, and **damage a hired soldier** and
 *    **damage a monster** are not lower. They are additive — a baseline registered before this story holds
 *    none of them and is judged on exactly what it always was;
 *  - the scenario's standing **ratios** — the plan's hardest campaign over the best sizer sequence's, and
 *    over each comparable captured answer — are not lower. That is the "a given scenario should not be
 *    worse" of the rule, stated on the comparison the benchmark exists to make;
 *  - a stop the baseline holds and the run does not offer is a **failure**: the bar lost an answer;
 *  - a stop the run offers and the baseline does not is **reported, not failed**: a new offer is news for the
 *    owner to register, not a regression.
 *
 * **To the unit, with no tolerance.** Every figure here is an integer the engine computes deterministically
 * from the same fixtures, and the two ratios are quotients of those integers — two runs of the same tree on
 * the same machine agree exactly, which is what makes "not lower" readable as a rule rather than as a
 * threshold. The ratios are compared with a `1e-9` slack against float re-association, and nothing else has
 * any.
 *
 * **Recorded but not asserted**: each stop's revive **gold** and its **training queue**. They are in the file
 * so the owner can see the whole trade when he registers one, and they are not in the assertions because the
 * rule he stated names damage, silver and the stock. Adding them is a one-line change here the day he asks.
 */
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/** One campaign's figures, as the benchmark prices them on the worst opening. */
export interface BaselineTotals {
  marches: number;
  damage: number;
  silver: number;
  /** Recorded, not asserted — see the note above. */
  gold: number;
  /** Recorded, not asserted — the training queue, in seconds. */
  seconds: number;
  burned: number;
  perSilver: number | null;
  perHired: number;
  /**
   * **The rare stock told apart, and the coins** (S-98, 2026-09-19; the owner: *"at least the same as
   * TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*). `burned` above is the pooled axis the
   * bar is ordered by; these are the same chunks of ten split into the **hired soldiers** and the
   * **monsters** (monster mercenaries and dominance monsters — `isMonsterUnit` in `plan-yardsticks.ts`
   * states the definition and what TotalStack's `monsterSaving` does and does not say about it), plus the
   * dragon coins the monsters cost to recruit again.
   *
   * **Optional, and that is the point**: a baseline the owner registered before this story holds none of
   * them, and a run is never failed against a figure that was never registered. Where he registers one that
   * does hold them, each is asserted in its own direction — the two costs and the coins not higher, the two
   * ratios not lower — exactly as `burned` and `perHired` beside them.
   */
  soldiersLost?: number;
  monstersLost?: number;
  dragonCoins?: number;
  perSoldier?: number;
  perMonster?: number;
}

export interface BaselineScenario {
  /** The stops the bar offered, by `pick`. */
  stops: Record<string, BaselineTotals>;
  /** The plan's own campaign, which the payload carries beside the bar. */
  plan: BaselineTotals;
  /** The standing comparisons: the plan's hardest campaign over each rival's. */
  ratios: {
    /** Over the best of the four sizer sequences. */
    bestSizer: number;
    /** Over each comparable captured answer, by its row name. */
    externals: Record<string, number>;
    /**
     * The same two standings read on **damage a hired soldier** and on **damage a monster** (S-98): the
     * bar's best over the best sizer sequence's and over each comparable captured answer's. They are what
     * the owner's TotalStack floors will be pinned on once his replay fixture lands. Optional for the same
     * reason the totals above are: a baseline that predates them is not failed against them.
     */
    perSoldier?: { bestSizer: number; externals: Record<string, number> };
    perMonster?: { bestSizer: number; externals: Record<string, number> };
  };
}

export interface Baseline {
  /**
   * The owner's own name, set by him when he registers the file. `null` — the value every proposal carries —
   * means this is not a baseline and nothing reads it.
   */
  registeredBy: string | null;
  registeredAt: string | null;
  /** Which reading the figures are on; `worst-opening` since S-94 (2026-09-19). */
  reading: string;
  note: string;
  scenarios: Record<string, BaselineScenario>;
}

const REGISTERED = new URL('./plan-baseline.json', import.meta.url);

/**
 * The registered baseline, or `null` when there is none — no file, or a file that still reads
 * `registeredBy: null`, which is what a proposal reads.
 */
export function registeredBaseline(): Baseline | null {
  const path = fileURLToPath(REGISTERED);
  if (!existsSync(path)) return null;
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as Baseline;
  const by = parsed.registeredBy;
  return typeof by === 'string' && by.trim().length > 0 ? parsed : null;
}

const n = (value: number): string => Math.round(value).toLocaleString('en-US');
const ratio = (value: number | null): string => (value === null ? '—' : value.toFixed(4));

/**
 * One scenario against its baseline entry. Returns the sentences a run has to answer for (`failures`) and
 * the ones that are only news (`added`); an empty `failures` is the pass.
 */
export function compareToBaseline(
  was: BaselineScenario,
  now: BaselineScenario,
): { failures: string[]; added: string[] } {
  const failures: string[] = [];
  const added: string[] = [];
  const SLACK = 1e-9;

  const totals = (what: string, before: BaselineTotals, after: BaselineTotals): void => {
    if (after.damage < before.damage) {
      failures.push(`${what}: damage ${n(after.damage)} against the registered ${n(before.damage)}`);
    }
    if (after.silver > before.silver) {
      failures.push(`${what}: silver ${n(after.silver)} against the registered ${n(before.silver)}`);
    }
    if (after.burned > before.burned) {
      failures.push(`${what}: hired burned ${n(after.burned)} against the registered ${n(before.burned)}`);
    }
    // A sequence that spends no silver has no ratio a silver (`null`), which is neither better nor worse
    // than one that does: it is compared only when both readings have it.
    if (before.perSilver !== null && after.perSilver !== null && after.perSilver < before.perSilver - SLACK) {
      failures.push(
        `${what}: damage a silver ${ratio(after.perSilver)} against the registered ${ratio(before.perSilver)}`,
      );
    }
    if (after.perHired < before.perHired - SLACK) {
      failures.push(
        `${what}: damage a hired unit ${n(after.perHired)} against the registered ${n(before.perHired)}`,
      );
    }
    // **The rare-stock readings, additively** (S-98): each is judged only when the registered file carries
    // it *and* this run measured it, so a baseline written before the story is held to exactly what it was.
    const costlier = (key: 'soldiersLost' | 'monstersLost' | 'dragonCoins', label: string): void => {
      const was = before[key];
      const now = after[key];
      if (was === undefined || now === undefined || now <= was) return;
      failures.push(`${what}: ${label} ${n(now)} against the registered ${n(was)}`);
    };
    costlier('soldiersLost', 'hired soldiers burned');
    costlier('monstersLost', 'monsters burned');
    costlier('dragonCoins', 'dragon coins');
    const thinner = (key: 'perSoldier' | 'perMonster', label: string): void => {
      const was = before[key];
      const now = after[key];
      if (was === undefined || now === undefined || now >= was - SLACK) return;
      failures.push(`${what}: ${label} ${n(now)} against the registered ${n(was)}`);
    };
    thinner('perSoldier', 'damage a hired soldier');
    thinner('perMonster', 'damage a monster');
  };

  for (const [pick, before] of Object.entries(was.stops)) {
    const after = now.stops[pick];
    if (!after) {
      failures.push(
        `the bar no longer offers the ${pick} stop (registered at ${n(before.damage)} damage for ` +
          `${n(before.silver)} silver and ${n(before.burned)} burned)`,
      );
      continue;
    }
    totals(`the ${pick} stop`, before, after);
  }
  for (const pick of Object.keys(now.stops)) {
    if (!(pick in was.stops)) added.push(`the bar offers a ${pick} stop the baseline does not hold`);
  }
  totals('the plan itself', was.plan, now.plan);

  if (now.ratios.bestSizer < was.ratios.bestSizer - SLACK) {
    failures.push(
      `against the best sizer sequence: ${ratio(now.ratios.bestSizer)} against the registered ` +
        `${ratio(was.ratios.bestSizer)}`,
    );
  }
  for (const [name, before] of Object.entries(was.ratios.externals)) {
    const after = now.ratios.externals[name];
    if (after === undefined) {
      failures.push(`the captured answer "${name}" is no longer priced on this army`);
      continue;
    }
    if (after < before - SLACK) {
      failures.push(`against "${name}": ${ratio(after)} against the registered ${ratio(before)}`);
    }
  }

  // The two rare-stock standings (S-98), read exactly as the damage one above and reported in its own
  // words. Skipped whole where the registered file does not carry them.
  for (const [label, was_, now_] of [
    ['damage a hired soldier', was.ratios.perSoldier, now.ratios.perSoldier],
    ['damage a monster', was.ratios.perMonster, now.ratios.perMonster],
  ] as const) {
    if (!was_ || !now_) continue;
    if (now_.bestSizer < was_.bestSizer - SLACK) {
      failures.push(
        `against the best sizer sequence on ${label}: ${ratio(now_.bestSizer)} against the registered ` +
          `${ratio(was_.bestSizer)}`,
      );
    }
    for (const [name, before] of Object.entries(was_.externals)) {
      const after = now_.externals[name];
      if (after === undefined) {
        failures.push(`the captured answer "${name}" is no longer priced on this army (${label})`);
        continue;
      }
      if (after < before - SLACK) {
        failures.push(
          `against "${name}" on ${label}: ${ratio(after)} against the registered ${ratio(before)}`,
        );
      }
    }
  }
  return { failures, added };
}
