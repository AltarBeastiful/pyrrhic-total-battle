/**
 * 110 — **where monsters stand in the march** (owner, 2026-09-19: *"fix why the monsters are not shielded in
 * the generated stack"*).
 *
 * The enemy wipes the **highest-HP living stack** first, so a rare stack standing at or above the lowest troop
 * stack is the enemy's first kill. S-87's `shelterUnder` (`src/engine/plan.ts`) lowers every *hired* stack of
 * every shape the plan offers to just under that line. This experiment asks whether monsters get the same.
 *
 * **Two kinds of unit answer to "monster" here**, and the difference is the whole finding:
 *
 *   - a **monster mercenary** — `kind === 'mercenary'` with `monster` among its tags
 *     (`src/data/tables/mercenaries.json`: Bear V, Cyclops V, Gargoyle V, Abomination VI … 28 of them). It is
 *     paid from the **authority** pool, exactly like a Legionary, and is what the owner's camps hold.
 *   - a **dominance monster** — `kind === 'monster'`, `pool === 'dominance'`
 *     (`src/data/tables/monsters.json`: 28 types, four a tier, tiers 3–9). This is what TotalStack means by
 *     `monsterMinTier` / `monsterMaxTier` and answers in `monsterCounts`, and what the profile's
 *     `troops.monsters` row unlocks. **His current camp holds none**, so this file builds one.
 *
 * For every army that holds either kind, and for each of them:
 *   (a) every stop the plan offers — the repeated march, its finale and, on the `all-in`, every march of the
 *       sequence — as the stacks in kill order with their total HP, and which hired or monster stack stands at
 *       or above the lowest troop stack;
 *   (b) every sizer method the Battle card offers (`src/ui/sections/battle/choices.ts`: **Tier ladder** =
 *       `elite`, **Troops first** = `ms`, and *Allow damage trades* = `ms` + `relaxedPreservation`), plus the
 *       two options that exist for exactly this question — *Monsters after troops* (`monstersLast`, on Tier
 *       ladder) and *Monsters after mercenaries* (`strictMercsAboveMonsters`, on Troops first).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/110-monster-shelter.test.ts`
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { getUnits } from '../../src/data';
import { planCampaign } from '../../src/engine';
import type { CampaignPlan } from '../../src/engine/plan';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest, UnitDef } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { newProfile } from '../../src/state/defaults';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';

import { EXPORT_2026_09_17, Report, evaluateCounts, n } from './harness';

// ---- who is a monster ---------------------------------------------------------------------------------------
/** A dominance monster: the `monsters.json` table, `pool === 'dominance'`. */
const isDominanceMonster = (unit: UnitDef): boolean => unit.pool === 'dominance';
/** A monster mercenary: hired from authority, carrying the `monster` tag. */
const isMonsterMerc = (unit: UnitDef): boolean =>
  unit.kind === 'mercenary' && (unit.keys ?? []).includes('monster');
const kindOf = (unit: UnitDef | undefined): string =>
  unit === undefined
    ? '?'
    : isDominanceMonster(unit)
      ? 'monster (dominance)'
      : isMonsterMerc(unit)
        ? 'monster merc (authority)'
        : unit.pool === 'authority'
          ? 'merc (authority)'
          : 'troop (leadership)';

// ---- the armies ---------------------------------------------------------------------------------------------
interface Camp {
  label: string;
  profile: Profile;
  setup: BattleSetup;
}

const setupOf = (
  profile: Profile,
  housing: { leadership: number; authority: number; dominance: number },
): BattleSetup => {
  const first = profile.setups[0];
  if (!first) throw new Error('no setup');
  return { ...first, housing };
};

/** A first-run account (Guardsmen I–III, Specialists I, no bonuses) with the hired types given. */
function firstRunCamp(
  label: string,
  hired: { id: string; cap: number | null }[],
  housing: { leadership: number; authority: number; dominance: number },
  monsters: { min: number; max: number } | null = null,
): Camp {
  const profile = newProfile('first run');
  profile.mercenaries.selected = hired;
  profile.troops.monsters = monsters;
  return { label, profile, setup: setupOf(profile, housing) };
}

/** The owner's live camp of 2026-09-18, read off his browser (`tools/theorycraft/106-shelter-live.test.ts`). */
function liveCamp(): Camp | null {
  if (!existsSync(EXPORT_2026_09_17)) return null;
  const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
  if (parsed.kind !== 'profile') return null;
  const profile = structuredClone(parsed.payload);
  profile.sources.captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  profile.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
  profile.mercenaries.selected = [
    { id: 'arbalester-6', cap: 485 },
    { id: 'legionary-6', cap: 1002 },
    { id: 'bear-5', cap: null },
  ];
  const first = profile.setups[0];
  if (!first) return null;
  return {
    label: 'the owner’s live camp of 2026-09-18 (ABT 485 · LGN 1 002 · Bear V **unlimited**, 4 975 / 2 180)',
    profile,
    setup: {
      ...first,
      active: { ...first.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
      housing: { leadership: 4_975, authority: 2_180, dominance: 0 },
    },
  };
}

function camps(): Camp[] {
  const out: Camp[] = [
    firstRunCamp('first-run army, Bear V ×1 (20 000 leadership)', [{ id: 'bear-5', cap: 1 }], {
      leadership: 20_000,
      authority: 40_000,
      dominance: 0,
    }),
    firstRunCamp('first-run army, Bear V ×2 (20 000 leadership)', [{ id: 'bear-5', cap: 2 }], {
      leadership: 20_000,
      authority: 40_000,
      dominance: 0,
    }),
    firstRunCamp('first-run army, Bear V ×10 (20 000 leadership)', [{ id: 'bear-5', cap: 10 }], {
      leadership: 20_000,
      authority: 40_000,
      dominance: 0,
    }),
    firstRunCamp(
      'synthetic camp — Bear V 6 · Cyclops V 6 capped, Gargoyle V **unlimited** (20 000 / 2 180)',
      [
        { id: 'bear-5', cap: 6 },
        { id: 'cyclops-5', cap: 6 },
        { id: 'gargoyle-5', cap: null },
      ],
      { leadership: 20_000, authority: 2_180, dominance: 0 },
    ),
    firstRunCamp(
      'synthetic camp — **dominance monsters** unlocked (tiers 3–5, 900 dominance) with EMH 83 · Bear V 6',
      [
        { id: 'epic-monster-hunter-6', cap: 83 },
        { id: 'bear-5', cap: 6 },
      ],
      { leadership: 20_000, authority: 2_180, dominance: 900 },
      { min: 3, max: 5 },
    ),
    firstRunCamp(
      'synthetic camp — **dominance monsters** at full pressure (tiers 3–7, 20 000 dominance) with EMH 83 · Bear V 6',
      [
        { id: 'epic-monster-hunter-6', cap: 83 },
        { id: 'bear-5', cap: 6 },
      ],
      { leadership: 20_000, authority: 2_180, dominance: 20_000 },
      { min: 3, max: 7 },
    ),
  ];
  const live = liveCamp();
  if (live) out.push(live);
  return out;
}

// ---- the reading --------------------------------------------------------------------------------------------
interface Row {
  id: string;
  count: number;
  hp: number;
  kind: string;
  rare: boolean;
}

/** One march's stacks in kill order (highest HP first), with the exposure reading. */
function march(
  base: StackRequest,
  counts: Record<string, number>,
): { rows: Row[]; floor: number; exposed: Row[]; damage: number; silver: number } {
  const byId = new Map(base.units.map((unit) => [unit.id, unit]));
  const evaluated = evaluateCounts(base, counts);
  const rows: Row[] = evaluated.result.stacks
    .map((stack) => {
      const unit = byId.get(stack.unitId);
      return {
        id: stack.unitId,
        count: stack.count,
        hp: stack.totalHp,
        kind: kindOf(unit),
        rare: (unit?.pool ?? 'leadership') !== 'leadership',
      };
    })
    .sort((a, b) => b.hp - a.hp);
  const troopHp = rows.filter((row) => !row.rare).map((row) => row.hp);
  const floor = troopHp.length > 0 ? Math.min(...troopHp) : 0;
  return {
    rows,
    floor,
    exposed: rows.filter((row) => row.rare && floor > 0 && row.hp >= floor),
    damage: evaluated.summary.minDamage,
    silver: evaluated.summary.recovery.silver,
  };
}

const line = (row: Row): string => `${row.id} ${n(row.count)} = ${n(row.hp)} HP (${row.kind})`;

function marchInto(
  report: Report,
  base: StackRequest,
  title: string,
  counts: Record<string, number>,
): number {
  const { rows, floor, exposed } = march(base, counts);
  report.add('');
  report.add(
    `**${title}** — lowest troop stack ${n(floor)} HP; **${exposed.length}** rare stack(s) at or above it` +
      `${exposed.length > 0 ? `: ${exposed.map(line).join(', ')}` : ''}`,
  );
  report.add('');
  report.add('| kill order | stack | count | total HP | what |');
  report.add('|---|---|---|---|---|');
  rows.forEach((row, index) =>
    report.add(
      `| ${index + 1} | ${row.id} | ${n(row.count)} | ${n(row.hp)} | ${row.kind}${row.rare && floor > 0 && row.hp >= floor ? ' — **EXPOSED**' : ''} |`,
    ),
  );
  return exposed.length;
}

/** The Battle card's methods, plus the two options that exist for the monster question. */
const SIZERS: {
  name: string;
  method: 'elite' | 'ms';
  relaxed?: boolean;
  monstersLast?: boolean;
  strict?: boolean;
}[] = [
  { name: 'Tier ladder (`elite`)', method: 'elite' },
  { name: 'Tier ladder + *Monsters after troops* (`monstersLast`)', method: 'elite', monstersLast: true },
  { name: 'Troops first (`ms`)', method: 'ms' },
  { name: 'Troops first + *Allow damage trades* (`msRelaxed`)', method: 'ms', relaxed: true },
  {
    name: 'Troops first + *Monsters after mercenaries* (`strictMercsAboveMonsters`)',
    method: 'ms',
    strict: true,
  },
];

describe.skipIf(!process.env.THEORY)('110 — where monsters stand in the march', () => {
  it('lists every stop and every sizer method, in kill order', () => {
    const report = new Report('110-monster-shelter');
    const units = getUnits();
    report.add(
      '# 110 — where monsters stand in the generated stack\n\n' +
        'The enemy wipes the highest-HP living stack first, so a stack of a rare resource at or above the ' +
        'lowest **troop** stack is the enemy’s first kill. A row marked **EXPOSED** is one of those.\n\n' +
        'A *monster mercenary* is a `mercenary` tagged `monster` (Bear V, Cyclops V, Gargoyle V …), paid from ' +
        'the **authority** pool. A *dominance monster* is the `monsters.json` table, `pool === "dominance"` — ' +
        'TotalStack’s `monsterMinTier`/`monsterMaxTier` units. The owner’s camps hold only the first kind, so ' +
        'the second is measured on a synthetic camp built here.',
    );
    report.add(
      `\nThe data knows ${n(units.filter(isDominanceMonster).length)} dominance monsters (tiers ` +
        `${n(Math.min(...units.filter(isDominanceMonster).map((unit) => unit.tier)))}–` +
        `${n(Math.max(...units.filter(isDominanceMonster).map((unit) => unit.tier)))}) and ` +
        `${n(units.filter(isMonsterMerc).length)} monster mercenaries.`,
    );

    const summary: string[] = [];
    for (const camp of camps()) {
      const base = buildStackRequest(camp.profile, camp.setup);
      const held = base.units.filter((unit) => isDominanceMonster(unit) || isMonsterMerc(unit));
      report.h(camp.label);
      report.add(
        `Monster types in the army: ${held.length === 0 ? '**none**' : held.map((unit) => `${unit.id} (${kindOf(unit)})`).join(', ')}. ` +
          `Housing L ${n(base.housing.leadership)} · A ${n(base.housing.authority)} · D ${n(base.housing.dominance)}.`,
      );

      // ---- (a) the plan -------------------------------------------------------------------------------------
      let plan: CampaignPlan | string;
      try {
        plan = planCampaign(buildPlanRequest(camp.profile, camp.setup));
      } catch (error) {
        plan = error instanceof Error ? error.message : String(error);
      }
      report.h(`${camp.label} — (a) the plan’s stops`);
      if (typeof plan === 'string') {
        report.add(`The plan refuses this army: *${plan}*`);
      } else {
        const monsterIds = new Set(held.map((unit) => unit.id));
        const dominanceIds = new Set(base.units.filter(isDominanceMonster).map((unit) => unit.id));
        let exposedStops = 0;
        let fieldedMonsters = 0;
        let fieldedDominance = 0;
        for (const stop of plan.alternatives) {
          report.add(
            `\n### ${stop.pick} (${stop.shape}) — ${stop.marches} marches, ${stop.repeat.mercLost} burned`,
          );
          const marches: [string, Record<string, number>][] = stop.sequence
            ? stop.sequence.map((counts, index) => [`march ${index + 1} of the sequence`, counts])
            : [['the repeated march', stop.counts]];
          if (stop.finaleCounts) marches.push(['the finale', stop.finaleCounts]);
          if (stop.tail) marches.push([`the troops-only tail (×${stop.tail.marches})`, stop.tail.counts]);
          for (const [title, counts] of marches) {
            exposedStops += marchInto(report, base, title, counts) > 0 ? 1 : 0;
            for (const id of Object.keys(counts)) {
              if ((counts[id] ?? 0) <= 0) continue;
              if (monsterIds.has(id)) fieldedMonsters += 1;
              if (dominanceIds.has(id)) fieldedDominance += 1;
            }
          }
        }
        report.add(
          `\nOver every march of every stop: **${exposedStops}** march(es) with a rare stack at or above the ` +
            `lowest troop stack; **${fieldedMonsters}** monster stack(s) fielded, of which **${fieldedDominance}** ` +
            `from the dominance pool (the army holds ${dominanceIds.size} dominance type(s), housing ` +
            `${n(base.housing.dominance)}).`,
        );
        summary.push(
          `| ${camp.label} | plan | ${plan.alternatives.length} stops | ${exposedStops} march(es) with an exposed rare stack | ` +
            `monster stacks fielded: ${fieldedMonsters}${dominanceIds.size > 0 ? ` (dominance: ${fieldedDominance} of ${dominanceIds.size} types held)` : ''} |`,
        );
      }

      // ---- (b) the sizers -----------------------------------------------------------------------------------
      report.h(`${camp.label} — (b) the Battle card’s sizer methods`);
      for (const sizer of SIZERS) {
        const sized = sizeStacks({
          ...base,
          options: {
            ...base.options,
            method: sizer.method,
            relaxedPreservation: sizer.relaxed === true,
            monstersLast: sizer.monstersLast === true,
            strictMercsAboveMonsters: sizer.strict === true,
          },
        });
        const counts: Record<string, number> = {};
        for (const stack of sized.stacks) if (stack.count > 0) counts[stack.unitId] = stack.count;
        const exposed = marchInto(report, base, sizer.name, counts);
        const monsterCount = Object.keys(counts).filter((id) => held.some((unit) => unit.id === id)).length;
        summary.push(
          `| ${camp.label} | ${sizer.name} | — | ${exposed} exposed stack(s) | monster stacks fielded: ${monsterCount} |`,
        );
      }
    }

    report.h('Summary — every army, every method');
    report.add('| army | method | stops | exposure | monsters |');
    report.add('|---|---|---|---|---|');
    for (const row of summary) report.add(row);

    report.h('What this shows');
    report.add(
      [
        '### 1. On the plan side, monsters are not *unshielded* — they are **absent**',
        '',
        'On the camp that holds 20 dominance types and 20 000 dominance housing, every sizer method fields 17',
        'to 21 monster stacks and **the plan fields none**: `dominance: 0 of 20 types held`, on all three stops,',
        'on every march of every stop, finale and tail included. The same on the 900-dominance camp (`0 of 12`).',
        'So no plan stop can expose a monster, and `shelterUnder` is never reached with one.',
        '',
        'Why (`src/engine/plan.ts`, every line pool-typed to `authority`):',
        '',
        '| line | code | effect |',
        '|---|---|---|',
        "| `planCampaign` | `const mercTypes = table.filter((entry) => entry.pool === 'authority')` | the hired set the search sweeps holds no dominance type, so no monster count is ever a candidate |",
        "| `planCampaign`, `unlimited` | `unit.pool === 'authority' && request.caps[unit.id] === undefined` | a monster has no `caps` entry either (caps come from `profile.mercenaries.selected`), so even widened it would read as a stock of nothing unless the pool bounds it |",
        "| `sizer` | `units: request.units.filter((unit) => unit.pool === 'leadership' ? (prefix?.has(unit.id) ?? true) : fieldedIds.has(unit.id))` | `fieldedIds` is built from the mercenary vector, so **every dominance unit is filtered out of the request handed to `sizeStacks`** — this is the line that drops them |",
        "| `sizer`, `finaleFor`, `putBackOn` | `shelterUnder(rungs, stacks.filter((stack) => stack.entry.pool === 'authority'))` | the shelter is applied to the authority pool by construction; `shelterUnder` itself is pool-agnostic and correct |",
        '| `putBackOn` | `const keep = new Set([extra.id, ...fielded, ...mercIds])` | same drop, on the put-back pass |',
        "| `marchOf` | `if (entry.pool === 'authority') { mercLost += chunks(...); gold += reviveOne(...) } else { silver += retrainOne(...) }` | a dominance stack would be billed as a **troop retrain**: no `mercLost`, no revive gold, no dragon coins — i.e. free on the burn axis the whole bar is ordered by |",
        '',
        '### 2. The fix, precisely (not applied here — `plan.ts` is another worker’s file)',
        '',
        'The shelter is one word; the rest is what has to come with it.',
        '',
        '1. **`marchOf` first**, or the search will field monsters for free and the bar will rank on a lie.',
        '   Make the branch three-way: `leadership` → `retrainOne(...).silver` as now; `authority` → as now;',
        '   `dominance` → `retrainOne(...)` (which already bills by chunk, adds `reviveOne`’s gold and the',
        "   dragon coins — `src/engine/recovery.ts`, `byChunk = unit.pool !== 'leadership'`) and `chunks(count)`",
        '   into a burn figure. Either fold it into `mercLost` (one rare-stock axis, the bar unchanged) or add a',
        '   `monsterLost` beside it; the first is the smaller change and matches what the bar means by “burned”.',
        "2. **`mercTypes`** → `table.filter((entry) => entry.pool !== 'leadership')`, and **`unlimited`** →",
        "   `unit.pool !== 'leadership' && request.caps[unit.id] === undefined`, with the stock line reading",
        '   `request.housing[entry.unit.pool]` instead of `request.housing.authority` so an uncapped monster is',
        '   bounded by the dominance pool exactly as an uncapped mercenary is bounded by authority. Every monster',
        '   is uncapped today, since `buildUnits` writes `caps` only for selected mercenaries.',
        "3. **The three `shelterUnder` filters** → `stack.entry.pool !== 'leadership'`. That is the rule S-87",
        '   already states — *the enemy wipes the highest-HP living stack first* — which knows nothing about',
        '   pools. With 1 and 2 done this is what actually shields the monsters.',
        '4. **`putBackOn`’s `keep`/`mercIds`** and `shapeScorer`’s own `mercTypes` take the same widening.',
        "5. **A guard**: `tests/engine/plan-criteria.test.ts` asserts the shelter over `pool === 'authority'`",
        "   stacks only; widened to `pool !== 'leadership'` it would have caught this. (That file is owned by",
        '   another worker right now — flagged, not edited.)',
        '',
        'If the owner wants only the shelter and not the fielding, step 3 alone is correct and has **no effect**:',
        'the monsters never reach it. The defect he is looking at is an absence, not a missing clamp.',
        '',
        '### 3. On the sizer side (Battle card) the monsters *are* exposed — and that copies TotalStack',
        '',
        'Report only, per the brief. `sizeStacks` (`src/engine/stacker.ts`) gives the dominance pool a ceiling',
        "only under three conditions: `method === 'ms'`, or `options.monstersLast`, or",
        '`ms` + `strictMercsAboveMonsters`. So:',
        '',
        '- **Tier ladder** (`elite`, the card’s default) with monsters at full pressure: **21 exposed stacks** —',
        '  all 20 dominance types between 3 600 000 and 4 662 600 HP over a 449 280 HP troop floor, plus the',
        '  hunters. This is the picture behind *“the monsters are not shielded in the generated stack”*.',
        '- **Tier ladder + *Monsters after troops*** (`monstersLast`): 21 → **1** (the hunters, a mercenary —',
        '  Elite never shelters those). The option works, and it is off by default (`src/state/defaults.ts`:',
        '  *“not what the captured run does, so it is off”*).',
        '- **Troops first** (`ms`) and **+ *Monsters after mercenaries***: **0** exposed on every army here.',
        '- **Allow damage trades** (`msRelaxed`) re-exposes them: `relaxPreservation` grows every',
        '  **non-leadership** slot, dominance included — 4 dragons/giants at 840 000–930 000 HP over the same',
        '  449 280 floor, and on the owner’s live camp of 2026-09-18 it puts **bear-5 3 = 283 140 HP** over a',
        '  274 772 HP floor. The card warns about this in words (*“Let a hired stack grow past your smallest',
        "  troop stack”*) and `sizeStacks` raises the warning only for `pool !== 'leadership'` stacks, so the",
        '  monster case is covered by the same sentence.',
        '',
        '### 4. A naming trap worth telling him about',
        '',
        'Bear V, Cyclops V and Gargoyle V are **mercenaries** tagged `monster`, paid from authority. *Monsters',
        'after troops* does nothing for them — it clamps the dominance pool only — which is why the synthetic',
        'monster-mercenary camp reads **2 exposed** under both Tier ladder and Tier ladder + *Monsters after',
        'troops* (gargoyle-5 94 = 5 358 000 HP, cyclops-5 6 = 810 000 HP), and why the owner’s live camp reads',
        '**3 exposed** under both (bear-5 58 = 5 474 040, legionary-6 477 = 5 464 989, arbalester-6 485 =',
        '4 423 200). This is exactly TotalStack’s own split — its `mercenaryCaps` holds `bear-5` and `cyclops-5`',
        'while `monsterCounts` is a separate map fed by `monsterMinTier`/`monsterMaxTier` — so it is parity, not',
        'a bug. On the plan side it is also why the bear armies above read **0 exposed**: bears are hired units,',
        'and `shelterUnder` has covered every hired type since S-87.',
      ].join('\n'),
    );
    report.save();
  }, 600_000);
});
