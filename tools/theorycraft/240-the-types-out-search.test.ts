/**
 * 240 — **the types taken out, fed to the search** (`CampaignInput.typesOutSearch`; the owner, 2026-10-15: *"first get
 * me a list of all the marches with all the stops and outline what moves and how much"*).
 *
 * Experiment 239 put the types-out family (the Elite sizer's sheltered maximum with up to three troop types taken
 * out, and each capped merc trimmed one and two chunks) in the thrifty stop's pool only, and on the owner's 10-14
 * account it beat the sweet spot outright. This feeds the same family to the search's frontier, under the prefix
 * family's freeze, where every stop can take it — and lists, per army, every stop of the bar as it is (off) and with
 * the family fed (on), and what each stop moved.
 *
 * `THEORY=1 PYRRHIC_HORIZON_EXPORT=a.json,b.json pnpm vitest run tools/theorycraft/240-the-types-out-search.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanRow } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { rate } from '../../src/engine/rating';
import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { OUT_DIR } from './harness';

const FEED = {
  dropTypes: CAMPAIGN.planFixes.fifthStop.dropTypes ?? 3,
  trims: CAMPAIGN.planFixes.fifthStop.trims ?? 2,
};

interface Stop {
  pick: string;
  damage: number;
  silver: number;
  burn: number;
  gold: number;
  coins: number;
  seconds: number;
  perSilver: number;
  perMerc: number;
  counts: Record<string, number>;
}

const stopOf = (row: PlanRow): Stop => {
  const r = row.repeat;
  return {
    pick: row.pick,
    damage: r.damage,
    silver: r.silver,
    burn: r.mercLost,
    gold: r.gold,
    coins: r.dragonCoins ?? 0,
    seconds: r.seconds,
    perSilver: r.silver > 0 ? r.damage / r.silver : Infinity,
    perMerc: r.hiredDamage / Math.max(1, r.mercLost),
    counts: row.counts,
  };
};

const bill = (s: Stop) => ({
  damage: s.damage,
  silver: s.silver,
  gold: s.gold,
  dragonCoins: s.coins,
  seconds: s.seconds,
  hired: s.burn,
});

const pct = (a: number, b: number): string => {
  if (b === 0) return a === 0 ? '0.0' : '—';
  const v = (a / b - 1) * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
};
const n = (v: number): string => Math.round(v).toLocaleString('en-US');
const days = (s: number): string =>
  `${String(Math.floor(s / 86400))} d ${String(Math.round((s % 86400) / 3600))} h`;
const same = (a: Stop, b: Stop): boolean => JSON.stringify(a.counts) === JSON.stringify(b.counts);

describe.skipIf(!process.env.THEORY)('240 — the types taken out, fed to the search', () => {
  it('lists every stop of every army with the family off and on', () => {
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

    const run = (request: StackRequest, fed: boolean): { plan?: CampaignPlan; ms: number } => {
      const started = performance.now();
      try {
        const plan = planCampaign({
          request,
          marchTarget: HORIZON,
          ...CAMPAIGN.planFixes,
          ratedStops: undefined,
          putBack: CAMPAIGN.putBack,
          ...(fed ? { typesOutSearch: FEED } : {}),
        });
        return { plan, ms: performance.now() - started };
      } catch {
        return { ms: performance.now() - started };
      }
    };

    const results = armies.map(({ label, request }) => {
      const off = run(request, false);
      const on = run(request, true);
      const offStops = off.plan?.alternatives.map(stopOf) ?? [];
      const onStops = on.plan?.alternatives.map(stopOf) ?? [];
      const picks = [...new Set([...offStops, ...onStops].map((s) => s.pick))];
      const order = [
        'silver-saver',
        'burn-saver',
        'sweet-spot',
        'thrifty',
        'more-mercs',
        'steady-max',
        'all-in',
      ];
      picks.sort((a, b) => order.indexOf(a) - order.indexOf(b));
      const stops = picks.map((pick) => {
        const before = offStops.find((s) => s.pick === pick);
        const after = onStops.find((s) => s.pick === pick);
        return {
          pick,
          before,
          after,
          moved: !before || !after || !same(before, after),
          rating: before && after ? rate(bill(before), bill(after), CAMPAIGN.markerRates) : undefined,
        };
      });
      return { label, offMs: off.ms, onMs: on.ms, stops };
    });

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      new URL('240-the-types-out-search.json', OUT_DIR),
      `${JSON.stringify(
        {
          experiment: '240',
          feed: FEED,
          armies: results.map(({ offMs: _a, onMs: _b, ...rest }) => rest),
        },
        null,
        1,
      )}\n`,
    );

    const lines: string[] = [];
    lines.push('# The types taken out, fed to the search — every stop, off and on');
    lines.push('');
    lines.push(
      `experiment: 240 · armies: ${String(results.length)} · typesOutSearch: ${JSON.stringify(FEED)} · fifthStop: ${JSON.stringify(CAMPAIGN.planFixes.fifthStop)}`,
    );
    lines.push('');
    lines.push(
      "**Off** is the bar as committed (843179c). **On** feeds the search's frontier, under the prefix family's freeze, the Elite sizer's sheltered maximum for every set of up to `dropTypes` troop types taken out, and the same with each capped merc trimmed `1 … trims` chunks. Figures are one repeated march. A stop that moved is listed off then on; `rating` is `rate(off, on, markerRates)`, positive when the new march is better by the owner's rates.",
    );
    lines.push('');
    const movedArmies = results.filter((a) => a.stops.some((s) => s.moved));
    lines.push('## Summary');
    lines.push('');
    lines.push(
      '| army | stops moved | Δ per stop (damage % / silver % / burn / queue % · rating) | plan ms off → on |',
    );
    lines.push('|---|---:|---|---:|');
    for (const army of results) {
      const moved = army.stops.filter((s) => s.moved);
      const cell = moved
        .map((s) => {
          if (!s.before) return `${s.pick}: **new**`;
          if (!s.after) return `${s.pick}: **gone**`;
          const b = s.before;
          const a = s.after;
          return `${s.pick}: ${pct(a.damage, b.damage)} / ${pct(a.silver, b.silver)} / ${a.burn - b.burn >= 0 ? '+' : ''}${String(a.burn - b.burn)} / ${pct(a.seconds, b.seconds)} · ${s.rating?.toFixed(1) ?? '—'}`;
        })
        .join('<br>');
      lines.push(
        `| ${army.label} | ${String(moved.length)} / ${String(army.stops.length)} | ${cell || '·'} | ${String(Math.round(army.offMs))} → ${String(Math.round(army.onMs))} |`,
      );
    }
    const offTotal = results.reduce((s, a) => s + a.offMs, 0);
    const onTotal = results.reduce((s, a) => s + a.onMs, 0);
    lines.push(
      `| **all** | ${String(results.reduce((s, a) => s + a.stops.filter((x) => x.moved).length, 0))} stops on ${String(movedArmies.length)} armies | | ${String(Math.round(offTotal))} → ${String(Math.round(onTotal))} |`,
    );
    lines.push('');
    lines.push('## Every army, every stop');
    lines.push('');
    for (const army of results) {
      lines.push(`### ${army.label}`);
      lines.push('');
      lines.push(
        '| stop | | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |',
      );
      lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
      const row = (name: string, tag: string, p: Stop, rating = ''): string =>
        `| ${name} | ${tag} | ${n(p.damage)} | ${n(p.silver)} | ${String(p.burn)} | ${n(p.gold)} | ${n(p.coins)} | ${days(p.seconds)} | ${p.perSilver.toFixed(3)} | ${n(p.perMerc)} | ${rating} |`;
      for (const s of army.stops) {
        if (!s.moved && s.before) {
          lines.push(row(s.pick, 'same', s.before));
          continue;
        }
        if (s.before) lines.push(row(`**${s.pick}**`, 'off', s.before));
        if (s.after)
          lines.push(
            row(`**${s.pick}**`, 'on', s.after, s.rating === undefined ? 'new' : s.rating.toFixed(1)),
          );
        else lines.push(`| **${s.pick}** | on | gone | | | | | | | | |`);
      }
      lines.push('');
      for (const s of army.stops.filter((x) => x.moved && x.after))
        lines.push(
          `${s.pick} on: ${Object.entries(s.after?.counts ?? {})
            .map(([id, c]) => `${id} ${n(c)}`)
            .join(' · ')}`,
          '',
        );
    }
    writeFileSync(new URL('240-the-types-out-search.md', OUT_DIR), `${lines.join('\n')}\n`);
  }, 3_600_000);
});
