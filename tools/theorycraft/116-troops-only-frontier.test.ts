/**
 * 116 — **the troops-only frontier: which search family contains it, and what the slider would be moving
 * along** (owner, 2026-09-20: *"build the troops only frontier… the slider's definition might be on ranked
 * troops spent, but its meaning, the outcome it provides when changing it, is based on balancing damage and
 * constrained resource (silver, speedups, merc, dragon coin…), so even with no merc the slider could be
 * useful, and the table it recaps also."*)
 *
 * 115 proved the frontier is real — the Tier ladder march is rank 14 of 1 023 on damage and rank 1 on damage
 * a silver — by enumerating every subset of a ten-type army. Ten types is 1 023 subsets; a full account is
 * far past that, so before anything is built the question is **which cheap family contains the optimum**.
 *
 *  - **A** — for each army, the best of *all* subsets (enumerated while it is affordable) read against three
 *    cheap families: **tier windows** (keep tiers `t₀…t₁`, O(T²) of them), **rank prefixes** (the plan's own
 *    family today), and **greedy backward elimination** (drop the type whose removal costs least, repeatedly).
 *  - **B** — the frontier on the **two** resources a troops-only march actually spends: silver, and the
 *    training queue the recap calls *time to recover* — the owner's "speedups". They are not the same axis.
 *  - **C** — what a bar drawn from it would carry: the named stops, on every army, with the table the owner
 *    asked for.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/116-troops-only-frontier.test.ts`
 */
import { describe, it } from 'vitest';

import { recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest, UnitDef } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildStackRequest } from '../../src/state/derive';
import { Report, evaluate, label, n } from './harness';

interface March {
  ids: string[];
  damage: number;
  silver: number;
  seconds: number;
  counts: Record<string, number>;
}

const days = (seconds: number): string => {
  const d = Math.floor(seconds / 86_400);
  const h = Math.round((seconds % 86_400) / 3_600);
  return d > 0 ? `${String(d)}d ${String(h)}h` : `${String(h)}h`;
};

function firstRun(): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const profile = root.profiles[0];
  if (!profile) throw new Error('no profile');
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return { profile, setup };
}

/** Size and fight one subset of the army; `null` when it fields nothing. */
function marchOver(base: StackRequest, ids: readonly string[]): March | null {
  const keep = new Set(ids);
  const request: StackRequest = { ...base, units: base.units.filter((unit) => keep.has(unit.id)) };
  const { result, summary } = evaluate(request);
  if (result.stacks.length === 0) return null;
  const bill = recoveryCosts(result.stacks, request.units, request.recovery).plan;
  return {
    ids: [...ids],
    damage: summary.minDamage,
    silver: bill.silver,
    seconds: bill.seconds,
    counts: Object.fromEntries(result.stacks.map((stack) => [stack.unitId, stack.count])),
  };
}

/** Undominated on (more damage, less of `cost`). */
function frontierOn(marches: March[], cost: (one: March) => number): March[] {
  return marches
    .filter(
      (one) =>
        !marches.some(
          (other) =>
            other !== one &&
            other.damage >= one.damage &&
            cost(other) <= cost(one) &&
            (other.damage > one.damage || cost(other) < cost(one)),
        ),
    )
    .sort((a, b) => cost(a) - cost(b));
}

describe.skipIf(!process.env.THEORY)('the troops-only frontier', () => {
  it('finds the family that contains it, on both resources', () => {
    const report = new Report('116-troops-only-frontier');
    const { profile, setup } = firstRun();

    /** The armies asked, each a troop window and a leadership pool. Nothing hired anywhere. */
    const armies: {
      name: string;
      guardsmen: [number, number];
      specialists: [number, number] | null;
      leadership: number;
    }[] = [
      { name: 'first run (G1–G3 · S1), 4 100', guardsmen: [1, 3], specialists: [1, 1], leadership: 4_100 },
      { name: 'first run (G1–G3 · S1), 12 000', guardsmen: [1, 3], specialists: [1, 1], leadership: 12_000 },
      { name: 'first run (G1–G3 · S1), 20 000', guardsmen: [1, 3], specialists: [1, 1], leadership: 20_000 },
      { name: 'G1–G5 · S1–S3, 12 000', guardsmen: [1, 5], specialists: [1, 3], leadership: 12_000 },
      { name: 'G1–G6 · S1–S4, 40 000', guardsmen: [1, 6], specialists: [1, 4], leadership: 40_000 },
    ];

    for (const army of armies) {
      const next = structuredClone(profile);
      next.troops.guardsmen = { min: army.guardsmen[0], max: army.guardsmen[1] };
      next.troops.specialists =
        army.specialists === null ? null : { min: army.specialists[0], max: army.specialists[1] };
      const base = buildStackRequest(next, {
        ...setup,
        housing: { ...setup.housing, leadership: army.leadership },
      });
      const units = base.units;
      const ids = units.map((unit) => unit.id);
      const byId = new Map(units.map((unit) => [unit.id, unit]));
      const tiers = [...new Set(units.map((unit) => unit.tier))].sort((a, b) => a - b);

      report.h(`${army.name} — ${String(ids.length)} types`);

      // ---- the families ----------------------------------------------------------------------------
      /** Every subset, while 2ⁿ is affordable; `null` says the exhaustive answer is not known here. */
      const exhaustive: March[] | null =
        ids.length <= 16
          ? (() => {
              const out: March[] = [];
              for (let mask = 1; mask < 1 << ids.length; mask += 1) {
                const kept = ids.filter((_id, index) => (mask & (1 << index)) !== 0);
                const march = marchOver(base, kept);
                if (march) out.push(march);
              }
              return out;
            })()
          : null;

      /** Tier windows: keep every type whose tier is in `[lo, hi]`. O(T²). */
      const windows: March[] = [];
      for (const lo of tiers) {
        for (const hi of tiers) {
          if (hi < lo) continue;
          const kept = ids.filter((id) => {
            const tier = byId.get(id)?.tier ?? 0;
            return tier >= lo && tier <= hi;
          });
          const march = marchOver(base, kept);
          if (march) windows.push(march);
        }
      }

      /** Rank prefixes: the plan's own family — the strongest k types by damage a point of leadership. */
      const ranked = [...units].sort((a, b) => {
        const rate = (unit: UnitDef): number => unit.strength / Math.max(1, unit.health);
        return rate(a) - rate(b);
      });
      const prefixes: March[] = [];
      for (let keep = 1; keep <= ranked.length; keep += 1) {
        const march = marchOver(
          base,
          ranked.slice(ranked.length - keep).map((unit) => unit.id),
        );
        if (march) prefixes.push(march);
      }

      /** Greedy backward elimination: drop the type whose removal costs the least damage, repeatedly. */
      const greedy: March[] = [];
      {
        let live = [...ids];
        let march = marchOver(base, live);
        while (march && live.length > 1) {
          greedy.push(march);
          let best: { ids: string[]; march: March } | null = null;
          for (const id of live) {
            const without = live.filter((other) => other !== id);
            const candidate = marchOver(base, without);
            if (!candidate) continue;
            if (!best || candidate.damage > best.march.damage) best = { ids: without, march: candidate };
          }
          if (!best) break;
          live = best.ids;
          march = best.march;
        }
        if (march) greedy.push(march);
      }

      const topOf = (list: March[]): March | undefined => [...list].sort((a, b) => b.damage - a.damage)[0];
      const ladder = marchOver(base, ids);
      const truth = exhaustive ? topOf(exhaustive) : undefined;
      const pool = exhaustive ?? [...windows, ...prefixes, ...greedy];
      const share = (one: March | undefined): string =>
        truth && one ? `${n(Math.round((one.damage / truth.damage) * 1000) / 10)} %` : '—';

      report.add('');
      report.add('| family | shapes priced | best damage | of the true optimum | silver | counts |');
      report.add('|---|---|---|---|---|---|');
      const rows: [string, March[], March | undefined][] = [
        ['every subset', exhaustive ?? [], truth],
        ['tier windows', windows, topOf(windows)],
        ['rank prefixes (the plan today)', prefixes, topOf(prefixes)],
        ['greedy backward elimination', greedy, topOf(greedy)],
        ['the Tier ladder (all types)', ladder ? [ladder] : [], ladder ?? undefined],
      ];
      for (const [name, list, top] of rows) {
        if (!top) {
          report.add(`| ${name} | — | not enumerated | — | — | — |`);
          continue;
        }
        report.add(
          `| ${name} | ${String(list.length)} | ${n(top.damage)} | ${share(top)} | ${n(top.silver)} | ${top.ids
            .map((id) => label(id))
            .join(' · ')} |`,
        );
      }

      // ---- the two resources ------------------------------------------------------------------------
      const bySilver = frontierOn(pool, (one) => one.silver);
      const byTime = frontierOn(pool, (one) => one.seconds);
      const sameEnds =
        bySilver.length > 0 &&
        byTime.length > 0 &&
        bySilver.map((one) => one.ids.join()).join('|') === byTime.map((one) => one.ids.join()).join('|');
      report.add('');
      report.add(
        `Frontier on **silver**: ${String(bySilver.length)} marches. Frontier on the **training queue**: ` +
          `${String(byTime.length)} marches. The two are ${sameEnds ? '**the same list**' : '**different lists**'}.`,
      );

      // ---- the bar ----------------------------------------------------------------------------------
      report.add('');
      report.add('The stops a bar would carry, read off the silver frontier:');
      report.add('');
      report.add('| stop | damage | silver | queue | a silver | types | counts |');
      report.add('|---|---|---|---|---|---|---|');
      const cheapest = bySilver[0];
      const dearest = bySilver.at(-1);
      const bestRate = [...pool].sort((a, b) => b.damage / b.silver - a.damage / a.silver)[0];
      const named: [string, March | undefined][] = [
        ['cheapest on the frontier', cheapest],
        ['best damage a silver', bestRate],
        ['the Tier ladder march', ladder ?? undefined],
        ['most damage', dearest],
      ];
      for (const [name, one] of named) {
        if (!one) continue;
        report.add(
          `| ${name} | ${n(one.damage)} | ${n(one.silver)} | ${days(one.seconds)} | ${n(
            one.damage / one.silver,
          )} | ${String(one.ids.length)} | ${one.ids.map((id) => label(id)).join(' · ')} |`,
        );
      }
    }

    report.save();
  }, 900_000);
});
