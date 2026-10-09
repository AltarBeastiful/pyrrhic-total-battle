/**
 * 193 — **the captain trio** (W17 C5a gate, `docs/plans/progression-advisor.md` §4 C5): does the cheap screen
 * find the trio the full plan finds, and what does the pass cost beside the other probes?
 *
 * Armies are the ones that can field more than one trio. A trio search is trivial with three captains or fewer
 * (one set), and every captain roster the benchmark armies carry is three or fewer (Aydae alone, Aydae +
 * Alexander + Leonidas), so no benchmark army has a trio to choose; the only roster in the repository with
 * more is the owner's account of 2026-10-07 (`pyrrhic-my-account-2026-10-07.json` at the repository root,
 * read only and never committed; `PYRRHIC_EXPORT_2026_10_07` names another path): 8 captains, 56 trios. It is
 * read as the app plans it (`buildPlanRequest`), as is, with other trios marched, with a smaller army, and
 * laid on the 2026-09-17 export's army (its mercenaries, 7 000 and 12 000 leadership).
 *
 * Per army, one ORACLE run plans every trio in full (`confirm` = all, no clock) — each trio's plan is
 * independent of the shortlist, so any shortlist (`from`, `k`) is then read off that one run: the trio the
 * shortlist's best stop would have found against the best of all. The shipped pass (`k = 8`, both screens, the
 * 20 s clock) and the advisor's default pass (29 generic probes, experiment 191/192's) are timed on one lane in
 * Node, wall and CPU.
 *
 * Writes `tools/theorycraft/out/193-the-captain-trio.md`. Display only: nothing here changes a constant.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/193-the-captain-trio.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { genericProbes } from '../../src/engine/probes';
import {
  rankTrios,
  shortlistTrios,
  type ScreenKind,
  type ShortlistFrom,
  type TrioScreen,
} from '../../src/engine/captains';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { captainTrios } from '../../src/state/captainTrios';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { runAdvisor } from '../../src/worker/advisor';
import { runCaptainAdvice, type CaptainAdviceResult } from '../../src/worker/captainAdvice';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { ownerProfile } from '../../tests/engine/plan-scenarios';

const OWNER_2026_10_07 = process.env.PYRRHIC_EXPORT_2026_10_07 ?? 'pyrrhic-my-account-2026-10-07.json';
const OUT = 'tools/theorycraft/out/193-the-captain-trio.md';
const BIG = 3_600_000;
const KS = [1, 2, 3, 4, 8] as const;
const FROMS: readonly ShortlistFrom[] = ['sized', 'repriced', 'both'];

function lanes(): CalcClient {
  return { ...createInlineClient(), mode: 'worker' };
}

const f = (value: number, digits = 2): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pct = (part: number, whole: number): string => (whole === 0 ? '—' : `${f((part / whole) * 100, 1)} %`);
const share = (part: number, whole: number): string =>
  `${String(part)}/${String(whole)} (${pct(part, whole)})`;

interface Army {
  label: string;
  profile: Profile;
  setup: BattleSetup;
}

function activeSetup(profile: Profile): BattleSetup {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  if (setup === undefined) throw new Error('no setup');
  return setup;
}

function load(path: string): Profile | null {
  if (!existsSync(path)) return null;
  const parsed = parseImport(readFileSync(path, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

/** A copy of `profile` whose active setup marches `captains` (entry ids) at `leadership`. */
function variant(label: string, profile: Profile, captains: string[], leadership?: number): Army {
  const copy = structuredClone(profile);
  const base = activeSetup(copy);
  const setup: BattleSetup = {
    ...base,
    active: { ...base.active, captains },
    housing: leadership === undefined ? base.housing : { ...base.housing, leadership },
  };
  copy.setups = copy.setups.map((one) => (one.id === base.id ? setup : one));
  return { label, profile: copy, setup };
}

function armies(): Army[] {
  const own = load(OWNER_2026_10_07);
  if (own === null) return [];
  const out: Army[] = [];
  const ids = (...captainIds: string[]): string[] =>
    captainIds.map((captainId) => {
      const entry = own.sources.captains.find((one) => one.captainId === captainId);
      if (entry === undefined) throw new Error(`no captain ${captainId}`);
      return entry.id;
    });
  out.push(variant('2026-10-07 account, Aydae alone (9 000 leadership)', own, ids('aydae')));
  out.push(
    variant(
      '2026-10-07 account, Aydae + Leonidas + Alexander (9 000)',
      own,
      ids('aydae', 'leonidas', 'alexander'),
    ),
  );
  out.push(
    variant('2026-10-07 account, Carter + Helen + Bernard (9 000)', own, ids('carter', 'helen', 'bernard')),
  );
  out.push(variant('2026-10-07 account, Aydae alone, 5 000 leadership', own, ids('aydae'), 5_000));
  const old = ownerProfile();
  if (old !== null) {
    const laid = structuredClone(old);
    laid.sources.captains = structuredClone(own.sources.captains);
    out.push(variant('2026-09-17 army, the 2026-10-07 roster, Aydae alone (7 000)', laid, ids('aydae')));
    out.push(
      variant(
        '2026-09-17 army, the 2026-10-07 roster, Carter + Helen + Bernard (7 000)',
        laid,
        ids('carter', 'helen', 'bernard'),
      ),
    );
    out.push(
      variant('2026-09-17 army, the 2026-10-07 roster, Aydae alone (12 000)', laid, ids('aydae'), 12_000),
    );
  }
  return out;
}

/** The best gain a set of trio keys reaches on a stop, and the key that reaches it (the current trio at 0). */
function bestAmong(
  result: CaptainAdviceResult,
  keys: ReadonlySet<string>,
  stop: number,
): { trio: string; gain: number } {
  let best = { trio: result.currentKey, gain: 0 };
  for (const row of result.rows) {
    const gain = row.stops[stop]?.gain ?? 0;
    if (keys.has(row.id) && gain > best.gain) best = { trio: row.id, gain };
  }
  return best;
}

const names = (key: string): string => key.split(',').join(' + ');

describe.skipIf(!process.env.THEORY)('193 — the captain trio', () => {
  it(
    'compares the screen with the full plan of every trio',
    async () => {
      const list = armies();
      expect(list.length).toBeGreaterThan(0);

      const summary: string[] = [];
      const sections: string[] = [];
      // Tally[from][k] = { same trio as oracle, same gain as oracle, stops with a gain, rating lost }
      const tally = new Map<
        string,
        { same: number; equal: number; total: number; lost: number; gained: number }
      >();
      const bump = (name: string, same: boolean, equal: boolean, lost: number, gained: boolean): void => {
        const t = tally.get(name) ?? { same: 0, equal: 0, total: 0, lost: 0, gained: 0 };
        t.total += 1;
        if (same) t.same += 1;
        if (equal) t.equal += 1;
        t.lost += lost;
        if (gained) t.gained += 1;
        tally.set(name, t);
      };
      let stopsWithGain = 0;
      let stopsAll = 0;
      let oracleTotal = 0;
      let shippedTotal = 0;
      const costRows: string[] = [];

      for (const army of list) {
        const trios = captainTrios(army.profile, army.setup);
        const input = buildPlanRequest(army.profile, army.setup);
        const screen = trios.trios.map((trio) => ({ key: trio.key, totals: trio.totals }));

        // --- the oracle: every trio planned in full, no clock.
        const pool = createCalcPool({ size: 1, createClient: lanes });
        const cpu0 = process.cpuUsage();
        const t0 = performance.now();
        const oracle = await runCaptainAdvice(input, screen, trios.currentKey, pool, {
          budgetMs: BIG,
          confirm: screen.length,
        });
        const oracleWall = performance.now() - t0;
        const oracleCpu = process.cpuUsage(cpu0);
        pool.dispose();

        // --- the shipped pass: k = CAMPAIGN.captainConfirm, both screens, the pass clock.
        const pool2 = createCalcPool({ size: 1, createClient: lanes });
        const cpu1 = process.cpuUsage();
        const t1 = performance.now();
        const shipped = await runCaptainAdvice(input, screen, trios.currentKey, pool2, {});
        const shippedWall = performance.now() - t1;
        const shippedCpu = process.cpuUsage(cpu1);
        pool2.dispose();

        // --- the advisor's default pass, for the clock they share.
        const pool3 = createCalcPool({ size: 1, createClient: lanes });
        const cpu2 = process.cpuUsage();
        const t2 = performance.now();
        await runAdvisor(input, genericProbes(), pool3, { budgetMs: BIG });
        const advisorWall = performance.now() - t2;
        const advisorCpu = process.cpuUsage(cpu2);
        pool3.dispose();

        const cpuMs = (usage: NodeJS.CpuUsage): number => (usage.user + usage.system) / 1000;
        costRows.push(
          `| ${army.label} | ${trios.trios.length} | ${f(oracleWall, 0)} | ${f(cpuMs(oracleCpu), 0)} | ${f(shippedWall, 0)} | ${f(cpuMs(shippedCpu), 0)} | ${shipped.cut.length} | ${f(advisorWall, 0)} | ${f(cpuMs(advisorCpu), 0)} | ${f((shippedWall + advisorWall) / 1000, 1)} |`,
        );

        const stopCount = oracle.baseline?.length ?? 0;
        const screens: TrioScreen[] = oracle.screens;
        const out: string[] = [];
        out.push(`## ${army.label}\n`);
        out.push(
          `${trios.trios.length} trios (current: ${names(trios.currentKey)}); ${stopCount} stops. Oracle: ${oracle.rows.length} trios planned in full (${oracle.cut.length} cut, ${oracle.failed.length} failed), ${f(oracleWall, 0)} ms wall. Shipped (k = ${CAMPAIGN.captainConfirm}, both screens): ${shipped.rows.length} planned, ${shipped.cut.length} cut, ${f(shippedWall, 0)} ms wall.\n`,
        );
        out.push(
          '| stop | oracle best | gain | sized top-1 | repriced top-1 | oracle best at sized rank | at repriced rank | shipped best | shipped gain |\n|---|---|---|---|---|---|---|---|---|',
        );
        const rankOf = (kind: ScreenKind, key: string): number =>
          rankTrios(screens, kind)
            .map((one) => one.key)
            .filter((one) => one !== trios.currentKey)
            .indexOf(key) + 1;
        const everyKey = new Set(oracle.rows.map((row) => row.id));
        for (let stop = 0; stop < stopCount; stop += 1) {
          stopsAll += 1;
          const best = bestAmong(oracle, everyKey, stop);
          const gained = best.gain > 0;
          if (gained) stopsWithGain += 1;
          oracleTotal += best.gain;
          const sizedTop =
            rankTrios(screens, 'sized').find((one) => one.key !== trios.currentKey)?.key ?? '—';
          const repricedTop =
            rankTrios(screens, 'repriced').find((one) => one.key !== trios.currentKey)?.key ?? '—';
          const ship = shipped.best[stop];
          shippedTotal += ship?.gain ?? 0;
          out.push(
            `| ${oracle.baseline?.[stop]?.pick ?? stop} | ${gained ? names(best.trio) : 'current'} | ${f(best.gain, 4)} | ${names(sizedTop)} | ${names(repricedTop)} | ${gained ? rankOf('sized', best.trio) : '—'} | ${gained ? rankOf('repriced', best.trio) : '—'} | ${ship?.trio === trios.currentKey ? 'current' : names(ship?.trio ?? '—')} | ${f(ship?.gain ?? 0, 4)} |`,
          );
          for (const from of FROMS)
            for (const k of KS) {
              const keys = new Set(shortlistTrios(screens, trios.currentKey, k, from));
              const got = bestAmong(oracle, keys, stop);
              bump(
                `${from} k=${String(k)}`,
                got.trio === best.trio,
                got.gain >= best.gain - 1e-12,
                best.gain - got.gain,
                gained,
              );
            }
        }
        out.push('');
        sections.push(out.join('\n'));
        summary.push(
          `| ${army.label} | ${trios.trios.length} | ${stopCount} | ${oracle.best.filter((one) => one.trio !== trios.currentKey).length} | ${oracle.best.map((one) => f(one.gain, 3)).join(' · ')} |`,
        );
      }

      const grid = FROMS.flatMap((from) =>
        KS.map((k) => {
          const t = tally.get(`${from} k=${String(k)}`)!;
          return `| ${from} | ${k} | ${share(t.same, t.total)} | ${share(t.equal, t.total)} | ${f(t.lost, 4)} |`;
        }),
      );

      const head = [
        '---',
        'type: experiment',
        'title: "193 — the captain trio"',
        `created: ${new Date().toLocaleDateString('sv-SE')}`,
        'tags: [w17, advisor, captains]',
        'related: ["[[Progression-Advisor-Plan]]", "[[191-what-a-percent-is-worth]]", "[[192-the-upgrade-cost-readout]]"]',
        '---',
        '',
        '# 193 — the captain trio',
        '',
        `Armies: ${list.length}, all built from the owner's roster of 2026-10-07 (8 captains, 56 trios), as the app plans them (\`buildPlanRequest\`). One lane in Node, wall and CPU one thread's. Gains are in the owner's \`rate()\`; "same trio" is the shortlist's best stop naming the oracle's trio, "equal gain" reaching the oracle's gain (a tie on gain between two trios counts).`,
        '',
        `Stops read: ${stopsAll}; stops where some trio beats the current one: ${share(stopsWithGain, stopsAll)}. Sum of the best gain per stop: oracle ${f(oracleTotal, 4)}, shipped (k = ${CAMPAIGN.captainConfirm}, both) ${f(shippedTotal, 4)}.`,
        '',
        "## Does the screen find the full plan's best?",
        '',
        'Per shortlist (which screen, how many trios planned in full), over every stop of every army: how often the best of the shortlist is the best of all 55 other trios, and the rating left on the table.',
        '',
        '| from | k | same trio as oracle | equal gain | rating lost (sum) |',
        '|---|---|---|---|---|',
        ...grid,
        '',
        '## Summary',
        '',
        '| army | trios | stops | stops with a better trio | best gain per stop |',
        '|---|---|---|---|---|',
        ...summary,
        '',
        '## Cost',
        '',
        'The oracle plans every trio in full; the shipped pass is the screen and the top 8; the advisor is the default 29 generic probes + baseline (experiment 191/192). "Together" is the shipped captain pass plus the advisor pass, wall, against the 20 s clock (`CAMPAIGN.budgets.extra`).',
        '',
        '| army | trios | oracle wall ms | oracle CPU ms | captains wall ms | captains CPU ms | cut | advisor wall ms | advisor CPU ms | together s |',
        '|---|---|---|---|---|---|---|---|---|---|',
        ...costRows,
        '',
      ];
      writeFileSync(OUT, [...head, ...sections].join('\n') + '\n');
    },
    BIG,
  );
});
