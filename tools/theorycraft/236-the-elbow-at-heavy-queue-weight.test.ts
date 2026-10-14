/**
 * 236 — **the elbow at heavy queue weight** (`tools/theorycraft/thrifty-stop.ts`; the owner, 2026-10-14: *"yes try it"* —
 * pick the elbow of the climb once the queue weight is heavy, instead of the deepest queue cut).
 *
 * Same pool as 235 (a stepping stone, burn strictly below the next stop up's, dmg/silver ≥ 90 % and dmg/merc ≥ 95 % of
 * the sweet spot's), the owner's rating (gold 10) admitting only rows it prefers to the sweet spot, and the queue weight
 * stepped 40 → 1. What differs is who is taken of the admitted: `rated` takes the best rating (235), `knee` the elbow of
 * the climb from the next stop down to the sweet spot. Three lines: `rated` (235's, for reference), `knee`, and `knee`
 * with the 10 % queue gate. Reads the committed 232 horizon; `PYRRHIC_HORIZON_EXPORT` adds account exports. Writes
 * `out/236-the-elbow-at-heavy-queue-weight.{json,md}`.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/236-the-elbow-at-heavy-queue-weight.test.ts`
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import { describe, expect, it } from 'vitest';

import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import { OUT_DIR } from './harness';
import { horizonOf, loadHorizon } from './march-horizon';
import type { ArmyHorizon } from './march-horizon';
import { saveJson } from './plan-report';
import { ratedRule, renderSweep, thriftyStop } from './thrifty-stop';
import type { SweepLine } from './thrifty-stop';

const WEIGHTS = [40, 20, 10, 5, 2, 1];
const SILVER_FLOOR = 0.9;
const MERC_FLOOR = 0.95;

describe.skipIf(!process.env.THEORY)('236 — the elbow at heavy queue weight', () => {
  it('takes the elbow instead of the deepest cut and writes what each picks', () => {
    const base = loadHorizon(new URL('232-the-march-horizon.json', OUT_DIR));
    const armies: ArmyHorizon[] = [...base.armies];
    expect(armies.length, 'the 232 horizon holds the 19 benchmark armies').toBe(19);
    for (const file of (process.env.PYRRHIC_HORIZON_EXPORT ?? '')
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f !== '')) {
      if (!existsSync(file)) continue;
      const parsed = parseImport(readFileSync(file, 'utf8'));
      const setup = parsed.kind === 'profile' ? parsed.payload.setups[0] : undefined;
      if (parsed.kind !== 'profile' || !setup) continue;
      armies.push(horizonOf(`export · ${basename(file)}`, buildStackRequest(parsed.payload, setup)));
    }

    const make = (name: string, about: string, take: 'rated' | 'knee', cut: number): SweepLine => ({
      name,
      about,
      values: WEIGHTS,
      label: (w) => `q${String(w)}`,
      results: WEIGHTS.map((w) =>
        armies.map((army) => thriftyStop(army, ratedRule(w, SILVER_FLOOR, MERC_FLOOR, cut, take))),
      ),
    });
    const lines = [
      make('rated', 'the best rating of those it admits (235, no queue gate) — for reference.', 'rated', 0),
      make('knee', 'the elbow of the climb of those the rating admits, no queue gate.', 'knee', 0),
      make(
        'knee + 10 % gate',
        "the elbow, and the pick must save 10 % of the sweet spot's queue.",
        'knee',
        0.1,
      ),
    ];

    const meta = {
      experiment: '236',
      armies: armies.length,
      extraArmies: armies.length - 19,
      weights: WEIGHTS,
      silverFloor: SILVER_FLOOR,
      mercFloor: MERC_FLOOR,
    };
    mkdirSync(OUT_DIR, { recursive: true });
    saveJson(
      new URL('236-the-elbow-at-heavy-queue-weight.json', OUT_DIR),
      armies.map((army, a) => ({
        label: army.label,
        ...Object.fromEntries(
          lines.map((line) => [
            line.name,
            line.values.map((w, v) => ({ queueWeight: w, ...(line.results[v]?.[a] ?? {}) })),
          ]),
        ),
      })) as never,
      meta,
    );
    writeFileSync(
      new URL('236-the-elbow-at-heavy-queue-weight.md', OUT_DIR),
      renderSweep(
        armies,
        lines,
        {
          title: 'The elbow at heavy queue weight',
          intro:
            "The pool is 235's: a stepping stone between the next stop down and the sweet spot, burn strictly below the next stop up's, dmg/silver at least 90 % and dmg/merc at least 95 % of the sweet spot's, admitted only if the owner's rating (gold 10, queue weight as the column) prefers it to the sweet spot. `rated` takes the best rating of those; `knee` takes the elbow of the climb from the next stop down to the sweet spot — the row where the share of the damage gap closed most outruns the share of the queue gap spent.",
        },
        meta,
      ),
    );

    // Same admitted pool, same existence: `knee` offers a pick wherever `rated` does, at every weight.
    armies.forEach((army, a) =>
      WEIGHTS.forEach((w, v) => {
        const rated = lines[0]?.results[v]?.[a]?.pick;
        const knee = lines[1]?.results[v]?.[a]?.pick;
        expect(Boolean(knee), `${army.label} at q${String(w)}: knee offers a pick where rated does`).toBe(
          Boolean(rated),
        );
      }),
    );
  }, 600_000);
});
