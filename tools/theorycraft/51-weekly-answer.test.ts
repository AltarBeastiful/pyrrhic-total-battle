/**
 * 51 — the owner's economy, answered (owner, 2026-09-14):
 *   on hand 8 M silver + 12 k gold; renewable ~4–6 M silver a week (clan chests + production, ~1 min/day),
 *   ~10 k gold a week (clan chest), ~95 Epic Monster Hunter VI a week (daily missions + Triumph, ~15 min/day);
 *   Arbalester / Legionary / Chariot VI are bought with real money, so they never come back.
 *
 * Two things this file does that 0016 §7 did not. It scores every march through the **four recovery
 * options** (what the owner asked for: total silver to retrain, the "revive RD3 + mercs, retrain the rest"
 * shape, and the two fuller revives), and it ranks marches by **damage a week** under the flows above
 * rather than by damage a march — a march that deals less but costs less silver can win a week.
 *
 * Scenario C (the bonuses the 2026-09-14 report was fought with). Bounded search: 16 troop sets × 8 EMH6
 * counts × 4 advanced vectors × 2 methods × 2 sizings, plus the exact 0016 winner and 0015's tier-1 giant
 * as explicit designs. `THEORY=1 pnpm vitest run tools/theorycraft/51-weekly-answer.test.ts`.
 */
import { describe, it } from 'vitest';

import { chunks, retrainOne, reviveOne } from '../../src/engine/recovery';
import type { StackRequest, StackResult } from '../../src/engine/types';
import {
  Report,
  evaluate,
  evaluateCounts,
  label,
  loadOwner,
  n,
  scenarioC,
  withCaps,
  withMethod,
  withUnits,
} from './harness';

const SILVER_WEEK = Number(process.env.SILVER_WEEK ?? 5_000_000);
const SILVER_LOW = Number(process.env.SILVER_LOW ?? 4_000_000);
const GOLD_WEEK = Number(process.env.GOLD_WEEK ?? 10_000);
const EMH_WEEK = Number(process.env.EMH_WEEK ?? 95);
const SILVER_HAND = Number(process.env.SILVER_HAND ?? 8_000_000);
const GOLD_HAND = Number(process.env.GOLD_HAND ?? 12_000);

const EMH = 'epic-monster-hunter-6';
const ADV = ['arbalester-6', 'legionary-6', 'chariot-6'] as const;
const CAPS = { 'epic-monster-hunter-6': 92, 'arbalester-6': 76, 'legionary-6': 72, 'chariot-6': 37 };

const SETS: Record<string, string[]> = {
  RD3: ['rider-3'],
  'RD3 SP2': ['rider-3', 'spearman-2'],
  'RD3 SP2 ARC2': ['rider-3', 'spearman-2', 'archer-2'],
  'ARC2 RD2 RD3': ['archer-2', 'rider-2', 'rider-3'],
  'ARC2 SP2 RD2 RD3': ['archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  'ARC1 ARC2 SP2 RD2 RD3': ['archer-1', 'archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  'all 8': [
    'swordsman-1',
    'archer-1',
    'spearman-1',
    'rider-1',
    'archer-2',
    'spearman-2',
    'rider-2',
    'rider-3',
  ],
  'Kai 7': ['archer-1', 'spearman-1', 'rider-1', 'archer-2', 'spearman-2', 'rider-2', 'rider-3'],
  'ARC1 giant': ['archer-1'],
  'ARC1 SP1 RD1': ['archer-1', 'spearman-1', 'rider-1'],
  'SP2 only': ['spearman-2'],
  'SP1 only': ['spearman-1'],
};

const EMH_COUNTS = [0, 10, 20, 30, 46, 67, 80, 92];
const ADV_VECTORS: Record<string, Record<string, number>> = {
  none: { 'arbalester-6': 0, 'legionary-6': 0, 'chariot-6': 0 },
  tenth: { 'arbalester-6': 10, 'legionary-6': 10, 'chariot-6': 10 },
  third: { 'arbalester-6': 26, 'legionary-6': 24, 'chariot-6': 12 },
  caps: { 'arbalester-6': 76, 'legionary-6': 72, 'chariot-6': 37 },
};

/** The four recovery options, by the unit ids revived at the Temple (everything else is retrained). */
const RECOVERY: Record<string, string[]> = {
  'retrain all troops, revive the mercenaries': [],
  'revive RD3 + the mercenaries, retrain the rest': ['rider-3'],
  'revive RD3 + tier 2 + the mercenaries': ['rider-3', 'archer-2', 'spearman-2', 'rider-2'],
  'revive everything': [
    'rider-3',
    'archer-2',
    'spearman-2',
    'rider-2',
    'archer-1',
    'spearman-1',
    'rider-1',
    'swordsman-1',
  ],
};

/** The exact march 0016 §3 found (single-march optimum), and 0015 §4's damage-per-silver extreme. */
const REFERENCE: Record<string, Record<string, number>> = {
  '0016 optimum': {
    'rider-3': 582,
    'epic-monster-hunter-6': 92,
    'archer-2': 1519,
    'rider-2': 761,
    'legionary-6': 72,
    'chariot-6': 36,
    'arbalester-6': 71,
    'spearman-2': 138,
  },
  '0015 tier-1 giant': {
    'archer-1': 4343,
    'epic-monster-hunter-6': 92,
    'arbalester-6': 76,
    'legionary-6': 72,
    'chariot-6': 37,
  },
  'RD3 minimal sponge (beats the mercs on HP and base damage)': {
    'rider-3': 582,
    'epic-monster-hunter-6': 92,
  },
  'RD3 minimal sponge + 10/10/10': {
    'rider-3': 582,
    'epic-monster-hunter-6': 92,
    'arbalester-6': 10,
    'legionary-6': 10,
    'chariot-6': 10,
  },
  'RD3 minimal sponge + the full caps': {
    'rider-3': 582,
    'epic-monster-hunter-6': 92,
    'arbalester-6': 76,
    'legionary-6': 72,
    'chariot-6': 37,
  },
  'layered: 5 rungs so the mercenaries hit twice (RD3 ARC2 RD2 SP2 ARC1)': {
    'rider-3': 228,
    'archer-2': 809,
    'rider-2': 405,
    'spearman-2': 810,
    'archer-1': 1457,
    'epic-monster-hunter-6': 36,
    'arbalester-6': 38,
    'legionary-6': 38,
    'chariot-6': 19,
  },
  'tier-1 minimal sponge (beats the mercs on HP and base damage)': {
    'archer-1': 3710,
    'epic-monster-hunter-6': 92,
  },
  'tier-1 minimal sponge + 10/10/10': {
    'archer-1': 3710,
    'epic-monster-hunter-6': 92,
    'arbalester-6': 10,
    'legionary-6': 10,
    'chariot-6': 10,
  },
  'tier-1 minimal sponge + the full caps': {
    'archer-1': 3710,
    'epic-monster-hunter-6': 92,
    'arbalester-6': 76,
    'legionary-6': 72,
    'chariot-6': 37,
  },
};

interface Cost {
  silver: number;
  gold: number;
  seconds: number;
  /** Longest single-unit-type queue: the bound when the game trains types in parallel. */
  secondsParallel: number;
}

interface Design {
  march: string;
  set: string;
  damage: number;
  emhLost: number;
  advLost: number;
  counts: Record<string, number>;
  /** Per recovery option. */
  costs: Record<string, Cost>;
}

/** Size the troops just above the biggest mercenary stack (11-weekly's `minLeadership`), for cheapness. */
function minLeadership(request: StackRequest, full: StackResult): Record<string, number> {
  const mercMax = Math.max(0, ...full.stacks.filter((s) => s.pool === 'authority').map((s) => s.totalHp));
  const troops = full.stacks.filter((s) => s.pool === 'leadership');
  const counts: Record<string, number> = {};
  for (const s of full.stacks) counts[s.unitId] = s.count;
  if (troops.length === 0 || mercMax === 0) return counts;
  const minTroopHp = Math.min(...troops.map((s) => s.totalHp));
  const factor = Math.min(1, (mercMax + 1) / minTroopHp);
  for (const s of troops) counts[s.unitId] = Math.max(1, Math.ceil(s.count * factor));
  for (let guard = 0; guard < 50; guard += 1) {
    const ev = evaluateCounts(request, counts);
    const low = Math.min(...ev.result.stacks.filter((s) => s.pool === 'leadership').map((s) => s.totalHp));
    if (low > mercMax) break;
    for (const s of troops) counts[s.unitId] = (counts[s.unitId] ?? 0) + 1;
  }
  return counts;
}

describe.skipIf(!process.env.THEORY)('economy answer', () => {
  it('ranks marches by damage a week under the owner flows', () => {
    const report = new Report('51-weekly-answer');
    const owner = loadOwner();
    const req0 = scenarioC(owner.twelve);
    const byId = new Map(req0.units.map((u) => [u.id, u]));
    report.add(
      `Incomes: silver ${n(SILVER_WEEK)}/week (${n(SILVER_LOW)}–6 M), gold ${n(GOLD_WEEK)}/week, EMH6 ${n(EMH_WEEK)}/week. ` +
        `On hand: ${n(SILVER_HAND)} silver, ${n(GOLD_HAND)} gold. Advanced mercenaries never come back. Scenario C, temple 15, 4 squads.`,
    );

    const designs: Design[] = [];
    const cost = (ev: { result: StackResult }, revived: string[]): Cost => {
      let silver = 0;
      let gold = 0;
      let seconds = 0;
      let secondsParallel = 0;
      for (const stack of ev.result.stacks) {
        const unit = byId.get(stack.unitId);
        if (!unit) continue;
        const atTemple = stack.pool === 'authority' || revived.includes(stack.unitId);
        const c = atTemple
          ? reviveOne(unit, stack.count, req0.recovery)
          : retrainOne(unit, stack.count, req0.recovery);
        silver += c.silver;
        gold += c.gold;
        seconds += c.seconds;
        secondsParallel = Math.max(secondsParallel, c.seconds);
      }
      return { silver, gold, seconds, secondsParallel };
    };
    const record = (set: string, ev: { result: StackResult; summary: { avgDamage: number } }): void => {
      const emhLost = ev.result.stacks
        .filter((s) => s.unitId === EMH)
        .reduce((sum, s) => sum + chunks(s.count), 0);
      const advLost = ev.result.stacks
        .filter((s) => (ADV as readonly string[]).includes(s.unitId))
        .reduce((sum, s) => sum + chunks(s.count), 0);
      const costs: Record<string, Cost> = {};
      for (const [name, revived] of Object.entries(RECOVERY)) costs[name] = cost(ev, revived);
      const counts: Record<string, number> = {};
      for (const s of ev.result.stacks) counts[s.unitId] = s.count;
      designs.push({
        march: ev.result.stacks.map((s) => `${label(s.unitId)} ${n(s.count)}`).join(' · '),
        set,
        damage: ev.summary.avgDamage,
        emhLost,
        advLost,
        counts,
        costs,
      });
    };

    for (const [setName, troops] of Object.entries(SETS)) {
      for (const e of EMH_COUNTS) {
        for (const [advName, adv] of Object.entries(ADV_VECTORS)) {
          if (e === 0 && advName !== 'none') continue;
          const caps = { [EMH]: e, ...adv };
          const mercIds = [EMH, ...ADV].filter((id) => (caps[id as keyof typeof caps] ?? 0) > 0);
          for (const method of ['ms', 'elite'] as const) {
            for (const sizing of ['full L', 'just above the mercs'] as const) {
              if (sizing === 'just above the mercs' && method === 'elite') continue;
              const req = withMethod(withCaps(withUnits(req0, [...troops, ...mercIds]), caps), method);
              const ev =
                sizing === 'full L'
                  ? evaluate(req)
                  : evaluateCounts(req, minLeadership(req, evaluate(req).result));
              record(`${setName} · EMH6 ${e} · ${advName} · ${method} · ${sizing}`, ev);
            }
          }
        }
      }
    }
    for (const [name, counts] of Object.entries(REFERENCE)) {
      record(`${name} (0016's counts)`, evaluateCounts(req0, counts));
    }
    report.add(
      `${n(designs.length)} marches, each scored through ${Object.keys(RECOVERY).length} recovery options.`,
    );

    const WEEK_SECONDS = 7 * 86400;
    type Queue = 'serial' | 'parallel' | 'none';
    const marchesPerWeek = (
      d: Design,
      recovery: string,
      opts: { silver?: number; gold?: number; queue?: Queue } = {},
    ): number => {
      const c = d.costs[recovery];
      if (!c) return 0;
      const silver = opts.silver ?? SILVER_WEEK;
      const gold = opts.gold ?? GOLD_WEEK;
      const queue = opts.queue ?? 'serial';
      const queueSeconds = queue === 'serial' ? c.seconds : queue === 'parallel' ? c.secondsParallel : 0;
      return Math.min(
        c.silver > 0 ? silver / c.silver : Infinity,
        c.gold > 0 ? gold / c.gold : Infinity,
        d.emhLost > 0 ? EMH_WEEK / d.emhLost : Infinity,
        queueSeconds > 0 ? WEEK_SECONDS / queueSeconds : Infinity,
      );
    };
    const bindingOf = (d: Design, recovery: string, queue: Queue): string => {
      const c = d.costs[recovery];
      if (!c) return '-';
      const queueSeconds = queue === 'serial' ? c.seconds : c.secondsParallel;
      const options: [number, string][] = [
        [c.silver > 0 ? SILVER_WEEK / c.silver : Infinity, 'silver'],
        [c.gold > 0 ? GOLD_WEEK / c.gold : Infinity, 'gold'],
        [d.emhLost > 0 ? EMH_WEEK / d.emhLost : Infinity, 'EMH6 flow'],
        [queueSeconds > 0 ? WEEK_SECONDS / queueSeconds : Infinity, 'training time'],
      ];
      return String(options.sort((a, b) => a[0] - b[0])[0]?.[1]);
    };

    // ---- 1. The four recovery options, on the marches that matter --------------------------------
    report.h('1. The four recovery options (per march, scenario C)');
    report.add(
      '| march | option | silver | gold | time | mercs lost | damage | damage / silver |\n|---|---|---|---|---|---|---|---|',
    );
    const named = designs.filter(
      (d) =>
        d.set.includes('(0016') ||
        d.set.includes('(0015') ||
        d.set.startsWith('ARC2 SP2 RD2 RD3 · EMH6 92 · caps · ms · full') ||
        /^(RD3|ARC2 RD2 RD3|RD3 SP2|ARC1 giant) · EMH6 92 · (none|tenth) · ms · full L$/.test(d.set),
    );
    for (const d of named) {
      for (const [name, c] of Object.entries(d.costs)) {
        report.add(
          `| ${d.set.replace(/ · /g, ' ')} | ${name} | ${n(Math.round(c.silver))} | ${n(Math.round(c.gold))} | ${(c.seconds / 86400).toFixed(1)} d | ${d.emhLost + d.advLost} | ${n(d.damage)} | ${(d.damage / Math.max(1, c.silver)).toFixed(2)} |`,
        );
      }
    }

    // ---- 2. Damage a week, per recovery option, no advanced mercenaries -------------------------
    report.h('2. Damage a week with the advanced mercenaries untouched (the sustainable row)');
    const sustainable = designs.filter((d) => d.advLost === 0);
    const head =
      '| march | option | marches / week (queue serial) | (types in parallel) | damage / week | silver / march | gold / march | training / march | binding (serial) |\n|---|---|---|---|---|---|---|---|---|';
    report.add(head);
    const ranked2 = [...sustainable].sort(
      (x, y) =>
        marchesPerWeek(y, 'revive RD3 + the mercenaries, retrain the rest') * y.damage -
        marchesPerWeek(x, 'revive RD3 + the mercenaries, retrain the rest') * x.damage,
    );
    for (const d of ranked2.slice(0, 10)) {
      for (const option of [
        'retrain all troops, revive the mercenaries',
        'revive RD3 + the mercenaries, retrain the rest',
        'revive RD3 + tier 2 + the mercenaries',
      ]) {
        const c = d.costs[option];
        if (!c) continue;
        const serial = marchesPerWeek(d, option, { queue: 'serial' });
        const parallel = marchesPerWeek(d, option, { queue: 'parallel' });
        report.add(
          `| ${d.set.replace(/ · /g, ' ')} | ${option} | ${serial.toFixed(2)} | ${parallel.toFixed(2)} | **${n(Math.round(serial * d.damage))}** | ` +
            `${n(Math.round(c.silver))} | ${n(Math.round(c.gold))} | ${(c.seconds / 86400).toFixed(1)} d | ${bindingOf(d, option, 'serial')} |`,
        );
      }
    }

    // ---- 3. What the advanced mercenaries are worth, matched pair by pair ------------------------
    report.h('3. What the advanced mercenaries are worth, on the same march');
    const key = (d: Design): string => d.set.replace(/ · (none|tenth|third|caps) · /, ' · ');
    const noneByKey = new Map(designs.filter((d) => d.advLost === 0).map((d) => [key(d), d]));
    report.add(
      '| march | with the advanced mercenaries | without them | gain | advanced units | gain / unit |\n|---|---|---|---|---|---|',
    );
    const pairs = designs
      .filter((d) => d.advLost > 0 && noneByKey.has(key(d)))
      .sort((x, y) => y.damage - x.damage)
      .slice(0, 6);
    for (const d of pairs) {
      const none = noneByKey.get(key(d));
      if (!none) continue;
      const gain = d.damage - none.damage;
      report.add(
        `| ${key(d).replace(/ · /g, ' ')} | ${n(d.damage)} | ${n(none.damage)} | +${n(gain)} | ${d.advLost} | **${n(Math.round(gain / d.advLost))}** |`,
      );
    }

    // ---- 4. The advanced stock is a burst, not a rate -------------------------------------------
    report.h('4. The advanced stock is a burst, then the steady state is what matters');
    const burstMarches = (d: Design): number =>
      Math.min(
        ...ADV.map((id) =>
          d.counts[id] ? Math.floor((CAPS[id] ?? 0) / chunks(d.counts[id] ?? 0)) : Infinity,
        ),
      );
    report.add(
      '| burst march | damage / march | advanced units / march | marches the stock allows | burst damage |\n|---|---|---|---|---|',
    );
    const bursts = designs
      .filter((d) => d.advLost > 0)
      .sort((x, y) => burstMarches(y) * y.damage - burstMarches(x) * x.damage)
      .slice(0, 6);
    for (const d of bursts) {
      report.add(
        `| ${d.set.replace(/ · /g, ' ')} | ${n(d.damage)} | ${d.advLost} | ${burstMarches(d)} | **${n(burstMarches(d) * d.damage)}** |`,
      );
    }

    // ---- 5. Week one: the silver and gold on hand -----------------------------------------------
    report.h('5. Week one, with the silver and gold on hand');
    const steady = [...sustainable].sort(
      (x, y) =>
        marchesPerWeek(y, 'revive RD3 + the mercenaries, retrain the rest') * y.damage -
        marchesPerWeek(x, 'revive RD3 + the mercenaries, retrain the rest') * x.damage,
    )[0];
    if (steady) {
      report.add(`steady march: ${steady.set.replace(/ · /g, ' ')}`);
      for (const option of Object.keys(RECOVERY)) {
        const c = steady.costs[option];
        if (!c) continue;
        const k = marchesPerWeek(steady, option, {
          silver: SILVER_HAND + SILVER_WEEK,
          gold: GOLD_HAND + GOLD_WEEK,
          queue: 'serial',
        });
        report.add(
          `- ${option}: ${k.toFixed(2)} marches, **${n(Math.round(k * steady.damage))}** damage, ${n(Math.round(k * c.silver))} silver, ` +
            `${n(Math.round(k * c.gold))} gold, ${((k * c.seconds) / 86400).toFixed(1)} d of training`,
        );
      }
    }
    report.add(
      `\n(all rows recomputable with SILVER_WEEK / GOLD_WEEK / EMH_WEEK / SILVER_HAND / GOLD_HAND env overrides)`,
    );
    report.save();
  });
});
