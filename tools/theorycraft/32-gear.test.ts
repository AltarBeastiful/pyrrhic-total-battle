/**
 * C3 — titles, artifacts and equipment (investigation 0015).
 *
 * Inventory first: every entry in `titles.json`, `artifacts.json` and `equipment.json` that carries
 * strength for `guardsmen` / `army` / `ranged` / `mounted`, or `armyStrengthAgainstEpicMonsters`, or a
 * double-damage chance. Then the value: each one resolved by the app's own `resolveSources`, added on top
 * of scenario B, and scored by the average damage of the 8-type `msRelaxed` march and of the exhaustive
 * winner (ARC2 RD2 RD3 + the four mercenaries).
 *
 * **Whether the owner can obtain any of these is a game question this report cannot answer.** A title is
 * won in an event, an artifact is levelled with resources, a piece of equipment is forged and upgraded; the
 * numbers here say what each would be worth *if* it were on, nothing about how to get it.
 *
 * Two caveats the tables themselves impose:
 *   - Equipment is quoted at **godlike**, the top row of `byQuality`; every other quality is in the second
 *     table so a reader can find their own row.
 *   - Only **Heart of the Forest** has a level table in `artifacts.json`. Every other artifact resolves
 *     through `entry.manual`, i.e. the numbers the player types off their own sheet, so this report can
 *     only say which key it feeds, not how much.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/32-gear.test.ts`
 */
import { describe, it } from 'vitest';

import {
  artifacts as artifactTable,
  equipment as equipmentTable,
  otherPills as pillTable,
  titles as titleTable,
} from '../../src/data';
import { QUALITIES } from '../../src/data/types';
import type { Quality } from '../../src/data/types';
import { aggregateBonuses } from '../../src/engine/bonuses';
import type { BonusTotals, ResolvedSource, StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { resolveSources } from '../../src/state/derive';
import {
  EXPORT,
  MERC_IDS,
  Report,
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

const B_SOURCE: ResolvedSource = {
  id: 'ingame-2026-09-13',
  label: 'bonuses as in the 2026-09-13 report',
  kind: 'custom',
  health: { guardsmen: 143, ranged: 0.5, specialist: 51 },
  strength: { guardsmen: 187, ranged: 1, specialist: 71 },
  special: { doubleDamageChance: 3 },
};

/** Keys C3 is asked about: strength that reaches this account's units, or a features / proc key. */
const WANTED_STRENGTH = ['guardsmen', 'army', 'ranged', 'mounted'] as const;

function ownerProfile(): { profile: Profile; setup: BattleSetup } {
  const parsed = parseImport(readFileSync(EXPORT, 'utf8'));
  if (parsed.kind !== 'profile') throw new Error('not a profile export');
  const profile = parsed.payload;
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return { profile, setup };
}

function resolveOne(
  profile: Profile,
  setup: BattleSetup,
  patch: { profile?: Partial<Profile['sources']>; active: Partial<BattleSetup['active']> },
  kinds: ResolvedSource['kind'][],
): ResolvedSource | undefined {
  const probe: Profile = { ...profile, sources: { ...profile.sources, ...(patch.profile ?? {}) } };
  const probeSetup: BattleSetup = { ...setup, active: { ...setup.active, ...patch.active } };
  return resolveSources(probe, probeSetup).find((source) => kinds.includes(source.kind));
}

function totalsWith(source: ResolvedSource | undefined): BonusTotals {
  return aggregateBonuses(source ? [B_SOURCE, source] : [B_SOURCE]);
}

function describeSource(source: ResolvedSource | undefined): string {
  if (!source) return '—';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(source.health ?? {}))
    parts.push(`${key} health +${n(value ?? 0)}`);
  for (const [key, value] of Object.entries(source.strength ?? {}))
    parts.push(`${key} strength +${n(value ?? 0)}`);
  for (const [key, value] of Object.entries(source.special ?? {})) parts.push(`${key} +${n(value ?? 0)}`);
  for (const entry of source.matchup ?? [])
    parts.push(`${entry.attacker} vs ${entry.target} +${n(entry.value)}`);
  return parts.length > 0 ? parts.join(', ') : 'nothing';
}

/** Does this contribution touch one of the keys C3 asks about? */
function isWanted(source: ResolvedSource | undefined): boolean {
  if (!source) return false;
  for (const key of WANTED_STRENGTH) if ((source.strength?.[key] ?? 0) !== 0) return true;
  const special = source.special ?? {};
  return (
    (special.armyStrengthAgainstEpicMonsters ?? 0) !== 0 ||
    (special.doubleDamageChance ?? 0) !== 0 ||
    (special.guardsmenDoubleDamageChance ?? 0) !== 0 ||
    (special.specialistsDoubleDamageChance ?? 0) !== 0
  );
}

describe.skipIf(!process.env.THEORY)('C3 gear', () => {
  it('prices titles, artifacts and equipment', () => {
    const report = new Report('32-gear');
    const owner = loadOwner();
    const { profile, setup } = ownerProfile();

    const marches: { key: string; name: string; request: StackRequest }[] = [
      { key: 'eight', name: '8 types · msRelaxed', request: withMethod(scenarioB(owner.eight), 'msRelaxed') },
      {
        key: 'winner',
        name: 'winner 7 types · msRelaxed',
        request: withMethod(withUnits(scenarioB(owner.twelve), WINNER7), 'msRelaxed'),
      },
    ];
    const baseAvg: Record<string, number> = {};
    for (const { key, request } of marches) {
      baseAvg[key] = evaluate(withTotals(request, totalsWith(undefined))).summary.avgDamage;
    }

    report.add('# C3 — titles, artifacts, equipment');
    report.add(
      '\nScenario B plus **one** entry, nothing else. Housing leadership 4,343 · authority 2,000 · dominance 800; ' +
        'caps EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37. Enemy 1 melee / 1 ranged / 1 mounted / 1 flying. ' +
        `Baselines: 8 types **${n(baseAvg.eight ?? 0)}**, winner **${n(baseAvg.winner ?? 0)}**.`,
    );
    report.add(
      '\n> **Obtainability is a game question.** Nothing below says the owner can get any of these, or how. ' +
        'A title is awarded, an artifact is levelled, a piece of equipment is forged and upgraded to a ' +
        'quality; the report only prices them as if they were switched on.',
    );

    // ---- Inventory ---------------------------------------------------------------------------------
    report.h('Inventory — which entries carry a key that matters here');
    report.add(
      'Wanted: `strength` on `guardsmen` / `army` / `ranged` / `mounted`, or `armyStrengthAgainstEpicMonsters`, ' +
        'or a double-damage chance. `strikeTwoSquadsChance` is listed where it exists but **the engine does ' +
        'not model it** (battle.ts: "no in-game observation of it yet"), so it never moves a number here.',
    );

    interface Scored {
      group: string;
      name: string;
      detail: string;
      deltas: Record<string, number>;
      wanted: boolean;
    }
    const scored: Scored[] = [];

    const score = (group: string, name: string, source: ResolvedSource | undefined): Scored => {
      const deltas: Record<string, number> = {};
      for (const { key, request } of marches) {
        deltas[key] =
          evaluate(withTotals(request, totalsWith(source))).summary.avgDamage - (baseAvg[key] ?? 0);
      }
      return { group, name, detail: describeSource(source), deltas, wanted: isWanted(source) };
    };

    // Titles.
    report.add('\n### Titles (`titles.json`, 28 entries)\n');
    report.add('| title | contribution | in scope? |');
    report.add('|---|---|---|');
    for (const record of titleTable) {
      const source = resolveOne(profile, setup, { active: { titles: [record.id] } }, ['title']);
      const row = score('title', record.name, source);
      scored.push(row);
      report.add(`| ${record.name} | ${row.detail} | ${row.wanted ? 'yes' : 'no'} |`);
    }

    // Other pills (the Personal / Clan / Kingdom +25s) — same shape, worth listing next to the titles.
    report.add('\n### Other pills (`otherPills.json`)\n');
    report.add('| pill | contribution | in scope? |');
    report.add('|---|---|---|');
    for (const record of pillTable) {
      const source = resolveOne(profile, setup, { active: { otherPills: [record.id] } }, ['other']);
      const row = score('pill', record.name, source);
      scored.push(row);
      report.add(`| ${record.name} | ${row.detail} | ${row.wanted ? 'yes' : 'no'} |`);
    }

    // Equipment at godlike.
    report.add('\n### Equipment at godlike (`equipment.json`, top row of `byQuality`)\n');
    report.add('| piece | godlike contribution | in scope? |');
    report.add('|---|---|---|');
    for (const record of equipmentTable) {
      const source = resolveOne(
        profile,
        setup,
        {
          profile: { equipment: [{ id: 'probe', equipmentId: record.id, quality: 'godlike' }] },
          active: { equipment: ['probe'] },
        },
        ['equipment'],
      );
      const row = score('equipment', `${record.name} (godlike)`, source);
      scored.push(row);
      report.add(`| ${record.name} | ${row.detail} | ${row.wanted ? 'yes' : 'no'} |`);
    }

    // Artifacts.
    report.add('\n### Artifacts (`artifacts.json`, 15 entries)\n');
    report.add(
      'Only Heart of the Forest carries a level table. The others resolve through `entry.manual` — the ' +
        'numbers the player reads off their own artifact — so the table can say **which key** each feeds and ' +
        'nothing about how much. The `random bonus` column is the extra roll the artifact can carry; its ' +
        'value is also typed by the player.',
    );
    report.add('');
    report.add('| artifact | keys | level table? | random bonus options |');
    report.add('|---|---|---|---|');
    for (const record of artifactTable) {
      const keys = [
        record.health ? `${record.health.key} health` : '',
        record.strength ? `${record.strength.key} strength` : '',
        record.special ? String(record.special.key) : '',
      ]
        .filter(Boolean)
        .join(', ');
      const hasLevels = Boolean(record.health?.levels ?? record.strength?.levels ?? record.special?.levels);
      report.add(
        `| ${record.name} | ${keys || '—'} | ${hasLevels ? '**yes**' : 'no (manual)'} | ${(record.randomBonusOptions ?? []).join(', ') || '—'} |`,
      );
    }

    // Heart of the Forest, the one artifact we can actually price.
    report.add(
      '\n**Heart of the Forest, priced from its own table** (`base[level] + star[star]`, army strength):\n',
    );
    report.add('| level ★star | army strength | Δ avg 8 types | Δ avg winner |');
    report.add('|---|---|---|---|');
    for (const [level, star] of [
      [1, '0.1'],
      [20, '0.4'],
      [30, '1.0'],
      [40, '2.0'],
      [50, '3.0'],
      [60, '5.0'],
    ] as const) {
      const source = resolveOne(
        profile,
        setup,
        {
          profile: { artifacts: [{ id: 'probe', artifactId: 'heart-of-the-forest', level, star }] },
          active: { artifacts: ['probe'] },
        },
        ['artifact'],
      );
      const row = score('artifact', `Heart of the Forest L${String(level)} ★${star}`, source);
      // Only the top of the ladder joins the ranking, so the top five are five different entries.
      if (level === 60) scored.push(row);
      report.add(
        `| L${String(level)} ★${star} | +${n(source?.strength?.army ?? 0)} | ${n(row.deltas.eight ?? 0)} | ${n(row.deltas.winner ?? 0)} |`,
      );
    }

    // ---- Top five ----------------------------------------------------------------------------------
    for (const { key, name } of marches) {
      report.h(`Top of the list on the ${name} march (scenario B)`);
      const ranked = [...scored].sort((a, b) => (b.deltas[key] ?? 0) - (a.deltas[key] ?? 0));
      report.add('| # | entry | contribution | Δ avg | % of baseline |');
      report.add('|---|---|---|---|---|');
      ranked.slice(0, 12).forEach((row, index) => {
        report.add(
          `| ${String(index + 1)} | ${row.name} | ${row.detail} | ${n(row.deltas[key] ?? 0)} | ${n((100 * (row.deltas[key] ?? 0)) / (baseAvg[key] ?? 1))} % |`,
        );
      });
      report.add(
        '\nOne row per entry: Heart of the Forest joins at the top of its own ladder (L60 ★5.0) so the five ' +
          'leaders are five different things. Its lower levels are in the table above.',
      );
    }

    // ---- The top five, in full --------------------------------------------------------------------
    report.h('The top five in full (winner march, scenario B)');
    {
      const request = marches[1]?.request;
      const ranked = [...scored].sort((a, b) => (b.deltas.winner ?? 0) - (a.deltas.winner ?? 0)).slice(0, 5);
      report.add(
        ranked.map((row, index) => `${String(index + 1)}. **${row.name}** — ${row.detail}`).join('\n'),
      );
      if (request) {
        for (const row of ranked.slice(0, 2)) {
          const entry = row.name;
          report.add(`\n### ${entry}`);
          // Rebuild the source for the march table.
          const source = rebuild(profile, setup, entry);
          const ev = evaluate(withTotals(request, totalsWith(source)));
          report.add(march(ev.result));
          report.add(table(ev));
        }
      }
    }

    // ---- Equipment quality ladder ------------------------------------------------------------------
    report.h('The whole quality ladder, for the pieces that matter');
    report.add(
      'Equipment scales steeply with quality. The three pieces that top the ranking, at every quality ' +
        '`equipment.json` carries:',
    );
    report.add('');
    report.add(`| piece | ${QUALITIES.join(' | ')} |`);
    report.add(`|---|${QUALITIES.map(() => '---').join('|')}|`);
    for (const id of ['warrior-of-ragnarok', 'immortal-warrior', 'guardian-of-justice', 'emperors-wrath']) {
      const record = equipmentTable.find((entry) => entry.id === id);
      if (!record) continue;
      const cells = QUALITIES.map((quality: Quality) => {
        if (!record.byQuality[quality]) return '—';
        const source = resolveOne(
          profile,
          setup,
          {
            profile: { equipment: [{ id: 'probe', equipmentId: id, quality }] },
            active: { equipment: ['probe'] },
          },
          ['equipment'],
        );
        const request = marches[1]?.request;
        if (!request) return '—';
        return n(evaluate(withTotals(request, totalsWith(source))).summary.avgDamage - (baseAvg.winner ?? 0));
      });
      report.add(`| ${record.name} | ${cells.join(' | ')} |`);
    }

    report.h('Reading it');
    report.add(
      '- **`armyStrengthAgainstEpicMonsters` is the single most valuable line in any of the three tables.** ' +
        'Warrior of Ragnarök carries +210 of it at godlike — a features point is worth exactly what an army ' +
        'strength point is worth (C1), and 210 of them beats every percentage bonus on offer.\n' +
        '- **Battlemaster is the best title by a wide margin** (army +150 / +150 plus 5 % double damage and ' +
        '5 % strike-two-squads), then Warlord (+100 / +100), then Hero of Battle (+75 / +75 and 2 % / 2 %). ' +
        'Everything else in `titles.json` is +25 or less, and eight titles carry only `strikeTwoSquadsChance`, ' +
        'which the engine does not model at all — those score exactly 0 here and their real value is unknown.\n' +
        '- **The health halves of these entries are nearly free upside and nearly no damage.** Every piece ' +
        'that grants army health and army strength together is scored on the strength half; the health half ' +
        'only re-shuffles the kill order (C1, Mechanism 4).\n' +
        '- **Double damage is under-counted by every number in this file.** `avgDamage` does not price a proc, ' +
        'so Immortal Warrior’s and Battlemaster’s double-damage points show up as 0 here. By C1, one point ' +
        `is worth avg / 100 — ${n(Math.round((baseAvg.winner ?? 0) / 100))} on the winner march — so ` +
        'Battlemaster’s 5 points are worth about another ' +
        `${n(Math.round((5 * (baseAvg.winner ?? 0)) / 100))} of expected damage on top of its row.\n` +
        '- **Artifacts cannot be ranked from the tables.** Fourteen of the fifteen have no level table, so ' +
        'their contribution is whatever the player types. The one that can be priced, Heart of the Forest, ' +
        'reaches +720 army strength at L60 ★5.0 and is then the largest single strength source anywhere in ' +
        'the data, larger than any captain star.\n' +
        '- Again: **obtainability is a game question.** This report prices, it does not advise.',
    );

    report.save();

    /** Rebuild a source from the label used in the ranking, so the two headline marches can be printed. */
    function rebuild(p: Profile, s: BattleSetup, name: string): ResolvedSource | undefined {
      const title = titleTable.find((record) => record.name === name);
      if (title) return resolveOne(p, s, { active: { titles: [title.id] } }, ['title']);
      const pill = pillTable.find((record) => record.name === name);
      if (pill) return resolveOne(p, s, { active: { otherPills: [pill.id] } }, ['other']);
      const gear = equipmentTable.find((record) => `${record.name} (godlike)` === name);
      if (gear) {
        return resolveOne(
          p,
          s,
          {
            profile: { equipment: [{ id: 'probe', equipmentId: gear.id, quality: 'godlike' }] },
            active: { equipment: ['probe'] },
          },
          ['equipment'],
        );
      }
      const match = /^Heart of the Forest L(\d+) ★(\S+)$/.exec(name);
      if (match?.[1] && match[2]) {
        return resolveOne(
          p,
          s,
          {
            profile: {
              artifacts: [
                { id: 'probe', artifactId: 'heart-of-the-forest', level: Number(match[1]), star: match[2] },
              ],
            },
            active: { artifacts: ['probe'] },
          },
          ['artifact'],
        );
      }
      return undefined;
    }
  });
});
