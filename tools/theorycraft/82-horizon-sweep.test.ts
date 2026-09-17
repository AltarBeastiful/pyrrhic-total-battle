/**
 * 82 — does the number of marches change the march? (owner, 2026-09-15: *"lets draw the graph of each marker
 * (total damage, damage/silver, damage/merc spent) depending on the number of marches we try to compute. my
 * guess is that total stack and for sure kais only try to compute one march. So I'm trying to see if the
 * number of march should vary or if it has any impact at all on our improved stacking."*)
 *
 * The app plans over a horizon (`CAMPAIGN.marches`, 10). This sweeps it from **1 to 30** and measures what a
 * march is worth at each, with the **real battle** (`simulateBattle` through `evaluateCounts`), so the three
 * columns the owner named are the game's own numbers rather than the planner's arithmetic.
 *
 * Every row is scored on **one arena** — the one experiment 77 built for the three-stack comparison, because
 * that is the only arena on which Kai's and TotalStack's stacks are legal: the query's own eight troop types,
 * leadership 4 000, and the hired purse the three stacks fit inside (EMH 16 · arbalesters 18 · legionaries 18 ·
 * chariots 8 = 60). A row's figures are comparable with any other row's.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/82-horizon-sweep.test.ts`
 * Writes `out/82-horizon-sweep.md` and `out/82-horizon-sweep.csv`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { getUnits, unitById } from '../../src/data';
import { planCampaign } from '../../src/engine/plan';
import { searchPriority } from '../../src/engine/search';
import { chunks } from '../../src/engine/recovery';
import type { BonusTotals, StackRequest, UnitDef } from '../../src/engine/types';
import { OUT_DIR, Report, evaluateCounts, kaiReportTotals, n } from './harness';

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

const LEADERSHIP = 4_000;
const AUTHORITY = 2_000;
const MAX_HORIZON = 30;
const MERC_IDS = ['epic-monster-hunter-6', 'arbalester-6', 'legionary-6', 'chariot-6'] as const;
/** Kai's widest legal reading of the hired purse; TotalStack's counts fit inside it (experiment 77). */
const STOCK: Record<string, number> = {
  'epic-monster-hunter-6': 16,
  'arbalester-6': 18,
  'legionary-6': 18,
  'chariot-6': 8,
};

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

function arena(totals: BonusTotals): StackRequest {
  return {
    units: [...arenaTroops(), ...MERC_IDS.map((id) => unitById(id) as UnitDef)],
    caps: { ...STOCK },
    housing: { leadership: LEADERSHIP, authority: AUTHORITY, dominance: 0 },
    totals,
    options: {
      method: 'ms',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: true,
    },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

/** Kai's stack, from the fixture's own lines: name + tier → our unit id (the same reading experiment 77 used). */
const KAI: Record<string, number> = (() => {
  const raw = JSON.parse(readFileSync(KAI_FIXTURE, 'utf8')) as {
    payload: { army: { name: string; tier: number; count: number }[] };
  };
  const ids = getUnits();
  const base = (name: string): string =>
    name
      .replace(/[^a-z]/gi, '')
      .toLowerCase()
      .replace(/(viii|vii|iii|ii|ix|iv|vi|v|i)$/, '');
  const out: Record<string, number> = {};
  for (const stack of raw.payload.army) {
    const id = ids.find((unit) => unit.tier === stack.tier && base(unit.name) === base(stack.name))?.id;
    if (id === undefined) throw new Error(`kai extract: no unit for ${stack.name} t${stack.tier}`);
    out[id] = stack.count;
  }
  return out;
})();

/** TotalStack's counts, from the capture's answer. */
const THEIRS: Record<string, number> = (() => {
  const raw = JSON.parse(readFileSync(THEIR_FIXTURE, 'utf8')) as {
    response: {
      calculation: { troopCounts: Record<string, number>; mercenaryCounts: Record<string, number> };
    };
  };
  return { ...raw.response.calculation.troopCounts, ...raw.response.calculation.mercenaryCounts };
})();

/** A horizontal bar, so the shape of each marker is readable without leaving the terminal. */
function bars(values: number[], width = 46, label = ''): string[] {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  return values.map((value, index) => {
    const filled = Math.max(1, Math.round(((value - min) / span) * width));
    const marker = value === max ? ' ◀ max' : value === min ? ' ◀ min' : '';
    return `| ${String(index + 1).padStart(2)} | ${'█'.repeat(filled)}${'·'.repeat(width - filled)} | ${label}${n(value)}${marker}`;
  });
}

const csv = (rows: string[][]): string => `${rows.map((row) => row.join(',')).join('\n')}\n`;

describe.skipIf(!process.env.THEORY)('the horizon sweep', () => {
  it('measures what a march is worth at every horizon from 1 to 30', () => {
    const report = new Report('82-horizon-sweep');
    const base = arena(kaiReportTotals());

    interface Row {
      method: string;
      counts: Record<string, number>;
      damage: number;
      silver: number;
      hired: number;
      hiredLost: number;
      stacks: number;
      strikes: number;
      total: number | null;
      /** The marches the plan actually plays — a target of 1 plays two, so the label is not the truth. */
      played: number | null;
    }
    const measure = (
      method: string,
      counts: Record<string, number>,
      total: number | null,
      played: number | null = null,
    ): Row => {
      const { result, summary } = evaluateCounts(base, counts);
      const hired = MERC_IDS.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
      const hiredLost = MERC_IDS.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
      return {
        method,
        played,
        counts,
        damage: summary.avgDamage,
        silver: summary.recovery.silver,
        hired,
        hiredLost,
        stacks: result.stacks.length,
        strikes: summary.journals.enemyFirst.friendlyHits,
        total,
      };
    };

    report.h('The arena, and what is measured');
    report.add(
      `**One arena for every row**, so the columns compare: the query's own eight troop types, leadership ` +
        `${n(LEADERSHIP)} / authority ${n(AUTHORITY)}, hired stock ` +
        `${MERC_IDS.map((id) => `${id.replace('-6', '')} ${n(STOCK[id] ?? 0)}`).join(' · ')} (${n(
          Object.values(STOCK).reduce((sum, held) => sum + held, 0),
        )} units), enemy 1·1·1·1, temple 0, retrain. Kai's and TotalStack's stacks are legal here — that is ` +
        `what the arena was built for (experiment 77).\n\nEvery figure is the **real battle** ` +
        `(\`evaluateCounts\` → \`simulateBattle\`), never the planner's arithmetic.`,
    );

    // ---- the sweep ----------------------------------------------------------------------------------
    const swept: Row[] = [];
    const refused: number[] = [];
    for (let horizon = 1; horizon <= MAX_HORIZON; horizon += 1) {
      try {
        const plan = planCampaign({ request: base, marchTarget: horizon });
        const chosen = plan.recommend ?? plan;
        swept.push(
          measure(
            `ours · ${n(horizon)} march${horizon === 1 ? '' : 'es'} asked`,
            chosen.counts,
            chosen.totalDamage,
            chosen.marches,
          ),
        );
      } catch (error) {
        // A horizon the purse cannot sustain has **no plan at all**: fielding n loses `ceil(n/10)` for good,
        // so past a point no count of a 60-unit stock survives the horizon and the search has nothing to
        // score. That is a finding, not a crash — it is reported as its own line.
        if (!(error instanceof Error) || !error.message.includes('no feasible plan')) throw error;
        refused.push(horizon);
      }
    }

    // ---- the references -----------------------------------------------------------------------------
    const search = searchPriority({ request: base, objective: 'damagePerSilver', budgetMs: 30_000 });
    const searchCounts: Record<string, number> = {};
    for (const stack of search.result.stacks) searchCounts[stack.unitId] = stack.count;
    const references = [
      measure('Kai’s stack (from the extract)', KAI, null),
      measure('TotalStack’s stack (from the capture)', THEIRS, null),
      measure('ours · one march, priority search', searchCounts, null),
    ];

    const head =
      `| method | ${MERC_IDS.map((id) => id.replace('-6', '')).join(' | ')} | stacks | strikes | marches played | damage a march | silver a march | hired a march | hired lost | damage a silver | damage a hired | campaign total |\n` +
      `|${'---|'.repeat(14)}\n`;
    const line = (row: Row): string =>
      `| ${row.method} | ${MERC_IDS.map((id) => {
        const count = row.counts[id] ?? 0;
        return count === 0 ? '**0**' : n(count);
      }).join(
        ' | ',
      )} | ${n(row.stacks)} | ${n(row.strikes)} | ${row.played === null ? '—' : n(row.played)} | **${n(row.damage)}** | ${n(row.silver)} | ` +
      `${n(row.hired)} | ${n(row.hiredLost)} | ${(row.damage / Math.max(1, row.silver)).toFixed(2)} | ` +
      `${(row.damage / Math.max(1, row.hired)).toFixed(0)} | ${row.total === null ? '—' : n(row.total)} |`;

    report.h('The references, on this arena');
    report.add(head + references.map(line).join('\n'));
    report.add(
      `\nKai's and TotalStack's tools compute **one march** — that is the point of the comparison: their row is ` +
        `a single march's counts with no horizon in it.`,
    );

    report.h(`Our plan at every horizon, 1 to ${n(MAX_HORIZON)} marches`);
    report.add(head + swept.map(line).join('\n'));
    if (refused.length > 0) {
      report.add(
        `\n**${n(refused.length)} of the ${n(MAX_HORIZON)} horizons have no plan at all**: ` +
          `${refused.map((horizon) => n(horizon)).join(', ')}. The hired purse is ${n(
            Object.values(STOCK).reduce((sum, held) => sum + held, 0),
          )} units and a fielded stack loses \`ceil(n/10)\` **for good**, so past a point no count of any type ` +
          `survives the horizon and the search has nothing to score — the engine says so rather than answering ` +
          `with a plan it cannot repeat.`,
      );
    }

    // ---- the graphs ---------------------------------------------------------------------------------
    for (const [label, pick] of [
      ['Total damage a march', (row: Row): number => row.damage],
      ['Damage a silver', (row: Row): number => row.damage / Math.max(1, row.silver)],
      ['Damage a hired unit', (row: Row): number => row.damage / Math.max(1, row.hired)],
    ] as const) {
      report.h(`Graph — ${label}, against the horizon`);
      report.add(`\n\`\`\`\n${bars(swept.map(pick), 46, '').join('\n')}\n\`\`\``);
    }
    report.add(
      `\nThe horizon is on the vertical axis's left (1 to ${n(MAX_HORIZON)}); each row is one horizon's march, ` +
        `drawn to scale between that marker's own minimum and maximum. The **references are not on these ` +
        `graphs** — they have no horizon, which is the question being asked.`,
    );

    // ---- what the sweep says ------------------------------------------------------------------------
    const best = (pick: (row: Row) => number): Row => swept.reduce((a, b) => (pick(b) > pick(a) ? b : a));
    const worst = (pick: (row: Row) => number): Row => swept.reduce((a, b) => (pick(b) < pick(a) ? b : a));
    const spread = (pick: (row: Row) => number): string => {
      const hi = pick(best(pick));
      const lo = pick(worst(pick));
      return `${(((hi - lo) / Math.max(1, lo)) * 100).toFixed(1)} %`;
    };
    report.h('What the sweep says');
    report.add(
      `- **Damage a march** runs from ${n(worst((r) => r.damage).damage)} (${worst((r) => r.damage).method}) … ` +
        `to **${n(best((r) => r.damage).damage)}** (${best((r) => r.damage).method}) — a spread of ${spread((r) => r.damage)}.`,
    );
    report.add(
      `- **Damage a silver** best at ${(best((r) => r.damage / Math.max(1, r.silver)).damage / best((r) => r.damage / Math.max(1, r.silver)).silver).toFixed(2)} ` +
        `(${best((r) => r.damage / Math.max(1, r.silver)).method}), worst at ` +
        `${(worst((r) => r.damage / Math.max(1, r.silver)).damage / Math.max(1, worst((r) => r.damage / Math.max(1, r.silver)).silver)).toFixed(2)} ` +
        `(${worst((r) => r.damage / Math.max(1, r.silver)).method}) — a spread of ${spread((r) => r.damage / Math.max(1, r.silver))}.`,
    );
    report.add(
      `- **Damage a hired unit** best at ${Math.round(best((r) => r.damage / Math.max(1, r.hired)).damage / Math.max(1, best((r) => r.damage / Math.max(1, r.hired)).hired))} ` +
        `(${best((r) => r.damage / Math.max(1, r.hired)).method}), worst at ` +
        `${Math.round(worst((r) => r.damage / Math.max(1, r.hired)).damage / Math.max(1, worst((r) => r.damage / Math.max(1, r.hired)).hired))} ` +
        `(${worst((r) => r.damage / Math.max(1, r.hired)).method}) — a spread of ${spread((r) => r.damage / Math.max(1, r.hired))}.`,
    );
    report.add(
      `\n- The plan's own **campaign total** peaks at ${n(Math.max(...swept.map((row) => row.total ?? 0)))} ` +
        `(${swept.reduce((a, b) => ((b.total ?? 0) > (a.total ?? 0) ? b : a)).method}) — that is a fact about ` +
        `totals, not about a march, which is why it is the last column and not a graph.`,
    );

    report.save();

    const rows: string[][] = [
      [
        'method',
        ...MERC_IDS,
        'stacks',
        'strikes',
        'marches_played',
        'damage_a_march',
        'silver_a_march',
        'hired_a_march',
        'hired_lost',
        'damage_per_silver',
        'damage_per_hired',
        'campaign_total',
      ],
      ...[...references, ...swept].map((row) => [
        row.method.replace(/[’]/g, "'"),
        ...MERC_IDS.map((id) => String(row.counts[id] ?? 0)),
        String(row.stacks),
        String(row.strikes),
        row.played === null ? '' : String(row.played),
        String(Math.round(row.damage)),
        String(Math.round(row.silver)),
        String(row.hired),
        String(row.hiredLost),
        (row.damage / Math.max(1, row.silver)).toFixed(4),
        (row.damage / Math.max(1, row.hired)).toFixed(2),
        row.total === null ? '' : String(Math.round(row.total)),
      ]),
    ];
    writeFileSync(new URL('82-horizon-sweep.csv', OUT_DIR), csv(rows));
  }, 1_800_000);
});
