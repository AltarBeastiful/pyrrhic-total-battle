/**
 * **The yardstick the plan's criteria are stated against**: the sheltered marches the account can field by
 * hand, built from the sizer and the shelter alone and priced by `planMarch`, which is the recap's own
 * arithmetic.
 *
 * It lives beside the scenarios rather than inside `plan-criteria.test.ts` because a theorycraft experiment
 * that measures a change to one of the plan's rules has to measure it against **the same** yardstick the
 * criterion will judge it by (`tools/theorycraft/112-band-yardstick.test.ts`); a copy in an experiment drifts
 * from the one that holds the engine, and a measurement taken against a drifted copy is not a measurement of
 * the rule at all.
 */
import { planMarch } from '@/engine';
import type { PlanTotals } from '@/engine/plan';
import { effectiveTable, lastsMarches, rankTroops } from '@/engine/plan';
import { chunks } from '@/engine/recovery';
import { sizeStacks } from '@/engine/stacker';
import type { StackRequest, UnitDef } from '@/engine/types';

/**
 * **The sheltered marches the account can field by hand**, and what each of them costs — the yardstick the
 * criteria of `plan-criteria.test.ts` are stated against (S-93; moved here from that file by S-95, unchanged).
 *
 * For each prefix of the troop ranking (`rankTroops`, the strongest k types by damage per HP) and each of the
 * three sizer methods, the sizer's own march over those types with every hired type at its stock, then every
 * hired stack lowered under the lowest troop stack (`shelterUnder`'s rule, restated here). That is the
 * owner's own recipe — *"Troops first"*, then the lower tiers put back, one tier at a time — and the full
 * prefix is the march he sent on 2026-09-19. It is built from the **sizer and the shelter alone**, never from
 * the plan's search, so it is an independent yardstick rather than a second reading of the same code; every
 * figure is `planMarch`'s, which is the recap's.
 *
 * A rival has to be a march **the bar's own rules would let it offer**: more than one troop stack (the band's
 * third criterion) and every hired type the account holds on the field (S-58 B). A troops-only march would
 * beat every stop on the burn and is not a plan this method is about at all.
 */
export interface Rival {
  what: string;
  counts: Record<string, number>;
  damage: number;
  silver: number;
  burn: number;
  /** The hired units the march fields, every hired pool together (S-96) — what the `all-in` is offered on. */
  hired: number;
  seconds: number;
  key: string;
  /** The most marches this one can be **repeated**: the hired stock loses a chunk of ten a march. */
  repeats: number;
}

/**
 * The marches a stop **repeats**: its campaign less the finale and less the troops-only tail, or one for the
 * `all-in`, whose marches all differ and whose `repeat` is the first of them. A rival is only a rival when
 * the stock can field it that often — a march that spends a type's whole stock at once is not an answer to a
 * plan that has to march four times.
 */
export const repeatsOf = (row: PlanTotals): number =>
  row.sequence ? 1 : Math.max(1, row.marches - (row.finaleCounts ? 1 : 0) - (row.tail?.marches ?? 0));
export const countsKey = (counts: Record<string, number>): string =>
  JSON.stringify(
    Object.entries(counts)
      .filter(([, count]) => count > 0)
      .sort(),
  );
/**
 * **Anchored** (S-97, the `repeats` argument): every hired type capped at the largest count its stock still
 * fields on each of `repeats` marches — `lastsMarches`, one chunk of ten lost a march. A march the account
 * can send **once** is no answer to a stop that has to march four times, and the two criteria that speak
 * about the *rungs* of the bar ask for the family at the repeats the rung plays. Left out (0), the caps are
 * the account's own whole stock, which is what the `all-in` is about and what the two criteria that predate
 * this one have always asked for.
 */
export const shelteredRivals = (request: StackRequest, repeats = 0): Rival[] => {
  const table = effectiveTable(request);
  const ranked = rankTroops(table);
  // **Every hired pool** (S-96): the dominance pool's monsters are rare stock exactly as the authority
  // pool's mercenaries are, and a yardstick that counted a monster as a troop would put it in the shelter's
  // floor and leave its chunks out of the burn.
  const hiredIds = request.units.filter((unit) => unit.pool !== 'leadership').map((unit) => unit.id);
  const hp = new Map(table.map((entry) => [entry.id, entry.hp] as const));
  const out: Rival[] = [];
  const seen = new Set<string>();
  const caps: Record<string, number> = { ...request.caps };
  if (repeats > 0) {
    for (const id of hiredIds) {
      const held = request.caps[id];
      if (held === undefined) continue;
      let anchor = 0;
      for (let count = held; count >= 1; count -= 1) {
        if (lastsMarches(held, count) >= repeats) {
          anchor = count;
          break;
        }
      }
      caps[id] = anchor;
    }
  }
  for (let depth = 1; depth <= ranked.length; depth += 1) {
    const chosen = new Set(ranked.slice(-depth).map((entry) => entry.id));
    for (const method of ['elite', 'ms', 'msRelaxed'] as const) {
      const sized = sizeStacks({
        ...request,
        caps,
        units: request.units.filter((unit) => chosen.has(unit.id) || unit.pool !== 'leadership'),
        options: {
          ...request.options,
          method: method === 'msRelaxed' ? 'ms' : method,
          relaxedPreservation: method === 'msRelaxed',
        },
      });
      const counts: Record<string, number> = {};
      for (const stack of sized.stacks) if (stack.count > 0) counts[stack.unitId] = stack.count;
      const troopHp = Object.entries(counts)
        .filter(([id]) => !hiredIds.includes(id))
        .map(([id, count]) => count * (hp.get(id) ?? 0));
      if (troopHp.length < 2) continue;
      const floor = Math.min(...troopHp);
      for (const id of hiredIds) {
        const unitHp = hp.get(id) ?? 0;
        if (unitHp <= 0) continue;
        const most = Math.max(0, Math.ceil(floor / unitHp) - 1);
        if ((counts[id] ?? 0) > most) counts[id] = most;
      }
      if (!hiredIds.every((id) => (counts[id] ?? 0) > 0)) continue;
      const key = countsKey(counts);
      if (seen.has(key)) continue;
      seen.add(key);
      const { summary } = planMarch(request, counts);
      out.push({
        repeats: Math.min(
          ...hiredIds.map((id) => {
            const held = request.caps[id];
            return held === undefined ? Infinity : lastsMarches(held, counts[id] ?? 0);
          }),
        ),
        what: `the sizer’s sheltered march over ${String(depth)} troop types (${method}) — ${Object.entries(
          counts,
        )
          .filter(([, count]) => count > 0)
          .map(([id, count]) => `${id} ${String(count)}`)
          .join(' · ')}`,
        counts,
        // The same reading the bar is on since 2026-09-19 (S-94): a rival priced on the midpoint of the two
        // openings against a stop priced on the bad flip would beat it on arithmetic alone.
        damage: summary.minDamage,
        silver: summary.recovery.silver,
        burn: hiredIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0),
        hired: hiredIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0),
        seconds: summary.recovery.seconds,
        key,
      });
    }
  }
  return out;
};

// ---- the rare stock a march spends, split (S-98) ----------------------------------------------------------

/**
 * **Which hired units are monsters** — the one place the benchmark, the registered baseline and the criteria
 * agree on the owner's two yardsticks (2026-09-19: *"at least the same as TotalStack full opt in silver/dmg,
 * merc/dmg and monster/dmg"*).
 *
 * A unit is a **monster** when its own group is `monster`, and that is two kinds of unit at once: the
 * **dominance pool's** monsters (`kind: 'monster'`, group `monster` by construction — `src/data/index.ts`)
 * and the **authority pool's monster mercenaries**, the hires that carry the `monster` tag rather than a
 * soldier's role (Bear V, Cyclops V, Abomination VI, the Golden Dragon; against Epic Monster Hunter VI,
 * Legionary VI, Arbalester VI and Chariot VI, which carry `guardsmen` or `specialist`). Everything else the
 * account hires — every non-leadership unit that is not one of those — is a **hired soldier**. Troops are
 * neither: they are not rare stock, they come back from the training queue, and no reading here counts them.
 *
 * **What TotalStack's `monsterSaving` says about the split: nothing, and that is the finding** (S-98, read
 * off `docs/research/totalstack-capture-2026-09-18.md` and the two dataset fixtures beside it). Pressed
 * against the same scenario with the flag on and off, the answers differ in `mercenaryCounts` **only** —
 * Epic Monster Hunter VI 142 → 34 on the 7 000 export, Legionary VI 2 017 → 926 on the evening account,
 * Bear V 10 → 6 on the ten-bear army — while `troopCounts` is identical to the unit and `monsterCounts` is
 * empty in all 280 captured answers (no `monsterCaps` is ever sent; the dominance side is driven by
 * `monsterMinTier`/`monsterMaxTier` and `excludedMonsterIds`). So the flag is a **shelter over the whole
 * hired pool**, and in TotalStack's own vocabulary "monster" means "hired unit": Bear V and Cyclops V sit in
 * `mercenaryCaps` beside Epic Monster Hunter VI, and the flag saves the soldier hires exactly as it saves the
 * beasts. It draws its line by **pool**, not by race, and therefore offers no evidence for either reading of
 * "mstr/dmg".
 *
 * The split below is drawn by **race** all the same, and the reason is the owner's account rather than
 * TotalStack's payload: he holds no dominance unit today, so a `monstersLost` that counted only the dominance
 * pool would be nought on every army he plays and *"monster/dmg"* would be a floor with nothing under it. By
 * the group it is a live reading on his own stock (his Bear V and Cyclops V), and it becomes the dominance
 * pool's reading too the day he houses one. `soldiersLost + monstersLost` is `PlanTotals.mercLost` either
 * way — the pooled rare-stock axis the whole bar is ordered by is untouched (`plan.ts`; nothing here is read
 * by the search) — and `plan-criteria.test.ts` holds that identity on every army.
 */
export const isMonsterUnit = (unit: UnitDef): boolean => unit.group === 'monster';

/** The rare stock one march spends, as the three readings the owner asked for (S-98). */
export interface RareStock {
  /** Chunks of ten lost over the **hired soldiers**: every non-leadership unit that is not a monster. */
  soldiersLost: number;
  /** Chunks of ten lost over the **monsters**: monster mercenaries and dominance monsters together. */
  monstersLost: number;
  /**
   * The dragon coins the losses cost to recruit again — the dominance pool's own price, `chunks(n)` ×
   * `training.dragonCoins` (`src/engine/recovery.ts`). Nought for a troop (no such line) and for a
   * mercenary (no `training` block at all), monster mercenaries included: a monster hired for authority is
   * paid for in authority, not in coins.
   */
  dragonCoins: number;
}

/**
 * The split of one march's counts. Read off the **counts**, the way the benchmark's `hired burned` column
 * and the criteria's own burn reading are, so the three agree to the chunk.
 */
export function rareStockOf(units: UnitDef[], counts: Record<string, number>): RareStock {
  let soldiersLost = 0;
  let monstersLost = 0;
  let dragonCoins = 0;
  for (const unit of units) {
    const count = Math.floor(counts[unit.id] ?? 0);
    if (count <= 0 || unit.pool === 'leadership') continue;
    const burn = chunks(count);
    if (isMonsterUnit(unit)) monstersLost += burn;
    else soldiersLost += burn;
    if (unit.pool === 'dominance') dragonCoins += burn * (unit.training?.dragonCoins ?? 0);
  }
  return { soldiersLost, monstersLost, dragonCoins };
}

/**
 * Damage a hired soldier and damage a monster, on the **same** zero rule `perHired` has always used: a
 * campaign that burned none of one kind is read at `damage / 1` rather than at `Infinity`, so a row that
 * spends no monster is comparable with one that does instead of being a record no rival can reach.
 */
export const perSoldierOf = (damage: number, soldiersLost: number): number =>
  damage / Math.max(1, soldiersLost);
export const perMonsterOf = (damage: number, monstersLost: number): number =>
  damage / Math.max(1, monstersLost);
