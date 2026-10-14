/**
 * 239 — **the types taken out** (`CAMPAIGN.planFixes.fifthStop.dropTypes`, `trims`; the owner, 2026-10-14: *"its still
 * doesn't find a good alternative on some of my marches … this looks like an inbetween of sweet spot and more mercs but
 * with better silver/dmg and lesser training time … I think there's rows with great rating still getting lost"*).
 *
 * His 10-14 march (SP1 1624 · RD1 859 · SW2 1302 · ARC2 951 · SP2 896 · RD2 473 · ARC3 532 · SP3 501 · RD3 265 ·
 * EMH6 42 · WE 50 · ED 21 · BB 24 · SG 18) is, to the unit, the Elite sizer's sheltered maximum over every troop type
 * but Swordsman I and Archer I — what the March pane builds when those two are taken out. The plan's search sizes over
 * every type or over a prefix of the troop ranking and never asks for that set, so the thrifty stop never saw it.
 *
 * This runs `planCampaign` itself on the 19 benchmark armies (plus `PYRRHIC_HORIZON_EXPORT`'s account exports) under
 * four pools for the thrifty stop — the band alone (`dropTypes: 0`), and the band plus the marches with up to 1, 2 and
 * 3 troop types taken out (`trims` as configured) — and writes, per army and pool, the thrifty pick against the sweet
 * spot on every marker, and the plan's wall clock. Every other stop is the same march under every pool (the stop is
 * read off the finished bar), which the run asserts.
 *
 * `THEORY=1 PYRRHIC_HORIZON_EXPORT=a.json,b.json pnpm vitest run tools/theorycraft/239-the-types-taken-out.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { rate } from '../../src/engine/rating';
import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { OUT_DIR } from './harness';

const DROPS = [0, 1, 2, 3];

interface Pick {
  damage: number;
  silver: number;
  burn: number;
  gold: number;
  coins: number;
  seconds: number;
  perSilver: number;
  perMerc: number;
  counts: Record<string, number>;
  shape: string;
}

const pickOf = (row: PlanRow): Pick => {
  const r = row.repeat;
  return {
    damage: r.damage,
    silver: r.silver,
    burn: r.mercLost,
    gold: r.gold,
    coins: r.dragonCoins ?? 0,
    seconds: r.seconds,
    perSilver: r.silver > 0 ? r.damage / r.silver : Infinity,
    perMerc: r.hiredDamage / Math.max(1, r.mercLost),
    counts: row.counts,
    shape: row.shape,
  };
};

const pct = (a: number, b: number): string => {
  if (b === 0) return a === 0 ? '0.0' : '—';
  const v = (a / b - 1) * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
};
const n = (v: number): string => Math.round(v).toLocaleString('en-US');
const days = (s: number): string => `${Math.floor(s / 86400)} d ${String(Math.round((s % 86400) / 3600))} h`;

describe.skipIf(!process.env.THEORY)('239 — the types taken out', () => {
  it('measures the thrifty stop with the types-taken-out family', () => {
    const profile = ownerProfile();
    const armies: { label: string; request: StackRequest }[] = [
      ...commonScenarios(),
      ...(profile ? ownerScenarios(profile) : []),
    ].map((s) => ({ label: s.label, request: s.request }));
    for (const file of (process.env.PYRRHIC_HORIZON_EXPORT ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f !== '')) {
      if (!existsSync(file)) continue;
      const parsed = parseImport(readFileSync(file, 'utf8'));
      const setup = parsed.kind === 'profile' ? parsed.payload.setups[0] : undefined;
      if (parsed.kind !== 'profile' || !setup) continue;
      armies.push({ label: `export · ${basename(file)}`, request: buildStackRequest(parsed.payload, setup) });
    }

    const results = armies.map(({ label, request }) => {
      const runs = DROPS.map((dropTypes) => {
        const started = performance.now();
        let plan: CampaignPlan | undefined;
        try {
          plan = planCampaign({
            request,
            marchTarget: HORIZON,
            ...CAMPAIGN.planFixes,
            fifthStop: { ...CAMPAIGN.planFixes.fifthStop, dropTypes },
            putBack: CAMPAIGN.putBack,
          });
        } catch {
          plan = undefined;
        }
        const ms = performance.now() - started;
        const sweet = plan?.alternatives.find((row) => row.pick === 'sweet-spot');
        const thrifty = plan?.alternatives.find((row) => row.pick === 'thrifty');
        return {
          dropTypes,
          ms,
          others: plan?.alternatives
            .filter((row) => row.pick !== 'thrifty')
            .map((row) => `${row.pick}|${JSON.stringify(row.counts)}`),
          stops: plan?.alternatives.map((row) => ({ pick: row.pick, ...pickOf(row) })),
          sweet: sweet ? pickOf(sweet) : undefined,
          thrifty: thrifty ? pickOf(thrifty) : undefined,
          rating:
            sweet && thrifty
              ? rate(
                  {
                    damage: sweet.repeat.damage,
                    silver: sweet.repeat.silver,
                    gold: sweet.repeat.gold,
                    dragonCoins: sweet.repeat.dragonCoins ?? 0,
                    seconds: sweet.repeat.seconds,
                    hired: sweet.repeat.mercLost,
                  },
                  {
                    damage: thrifty.repeat.damage,
                    silver: thrifty.repeat.silver,
                    gold: thrifty.repeat.gold,
                    dragonCoins: thrifty.repeat.dragonCoins ?? 0,
                    seconds: thrifty.repeat.seconds,
                    hired: thrifty.repeat.mercLost,
                  },
                  CAMPAIGN.markerRates,
                )
              : undefined,
        };
      });
      return { label, runs };
    });

    // The stop is additive: every other stop is the same march under every pool.
    for (const army of results)
      for (const run of army.runs) expect(run.others, `${army.label} @ ${String(run.dropTypes)}`).toEqual(army.runs[0]?.others);

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      new URL('239-the-types-taken-out.json', OUT_DIR),
      `${JSON.stringify(
        { experiment: '239', fifthStop: CAMPAIGN.planFixes.fifthStop, drops: DROPS, armies: results.map((a) => ({ ...a, runs: a.runs.map(({ ms: _ms, ...rest }) => rest) })) },
        null,
        1,
      )}\n`,
    );

    const lines: string[] = [];
    lines.push('# The types taken out — the thrifty stop with marches the search never sizes');
    lines.push('');
    lines.push(
      `experiment: 239 · armies: ${String(results.length)} · fifthStop: ${JSON.stringify(CAMPAIGN.planFixes.fifthStop)} · pools: dropTypes ${DROPS.join(' / ')}`,
    );
    lines.push('');
    lines.push(
      "The thrifty stop's pool is the band (`dropTypes 0`), or the band plus, for every set of up to `dropTypes` troop types taken out, the Elite sizer's sheltered maximum over the rest with the whole sustainable stock as caps, and the same with each capped mercenary trimmed `1 … trims` chunks under it. The rule is `engine/thriftyStop.ts` with the burn allowed up to the next stop up's (inclusive). A cell is `Δdamage % / Δsilver % / Δqueue % / burn` of the pick against the sweet spot, `·` for no pick. Every other stop is asserted the same march under every pool.",
    );
    lines.push('');
    lines.push(`| army | ${DROPS.map((d) => `drop ≤ ${String(d)}`).join(' | ')} | plan ms (${DROPS.join(' / ')}) |`);
    lines.push(`|---|${DROPS.map(() => '---:').join('|')}|---:|`);
    for (const army of results) {
      const cells = army.runs.map((run) =>
        run.thrifty && run.sweet
          ? `${pct(run.thrifty.damage, run.sweet.damage)} / ${pct(run.thrifty.silver, run.sweet.silver)} / ${pct(run.thrifty.seconds, run.sweet.seconds)} / ${String(run.thrifty.burn)}`
          : '·',
      );
      lines.push(`| ${army.label} | ${cells.join(' | ')} | ${army.runs.map((r) => String(Math.round(r.ms))).join(' / ')} |`);
    }
    lines.push(
      `| **armies with a pick** | ${DROPS.map((_, i) => String(results.filter((a) => a.runs[i]?.thrifty).length)).join(' | ')} | |`,
    );
    const totalMs = DROPS.map((_, i) => results.reduce((sum, a) => sum + (a.runs[i]?.ms ?? 0), 0));
    lines.push(`| **plan ms, all armies** | ${totalMs.map((ms) => String(Math.round(ms))).join(' | ')} | |`);
    lines.push('');
    lines.push('## Per army, at the configured pool');
    lines.push('');
    const at = DROPS.indexOf(CAMPAIGN.planFixes.fifthStop.dropTypes ?? 0);
    for (const army of results) {
      const run = army.runs[at];
      const base = army.runs[0];
      lines.push(`### ${army.label}`);
      lines.push('');
      if (!run?.stops) {
        lines.push('No plan.');
        lines.push('');
        continue;
      }
      lines.push('| stop | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc |');
      lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
      const row = (name: string, p: Pick): string =>
        `| ${name} | ${n(p.damage)} | ${n(p.silver)} | ${String(p.burn)} | ${n(p.gold)} | ${n(p.coins)} | ${days(p.seconds)} | ${p.perSilver.toFixed(3)} | ${n(p.perMerc)} |`;
      for (const stop of run.stops) lines.push(row(stop.pick === 'thrifty' ? '**thrifty**' : stop.pick, stop));
      if (base?.thrifty && JSON.stringify(base.thrifty.counts) !== JSON.stringify(run.thrifty?.counts))
        lines.push(row('thrifty, band alone', base.thrifty));
      lines.push('');
      if (run.thrifty && run.sweet) {
        const t = run.thrifty;
        const s = run.sweet;
        lines.push(
          `thrifty vs the sweet spot: damage ${pct(t.damage, s.damage)} % · silver ${pct(t.silver, s.silver)} % · burn ${t.burn >= s.burn ? '+' : ''}${String(t.burn - s.burn)} · gold ${pct(t.gold, s.gold)} % · coins ${pct(t.coins, s.coins)} % · queue ${pct(t.seconds, s.seconds)} % · dmg/silver ×${(t.perSilver / s.perSilver).toFixed(2)} · dmg/merc ×${(t.perMerc / s.perMerc).toFixed(2)} · rating ${run.rating?.toFixed(1) ?? '—'}`,
        );
        lines.push('');
        lines.push(
          `fields ${Object.entries(t.counts)
            .map(([id, c]) => `${id} ${n(c)}`)
            .join(', ')}`,
        );
        lines.push('');
      }
    }
    writeFileSync(new URL('239-the-types-taken-out.md', OUT_DIR), `${lines.join('\n')}\n`);
  }, 3_600_000);
});
