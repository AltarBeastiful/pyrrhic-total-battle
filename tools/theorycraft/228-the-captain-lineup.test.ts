/**
 * 228 — **the captain lineup of the march's own size** (W17 C5c, `docs/plans/progression-advisor.md` §4 C5c): with
 * one captain on the march, does the best *single* captain beat the one he marches, and how does the card read
 * beside the old trios-only question?
 *
 * The owner marches **one** captain (Aydae) out of eight owned, so the pass used to weigh C(8,3) = 56 trios — a
 * question about which two more captains to *add*, when his other captains march elsewhere. C5c made the pool the
 * lineups of the march's own size. This experiment reads, on the owner's own account as the app plans it:
 *
 *  - **new** — `captainLineups` (size = the distinct captains switched on): the best lineup per stop and its gain
 *    over the marched one, the pool and its cost;
 *  - **old** — the same march, but the pool forced to trios (as the pass read before C5c), so the two answers and
 *    their costs are read off one run each and nothing but the size changes.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/228-the-captain-lineup.test.ts` (it writes
 * `tools/theorycraft/out/228-the-captain-lineup.md`). Owner's export read only, never committed; a missing export
 * skips the run.
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { allowedLineups, lineupKey } from '../../src/engine/captains';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups, lineupTotals, type LineupCandidate } from '../../src/state/captainLineups';
import { activeEntries, buildPlanRequest, resolveSources } from '../../src/state/derive';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { runCaptainAdvice, type CaptainAdviceResult } from '../../src/worker/captainAdvice';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';

const OWNER_2026_10_07 = process.env.PYRRHIC_EXPORT_2026_10_07 ?? 'pyrrhic-my-account-2026-10-07.json';
const OUT = 'tools/theorycraft/out/228-the-captain-lineup.md';
const BIG = 3_600_000;

const f = (value: number, digits = 2): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const names = (key: string): string => (key === '' ? '(none)' : key.split(',').join(' + '));

function lanes(): CalcClient {
  return { ...createInlineClient(), mode: 'worker' };
}

function load(path: string): Profile | null {
  if (!existsSync(path)) return null;
  const parsed = parseImport(readFileSync(path, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

function activeSetup(profile: Profile): BattleSetup {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  if (setup === undefined) throw new Error('no setup');
  return setup;
}

/**
 * The lineups of `profile`'s march at a **forced** `size`, mirroring `captainLineups` but not reading the size
 * from the march — the experiment's old/new A/B (the shipped pass always asks for the march's own size).
 */
function lineupsAt(profile: Profile, setup: BattleSetup, size: number): LineupCandidate[] {
  const captains = profile.sources.captains;
  const nowEntries = activeEntries(captains, setup.active.captains);
  const now: LineupCandidate = {
    key: lineupKey(nowEntries.map((entry) => entry.captainId)),
    entryIds: nowEntries.map((entry) => entry.id),
    captainIds: nowEntries.map((entry) => entry.captainId),
    current: true,
    totals: aggregateBonuses(resolveSources(profile, setup)),
  };
  const out: LineupCandidate[] = [now];
  for (const lineup of allowedLineups(captains, () => true, size)) {
    const captainIds = lineup.map((entry) => entry.captainId);
    const key = lineupKey(captainIds);
    if (key === now.key) continue;
    const entryIds = lineup.map((entry) => entry.id);
    out.push({ key, entryIds, captainIds, current: false, totals: lineupTotals(profile, setup, entryIds) });
  }
  return out;
}

/** One reading: the pool, its cost and the best lineup per stop of the bar (the oracle: every one planned in full). */
interface Reading {
  size: number;
  candidates: number;
  wall: number;
  advice: CaptainAdviceResult;
}

async function read(
  profile: Profile,
  setup: BattleSetup,
  pool: LineupCandidate[],
  size: number,
): Promise<Reading> {
  const input = buildPlanRequest(profile, setup);
  const calc = createCalcPool({ size: 3, createClient: lanes });
  const began = performance.now();
  // confirm = everything, no clock: the oracle plans every candidate in full.
  const advice = await runCaptainAdvice(
    input,
    pool.map(({ key, totals }) => ({ key, totals })),
    pool[0]!.key,
    calc,
    { confirm: pool.length, budgetMs: BIG },
  );
  const wall = performance.now() - began;
  calc.dispose();
  return { size, candidates: pool.length, wall, advice };
}

interface Army {
  label: string;
  profile: Profile;
  setup: BattleSetup;
  /** The sizes to read: the march's own, and (for contrast) the old trios. */
  sizes: number[];
}

function armies(): Army[] {
  const own = load(OWNER_2026_10_07);
  if (own === null) return [];
  const ids = (...captainIds: string[]): string[] =>
    captainIds.map((captainId) => {
      const entry = own.sources.captains.find((one) => one.captainId === captainId);
      if (entry === undefined) throw new Error(`no captain ${captainId}`);
      return entry.id;
    });
  const variant = (label: string, captains: string[], leadership?: number): Army => {
    const copy = structuredClone(own);
    const base = activeSetup(copy);
    const setup: BattleSetup = {
      ...base,
      active: { ...base.active, captains },
      housing: leadership === undefined ? base.housing : { ...base.housing, leadership },
    };
    copy.setups = copy.setups.map((one) => (one.id === base.id ? setup : one));
    const size = captainLineups(copy, setup).size;
    // The old reading forced trios, the new one the march's own size — deduplicated so a 3-active march reads once.
    return { label, profile: copy, setup, sizes: [...new Set([size, 3])] };
  };
  return [
    variant('Aydae alone (9 000 leadership) — the live march', ids('aydae')),
    variant('Aydae alone (5 000 leadership)', ids('aydae'), 5_000),
    variant('Aydae + Leonidas (2 on the march)', ids('aydae', 'leonidas')),
    variant('Aydae + Leonidas + Alexander (3 on the march)', ids('aydae', 'leonidas', 'alexander')),
    variant('Bernard + Ingrid (2 on the march)', ids('bernard', 'ingrid')),
  ];
}

/** The best lineup per stop and the biggest gain of the bar. */
function best(advice: CaptainAdviceResult): {
  stopsWithGain: number;
  top: { pick: string; lineup: string; gain: number };
} {
  let top = { pick: advice.best[0]?.pick ?? '', lineup: advice.currentKey, gain: 0 };
  let stopsWithGain = 0;
  for (const stop of advice.best) {
    if (stop.gain > 0) stopsWithGain += 1;
    if (stop.gain > top.gain) top = { pick: stop.pick, lineup: stop.lineup, gain: stop.gain };
  }
  return { stopsWithGain, top };
}

describe.skipIf(!process.env.THEORY)('228 — the captain lineup', () => {
  it(
    'reads the march’s own size beside the old trios, on the owner’s account',
    async () => {
      const list = armies();
      expect(list.length).toBeGreaterThan(0);

      const rows: string[] = [];
      const sections: string[] = [];
      for (const army of list) {
        const bars: string[] = [];
        for (const size of army.sizes) {
          const pool = lineupsAt(army.profile, army.setup, size);
          const r = await read(army.profile, army.setup, pool, size);
          const { stopsWithGain, top } = best(r.advice);
          const stops = r.advice.best.length;
          const current = lineupKey(
            activeEntries(army.profile.sources.captains, army.setup.active.captains).map((e) => e.captainId),
          );
          const label = size === army.sizes[0] ? `new (size ${String(size)})` : `old (trios)`;
          rows.push(
            `| ${army.label} | ${label} | ${String(r.candidates)} | ${String(stops)} | ${String(stopsWithGain)} | ${names(top.lineup)} | ${f(top.gain, 3)} | ${f(r.wall, 0)} |`,
          );
          bars.push(
            `**${army.label} — ${label}** (${String(r.candidates)} candidates, ${f(r.wall, 0)} ms). Marched: ${names(current)}. ` +
              (stopsWithGain > 0
                ? `${String(stopsWithGain)} of ${String(stops)} stops have a better lineup; the biggest is ${names(top.lineup)} on the ${top.pick} stop, **+${f(top.gain, 2)} %** on the owner's rating.`
                : `${names(current)} is already the best of the ${String(r.candidates)} lineups: no stop gains.`),
          );
        }
        sections.push(bars.join('\n'));
      }

      const table = [
        '| army | reading | candidates | stops | stops with a gain | best lineup | gain % | wall ms |',
        '|---|---|---|---|---|---|---|---|',
        ...rows,
      ];
      const out = [
        '---',
        'title: "228 — the captain lineup"',
        '---',
        '',
        '# 228 — the captain lineup',
        '',
        'The captain pass weighed **trios** whatever the march fielded, so the owner’s one-captain march was read against C(8,3) = 56 trios — which two more captains to add, when his other captains march elsewhere. C5c weighs the lineups of the march’s **own size** instead. Each army is the owner’s 2026-10-07 account as the app plans it (`buildPlanRequest`), read twice on the same march: **new** at the march’s own size, **old** forced to trios. The oracle plans every candidate in full (no clock, `confirm` = the pool), so the gain is the true best of the pool, not a shortlist’s. Gains are in the owner’s `rate()`; one lane in Node, wall one thread’s.',
        '',
        '## Readings',
        '',
        ...table,
        '',
        '## What each says',
        '',
        ...sections,
        '',
        '**Read**: with one captain on the march the new pass names a **single** captain to swap in, never a trio to add; the candidate count falls from C(8,3) = 56 (57 with the marched one) to C(8,1) = 8 (28 at two on the march), so the pass is cheaper by construction, and the reading stays the march’s own set — a swap the player can actually make.',
        '',
      ].join('\n');
      writeFileSync(OUT, out);
      expect(list.length).toBeGreaterThan(0);
    },
    BIG,
  );
});
