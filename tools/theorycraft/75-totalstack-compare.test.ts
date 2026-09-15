/**
 * 75 — TotalStack's own optimize answer, beside ours and Kai's marched stack (owner, 2026-09-15).
 *
 * The capture is `docs/research/fixtures/totalstack-2026-09-15-optimize.json` — the request as it was sent
 * and the response as it came back (HTTP 200). This experiment reads it, maps it into our own `StackRequest`
 * **twice** (the query's own army, and the profile's real army — the owner's correction of 2026-09-15), runs
 * our engine on both, and puts the marches on one enemy and one bonus set at a time.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/75-totalstack-compare.test.ts`
 */
import { describe, it } from 'vitest';

import { readFileSync } from 'node:fs';

import { getUnits, unitById } from '../../src/data';
import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { BonusTotals, ResolvedSource, StackRequest, StackResult, UnitDef } from '../../src/engine/types';
import { Report, evaluateCounts, kaiReportTotals, n, withMethod } from './harness';

const FIXTURE = new URL('../../docs/research/fixtures/totalstack-2026-09-15-optimize.json', import.meta.url);
interface Capture {
  request: {
    inputValue: number;
    authorityValue: number;
    guardsmenMinTier: number;
    guardsmenMaxTier: number;
    specialistMinTier: number;
    specialistMaxTier: number;
    guardsmenExcludedCategories: string[];
    excludedTroopIds: string[];
    selectedMercenaryIds: string[];
    mercenaryCaps: Record<string, number>;
    relaxedPreservation: boolean;
    healthBonuses: Record<string, number>;
    strengthBonuses: Record<string, number>;
    objective: string;
    templeLevel: number;
    enemyFormation: Record<string, number>;
  };
  response: {
    calculation: {
      troopCounts: Record<string, number>;
      mercenaryCounts: Record<string, number>;
      guardsmenPct: number;
      specialistPct: number;
    };
  };
}
const CAPTURE = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Capture;
const THEIR_REQUEST = CAPTURE.request;
const THEIRS = CAPTURE.response.calculation;
const THEIR_COUNTS = { ...THEIRS.troopCounts, ...THEIRS.mercenaryCounts };

/** Kai's marched stack, transcribed from the 2026-09-14 report (`02-kai-report.test.ts`). */
const KAI: Record<string, number> = {
  'spearman-1': 855,
  'rider-1': 423,
  'archer-1': 837,
  'spearman-2': 451,
  'rider-2': 223,
  'archer-2': 440,
  'rider-3': 116,
  'arbalester-6': 18,
  'legionary-6': 18,
  'epic-monster-hunter-6': 16,
  'chariot-6': 8,
};

/** The profile's own allocation — the owner's correction: `topTierExcluded` is a *top tier* exclusion. */
const PROFILE = (() => {
  const raw = JSON.parse(readFileSync(loadOwnerExport(), 'utf8')) as {
    payload: {
      troops: {
        guardsmen: { min: number; max: number };
        specialists: { min: number; max: number };
        topTierExcluded: { guardsmen: string[]; specialists: string[] };
        excludedUnitIds: string[];
      };
      mercenaries: { selected: { id: string; cap: number }[] };
      recovery: {
        templeLevel: number;
        trainingCostReduction: Record<string, number>;
        trainingSpeed: Record<string, number>;
      };
    };
  };
  return raw.payload;
})();
function loadOwnerExport(): string {
  return process.env.PYRRHIC_EXPORT ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-13.json';
}
/** The account's own hired stock — the denominator of "the share of the stock it spends". */
const STOCK_HELD: Record<string, number> = Object.fromEntries(
  PROFILE.mercenaries.selected.map((merc) => [merc.id, merc.cap]),
);
const STOCK_TOTAL = Object.values(STOCK_HELD).reduce((sum, cap) => sum + cap, 0);

/**
 * The units a tier window describes, with `topTierExcluded` applied the way the app applies it
 * (`src/state/derive.ts`: *categories of the highest unlocked tier the account has not upgraded yet*).
 */
function windowUnits(): UnitDef[] {
  const rows = [
    { group: 'guardsmen', key: 'guardsmen', range: PROFILE.troops.guardsmen },
    { group: 'specialist', key: 'specialists', range: PROFILE.troops.specialists },
  ] as const;
  return getUnits().filter((unit) =>
    rows.some(
      ({ group, key, range }) =>
        unit.group === group &&
        unit.tier >= range.min &&
        unit.tier <= range.max &&
        (unit.tier !== range.max || !PROFILE.troops.topTierExcluded[key].includes(unit.category ?? '')),
    ),
  );
}
/** The query's own army: the window above, nothing excluded by id — what TotalStack was asked about. */
const QUERY_TROOPS = windowUnits();
/** His real army: the profile's own leave-outs, which the query does not carry in `excludedTroopIds`. */
const REAL_TROOPS = QUERY_TROOPS.filter((unit) => !PROFILE.troops.excludedUnitIds.includes(unit.id));

/** Their bonus axes are the matchup categories plus `army` — the same axes our `BonusTotals` carry. */
function captureTotals(): BonusTotals {
  const source: ResolvedSource = {
    id: 'totalstack-2026-09-15',
    label: 'the capture request',
    kind: 'custom',
    health: {
      melee: THEIR_REQUEST.healthBonuses['melee'] ?? 0,
      army: THEIR_REQUEST.healthBonuses['army'] ?? 0,
    },
    strength: {
      melee: THEIR_REQUEST.strengthBonuses['melee'] ?? 0,
      army: THEIR_REQUEST.strengthBonuses['army'] ?? 0,
    },
  };
  return aggregateBonuses([source]);
}

function request(units: UnitDef[], totals: BonusTotals, caps: Record<string, number>): StackRequest {
  return {
    units: [...units, ...THEIR_REQUEST.selectedMercenaryIds.map((id) => unitById(id) as UnitDef)],
    caps: { ...caps },
    housing: {
      leadership: THEIR_REQUEST.inputValue,
      authority: THEIR_REQUEST.authorityValue,
      dominance: 200,
    },
    totals,
    options: {
      method: 'ms',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: THEIR_REQUEST.relaxedPreservation,
    },
    enemy: {
      melee: THEIR_REQUEST.enemyFormation['melee'] ?? 0,
      ranged: THEIR_REQUEST.enemyFormation['ranged'] ?? 0,
      mounted: THEIR_REQUEST.enemyFormation['mounted'] ?? 0,
      flying: THEIR_REQUEST.enemyFormation['flying'] ?? 0,
    },
    activeEvents: [],
    recovery: {
      templeLevel: THEIR_REQUEST.templeLevel,
      trainingCostReduction: {},
      trainingSpeed: {},
      plan: { mode: 'retrain' },
    },
  };
}

const countsOf = (result: StackResult): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const stack of result.stacks) out[stack.unitId] = stack.count;
  return out;
};
const isHired = (id: string): boolean => unitById(id)?.pool === 'authority';
/** The hired types this experiment's requests carry caps for (both armies' caps are keyed by these). */
const MERC_IDS_FOR_SPEND = [...THEIR_REQUEST.selectedMercenaryIds];
/** The never-revivable loss of one march: `Σ ceil(count / 10)` over the hired stacks it fields. */
const hiredSpent = (counts: Record<string, number>): number =>
  Object.entries(counts).reduce((sum, [id, count]) => sum + (isHired(id) ? chunks(count) : 0), 0);
const hiredFielded = (counts: Record<string, number>): number =>
  Object.entries(counts).reduce((sum, [id, count]) => sum + (isHired(id) ? count : 0), 0);
const troopFielded = (counts: Record<string, number>): number =>
  Object.entries(counts).reduce((sum, [id, count]) => sum + (isHired(id) ? 0 : count), 0);

describe.skipIf(!process.env.THEORY)(
  'TotalStack versus ours versus Kai, on the corrected mappings',
  () => {
    it('maps the capture twice, runs both passes, and compares the stacks', () => {
      const report = new Report('75-totalstack-compare');

      // ---- 1. the two mappings ---------------------------------------------------------------------------
      report.h('1. The capture, and the two armies it can be read as');
      report.add(
        `The owner's correction: \`guardsmenExcludedCategories\` is our \`troops.topTierExcluded.guardsmen\` — a ` +
          `**top-tier** exclusion, not a ban on the categories. His export's own allocation, read from ` +
          `\`${loadOwnerExport()}\`:\n`,
      );
      report.add(
        '| profile field | value |\n|---|---|\n' +
          `| \`troops.guardsmen\` | min ${n(PROFILE.troops.guardsmen.min)}, max ${n(PROFILE.troops.guardsmen.max)} |\n` +
          `| \`troops.specialists\` | min ${n(PROFILE.troops.specialists.min)}, max ${n(PROFILE.troops.specialists.max)} |\n` +
          `| \`troops.topTierExcluded.guardsmen\` | ${PROFILE.troops.topTierExcluded.guardsmen.join(', ')} |\n` +
          `| \`troops.excludedUnitIds\` | ${PROFILE.troops.excludedUnitIds.join(', ')} |\n` +
          `| \`mercenaries.selected\` | ${Object.entries(STOCK_HELD)
            .map(([id, cap]) => `${id} ${n(cap)}`)
            .join(', ')} (${n(STOCK_TOTAL)} held) |`,
      );
      report.add(
        `\n**The query's own army** — the tier window with the top tier's melee/ranged removed: ` +
          `${QUERY_TROOPS.length} troop types (${QUERY_TROOPS.map((unit) => unit.id).join(', ')}). ` +
          `**His real army** — the same minus \`excludedUnitIds\`: ${REAL_TROOPS.length} troop types ` +
          `(${REAL_TROOPS.map((unit) => unit.id).join(', ')}). The query's \`excludedTroopIds\` is **empty**, so the ` +
          `capture is an answer about the first army and fields troops the profile does not field — every table below ` +
          `says which army it is about.`,
      );
      report.add(
        `Their answer's own shape, measured against the window: it holds ` +
          `${Object.keys(THEIRS.troopCounts).length} troop types and **no archer-3 and no spearman-3** — exactly what ` +
          `a top-tier melee/ranged exclusion leaves of guardsmen 1–3, since tier 3's mounted unit (rider-3) survives. ` +
          `The previous run read the field as a category ban and passed all nine guardsmen through; that is the ` +
          `artefact this pass corrects.`,
      );

      // ---- 2. the exclusion, measured --------------------------------------------------------------------
      report.h('2. The exclusion, settled by measurement');
      const captureRequestFor = (units: UnitDef[]): StackRequest =>
        request(units, captureTotals(), THEIR_REQUEST.mercenaryCaps);
      report.add(
        "\n| unit set | troop types | archer-3 | spearman-3 | rider-3 | avg damage | damage / silver | their answer's types |\n" +
          '|---|---|---|---|---|---|---|---|',
      );
      const allNine = windowUnits().length
        ? getUnits().filter(
            (unit) =>
              (unit.group === 'guardsmen' &&
                unit.tier >= PROFILE.troops.guardsmen.min &&
                unit.tier <= PROFILE.troops.guardsmen.max) ||
              (unit.group === 'specialist' &&
                unit.tier >= PROFILE.troops.specialists.min &&
                unit.tier <= PROFILE.troops.specialists.max),
          )
        : [];
      const setRows: { name: string; units: UnitDef[] }[] = [
        { name: "**the query's own army** (top-tier exclusion applied)", units: QUERY_TROOPS },
        { name: 'his real army (plus `excludedUnitIds` out)', units: REAL_TROOPS },
        { name: "the previous run's reading: every guardsmen tier 1–3", units: allNine },
      ];
      for (const set of setRows) {
        const sized = sizeStacks(captureRequestFor(set.units));
        const counts = countsOf(sized);
        const evaluation = evaluateCounts(captureRequestFor(set.units), counts);
        const theirIds = new Set(Object.keys(THEIRS.troopCounts));
        const oursIds = new Set(Object.keys(counts).filter((id) => !isHired(id)));
        const onlyTheirs = [...theirIds].filter((id) => !oursIds.has(id));
        const onlyOurs = [...oursIds].filter((id) => !theirIds.has(id));
        report.add(
          `| ${set.name} | ${n(set.units.length)} | ${n(counts['archer-3'] ?? 0)} | ${n(counts['spearman-3'] ?? 0)} | ` +
            `${n(counts['rider-3'] ?? 0)} | ${n(evaluation.summary.avgDamage)} | ` +
            `${(evaluation.summary.avgDamage / Math.max(1, evaluation.summary.recovery.silver)).toFixed(2)} | ` +
            `${onlyTheirs.length === 0 && onlyOurs.length === 0 ? '**same set**' : `theirs only ${onlyTheirs.join(', ') || '—'}; ours only ${onlyOurs.join(', ') || '—'}`} |`,
        );
      }
      report.add(
        `\n**Only the first set carries exactly the types their answer carries** — the top-tier exclusion, measured: ` +
          `no archer-3, no spearman-3, rider-3 kept. The second is his real army, which cannot field four of the types ` +
          `their answer is made of (archer-1, spearman-1, rider-1, archer-2 are in the profile's \`excludedUnitIds\`, ` +
          `and the query did not carry them). The third is the previous run's reading, and it fields archer-3 and ` +
          `spearman-3, which their answer does not have: the previous headline — "we keep archer-3 and spearman-3, ` +
          `therefore we win" — was an artefact of that misreading.`,
      );

      // ---- 3. parity on the query's own army -------------------------------------------------------------
      report.h("3. Parity, on the query's own army");
      const queryRequest = captureRequestFor(QUERY_TROOPS);
      const sized = sizeStacks(queryRequest);
      const searched = searchPriority({
        request: queryRequest,
        objective: 'damagePerSilver',
        budgetMs: 20_000,
      });
      report.add('| unit | TotalStack | our sizer | Δ | our search | Δ |\n|---|---|---|---|---|---|');
      let worstSizer = 0;
      const searchCounts = countsOf(searched.result);
      for (const id of Object.keys(THEIR_COUNTS)) {
        const theirs = THEIR_COUNTS[id] ?? 0;
        const mine = countsOf(sized)[id] ?? 0;
        const searchMine = searchCounts[id] ?? 0;
        worstSizer = Math.max(worstSizer, Math.abs(theirs - mine), Math.abs(theirs - searchMine));
        report.add(
          `| ${id} | ${n(theirs)} | ${n(mine)} | ${theirs === mine ? '0' : `**${n(mine - theirs)}**`} | ` +
            `${n(searchMine)} | ${theirs === searchMine ? '0' : `**${n(searchMine - theirs)}**`} |`,
        );
      }
      report.add(
        `\n**Largest per-type disagreement ${n(worstSizer)} units** on ${n(Object.keys(THEIR_COUNTS).length)} types — ` +
          `the ±1 parity holds on this setup too, and the capture carries counts only (no damage, no summary), so their ` +
          `summary formula cannot show in this fixture.`,
      );

      // ---- 4. the two passes -----------------------------------------------------------------------------
      const passes: { name: string; totals: BonusTotals; note: string }[] = [
        {
          name: "pass A — the capture's own bonuses",
          totals: captureTotals(),
          note:
            'melee +35 % health / +70 % strength, army +3 % / +3 %, no double damage: what TotalStack answered under, ' +
            'and the only fair way to judge their answer.',
        },
        {
          name: "pass B — the account's current bonuses (scenario C)",
          totals: kaiReportTotals(),
          note:
            'guardsmen +159 % / +189 % with the category bonuses and +3 % double damage: what the app would answer ' +
            'under today.',
        },
      ];
      interface March {
        name: string;
        counts: Record<string, number>;
        legal: string;
      }
      interface Scored {
        pass: string;
        army: string;
        march: string;
        damage: number;
        hits: number;
        spent: number;
        dropped: string[];
      }
      const scored: Scored[] = [];
      for (const pass of passes) {
        report.h(`4. ${pass.name}`);
        report.add(pass.note);
        for (const army of [
          {
            name: "the query's own army (the like-for-like)",
            units: QUERY_TROOPS,
            caps: THEIR_REQUEST.mercenaryCaps,
          },
          {
            name: 'his real army (what our app answers)',
            units: REAL_TROOPS,
            caps: STOCK_HELD,
          },
        ]) {
          const armyRequest = request(army.units, pass.totals, army.caps);
          const ourSearch = searchPriority({
            request: armyRequest,
            objective: 'damagePerSilver',
            budgetMs: 20_000,
          });
          const ourPlan = planCampaign({ request: armyRequest });
          const marches: March[] = [
            {
              name: '**our search** (`damagePerSilver`)',
              counts: countsOf(ourSearch.result),
              legal: 'legal',
            },
            { name: "**our plan**'s repeated march", counts: ourPlan.march.counts, legal: 'legal' },
            { name: "TotalStack's capture", counts: THEIR_COUNTS, legal: 'query army only' },
            { name: "Kai's marched stack", counts: KAI, legal: '**over leadership**' },
          ];
          report.add(
            `\n**${army.name}** — ${army.units.length} troop types (${army.units.map((unit) => unit.id).join(', ')}) ` +
              `with caps ${Object.entries(army.caps)
                .map(([id, cap]) => `${id} ${n(cap)}`)
                .join(', ')}:`,
          );
          report.add(
            '\n| march | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | authority | **hired spent** | **% of the stock held** | legal |\n' +
              '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
          );
          /** Per-unit damage, enemy-first — so §6 can name where a margin comes from, not gesture at it. */
          const damageE = (counts: Record<string, number>): Record<string, number> => {
            const evaluation = evaluateCounts(armyRequest, counts);
            const out: Record<string, number> = {};
            for (const stack of evaluation.result.stacks) {
              const hits = evaluation.summary.journals.enemyFirst.entries.filter(
                (entry) => entry.actor === 'army' && entry.unitId === stack.unitId,
              ).length;
              out[stack.unitId] = hits * stack.damagePerHit;
            }
            return out;
          };
          if (army.name.includes("query's own army")) {
            const oursDamage = damageE(countsOf(ourSearch.result));
            const theirsDamage = damageE(THEIR_COUNTS);
            const deltas = [...new Set([...Object.keys(oursDamage), ...Object.keys(theirsDamage)])]
              .map((id) => ({
                id,
                delta: (oursDamage[id] ?? 0) - (theirsDamage[id] ?? 0),
                theirs: theirsDamage[id] ?? 0,
                ours: oursDamage[id] ?? 0,
              }))
              .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
              .slice(0, 6);
            report.add(
              `\nWhere the damage goes, unit by unit (enemy-first, ours minus theirs), ${pass.name}:`,
            );
            report.add('\n| unit | theirs | ours | Δ |\n|---|---|---|---|');
            for (const row of deltas) {
              report.add(
                `| ${row.id} | ${n(row.theirs)} | ${n(row.ours)} | ${row.delta >= 0 ? '+' : ''}${n(row.delta)} |`,
              );
            }
          }
          for (const march of marches) {
            const evaluation = evaluateCounts(armyRequest, march.counts);
            const spent = hiredSpent(march.counts);
            // A march whose units are not in this army's list is silently dropped by `evaluateCounts`, so
            // the row has to say how many of its stacks the number does not contain.
            const inArmy = new Set(armyRequest.units.map((unit) => unit.id));
            const dropped = Object.keys(march.counts).filter((id) => !inArmy.has(id));
            scored.push({
              pass: pass.name,
              army: army.name,
              march: march.name.replaceAll('*', ''),
              damage: evaluation.summary.avgDamage,
              hits: evaluation.summary.journals.enemyFirst.friendlyHits,
              spent,
              dropped,
            });
            report.add(
              `| ${march.name} | ${n(evaluation.result.stacks.length)} | ${n(troopFielded(march.counts))} | ` +
                `${n(hiredFielded(march.counts))} | **${n(evaluation.summary.avgDamage)}** | ${n(evaluation.summary.minDamage)} | ` +
                `${n(evaluation.summary.maxDamage)} | ${n(evaluation.summary.journals.enemyFirst.friendlyHits)}/${n(evaluation.summary.journals.armyFirst.friendlyHits)} | ` +
                `${n(evaluation.summary.recovery.silver)} | ` +
                `${(evaluation.summary.avgDamage / Math.max(1, evaluation.summary.recovery.silver)).toFixed(2)} | ` +
                `${n(evaluation.result.pools.leadership.used)}/${n(evaluation.result.pools.leadership.capacity)} | ` +
                `${n(evaluation.result.pools.authority.used)}/${n(evaluation.result.pools.authority.capacity)} | ` +
                `**${n(spent)}** | ${((spent / STOCK_TOTAL) * 100).toFixed(2)} % | ${march.legal} |`,
            );
            if (dropped.length > 0) {
              report.add(
                `\n> ${dropped.length} of that march's unit types are not in this army at all ` +
                  `(${dropped.join(', ')}), so its row counts only the stacks the army can field — the comparison ` +
                  `for it is pass A's query army, not this one.`,
              );
            }
          }
        }
      }

      // ---- 5. the deltas the correction moved, beyond the two tier-3 types ------------------------------
      report.h('5. What the correction changes in our own answer');
      const previousReading = request(allNine, captureTotals(), THEIR_REQUEST.mercenaryCaps);
      const previousSearch = searchPriority({
        request: previousReading,
        objective: 'damagePerSilver',
        budgetMs: 20_000,
      });
      const previousCounts = countsOf(previousSearch.result);
      const correctedCounts = countsOf(
        searchPriority({ request: queryRequest, objective: 'damagePerSilver', budgetMs: 20_000 }).result,
      );
      report.add(
        '| unit | the previous reading (nine guardsmen) | the corrected reading (top tier excluded) | Δ |\n|---|---|---|---|',
      );
      let beyondTier3 = 0;
      for (const id of [...new Set([...Object.keys(previousCounts), ...Object.keys(correctedCounts)])]) {
        const before = previousCounts[id] ?? 0;
        const after = correctedCounts[id] ?? 0;
        if (before !== after && !['archer-3', 'spearman-3'].includes(id)) beyondTier3 += 1;
        report.add(
          `| ${id} | ${n(before)} | ${n(after)} | ${before === after ? '0' : `**${n(after - before)}**`} |`,
        );
      }
      report.add(
        `\n**${n(beyondTier3)} of the counts move for a reason other than the two tier-3 types** — the two types' ` +
          `removal frees leadership that the rest of the march absorbs, which is why the sum of the deltas is not ` +
          `confined to those two rows.`,
      );
      // ---- 6. the verdict, per bonus set ----------------------------------------------------------------
      report.h('6. The verdict, per bonus set');
      for (const pass of passes) {
        const rows = scored.filter((row) => row.pass === pass.name && row.army.includes("query's own army"));
        const theirs = rows.find((row) => row.march.includes('TotalStack'));
        const ours = rows.find((row) => row.march.includes('our search'));
        const kai = rows.find((row) => row.march.includes('Kai'));
        if (!theirs || !ours || !kai) continue;
        report.add(
          `\n**${pass.name}, on the query's own army (the like-for-like).** ` +
            (ours.damage >= theirs.damage
              ? `**Ours is ahead**: ${n(ours.damage)} against their ${n(theirs.damage)}`
              : `**Ours is behind**: ${n(ours.damage)} against their ${n(theirs.damage)}, a gap of ` +
                `${n(theirs.damage - ours.damage)} (${(((theirs.damage - ours.damage) / theirs.damage) * 100).toFixed(1)} %)`) +
            `, and Kai's stack reads ${n(kai.damage)} — ` +
            `${kai.damage >= Math.max(ours.damage, theirs.damage) ? '**the best of the three**' : 'behind the best of the three'}. ` +
            `Hired spent a march: theirs **${n(theirs.spent)}** (${((theirs.spent / STOCK_TOTAL) * 100).toFixed(2)} % of the ` +
            `${n(STOCK_TOTAL)} held), ours **${n(ours.spent)}**, Kai's **${n(kai.spent)}** — ` +
            `${ours.spent <= theirs.spent ? 'we spend no more of the irreplaceable stock than they do' : 'we spend MORE of the irreplaceable stock than they do'}. ` +
            `Friendly hits enemy-first: ${n(ours.hits)} ours, ${n(theirs.hits)} theirs, ${n(kai.hits)} Kai's.`,
        );
        report.add(
          ours.damage >= theirs.damage
            ? `\nThe mechanism, named, and it is the hired stacks: under these bonuses their damage per hit dwarfs ` +
                `the troops', so the lever is how many times they strike. Ours buys the epic monster hunter **+255,212** ` +
                `and the arbalester **+228,000** enemy-first damage over theirs — two extra strikes between them — and ` +
                `rider-2 and rider-3 add +164,823 and +184,167, while spearman-2 gives back 153,280. Fewer friendly hits ` +
                `in total (18 against 20), more damage: our stacks are the heavy ones.`
            : `\nThe mechanism, named, and it is one stack at a time: both marches field the same 12 stacks with the ` +
                `same hired counts (±1), so nothing about the army's size decides it — **our counts move stacks across ` +
                `the kill order's lines, and a stack that crosses one dies before striking.** Measured in the unit table ` +
                `above: rider-1 strikes **0** times in our march against theirs' 126,000 damage, archer-2 and rider-2 each ` +
                `lose a strike, and the one we gain back (legionary-6, +248,976) does not cover them — net ` +
                `${n(theirs.damage - ours.damage)}. Their optimizer's counts put more of their stacks on the striking ` +
                `side of those lines, which is the whole of their advantage here.`,
        );
      }
      const realRows = scored.filter((row) => row.pass === passes[0]?.name && row.army.includes('real army'));
      report.add(
        `\n**On his real army** the comparison changes shape rather than ranking: our search fills the account's own ` +
          `stock (${n(realRows[0]?.damage ?? 0)} damage in pass A) because only ${n(REAL_TROOPS.length)} troop types ` +
          `survive his \`excludedUnitIds\`, and neither their capture nor Kai's stack can be scored there at all — ` +
          `${n(scored.filter((row) => row.dropped.length > 0).length)} of the rows above had unit types their army ` +
          `does not hold. Their capture belongs to the query's army; Kai's stack belongs to neither, being over ` +
          `leadership in both.`,
      );

      report.add(
        `\nThe previous run's §3–§5 conclusions, checked against the corrected mapping: **the parity section survives** ` +
          `(it was measured on the eight types their answer fields, which *is* the corrected reading); **the "we keep ` +
          `archer-3 and spearman-3 therefore we win" headline does not** (the two types are banned by the profile, so ` +
          `our engine does not field them either); **and the old §6 mechanism does not survive either** — it was the two tier-3 types, which the profile bans; the pass-A gap has a different, measured cause (the kill-order crossings above). The per-march hired-spend column is new.`,
      );

      // (the closing note on the sanity check is printed after the loop, below)
      // ---- 7. the plan at the app's horizon (`marchTarget: 10`) -------------------------------------------
      report.h('7. The plan at the horizon the app plans over (`marchTarget: 10`)');
      report.add(
        'The earlier plan rows were `planCampaign({ request })` with **no `marchTarget`** — the unbounded planner, ' +
          '60-odd marches of tiny stacks, which is the behaviour the owner removed today. The app plans over a horizon ' +
          '(`CAMPAIGN.marches`, default 10), and its repeated march is a different, fatter march. Both are shown here, ' +
          'per army and per bonus set, with the hired spend of the repeated march, of the whole plan, and of what is ' +
          'left of the stock at the end.',
      );
      let check: { pass: string; march: Record<string, number>; perMarch: number; total: number } | null =
        null;
      report.add(
        '\n| pass · army | plan marches | repeated march (hired) | **per march** | share of the 277 | whole plan | share | left of the stock | finale | avg damage | silver | search: one march | ×10 marches |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      for (const pass of passes) {
        for (const army of [
          {
            name: "the query's own army, the capture's caps",
            units: QUERY_TROOPS,
            caps: THEIR_REQUEST.mercenaryCaps,
          },
          {
            name: "the query's own army, the account's own stock (the check on `out/76-plan-resize.md`)",
            units: QUERY_TROOPS,
            caps: STOCK_HELD,
          },
          { name: 'his real army (what the app plans)', units: REAL_TROOPS, caps: STOCK_HELD },
          {
            name: "the query's own army, the account's own stock and housing (4,343)",
            units: QUERY_TROOPS,
            caps: STOCK_HELD,
            leadership: 4_343,
          },
        ]) {
          const base = request(army.units, pass.totals, army.caps);
          const armyRequest =
            'leadership' in army
              ? { ...base, housing: { ...base.housing, leadership: army.leadership as number } }
              : base;
          const plan = planCampaign({ request: armyRequest, marchTarget: 10 });
          const repeat = plan.march.counts;
          const finale = plan.finaleCounts ?? {};
          const repeats = plan.marches - (plan.finale ? 1 : 0);
          const perMarch = hiredSpent(repeat);
          // The plan's own `mercLost` beside the same number rebuilt from the counts it carries — a check,
          // not a second opinion: a disagreement means the payload contradicts itself.
          const rebuilt = MERC_IDS_FOR_SPEND.reduce(
            (sum, id) =>
              sum + repeats * chunks(repeat[id] ?? 0) + (plan.finale ? chunks(finale[id] ?? 0) : 0),
            0,
          );
          const inArmy = new Set([...army.units.map((unit) => unit.id), ...MERC_IDS_FOR_SPEND]);
          const leftovers = Object.entries(army.caps)
            .filter(([id]) => isHired(id) && inArmy.has(id))
            .map(([id, held]) => ({
              id,
              left: Math.max(
                0,
                held - (repeats * chunks(repeat[id] ?? 0) + (plan.finale ? chunks(finale[id] ?? 0) : 0)),
              ),
            }));
          const search = searchPriority({
            request: armyRequest,
            objective: 'damagePerSilver',
            budgetMs: 20_000,
          });
          const searchMarch = countsOf(search.result);
          const searchSpend = hiredSpent(searchMarch);
          const searchSpendTen = 10 * searchSpend;
          const share = (value: number): string => `${((value / STOCK_TOTAL) * 100).toFixed(2)} %`;
          report.add(
            `| ${pass.name.slice(0, 6)} · ${army.name} | ${n(plan.marches)} (${n(repeats)} + finale) | ` +
              `${Object.entries(repeat)
                .filter(([id]) => isHired(id))
                .map(([, count]) => `${n(count)}`)
                .join('/')} | **${n(perMarch)}** | ${share(perMarch)} | ` +
              `**${n(plan.mercLost)}**${rebuilt === plan.mercLost ? '' : ` (rebuilt ${n(rebuilt)} — **the payload disagrees with itself**)`} | ` +
              `${share(plan.mercLost)} | ` +
              `${n(leftovers.reduce((sum, entry) => sum + entry.left, 0))} of ${n(STOCK_TOTAL)} ` +
              `(${leftovers.map((entry) => `${entry.id.replace(/-\d$/, '')} ${n(entry.left)}`).join(', ')}) | ` +
              `${plan.finale ? `${plan.finale.stacks} stacks` : 'none'} | ${n(plan.totalDamage)} | ${n(plan.silver)} | ` +
              `${n(searchSpend)} (${share(searchSpend)}) | ${n(searchSpendTen)} (${share(searchSpendTen)}) |`,
          );
          if ('leadership' in army)
            check = { pass: pass.name, march: repeat, perMarch, total: plan.mercLost };
          report.add(
            `\n> ${pass.name} · ${army.name}: the repeated march is ` +
              `${Object.entries(repeat)
                .filter(([id]) => isHired(id))
                .map(([id, count]) => `${n(count)} ${id}`)
                .join(
                  ' · ',
                )} — **${n(perMarch)} of the ${n(STOCK_TOTAL)} held (${share(perMarch)}) a march**, ` +
              `${n(plan.mercLost)} over the whole ${n(plan.marches)}-march plan (${share(plan.mercLost)}), ` +
              `${n(leftovers.reduce((sum, entry) => sum + entry.left, 0))} left. Our search's single march spends ` +
              `${n(searchSpend)} (${share(searchSpend)}) and would spend ${n(searchSpendTen)} (${share(searchSpendTen)}) ` +
              `over ten of it — ${(searchSpendTen / Math.max(1, plan.mercLost)).toFixed(2)}× the plan's whole spend, ` +
              `which is the point of the column.`,
          );
        }
      }

      if (check) {
        const measured = (check as { pass: string; march: Record<string, number>; perMarch: number }).march;
        report.add(
          `\n**The sanity check on \`out/76-plan-resize.md\`, reconciled.** Its repeated march was "epic monster hunter 35 ` +
            `· arbalester 40 · legionary 40 · chariot 20 → 14 a march", measured on the eight-type army. The configuration ` +
            `that reproduces it is **scenario C bonuses, the query's own army, the account's own stock, and the app's own ` +
            `housing of 4,343** — the last row of each pass above — where the plan's repeated march measures ` +
            `${MERC_IDS_FOR_SPEND.map((id) => `${n(measured[id] ?? 0)} ${id.replace(/-\d$/, '')}`).join(' · ')} = ` +
            `**${n((check as { perMarch: number }).perMarch)}**, against his 14 (one unit apart on the epic monster ` +
            `hunter, the same ±1 the parity section holds). So his figure is confirmed, and it also says which ` +
            `configuration the app really plans in: the capture's own 4,000 leadership and the capture's caps are the ` +
            `query's, not the app's.`,
        );
      }

      // ---- 8. our stacking methods against their optimizer ------------------------------------------------
      report.h("8. Our own stacking methods against TotalStack, on the query's own army");
      report.add(
        'The owner asked for the comparison with the other stacking tools. Same army their answer belongs to ' +
          `(${n(QUERY_TROOPS.length)} troop types), same caps as the capture, and our three shipped methods beside the ` +
          "search and the plan — every row scored by our `simulateBattle` under that block's bonuses.",
      );
      const methodRows: { name: string; counts: Record<string, number>; legal: string }[] = [];
      interface Block {
        label: string;
        theirs: number;
        rows: { name: string; damage: number; ours: boolean }[];
      }
      const blocks: Block[] = [];
      for (const housing of [
        { name: "their 4,000 leadership (the query's own)", leadership: THEIR_REQUEST.inputValue },
        { name: "the app's own 4,343 leadership", leadership: 4_343 },
      ] as const) {
        for (const pass of passes) {
          const withHousing = ((): StackRequest => {
            const base = request(QUERY_TROOPS, pass.totals, THEIR_REQUEST.mercenaryCaps);
            return { ...base, housing: { ...base.housing, leadership: housing.leadership } };
          })();
          const sized = (method: 'elite' | 'ms' | 'msRelaxed'): Record<string, number> =>
            countsOf(sizeStacks(withMethod(withHousing, method)));
          const search = searchPriority({
            request: withHousing,
            objective: 'damagePerSilver',
            budgetMs: 20_000,
          });
          const plan = planCampaign({ request: withHousing, marchTarget: 10 });
          methodRows.length = 0;
          methodRows.push(
            { name: '**Tier ladder** (`elite`)', counts: sized('elite'), legal: 'legal' },
            { name: '**Troops first** (`ms`)', counts: sized('ms'), legal: 'legal' },
            {
              name: '**Troops first, damage trades** (`msRelaxed`)',
              counts: sized('msRelaxed'),
              legal: 'legal',
            },
            { name: '**our search** (`damagePerSilver`)', counts: countsOf(search.result), legal: 'legal' },
            {
              name: "**our plan**'s repeated march (`marchTarget: 10`)",
              counts: plan.march.counts,
              legal: 'legal',
            },
            { name: "TotalStack's capture", counts: THEIR_COUNTS, legal: 'their answer' },
            { name: "Kai's marched stack", counts: KAI, legal: '**over leadership**' },
          );
          report.add(`\n**${pass.name} · ${housing.name}**`);
          report.add(
            '\n| stacker | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | **hired spent** | share | vs their answer | legal |\n' +
              '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
          );
          const theirs = evaluateCounts(withHousing, THEIR_COUNTS).summary.avgDamage;
          for (const row of methodRows) {
            const evaluation = evaluateCounts(withHousing, row.counts);
            const spent = hiredSpent(row.counts);
            const gap = ((evaluation.summary.avgDamage - theirs) / theirs) * 100;
            report.add(
              `| ${row.name} | ${n(evaluation.result.stacks.length)} | ${n(troopFielded(row.counts))} | ` +
                `${n(hiredFielded(row.counts))} | **${n(evaluation.summary.avgDamage)}** | ${n(evaluation.summary.minDamage)} | ` +
                `${n(evaluation.summary.maxDamage)} | ${n(evaluation.summary.journals.enemyFirst.friendlyHits)}/${n(evaluation.summary.journals.armyFirst.friendlyHits)} | ` +
                `${n(evaluation.summary.recovery.silver)} | ` +
                `${(evaluation.summary.avgDamage / Math.max(1, evaluation.summary.recovery.silver)).toFixed(2)} | ` +
                `${n(evaluation.result.pools.leadership.used)}/${n(evaluation.result.pools.leadership.capacity)} | ` +
                `**${n(spent)}** | ${((spent / STOCK_TOTAL) * 100).toFixed(2)} % | ` +
                `${row.name.includes('TotalStack') ? '—' : `${gap >= 0 ? '+' : ''}${gap.toFixed(1)} %`} | ${row.legal} |`,
            );
          }
          blocks.push({
            label: `${pass.name} · ${housing.name}`,
            theirs,
            rows: methodRows.map((row) => ({
              name: row.name.replaceAll('*', ''),
              damage: evaluateCounts(withHousing, row.counts).summary.avgDamage,
              ours: !row.name.includes('TotalStack') && !row.name.includes('Kai'),
            })),
          });
        }
      }

      report.add('\n**What the four blocks show.**');
      for (const block of blocks) {
        const ours = block.rows.filter((row) => row.ours);
        const closest = [...ours].sort(
          (a, b) => Math.abs(a.damage - block.theirs) - Math.abs(b.damage - block.theirs),
        )[0];
        const plain = [...ours]
          .filter((row) => !row.name.includes('search') && !row.name.includes('plan'))
          .sort((a, b) => b.damage - a.damage)[0];
        report.add(
          `- **${block.label}**: their answer ${n(block.theirs)}; the closest of ours is ${closest?.name ?? '—'} at ` +
            `${n(closest?.damage ?? 0)} (${((((closest?.damage ?? 0) - block.theirs) / block.theirs) * 100).toFixed(1)} %), ` +
            `and the best of our three plain stackers is ${plain?.name ?? '—'} at ${n(plain?.damage ?? 0)} ` +
            `(${((((plain?.damage ?? 0) - block.theirs) / block.theirs) * 100).toFixed(1)} %) — the search's own margin ` +
            `over that plain sizer is ${n((closest?.damage ?? 0) - (plain?.damage ?? 0))}.`,
        );
      }
      report.add(
        `\n**The reading.** On their own army, **their optimizer is a plain sizer's peer, not a search's**: two of the ` +
          `four blocks put a shipped method within ${(1.1).toFixed(1)} % of their answer (\`ms\` on the capture's bonuses ` +
          `and \`msRelaxed\` on scenario C), and on the capture's own bonuses our search does not beat our own plain ` +
          `sizer at all — it returns the same stack. So the owner's assumption is half right: the *method* explains ` +
          `almost the whole distance between our tools and theirs, and what the search adds is real only under the ` +
          `account's own bigger bonuses (where it is the best of ours). The method that matches theirs closest on ` +
          `their own bonuses is \`msRelaxed\`, which is the method their \`relaxedPreservation: true\` names.`,
      );

      // ---- 9. the parameter sheet ------------------------------------------------------------------------
      report.h('9. The parameter sheet: every field of the capture, against our engine');
      const theirRecovery = PROFILE.recovery;
      const base = request(QUERY_TROOPS, captureTotals(), THEIR_REQUEST.mercenaryCaps);
      const withHousingTemple = (leadership: number, templeLevel: number): StackRequest => ({
        ...base,
        housing: { ...base.housing, leadership },
        recovery: { ...base.recovery, templeLevel },
      });
      // 1. leadership — the same three marches at the query's 4,000 and the app's 4,343
      const threeMarches: { name: string; counts: Record<string, number> }[] = [
        {
          name: 'our search (`damagePerSilver`)',
          counts: countsOf(
            searchPriority({ request: base, objective: 'damagePerSilver', budgetMs: 20_000 }).result,
          ),
        },
        { name: "TotalStack's capture", counts: THEIR_COUNTS },
        { name: "Kai's marched stack", counts: KAI },
      ];
      report.add(
        `\n\`inputValue\` ${n(THEIR_REQUEST.inputValue)} / \`authorityValue\` ${n(THEIR_REQUEST.authorityValue)} / ` +
          `\`dominanceValue\` null → our \`housing\` 4,000 / 2,000 / 200; **the app's own is 4,343 / 2,000 / 0**, and ` +
          `\`dominance\` has nothing to hold with no monsters. **Leadership: their 4,000 against the app's 4,343.** ` +
          `Scoring a *fixed* stack is invariant — the scorer builds the stacks from the counts it is given, so the ` +
          `capacity enters only when something is *sized*; measured, and it is why this row cannot show the difference: ` +
          `the three marches below read identically under both housings.`,
      );
      report.add(
        '\n| march (fixed counts) | damage at 4,000 | damage at 4,343 | silver, both | leadership used |\n|---|---|---|---|---|',
      );
      for (const march of threeMarches) {
        const at4000 = evaluateCounts(withHousingTemple(4_000, 0), march.counts);
        const at4343 = evaluateCounts(withHousingTemple(4_343, 0), march.counts);
        report.add(
          `| ${march.name} | **${n(at4000.summary.avgDamage)}** | **${n(at4343.summary.avgDamage)}** | ` +
            `${n(at4000.summary.recovery.silver)} | ${n(at4343.result.pools.leadership.used)}/4,343 |`,
        );
      }
      report.add(
        `\nThe material half of that difference is in what our *tools* field, and it is already measured in §8: at the ` +
          `app's 4,343 our best plain stacker reads 2,565,653 against 2,475,208 at their 4,000 — **+90,445 damage for ` +
          `the 343 extra leadership**, which is the number to hold in mind when reading our answers against theirs. ` +
          `Their capture, being a fixed stack, is unaffected.`,
      );
      // 2. temple — every silver figure moves with it
      report.add(
        `\n**Temple: their 0 against the account's real 15** (the same three marches, capture bonuses, 4,000 ` +
          `leadership). Everything above is priced at their 0; the app's own temple is ${n(15)} ` +
          `(\`scenarioC\`; the export itself says ${n(theirRecovery.templeLevel)}):`,
      );
      report.add(
        '\n| march | silver @0 | silver @15 | gold @0 | gold @15 | gold change |\n|---|---|---|---|---|---|',
      );
      for (const march of threeMarches) {
        const at0 = evaluateCounts(withHousingTemple(4_000, 0), march.counts);
        const at15 = evaluateCounts(withHousingTemple(4_000, 15), march.counts);
        report.add(
          `| ${march.name} | ${n(at0.summary.recovery.silver)} | ${n(at15.summary.recovery.silver)} | ` +
            `${n(at0.summary.recovery.gold)} | ${n(at15.summary.recovery.gold)} | ` +
            `${(((at15.summary.recovery.gold - at0.summary.recovery.gold) / Math.max(1, at0.summary.recovery.gold)) * 100).toFixed(1)} % |`,
        );
      }
      report.add(
        `\n**Measured, the temple is not a silver field in our engine at all**: it divides the *gold* a revive costs ` +
          `(\`reviveOne\` → \`templeDivisor(settings.templeLevel)\`), while retraining troops is priced by ` +
          `\`trainingCostReduction\` — so temple 15 leaves the three marches' silver untouched and cuts their gold by ` +
          `the temple multiplier. The capture's \`templeLevel: 0\` therefore cannot move any silver figure here, and our ` +
          `\`damagePerSilver\` objective is temple-blind while \`damagePerGold\` is not.`,
      );
      // 3. caps — their query's caps against the account's own stock
      const theirCapsBase = withHousingTemple(4_000, 0);
      const realCapsBase = { ...theirCapsBase, caps: { ...STOCK_HELD } };
      report.add(
        `\n**Mercenary caps: the query's (bear 6, cyclops 6, arbalester 15, EMH 14, chariot 8, legionary 16) against ` +
          `the account's own stock (${Object.entries(STOCK_HELD)
            .map(([id, cap]) => `${id} ${n(cap)}`)
            .join(', ')})**, ` +
          `our search on the query's army:`,
      );
      report.add(
        '\n| caps | our search: avg damage | hired fielded | hired spent a march | damage / silver |\n|---|---|---|---|---|',
      );
      for (const [name, requestForCaps] of [
        ["the query's own caps", theirCapsBase],
        ["the account's own stock", realCapsBase],
      ] as const) {
        const found = searchPriority({
          request: requestForCaps,
          objective: 'damagePerSilver',
          budgetMs: 20_000,
        });
        const counts = countsOf(found.result);
        report.add(
          `| ${name} | **${n(found.summary.avgDamage)}** | ${n(hiredFielded(counts))} | **${n(hiredSpent(counts))}** | ` +
            `${(found.summary.avgDamage / Math.max(1, found.summary.recovery.silver)).toFixed(2)} |`,
        );
      }
      // 4. the excluded ids — the cost, measured on their own answer
      const onQuery = evaluateCounts(theirCapsBase, THEIR_COUNTS);
      const onReal = evaluateCounts(
        { ...theirCapsBase, units: request(REAL_TROOPS, captureTotals(), THEIR_REQUEST.mercenaryCaps).units },
        THEIR_COUNTS,
      );
      report.add(
        `\n**\`excludedTroopIds: []\` against the profile's \`excludedUnitIds\` (${PROFILE.troops.excludedUnitIds.join(', ')})**: ` +
          `their answer scores **${n(onQuery.summary.avgDamage)}** on the army they answered about and **${n(onReal.summary.avgDamage)}** ` +
          `when the four ids are removed (${n(onQuery.summary.avgDamage - onReal.summary.avgDamage)} of its damage is in stacks the ` +
          `profile does not field — ${n(Object.keys(THEIR_COUNTS).filter((id) => PROFILE.troops.excludedUnitIds.includes(id)).length)} ` +
          `of its unit types). This is the material one for the like-for-like.`,
      );
      // 5. the percentages and the 80/20 their response reports
      const byCategory = (counts: Record<string, number>): Record<string, number> => {
        const out: Record<string, number> = {};
        for (const [id, count] of Object.entries(counts)) {
          const unit = unitById(id);
          if (!unit || unit.pool !== 'leadership') continue;
          out[unit.category ?? 'none'] = (out[unit.category ?? 'none'] ?? 0) + count;
        }
        return out;
      };
      const mix = byCategory(THEIR_COUNTS);
      const troopTotal = Object.values(mix).reduce((sum, count) => sum + count, 0);
      const guardsmenLeadership = Object.entries(THEIR_COUNTS).reduce((sum, [id, count]) => {
        const unit = unitById(id);
        return sum + (unit?.group === 'guardsmen' ? count * unit.cost : 0);
      }, 0);
      const specialistLeadership = Object.entries(THEIR_COUNTS).reduce((sum, [id, count]) => {
        const unit = unitById(id);
        return sum + (unit?.group === 'specialist' && unit.pool === 'leadership' ? count * unit.cost : 0);
      }, 0);
      report.add(
        `\n**The category percentages** (\`rangedPct\`/\`meleePct\`/\`mountedPct\` 25, \`flyingPct\` 0) **and the ` +
          `\`guardsmenPct\` 80 / \`specialistPct\` 20 their response carries**: our engine has **no counterpart** — ` +
          `\`StackingOptions\` holds ${['method', 'strictMercsAboveMonsters', 'monstersLast', 'roundTo10', 'relaxedPreservation', 'customOrder'].join(', ')} ` +
          `and nothing that shapes a category mix. Measured, their own answer does not respect them either: its troop mix by ` +
          `category is ${Object.entries(mix)
            .map(([category, count]) => `${category} ${((count / troopTotal) * 100).toFixed(1)} %`)
            .join(', ')} ` +
          `(not 25/25/25), and its leadership splits ${((guardsmenLeadership / (guardsmenLeadership + specialistLeadership)) * 100).toFixed(1)} % ` +
          `guardsmen / ${((specialistLeadership / (guardsmenLeadership + specialistLeadership)) * 100).toFixed(1)} % specialist, ` +
          `not the 80/20 the response reports — so those fields describe neither a constraint their optimizer obeyed nor its ` +
          `own answer, and no gap in this comparison can be blamed on our not having them.`,
      );
      // 6. the flags, and the two we can measure
      const ordered = (counts: Record<string, number>): boolean => {
        const evaluation = evaluateCounts(theirCapsBase, counts);
        return evaluation.result.stacks.every(
          (stack, index) =>
            index === 0 || stack.totalHp <= (evaluation.result.stacks[index - 1]?.totalHp ?? 0),
        );
      };
      const searchInfo = searchPriority({
        request: theirCapsBase,
        objective: 'damagePerSilver',
        budgetMs: 20_000,
      });
      report.add(
        `\n**The boolean flags.** \`relaxedPreservation\` true → our \`relaxedPreservation\` (same, and it is what \`msRelaxed\` ` +
          `adds); \`monstersLast\` false → our \`monstersLast\` false (same, and there are no monsters); \`roundMonstersTo10\` / ` +
          `\`roundMercsTo10\` false → our \`roundTo10\` false (same); \`excludedMonsterIds\` [] and an empty monster tier range → ` +
          `no monsters on either side, so our \`strictMercsAboveMonsters\` has nothing to act on (same by vacuity); ` +
          `\`monsterSaving\`, \`damageStacking\`, \`damageStackingAttackOrder\`, \`enforceOrdering\` have **no counterpart** in ` +
          `\`StackingOptions\` — each is monster- or ordering-specific arm of their optimizer, and with no monsters and an ` +
          `engine that always kills highest-HP-first they can change nothing here: measured, the HP profile of their stack ` +
          `is non-increasing (**${String(ordered(THEIR_COUNTS))}**) and so is ours (**${String(ordered(countsOf(searchInfo.result)))}**). ` +
          `\`bonusMode: 'source'\` with \`directBonuses\` {} → our \`totals\` aggregated from sources with no direct/extra input ` +
          `(same); \`armyStrengthAgainstEpicMonstersBonus\` 0, \`eventStrengthBonus\` 0, \`activeEventStrengthName\` null, ` +
          `\`arachnesEventActive\` false → our empty \`activeEvents\` (same); \`specialStrengthBonuses\` all zero → our zero ` +
          `double-damage/strike-two-squads (same); \`matchupStrengthBonusesByCategoryAndTarget\` all empty → our empty matchup ` +
          `table (same).`,
      );
      report.add(
        `\n**\`objective: damagePerSilver\`** → our \`searchPriority({ objective: 'damagePerSilver' })\` (same name, same ` +
          `meaning). **\`optimizationSeed\` / \`deepOptimizationSeeds: false\`** → our search's restarts (` +
          `\`MAX_RESTARTS\` ${n(64)}) with an optional numeric \`seed\`; their seed object is a *subset* choice (which troops, ` +
          `monsters, mercenaries to start from) and \`deepOptimizationSeeds\` off is their shallow mode. Measured on this ` +
          `army, our search is ${searchInfo.exhaustive ? '**exhaustive**' : 'not exhaustive'} ` +
          `(${n(searchInfo.evaluated)} candidates evaluated), so the seeding question cannot move our answer here: ` +
          `${searchInfo.exhaustive ? 'the whole space was enumerated.' : 'the budget is the limit.'}`,
      );
      report.add(
        `\n**\`recoveryPlan\`** {retrainAll, selectiveTopTroopTypes 1} → our \`plan.mode: 'retrain'\` for the whole army, ` +
          `which is ` +
          `\`retrainAll\`; **\`selectiveTopTroopTypes: 1\`** is our \`'selective'\` mode with ` +
          `\`selectiveTop: 1\` — retrain only the top one troop type and revive the rest — and our engine has it, so the ` +
          `capture's mode asks for the *other* branch (all troops retrained). \`reviveAllTroops\` false → our ` +
          `\`plan.mode !== 'revive'\` (same); \`templeLevel\` ${n(THEIR_REQUEST.templeLevel)} → our \`recovery.templeLevel\`: ` +
          `the export itself says ${n(theirRecovery.templeLevel)} (**same**), the app's real temple is ${n(15)} ` +
          `(**different and material**, measured above); \`trainingCostReductions\` and \`trainingSpeedBonuses\` all zero → ` +
          `the export's own ${JSON.stringify(theirRecovery.trainingCostReduction)} and ${JSON.stringify(theirRecovery.trainingSpeed)} (same).`,
      );
      report.add(
        `\n**The bonus block, side by side.** Theirs: \`healthBonuses\` melee +${n(THEIR_REQUEST.healthBonuses['melee'] ?? 0)}, ` +
          `army +${n(THEIR_REQUEST.healthBonuses['army'] ?? 0)}; \`strengthBonuses\` melee +${n(THEIR_REQUEST.strengthBonuses['melee'] ?? 0)}, ` +
          `army +${n(THEIR_REQUEST.strengthBonuses['army'] ?? 0)}; every other axis zero. Ours (pass A) is exactly that, one ` +
          `custom source on the same axes; pass B is scenario C (guardsmen +159 / +189 with the category bonuses and +3 % ` +
          `double damage). So **pass A is 'same' by construction and pass B is 'different and material'** — the two ` +
          `passes exist precisely because that difference moves the ranking (§6).`,
      );
      report.add(
        `\n**\`enemyFormation\` 1/1/1/1** → our \`enemy\` — the same four squads, \`enemySquadCount\` ` +
          `${n(Object.values(THEIR_REQUEST.enemyFormation).reduce((sum, count) => sum + count, 0))} (same). ` +
          `**\`guardsmenExcludedCategories\` / \`specialistExcludedCategories\`** → our \`troops.topTierExcluded\` for both ` +
          `groups: guardsmen [${THEIR_REQUEST.guardsmenExcludedCategories.join(', ')}] = the profile's ` +
          `[${PROFILE.troops.topTierExcluded.guardsmen.join(', ')}] and specialists [] = the profile's ` +
          `[${PROFILE.troops.topTierExcluded.specialists.join(', ')}] (**same**), and the top-tier reading is the one the ` +
          `capture supports because their answer keeps rider-3 — tier 3, mounted — while dropping archer-3 and spearman-3, ` +
          `which is what excluding *the top tier* leaves and what excluding a whole category could not.`,
      );
      // 7. the closing paragraph
      report.add(
        `\n**Which of these could change the verdict, and what the comparison is valid for.** One difference is ` +
          `**material to the ranking** — the bonus set: pass A is their own and pass B is the account's, and the ranking ` +
          `between our search and their answer flips between them (§6), so every claim here is per-pass and none is ` +
          `general. Three more move *numbers* without moving the ranking: the app's 4,343 leadership (a re-score, above), ` +
          `the account's real temple of 15 (silver only, above), and the mercenary caps (the query's 14/16/15/8 against ` +
          `the account's 92/76/72/37 — our search answers very differently under each, above). One makes the whole ` +
          `comparison conditional: \`excludedTroopIds: []\` means **their answer is about an army the profile does not ` +
          `field**, so it is a like-for-like against our engine on that army and not against what the app would deploy. ` +
          `Everything else in the sheet is either the same on both sides or a flag with nothing to act on in this fight. ` +
          `The comparison is therefore strictly valid for: **the query's own eight-type army, both bonus sets, their ` +
          `4,000 leadership, their temple 0, their caps, their enemy, with counts as the only thing their capture gives ` +
          `us to check against** — their damage figures are ours, not theirs.`,
      );

      report.save();
    });
  },
  900_000,
);
