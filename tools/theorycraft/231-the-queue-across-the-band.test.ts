/**
 * 231 — **the training queue across the whole band, and what the troop wall shelters** (owner, 2026-10-13:
 * *"maybe the sweet spot should favour a bit much training time reduction to avoid big walls, and let more
 * mercs and all in, which always have big walls, handle that case. Also the big walls feel like expenditure
 * lost as they can actually shelter way more mercs than the plan advises to lose. Maybe I am looking for the
 * better trades, adding all ratings from the march."*).
 *
 *  - every plan the bar's stops were **drawn from** (`withTrade`: the band + the recommendation), with the
 *    seven readings, sorted by the training queue — so a low-queue march the bar passed over is visible;
 *  - every **stop**, stack by stack: the troop floor the shelter hangs on, each hired stack's HP, and how many
 *    more hired units the floor would hold (`floor / hpPerUnit`) against what the stop fields.
 *
 * `PYRRHIC_EXPORT=/tmp/pyrrhic-account-2026-10-13/account.json THEORY=1 pnpm vitest run tools/theorycraft/231-the-queue-across-the-band.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine';
import { rate } from '../../src/engine/rating';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { PlanTotals } from '../../src/engine/plan';
import { Report, duration, evaluateCounts, n } from './harness';

const EXPORT = process.env.PYRRHIC_EXPORT ?? '/tmp/pyrrhic-account-2026-10-13/account.json';

describe.skipIf(!process.env.THEORY)('231 — the queue across the band', () => {
  it('tables the band by queue and the shelter headroom per stop', () => {
    const report = new Report('231-the-queue-across-the-band');
    const parsed = parseImport(readFileSync(EXPORT, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = structuredClone(parsed.payload);
    const setup0 = profile.setups[0];
    if (!setup0) throw new Error('no setup');
    const input = { ...buildPlanRequest(profile, setup0), withTrade: true };
    const base = input.request;
    const plan = planCampaign(input);

    const troopIds = new Set(base.units.filter((u) => u.pool === 'leadership').map((u) => u.id));
    const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');

    const line = (row: PlanTotals & { label?: string; pick?: string }) =>
      `| ${row.pick ?? (row.label ?? '').replace(/\|/g, '/')} | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ` +
      `${row.repeat.mercLost} | ${n(row.repeat.gold)} | **${duration(row.repeat.seconds)}** | ` +
      `${(row.repeat.damage / row.repeat.silver).toFixed(3)} | ` +
      `${row.repeat.mercLost > 0 ? n(row.repeat.hiredDamage / row.repeat.mercLost) : '—'} |` +
      (sweet
        ? ` ${rate(
            {
              damage: sweet.repeat.damage,
              silver: sweet.repeat.silver,
              gold: sweet.repeat.gold,
              hired: sweet.repeat.mercLost,
              dragonCoins: sweet.repeat.dragonCoins ?? 0,
              seconds: sweet.repeat.seconds,
            },
            {
              damage: row.repeat.damage,
              silver: row.repeat.silver,
              gold: row.repeat.gold,
              hired: row.repeat.mercLost,
              dragonCoins: row.repeat.dragonCoins ?? 0,
              seconds: row.repeat.seconds,
            },
            CAMPAIGN.markerRates,
          ).toFixed(1)} |`
        : ' |');

    report.h(
      `the band, by training queue (${plan.trade?.length ?? 0} plans) — the last column rates each against the sweet spot`,
    );
    report.add(
      '| plan | worst dmg | silver | merc lost | gold | **queue** | per silver | per merc | vs sweet |',
    );
    report.add('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
    const trade = [...(plan.trade ?? [])].sort((a, b) => a.repeat.seconds - b.repeat.seconds);
    for (const row of trade.slice(0, 40)) report.add(line(row));

    report.h('the stops, rated against the sweet spot');
    report.add(
      '| stop | worst dmg | silver | merc lost | gold | **queue** | per silver | per merc | vs sweet |',
    );
    report.add('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const row of [...plan.alternatives].sort((a, b) => a.repeat.seconds - b.repeat.seconds))
      report.add(line(row));

    report.h('what each stop’s troop wall shelters');
    for (const row of plan.alternatives) {
      const e = evaluateCounts(base, row.counts);
      const stacks = e.result.stacks
        .map((s) => ({
          id: s.unitId,
          count: s.count,
          hp: s.totalHp,
          per: s.hpPerUnit,
          troops: troopIds.has(s.unitId),
        }))
        .sort((a, b) => a.hp - b.hp);
      const floor = Math.min(...stacks.filter((s) => s.troops).map((s) => s.hp));
      const floorStack = stacks.find((s) => s.troops && s.hp === floor);
      report.add(
        `\n**${row.pick}** — queue ${duration(row.repeat.seconds)}, ${row.repeat.mercLost} merc chunks. ` +
          `Troop floor ${n(Math.round(floor))} HP (${floorStack?.id.replace(/-(\d)$/, ' $1')}); ` +
          `wall total ${n(Math.round(stacks.filter((s) => s.troops).reduce((sum, s) => sum + s.hp, 0)))} HP.`,
      );
      report.add('| hired stack | count | total HP | room under the floor |');
      report.add('|---|---:|---:|---:|');
      for (const s of stacks.filter((x) => !x.troops)) {
        const room = s.per > 0 ? Math.floor(floor / s.per) : 0;
        report.add(
          `| ${s.id.replace(/-(\d)$/, ' $1')} | ${n(s.count)} | ${n(Math.round(s.hp))} | **${n(room)}** (fields ${n(s.count)}) |`,
        );
      }
    }

    report.h(
      'the band grouped by the mercenaries burned: the loudest, the shortest queue, and what the shortest queue costs',
    );
    report.add(
      '| burn | plans | most damage | that queue | **shortest queue** | its damage | its silver | its gold | its per silver | rate vs that burn’s loudest |',
    );
    report.add('|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|');
    const trade2 = plan.trade ?? [];
    const byBurn = new Map<number, PlanTotals[]>();
    for (const row of trade2) {
      const list = byBurn.get(row.repeat.mercLost) ?? [];
      list.push(row);
      byBurn.set(row.repeat.mercLost, list);
    }
    const rateOf = (before: PlanTotals, after: PlanTotals): number =>
      rate(
        {
          damage: before.repeat.damage,
          silver: before.repeat.silver,
          gold: before.repeat.gold,
          hired: before.repeat.mercLost,
          dragonCoins: before.repeat.dragonCoins ?? 0,
          seconds: before.repeat.seconds,
        },
        {
          damage: after.repeat.damage,
          silver: after.repeat.silver,
          gold: after.repeat.gold,
          hired: after.repeat.mercLost,
          dragonCoins: after.repeat.dragonCoins ?? 0,
          seconds: after.repeat.seconds,
        },
        CAMPAIGN.markerRates,
      );
    for (const burn of [...byBurn.keys()].sort((a, b) => a - b)) {
      const rows = byBurn.get(burn) ?? [];
      const loud = rows.reduce(
        (best, row) => (row.repeat.damage > best.repeat.damage ? row : best),
        rows[0]!,
      );
      const quick = rows.reduce(
        (best, row) => (row.repeat.seconds < best.repeat.seconds ? row : best),
        rows[0]!,
      );
      report.add(
        `| ${burn} | ${rows.length} | ${n(loud.repeat.damage)} | ${duration(loud.repeat.seconds)} | **${duration(quick.repeat.seconds)}** | ` +
          `${n(quick.repeat.damage)} | ${n(quick.repeat.silver)} | ${n(quick.repeat.gold)} | ${(quick.repeat.damage / quick.repeat.silver).toFixed(3)} | ` +
          `${rateOf(loud, quick).toFixed(1)} |`,
      );
    }

    report.save();
  }, 300_000);
});
