/**
 * B3 (extension) — the leadership dimension of a campaign, which `simulateCampaign` cannot express.
 *
 * `sizeStacks` always fills the leadership, so inside `simulateCampaign` the retrain silver of a march is a
 * constant of the *troop* types alone and the number of marches a budget pays for is `S ÷ silver-per-march`
 * whatever the hired spend. That hides the one trade the owner actually has: **fewer troops → cheaper march →
 * more marches for the same silver**, at the price of smaller troop stacks (which is only safe while every
 * troop stack still out-HPs the biggest hired stack, B2).
 *
 * So this file plays the campaign by hand. Counts are explicit (`evaluateCounts`, checked with `feasible`),
 * the loop is the game's: field `min(target, stock)`, pay the recovery bill, subtract `ceil(n/10)` from every
 * hired stock, stop when the next march would break the silver budget. Two recovery plans are played:
 * **retrain** (troops recruited again, mercenaries' 90 % bought back in gold) and **revive** (the Temple at
 * level 15 brings back 90 % of everything; only the tenth is recruited, so silver falls by about ten).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/23-campaign-leadership.test.ts`
 */
import { describe, it } from 'vitest';

import { searchComplete } from '../../src/engine/campaign';
import { chunks, recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import {
  MERC_IDS,
  Report,
  countsOf,
  evaluate,
  evaluateCounts,
  feasible,
  loadOwner,
  n,
  scenarioB,
  unitById,
  withMethod,
  withUnits,
} from './harness';

const TEMPLE = 15;
const CAPS: Record<string, number> = {
  'epic-monster-hunter-6': 92,
  'arbalester-6': 76,
  'legionary-6': 72,
  'chariot-6': 37,
};
const SEVEN = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;
const EIGHT_ALT = ['archer-2', 'spearman-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;
const BUDGETS = [2e6, 5e6, 1e7, 2e7, 4e7];
const SPENDS = [1, 0.8, 0.6, 0.5, 0.4, 0.3, 0.2];
const CAP_MARCHES = 30;
const MAX_MARCHES = 300;

function withTemple(request: StackRequest): StackRequest {
  return { ...request, recovery: { ...request.recovery, templeLevel: TEMPLE } };
}

/** Hired count at spend f: a multiple of ten where the cap allows it, otherwise the cap. */
function hiredAt(cap: number, f: number): number {
  if (f >= 1) return cap;
  if (cap < 10) return cap;
  return Math.min(cap, Math.max(10, Math.round((f * cap) / 10) * 10));
}

interface Played {
  marches: number;
  stoppedBy: 'marches' | 'silver' | 'stock';
  damage: number;
  silver: number;
  gold: number;
  potions: number;
  seconds: number;
  remaining: Record<string, number>;
  firstMarchDamage: number;
  firstMarchSilver: number;
}

describe.skipIf(!process.env.THEORY)('B3 extension: leadership in a campaign', () => {
  it('plays the campaign by hand over spend × leadership', () => {
    const report = new Report('23-campaign-leadership');
    const owner = loadOwner();

    report.add('# B3 (extension) — the leadership dimension of a campaign');
    report.add('');
    report.add(
      'Why this file exists: `sizeStacks` always fills the leadership, so `simulateCampaign` prices every march ' +
        'of a given troop set at the same silver and the march count is `S ÷ silver-per-march` **whatever the ' +
        'hired spend**. Spending the stock slowly therefore buys no extra marches inside the engine — it only ' +
        'makes each march weaker. The real trade is *fewer troops → cheaper march → more marches*, and it needs ' +
        'explicit counts.',
    );
    report.add('');
    report.add(
      'Hired counts are multiples of ten wherever the cap allows (the `ceil(n/10)` rule charges the same for 28 ' +
        'as for 30). Two leadership choices per (subset, spend): **min L**, the smallest proportional scaling of ' +
        'the `msRelaxed` troop shape that keeps every troop stack strictly above the biggest hired stack, and ' +
        '**full L**, all 4,343. Campaign cap: 30 marches for the table that is comparable with `searchComplete`, ' +
        `and ${MAX_MARCHES} for the uncapped one.`,
    );

    const subsets = [
      { key: '7 types (ARC2 RD2 RD3 + hired)', ids: SEVEN },
      { key: '8 types (ARC2 SP2 RD2 RD3 + hired)', ids: EIGHT_ALT },
    ] as const;

    for (const [scenarioName, base] of [
      ['B (bonuses proven in game) — the main one', scenarioB(owner.twelve)],
      ['A (export bonuses)', withTemple(owner.twelve)],
    ] as const) {
      report.h(`Scenario ${scenarioName}`);

      // ---- Build every (subset, spend, leadership) plan ------------------------------------------
      interface Plan {
        subset: string;
        ids: readonly string[];
        request: StackRequest;
        spend: number;
        leadershipChoice: 'min L' | 'full L';
        leadership: number;
        troopCounts: Record<string, number>;
        targets: Record<string, number>;
        mercLostPerMarch: number;
      }
      const plans: Plan[] = [];
      for (const subset of subsets) {
        const request = withMethod(withUnits(base, subset.ids), 'msRelaxed');
        const troopIds = request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
        const shape = countsOf(evaluate(request).result);

        for (const spend of SPENDS) {
          const targets: Record<string, number> = {};
          for (const id of MERC_IDS) targets[id] = hiredAt(CAPS[id] ?? 0, spend);
          const mercLostPerMarch = MERC_IDS.reduce((sum, id) => sum + chunks(targets[id] ?? 0), 0);

          const troopsAt = (scale: number): { counts: Record<string, number>; leadership: number } => {
            const counts: Record<string, number> = {};
            let leadership = 0;
            for (const id of troopIds) {
              const count = Math.max(1, Math.floor(scale * (shape[id] ?? 0)));
              counts[id] = count;
              leadership += count * (unitById(id)?.cost ?? 1);
            }
            return { counts, leadership };
          };
          const above = (troopCounts: Record<string, number>): boolean => {
            const ev = evaluateCounts(request, { ...troopCounts, ...targets });
            const troopHp = ev.result.stacks.filter((s) => s.pool === 'leadership').map((s) => s.totalHp);
            const mercHp = ev.result.stacks.filter((s) => s.pool === 'authority').map((s) => s.totalHp);
            return troopHp.length > 0 && mercHp.length > 0 && Math.min(...troopHp) > Math.max(...mercHp);
          };

          let minScale = 1;
          for (let scale = 0.01; scale <= 1.0001; scale += 0.002) {
            if (above(troopsAt(scale).counts)) {
              minScale = Math.round(scale * 1000) / 1000;
              break;
            }
          }

          for (const [choice, scale] of [
            ['min L', minScale],
            ['full L', 1],
          ] as const) {
            const { counts, leadership } = troopsAt(scale);
            if (!feasible(request, { ...counts, ...targets })) continue;
            plans.push({
              subset: subset.key,
              ids: subset.ids,
              request,
              spend,
              leadershipChoice: choice,
              leadership,
              troopCounts: counts,
              targets,
              mercLostPerMarch,
            });
          }
        }
      }

      // ---- The hand-played loop ------------------------------------------------------------------
      const play = (plan: Plan, budget: number, mode: 'retrain' | 'revive', maxMarches: number): Played => {
        const stock: Record<string, number> = { ...CAPS };
        let damage = 0;
        let silver = 0;
        let gold = 0;
        let potions = 0;
        let seconds = 0;
        let fought = 0;
        let stoppedBy: Played['stoppedBy'] = 'marches';
        let firstMarchDamage = 0;
        let firstMarchSilver = 0;

        for (let index = 0; index < maxMarches; index += 1) {
          const counts: Record<string, number> = { ...plan.troopCounts };
          let anyHired = false;
          for (const id of MERC_IDS) {
            const size = Math.min(plan.targets[id] ?? 0, stock[id] ?? 0);
            if (size > 0) {
              counts[id] = size;
              anyHired = true;
            }
          }
          if (!anyHired) {
            stoppedBy = 'stock';
            break;
          }
          const ev = evaluateCounts(plan.request, counts);
          const costs = recoveryCosts(ev.result.stacks, plan.request.units, plan.request.recovery);
          const bill = mode === 'retrain' ? costs.retrain : costs.revive;
          if (silver + bill.silver > budget) {
            stoppedBy = 'silver';
            break;
          }
          damage += ev.summary.avgDamage;
          silver += bill.silver;
          gold += bill.gold;
          seconds += bill.seconds;
          potions += ev.result.stacks.reduce((sum, s) => sum + 3 * (s.count - chunks(s.count)), 0);
          for (const id of MERC_IDS) {
            const size = counts[id] ?? 0;
            if (size > 0) stock[id] = Math.max(0, (stock[id] ?? 0) - chunks(size));
          }
          if (fought === 0) {
            firstMarchDamage = ev.summary.avgDamage;
            firstMarchSilver = bill.silver;
          }
          fought += 1;
        }
        return {
          marches: fought,
          stoppedBy,
          damage,
          silver,
          gold,
          potions,
          seconds,
          remaining: stock,
          firstMarchDamage,
          firstMarchSilver,
        };
      };

      // ---- searchComplete at the same budgets, for comparison ------------------------------------
      const searchAnswer: Record<string, { score: number; text: string }> = {};
      for (const mode of ['retrain', 'revive'] as const) {
        const planned: StackRequest = {
          ...base,
          recovery: { ...base.recovery, templeLevel: TEMPLE, plan: { mode } },
        };
        for (const budget of BUDGETS) {
          const found = searchComplete({
            request: planned,
            objective: 'avgDamage',
            campaign: { marches: CAP_MARCHES, silverBudget: budget },
            budgetMs: 20_000,
            spendLevels: [1, 0.75, 0.5, 0.4, 0.3, 0.25, 0.2, 0.15, 0.1],
          });
          const w = found.winner;
          searchAnswer[`${mode}:${budget}`] = {
            score: w.score,
            text: `${w.method} · ${(w.spend * 100).toFixed(0)} % · ${n(w.campaign.fought)} marches · ${w.includedUnitIds.length} types`,
          };
        }
      }

      for (const [mode, maxMarches, title] of [
        [
          'retrain',
          CAP_MARCHES,
          `Retrain plan, at most ${CAP_MARCHES} marches (comparable with \`searchComplete\`)`,
        ],
        ['revive', CAP_MARCHES, `Revive plan (temple 15), at most ${CAP_MARCHES} marches`],
        ['retrain', MAX_MARCHES, `Retrain plan, uncapped (up to ${MAX_MARCHES} marches)`],
        ['revive', MAX_MARCHES, `Revive plan (temple 15), uncapped (up to ${MAX_MARCHES} marches)`],
      ] as const) {
        report.add(`### ${title}`);
        report.add('');
        report.add(
          `| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | \`searchComplete\` (same plan, ≤30) | hand / search |`,
        );
        report.add('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
        for (const budget of BUDGETS) {
          let best: { plan: Plan; played: Played } | undefined;
          for (const plan of plans) {
            const played = play(plan, budget, mode, maxMarches);
            if (!best || played.damage > best.played.damage) best = { plan, played };
          }
          if (!best) continue;
          const { plan, played } = best;
          const left = MERC_IDS.map((id) => n(played.remaining[id] ?? 0)).join('/');
          const search = searchAnswer[`${mode}:${budget}`];
          const ratio = search && search.score > 0 ? (played.damage / search.score) * 100 : 0;
          report.add(
            `| ${n(budget)} | ${plan.subset} | ${(plan.spend * 100).toFixed(0)} % (${MERC_IDS.map((id) => n(plan.targets[id] ?? 0)).join('/')}) | ${plan.leadershipChoice} ${n(plan.leadership)} | ${n(played.marches)} | ${played.stoppedBy} | ${n(Math.round(played.damage))} | ${n(Math.round(played.silver))} | ${n(Math.round(played.gold))} | ${n(played.potions)} | ${left} | ${n(Math.round(search?.score ?? 0))} (${search?.text ?? '—'}) | ${ratio.toFixed(1)} % |`,
          );
        }
        report.add('');
      }

      // ---- The full grid at one revealing budget --------------------------------------------------
      const focus = 2e7;
      report.add(`### The whole grid at S = ${n(focus)} (retrain, ≤ ${CAP_MARCHES} marches)`);
      report.add('');
      report.add(
        '| subset | spend | hired counts | L choice | L | silver/march | marches | total avg damage | stopped by | mercenaries left |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|---|');
      for (const plan of plans) {
        const played = play(plan, focus, 'retrain', CAP_MARCHES);
        report.add(
          `| ${plan.subset} | ${(plan.spend * 100).toFixed(0)} % | ${MERC_IDS.map((id) => n(plan.targets[id] ?? 0)).join('/')} | ${plan.leadershipChoice} | ${n(plan.leadership)} | ${n(Math.round(played.firstMarchSilver))} | ${n(played.marches)} | ${n(Math.round(played.damage))} | ${played.stoppedBy} | ${MERC_IDS.map((id) => n(played.remaining[id] ?? 0)).join('/')} |`,
        );
      }
      report.add('');

      // ---- The leadership lever on its own ---------------------------------------------------------
      report.add('### The leadership lever, isolated (same subset, same spend, min L vs full L)');
      report.add('');
      report.add(
        'The tables above mix three decisions. Here only the leadership moves: for every (subset, spend) the ' +
          'best of the two leadership choices is reported, so the ratio is the lever and nothing else.',
      );
      report.add('');
      report.add(
        '| plan | budget S | best subset · spend | min L: marches / damage | full L: marches / damage | min L wins by |',
      );
      report.add('|---|---|---|---|---|---|');
      for (const mode of ['retrain', 'revive'] as const) {
        for (const budget of BUDGETS) {
          let best: { plan: Plan; minPlayed: Played; fullPlayed: Played; gain: number } | undefined;
          for (const plan of plans.filter((p) => p.leadershipChoice === 'min L')) {
            const twin = plans.find(
              (p) => p.subset === plan.subset && p.spend === plan.spend && p.leadershipChoice === 'full L',
            );
            if (!twin) continue;
            const minPlayed = play(plan, budget, mode, CAP_MARCHES);
            const fullPlayed = play(twin, budget, mode, CAP_MARCHES);
            const best2 = Math.max(minPlayed.damage, fullPlayed.damage);
            if (!best || best2 > Math.max(best.minPlayed.damage, best.fullPlayed.damage)) {
              best = { plan, minPlayed, fullPlayed, gain: minPlayed.damage / Math.max(1, fullPlayed.damage) };
            }
          }
          if (!best) continue;
          const gainText =
            best.fullPlayed.damage <= 0
              ? '∞ (full L cannot afford one march)'
              : `${((best.gain - 1) * 100).toFixed(1)} %`;
          report.add(
            `| ${mode} | ${n(budget)} | ${best.plan.subset} · ${(best.plan.spend * 100).toFixed(0)} % | ${n(best.minPlayed.marches)} / ${n(Math.round(best.minPlayed.damage))} | ${n(best.fullPlayed.marches)} / ${n(Math.round(best.fullPlayed.damage))} | ${gainText} |`,
          );
        }
      }
      report.add('');

      // ---- What reviving does to the same campaign -------------------------------------------------
      report.add('### What reviving does, plan by plan (S = 20 M, ≤ 30 marches)');
      report.add('');
      report.add(
        '| subset | spend | L choice | retrain: marches / damage / silver / gold | revive: marches / damage / silver / gold | silver ratio |',
      );
      report.add('|---|---|---|---|---|---|');
      for (const plan of plans.filter((p) => p.leadershipChoice === 'full L')) {
        const r = play(plan, focus, 'retrain', CAP_MARCHES);
        const v = play(plan, focus, 'revive', CAP_MARCHES);
        report.add(
          `| ${plan.subset} | ${(plan.spend * 100).toFixed(0)} % | ${plan.leadershipChoice} | ${n(r.marches)} / ${n(Math.round(r.damage))} / ${n(Math.round(r.silver))} / ${n(Math.round(r.gold))} | ${n(v.marches)} / ${n(Math.round(v.damage))} / ${n(Math.round(v.silver))} / ${n(Math.round(v.gold))} | ${r.silver > 0 && v.silver > 0 ? `÷ ${(r.silver / v.silver).toFixed(1)}` : '—'} |`,
        );
      }
      report.add('');
    }

    report.h('What the leadership dimension says');
    report.add('');
    report.add(
      [
        '- **Cutting the leadership is the only way silver buys more marches.** At full leadership the silver per',
        '  march is fixed, so `S` and the troop set alone decide the march count. At min L the same `S` pays for',
        '  substantially more marches, each one carrying the *same hired damage* — which is the free half. Scenario B,',
        '  7 types at 20 % spend, min L 1,162 of 4,343: **15 marches instead of 4 for S = 10 M, and 28.4 M damage',
        '  instead of 12.1 M — +135 %.** At S = 2 M full leadership cannot afford a single march and min L fights',
        '  three.',
        '- **Whether that wins depends on which constraint bites first.** At small and middling budgets silver binds',
        '  and the cheap march wins outright (+134 %, +135 %, +41 % at S = 10, 20 and 40 M under retrain). At large',
        '  budgets the stock binds: once `ceil(n/10)` has eaten the mercenaries, extra cheap marches are troop-only',
        '  marches worth a fraction of a real one, and full leadership wins back — under the **revive** plan at',
        '  S ≥ 10 M full L is already 2.8 % ahead.',
        '- **Reviving moves the line, hard.** The Temple divides the silver per march by about ten, so a 2 M budget',
        '  that bought three cheap marches under retrain buys thirty under revive: **56.6 M damage for 1.93 M silver',
        "  and 91.7 K gold** — ten times the retrain plan's total at the same silver. Beyond that the constraint is",
        '  no longer silver but gold (≈ 320 K for thirty marches) and stock, and the leadership lever stops mattering.',
        '- **The ceiling of this account, at 20 % spend and revive, is ≈ 176 M total damage over 72 marches** (the',
        '  uncapped table), at which point every mercenary is gone. That is the number 92 + 76 + 72 + 37 of stock is',
        '  actually worth if it is spent ten units at a time instead of all at once.',
        '- **`searchComplete` cannot express any of this**, because every march it plays is sized by `sizeStacks` at',
        '  full leadership. Read the "hand / search" column with care: the hand grid only carries **two** subsets',
        "  against the search's 4,095, so a figure below 100 % is the search winning on *subset choice*, not the",
        '  leadership lever losing. The isolated table above is the lever on its own. The missing engine feature is a',
        '  **troop budget** — a leadership target below the housing — in `CampaignSettings`.',
      ].join('\n'),
    );

    report.save();
  }, 1_800_000);
});
