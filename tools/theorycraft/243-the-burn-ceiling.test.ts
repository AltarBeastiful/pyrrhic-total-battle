/**
 * 243 — **the burn ceiling** (`docs/plans/burn-ceiling.md` §3.2/§3.3, step 2: the engine half, measured; the
 * owner, 2026-10-18: *"there should be a way to conserve merc burns"*).
 *
 * Two readings, on the owner's account (`PYRRHIC_ACCOUNT`, never committed) and on every benchmark army with a
 * hired type (`criteriaScenarios`):
 *
 *  1. **A ceiling on the march on screen.** For every stop of the bar, Tight over the stop (the March's default)
 *     and the same under a ceiling at 100 / 90 / 75 / 50 % of the stop's own burn (`positionTrades(…, ['tight'],
 *     cap)`: the march trimmed to the ceiling where it is under the stop's burn, then Tight over it under the
 *     same cap). **100 % must be today's Tight byte for byte** — the counts, `how`, `space` and `scored` — and
 *     the column says so.
 *  2. **A take-out.** For every type a stop fields, the March edit "take it out" through `planStopAgain`'s own
 *     arguments, without a ceiling (today, experiment 242's *resized*) and with the take-out default
 *     (`editBurnCap`: the stop's own burn), each with Tight over it. Rows are the ones whose burn moved.
 *
 * `THEORY=1 PYRRHIC_ACCOUNT=/path/to/export.json pnpm vitest run tools/theorycraft/243-the-burn-ceiling.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { largestSustained, planMarch, planRepeats, resizeMarchOver, withMethod } from '../../src/engine';
import { planCampaign, type CampaignPlan, type MarchWithin } from '../../src/engine/plan';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { editBurnCap } from '../../src/ui/sections/march/hired';
import { positionTrades, type PositionReading } from '../../src/ui/sections/march/positions';
import { burnOf, countsOf, troopFloor } from '../../src/ui/sections/march/raise';
import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { OUT_DIR, label } from './harness';

const ACCOUNT = process.env.PYRRHIC_ACCOUNT ?? '';
const ORDER = ['silver-saver', 'burn-saver', 'sweet-spot', 'thrifty', 'more-mercs', 'steady-max', 'all-in'];
const SHARES = [100, 90, 75, 50] as const;

type Stop = CampaignPlan['alternatives'][number];
type Reading = Pick<PositionReading, 'damage' | 'mercLost' | 'silver' | 'gold'>;

const n = (v: number): string => Math.round(v).toLocaleString('en-US');
const pct = (a: number, b: number): string => `${((a / b - 1) * 100).toFixed(1)}%`;
const cell = (r: Reading, ref: Reading): string =>
  `${n(r.mercLost)} · ${(r.damage / 1e6).toFixed(3)}M (${pct(r.damage, ref.damage)}) · ${n(r.silver)} · ${n(r.gold)}`;

/** Tight over a march, under a ceiling or not: the row the March draws (the march as is where nothing shelters). */
function tight(request: StackRequest, base: StackResult, burnCap?: number) {
  if (troopFloor(base) === null) {
    const own = positionTrades(request, base, []).own;
    return { reading: own, row: null };
  }
  const trades = positionTrades(request, base, ['tight'], burnCap);
  const row = trades.rows[0] ?? null;
  return { reading: row ?? trades.own, row };
}

/** `planStopAgain`'s own `within` for a take-out (`generate.ts`'s `capOf`, verbatim) and the set it leaves. */
function takeOut(request: StackRequest, stop: Stop, out: string) {
  const repeats = planRepeats(stop);
  const included = new Set(Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0 && id !== out));
  const troopIds: string[] = [];
  const hired: Record<string, number> = {};
  for (const unit of request.units) {
    if (!included.has(unit.id)) continue;
    if (unit.pool === 'leadership') {
      troopIds.push(unit.id);
      continue;
    }
    const held = request.caps[unit.id];
    hired[unit.id] =
      unit.pool === 'dominance'
        ? Math.max(stop.counts[unit.id] ?? 0, Math.floor(request.housing.dominance / Math.max(1, unit.cost)))
        : held === undefined
          ? Math.floor(request.housing.authority / Math.max(1, unit.cost))
          : largestSustained(held, repeats);
  }
  const within: MarchWithin = {
    troopIds,
    hired,
    stop: stop.counts,
    fills: CAMPAIGN.editFills,
    putBack: CAMPAIGN.putBack,
  };
  return { within, included };
}

/** The two readings on one plan, as Markdown; `tally` counts what the summary prints. */
function report(
  request: StackRequest,
  plan: CampaignPlan,
  tally: { stops: number; identical: number; takeOuts: number; raised: number; held: number },
  takeOutRows: 'moved' | 'all',
): string[] {
  const lines: string[] = [];
  const stops = [...plan.alternatives].sort((a, b) => ORDER.indexOf(a.pick) - ORDER.indexOf(b.pick));
  lines.push('| stop | burn | Tight (today) | 100 % | 90 % | 75 % | 50 % | 100 % = today |');
  lines.push('|---|---|---|---|---|---|---|---|');
  for (const stop of stops) {
    const base = planMarch(request, stop.counts).result;
    const own = burnOf(base, countsOf(base));
    const today = tight(request, base);
    const cells: string[] = [];
    let identical = false;
    for (const share of SHARES) {
      const cap = Math.floor((own * share) / 100);
      const capped = tight(request, base, cap);
      cells.push(cell(capped.reading, today.reading));
      if (share === 100) identical = JSON.stringify(capped.row) === JSON.stringify(today.row);
    }
    tally.stops += 1;
    if (identical) tally.identical += 1;
    lines.push(
      `| ${stop.pick} | ${n(own)} | ${cell(today.reading, today.reading)} | ${cells.join(' | ')} | ${identical ? 'yes' : '**no**'} |`,
    );
  }
  lines.push('', '**Take-outs** (cell: merc lost · damage (Δ vs the stop under Tight) · silver · gold):', '');
  lines.push('| stop | take out | stop+T | resized+T (today) | capped+T (default) | burn |');
  lines.push('|---|---|---|---|---|---|');
  for (const stop of stops) {
    const before = tight(request, planMarch(request, stop.counts).result).reading;
    const fielded = Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0);
    for (const out of fielded) {
      const { within, included } = takeOut(request, stop, out);
      if (within.troopIds.length === 0) continue;
      const burnCap = editBurnCap(request, stop.counts, included);
      const today = resizeMarchOver(request, within);
      const capped = resizeMarchOver(request, burnCap === undefined ? within : { ...within, burnCap });
      if (today === null || capped === null) {
        lines.push(`| ${stop.pick} | ${label(out)} | null | | | |`);
        continue;
      }
      const t = tight(request, planMarch(request, today.counts).result).reading;
      const c = tight(request, planMarch(request, capped.counts).result).reading;
      tally.takeOuts += 1;
      const rose = today.mercLost > (burnCap ?? Infinity);
      if (rose) tally.raised += 1;
      if (rose && c.mercLost <= (burnCap ?? Infinity)) tally.held += 1;
      if (takeOutRows === 'moved' && today.mercLost === capped.mercLost && t.damage === c.damage) continue;
      lines.push(
        `| ${stop.pick} | ${label(out)} | ${cell(before, before)} | ${cell(t, before)} | ${cell(c, before)} | ${n(today.mercLost)} → ${n(capped.mercLost)} (cap ${burnCap === undefined ? '—' : n(burnCap)}) |`,
      );
    }
  }
  lines.push('');
  return lines;
}

describe.skipIf(!process.env.THEORY)('243 — the burn ceiling', () => {
  it('prices the ceiling and the take-out default on the account and the benchmark', () => {
    const lines: string[] = [
      '# 243 — the burn ceiling',
      '',
      'Cells: merc lost · damage (Δ% vs Tight today) · silver · gold. Ceilings are a share of the stop’s own burn,',
      'floored to whole chunks; **100 % = today** compares the Tight row (counts, how, space, scored) byte for byte.',
      '',
    ];
    const totals = { stops: 0, identical: 0, takeOuts: 0, raised: 0, held: 0 };

    if (existsSync(ACCOUNT)) {
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('not a profile export');
      const profile = parsed.payload;
      const setup = profile.setups.find((s) => s.id === profile.activeSetupId) ?? profile.setups[0];
      if (!setup) throw new Error('no setup');
      const planInput = { ...buildPlanRequest(profile, setup) };
      delete planInput.budgetMs;
      delete planInput.shouldStop;
      const plan = planCampaign(planInput);
      const request: StackRequest = withMethod(buildStackRequest(profile, setup), 'elite');
      lines.push(`## The account — \`${ACCOUNT.split('/').pop() ?? ''}\`, setup ${setup.name}`, '');
      lines.push(...report(request, plan, totals, 'all'));
    }

    for (const army of criteriaScenarios()) {
      if (!army.request.units.some((unit) => unit.pool === 'authority')) continue;
      let plan: CampaignPlan;
      try {
        plan = planCampaign({
          request: army.request,
          marchTarget: HORIZON,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }
      lines.push(`## ${army.label}`, '');
      lines.push(...report(army.request, plan, totals, 'moved'));
    }

    lines.push(
      '## Summary',
      '',
      `- ceiling at 100 %: ${n(totals.identical)} of ${n(totals.stops)} stops byte-identical to today's Tight;`,
      `- take-outs: ${n(totals.takeOuts)}; the re-size raised the burn over the stop's on ${n(totals.raised)}, and the default ceiling held ${n(totals.held)} of them at or under it.`,
      '',
    );
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(new URL('243-the-burn-ceiling.md', OUT_DIR), `${lines.join('\n')}\n`);
  }, 3_600_000);
});
