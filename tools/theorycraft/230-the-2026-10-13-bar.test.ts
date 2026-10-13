/**
 * 230 — **the owner's bar of 2026-10-13, with the training queue on it.**
 *
 * The owner, 2026-10-13: *"everything above silver saver has a lot of training time and silver saver has SW1 in
 * it … if I add it back the trade is pretty good (+2 % silver for +21 % damage)."* This prints, for every stop
 * of the bar his export of that morning generates:
 *
 *  - the seven readings of `docs/plans/the-stops-the-bar-offers.md` §1 — worst-opening damage, silver, hired
 *    burned, gold, dragon coins, **the training queue in seconds**, and the two ratios the trade draws;
 *  - the counts each stop fields (troops first, then hired), so SW1's presence or absence is visible;
 *  - the put-back the engine **took** on the stop (`PlanRow.putBack`), and then, for every troop type the stop
 *    left out, the march a put-back **would** be: its damage, silver and queue as percentages against the stop,
 *    the owner's rating of it, and whether the pass's own rule (`march.seconds < row.repeat.seconds`) admits it.
 *
 * `PYRRHIC_EXPORT=/tmp/pyrrhic-account-2026-10-13/account.json THEORY=1 pnpm vitest run tools/theorycraft/230-the-2026-10-13-bar.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { unitById } from '../../src/data';
import { largestSustained, planCampaign, planMarch, planRepeats, resizeMarchOver } from '../../src/engine';
import { chunks, retrainOne } from '../../src/engine/recovery';
import { rate } from '../../src/engine/rating';
import { sizeStacks } from '../../src/engine/stacker';
import type { UnitDef } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { Report, duration, evaluateCounts, n } from './harness';

const EXPORT = process.env.PYRRHIC_EXPORT ?? '/tmp/pyrrhic-account-2026-10-13/account.json';

const pctChange = (before: number, after: number): string => {
  if (before === 0) return '—';
  const p = ((after - before) / before) * 100;
  return `${p >= 0 ? '+' : ''}${p.toFixed(1)} %`;
};

describe.skipIf(!process.env.THEORY)('230 — the 2026-10-13 bar with the training queue', () => {
  it('prints every stop and every put-back candidate', () => {
    const report = new Report('230-the-2026-10-13-bar');
    const parsed = parseImport(readFileSync(EXPORT, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = structuredClone(parsed.payload);
    const setup0 = profile.setups[0];
    if (!setup0) throw new Error('no setup');
    const input = buildPlanRequest(profile, setup0);
    const base = input.request;
    const plan = planCampaign(input);

    const troopIds = new Set(base.units.filter((u) => u.pool === 'leadership').map((u) => u.id));
    const authorityIds = new Set(base.units.filter((u) => u.pool === 'authority').map((u) => u.id));

    const fmt = (counts: Record<string, number>, wantTroops: boolean): string =>
      Object.entries(counts)
        .filter(([id, c]) => c > 0 && troopIds.has(id) === wantTroops)
        .sort()
        .map(([id, c]) => `${id.replace(/-(\d)$/, ' $1')} ${n(c)}`)
        .join(' · ') || '—';

    const mercLostOf = (counts: Record<string, number>): number =>
      Object.entries(counts).reduce((sum, [id, c]) => sum + (authorityIds.has(id) ? chunks(c) : 0), 0);

    report.h(`his bar — ${plan.alternatives.length} stops, ${CAMPAIGN.marches} marches`);
    report.add(
      '| stop | worst dmg | silver | merc lost | gold | coins | **queue** | per silver | per merc |',
    );
    report.add('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
    for (const row of plan.alternatives) {
      report.add(
        `| ${row.pick} | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ${row.repeat.mercLost} | ` +
          `${n(row.repeat.gold)} | ${n(row.repeat.dragonCoins ?? 0)} | **${duration(row.repeat.seconds)}** | ` +
          `${row.repeat.silver > 0 ? (row.repeat.damage / row.repeat.silver).toFixed(3) : '—'} | ` +
          `${row.repeat.mercLost > 0 ? n(row.repeat.hiredDamage / row.repeat.mercLost) : '—'} |`,
      );
    }

    report.h('what each stop fields');
    for (const row of plan.alternatives) {
      report.add(
        `- **${row.pick}** (${row.shape}) — troops: ${fmt(row.counts, true)} — hired: ${fmt(row.counts, false)}` +
          ` — queue ${duration(row.repeat.seconds)}` +
          (row.putBack
            ? ` — **put back ${row.putBack.unitId.replace(/-(\d)$/, ' $1')}**: +${row.putBack.damage.toFixed(1)} % damage, ` +
              `${row.putBack.silver >= 0 ? '-' : '+'}${Math.abs(row.putBack.silver).toFixed(1)} % silver, ` +
              `${row.putBack.seconds >= 0 ? '-' : '+'}${Math.abs(row.putBack.seconds).toFixed(1)} % queue`
            : ' — no put-back taken'),
      );
    }

    report.h('every put-back candidate the pass looked at (and what it did with it)');
    for (const row of plan.alternatives) {
      const fielded = base.units.filter((u) => u.pool === 'leadership' && (row.counts[u.id] ?? 0) > 0);
      const absent = base.units.filter((u) => u.pool === 'leadership' && (row.counts[u.id] ?? 0) === 0);
      const mercTypes = base.units.filter((u) => u.pool !== 'leadership');
      if (fielded.length === 0 || absent.length === 0) {
        report.add(`\n**${row.pick}** — nothing to put back (fields ${fielded.length} troop type(s)).`);
        continue;
      }
      const caps: Record<string, number> = { ...base.caps };
      for (const m of mercTypes) caps[m.id] = row.counts[m.id] ?? 0;
      const keepIds = new Set([...fielded.map((u) => u.id), ...mercTypes.map((u) => u.id)]);
      report.add(
        `\n**${row.pick}** — fields ${fielded.map((u) => u.id.replace(/-(\d)$/, ' $1')).join(', ')}, left out ` +
          `${absent.map((u) => u.id.replace(/-(\d)$/, ' $1')).join(', ')}; the stop's march is ${n(row.repeat.damage)} ` +
          `damage, ${n(row.repeat.silver)} silver, ${duration(row.repeat.seconds)} queue.`,
      );
      report.add('| put back | damage | silver | queue | rating | the pass |');
      report.add('|---|---:|---:|---:|---:|---|');
      for (const extra of absent as UnitDef[]) {
        const units = base.units.filter((u) => keepIds.has(u.id) || u.id === extra.id);
        const sized = sizeStacks({
          ...base,
          units,
          caps,
          options: { ...base.options, method: 'ms', relaxedPreservation: false },
        });
        // The pass's own shelter (`shelterUnder`): every hired stack lowered just under the troop floor.
        const stacks = sized.stacks.map((s) => ({ ...s }));
        const rungHp = stacks.filter((s) => troopIds.has(s.unitId)).map((s) => s.totalHp);
        const floor = rungHp.length > 0 ? Math.min(...rungHp) : 0;
        if (floor > 0) {
          for (const s of stacks) {
            if (!troopIds.has(s.unitId) && s.totalHp >= floor && s.hpPerUnit > 0)
              s.count = Math.max(0, Math.ceil(floor / s.hpPerUnit) - 1);
          }
        }
        const counts: Record<string, number> = {};
        for (const s of stacks) if (s.count > 0) counts[s.unitId] = s.count;
        const rungs = stacks.filter((s) => troopIds.has(s.unitId) && s.count > 0);
        const e = evaluateCounts(base, counts);
        const damage = e.summary.minDamage;
        const silver = e.summary.recovery.silver;
        const seconds = e.summary.recovery.seconds;
        const hiredDamage = e.summary.damageByPool.authority;
        const mercLost = mercLostOf(counts);
        const score = rate(
          {
            damage: row.repeat.damage,
            silver: row.repeat.silver,
            gold: row.repeat.gold,
            hired: row.repeat.mercLost,
            dragonCoins: row.repeat.dragonCoins ?? 0,
            seconds: row.repeat.seconds,
          },
          {
            damage,
            silver,
            gold: e.summary.recovery.gold,
            hired: mercLost,
            dragonCoins: e.summary.recovery.dragonCoins,
            seconds,
          },
          CAMPAIGN.markerRates,
        );
        const reason =
          rungs.length < 2
            ? 'no — under two troop stacks'
            : seconds >= row.repeat.seconds
              ? 'no — **queue does not shorten**'
              : score < 0
                ? 'no — rating < 0'
                : 'admits';
        report.add(
          `| ${extra.id.replace(/-(\d)$/, ' $1')} | ${pctChange(row.repeat.damage, damage)} | ` +
            `${pctChange(row.repeat.silver, silver)} | ${pctChange(row.repeat.seconds, seconds)} | ` +
            `${score.toFixed(1)} | ${reason} |`,
        );
        void hiredDamage;
      }
    }

    /**
     * **A March edit, not the plan's put-back pass** — the same call `planStopAgain` makes (`generate.ts`):
     * put one left-out type back into the stop and re-size over exactly the types that are in, with the
     * hired caps the *account* gives (`capOf`: an authority type at `largestSustained(stock, repeats)`, a
     * dominance type at its own pool), not the stop's own counts. This is the press the owner describes.
     */
    report.h("a March edit: put one type back into the stop, the engine's own re-size (`resizeMarchOver`)");
    for (const stop of plan.alternatives) {
      const inStop = new Set(Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0));
      const absent = base.units.filter((u) => u.pool === 'leadership' && (stop.counts[u.id] ?? 0) === 0);
      if (absent.length === 0) {
        report.add(`\n**${stop.pick}** — fields every troop type; nothing left to put back.`);
        continue;
      }
      const repeats = planRepeats(stop);
      const troopIds: string[] = [];
      const hired: Record<string, number> = {};
      for (const unit of base.units) {
        if (!inStop.has(unit.id)) continue;
        if (unit.pool === 'leadership') {
          troopIds.push(unit.id);
          continue;
        }
        if (unit.pool === 'dominance') {
          hired[unit.id] = Math.max(
            stop.counts[unit.id] ?? 0,
            Math.floor(base.housing.dominance / Math.max(1, unit.cost)),
          );
          continue;
        }
        const held = base.caps[unit.id];
        hired[unit.id] =
          held === undefined
            ? Math.floor(base.housing.authority / Math.max(1, unit.cost))
            : largestSustained(held, repeats);
      }
      report.add(
        `\n**${stop.pick}** — its march is ${n(stop.repeat.damage)} damage, ${n(stop.repeat.silver)} silver, ` +
          `${duration(stop.repeat.seconds)} queue; left out ${absent.map((u) => u.id.replace(/-(\d)$/, ' $1')).join(', ')}.`,
      );
      report.add('| put back | damage | silver | gold | queue | merc lost | fill |');
      report.add('|---|---:|---:|---:|---:|---:|---:|');
      for (const extra of absent as UnitDef[]) {
        const answer = resizeMarchOver(base, {
          troopIds: [...troopIds, extra.id],
          hired,
          stop: stop.counts,
          fills: CAMPAIGN.editFills,
          putBack: CAMPAIGN.putBack,
        });
        if (answer === null) {
          report.add(`| ${extra.id.replace(/-(\d)$/, ' $1')} | — | — | — | — | — | no march fits |`);
          continue;
        }
        const priced = planMarch(base, answer.counts);
        const dam = priced.summary.minDamage;
        const rec = priced.summary.recovery;
        const lost = mercLostOf(answer.counts);
        report.add(
          `| ${extra.id.replace(/-(\d)$/, ' $1')} | ${pctChange(stop.repeat.damage, dam)} | ` +
            `${pctChange(stop.repeat.silver, rec.silver)} | ${pctChange(stop.repeat.gold, rec.gold)} | ` +
            `${pctChange(stop.repeat.seconds, rec.seconds)} | ${lost} (was ${stop.repeat.mercLost}) | ${answer.fill} % |`,
        );
      }
    }

    report.h('a March edit: take one type out of the stop, re-sized (`resizeMarchOver`)');
    for (const stop of plan.alternatives) {
      const inStop = new Set(Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0));
      const fielded = base.units.filter((u) => u.pool === 'leadership' && (stop.counts[u.id] ?? 0) > 0);
      const repeats = planRepeats(stop);
      report.add(
        `\n**${stop.pick}** — ${n(stop.repeat.damage)} damage, ${n(stop.repeat.silver)} silver, ` +
          `${duration(stop.repeat.seconds)} queue, fields ${fielded.map((u) => u.id.replace(/-(\d)$/, ' $1')).join(', ')}.`,
      );
      report.add('| take out | damage | silver | gold | queue | merc lost |');
      report.add('|---|---:|---:|---:|---:|---:|');
      for (const extra of fielded as UnitDef[]) {
        const troopIds: string[] = [];
        const hired: Record<string, number> = {};
        for (const unit of base.units) {
          if (!inStop.has(unit.id) || unit.id === extra.id) continue;
          if (unit.pool === 'leadership') {
            troopIds.push(unit.id);
            continue;
          }
          if (unit.pool === 'dominance') {
            hired[unit.id] = Math.max(
              stop.counts[unit.id] ?? 0,
              Math.floor(base.housing.dominance / Math.max(1, unit.cost)),
            );
            continue;
          }
          const held = base.caps[unit.id];
          hired[unit.id] =
            held === undefined
              ? Math.floor(base.housing.authority / Math.max(1, unit.cost))
              : largestSustained(held, repeats);
        }
        if (troopIds.length < 2) continue;
        const answer = resizeMarchOver(base, {
          troopIds,
          hired,
          stop: stop.counts,
          fills: CAMPAIGN.editFills,
          putBack: CAMPAIGN.putBack,
        });
        if (answer === null) {
          report.add(`| ${extra.id.replace(/-(\d)$/, ' $1')} | — | — | — | — | no march fits |`);
          continue;
        }
        const rec = planMarch(base, answer.counts).summary;
        report.add(
          `| ${extra.id.replace(/-(\d)$/, ' $1')} | ${pctChange(stop.repeat.damage, rec.minDamage)} | ` +
            `${pctChange(stop.repeat.silver, rec.recovery.silver)} | ${pctChange(stop.repeat.gold, rec.recovery.gold)} | ` +
            `${pctChange(stop.repeat.seconds, rec.recovery.seconds)} | ${mercLostOf(answer.counts)} (was ${stop.repeat.mercLost}) |`,
        );
      }
    }

    // The trade the owner describes, in absolute figures, against the sweet spot beside it.
    report.h('the trade he describes: the cheapest stop with SW1 taken out, beside the sweet spot');
    const cheapest = plan.alternatives[0];
    if (cheapest) {
      const inStop = new Set(Object.keys(cheapest.counts).filter((id) => (cheapest.counts[id] ?? 0) > 0));
      const repeats = planRepeats(cheapest);
      const troopIds: string[] = [];
      const hired: Record<string, number> = {};
      for (const unit of base.units) {
        if (!inStop.has(unit.id) || unit.id === 'swordsman-1') continue;
        if (unit.pool === 'leadership') {
          troopIds.push(unit.id);
          continue;
        }
        if (unit.pool === 'dominance') {
          hired[unit.id] = Math.max(
            cheapest.counts[unit.id] ?? 0,
            Math.floor(base.housing.dominance / Math.max(1, unit.cost)),
          );
          continue;
        }
        const held = base.caps[unit.id];
        hired[unit.id] =
          held === undefined
            ? Math.floor(base.housing.authority / Math.max(1, unit.cost))
            : largestSustained(held, repeats);
      }
      const answer = resizeMarchOver(base, {
        troopIds,
        hired,
        stop: cheapest.counts,
        fills: CAMPAIGN.editFills,
        putBack: CAMPAIGN.putBack,
      });
      const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
      const line = (
        label: string,
        r: { damage: number; ms: number; gold: number; seconds: number; lost: number },
      ) =>
        `| ${label} | ${n(r.damage)} | ${n(r.ms)} | ${n(r.gold)} | ${duration(r.seconds)} | ` +
        `${(r.damage / r.ms).toFixed(3)} | ${r.lost} |`;
      report.add('| march | damage | silver | gold | queue | per silver | merc lost |');
      report.add('|---|---:|---:|---:|---:|---:|---:|');
      report.add(
        line(`${cheapest.pick} as generated (SW1 in)`, {
          damage: cheapest.repeat.damage,
          ms: cheapest.repeat.silver,
          gold: cheapest.repeat.gold,
          seconds: cheapest.repeat.seconds,
          lost: cheapest.repeat.mercLost,
        }),
      );
      if (answer) {
        const rec = planMarch(base, answer.counts).summary;
        report.add(
          line(`${cheapest.pick} with SW1 taken out`, {
            damage: rec.minDamage,
            ms: rec.recovery.silver,
            gold: rec.recovery.gold,
            seconds: rec.recovery.seconds,
            lost: mercLostOf(answer.counts),
          }),
        );
      }
      if (sweet)
        report.add(
          line('sweet spot', {
            damage: sweet.repeat.damage,
            ms: sweet.repeat.silver,
            gold: sweet.repeat.gold,
            seconds: sweet.repeat.seconds,
            lost: sweet.repeat.mercLost,
          }),
        );
    }

    report.h('where the queue comes from, per stop (retrain seconds by unit)');
    for (const stop of plan.alternatives) {
      const rows = Object.entries(stop.counts)
        .filter(([, c]) => c > 0)
        .map(([id, count]) => {
          const unit = unitById(id);
          return { id, count, seconds: unit ? retrainOne(unit, count, base.recovery).seconds : 0 };
        })
        .sort((a, b) => b.seconds - a.seconds);
      const total = rows.reduce((sum, r) => sum + r.seconds, 0);
      report.add(
        `\n**${stop.pick}** — ${duration(total)} total, retrain plan \`${base.recovery.plan.mode}\`:`,
      );
      for (const r of rows.slice(0, 6)) {
        const share = total > 0 ? ((r.seconds / total) * 100).toFixed(0) : '0';
        report.add(
          `  - ${r.id.replace(/-(\d)$/, ' $1')} ${n(r.count)} → ${duration(r.seconds)} (${share} %)`,
        );
      }
    }

    report.h('the cheapest stop, stack by stack: what the shelter floor is');
    for (const stop of plan.alternatives.slice(0, 1)) {
      const e = evaluateCounts(base, stop.counts);
      report.add(`\n**${stop.pick}** — ${stop.repeat.mercLost} merc(s) burned; troop stacks by total HP:`);
      report.add('| stack | count | total HP | hired |');
      report.add('|---|---:|---:|---|');
      for (const s of [...e.result.stacks].sort((a, b) => a.totalHp - b.totalHp)) {
        report.add(
          `| ${s.unitId.replace(/-(\d)$/, ' $1')} | ${n(s.count)} | ${n(Math.round(s.totalHp))} | ${troopIds.has(s.unitId) ? '' : '**yes**'} |`,
        );
      }
    }

    report.save();
  }, 300_000);
});
