/**
 * 241 — **the rated stops**, step 1: the ceiling (`docs/plans/the-rated-stops.md` §5; the owner, 2026-10-14: *"I
 * think there's rows with great rating still getting lost"*).
 *
 * No rule yet. For every army and every stop of the bar as committed, the march the stop could become if a rule
 * could take **any** march of its pool: the best rated against the stop (`rate(stop, march, markerRates)`) at the
 * stop's own burn, one chunk under it, and one chunk over it. Two pools:
 *
 *  - **P0**, the band the stops are drawn from (`CampaignPlan.trade`);
 *  - **P1**, the band plus the types-out family the thrifty pass reads (`CampaignPlan.typesOut`).
 *
 * The march itself is excluded; a march that is another stop of the bar is listed but flagged (§4 gate 6). This is
 * the most any of R1–R3 can find: if it is small, the rules are not worth their pins.
 *
 * `THEORY=1 PYRRHIC_HORIZON_EXPORT=a.json,b.json pnpm vitest run tools/theorycraft/241-the-rated-stops.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { rate } from '../../src/engine/rating';
import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { OUT_DIR } from './harness';

const OFFSETS = [-1, 0, 1] as const;
const POOLS = ['P0', 'P1'] as const;
/**
 * The readings: **raw** (no gate but the burn level), **gated** (§4 gates 3 and 4: the names stay true and the
 * staircase keeps its order), and **gated, damage ≥ 95 %** (the same, losing at most 5 % of the stop's damage).
 */
const GATES = ['raw', 'gated', 'floor95'] as const;
type Gate = (typeof GATES)[number];
const ORDER = ['silver-saver', 'burn-saver', 'sweet-spot', 'thrifty', 'more-mercs', 'steady-max', 'all-in'];

interface Bill {
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

const billOf = (row: PlanTotals): Bill => {
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
  };
};

const rated = (s: Bill) => ({
  damage: s.damage,
  silver: s.silver,
  gold: s.gold,
  dragonCoins: s.coins,
  seconds: s.seconds,
  hired: s.burn,
});

const key = (counts: Record<string, number>): string =>
  JSON.stringify(
    Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(([a], [b]) => a.localeCompare(b)),
  );
const pct = (a: number, b: number): string => {
  if (b === 0) return a === 0 ? '0.0' : '—';
  const v = (a / b - 1) * 100;
  return `${v >= 0 ? '+' : ''}${v.toFixed(1)}`;
};
const n = (v: number): string => Math.round(v).toLocaleString('en-US');
const days = (s: number): string =>
  `${String(Math.floor(s / 86400))} d ${String(Math.round((s % 86400) / 3600))} h`;

interface Best {
  march: Bill;
  rating: number;
  /** The pick of another stop on the bar this march already is, if any. */
  onBar?: string | undefined;
  /** From the types-out family rather than the band. */
  typesOut: boolean;
}

describe.skipIf(!process.env.THEORY)('241 — the rated stops, step 1: the ceiling', () => {
  it('lists, for every stop, the best-rated march of its pool at burn −1 / 0 / +1', () => {
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
      let plan;
      try {
        plan = planCampaign({
          request,
          marchTarget: HORIZON,
          ...CAMPAIGN.planFixes,
          ratedStops: undefined,
          putBack: CAMPAIGN.putBack,
          withTrade: true,
        });
      } catch {
        return { label, refused: true, stops: [] };
      }
      const band = (plan.trade ?? []).map((row) => ({ march: billOf(row), typesOut: false }));
      const typesOut = (plan.typesOut ?? []).map((row) => ({ march: billOf(row), typesOut: true }));
      const bar = plan.alternatives.map((row) => ({ pick: row.pick, march: billOf(row) }));
      bar.sort((a, b) => ORDER.indexOf(a.pick) - ORDER.indexOf(b.pick));
      // The staircase, by burn then damage; the thrifty stop stands outside it (§4 gate 4).
      const stair = bar
        .filter((s) => s.pick !== 'thrifty')
        .sort((a, b) => a.march.burn - b.march.burn || a.march.damage - b.march.damage);
      const passes = (gate: Gate, pick: string, stop: Bill, m: Bill): boolean => {
        if (gate === 'raw') return true;
        if (gate === 'floor95' && m.damage < stop.damage * 0.95) return false;
        // Gate 3, the names.
        if (pick === 'silver-saver' && m.silver > stop.silver) return false;
        if (pick === 'burn-saver' && m.burn > stop.burn) return false;
        if ((pick === 'steady-max' || pick === 'all-in') && m.damage < stop.damage) return false;
        // Gate 4, the order: between its neighbours on burn (inclusive) and on damage (strict).
        const at = stair.findIndex((s) => s.pick === pick);
        if (at >= 0) {
          const left = stair[at - 1]?.march;
          const right = stair[at + 1]?.march;
          if (left && (m.burn < left.burn || m.damage <= left.damage)) return false;
          if (right && (m.burn > right.burn || m.damage >= right.damage)) return false;
        }
        return true;
      };
      const stops = bar.map(({ pick, march: stop }) => {
        const best: Record<string, Best | undefined> = {};
        for (const gate of GATES)
          for (const pool of POOLS) {
            const rows = pool === 'P0' ? band : [...band, ...typesOut];
            for (const offset of OFFSETS) {
              let top: Best | undefined;
              for (const row of rows) {
                if (row.march.burn !== stop.burn + offset) continue;
                if (key(row.march.counts) === key(stop.counts)) continue;
                // The same march under other counts (a stop carries its tail): not a different march.
                if (JSON.stringify(rated(row.march)) === JSON.stringify(rated(stop))) continue;
                if (!passes(gate, pick, stop, row.march)) continue;
                const rating = rate(rated(stop), rated(row.march), CAMPAIGN.markerRates);
                if (top === undefined || rating > top.rating)
                  top = {
                    march: row.march,
                    rating,
                    typesOut: row.typesOut,
                    onBar: bar.find((other) => key(other.march.counts) === key(row.march.counts))?.pick,
                  };
              }
              best[`${gate}:${pool}${String(offset)}`] = top;
            }
          }
        return { pick, stop, best };
      });
      return { label, refused: false, stops, band: band.length, typesOut: typesOut.length };
    });

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      new URL('241-the-rated-stops.json', OUT_DIR),
      `${JSON.stringify({ experiment: '241', step: 1, rates: CAMPAIGN.markerRates, armies: results }, null, 1)}\n`,
    );

    const lines: string[] = [];
    lines.push('# The rated stops — step 1, the ceiling');
    lines.push('');
    lines.push(
      `experiment: 241 step 1 · armies: ${String(results.length)} · markerRates: ${JSON.stringify(CAMPAIGN.markerRates)} · fifthStop: ${JSON.stringify(CAMPAIGN.planFixes.fifthStop)}`,
    );
    lines.push('');
    lines.push(
      "For every stop of the bar as committed, the best-rated march of its pool at the stop's burn −1, 0 and +1 chunk, " +
        '`rate(stop, march, markerRates)`. **P0** is the band (`trade`), **P1** the band plus the types-out family. ' +
        'The stop itself (and the same bill under other counts) is excluded; a march that is already another stop of ' +
        'the bar is marked *(= pick)*, and a types-out march †. Three readings: **raw**, no gate but the burn level; ' +
        '**gated**, §4 gates 3 and 4 (silver saver no dearer, burn saver no more burn, steady max and all-in no less ' +
        'damage; each staircase stop between its neighbours on burn and strictly on damage); **floor95**, gated and ' +
        "keeping 95 % of the stop's damage. Per stop the detail lists each distinct march once, tagged with every reading that picked it. " +
        'Figures are one repeated march.',
    );
    lines.push('');

    // Summary: per pool and offset, how many stops have a march rated > 0, > 2, > 5, the best, and how many of
    // those are not already on the bar.
    const all = results.flatMap((a) => a.stops);
    lines.push('## Summary');
    lines.push('');
    lines.push(`${String(all.length)} stops on ${String(results.filter((a) => !a.refused).length)} armies.`);
    lines.push('');
    lines.push(
      '| reading | pool · burn | stops with rating > 0 | > 2 | > 5 | of > 0, not on the bar | best rating (army · stop) |',
    );
    lines.push('|---|---|---:|---:|---:|---:|---|');
    const cell = (gate: Gate, pool: string, offsets: readonly number[]): string => {
      const per = all.map((s) => {
        let top: Best | undefined;
        for (const o of offsets) {
          const b = s.best[`${gate}:${pool}${String(o)}`];
          if (b && (top === undefined || b.rating > top.rating)) top = b;
        }
        return top;
      });
      const pos = per.filter((b) => b !== undefined && b.rating > 0);
      let bestAt = -1;
      per.forEach((b, i) => {
        if (b && (bestAt < 0 || b.rating > (per[bestAt]?.rating ?? -Infinity))) bestAt = i;
      });
      const where = (() => {
        if (bestAt < 0) return '—';
        let i = bestAt;
        for (const army of results) {
          if (i < army.stops.length)
            return `${per[bestAt]?.rating.toFixed(1) ?? ''} (${army.label} · ${army.stops[i]?.pick ?? ''})`;
          i -= army.stops.length;
        }
        return '—';
      })();
      return `| ${gate} | ${pool} · ${offsets.map((o) => (o > 0 ? `+${String(o)}` : String(o))).join('/')} | ${String(pos.length)} | ${String(pos.filter((b) => (b?.rating ?? 0) > 2).length)} | ${String(pos.filter((b) => (b?.rating ?? 0) > 5).length)} | ${String(pos.filter((b) => b?.onBar === undefined).length)} | ${where} |`;
    };
    for (const gate of GATES)
      for (const pool of POOLS) {
        for (const o of OFFSETS) lines.push(cell(gate, pool, [o]));
        lines.push(cell(gate, pool, [-1, 0]));
        lines.push(cell(gate, pool, OFFSETS));
      }
    lines.push('');
    lines.push('### Per stop name (P1, burn −1/0/+1, rating > 0 and not on the bar)');
    lines.push('');
    lines.push(
      '| reading | stop | stops | rating > 0 | median rating of those | of them burn +1 | of them types-out |',
    );
    lines.push('|---|---|---:|---:|---:|---:|---:|');
    for (const gate of GATES)
      for (const pick of ORDER) {
        const of = all.filter((s) => s.pick === pick);
        if (of.length === 0) continue;
        const tops = of
          .map(
            (s) =>
              OFFSETS.map((o) => s.best[`${gate}:P1${String(o)}`])
                .filter((b): b is Best => b !== undefined && b.onBar === undefined)
                .sort((a, b) => b.rating - a.rating)[0],
          )
          .filter((b): b is Best => b !== undefined && b.rating > 0);
        const ratings = tops.map((b) => b.rating).sort((a, b) => a - b);
        const median = ratings.length > 0 ? (ratings[Math.floor((ratings.length - 1) / 2)] ?? 0) : 0;
        const stopOf = (b: Best) =>
          of.find((s) => OFFSETS.some((o) => s.best[`${gate}:P1${String(o)}`] === b));
        lines.push(
          `| ${gate} | ${pick} | ${String(of.length)} | ${String(tops.length)} | ${ratings.length > 0 ? median.toFixed(1) : '—'} | ${String(tops.filter((b) => b.march.burn > (stopOf(b)?.stop.burn ?? Infinity)).length)} | ${String(tops.filter((b) => b.typesOut).length)} |`,
        );
      }
    lines.push('');

    lines.push('## Every army, every stop');
    lines.push('');
    const row = (name: string, tag: string, p: Bill, stop?: Bill, rating = ''): string =>
      `| ${name} | ${tag} | ${n(p.damage)}${stop ? ` (${pct(p.damage, stop.damage)} %)` : ''} | ${n(p.silver)}${stop ? ` (${pct(p.silver, stop.silver)} %)` : ''} | ${String(p.burn)} | ${n(p.gold)}${stop ? ` (${pct(p.gold, stop.gold)} %)` : ''} | ${n(p.coins)} | ${days(p.seconds)}${stop ? ` (${pct(p.seconds, stop.seconds)} %)` : ''} | ${p.perSilver.toFixed(3)} | ${n(p.perMerc)} | ${rating} |`;
    for (const army of results) {
      lines.push(`### ${army.label}`);
      lines.push('');
      if (army.refused) {
        lines.push('The plan refuses.', '');
        continue;
      }
      lines.push(`band ${String(army.band ?? 0)} marches · types-out ${String(army.typesOut ?? 0)}`);
      lines.push('');
      lines.push(
        '| stop | reading · pool · burn | damage | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | rating |',
      );
      lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
      for (const s of army.stops) {
        lines.push(row(`**${s.pick}**`, 'stop', s.stop));
        // One row per distinct march, tagged with every reading · pool · burn that picked it. P1 is listed only
        // where the types-out family wins it.
        const picked = new Map<string, { b: Best; tags: string[] }>();
        for (const gate of GATES)
          for (const pool of POOLS)
            for (const o of OFFSETS) {
              const b = s.best[`${gate}:${pool}${String(o)}`];
              if (!b || (pool === 'P1' && !b.typesOut)) continue;
              const k = key(b.march.counts);
              const entry = picked.get(k) ?? { b, tags: [] };
              const tag = `${gate} ${pool} ${o > 0 ? '+' : ''}${String(o)}`;
              if (
                !entry.tags.some(
                  (t) => t.endsWith(` ${pool} ${o > 0 ? '+' : ''}${String(o)}`) && t.startsWith(gate),
                )
              )
                entry.tags.push(tag);
              picked.set(k, entry);
            }
        for (const { b, tags } of [...picked.values()].sort(
          (x, y) => x.b.march.burn - y.b.march.burn || y.b.rating - x.b.rating,
        ))
          lines.push(
            row(
              '',
              `${tags.join(', ')}${b.typesOut ? ' †' : ''}${b.onBar ? ` (= ${b.onBar})` : ''}`,
              b.march,
              s.stop,
              b.rating.toFixed(1),
            ),
          );
      }
      lines.push('');
    }
    writeFileSync(new URL('241-the-rated-stops.md', OUT_DIR), `${lines.join('\n')}\n`);
  }, 3_600_000);
});

/** The ten readings of a bar, as the plan holds them (`tenReadings`, `plan.ts`): higher is better on each. */
const readingsOf = (set: readonly PlanTotals[]): number[] => [
  Math.max(...set.map((r) => r.totalDamage)),
  -Math.min(...set.map((r) => r.silver)),
  -Math.min(...set.map((r) => r.mercLost)),
  -Math.min(...set.map((r) => r.gold)),
  -Math.min(...set.map((r) => r.dragonCoins)),
  -Math.min(...set.map((r) => r.seconds)),
  Math.max(...set.map((r) => (r.silver > 0 ? r.totalDamage / r.silver : 0))),
  Math.max(...set.map((r) => r.hiredDamage / Math.max(1, r.mercLost))),
  Math.max(...set.map((r) => (r.gold > 0 ? r.totalDamage / r.gold : 0))),
  Math.max(...set.map((r) => (r.dragonCoins > 0 ? r.totalDamage / r.dragonCoins : 0))),
];
const READING_NAMES = [
  'damage',
  'silver',
  'burn',
  'gold',
  'coins',
  'queue',
  'dmg/silver',
  'dmg/merc',
  'dmg/gold',
  'dmg/coin',
];

describe.skipIf(!process.env.THEORY)('241 — the rated stops, step 2: the arms', () => {
  it('runs every arm against HEAD on every army', () => {
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

    type Arm = {
      name: string;
      rule: 'same-burn' | 'one-chunk';
      typesOut: boolean;
      minRating: number;
      damageFloor?: number;
      thriftyReads: 'after' | 'before';
    };
    const arms: Arm[] = [];
    for (const thriftyReads of ['after', 'before'] as const)
      for (const rule of ['same-burn', 'one-chunk'] as const)
        for (const typesOut of [false, true])
          for (const damageFloor of [undefined, 0.95])
            for (const minRating of [0, 1, 2, 5])
              arms.push({
                name: `${rule === 'same-burn' ? 'R2' : 'R3'}·${typesOut ? 'P1' : 'P0'}${damageFloor ? '·f95' : ''}·>${String(minRating)}${thriftyReads === 'before' ? '·tb' : ''}`,
                rule,
                typesOut,
                minRating,
                thriftyReads,
                ...(damageFloor ? { damageFloor } : {}),
              });

    const run = (request: StackRequest, arm?: Arm) => {
      const started = performance.now();
      try {
        const plan = planCampaign({
          request,
          marchTarget: HORIZON,
          ...CAMPAIGN.planFixes,
          ratedStops: undefined,
          putBack: CAMPAIGN.putBack,
          ...(arm
            ? {
                ratedStops: {
                  rule: arm.rule,
                  minRating: arm.minRating,
                  typesOut: arm.typesOut,
                  damageFloor: arm.damageFloor,
                  thriftyReads: arm.thriftyReads,
                },
              }
            : {}),
        });
        return { plan, ms: performance.now() - started };
      } catch {
        return { plan: undefined, ms: performance.now() - started };
      }
    };

    const heads = armies.map(({ request }) => run(request));
    interface Move {
      army: string;
      pick: string;
      before?: Bill | undefined;
      after?: Bill | undefined;
      rating?: number | undefined;
      absorbed?: boolean | undefined;
    }
    const results = arms.map((arm) => {
      let ms = 0;
      let headMs = 0;
      const moves: Move[] = [];
      const lostReadings: string[] = [];
      let barsCountChanged = 0;
      let burnMoved = 0;
      armies.forEach(({ label, request }, i) => {
        const head = heads[i];
        const got = run(request, arm);
        ms += got.ms;
        headMs += head?.ms ?? 0;
        const before = head?.plan?.alternatives ?? [];
        const after = got.plan?.alternatives ?? [];
        if (before.length !== after.length) barsCountChanged += 1;
        if (before.length > 0 && after.length > 0) {
          const a = readingsOf(before);
          const b = readingsOf(after);
          a.forEach((v, at) => {
            if ((b[at] ?? 0) < v - Math.abs(v) * 1e-9)
              lostReadings.push(`${label} · ${READING_NAMES[at] ?? ''}`);
          });
        }
        const picks = [...new Set([...before, ...after].map((r) => r.pick))];
        for (const pick of picks) {
          const x = before.find((r) => r.pick === pick);
          const y = after.find((r) => r.pick === pick);
          if (x && y && key(x.counts) === key(y.counts)) continue;
          const bx = x ? billOf(x) : undefined;
          const by = y ? billOf(y) : undefined;
          if (bx && by && bx.burn !== by.burn) burnMoved += 1;
          moves.push({
            army: label,
            pick,
            before: bx,
            after: by,
            rating: bx && by ? rate(rated(bx), rated(by), CAMPAIGN.markerRates) : undefined,
          });
        }
      });
      // A stop gone whose march another stop of the arm's bar now is was absorbed, not lost.
      for (const m of moves)
        if (m.before && !m.after) {
          const counts = key(m.before.counts);
          m.absorbed = moves.some(
            (o) => o.army === m.army && o.after !== undefined && key(o.after.counts) === counts,
          );
        }
      const better = moves.filter((m) => (m.rating ?? 0) > 0).length;
      const worse = moves.filter((m) => !m.absorbed && (m.rating === undefined || m.rating < 0)).length;
      return { arm, moves, better, worse, lostReadings, barsCountChanged, burnMoved, ms, headMs };
    });

    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(
      new URL('241-the-rated-stops-arms.json', OUT_DIR),
      `${JSON.stringify(
        {
          experiment: '241',
          step: 2,
          armies: armies.length,
          arms: results.map(({ ms: _a, headMs: _b, ...r }) => r),
        },
        null,
        1,
      )}\n`,
    );

    const lines: string[] = [];
    lines.push('# The rated stops — step 2, the arms');
    lines.push('');
    lines.push(
      `experiment: 241 step 2 · armies: ${String(armies.length)} · markerRates: ${JSON.stringify(CAMPAIGN.markerRates)} · fifthStop: ${JSON.stringify(CAMPAIGN.planFixes.fifthStop)}`,
    );
    lines.push('');
    lines.push(
      "`CampaignInput.ratedStops` against HEAD (the option off). **R2** looks at the stop's burn and one chunk under, " +
        '**R3** one chunk over as well; **P0** the band, **P1** the band plus the types-out family; **f95** keeps 95 % ' +
        "of the stop's damage; `>n` is `minRating`; **tb**: the thrifty stop reads the sweet spot as it was before " +
        'the rated stops. A stop is matched by its name; `rating` is ' +
        '`rate(HEAD, arm, markerRates)` on the repeated march. **Worse**: a stop rated < 0 against HEAD, or gone ' +
        "(unless its march is now another stop's). " +
        "**Readings lost**: any of the bar's ten readings below HEAD's. Pass bar (§5): 0 worse and 0 readings lost.",
    );
    lines.push('');
    lines.push('## Summary');
    lines.push('');
    lines.push(
      '| arm | stops moved | better | worse | readings lost | bars whose count changed | burn moved | plan ms HEAD → arm |',
    );
    lines.push('|---|---:|---:|---:|---:|---:|---:|---:|');
    for (const r of results)
      lines.push(
        `| ${r.arm.name} | ${String(r.moves.length)} | ${String(r.better)} | ${String(r.worse)} | ${String(r.lostReadings.length)} | ${String(r.barsCountChanged)} | ${String(r.burnMoved)} | ${String(Math.round(r.headMs))} → ${String(Math.round(r.ms))} |`,
      );
    lines.push('');
    lines.push('## Every arm, every move');
    lines.push('');
    for (const r of results) {
      lines.push(`### ${r.arm.name}`);
      lines.push('');
      if (r.lostReadings.length > 0) lines.push(`Readings lost: ${r.lostReadings.join('; ')}`, '');
      if (r.moves.length === 0) {
        lines.push('No stop moved.', '');
        continue;
      }
      lines.push('| army | stop | damage | silver | burn | gold | coins | queue | rating |');
      lines.push('|---|---|---:|---:|---:|---:|---:|---:|---:|');
      for (const m of r.moves) {
        const { before: x, after: y } = m;
        if (!x || !y) {
          lines.push(
            `| ${m.army} | ${m.pick} | ${x ? (m.absorbed ? 'gone, its march now another stop' : '**gone**') : '**new**'} | | | | | | |`,
          );
          continue;
        }
        lines.push(
          `| ${m.army} | ${m.pick} | ${n(x.damage)} → ${n(y.damage)} (${pct(y.damage, x.damage)} %) | ${pct(y.silver, x.silver)} % | ${String(x.burn)} → ${String(y.burn)} | ${pct(y.gold, x.gold)} % | ${pct(y.coins, x.coins)} % | ${pct(y.seconds, x.seconds)} % | ${(m.rating ?? 0).toFixed(1)} |`,
        );
      }
      lines.push('');
    }
    writeFileSync(new URL('241-the-rated-stops-arms.md', OUT_DIR), `${lines.join('\n')}\n`);
  }, 3_600_000);
});
