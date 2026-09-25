/**
 * 119 — **one more stop, or a quiet win?** (owner, 2026-09-20: *"so what's our next move? Offer one more
 * stop on the slider for lowering leadership? Or just take the wins if it's in a small percent of the
 * closest stop there is on it?"*)
 *
 * 118 measured the dial against the *ladder's* march. This asks the only question that decides the shape of
 * S-115: turn the dial on **each stop the bar already offers** and see whether a smaller fill ever
 * **dominates** that stop — at least its damage, at most its silver, at most its hired burn. A stop that is
 * dominated should simply be replaced, silently and with no new control (the owner's second option). A dial
 * that only ever *trades* damage for silver has to be offered as a choice, because nobody can make that
 * trade on the player's behalf (his first option).
 *
 * How a stop is re-fielded at a lower fill: the engine does it, not this file. The stop's own fielded types
 * and its own hired counts become the request's `units` and `caps`, the method is `ms` so the shelter
 * ceiling applies exactly as `planCampaign`'s `shelterUnder` does (S-87), and the leadership housing is a
 * share of **what that stop actually used** — so 90 % means "this plan, nine tenths the troops", not "nine
 * tenths of an unrelated pool".
 *
 * Damage is the worst opening; silver is `recoveryCosts(...).plan.silver`; burn is `hiredLost` — the same
 * three figures the bar's own columns carry.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/119-dial-against-the-stops.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { recoveryCosts } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import { newRoot } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { parseImport } from '../../src/share/exportImport';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { EXPORT_2026_09_17, Report, evaluateCounts, loadLiveAccount, n } from './harness';

const FILLS = [100, 97, 95, 92, 90, 85, 80, 75, 70, 60, 50] as const;

interface Priced {
  damage: number;
  silver: number;
  burn: number;
  counts: Record<string, number>;
}

function price(base: StackRequest, counts: Record<string, number>): Priced {
  const { result, summary } = evaluateCounts(base, counts);
  const bill = recoveryCosts(result.stacks, base.units, base.recovery).plan;
  return {
    damage: summary.minDamage,
    silver: bill.silver,
    burn: hiredLost(result.stacks),
    counts,
  };
}

/** The same plan, fielded on a share of the leadership it used — the engine doing the re-sizing. */
function refill(base: StackRequest, stop: Record<string, number>, share: number): Priced {
  const fielded = new Set(
    Object.entries(stop)
      .filter(([, count]) => count > 0)
      .map(([id]) => id),
  );
  const leadershipUsed = base.units
    .filter((unit) => unit.pool === 'leadership')
    .reduce((sum, unit) => sum + (stop[unit.id] ?? 0) * unit.cost, 0);
  const request: StackRequest = {
    ...base,
    units: base.units.filter((unit) => fielded.has(unit.id)),
    // The stop's own hired counts are the stock this march may spend; the shelter may still lower them.
    caps: { ...base.caps, ...Object.fromEntries(Object.entries(stop).filter(([, count]) => count > 0)) },
    housing: { ...base.housing, leadership: Math.floor((leadershipUsed * share) / 100) },
    options: { ...base.options, method: 'ms' },
  };
  const sized = sizeStacks(request);
  return price(base, Object.fromEntries(sized.stacks.map((stack) => [stack.unitId, stack.count])));
}

const pct = (part: number, whole: number): string =>
  whole === 0 ? '—' : `${n(Math.round((part / whole) * 1000) / 10)} %`;

function firstRun(): { profile: Profile; setup: BattleSetup } {
  const root = newRoot();
  const profile = root.profiles[0];
  const setup = profile?.setups[0];
  if (!profile || !setup) throw new Error('no first-run profile');
  return { profile, setup };
}

describe.skipIf(!process.env.THEORY)('the dial against the stops', () => {
  it('turns the dial on every stop of every bar and looks for a domination', () => {
    const report = new Report('119-dial-against-the-stops');

    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const own = parsed.payload;
    const ownSetup = own.setups[0];
    if (!ownSetup) throw new Error('no setup');
    const live = loadLiveAccount();
    const { profile: fresh, setup: freshSetup } = firstRun();

    const armies = [
      {
        name: 'a first-run army, 12 000 leadership (hires nothing)',
        profile: fresh,
        setup: { ...freshSetup, housing: { ...freshSetup.housing, leadership: 12_000 } },
      },
      { name: 'the live account, 20 000 leadership · 83 EMH', profile: live.profile, setup: live.setup },
      {
        name: 'the 2026-09-17 export, its own setup (four hired types)',
        profile: own,
        setup: ownSetup,
      },
    ] as const;

    let dominations = 0;
    let cheapWins = 0;
    let stopsSeen = 0;

    for (const army of armies) {
      report.h(army.name);
      const base = buildStackRequest(army.profile, army.setup);
      const stops = planCampaign(buildPlanRequest(army.profile, army.setup)).alternatives;

      for (const stop of stops) {
        stopsSeen += 1;
        const own100 = price(base, stop.counts);
        report.add('');
        report.add(
          `### ${stop.pick} — ${n(own100.damage)} damage, ${n(own100.silver)} silver, ${n(
            own100.burn,
          )} hired lost`,
        );
        report.add('');
        report.add('| fill | damage | of the stop | silver | of the stop | hired lost | verdict |');
        report.add('|---|---|---|---|---|---|---|');
        for (const share of FILLS) {
          const row = refill(base, stop.counts, share);
          const dominates =
            row.damage >= own100.damage &&
            row.silver <= own100.silver &&
            row.burn <= own100.burn &&
            (row.damage > own100.damage || row.silver < own100.silver || row.burn < own100.burn);
          // "A small percent of the closest stop": the owner's own bar, 2 % of the damage.
          const cheap = !dominates && row.damage >= own100.damage * 0.98 && row.silver < own100.silver;
          if (share !== 100 && dominates) dominations += 1;
          if (share !== 100 && cheap) cheapWins += 1;
          report.add(
            `| ${n(share)} % | ${n(row.damage)} | ${pct(row.damage, own100.damage)} | ${n(row.silver)} | ${pct(
              row.silver,
              own100.silver,
            )} | ${n(row.burn)} | ${
              share === 100
                ? 'the stop itself'
                : dominates
                  ? '**dominates**'
                  : cheap
                    ? '**within 2 %, cheaper**'
                    : 'a trade'
            } |`,
          );
        }
      }
    }

    // **The reference 118 did not use.** Its dial was measured against the *ladder's* march — what the Tier
    // ladder method answers — and beat it by 14 %. The bar is not that march. So the same three armies are
    // asked the only comparison that decides whether the dial adds anything to the plan: the best damage a
    // silver the **bar** already offers, against the best the dial can reach at any fill of the whole army.
    report.h('The dial against the bar, on the bar’s own reading');
    report.add('');
    report.add(
      '| army | best rate on the bar | best rate the dial reaches | best rate of the ladder march | verdict |',
    );
    report.add('|---|---|---|---|---|');
    for (const army of armies) {
      const base = buildStackRequest(army.profile, army.setup);
      const stops = planCampaign(buildPlanRequest(army.profile, army.setup)).alternatives;
      const barBest = stops
        .map((stop) => {
          const one = price(base, stop.counts);
          return { name: stop.pick, rate: one.silver > 0 ? one.damage / one.silver : 0, ...one };
        })
        .reduce((best, one) => (one.rate > best.rate ? one : best));

      // The dial over the whole army, exactly as 118 swept it: every type available, shelter on.
      const dialled = FILLS.map((share) => {
        const request: StackRequest = {
          ...base,
          housing: { ...base.housing, leadership: Math.floor((base.housing.leadership * share) / 100) },
          options: { ...base.options, method: 'ms' },
        };
        const sized = sizeStacks(request);
        const one = price(base, Object.fromEntries(sized.stacks.map((s) => [s.unitId, s.count])));
        return { name: `${String(share)} %`, rate: one.silver > 0 ? one.damage / one.silver : 0, ...one };
      });
      const dialBest = dialled.reduce((best, one) => (one.rate > best.rate ? one : best));
      const ladder = dialled[0];
      if (!ladder) throw new Error('no ladder reading');

      report.add(
        `| ${army.name} | **${n(Math.round(barBest.rate * 1000) / 1000)}** (${barBest.name}, ${n(
          barBest.damage,
        )} for ${n(barBest.silver)}, ${n(barBest.burn)} burn) | ${n(
          Math.round(dialBest.rate * 1000) / 1000,
        )} (${dialBest.name} of the pool, ${n(dialBest.damage)} for ${n(dialBest.silver)}, ${n(
          dialBest.burn,
        )} burn) | ${n(Math.round(ladder.rate * 1000) / 1000)} (full pool) | ${
          barBest.rate >= dialBest.rate
            ? `**the bar wins by ${n(Math.round((barBest.rate / dialBest.rate - 1) * 1000) / 10)} %**`
            : `**the dial wins by ${n(Math.round((dialBest.rate / barBest.rate - 1) * 1000) / 10)} %**`
        } |`,
      );
    }

    report.h('The verdict');
    report.add('');
    report.add(
      `Over **${String(stopsSeen)} stops** and ${String(
        FILLS.length - 1,
      )} lower fills each: **${String(dominations)}** dominations (at least the damage, at most the silver, at most the burn) and **${String(
        cheapWins,
      )}** marches within 2 % of the stop's damage for less silver.`,
    );
    report.save();
  }, 900_000);
});
