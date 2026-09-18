/**
 * 107 — **the put-back and the hired count** (owner, 2026-09-19: *"again the same problem when adding back
 * troops, it seems merc counts is not updated to allow to save mercs and shield them … using Troops first I
 * can get 2 009 810 … by adding back troops, impossible with Complete optimization"*).
 *
 * His camp that night: hunters only; three captains; the top guardsmen tiers and the melee specialist excluded.
 * Two readings of the Battle card — the localStorage dump (4 975 / 2 180, hunters 450) and the figures in his
 * message (5 100 / 2 200, hunters 120, the Troops-first march ARC1 1 028 · SP1 1 027 · RD1 513 · ARC2 568 ·
 * SP2 567 · RD2 283 · RD3 159 · EMH6 25 = 2 009 810 for 1 997 400 silver, 3 burned, 5d 14h).
 *
 * For each: the stops as generated and after the put-back (troops, floor HP, hired, burn, damage, silver,
 * queue); his Troops-first march priced by the recap; the frontier rows that field every troop type (the
 * tight ladders) with their band verdict and the stop rule that passed them over; and, for each stop, what
 * the put-back would give if the hired count were re-derived under the new troop floor instead of carried.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/107-put-back-mercs.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine';
import { chunks } from '../../src/engine/recovery';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, duration, evaluateCounts, n } from './harness';

const HIS_TROOPS_FIRST = {
  'archer-1': 1028,
  'spearman-1': 1027,
  'rider-1': 513,
  'archer-2': 568,
  'spearman-2': 567,
  'rider-2': 283,
  'rider-3': 159,
  'epic-monster-hunter-6': 25,
};

describe.skipIf(!process.env.THEORY)('107 — the put-back and the hired count', () => {
  it('measures the stops, the tight ladders and a re-derived hired count', () => {
    const report = new Report('107-put-back-mercs');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    for (const [title, leadership, authority, cap] of [
      ['localStorage dump — 4 975 / 2 180, hunters 450', 4_975, 2_180, 450],
      ['his message — 5 100 / 2 200, hunters 120', 5_100, 2_200, 120],
    ] as const) {
      const profile = structuredClone(parsed.payload);
      profile.sources.captains = [
        { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
        { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
        { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
      ];
      profile.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
      profile.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap }];
      const setup0 = profile.setups[0];
      if (!setup0) throw new Error('no setup');
      const setup = {
        ...setup0,
        active: { ...setup0.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
        housing: { ...setup0.housing, leadership, authority },
      };
      const base = buildStackRequest(profile, setup);
      const mercIds = new Set(base.units.filter((u) => u.pool === 'authority').map((u) => u.id));
      const troopIds = base.units.filter((u) => u.pool === 'leadership').map((u) => u.id);
      const hp = new Map(base.units.map((u) => [u.id, u.health] as const));
      const describeMarch = (counts: Record<string, number>) => {
        const e = evaluateCounts(base, counts);
        const stacks = e.result.stacks.map((s) => ({ id: s.unitId, count: s.count, hp: s.totalHp }));
        const floor = Math.min(...stacks.filter((s) => !mercIds.has(s.id)).map((s) => s.hp));
        const hiredTop = Math.max(0, ...stacks.filter((s) => mercIds.has(s.id)).map((s) => s.hp));
        const burn = [...mercIds].reduce((s, id) => s + chunks(counts[id] ?? 0), 0);
        const troops = Object.entries(counts)
          .filter(([id, c]) => c > 0 && !mercIds.has(id))
          .map(([id, c]) => `${id.replace(/-(\d)$/, ' $1')} ${n(c)}`)
          .join(' · ');
        const hired = Object.entries(counts)
          .filter(([id, c]) => c > 0 && mercIds.has(id))
          .map(([id, c]) => `${id} ${n(c)}`)
          .join(' · ');
        return {
          troops,
          hired,
          floor,
          hiredTop,
          sheltered: hiredTop < floor,
          burn,
          damage: e.summary.avgDamage,
          silver: e.summary.recovery.silver,
          seconds: e.summary.recovery.seconds,
          perSilver: e.summary.avgDamage / e.summary.recovery.silver,
          perHired: e.summary.avgDamage / Math.max(1, burn),
        };
      };
      const row = (name: string, counts: Record<string, number>): void => {
        const d = describeMarch(counts);
        report.add(
          `| ${name} | ${d.troops} | ${d.hired} | ${n(d.floor)} | ${n(d.hiredTop)}${d.sheltered ? '' : ' **exposed**'} | ${d.burn} | ${n(Math.round(d.damage))} | ${n(d.silver)} | ${duration(d.seconds)} | ${d.perSilver.toFixed(3)} | ${n(Math.round(d.perHired))} |`,
        );
      };
      const header = (): void => {
        report.add(
          '| march | troops | hired | troop floor HP | hired top HP | burn | damage | silver | queue | a silver | a hired |',
        );
        report.add('|---|---|---|---|---|---|---|---|---|---|---|');
      };

      const input = buildPlanRequest(profile, setup);
      const t0 = performance.now();
      const plan = planCampaign({ ...input, withFrontier: true, withTrade: true });
      const t1 = performance.now();
      const generated = planCampaign({ ...input, putBack: undefined, withTrade: true });
      report.h(
        `${title} (${Math.round(t1 - t0)} ms, ${plan.alternatives.length} stops, horizon ${CAMPAIGN.marches})`,
      );

      report.add('### The stops, as generated and after the put-back');
      header();
      for (const stop of plan.alternatives) {
        const before = generated.alternatives.find((s) => s.pick === stop.pick);
        if (before) row(`${stop.pick} — generated`, before.counts);
        row(
          `${stop.pick} — offered${stop.putBack ? ` (put back ${stop.putBack.unitId}: ${stop.putBack.damage.toFixed(1)} % dmg, ${stop.putBack.silver.toFixed(1)} % silver saved, ${stop.putBack.seconds.toFixed(1)} % queue saved)` : ''}`,
          stop.counts,
        );
      }
      report.add('');
      report.add('### His Troops-first march, priced by the recap on this request');
      header();
      row('Troops first (his message)', HIS_TROOPS_FIRST);
      const tf = sizeStacks({
        ...base,
        options: { ...base.options, method: 'elite', relaxedPreservation: false },
      });
      row('Troops first (sized here, Elite)', Object.fromEntries(tf.stacks.map((s) => [s.unitId, s.count])));
      report.add('');

      report.add(
        '### Frontier rows fielding every troop type the account holds (the tight ladders), and their verdicts',
      );
      report.add(
        '| silver (campaign) | damage (campaign) | burn / march | troops | hired | undominated | in band | stop | generator of |',
      );
      report.add('|---|---|---|---|---|---|---|---|---|');
      const full = (plan.frontier ?? []).filter((r) => troopIds.every((id) => (r.counts[id] ?? 0) > 0));
      for (const r of full.slice(0, 30)) {
        const troops = troopIds
          .map((id) => `${id.replace(/-(\d)$/, ' $1')} ${n(r.counts[id] ?? 0)}`)
          .join(' · ');
        const hired = [...mercIds].map((id) => `${id} ${n(r.counts[id] ?? 0)}`).join(' · ');
        report.add(
          `| ${n(r.silver)} | ${n(r.totalDamage)} | ${r.repeat.mercLost} | ${troops} | ${hired} | ${r.undominated ? 'yes' : 'no'} | ${r.inBand ? 'yes' : 'no'} | ${r.stop ?? '—'} | ${r.generatorOf ?? '—'} |`,
        );
      }
      report.add(`${full.length} such rows of ${(plan.frontier ?? []).length} on the frontier.`);
      report.add('');
      const sweet = plan.alternatives.find((s) => s.pick === 'sweet-spot');
      if (sweet) {
        report.add(
          `Sweet spot: ${n(sweet.repeat.damage)} a march for ${n(sweet.repeat.silver)} (${(sweet.repeat.damage / sweet.repeat.silver).toFixed(3)} a silver), ${sweet.repeat.mercLost} burned. The silver-saver rule needs a march left of it that is at least as efficient a silver.`,
        );
      }
      report.add('');

      report.add('### The put-back with the hired count re-derived under the new troop floor');
      report.add(
        'For each stop and each left-out troop type: the MS sizer over the stop’s types plus that one with the stop’s hired count carried as its cap (what the pass does), and with the cap left at the stock so the sizer fields what the new floor shelters; both then sheltered under the lowest troop stack.',
      );
      header();
      for (const stop of plan.alternatives) {
        const before = generated.alternatives.find((s) => s.pick === stop.pick) ?? stop;
        const fielded = troopIds.filter((id) => (before.counts[id] ?? 0) > 0);
        const absent = troopIds.filter((id) => (before.counts[id] ?? 0) === 0);
        for (const extra of absent) {
          for (const [label, caps] of [
            ['hired carried', Object.fromEntries([...mercIds].map((id) => [id, before.counts[id] ?? 0]))],
            ['hired re-derived', {}],
          ] as const) {
            const request: StackRequest = {
              ...base,
              units: base.units.filter((u) => [...fielded, extra].includes(u.id) || mercIds.has(u.id)),
              caps: { ...base.caps, ...caps },
              options: { ...base.options, method: 'ms', relaxedPreservation: false },
            };
            const sized = sizeStacks(request);
            const counts = Object.fromEntries(sized.stacks.map((s) => [s.unitId, s.count]));
            const floor = Math.min(
              ...Object.entries(counts)
                .filter(([id, c]) => c > 0 && !mercIds.has(id))
                .map(([id, c]) => c * (hp.get(id) ?? 0)),
            );
            for (const id of mercIds) {
              const unitHp = hp.get(id) ?? 1;
              if ((counts[id] ?? 0) * unitHp >= floor)
                counts[id] = Math.max(0, Math.ceil(floor / unitHp) - 1);
            }
            row(`${stop.pick} + ${extra} (${label})`, counts);
          }
        }
      }
      report.add('');
    }
    report.save();
  }, 300_000);
});
