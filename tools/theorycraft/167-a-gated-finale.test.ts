/**
 * 167 — **a gated finale** (W12 §2d, `docs/plans/the-remaining-gaps.md`).
 *
 * 165: `finaleFor` sizes the finale's ladders off the biggest **leftover** stack × (1 + gap). On the owner's live
 * camp (legionary 879 left, 10.07M HP) no ladder fits, so the last march falls back to the whole-army sizer's
 * token march. Sizing the finale on the biggest tight ladder the leadership pays for, the leftovers sheltered
 * under it, lifted MX by about +10 — but ungated it cost HS −158.67 and other stops.
 *
 * The prototype (a temporary patch of `plan.ts`, worktree of 0a688ac, **not shipped**): `finaleFor` also builds
 * that **own-ladder finale** (for each depth, the biggest tight ladder the leadership pays for, the leftovers
 * lowered under it by `shelterUnder`, the housing checked, the silver left checked). The scorer takes it
 *
 *  - `off`: never (the engine as shipped);
 *  - `ungated`: when it out-damages the finale `finaleFor` picked (165's variant 2);
 *  - `gated`: when `rate(the campaign with the old finale, the campaign with the own-ladder one, markerRates) > 0`
 *    — each campaign priced by the plan's own `toMarch` (silver, gold, hired, coins, queue), per candidate
 *    inside the scorer;
 *  - `stop`: **at the bar**, after the fold and the re-typing: each repeated stop's finale is swapped for the
 *    best own-ladder finale on that stop's own leftovers when `rate(stop, stop with it, markerRates) > 0`, and
 *    only if the silver saver stays the cheapest, the burn saver the fewest burned, no stop then beats another
 *    outright, and no reading of the bar is lost for more than the swap's rating (§1's rule);
 *  - `stopRetype`: `stop`, the own-ladder finale re-typed (`retypeMarch`) before it is rated.
 *
 * The mode is read from `FINALE167` each time `makeScorer` is built, so one run plans every army three times.
 * **On an engine without the patch the three modes are the same plan** — the recorded figures of the patched
 * run are in §C of the report.
 *
 * On every benchmark army: every stop rated against its own name before (`rate(off, x)`), the ten readings (the
 * bar's best on each), TotalStack at matched spend (`matchedSpend`), TotalStack rows beating every stop on damage
 * and rating (162's test), and the bar's criteria (sheltered, sustained, order, no stop beating another, ≤ 5
 * stops, a sweet spot).
 *
 * `THEORY=1 npx vitest run tools/theorycraft/167-a-gated-finale.test.ts`
 */
/// <reference types="node" />
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import type { Bill } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import type { Contender } from '../../tests/engine/matched-spend';
import { matchedSpend } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const RATES = CAMPAIGN.markerRates;
const MODES = ['off', 'ungated', 'gated', 'stop', 'stopRetype'] as const;
type Mode = (typeof MODES)[number];
const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const short = (pick: string): string => SHORT[pick] ?? pick;
const billOf = (c: Campaign): Bill => ({
  damage: c.damage,
  silver: c.silver,
  gold: c.gold,
  hired: c.burned,
  dragonCoins: c.dragonCoins,
  seconds: c.seconds,
});
const READINGS = [
  { head: 'most damage', of: (c: Campaign) => c.damage, high: true },
  { head: 'least silver', of: (c: Campaign) => c.silver, high: false },
  { head: 'fewest hired', of: (c: Campaign) => c.burned, high: false },
  { head: 'least gold', of: (c: Campaign) => c.gold, high: false },
  { head: 'fewest coins', of: (c: Campaign) => c.dragonCoins, high: false },
  { head: 'shortest queue', of: (c: Campaign) => c.seconds, high: false },
  { head: 'dmg/silver', of: (c: Campaign) => (c.silver > 0 ? c.damage / c.silver : 0), high: true },
  { head: 'dmg/hired', of: (c: Campaign) => c.hiredDamage / Math.max(1, c.burned), high: true },
  { head: 'dmg/gold', of: (c: Campaign) => (c.gold > 0 ? c.damage / c.gold : 0), high: true },
  { head: 'dmg/coin', of: (c: Campaign) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0), high: true },
] as const;
type Reading = (typeof READINGS)[number];
const barBest = (set: Campaign[], r: Reading): number =>
  r.high ? Math.max(...set.map((c) => r.of(c))) : Math.min(...set.map((c) => r.of(c)));
const gain = (after: number, before: number, r: Reading): number =>
  before === after
    ? 0
    : before === 0
      ? r.high
        ? 100
        : -100
      : ((r.high ? after - before : before - after) / Math.abs(before)) * 100;
const HEAD =
  '| dmg | silver | hired | gold | coins | queue h | dmg/silver | dmg/hired | dmg/gold | dmg/coin |';
const cells = (c: Campaign): string =>
  `${n(Math.round(c.damage))} | ${n(Math.round(c.silver))} | ${n(c.burned)} | ${n(Math.round(c.gold))} | ` +
  `${n(Math.round(c.dragonCoins))} | ${n(Math.round(c.seconds / 3600))} | ` +
  `${(c.silver > 0 ? c.damage / c.silver : 0).toFixed(3)} | ${n(Math.round(c.hiredDamage / Math.max(1, c.burned)))} | ` +
  `${c.gold > 0 ? n(Math.round(c.damage / c.gold)) : '—'} | ${c.dragonCoins > 0 ? n(Math.round(c.damage / c.dragonCoins)) : '—'} |`;
const marchText = (request: StackRequest, counts: Record<string, number>): string => {
  const pools = new Map(request.units.map((u) => [u.id, u.pool]));
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => (pools.get(a[0]) === 'leadership' ? 0 : 1) - (pools.get(b[0]) === 'leadership' ? 0 : 1))
    .map(([id, c]) => `${id} ${n(c)}${pools.get(id) === 'leadership' ? '' : '*'}`)
    .join(', ');
};

const plan = (request: StackRequest, mode: Mode): CampaignPlan | undefined => {
  const held = process.env.FINALE167;
  process.env.FINALE167 = mode;
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return undefined;
  } finally {
    if (held === undefined) delete process.env.FINALE167;
    else process.env.FINALE167 = held;
  }
};

const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((s) => s.totalHp));
  return result.stacks.filter((s) => s.pool !== 'leadership').every((s) => s.totalHp < floor);
};
const sustained = (request: StackRequest, marches: Record<string, number>[]): boolean => {
  const left: Record<string, number> = {};
  for (const unit of request.units) {
    if (unit.pool !== 'authority') continue;
    const cap = request.caps[unit.id];
    if (cap !== undefined) left[unit.id] = cap;
  }
  for (const march of marches) {
    for (const [id, cap] of Object.entries(left)) {
      const count = march[id] ?? 0;
      if (count > cap) return false;
      left[id] = cap - chunks(count);
    }
  }
  return true;
};
const criteria = (request: StackRequest, rows: PlanRow[], priced: Campaign[]): string[] => {
  const broken: string[] = [];
  if (rows.length > 5) broken.push('more than five stops');
  if (!rows.some((row) => row.pick === 'sweet-spot')) broken.push('no sweet spot');
  const rungs = rows.filter((row) => row.pick !== 'all-in');
  for (let i = 1; i < rungs.length; i += 1) {
    const p = rungs[i - 1] as PlanRow;
    const q = rungs[i] as PlanRow;
    if (q.repeat.mercLost <= p.repeat.mercLost || q.repeat.damage <= p.repeat.damage)
      broken.push(`order at ${short(q.pick)}`);
  }
  rows.forEach((x, i) => {
    const cx = priced[i] as Campaign;
    rows.forEach((y, k) => {
      if (x === y || x.pick === 'all-in' || y.pick === 'all-in') return;
      const cy = priced[k] as Campaign;
      const dom =
        cx.damage >= cy.damage &&
        cx.silver <= cy.silver &&
        cx.burned <= cy.burned &&
        cx.gold <= cy.gold &&
        (cx.damage > cy.damage || cx.silver < cy.silver || cx.burned < cy.burned || cx.gold < cy.gold);
      if (dom) broken.push(`${short(x.pick)} beats ${short(y.pick)}`);
    });
    const marches = marchesOf(x as PlanTotals);
    if (!marches.every((m) => sheltered(request, m))) broken.push(`${short(x.pick)} unsheltered`);
    if (!sustained(request, marches)) broken.push(`${short(x.pick)} unsustained`);
  });
  return broken;
};

describe.skipIf(!process.env.THEORY)('a gated finale', () => {
  it('rates the own-ladder finale, ungated and gated, against the shipped plan on every army', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('167-a-gated-finale');
    report.add('# 167 — a gated finale\n');
    report.add(
      'W12 §2d. The plan as shipped (`CAMPAIGN.planFixes`, `CAMPAIGN.putBack`) against the same plan with the ' +
        '**own-ladder finale** (`finaleFor` also tries, for each depth, the biggest tight ladder the leadership pays ' +
        'for, the leftovers sheltered under it by `shelterUnder`, the housing and the silver left checked), taken ' +
        '**ungated** (when it out-damages the finale `finaleFor` picked — 165’s variant 2), **gated** (when ' +
        '`rate(campaign with the old finale, campaign with the own-ladder one, markerRates) > 0`, both priced by the ' +
        'plan’s `toMarch`, per candidate inside the scorer), **stop** (the same gate at the bar, after the fold and the ' +
        're-typing, on each repeated stop’s own leftovers; the silver saver kept cheapest, the burn saver fewest ' +
        'burned, no stop beating another, no reading lost for more than the swap’s rating) or **stopRetype** (stop, ' +
        'the finale re-typed first). Temporary patch, worktree of 0a688ac, not shipped; the mode is `FINALE167`. Four-march ' +
        'campaigns, worst opening (`campaignOf`). Every stop is rated against the stop of the same name before ' +
        '(`rate(off, x)`); **+** better, **−** worse. Training bonuses are not applied (W11 §6.1).\n',
    );

    type Run = { plan: CampaignPlan; priced: Campaign[] };
    const tot: Record<
      string,
      {
        b: number;
        e: number;
        w: number;
        worst: number;
        worstAt: string;
        beat: number;
        out: number;
        kept: number;
        broken: number;
        only: string[];
      }
    > = {};
    for (const m of MODES)
      tot[m] = {
        b: 0,
        e: 0,
        w: 0,
        worst: Infinity,
        worstAt: '',
        beat: 0,
        out: 0,
        kept: 0,
        broken: 0,
        only: [],
      };
    const readBetter: Record<string, Record<string, number>> = Object.fromEntries(MODES.map((m) => [m, {}]));
    const readWorse: Record<string, Record<string, number>> = Object.fromEntries(MODES.map((m) => [m, {}]));
    const summary = [
      '| army | mode | stops | better / equal / worse | worst | per stop (rating vs off) | ' +
        READINGS.map((r) => r.head).join(' | ') +
        ' | TS matched (dominated / no fit) | TS kept | criteria |\n|---|---|---|---|---:|---|' +
        '---|'.repeat(READINGS.length) +
        '---|---|---|',
    ];
    const movedLines: string[] = [];
    let liveDetail = '';

    for (const scenario of scenarios) {
      const request = scenario.request;
      const label = scenario.label.slice(0, 44);
      const runs: Partial<Record<Mode, Run>> = {};
      for (const m of MODES) {
        const p = plan(request, m);
        if (!p || p.alternatives.length === 0) continue;
        runs[m] = {
          plan: p,
          priced: p.alternatives.map((row) =>
            campaignOf(request, row.pick, 'plan', marchesOf(row as PlanTotals)),
          ),
        };
      }
      const off = runs.off;
      if (!off) {
        summary.push(`| ${label} | refused | | | | |${' |'.repeat(READINGS.length)} | | |`);
        continue;
      }
      const held = new Set(request.units.map((u) => u.id));
      const ts: Campaign[] = [];
      for (const e of [...scenario.externals, ...totalstackRows(scenario.label)]) {
        if (!e.name.startsWith('TotalStack')) continue;
        if (Object.entries(e.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
        const row = asCaptured(widenedFor(request, e.counts), e.name, e.counts);
        if (row.damage > 0) ts.push(row);
      }
      const keptBy = (set: Campaign[]): Campaign[] =>
        ts.filter((row) =>
          set.every((s) => s.damage < row.damage && rate(billOf(row), billOf(s), RATES) <= 0),
        );

      for (const m of MODES) {
        const run = runs[m];
        if (!run) {
          summary.push(`| ${label} | ${m} | refused |`);
          continue;
        }
        const t = tot[m] as (typeof tot)[string];
        let b = 0;
        let e = 0;
        let w = 0;
        let worst = Infinity;
        const per: string[] = [];
        run.plan.alternatives.forEach((row, i) => {
          const j = off.plan.alternatives.findIndex((o) => o.pick === row.pick);
          const before = off.priced[j];
          const after = run.priced[i] as Campaign;
          if (j < 0 || !before) {
            t.only.push(`${label}: ${short(row.pick)} only ${m}`);
            per.push(`${short(row.pick)} new`);
            return;
          }
          const r = rate(billOf(before), billOf(after), RATES);
          if (r > 1e-9) b += 1;
          else if (r < -1e-9) w += 1;
          else e += 1;
          worst = Math.min(worst, r);
          if (r < t.worst) {
            t.worst = r;
            t.worstAt = `${label} ${short(row.pick)}`;
          }
          per.push(
            `${short(row.pick)} ${Math.abs(r) < 1e-9 ? '0' : `${r > 0 ? '+' : '−'}${Math.abs(r).toFixed(2)}`}`,
          );
          if (m !== 'off' && Math.abs(r) > 1e-9) {
            const last = (c: Record<string, number>[]): Record<string, number> => c[c.length - 1] ?? {};
            const bm = marchesOf(off.plan.alternatives[j] as PlanTotals);
            const am = marchesOf(row as PlanTotals);
            movedLines.push(
              `| ${label} | ${m} | ${short(row.pick)} | ${marchText(request, am[0] ?? {})} | ${marchText(request, last(bm))} → ${marchText(request, last(am))} | ` +
                `${n(Math.round(before.damage))} → ${n(Math.round(after.damage))} | ${n(Math.round(before.silver))} → ${n(Math.round(after.silver))} | ` +
                `${n(before.burned)} → ${n(after.burned)} | ${n(Math.round(before.gold))} → ${n(Math.round(after.gold))} | ` +
                `${n(Math.round(before.seconds / 3600))} → ${n(Math.round(after.seconds / 3600))} | ${r.toFixed(2)} |`,
            );
          }
        });
        for (const o of off.plan.alternatives)
          if (!run.plan.alternatives.some((x) => x.pick === o.pick)) {
            t.only.push(`${label}: ${short(o.pick)} dropped ${m}`);
            per.push(`${short(o.pick)} dropped`);
          }
        t.b += b;
        t.e += e;
        t.w += w;
        const changes = READINGS.map((r) => gain(barBest(run.priced, r), barBest(off.priced, r), r));
        if (m !== 'off')
          READINGS.forEach((r, i) => {
            const c = changes[i] ?? 0;
            if (c > 1e-9)
              (readBetter[m] as Record<string, number>)[r.head] =
                ((readBetter[m] as Record<string, number>)[r.head] ?? 0) + 1;
            if (c < -1e-9)
              (readWorse[m] as Record<string, number>)[r.head] =
                ((readWorse[m] as Record<string, number>)[r.head] ?? 0) + 1;
          });
        const ms =
          ts.length > 0
            ? matchedSpend(run.priced as Contender[], ts as Contender[])
            : { rowsBeaten: 0, unfitted: 0 };
        t.beat += ms.rowsBeaten;
        t.out += ms.unfitted;
        const kept = keptBy(run.priced);
        t.kept += kept.length;
        const broken = criteria(request, run.plan.alternatives, run.priced);
        if (broken.length > 0) t.broken += 1;
        summary.push(
          `| ${label} | ${m} | ${String(run.priced.length)} | ${String(b)} / ${String(e)} / ${String(w)} | ${Number.isFinite(worst) ? worst.toFixed(2) : '—'} | ${per.join(', ')} | ` +
            READINGS.map((r, i) => {
              const c = changes[i] ?? 0;
              const v = barBest(run.priced, r);
              const s =
                r.head === 'shortest queue'
                  ? `${n(Math.round(v / 3600))} h`
                  : r.head === 'dmg/silver'
                    ? v.toFixed(3)
                    : v === 0 && r.high
                      ? '—'
                      : n(Math.round(v));
              return Math.abs(c) > 1e-9 ? `**${s} (${c > 0 ? '+' : '−'}${Math.abs(c).toFixed(1)} %)**` : s;
            }).join(' | ') +
            ` | ${String(ms.rowsBeaten)} / ${String(ms.unfitted)} of ${String(ts.length)} | ${String(kept.length)}${kept.length > 0 ? ` (${kept.map((k) => `${k.name.replace('TotalStack · ', '')} ${(k.damage / 1e6).toFixed(2)}M`).join('; ')})` : ''} | ${broken.join('; ') || '✓'} |`,
        );
      }

      if (scenario.label.includes('live camp of 2026-09-18')) {
        const lines = [
          `| mode | stop | first march | last march | ${HEAD.slice(2)} rating vs off |`,
          `|---|---|---|---|${'---:|'.repeat(11)}`,
        ];
        for (const m of MODES) {
          const run = runs[m];
          if (!run) continue;
          run.plan.alternatives.forEach((row, i) => {
            const c = run.priced[i] as Campaign;
            const j = off.plan.alternatives.findIndex((o) => o.pick === row.pick);
            const before = off.priced[j];
            const ms = marchesOf(row as PlanTotals);
            lines.push(
              `| ${m} | ${short(row.pick)} | ${marchText(request, ms[0] ?? {})} | ${marchText(request, ms[ms.length - 1] ?? {})} | ${cells(c)} ${before ? rate(billOf(before), billOf(c), RATES).toFixed(2) : 'new'} |`,
            );
          });
        }
        const tsLines = ts.map(
          (row) =>
            `| ${row.name} | ${cells(row)} ${MODES.map((m) => {
              const run = runs[m];
              if (!run) return '—';
              const beaten = run.priced.some(
                (s) => s.damage >= row.damage || rate(billOf(row), billOf(s), RATES) > 0,
              );
              return beaten ? 'beaten' : '**ahead**';
            }).join(' | ')} |`,
        );
        liveDetail =
          '\n## A. The owner’s live camp of 2026-09-18, every stop and every marker\n\n' +
          lines.join('\n') +
          '\n\n**TotalStack rows on the live camp** (beaten = some stop deals at least as much or rates above 0 against it):\n\n' +
          `| row | ${HEAD.slice(2)} ${MODES.join(' | ')} |\n|---|${'---:|'.repeat(10)}${'---|'.repeat(MODES.length)}\n` +
          tsLines.join('\n') +
          '\n';
      }
    }

    report.add(liveDetail);
    report.add('\n## B. Every army, every mode\n');
    report.add(summary.join('\n'));
    const totals = MODES.map((m) => {
      const t = tot[m] as (typeof tot)[string];
      return (
        `| ${m} | ${String(t.b)} / ${String(t.e)} / ${String(t.w)} | ${Number.isFinite(t.worst) ? `${t.worst.toFixed(2)} (${t.worstAt})` : '—'} | ` +
        `${String(t.beat)} / ${String(t.out)} | ${String(t.kept)} | ${String(t.broken)} | ${t.only.join('; ') || '—'} |`
      );
    });
    report.add(
      '\n\n**Totals.**\n\n| mode | stops better / equal / worse | worst | TS matched spend (dominated / no fit) | TS rows kept | armies breaking a criterion | stops on one bar only |\n|---|---|---|---|---:|---:|---|\n' +
        totals.join('\n') +
        '\n\n**The ten readings** (armies where the bar’s best moved against off; better / worse):\n\n| reading | ' +
        MODES.slice(1).join(' | ') +
        ' |\n|---|' +
        '---:|'.repeat(MODES.length - 1) +
        '\n' +
        READINGS.map(
          (r) =>
            `| ${r.head} | ${MODES.slice(1)
              .map((m) => `${String(readBetter[m]?.[r.head] ?? 0)} / ${String(readWorse[m]?.[r.head] ?? 0)}`)
              .join(' | ')} |`,
        ).join('\n') +
        '\n',
    );
    report.add(
      '\n## Every stop that moved\n\n| army | mode | stop | first march | last march off → mode | dmg | silver | hired | gold | queue h | rating vs off |\n|---|---|---|---|---|---|---|---|---|---|---:|\n' +
        (movedLines.join('\n') || '| — |') +
        '\n',
    );
    report.add(
      '\n## C. Recorded on the patched engine (worktree of 0a688ac, 2026-09-23)\n\n' +
        '- **ungated** (165’s variant 2) reproduces 165: live camp MX 40.09M → 49.19M, and HS −173.63 there; 18 stops worse ' +
        'over the benchmark, the worst −227.77 (localStorage camp HS); TotalStack at matched spend 70/13 → 68/26.\n' +
        '- **gated in the scorer** (the brief’s gate, per candidate): 6 better / 50 equal / 5 worse, the worst −12.00 (live camp ' +
        'SW). The gate holds per candidate, but the stops are chosen afterwards on other terms (the sweet spot’s chord, the ' +
        'fold, the put-back, the re-typing), so a stop can land on a candidate whose rival was never its old self. Rejected.\n' +
        '- **stop** (the gate at the bar, after the fold and the re-typing): **9 better / 52 equal / 0 worse**; live camp MX ' +
        '+7.81 (40,085,840 → 49,190,513; hired 268 → 344, gold 39,152 → 51,192, silver +12.4 %, queue +24 %), MM +13.11; no ' +
        'bar reading worse on any army; TotalStack 70/13 unchanged, rows kept 2 → 2 (the two 49.23M rows are still ahead). ' +
        'Suite (`vitest run tests`): 33 → 36 red, the three new ones in `plan-stops` › the rated re-typing (7 000 export, ' +
        'evening, live camp: that test compares the bar with and without the re-typing, and the finale swap runs on both ' +
        'sides with different finales) and one in `plan-benchmark` (message camp: its bar pins “4 stops dominating” and ' +
        '“best a hired does not beat the sizers”, both moved by the better stops).\n' +
        '- **stopRetype** (stop, the finale re-typed before rating): 22 / 39 / 0; dmg/hired worse on 2 armies (7 000 export ' +
        '−0.3 %, localStorage camp −1.7 %) and dmg/silver on 1 (evening −0.2 %).\n',
    );
    const file = report.save();
    // eslint-disable-next-line no-console
    console.log(`written ${file}`);
  }, 3_600_000);
});
