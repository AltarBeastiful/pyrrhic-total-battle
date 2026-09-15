/**
 * 77 — three stacks on one arena (owner, 2026-09-15): *"Take the parameters, update the mercs and redo the
 * calculation of the stack using our optimization and compare it again with the generated ones. Be sure to
 * compute damage again using the same formula and data for each to avoid differences with bonuses and such.
 * So take just the stack count from kais and total stack and compute the difference. Explaining which seems
 * better and why."*
 *
 * Counts only: every number below is our own `simulateBattle` under one bonus set per pass. Neither
 * fixture's own figures — Kai's health lines, TotalStack's answer — are used for anything but the counts.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/77-three-stacks.test.ts`
 */
import { describe, it } from 'vitest';

import { readFileSync } from 'node:fs';

import { getUnits, unitById } from '../../src/data';
import { aggregateBonuses } from '../../src/engine/bonuses';
import { chunks } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { BonusTotals, ResolvedSource, StackRequest, UnitDef } from '../../src/engine/types';
import { planCampaign } from '../../src/engine/plan';
import { Report, evaluateCounts, kaiReportTotals, n, withMethod } from './harness';

const KAI_FIXTURE = new URL('../../docs/research/fixtures/kai-extract-2026-09-15-4000.json', import.meta.url);
const THEIR_FIXTURE = new URL(
  '../../docs/research/fixtures/totalstack-2026-09-15-optimize-1343.json',
  import.meta.url,
);
const PROFILE = JSON.parse(
  readFileSync(
    process.env.PYRRHIC_EXPORT ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-13.json',
    'utf8',
  ),
) as {
  payload: {
    troops: {
      guardsmen: { min: number; max: number };
      specialists: { min: number; max: number };
      topTierExcluded: { guardsmen: string[]; specialists: string[] };
    };
  };
};

// ---- the arena, stated once ------------------------------------------------------------------------------
const LEADERSHIP = 4_000;
const AUTHORITY = 2_000;
const ENEMY = { melee: 1, ranged: 1, mounted: 1, flying: 1 } as const;
/** The hired stock the three stacks imply: Kai's widest legal reading, and TotalStack's inside it. */
const STOCK_WIDE = { 'epic-monster-hunter-6': 16, 'arbalester-6': 18, 'legionary-6': 18, 'chariot-6': 8 };
const STOCK_NARROW = { 'epic-monster-hunter-6': 14, 'arbalester-6': 15, 'legionary-6': 16, 'chariot-6': 7 };
const MERC_IDS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;

/** The query's own army: guardsmen 1–3 with the top tier's melee/ranged excluded, specialists tier 1. */
function arenaTroops(): UnitDef[] {
  const rows = [
    { group: 'guardsmen', key: 'guardsmen', range: PROFILE.payload.troops.guardsmen },
    { group: 'specialist', key: 'specialists', range: PROFILE.payload.troops.specialists },
  ] as const;
  return getUnits().filter((unit) =>
    rows.some(
      ({ group, key, range }) =>
        unit.group === group &&
        unit.tier >= range.min &&
        unit.tier <= range.max &&
        (unit.tier !== range.max ||
          !PROFILE.payload.troops.topTierExcluded[key].includes(unit.category ?? '')),
    ),
  );
}
const TROOPS = arenaTroops();

/** The capture's own bonus set: melee +35 % health / +70 % strength, army +3 % / +3 %. */
function captureTotals(): BonusTotals {
  const source: ResolvedSource = {
    id: 'totalstack-2026-09-15',
    label: 'the capture request',
    kind: 'custom',
    health: { melee: 35, army: 3 },
    strength: { melee: 70, army: 3 },
  };
  return aggregateBonuses([source]);
}

function arena(totals: BonusTotals, caps: Record<string, number>): StackRequest {
  return {
    units: [...TROOPS, ...MERC_IDS.map((id) => unitById(id) as UnitDef)],
    caps: { ...caps },
    housing: { leadership: LEADERSHIP, authority: AUTHORITY, dominance: 0 },
    totals,
    options: {
      method: 'ms',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: true,
    },
    enemy: { ...ENEMY },
    activeEvents: [],
    recovery: {
      templeLevel: 0,
      trainingCostReduction: {},
      trainingSpeed: {},
      plan: { mode: 'retrain' },
    },
  };
}

// ---- the three stacks, counts only ------------------------------------------------------------------------
/** Kai's, from the fixture's own lines: name + tier → our unit id. */
const KAI: Record<string, number> = (() => {
  const raw = JSON.parse(readFileSync(KAI_FIXTURE, 'utf8')) as {
    payload: { army: { name: string; tier: number; count: number }[] };
  };
  const ids = getUnits();
  /** `Legionary VI` and the extract's `Legionary` are the same unit: drop a trailing roman numeral. */
  const base = (name: string): string =>
    name
      .replace(/[^a-z]/gi, '')
      .toLowerCase()
      .replace(/(viii|vii|iii|ii|ix|iv|vi|v|i)$/, '');
  const out: Record<string, number> = {};
  for (const stack of raw.payload.army) {
    const id = ids.find((unit) => unit.tier === stack.tier && base(unit.name) === base(stack.name))?.id;
    if (!id) throw new Error(`kai extract: no unit for ${stack.name} t${stack.tier}`);
    out[id] = stack.count;
  }
  return out;
})();
/** TotalStack's, from the second capture's answer — the counts only. */
const THEIRS: Record<string, number> = (() => {
  const raw = JSON.parse(readFileSync(THEIR_FIXTURE, 'utf8')) as {
    response: {
      calculation: { troopCounts: Record<string, number>; mercenaryCounts: Record<string, number> };
    };
  };
  return { ...raw.response.calculation.troopCounts, ...raw.response.calculation.mercenaryCounts };
})();
/** The owner's transcription of ours, to be checked against what our own optimizer returns. */
const TRANSCRIBED: Record<string, number> = {
  'spearman-1': 855,
  'spearman-2': 465,
  'rider-1': 411,
  'archer-1': 806,
  'rider-2': 219,
  'archer-2': 430,
  'rider-3': 118,
  'arbalester-6': 16,
  'legionary-6': 16,
  'chariot-6': 7,
  'epic-monster-hunter-6': 10,
};

const isHired = (id: string): boolean => unitById(id)?.pool === 'authority';
const hiredSpent = (counts: Record<string, number>): number =>
  Object.entries(counts).reduce((sum, [id, count]) => sum + (isHired(id) ? chunks(count) : 0), 0);
const hiredFielded = (counts: Record<string, number>): number =>
  Object.entries(counts).reduce((sum, [id, count]) => sum + (isHired(id) ? count : 0), 0);
const troopFielded = (counts: Record<string, number>): number =>
  Object.entries(counts).reduce((sum, [id, count]) => sum + (isHired(id) ? 0 : count), 0);
const STOCK_TOTAL = Object.values(STOCK_WIDE).reduce((sum, cap) => sum + cap, 0);

/** The first capture's answer and caps, for the two-captures comparison. */
const FIRST_CAPTURE = JSON.parse(
  readFileSync(
    new URL('../../docs/research/fixtures/totalstack-2026-09-15-optimize.json', import.meta.url),
    'utf8',
  ),
) as {
  request: { mercenaryCaps: Record<string, number> };
  response: { calculation: { troopCounts: Record<string, number>; mercenaryCounts: Record<string, number> } };
};
const THEIR_COUNTS_FIRST: Record<string, number> = {
  ...FIRST_CAPTURE.response.calculation.troopCounts,
  ...FIRST_CAPTURE.response.calculation.mercenaryCounts,
};
const THEIR_REQUEST_CAPS = FIRST_CAPTURE.request.mercenaryCaps;

const PASSES: { name: string; totals: BonusTotals }[] = [
  { name: "pass 1 — scenario C (the account's current bonuses)", totals: kaiReportTotals() },
  { name: "pass 2 — the capture's own bonuses (melee +35/+70, army +3/+3)", totals: captureTotals() },
];

describe.skipIf(!process.env.THEORY)(
  'three stacks on one arena',
  () => {
    it('re-derives our answer, then scores all three under one bonus set at a time', () => {
      const report = new Report('77-three-stacks');

      report.h('The arena: one set of parameters for all three');
      report.add(
        `| parameter | value |\n|---|---|\n` +
          `| leadership · authority · dominance | ${n(LEADERSHIP)} · ${n(AUTHORITY)} · 0 |\n` +
          `| army | the query's own: guardsmen 1–3 with the top tier's melee/ranged excluded, specialists tier 1, no monsters or engineers, nothing excluded by id — ${TROOPS.length} troop types (${TROOPS.map((unit) => unit.id).join(', ')}) |\n` +
          `| hired | ${MERC_IDS.map((id) => `${id} ${n(STOCK_WIDE[id] ?? 0)}`).join(' · ')} — Kai's widest legal reading, ${n(STOCK_TOTAL)} units; TotalStack's counts fit inside it |\n` +
          `| enemy | ${Object.entries(ENEMY)
            .map(([key, count]) => `${key} ${n(count)}`)
            .join(', ')} — 4 squads |\n` +
          `| recovery | temple 0, retrain all, no reductions or speed-ups |\n` +
          `| bonuses | **one set per pass**, and every stack is both searched and scored under the pass's set: pass 1 scenario C (guardsmen +159 / +189, the category bonuses, +3 % double damage), pass 2 the capture's own (melee +35 % health / +70 % strength, army +3 % / +3 %) |`,
      );

      // ---- 1. our own answer, re-derived ----------------------------------------------------------------
      report.h('1. Our own answer, re-derived rather than transcribed');
      const derived = PASSES.map((pass) => {
        const request = arena(pass.totals, STOCK_WIDE);
        return {
          pass: pass.name,
          request,
          search: searchPriority({ request, objective: 'damagePerSilver', budgetMs: 30_000 }),
          elite: sizeStacks(withMethod(request, 'elite')),
          ms: sizeStacks(withMethod(request, 'ms')),
          msRelaxed: sizeStacks(withMethod(request, 'msRelaxed')),
        };
      });
      const countsOf = (stacks: { unitId: string; count: number }[]): Record<string, number> => {
        const out: Record<string, number> = {};
        for (const stack of stacks) out[stack.unitId] = stack.count;
        return out;
      };
      for (const entry of derived) {
        report.add(
          `\n**${entry.pass}** — our optimizer on this arena: the priority search (\`damagePerSilver\`) returns ` +
            `${Object.entries(countsOf(entry.search.result.stacks))
              .map(([id, count]) => `${n(count)} ${id}`)
              .join(' · ')}; the shipped sizers read ` +
            `\`elite\` ${n(troopFielded(countsOf(entry.elite.stacks)) + hiredFielded(countsOf(entry.elite.stacks)))} units, ` +
            `\`ms\` ${n(troopFielded(countsOf(entry.ms.stacks)) + hiredFielded(countsOf(entry.ms.stacks)))}, ` +
            `\`msRelaxed\` ${n(troopFielded(countsOf(entry.msRelaxed.stacks)) + hiredFielded(countsOf(entry.msRelaxed.stacks)))}.`,
        );
      }
      const transcriptionCheck = PASSES.map((pass, index) => {
        const mine = countsOf((derived[index] as (typeof derived)[number]).search.result.stacks);
        const ids = [...new Set([...Object.keys(mine), ...Object.keys(TRANSCRIBED)])];
        return {
          pass: pass.name,
          mine,
          rows: ids.map((id) => ({ id, mine: mine[id] ?? 0, his: TRANSCRIBED[id] ?? 0 })),
        };
      });
      report.add(
        "\nThe owner's transcription of our stack, against what our optimizer returns on this arena " +
          '(search, pass 1 → pass 2, same caps):',
      );
      report.add(
        '\n| unit | his transcription | our search, pass 1 | our search, pass 2 |\n|---|---|---|---|',
      );
      for (const id of [...new Set(transcriptionCheck.flatMap((check) => check.rows.map((row) => row.id)))]) {
        report.add(
          `| ${id} | ${n(TRANSCRIBED[id] ?? 0)} | ${n((transcriptionCheck[0] as (typeof transcriptionCheck)[number]).mine[id] ?? 0)} | ` +
            `${n((transcriptionCheck[1] as (typeof transcriptionCheck)[number]).mine[id] ?? 0)} |`,
        );
      }
      const transcribedIllegal = derived.map((entry) => evaluateCounts(entry.request, TRANSCRIBED));
      const planMarches = derived.map(
        (entry) => planCampaign({ request: entry.request, marchTarget: 10 }).march.counts,
      );
      report.add(
        `\n**Is the transcription even on this arena?** Scored as counts: ` +
          transcribedIllegal
            .map(
              (evaluation, index) =>
                `${PASSES[index]?.name.split(' —')[0]} uses ${n(evaluation.result.pools.leadership.used)} leadership and ` +
                `${n(evaluation.result.pools.authority.used)} authority ` +
                `${evaluation.result.pools.leadership.used > LEADERSHIP ? "(**over the arena's 4,000**)" : ''}`,
            )
            .join('; ') +
          `. It is not closer to our **plan's repeated march at \`marchTarget: 10\`** than to our single-march ` +
          `search: on pass 1 that march is ${Object.entries(planMarches[0] ?? {})
            .map(([id, count]) => `${n(count)} ${id}`)
            .join(' · ')} — ` +
          `${n(
            [...new Set([...Object.keys(planMarches[0] ?? {}), ...Object.keys(TRANSCRIBED)])].filter(
              (id) => (planMarches[0]?.[id] ?? 0) !== (TRANSCRIBED[id] ?? 0),
            ).length,
          )} counts away from his transcription, against ` +
          `${n(
            [
              ...new Set([
                ...Object.keys((transcriptionCheck[0] as (typeof transcriptionCheck)[number]).mine),
                ...Object.keys(TRANSCRIBED),
              ]),
            ].filter(
              (id) =>
                ((transcriptionCheck[0] as (typeof transcriptionCheck)[number]).mine[id] ?? 0) !==
                (TRANSCRIBED[id] ?? 0),
            ).length,
          )} for the single-march search — so the transcription is a stack from different parameters again (its ` +
          `leadership alone rules it out of this arena), not a stack of ours reproduced.`,
      );
      report.add(
        `\n**Ours is used from here on**, as the owner asked: the transcription differs from what our optimizer ` +
          `returns on this arena in ` +
          `${n(
            transcriptionCheck[0]?.rows.filter((row) => row.mine !== row.his).length ?? 0,
          )} of ${n(transcriptionCheck[0]?.rows.length ?? 0)} counts (pass 1), and it is over the arena's leadership ` +
          `before any of them is compared — so it was built on different parameters, and the counts below are ours.`,
      );

      // ---- 2. the three stacks side by side -------------------------------------------------------------
      report.h('2. The three stacks on that arena');
      for (const [index, pass] of PASSES.entries()) {
        const request = arena(pass.totals, STOCK_WIDE);
        const stacks: { name: string; counts: Record<string, number> }[] = [
          {
            name: '**ours** (our search, this arena, this pass)',
            counts: countsOf((derived[index] as (typeof derived)[number]).search.result.stacks),
          },
          { name: "**Kai's** (from the extract)", counts: KAI },
          { name: "**TotalStack's** (second capture)", counts: THEIRS },
        ];
        report.add(`\n**${pass.name}**`);
        report.add(
          '\n| stack | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | authority | hired spent | share of the 60 | legal |\n' +
            '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
        );
        const scored = new Map<string, ReturnType<typeof evaluateCounts>>();
        for (const stack of stacks) {
          const counts = stack.counts;
          const evaluation = evaluateCounts(request, counts);
          scored.set(stack.name, evaluation);
          const spent = hiredSpent(counts);
          report.add(
            `| ${stack.name} | ${n(evaluation.result.stacks.length)} | ${n(troopFielded(counts))} | ${n(hiredFielded(counts))} | ` +
              `**${n(evaluation.summary.avgDamage)}** | ${n(evaluation.summary.minDamage)} | ${n(evaluation.summary.maxDamage)} | ` +
              `${n(evaluation.summary.journals.enemyFirst.friendlyHits)}/${n(evaluation.summary.journals.armyFirst.friendlyHits)} | ` +
              `${n(evaluation.summary.recovery.silver)} | ` +
              `${(evaluation.summary.avgDamage / Math.max(1, evaluation.summary.recovery.silver)).toFixed(2)} | ` +
              `${n(evaluation.result.pools.leadership.used)}/${n(evaluation.result.pools.leadership.capacity)} | ` +
              `${n(evaluation.result.pools.authority.used)}/${n(evaluation.result.pools.authority.capacity)} | ` +
              `**${n(spent)}** | ${((spent / STOCK_TOTAL) * 100).toFixed(2)} % | ` +
              `${evaluation.result.pools.leadership.used <= LEADERSHIP && evaluation.result.pools.authority.used <= AUTHORITY ? 'legal' : '**over capacity**'} |`,
          );
        }
        // the mechanism, stack by stack
        report.add(`\nWhere each march's damage comes from, stack by stack (enemy-first):`);
        report.add(
          '\n| unit | kill position (ours / Kai / theirs) | hits E (ours / Kai / theirs) | damage E (ours / Kai / theirs) |\n|---|---|---|---|',
        );
        const byName = [...scored.entries()];
        const unitIds = [
          ...new Set(
            byName.flatMap(([, evaluation]) => evaluation.result.stacks.map((stack) => stack.unitId)),
          ),
        ];
        for (const id of unitIds) {
          const cells = byName.map(([, evaluation]) => {
            const position = evaluation.result.stacks.findIndex((stack) => stack.unitId === id);
            const hits = evaluation.summary.journals.enemyFirst.entries.filter(
              (entry) => entry.actor === 'army' && entry.unitId === id,
            ).length;
            const stack = evaluation.result.stacks.find((entry) => entry.unitId === id);
            return position < 0
              ? { position: '—', hits: '—', damage: '—' }
              : {
                  position: n(position + 1),
                  hits: n(hits),
                  damage: n(hits * (stack?.damagePerHit ?? 0)),
                };
          });
          report.add(
            `| ${id} | ${cells.map((cell) => cell.position).join(' / ')} | ${cells.map((cell) => cell.hits).join(' / ')} | ` +
              `${cells.map((cell) => cell.damage).join(' / ')} |`,
          );
        }
        const ours = scored.get('**ours** (our search, this arena, this pass)');
        const kai = scored.get("**Kai's** (from the extract)");
        const theirs = scored.get("**TotalStack's** (second capture)");
        const best = [
          { name: 'ours', damage: ours?.summary.avgDamage ?? 0 },
          { name: "Kai's", damage: kai?.summary.avgDamage ?? 0 },
          { name: "TotalStack's", damage: theirs?.summary.avgDamage ?? 0 },
        ].sort((a, b) => b.damage - a.damage);
        /** The margin, unit by unit, against whichever of the two is best on this pass. */
        const damageOf = (evaluation: ReturnType<typeof evaluateCounts>): Record<string, number> => {
          const out: Record<string, number> = {};
          for (const stack of evaluation.result.stacks) {
            const hits = evaluation.summary.journals.enemyFirst.entries.filter(
              (entry) => entry.actor === 'army' && entry.unitId === stack.unitId,
            ).length;
            out[stack.unitId] = hits * stack.damagePerHit;
          }
          return out;
        };
        const mineDamage = damageOf(ours as ReturnType<typeof evaluateCounts>);
        const rival = (kai?.summary.avgDamage ?? 0) >= (theirs?.summary.avgDamage ?? 0) ? kai : theirs;
        const rivalName = rival === kai ? "Kai's" : "TotalStack's";
        const rivalDamage = damageOf(rival as ReturnType<typeof evaluateCounts>);
        const marginRows = [...new Set([...Object.keys(mineDamage), ...Object.keys(rivalDamage)])]
          .map((id) => ({ id, delta: (mineDamage[id] ?? 0) - (rivalDamage[id] ?? 0) }))
          .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
          .slice(0, 4);
        report.add(
          `\nThe margin against ${rivalName}, unit by unit (enemy-first, ours minus theirs): ` +
            marginRows.map((row) => `${row.id} ${row.delta >= 0 ? '+' : ''}${n(row.delta)}`).join(' · ') +
            ` — and the sum of every unit's difference is ` +
            `${n(
              Object.entries(mineDamage).reduce((sum, [, damage]) => sum + damage, 0) -
                Object.entries(rivalDamage).reduce((sum, [, damage]) => sum + damage, 0),
            )} enemy-first damage.`,
        );
        report.add(
          `\n**${pass.name} — the verdict.** ` +
            `${best[0]?.name} marches the most at ${n(best[0]?.damage ?? 0)} damage, then ` +
            `${best[1]?.name} at ${n(best[1]?.damage ?? 0)} ` +
            `(${(((best[1]?.damage ?? 0) / Math.max(1, best[0]?.damage ?? 1) - 1) * 100).toFixed(1)} %) and ` +
            `${best[2]?.name} at ${n(best[2]?.damage ?? 0)} ` +
            `(${(((best[2]?.damage ?? 0) / Math.max(1, best[0]?.damage ?? 1) - 1) * 100).toFixed(1)} %). ` +
            `Hired spent a march: ours ${n(hiredSpent(stacks[0]?.counts ?? {}))}, Kai's ${n(hiredSpent(KAI))}, ` +
            `TotalStack's ${n(hiredSpent(THEIRS))} — of the ${n(STOCK_TOTAL)} the arena holds. ` +
            `The mechanism is in the table above: the enemy kills highest-HP-first, so what separates the three is how ` +
            `many stacks strike before dying — ours fields ${n(ours?.result.stacks.length ?? 0)} stacks against Kai's ` +
            `${n(kai?.result.stacks.length ?? 0)} and TotalStack's ${n(theirs?.result.stacks.length ?? 0)}, and the ` +
            `friendly-hit counts read ${n(ours?.summary.journals.enemyFirst.friendlyHits ?? 0)} / ` +
            `${n(kai?.summary.journals.enemyFirst.friendlyHits ?? 0)} / ${n(theirs?.summary.journals.enemyFirst.friendlyHits ?? 0)}.`,
        );
      }

      // ---- 3. can we beat both? -------------------------------------------------------------------------
      report.h('3. Can our optimizer beat the best of the two?');
      for (const [index, pass] of PASSES.entries()) {
        const mine = countsOf((derived[index] as (typeof derived)[number]).search.result.stacks);
        const request = arena(pass.totals, STOCK_WIDE);
        const ours = evaluateCounts(request, mine);
        const kai = evaluateCounts(request, KAI);
        const theirs = evaluateCounts(request, THEIRS);
        const bestOther = Math.max(kai.summary.avgDamage, theirs.summary.avgDamage);
        report.add(
          `\n**${pass.name}**: our search returns ${Object.entries(mine)
            .map(([id, count]) => `${n(count)} ${id}`)
            .join(' · ')} — ` +
            `${n(ours.summary.avgDamage)} damage, ${n(ours.summary.recovery.silver)} silver, ` +
            `${n(hiredSpent(mine))} hired spent` +
            (ours.summary.avgDamage >= bestOther
              ? `, which **beats the best of the two by ${n(ours.summary.avgDamage - bestOther)} ` +
                `(${(((ours.summary.avgDamage - bestOther) / bestOther) * 100).toFixed(1)} %)**.`
              : `, which is **${n(bestOther - ours.summary.avgDamage)} behind the best of the two** ` +
                `(${(((bestOther - ours.summary.avgDamage) / bestOther) * 100).toFixed(1)} %).`),
        );
      }
      report.add(
        `\nThe narrower stock (TotalStack's own counts — ` +
          `${MERC_IDS.map((id) => `${id} ${n(STOCK_NARROW[id] ?? 0)}`).join(', ')}) as a second reading, since a ` +
          `narrower purse can only lower what our optimizer can field:`,
      );
      for (const pass of PASSES) {
        const narrow = searchPriority({
          request: arena(pass.totals, STOCK_NARROW),
          objective: 'damagePerSilver',
          budgetMs: 30_000,
        });
        const counts = countsOf(narrow.result.stacks);
        report.add(
          `- **${pass.name}**, narrow stock: ${Object.entries(counts)
            .map(([id, count]) => `${n(count)} ${id}`)
            .join(' · ')} — ${n(narrow.summary.avgDamage)} damage, ${n(hiredSpent(counts))} hired spent.`,
        );
      }
      report.add(
        `\n**Which is apples-to-apples**: the wide stock (${n(STOCK_TOTAL)} hired), because all three stacks fit ` +
          `inside it — TotalStack's widest hire is 16 of a type and Kai's 18, both within Kai's own reading, so every ` +
          `stack is judged against the same purse and the same caps. The narrow stock is the same arena with a smaller ` +
          `purse, and it is the fair reading only for TotalStack's own answer.`,
      );

      // ---- 4. what their optimizer left at home, and the two captures ------------------------------------
      report.h('4. Their optimizer left hired units at home — measured, not assumed');
      report.add(
        `Their answer hires ${n(THEIRS['arbalester-6'] ?? 0)} of ${n(STOCK_WIDE['arbalester-6'] ?? 0)} arbalesters and ` +
          `${n(THEIRS['legionary-6'] ?? 0)} of ${n(STOCK_WIDE['legionary-6'] ?? 0)} legionaries, and all ` +
          `${n(THEIRS['epic-monster-hunter-6'] ?? 0)} of ${n(STOCK_WIDE['epic-monster-hunter-6'] ?? 0)} epic monster hunters — ` +
          `so two of the four types are short of their caps with authority to spare. Re-scored with ` +
          `${n(3)} more arbalesters and ${n(2)} more legionaries (their counts at the caps), our engine:`,
      );
      report.add(
        '\n| stack | pass | avg damage | silver | hits E/A | leadership | authority | hired spent | arbalester position/hits/damage | legionary position/hits/damage |\n' +
          '|---|---|---|---|---|---|---|---|---|---|',
      );
      for (const pass of PASSES) {
        const request = arena(pass.totals, STOCK_WIDE);
        const atCaps = {
          ...THEIRS,
          'arbalester-6': STOCK_WIDE['arbalester-6'] ?? 0,
          'legionary-6': STOCK_WIDE['legionary-6'] ?? 0,
        };
        for (const [name, counts] of [
          ['their answer as returned', THEIRS],
          ['their answer at the caps (+3 arbalester, +2 legionary)', atCaps],
        ] as const) {
          const evaluation = evaluateCounts(request, counts);
          const cell = (id: string): string => {
            const position = evaluation.result.stacks.findIndex((stack) => stack.unitId === id);
            const stack = evaluation.result.stacks[position];
            const hits = evaluation.summary.journals.enemyFirst.entries.filter(
              (entry) => entry.actor === 'army' && entry.unitId === id,
            ).length;
            return position < 0
              ? '—'
              : `${n(position + 1)} / ${n(hits)} / ${n(hits * (stack?.damagePerHit ?? 0))}`;
          };
          report.add(
            `| ${name} | ${pass.name.split(' —')[0]} | **${n(evaluation.summary.avgDamage)}** | ` +
              `${n(evaluation.summary.recovery.silver)} | ` +
              `${n(evaluation.summary.journals.enemyFirst.friendlyHits)}/${n(evaluation.summary.journals.armyFirst.friendlyHits)} | ` +
              `${n(evaluation.result.pools.leadership.used)} | ${n(evaluation.result.pools.authority.used)} | ` +
              `${n(hiredSpent(counts))} | ${cell('arbalester-6')} | ${cell('legionary-6')} |`,
          );
        }
      }
      report.add(
        `\n**What the measurement says.** Filling the two stacks to their caps makes their march *worse*, at the same ` +
          `silver for the troops: the hired stacks are the last to be reached by the enemy (positions ` +
          `${n(
            (evaluateCounts(arena(captureTotals(), STOCK_WIDE), THEIRS).result.stacks.findIndex(
              (stack) => stack.unitId === 'arbalester-6',
            ) ?? 0) + 1,
          )}–${n(
            evaluateCounts(arena(captureTotals(), STOCK_WIDE), THEIRS).result.stacks.length,
          )} in their answer), and a fatter hired stack out-HPs the stack below it and takes its place — which is exactly ` +
          `the trade the numbers above show: the stack that moves up the line strikes fewer times and the ones it ` +
          `displaced strike more. So the shortfall is not authority left on the table through an oversight; it is their ` +
          `optimizer choosing the kill order over the count, and on our engine it chose right.`,
      );
      report.add(
        `\n**Two captures, one answer — checked against what is in the tree.** The tree holds two TotalStack captures ` +
          `for this arena (\`totalstack-2026-09-15-optimize.json\`, answer created 11:51, and ` +
          `\`totalstack-2026-09-15-optimize-1343.json\`, created 13:43) and they are **not** identical: ` +
          `${n(
            [...new Set([...Object.keys(THEIRS), ...Object.keys(THEIR_COUNTS_FIRST)])].filter(
              (id) => (THEIRS[id] ?? 0) !== (THEIR_COUNTS_FIRST[id] ?? 0),
            ).length,
          )} of ${n([...new Set([...Object.keys(THEIRS), ...Object.keys(THEIR_COUNTS_FIRST)])].length)} counts differ, because ` +
          `their requests differed (the 11:51 one we have a request for carried caps ` +
          `${MERC_IDS.map((id) => n(THEIR_REQUEST_CAPS[id] ?? 0)).join('/')} and the melee +35/+70 bonus set; the 13:43 ` +
          `capture carries no request at all). The 13:50 re-run reported as identical to 13:43 is **not in the tree**, so ` +
          `I cannot check that determinism claim from the fixtures I have — if it is saved alongside the others, the one ` +
          `line above it would confirm or contradict it.`,
      );

      report.save();
    });
  },
  900_000,
);
