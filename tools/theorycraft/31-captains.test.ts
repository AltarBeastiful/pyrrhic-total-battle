/**
 * C2 — captains (investigation 0015).
 *
 * Every captain in `src/data/tables/captains.json`, resolved by the app's own `resolveSources`
 * (`captainValue` = `level × perLevel + stars[star]`), added on top of scenario B, and ranked by the
 * average damage of two marches:
 *   - the 8-type `msRelaxed` march (SW1 SP2 RD2 RD3 + the four mercenaries), and
 *   - the exhaustive single-march winner at authority 2,000 (ARC2 RD2 RD3 + the four mercenaries).
 *
 * Two settings: **37 ★3**, the entry the export carries, and **60 ★6**, the top of the star table. The
 * star table stops at index 6; the level has no table at all (the contribution is linear in the level), so
 * 60 is the game's own captain cap and is flagged as an assumption — a reader can rescale any row with the
 * `per level` column.
 *
 * The export's setup has **no captain active** (`active.captains` is empty), so every number below is a
 * gain over a march with no captain at all.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/31-captains.test.ts`
 */
import { describe, it } from 'vitest';

import { captains as captainTable } from '../../src/data';
import { aggregateBonuses } from '../../src/engine/bonuses';
import type { BonusTotals, ResolvedSource, StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { captainValue, resolveSources } from '../../src/state/derive';
import {
  EXPORT,
  MERC_IDS,
  Report,
  countsOf,
  evaluate,
  loadOwner,
  march,
  n,
  scenarioB,
  table,
  withMethod,
  withTotals,
  withUnits,
} from './harness';
/// <reference types="node" />
import { readFileSync } from 'node:fs';

const WINNER7 = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;

/** Scenario B as a source, so a captain can be aggregated next to it by the engine's own adder. */
const B_SOURCE: ResolvedSource = {
  id: 'ingame-2026-09-13',
  label: 'bonuses as in the 2026-09-13 report',
  kind: 'custom',
  health: { guardsmen: 143, ranged: 0.5, specialist: 51 },
  strength: { guardsmen: 187, ranged: 1, specialist: 71 },
  special: { doubleDamageChance: 3 },
};

function ownerProfile(): { profile: Profile; setup: BattleSetup } {
  const parsed = parseImport(readFileSync(EXPORT, 'utf8'));
  if (parsed.kind !== 'profile') throw new Error('not a profile export');
  const profile = parsed.payload;
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return { profile, setup };
}

/** The captain's own `ResolvedSource`, straight out of the app's resolver with the entry swapped. */
function captainSource(
  profile: Profile,
  setup: BattleSetup,
  captainId: string,
  level: number,
  star: number,
): ResolvedSource | undefined {
  const probe: Profile = {
    ...profile,
    sources: { ...profile.sources, captains: [{ id: 'probe', captainId, level, star }] },
  };
  const withCaptain: BattleSetup = { ...setup, active: { ...setup.active, captains: ['probe'] } };
  return resolveSources(probe, withCaptain).find((source) => source.kind === 'captain');
}

function totalsWith(source: ResolvedSource | undefined): BonusTotals {
  return aggregateBonuses(source ? [B_SOURCE, source] : [B_SOURCE]);
}

/** `guardsmen +37 health, +52 strength` — the captain's contribution in plain words. */
function describeSource(source: ResolvedSource | undefined): string {
  if (!source) return '—';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(source.health ?? {}))
    parts.push(`${key} health +${n(value ?? 0)}`);
  for (const [key, value] of Object.entries(source.strength ?? {}))
    parts.push(`${key} strength +${n(value ?? 0)}`);
  for (const [key, value] of Object.entries(source.special ?? {})) parts.push(`${key} +${n(value ?? 0)}`);
  return parts.length > 0 ? parts.join(', ') : 'nothing (no bonus in the table)';
}

describe.skipIf(!process.env.THEORY)('C2 captains', () => {
  it('ranks every captain', () => {
    const report = new Report('31-captains');
    const owner = loadOwner();
    const { profile, setup } = ownerProfile();

    const marches: { key: string; name: string; request: StackRequest }[] = [
      {
        key: 'eight',
        name: '8 types · msRelaxed',
        request: withMethod(scenarioB(owner.eight), 'msRelaxed'),
      },
      {
        key: 'winner',
        name: 'winner 7 types (ARC2 RD2 RD3 + 4 mercs) · msRelaxed',
        request: withMethod(withUnits(scenarioB(owner.twelve), WINNER7), 'msRelaxed'),
      },
    ];

    report.add('# C2 — what a captain is worth');
    report.add(
      '\nScenario B plus one captain, nothing else. Housing leadership 4,343 · authority 2,000 · dominance 800; ' +
        'caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37. Enemy 1 melee / 1 ranged / 1 mounted / 1 flying.',
    );
    report.add(
      '\nThe export **has no captain active**: `active.captains` is `[]`, so the profile carries an Aydae ' +
        'L37 ★3 entry that contributes nothing to any march the app generates from it. Every Δ below is ' +
        'therefore a gain over the march as it stands today.',
    );
    report.add(
      '\nBonus value = `level × perLevel + stars[star]` (`derive.ts`, `captainValue`). The star table ends at ' +
        'index 6. There is no level table, so the 60 ★6 column assumes the game’s level cap of 60; rescale ' +
        'any row with the `per level` column if that is wrong.',
    );

    for (const { name, request } of marches) {
      const ev = evaluate(withTotals(request, totalsWith(undefined)));
      report.h(`Baseline — ${name}, no captain`);
      report.add(march(ev.result));
      report.add(table(ev));
    }

    // ---- The ranking -------------------------------------------------------------------------------
    interface Row {
      id: string;
      name: string;
      note: string;
      contribution37: string;
      contribution60: string;
      perLevel: string;
      deltas: Record<string, { at37: number; at60: number; moved37: boolean }>;
    }

    const rows: Row[] = [];
    for (const record of captainTable) {
      const at37 = captainSource(profile, setup, record.id, 37, 3);
      const at60 = captainSource(profile, setup, record.id, 60, 6);
      const perLevel = [
        record.health ? `${record.health.key} health ${n(record.health.perLevel)}/level` : '',
        record.strength ? `${record.strength.key} strength ${n(record.strength.perLevel)}/level` : '',
        record.special ? `${record.special.key} ${n(record.special.perLevel)}/level` : '',
      ]
        .filter(Boolean)
        .join(', ');
      const deltas: Row['deltas'] = {};
      for (const { key, request } of marches) {
        const base = evaluate(withTotals(request, totalsWith(undefined)));
        const a = evaluate(withTotals(request, totalsWith(at37)));
        const b = evaluate(withTotals(request, totalsWith(at60)));
        deltas[key] = {
          at37: a.summary.avgDamage - base.summary.avgDamage,
          at60: b.summary.avgDamage - base.summary.avgDamage,
          moved37: JSON.stringify(countsOf(a.result)) !== JSON.stringify(countsOf(base.result)),
        };
      }
      rows.push({
        id: record.id,
        name: record.name,
        note: record.note ?? '',
        contribution37: describeSource(at37),
        contribution60: describeSource(at60),
        perLevel: perLevel || '—',
        deltas,
      });
    }

    for (const { key, name } of marches) {
      report.h(`Ranking on ${name} (scenario B)`);
      const sorted = [...rows].sort(
        (a, b) =>
          (b.deltas[key]?.at60 ?? 0) - (a.deltas[key]?.at60 ?? 0) ||
          (b.deltas[key]?.at37 ?? 0) - (a.deltas[key]?.at37 ?? 0),
      );
      report.add(
        '| captain | what it gives at 37 ★3 | Δ avg 37 ★3 | what it gives at 60 ★6 | Δ avg 60 ★6 | note |',
      );
      report.add('|---|---|---|---|---|---|');
      for (const row of sorted) {
        const delta = row.deltas[key];
        report.add(
          `| ${row.name} | ${row.contribution37} | ${n(delta?.at37 ?? 0)} | ${row.contribution60} | ${n(delta?.at60 ?? 0)} | ${row.note} |`,
        );
      }
    }

    // ---- Health-only captains ----------------------------------------------------------------------
    report.h('Health-only captains, and why they are nearly worthless here');
    const healthOnly = captainTable.filter((record) => record.health && !record.strength && !record.special);
    const strengthOnly = captainTable.filter(
      (record) => record.strength && !record.health && !record.special,
    );
    const both = captainTable.filter((record) => record.health && record.strength);
    const none = captainTable.filter((record) => !record.health && !record.strength && !record.special);
    const special = captainTable.filter((record) => record.special);
    report.add(
      `- **health only:** ${healthOnly.map((record) => record.name).join(', ') || '—'}\n` +
        `- **strength only:** ${strengthOnly.map((record) => record.name).join(', ') || '—'}\n` +
        `- **both:** ${both.map((record) => record.name).join(', ')}\n` +
        `- **a special key:** ${special.map((record) => `${record.name} (${record.special?.key ?? ''})`).join(', ')}\n` +
        `- **no bonus in the table at all:** ${none.map((record) => record.name).join(', ')}`,
    );
    report.add(
      '\nHealth is absent from the damage formula (C1, Mechanism 1): `damage = count × strength × ' +
        '(1 + Σ strength %) + count × base strength × strengthAgainst / 100`. A health captain can only reach ' +
        'the damage through the sizer, and it only reaches it when the bonus is **uneven across the units the ' +
        'march fields**. The bonuses are additive inside one bracket, so a key every unit carries just ' +
        'rescales the whole HP ladder and the sizer\u2019s flat profile is scale-invariant: the counts come back ' +
        'bit-identical.\n\n' +
        '- On the **winner march** every one of the seven types is a guardsman, so `army` health is uniform ' +
        'and Ramses II 60 ★6 (+270 army health) moves the average by **693** — six digits smaller than a ' +
        'strength captain of the same tier.\n' +
        '- On the **8-type march** it is not uniform: SW1 is a specialist (Σ health 51 in scenario B) and the ' +
        'rest are guardsmen (Σ health 143). Adding +270 army health takes SW1 from ×2.51 to ×5.21 but the ' +
        'guardsmen only from ×3.43 to ×6.13, so the *ratio* moves, the flat profile re-solves and the ' +
        'mercenary ceiling rises. That is the whole of Ramses II\u2019s +726,082 there: not one point of extra ' +
        'damage per hit, only a different count vector.\n\n' +
        'So "health is worthless" is too strong; the correct statement is **health pays only through ' +
        'unevenness**, it pays nothing at all when the march is homogeneous, and it is never a rate you can ' +
        'extrapolate — it is a step function of which stack ends up in which kill position.',
    );
    report.add('\n| captain | key | Δ avg 8 types | Δ avg winner | counts move? |');
    report.add('|---|---|---|---|---|');
    for (const record of [...healthOnly, ...strengthOnly, ...special]) {
      const row = rows.find((entry) => entry.id === record.id);
      if (!row) continue;
      report.add(
        `| ${record.name} 60 ★6 | ${record.health?.key ?? record.strength?.key ?? record.special?.key ?? ''} | ${n(row.deltas.eight?.at60 ?? 0)} | ${n(row.deltas.winner?.at60 ?? 0)} | ${row.deltas.eight?.moved37 ? 'yes' : 'no'} |`,
      );
    }

    // ---- Aydae, the one the profile already holds ---------------------------------------------------
    report.h('Aydae L37 ★3 — what activating the captain the profile already holds would do');
    {
      const aydae37 = captainSource(profile, setup, 'aydae', 37, 3);
      const aydae60 = captainSource(profile, setup, 'aydae', 60, 6);
      report.add(
        `Aydae is guardsmen health \`1/level\`, stars \`[0, 0, 15, 15, 45, 45, 105]\`, and guardsmen strength ` +
          `\`1/level\`, stars \`[0, 15, 15, 45, 45, 105, 105]\`. At L37 ★3 that is ` +
          `**37 × 1 + 15 = 52 guardsmen health** and **37 × 1 + 45 = 82 guardsmen strength** ` +
          `(\`captainValue\` gives ${n(captainValue(captainTable.find((r) => r.id === 'aydae')?.health ?? { perLevel: 0, stars: [] }, 37, 3))} and ` +
          `${n(captainValue(captainTable.find((r) => r.id === 'aydae')?.strength ?? { perLevel: 0, stars: [] }, 37, 3))}).`,
      );
      report.add(`Resolved: ${describeSource(aydae37)}.`);
      report.add('');
      report.add('| march | avg without | avg with Aydae 37 ★3 | Δ | avg with Aydae 60 ★6 | Δ |');
      report.add('|---|---|---|---|---|---|');
      for (const { name, request } of marches) {
        const base = evaluate(withTotals(request, totalsWith(undefined)));
        const a = evaluate(withTotals(request, totalsWith(aydae37)));
        const b = evaluate(withTotals(request, totalsWith(aydae60)));
        report.add(
          `| ${name} | ${n(base.summary.avgDamage)} | ${n(a.summary.avgDamage)} | ${n(a.summary.avgDamage - base.summary.avgDamage)} | ${n(b.summary.avgDamage)} | ${n(b.summary.avgDamage - base.summary.avgDamage)} |`,
        );
      }
      const request = marches[1]?.request;
      if (request) {
        const a = evaluate(withTotals(request, totalsWith(aydae37)));
        report.add(`\nWinner march with Aydae 37 ★3: ${march(a.result)}`);
        report.add(table(a));
      }
    }

    report.h('Reading the ranking');
    report.add(
      '- Every mercenary this account fields carries the `guardsmen` tag, and in the winner march *every* ' +
        'unit does (ARC2, RD2, RD3 are guardsmen troops). So on that march a `guardsmen` captain and an ' +
        '`army` captain are the same bonus, and the ranking is simply "how many strength points does this ' +
        'captain give", scaled by C1’s rate.\n' +
        '- Hercules is the only captain on a special key: `armyStrengthAgainstEpicMonsters`, 2 per level with ' +
        'stars up to +860. Against an epic monster it is the biggest single bonus in the table, and C1 shows ' +
        'a strength-against point is worth exactly what an army strength point is worth.\n' +
        '- Skadi (guardsmen, 2 per level, stars to 840) and Heimdall (army strength, 1.5 per level, stars to ' +
        '660) are the next tier. `captains.json` notes that Sofia’s ÷2, Amanitore’s ×1.5 and Skadi’s ×2 are ' +
        'already baked into `perLevel`, so they must not be applied twice.\n' +
        '- Captains keyed on `melee`, `ranged`, `mounted`, `flying`, `monster`, `engineers` or `specialist` ' +
        'only touch part of the march (and nothing at all when the march fields none of that category), ' +
        'which is why they rank below the army/guardsmen ones despite larger per-level numbers.\n' +
        '- Amanitore only counts on group marches, reinforcements and raids, and Hercules only against epic ' +
        'monsters — which is the only battle this tool models, so Hercules’ condition is always met here.\n' +
        '- **Negative rows are real, not bugs.** Aydae 60 \u26056 loses 196,153 on the 8-type march and Xi ' +
        'Guiying loses 377,937 on the winner march. A captain that boosts only part of the army moves ' +
        'those stacks up the HP ladder (health) or up the attack order (strength), and with N = 4 enemy ' +
        'squads only the last two kill positions are struck twice \u2014 so pushing a 1.2 M-per-hit mercenary ' +
        'out of a double-hit slot costs more than the bonus adds. Uneven bonuses have to be checked, not ' +
        'assumed; uniform ones (army / guardsmen here) never do this.\n' +
        '- Whether the owner **has** a given captain, and at what level and star, is a game question this ' +
        'report cannot answer.',
    );

    report.save();
  });
});
