/**
 * 242 — **the burn after a take-out** (`docs/plans/burn-ceiling.md` §3.3, step 1: reproduce, do not fix; the
 * owner, 2026-10-18: *"on the silver saver I know I can remove a weak stack like SW1 to put more monsters but this
 * ups the merc burned automatically"*).
 *
 * For every stop of the bar and every type the stop fields, the March edit "take this type out" replayed headlessly
 * through the very path the pane runs (`generate.ts` `planStopAgain` → `resizeMarchOver` → `planMarch`, then the
 * standing Tight raise over the march on screen, `positionTrades(…, ['tight'])` — what `useMarch` lands on when the
 * plan's own table no longer describes the march, `pricedRaise` → `null`). Five readings per row:
 *
 *  - **stop** — the stop as the March shows it before the edit (Tight over the stop's counts);
 *  - **resized** — `resizeMarchOver`'s answer, as is (S-107 caps: `largestSustained(stock, repeats)`);
 *  - **resized+T** — the same, with Tight over it (its burn budget re-read off the resized march);
 *  - **capped** — diagnostic only: `resizeMarchOver` with every hired cap at the stop's own count (S-104's rule);
 *  - **capped+T** — Tight over that;
 *  - **mercCap+T** — diagnostic: only the mercenaries (authority) capped at the stop's counts, monsters at their
 *    pool as today, Tight over it — the per-stack form of "the burn freed stays unspent".
 *
 * The account is `PYRRHIC_ACCOUNT` (an app profile export, never committed), active setup.
 * `THEORY=1 PYRRHIC_ACCOUNT=/path/to/export.json pnpm vitest run tools/theorycraft/242-the-burn-after-a-take-out.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { largestSustained, planMarch, planRepeats, resizeMarchOver, withMethod } from '../../src/engine';
import { planCampaign, type MarchWithin } from '../../src/engine/plan';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { positionTrades, type PositionReading } from '../../src/ui/sections/march/positions';
import { troopFloor } from '../../src/ui/sections/march/raise';
import { OUT_DIR, label } from './harness';

const ACCOUNT = process.env.PYRRHIC_ACCOUNT ?? '';
const ORDER = ['silver-saver', 'burn-saver', 'sweet-spot', 'thrifty', 'more-mercs', 'steady-max', 'all-in'];

type Reading = Pick<PositionReading, 'damage' | 'mercLost' | 'silver' | 'gold'> & { units: number };

/** The march as is, and with the standing Tight over it (the March's default). */
function shown(request: StackRequest, base: StackResult): { asIs: Reading; tight: Reading } {
  if (troopFloor(base) === null) {
    const own = positionTrades(request, base, []).own;
    return { asIs: own, tight: own };
  }
  const trades = positionTrades(request, base, ['tight']);
  return { asIs: trades.own, tight: trades.rows[0] ?? trades.own };
}

const n = (v: number): string => Math.round(v).toLocaleString('en-US');
const d = (a: number, b: number): string => {
  const v = a - b;
  return v === 0 ? '0' : `${v > 0 ? '+' : ''}${n(v)}`;
};
const cell = (r: Reading, ref: Reading): string =>
  `${n(r.mercLost)} (${d(r.mercLost, ref.mercLost)}) · ${(r.damage / 1e6).toFixed(3)}M (${((r.damage / ref.damage - 1) * 100).toFixed(1)}%) · ${n(r.silver)} · ${n(r.gold)}`;

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('242 — the burn after a take-out', () => {
  it('replays every take-out on every stop', () => {
    const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = parsed.payload;
    const setup = profile.setups.find((s) => s.id === profile.activeSetupId) ?? profile.setups[0];
    if (!setup) throw new Error('no setup');
    const planInput = { ...buildPlanRequest(profile, setup) };
    delete planInput.budgetMs;
    delete planInput.shouldStop;
    const plan = planCampaign(planInput);
    // The March's request (`runGenerate`): the account's stock as caps, method elite.
    const request: StackRequest = withMethod(buildStackRequest(profile, setup), 'elite');

    const lines: string[] = [
      '# 242 — the burn after a take-out',
      '',
      `account: \`${ACCOUNT.split('/').pop() ?? ''}\` · setup: ${setup.name} · editFills ${JSON.stringify(CAMPAIGN.editFills)}`,
      '',
      'Each cell: merc lost (Δ vs stop) · damage (Δ%) · silver · gold. **stop** = Tight over the stop (what the March',
      'shows before the edit). **resized** = `resizeMarchOver` as the pane calls it; **+T** = Tight over it.',
      '**capped** = diagnostic: hired caps at the stop\'s own counts instead of `largestSustained(stock, repeats)`;',
      '**mercCap** = only the mercs capped at the stop\'s counts, monsters at their pool.',
      '',
    ];
    const stops = [...plan.alternatives].sort((a, b) => ORDER.indexOf(a.pick) - ORDER.indexOf(b.pick));
    for (const stop of stops) {
      const before = shown(request, planMarch(request, stop.counts).result);
      const repeats = planRepeats(stop);
      lines.push(`## ${stop.pick} — repeats ${String(repeats)}`, '');
      lines.push(
        `counts: ${Object.entries(stop.counts)
          .filter(([, c]) => c > 0)
          .map(([id, c]) => `${label(id)} ${n(c)}`)
          .join(', ')}`,
      );
      lines.push(
        `stop as is: ${cell(before.asIs, before.asIs)} · **stop (Tight)**: ${cell(before.tight, before.tight)}`,
        '',
      );
      lines.push('| take out | shape/fill | resized | resized+T | capped | capped+T | mercCap+T | hired Δ (resized) |');
      lines.push('|---|---|---|---|---|---|---|---|');
      const fielded = Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0);
      for (const out of fielded) {
        const included = new Set(fielded.filter((id) => id !== out));
        const troopIds: string[] = [];
        const hired: Record<string, number> = {};
        const capped: Record<string, number> = {};
        const mercCapped: Record<string, number> = {};
        for (const unit of request.units) {
          if (!included.has(unit.id)) continue;
          if (unit.pool === 'leadership') {
            troopIds.push(unit.id);
            continue;
          }
          // `planStopAgain`'s `capOf`, verbatim.
          let cap: number;
          if (unit.pool === 'dominance')
            cap = Math.max(
              stop.counts[unit.id] ?? 0,
              Math.floor(request.housing.dominance / Math.max(1, unit.cost)),
            );
          else {
            const held = request.caps[unit.id];
            cap =
              held === undefined
                ? Math.floor(request.housing.authority / Math.max(1, unit.cost))
                : largestSustained(held, repeats);
          }
          hired[unit.id] = cap;
          capped[unit.id] = Math.min(cap, stop.counts[unit.id] ?? 0);
          mercCapped[unit.id] = unit.pool === 'authority' ? Math.min(cap, stop.counts[unit.id] ?? 0) : cap;
        }
        if (troopIds.length === 0) continue;
        const within = (h: Record<string, number>): MarchWithin => ({
          troopIds,
          hired: h,
          stop: stop.counts,
          fills: CAMPAIGN.editFills,
          putBack: CAMPAIGN.putBack,
        });
        const answer = resizeMarchOver(request, within(hired));
        const answerC = resizeMarchOver(request, within(capped));
        const answerM = resizeMarchOver(request, within(mercCapped));
        if (answer === null || answerC === null || answerM === null) {
          lines.push(`| ${label(out)} | null | | | | | | |`);
          continue;
        }
        const r = shown(request, planMarch(request, answer.counts).result);
        const c = shown(request, planMarch(request, answerC.counts).result);
        const m = shown(request, planMarch(request, answerM.counts).result);
        const ref = before.tight;
        // Which hired stacks moved, Tight-over-resized vs Tight-over-stop: read off the resized answer's counts.
        const moved = Object.keys({ ...answer.counts, ...stop.counts })
          .filter((id) => request.units.find((u) => u.id === id)?.pool !== 'leadership')
          .filter((id) => (answer.counts[id] ?? 0) !== (stop.counts[id] ?? 0))
          .map((id) => `${label(id)} ${n(stop.counts[id] ?? 0)}→${n(answer.counts[id] ?? 0)}`)
          .join(', ');
        lines.push(
          `| ${label(out)} | ${answer.shape}/${String(answer.fill)} | ${cell(r.asIs, ref)} | ${cell(r.tight, ref)} | ${cell(c.asIs, ref)} | ${cell(c.tight, ref)} | ${cell(m.tight, ref)} | ${moved} |`,
        );
      }
      lines.push('');
    }
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(new URL('242-the-burn-after-a-take-out.md', OUT_DIR), `${lines.join('\n')}\n`);
  }, 1_800_000);
});
