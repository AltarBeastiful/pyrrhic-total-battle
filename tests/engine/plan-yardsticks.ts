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
import type { StackRequest } from '@/engine/types';

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
