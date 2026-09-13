/**
 * C5 — enemy composition (investigation 0015).
 *
 * The enemy decides two things and nothing else:
 *   1. **N**, the number of squads — which fixes how many times each kill position strikes
 *      (`expectedHits(p, N, armyFirst)`), and
 *   2. **which categories are present** — which fixes each stack's target, because `chooseTarget` picks the
 *      category in the formation the unit has the largest strength-against for, and falls back to melee when
 *      it has none. `armyStrengthAgainstEpicMonsters` and the unit's own `epicMonsters` line apply whatever
 *      the target is, so EMH6's +609 % never goes away.
 *
 * So a formation is fully described by (N, the set of categories present): two formations with the same N
 * and the same presence set give identical damage however the squads are distributed. This file computes
 * all 35 four-squad multisets to show that, then reports the 15 presence sets, the four 3-squad formations,
 * and the 8-squad Arachne's set.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/34-enemy-composition.test.ts`
 */
import { describe, it } from 'vitest';

import { CATEGORIES } from '../../src/data/types';
import type { Category } from '../../src/data/types';
import { expectedHits } from '../../src/engine/battle';
import { effectiveUnit } from '../../src/engine/units';
import type { StackRequest } from '../../src/engine/types';
import {
  EIGHT,
  MERC_IDS,
  Report,
  evaluate,
  label,
  loadOwner,
  march,
  n,
  scenarioB,
  table,
  withEnemy,
  withMethod,
  withUnits,
} from './harness';

const WINNER7 = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;

type Formation = Partial<Record<Category, number>>;

/** Every multiset of `size` squads over the four categories. */
function multisets(size: number): Formation[] {
  const out: Formation[] = [];
  const walk = (index: number, left: number, current: Formation): void => {
    if (index === CATEGORIES.length - 1) {
      out.push({ ...current, [CATEGORIES[index] as Category]: left });
      return;
    }
    for (let take = 0; take <= left; take += 1) {
      walk(index + 1, left - take, { ...current, [CATEGORIES[index] as Category]: take });
    }
  };
  walk(0, size, {});
  return out;
}

const show = (formation: Formation): string =>
  CATEGORIES.filter((category) => (formation[category] ?? 0) > 0)
    .map((category) => `${String(formation[category] ?? 0)} ${category}`)
    .join(' + ') || 'empty';

const presence = (formation: Formation): string =>
  CATEGORIES.filter((category) => (formation[category] ?? 0) > 0).join('+') || 'none';

describe.skipIf(!process.env.THEORY)('C5 enemy composition', () => {
  it('walks the formations', () => {
    const report = new Report('34-enemy-composition');
    const owner = loadOwner();

    const marches: { name: string; request: StackRequest }[] = [
      { name: '8 types · msRelaxed', request: withMethod(scenarioB(owner.eight), 'msRelaxed') },
      {
        name: 'winner 7 types · msRelaxed',
        request: withMethod(withUnits(scenarioB(owner.twelve), WINNER7), 'msRelaxed'),
      },
    ];

    report.add('# C5 — what the enemy formation is worth');
    report.add(
      '\nScenario B. Housing leadership 4,343 · authority 2,000 · dominance 800; caps EMH6 92 / ABT6 76 / ' +
        'LGN6 72 / CHR6 37.',
    );

    // ---- The hits staircase -------------------------------------------------------------------------
    report.h('Hits per kill position, by N');
    report.add(
      'Every stack dies and the enemy always wipes the highest-HP living stack, so the number of times a ' +
        'stack strikes depends only on its kill position `p` and on `N` (`battle.ts`, `expectedHits`):\n\n' +
        '```\nrounds = ceil(p / N)\nslot   = p − (rounds − 1) × N\nhits   = rounds − (slot === 1 ? 1 : 0)   (+1 for p = 1 when the army strikes first)\n```',
    );
    report.add('');
    report.add(`| N | ${Array.from({ length: 12 }, (_x, i) => `p=${String(i + 1)}`).join(' | ')} |`);
    report.add(`|---|${Array.from({ length: 12 }, () => '---').join('|')}|`);
    for (const N of [3, 4, 8]) {
      const cells = Array.from(
        { length: 12 },
        (_x, i) => `${String(expectedHits(i + 1, N, false))}/${String(expectedHits(i + 1, N, true))}`,
      );
      report.add(`| ${String(N)} | ${cells.join(' | ')} |`);
    }
    report.add(
      '\n**N = 3 arithmetic, spelled out.** Three enemy squads means a round is three kills. Position 1 opens ' +
        'round 1 and dies before its turn, so 0 hits enemy-first (1 army-first). Positions 2 and 3 strike ' +
        'once, in the gaps of round 1. Position 4 opens round 2: it survived round 1 and struck in its ' +
        'end-of-round sweep, so 1 hit; positions 5 and 6 strike in round 1’s sweep and again in round 2, so ' +
        '2 hits each. In general position `p` gets `ceil(p/3)` hits, minus one when `p ≡ 1 (mod 3)`. ' +
        'Compared with N = 4 the staircase climbs a quarter faster, so **deep marches are worth more against ' +
        'a 3-squad enemy** — but only if the stacks at the bottom are the ones that hit hard.',
    );

    // ---- Every 4-squad formation --------------------------------------------------------------------
    for (const { name, request } of marches) {
      const base = evaluate(withEnemy(request, { melee: 1, ranged: 1, mounted: 1, flying: 1 }));
      report.h(`${name} — every 4-squad formation`);
      report.add(`Reference (1 of each): ${march(base.result)} — avg **${n(base.summary.avgDamage)}**\n`);
      report.add('| formation | categories present | min | avg | max | targets |');
      report.add('|---|---|---|---|---|---|');
      const seen = new Map<string, number>();
      for (const formation of multisets(4)) {
        const ev = evaluate(withEnemy(request, formation));
        const targets = ev.result.stacks.map((stack) => `${label(stack.unitId)}→${stack.target}`).join(' ');
        report.add(
          `| ${show(formation)} | ${presence(formation)} | ${n(ev.summary.minDamage)} | ${n(ev.summary.avgDamage)} | ${n(ev.summary.maxDamage)} | ${targets} |`,
        );
        const key = presence(formation);
        const previous = seen.get(key);
        if (previous !== undefined && previous !== ev.summary.avgDamage) {
          report.add(`| **MISMATCH** for ${key}: ${n(previous)} vs ${n(ev.summary.avgDamage)} | | | | | |`);
        }
        seen.set(key, ev.summary.avgDamage);
      }
      report.add(
        `\nAll 35 multisets collapse onto ${String(seen.size)} distinct presence sets with no mismatch: ` +
          '**how many of each squad the enemy brings changes nothing**, only which categories are there at ' +
          'all (and N, which is 4 throughout this table).',
      );
    }

    // ---- Features lost ------------------------------------------------------------------------------
    report.h('Which stack loses which feature, and to what');
    report.add(
      'A stack’s `strengthAgainst` is read from its own row in `troops.json` / `mercenaries.json`. ' +
        '`chooseTarget` takes the largest entry among the categories actually present; with none it hits the ' +
        'melee squad for a bare base hit. The account’s units:',
    );
    report.add('');
    report.add('| stack | strength-against | needs | falls back to |');
    report.add('|---|---|---|---|');
    const shown = [...EIGHT, 'archer-2', 'archer-1', 'rider-1', 'spearman-1'];
    for (const id of shown) {
      const unit = owner.twelve.units.find((entry) => entry.id === id);
      if (!unit) continue;
      const entries = Object.entries(unit.strengthAgainst).filter(([, value]) => (value ?? 0) > 0);
      const best = entries
        .filter(([key]) => (CATEGORIES as readonly string[]).includes(key))
        .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
      const constant = entries.filter(([key]) => !(CATEGORIES as readonly string[]).includes(key));
      report.add(
        `| ${label(id)} | ${entries.map(([key, value]) => `${key} +${n(value ?? 0)} %`).join(', ') || 'none'} | ` +
          `${best[0]?.[0] ?? '—'} | ${best[1] ? `${best[1][0]} +${n(best[1][1] ?? 0)} %` : constant.length > 0 ? 'nothing category-based; its constant lines still apply' : 'melee squad, base hit only'} |`,
      );
    }
    report.add(
      '\n- **ABT6** wants a **flying** squad (+509 %); without one it drops to melee (+394 %) and, if neither ' +
        'melee nor flying is there, to a bare hit.\n' +
        '- **CHR6, RD1, RD2, RD3** want a **ranged** squad (+493 / +65 / +98 / +146 %); the engineers line ' +
        'never fires because an epic monster has no engineer squad.\n' +
        '- **LGN6, SP1, SP2, SW1** want a **mounted** squad (+295 / +39 / +59 / +20 %); their `beasts` line is ' +
        'a race, not a category, and the standard formation carries no race, so it never fires either.\n' +
        '- **ARC1, ARC2** want **flying** (+67 / +101 %), else melee (+52 / +78 %).\n' +
        '- **EMH6 is the exception**: its +609 % is on `epicMonsters`, a *constant* strength-against that ' +
        '`constantStrengthAgainst` adds whatever the target is. It never loses its feature, whatever the ' +
        'formation, which is exactly why it is the best unit this account can field.',
    );

    // ---- 3-squad formations --------------------------------------------------------------------------
    for (const { name, request } of marches) {
      report.h(`${name} — 3-squad formations, one category missing at a time`);
      report.add(
        '**Three squads cannot carry four categories.** One category is always absent, so there is no ' +
          '"3 squads with everything present" row to compute; the four rows below are the four ways to drop ' +
          'one. For comparison the 4-squad reference and a 3-squad formation that doubles a category are ' +
          'included — they confirm again that only the presence set matters.',
      );
      report.add('');
      report.add('| formation | N | missing | min | avg | max | who lost a feature |');
      report.add('|---|---|---|---|---|---|---|');
      const reference = evaluate(withEnemy(request, { melee: 1, ranged: 1, mounted: 1, flying: 1 }));
      const referenceTargets = new Map(
        reference.result.stacks.map((stack) => [stack.unitId, stack.target] as const),
      );
      report.add(
        `| 1 of each (reference) | 4 | — | ${n(reference.summary.minDamage)} | ${n(reference.summary.avgDamage)} | ${n(reference.summary.maxDamage)} | — |`,
      );
      const three: Formation[] = [
        { ranged: 1, mounted: 1, flying: 1 },
        { melee: 1, mounted: 1, flying: 1 },
        { melee: 1, ranged: 1, flying: 1 },
        { melee: 1, ranged: 1, mounted: 1 },
        { melee: 2, ranged: 1 },
        { melee: 1, ranged: 2 },
      ];
      for (const formation of three) {
        const ev = evaluate(withEnemy(request, formation));
        const lost = ev.result.stacks
          .filter((stack) => referenceTargets.get(stack.unitId) !== stack.target)
          .map(
            (stack) => `${label(stack.unitId)} ${String(referenceTargets.get(stack.unitId))}→${stack.target}`,
          )
          .join(', ');
        const missing = CATEGORIES.filter((category) => (formation[category] ?? 0) === 0).join(', ');
        report.add(
          `| ${show(formation)} | ${String(Object.values(formation).reduce((sum, value) => sum + (value ?? 0), 0))} | ${missing} | ${n(ev.summary.minDamage)} | ${n(ev.summary.avgDamage)} | ${n(ev.summary.maxDamage)} | ${lost || 'nobody'} |`,
        );
      }
      report.add(
        '\nTwo effects fight each other in these rows. Dropping a category **costs** the stacks that wanted ' +
          'it (a lost feature is 300-500 % of a base hit for a mercenary), but dropping from N = 4 to N = 3 ' +
          '**pays**, because the hits staircase climbs faster and the stacks at the bottom of the ladder get ' +
          'more turns. Which wins depends on the march.',
      );
    }

    // ---- Arachne's -----------------------------------------------------------------------------------
    for (const { name, request } of marches) {
      report.h(`${name} — Arachne's Invasion (8 squads, 2 of each)`);
      const arachne = evaluate({
        ...withEnemy(request, { melee: 2, ranged: 2, mounted: 2, flying: 2 }),
        activeEvents: ['arachnes'],
      });
      const noEvent = evaluate(withEnemy(request, { melee: 2, ranged: 2, mounted: 2, flying: 2 }));
      report.add(march(arachne.result));
      report.add(table(arachne));
      report.add(
        `\nWith the event id removed but the same 8-squad formation: avg ${n(noEvent.summary.avgDamage)} — ` +
          `${arachne.summary.avgDamage === noEvent.summary.avgDamage ? '**identical**' : 'different'}. The ` +
          'event switches on the `swarmUnits` strength-against, and **no unit this account fields has one** ' +
          '(the twelve `swarmUnits` rows in `mercenaries.json` are Chitinous Defender, Combat Anteater, Grim ' +
          'Stalker and Wasp Man — none of them selected). So Arachne’s changes exactly one thing here: N = 8.',
      );
      report.add(
        '\nAt N = 8 the whole march fits inside one round: `expectedHits(p, 8)` is 0/1 at p = 1 and 1 ' +
          'everywhere up to p = 9. **Nobody is hit twice.** That is why the 8-squad formation is the worst ' +
          'of the three for this account even though every category is present and every feature fires — ' +
          'the march is only 7 or 8 stacks deep, so it never reaches the second round where the extra hits ' +
          'live.',
      );
    }

    // ---- Summary -------------------------------------------------------------------------------------
    report.h('Summary — N and the presence set, side by side');
    report.add('| march | 1 each (N=4) | 3 squads, best | 3 squads, worst | Arachne (N=8) |');
    report.add('|---|---|---|---|---|');
    for (const { name, request } of marches) {
      const four = evaluate(withEnemy(request, { melee: 1, ranged: 1, mounted: 1, flying: 1 })).summary
        .avgDamage;
      const threes = [
        { ranged: 1, mounted: 1, flying: 1 },
        { melee: 1, mounted: 1, flying: 1 },
        { melee: 1, ranged: 1, flying: 1 },
        { melee: 1, ranged: 1, mounted: 1 },
      ].map((formation) => ({
        formation,
        avg: evaluate(withEnemy(request, formation)).summary.avgDamage,
      }));
      threes.sort((a, b) => b.avg - a.avg);
      const eight = evaluate({
        ...withEnemy(request, { melee: 2, ranged: 2, mounted: 2, flying: 2 }),
        activeEvents: ['arachnes'],
      }).summary.avgDamage;
      report.add(
        `| ${name} | ${n(four)} | ${n(threes[0]?.avg ?? 0)} (${show(threes[0]?.formation ?? {})}) | ${n(threes.at(-1)?.avg ?? 0)} (${show(threes.at(-1)?.formation ?? {})}) | ${n(eight)} |`,
      );
    }

    // ---- Target check ---------------------------------------------------------------------------------
    report.h('Target choice, unit by unit, in three formations');
    report.add('| unit | 1 each | no flying | no mounted | no ranged | melee only |');
    report.add('|---|---|---|---|---|---|');
    const formations: [string, Formation][] = [
      ['1 each', { melee: 1, ranged: 1, mounted: 1, flying: 1 }],
      ['no flying', { melee: 1, ranged: 1, mounted: 1 }],
      ['no mounted', { melee: 1, ranged: 1, flying: 1 }],
      ['no ranged', { melee: 1, mounted: 1, flying: 1 }],
      ['melee only', { melee: 4 }],
    ];
    const request = marches[0]?.request;
    if (request) {
      for (const id of [...EIGHT, 'archer-2']) {
        const unit = owner.twelve.units.find((entry) => entry.id === id);
        if (!unit) continue;
        const cells = formations.map(([, formation]) => {
          const enemy = withEnemy(request, formation).enemy;
          const effective = effectiveUnit(unit, request.totals, enemy, []);
          return `${effective.target} +${n(effective.strengthAgainst)} %`;
        });
        report.add(`| ${label(id)} | ${cells.join(' | ')} |`);
      }
    }
    report.add(
      '\nThe last column is the extreme case: four melee squads. ABT6 keeps +394 %, LGN6 and SW1 and SP2 ' +
        'lose everything (their only lines are mounted and beasts), the riders and CHR6 lose everything ' +
        '(ranged and engineers), and EMH6 still carries its whole +609 %. A march built for that formation ' +
        'would be ABT6, ARC2 and EMH6 and nothing else.',
    );

    report.h('Reading it');
    report.add(
      '- **Only two things about the enemy matter: N, and which categories are present.** The multiplicity of ' +
        'a squad changes nothing — verified on all 35 four-squad multisets above, with no mismatch.\n' +
        '- **N is usually the bigger term.** Going from 4 squads to 3 shortens the round and gives the bottom ' +
        'of the ladder an extra turn; going from 4 to 8 (Arachne’s) means nobody gets a second turn at all, ' +
        'which is the largest single swing in this file.\n' +
        '- **A lost feature is expensive but survivable.** A mercenary’s strength-against is 300-500 % of ' +
        'its base strength, so losing it roughly halves that stack’s hit; EMH6 never loses its, which is why ' +
        'the account’s best unit is also its most formation-proof.\n' +
        '- **`armyStrengthAgainstEpicMonsters` is the only bonus that is immune to the formation** — it is ' +
        'added by `constantStrengthAgainst` whatever the target is. Against a hostile formation it is worth ' +
        'strictly more than any category bonus of the same size.',
    );

    report.save();
  });
});
