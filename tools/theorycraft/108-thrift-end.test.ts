/**
 * 108 — **the thrift end of the bar on a small hired stock** (owner, 2026-09-19: *"using Troops first I can
 * get 2 009 810 … by adding back troops, impossible with Complete optimization. With full opt I still get 70
 * mercs even with the sweet spot; also no eco silver spot to allow me to maximize silver/dmg with lower
 * silver and training time whilst preserving merc spent low"*).
 *
 * Experiment 107 measured **why** his hand-built seven-type march with 25 hunters is off the bar, and found
 * two rules: the band's token-field yardstick (`inBand`, half the *winner's* fielded hired) and the absence of
 * any seven-type row at 25 hunters on the frontier (the hired vectors are the chunk grid plus S-78's per-unit
 * vectors). This one measures the alternatives to both, over every army the benchmark builds, the live camp of
 * `plan-criteria.test.ts`, and his two readings of the Battle card.
 *
 *  - **§A** the band's hired criterion, five ways: today (half the winner's fielded), half the **sweet spot's**
 *    fielded, half the sweet spot's **burn**, none at all, and half the **winner's damage a march**;
 *  - **§B** the **sheltered-maximum vectors**: for each prefix length k of the troop ranking, the most hired
 *    units the tight ladder over k types shelters at this leadership;
 *  - **§C** both together, with the "eco" stop read against the sweet spot;
 *  - **§D** the decision.
 *
 * Both are measured on one engine through the two flags `CampaignInput.bandHired` and
 * `CampaignInput.shelteredMax`, which exist for this experiment and are never set by the app. §A–§C in the
 * committed report were measured on 2026-09-19 against the engine as it stood **before** S-93; a re-run
 * re-measures them against the engine it runs on, and §D says what the decision was and why.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/108-thrift-end.test.ts`
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine';
import type { CampaignInput, CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest } from '../../src/state/derive';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { EXPORT_2026_09_17, Report, duration, n } from './harness';

/** His Troops-first march of 2026-09-19, as he typed it. */
const HIS_TROOPS_FIRST: Record<string, number> = {
  'archer-1': 1028,
  'spearman-1': 1027,
  'rider-1': 513,
  'archer-2': 568,
  'spearman-2': 567,
  'rider-2': 283,
  'rider-3': 159,
  'epic-monster-hunter-6': 25,
};

/** His camp of that night, at one reading of the Battle card (experiment 107's own builder). */
function hisSetup(leadership: number, authority: number, cap: number): StackRequest | null {
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
  profile.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap }];
  const setup0 = profile.setups[0];
  if (!setup0) return null;
  return buildStackRequest(profile, {
    ...setup0,
    active: { ...setup0.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
    housing: { ...setup0.housing, leadership, authority },
  });
}

/** The live camp of `plan-criteria.test.ts`, verbatim. */
function liveCamp(): { label: string; request: StackRequest }[] {
  const owner = ownerProfile();
  if (!owner) return [];
  const camp = structuredClone(owner);
  camp.sources.captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  camp.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
  camp.mercenaries.selected = [
    { id: 'arbalester-6', cap: 485 },
    { id: 'legionary-6', cap: 1002 },
    { id: 'bear-5', cap: null },
  ];
  const setup = camp.setups[0];
  if (!setup) return [];
  return [
    {
      label: 'live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)',
      request: buildStackRequest(camp, {
        ...setup,
        active: { ...setup.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
        housing: { ...setup.housing, leadership: 4_975, authority: 2_180 },
      }),
    },
  ];
}

interface Case {
  label: string;
  request: StackRequest;
  /** A march the owner built by hand, priced and looked for in the band (his two setups only). */
  hand?: Record<string, number>;
}

function cases(): Case[] {
  const profile = ownerProfile();
  const list: Case[] = [
    ...commonScenarios().map((s) => ({ label: s.label, request: s.request })),
    ...(profile ? ownerScenarios(profile).map((s) => ({ label: s.label, request: s.request })) : []),
    ...liveCamp(),
  ];
  const dump = hisSetup(4_975, 2_180, 450);
  if (dump) list.push({ label: '107 · localStorage dump — 4 975 / 2 180, hunters 450', request: dump });
  const message = hisSetup(5_100, 2_200, 120);
  if (message)
    list.push({
      label: '107 · his message — 5 100 / 2 200, hunters 120',
      request: message,
      hand: HIS_TROOPS_FIRST,
    });
  return list;
}

const run = (
  request: StackRequest,
  extra: Partial<CampaignInput>,
): { plan: CampaignPlan | null; ms: number; refusal?: string } => {
  const started = performance.now();
  try {
    const plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
      withTrade: true,
      withFrontier: true,
      ...extra,
    });
    return { plan, ms: Math.round(performance.now() - started) };
  } catch (error) {
    return {
      plan: null,
      ms: Math.round(performance.now() - started),
      refusal: error instanceof Error ? error.message : String(error),
    };
  }
};

const perSilver = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.silver);
const perHired = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.mercLost);

describe.skipIf(!process.env.THEORY)('108 — the thrift end of the bar', () => {
  it('measures the band yardsticks, the sheltered-maximum vectors, and the two together', () => {
    const report = new Report('108-thrift-end');
    const all = cases();

    /** The hired pool of one request, and the troop types it can field. */
    const poolsOf = (request: StackRequest) => {
      const hired = new Set(request.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id));
      const troops = request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
      return { hired, troops };
    };
    const hiredOf = (counts: Record<string, number>, hired: Set<string>): number =>
      Object.entries(counts).reduce((sum, [id, count]) => sum + (hired.has(id) ? count : 0), 0);
    const troopStacks = (counts: Record<string, number>, hired: Set<string>): number =>
      Object.entries(counts).filter(([id, count]) => count > 0 && !hired.has(id)).length;

    const stopLine = (row: PlanRow, hired: Set<string>): string =>
      `| ${row.pick} | ${troopStacks(row.counts, hired)} | ${n(hiredOf(row.counts, hired))} | ` +
      `${row.repeat.mercLost} | ${n(row.repeat.damage)} | ${n(row.repeat.silver)} | ` +
      `${duration(row.repeat.seconds)} | ${perSilver(row).toFixed(3)} | ${n(Math.round(perHired(row)))} |`;

    // ---- the variants ------------------------------------------------------------------------------------
    interface Variant {
      key: string;
      title: string;
      of: (sweet: { hired: number; burn: number }) => Partial<CampaignInput>;
    }
    const YARDSTICKS: Variant[] = [
      { key: 'A1', title: 'today — half the winner’s fielded hired', of: () => ({}) },
      {
        key: 'A2',
        title: 'half the sweet spot’s fielded hired',
        of: (sweet) => ({ bandHired: { mode: 'hired', min: Math.ceil(sweet.hired / 2) } }),
      },
      {
        key: 'A3',
        title: 'half the sweet spot’s burn (the bar’s own axis)',
        of: (sweet) => ({ bandHired: { mode: 'burn', min: Math.ceil(sweet.burn / 2) } }),
      },
      { key: 'A4', title: 'no token criterion at all', of: () => ({ bandHired: { mode: 'none' } }) },
      {
        key: 'A5',
        title: 'half the winner’s damage a march (the goal, on the axis the bar prints)',
        of: () => ({ bandHired: { mode: 'damage' } }),
      },
    ];

    const summary: string[] = [];
    const bTable: string[] = [];
    const cTable: string[] = [];

    for (const testCase of all) {
      const { hired, troops } = poolsOf(testCase.request);
      const base = run(testCase.request, {});
      report.h(testCase.label);
      if (!base.plan) {
        report.add(`The plan refuses this army: ${base.refusal ?? 'unknown'}.`);
        summary.push(`| ${testCase.label} | refused | — | — | — | — |`);
        continue;
      }
      const baseSweet = base.plan.alternatives.find((row) => row.pick === 'sweet-spot');
      const sweet = {
        hired: baseSweet ? hiredOf(baseSweet.counts, hired) : 0,
        burn: baseSweet?.repeat.mercLost ?? 1,
      };
      report.add(
        `Provisional sweet spot (today’s band): ${n(sweet.hired)} hired fielded, ${sweet.burn} burned, ` +
          `${n(baseSweet?.repeat.damage ?? 0)} damage for ${n(baseSweet?.repeat.silver ?? 0)} silver ` +
          `(${(baseSweet ? perSilver(baseSweet) : 0).toFixed(3)} a silver). Base search ${base.ms} ms.`,
      );

      /** One measured run, printed as a block. */
      const block = (title: string, extra: Partial<CampaignInput>): CampaignPlan | null => {
        const measured = run(testCase.request, extra);
        if (!measured.plan) {
          report.add(`\n**${title}** — refused: ${measured.refusal ?? 'unknown'}`);
          return null;
        }
        const plan = measured.plan;
        const band = plan.trade ?? [];
        const frontier = plan.frontier ?? [];
        const fullLadder = frontier.filter((row) => troops.every((id) => (row.counts[id] ?? 0) > 0));
        const inBandFull = fullLadder.filter((row) => row.inBand);
        const stopFull = fullLadder.filter((row) => row.stop);
        const minHired = band.length === 0 ? 0 : Math.min(...band.map((row) => hiredOf(row.counts, hired)));
        const minBurn = band.length === 0 ? 0 : Math.min(...band.map((row) => row.repeat.mercLost));
        report.add(
          `\n**${title}** — band ${band.length} plans (thinnest field ${n(minHired)} hired / ${minBurn} burned), ` +
            `${plan.alternatives.length} stops, ${measured.ms} ms; full-ladder rows on the frontier ` +
            `${fullLadder.length}, of them ${inBandFull.length} in band, ` +
            `${stopFull.length > 0 ? `a stop: ${stopFull.map((row) => row.stop ?? '').join(', ')}` : 'none a stop'}.`,
        );
        report.add('| stop | troop stacks | hired | burn | damage | silver | queue | a silver | a hired |');
        report.add('|---|---|---|---|---|---|---|---|---|');
        for (const row of plan.alternatives) report.add(stopLine(row, hired));
        if (testCase.hand) {
          const handHired = hiredOf(testCase.hand, hired);
          const near = frontier
            .filter((row) => troops.every((id) => (row.counts[id] ?? 0) > 0))
            .sort(
              (a, b) =>
                Math.abs(hiredOf(a.counts, hired) - handHired) -
                Math.abs(hiredOf(b.counts, hired) - handHired),
            )[0];
          report.add(
            near
              ? `His march’s nearest seven-type row on the frontier: ${n(hiredOf(near.counts, hired))} hired, ` +
                  `${near.repeat.mercLost} burned, ${n(near.repeat.damage)} a march for ${n(near.repeat.silver)} ` +
                  `— undominated ${near.undominated ? 'yes' : 'no'}, in band ${near.inBand ? 'yes' : 'no'}, ` +
                  `stop ${near.stop ?? '—'}.`
              : 'No seven-type row on the frontier at all.',
          );
        }
        return plan;
      };

      report.add('\n### §A — the band yardstick (the sheltered-maximum vectors off)');
      const aPlans = new Map<string, CampaignPlan | null>();
      for (const variant of YARDSTICKS) {
        aPlans.set(variant.key, block(`§A ${variant.key} · ${variant.title}`, variant.of(sweet)));
      }

      report.add('\n### §B — the sheltered-maximum vectors (today’s yardstick)');
      const bPlan = block('§B · today’s yardstick + sheltered-maximum vectors', { shelteredMax: true });
      const baseFrontier = (base.plan.frontier ?? []).length;
      const bFrontier = (bPlan?.frontier ?? []).length;
      const bFull = (bPlan?.frontier ?? []).filter((row) => troops.every((id) => (row.counts[id] ?? 0) > 0));
      bTable.push(
        `| ${testCase.label} | ${baseFrontier} → ${bFrontier} | ${bFull.length} full-ladder rows ` +
          `(hired ${bFull.length > 0 ? [...new Set(bFull.map((row) => hiredOf(row.counts, hired)))].sort((a, b) => a - b).join(' · ') : '—'}) | ` +
          `${base.ms} → ${bPlan ? run(testCase.request, { shelteredMax: true }).ms : 0} ms | ` +
          `${base.plan.alternatives.length} → ${bPlan?.alternatives.length ?? 0} stops |`,
      );

      report.add('\n### §C — both together');
      const cPlans = new Map<string, CampaignPlan | null>();
      for (const variant of YARDSTICKS) {
        cPlans.set(
          variant.key,
          block(`§C ${variant.key} · ${variant.title} + sheltered-maximum vectors`, {
            ...variant.of(sweet),
            shelteredMax: true,
          }),
        );
      }
      for (const variant of YARDSTICKS) {
        const plan = cPlans.get(variant.key);
        if (!plan) {
          cTable.push(`| ${testCase.label} | ${variant.key} | refused | — | — | — | — |`);
          continue;
        }
        const sweetRow = plan.alternatives.find((row) => row.pick === 'sweet-spot');
        const saver = plan.alternatives.find((row) => row.pick === 'silver-saver');
        if (!sweetRow || !saver) {
          cTable.push(
            `| ${testCase.label} | ${variant.key} | ${plan.alternatives.length} stops | no silver saver | — | — | — |`,
          );
          continue;
        }
        cTable.push(
          `| ${testCase.label} | ${variant.key} | ${plan.alternatives.length} stops | ` +
            `${(((sweetRow.repeat.silver - saver.repeat.silver) / sweetRow.repeat.silver) * 100).toFixed(1)} % | ` +
            `${(((sweetRow.repeat.seconds - saver.repeat.seconds) / sweetRow.repeat.seconds) * 100).toFixed(1)} % | ` +
            `${sweetRow.repeat.mercLost - saver.repeat.mercLost} | ` +
            `${(((sweetRow.repeat.damage - saver.repeat.damage) / sweetRow.repeat.damage) * 100).toFixed(1)} % |`,
        );
      }

      const thriftOf = (plan: CampaignPlan | null): string => {
        if (!plan) return 'refused';
        const first = plan.alternatives[0];
        if (!first) return '—';
        return `${first.pick} ${n(hiredOf(first.counts, hired))}h/${first.repeat.mercLost}b ${perSilver(first).toFixed(3)}`;
      };
      summary.push(
        `| ${testCase.label} | ${YARDSTICKS.map((v) => thriftOf(aPlans.get(v.key) ?? null)).join(' | ')} | ` +
          `${thriftOf(bPlan)} | ${YARDSTICKS.map((v) => thriftOf(cPlans.get(v.key) ?? null)).join(' | ')} |`,
      );
    }

    report.h('§A/§C summary — the bar’s thrift stop under each yardstick');
    report.add(
      '`pick hired/burn damage-a-silver` of the **leftmost** stop the bar carries under each reading.',
    );
    report.add(
      '| army | A1 today | A2 ½ sweet fielded | A3 ½ sweet burn | A4 none | A5 ½ winner damage | B only | C·A1 | C·A2 | C·A3 | C·A4 | C·A5 |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const line of summary) report.add(line);

    report.h('§B summary — what the sheltered-maximum vectors add');
    report.add('| army | frontier rows | full-ladder rows added | search ms | stops |');
    report.add('|---|---|---|---|---|');
    for (const line of bTable) report.add(line);

    report.h('§C summary — the eco stop against the sweet spot');
    report.add('| army | yardstick | stops | silver saved | queue saved | burn saved | damage lost |');
    report.add('|---|---|---|---|---|---|---|');
    for (const line of cTable) report.add(line);

    /**
     * **§D — the decision**, written once here so a re-run of this file carries it. The tables above are
     * re-measured against whatever engine runs them; the figures quoted below were taken on 2026-09-19
     * against the engine as it stood before S-93 (HEAD `9edd22f`), which is what the decision was taken on.
     */
    report.add(`## §D — the decision

**§A–§C above were measured on 2026-09-19 against the engine as it stood before S-93** (HEAD \`9edd22f\`), through the
two diagnostic flags \`CampaignInput.bandHired\` and \`CampaignInput.shelteredMax\`. Re-running this file after S-93
re-measures the same five yardsticks against the engine that shipped; the tables here are the ones the decision
was taken on.

### The yardstick: **unchanged** — \`winner\`, half the hired units the plan's own winning march fields

The band's token-field rule was the suspect, and it is not the defect. Read off §A/§C, army by army:

| reading | what it does | why it is refused |
|---|---|---|
| A1 \`winner\` — half the winner's fielded hired (today) | thinnest band plan 62 hired / 7 burned on the 7 000 export, 50 / 5 on his camp | **kept** |
| A2 — half the **sweet spot's** fielded hired | moves the band's floor to 54 / 6 and 38 / 4; the 7 000 sweet spot falls 5 330 563 → 4 177 683 a march (−22 %) | it still refuses his seven-stack march (his camp's band floor stays at 38 hired) and pays for nothing |
| A3 — half the sweet spot's **burn** | identical bars to A2 on nine of thirteen armies; the evening account's saver moves 84 → 55 hired | same: his march is still out, and two sweet spots move |
| A4 — no token criterion | the 7 000 export's thrift stop becomes **506 032** damage for 278 400 silver — 8.6 % of the steady max — and its sweet spot falls to 1.287 a silver against the steady max's 2.141 | it is the extreme the owner's own instruction names (*"if we use a certain % of mercs or waay too much silver we're too far off"*) |
| A5 — half the **winner's damage a march** | refuses every one of A4's extremes and admits his seven-stack march; his camp's dump gains a silver saver at 30 hired / 3 burned (1 989 359 for 1 790 200, 1.111 a silver) | it costs the 7 000 export's sweet spot 16 % of its campaign (21 662 734 → 18 143 700) — and once the tighter shape lands, **both criteria hold without it** |

The last line is the finding. With S-93's tighter shape in the engine, \`tests/engine/plan-criteria.test.ts\`'s two new
criteria pass under A1 *and* under A5; A5 buys nothing the shape has not already bought, and it is the only one of the
five that moves a recommendation on an army where nothing was wrong. So the yardstick stays as it is.

### §B, the sheltered-maximum vectors: **not shipped**

For each prefix length k of the troop ranking, the hired counts the biggest tight ladder over k types shelters at that
leadership, scored beside the chunk grid and S-78's per-unit vectors. Measured over the thirteen armies: it adds
frontier rows (his camp 54 → 67, the localStorage dump 63 → 104, the live camp 441 → 498, the 7 000 export 2 176 →
2 106 as the extra rows dominate others off) and costs 10–40 % of the search on the small armies. It moved **neither**
criterion on **any** army, and on his camp it made the thrift end *worse* (the silver saver fell from 60 hired at
2 141 540 to 48 at 1 712 129, a cheaper march the "least silver" rule prefers).

The reason is in the measurement: the marches that beat the bar's stops are the **sizer's**, over a *prefix* of the
troop ranking — ARC1 1187 · SP1 942 · RD1 482 · ARC2 656 · SP2 521 · RD2 266 · RD3 149 with 29 hunters on his camp,
EMH 65 · RD1 1171 · ARC2 1458 · SP2 1182 · RD2 646 · RD3 363 with every legionary, arbalester and chariot on the
7 000 export. The family the plan was missing is a **shape**, not a vector: the search asks the sizer for the whole
army and the ladders for a prefix, and nobody ever asked the **sizer** for a prefix. The flag stays in
\`CampaignInput\` so this can be re-measured; it is off, and the app never sets it.

### What ships instead — **the tighter shape**

\`tighterShape\` in \`src/engine/plan.ts\`: the same march re-sized by the sizer over each prefix of the troop ranking,
its own hired counts as the caps, under each of the three methods, **taken only when the result is behind on none of
the four readings the bar and the recap print** — damage, silver, the stock burned and the training queue — with one
strictly better. No exchange rate, no cap, no constant: a march that is behind on nothing is the same answer done
better. It runs where the put-back runs (the burn ladder, then the two stops the ladder does not carry) and three
steps deep: tighter shape, put-back, tighter shape again — because a put-back spends damage for silver and queue and
can land on a march a prefix of the sizer beats outright. The same prefix shapes are added to the \`all-in\`'s own
march builder, which had the same hole.

### The two criteria, on HEAD and after

\`tests/engine/plan-criteria.test.ts\`, over the benchmark's ten armies, the owner's four and his camp of 2026-09-19 at
both readings of the Battle card (added to the shared list here).

**"No stop is beaten on every reading by a sheltered march the account can field"** — on HEAD, two armies:

| army | stop | the stop | the march that beats it |
|---|---|---|---|
| e2e seed (EMH VI ×83, 20 000) | all-in | 7 708 571 / 11 434 600 / 9 burned / 1 478 h | the sizer over all nine troop types with the same 83 hunters — 8 047 249 / 8 514 200 / 9 / 729 h |
| the 4 000-leadership case | all-in | 2 241 158 / 1 678 600 / 7 / 134 h | the sizer over seven troop types with the same 53 hired — 2 268 567 / 1 573 400 / 7 / 108 h |

**"The thrift end is offered"** — on HEAD, one army:

| army | what stands left of the sweet spot | the bar's thriftiest stop |
|---|---|---|
| his camp, 5 100 / 2 200, hunters 120 | the sizer over his seven troop types, EMH 29 · ARC1 1187 · SP1 942 · RD1 482 · ARC2 656 · SP2 521 · RD2 266 · RD3 149 — 2 046 502 for 1 991 000 at **3** burned, 133 h | the silver saver at **6** burned |

Both pass after S-93 on all thirteen armies.

### His two setups, before and after

**The localStorage dump — 4 975 / 2 180, hunters 450.** Only the \`all-in\` moves; the three rung stops were already the
sizer's own shapes.

| stop | troops | hired | burn | damage | silver | queue | a silver | a hired |
|---|---|---|---|---|---|---|---|---|
| sweet-spot — before **and** after | SP2 911 · RD3 257 · RD2 449 · RD1 792 · ARC2 1 057 | 38 | 4 | 2 520 042 | 2 268 000 | 8d 18h | 1.111 | 630 011 |
| more-mercs — before **and** after | SP2 1 915 · RD2 980 · RD3 550 | 60 | 6 | 2 600 334 | 2 707 500 | 13d 10h | 0.960 | 433 389 |
| steady-max — before **and** after | SP2 1 915 · RD2 980 · RD3 550 | 75 | 8 | 2 843 021 | 2 707 500 | 13d 10h | 1.050 | 355 378 |
| all-in — before | RD2 1 565 · RD3 862 | 168 | 17 | 4 342 242 | 2 771 800 | 14d 21h | 1.567 | 255 426 |
| all-in — **after** | RD2 1 593 · RD3 894 | 174 | 18 | 4 489 913 | 2 844 600 | 15d 8h | 1.578 | 249 440 |

**His message — 5 100 / 2 200, hunters 120.** The bar keeps four stops and every one of them moves left: the silver
saver's three-stack march is gone, and the **recommendation** is now the five-stack march at half the hunters, a
quarter less silver and 35 % less queue.

| stop | troops | hired | burn | damage | silver | queue | a silver | a hired |
|---|---|---|---|---|---|---|---|---|
| silver-saver — before | RD2 709 · RD3 391 · ARC2 1 670 | 60 | 6 | 2 141 540 | 2 091 400 | 10d 5h | 1.024 | 356 923 |
| sweet-spot — before | SP2 1 962 · RD2 1 005 · RD3 564 | 70 | 7 | 2 803 382 | 2 775 600 | 13d 18h | 1.010 | 400 483 |
| steady-max — before | SP2 1 962 · RD2 1 005 · RD3 564 | 90 | 9 | 3 126 964 | 2 775 600 | 13d 18h | 1.127 | 347 440 |
| all-in — before | RD2 1 634 · RD3 916 | 120 | 12 | 3 658 034 | 2 916 400 | 15d 17h | 1.254 | 304 836 |
| sweet-spot — **after** | RD1 828 · ARC2 1 125 · SP2 893 · RD2 457 · RD3 256 | 50 | 5 | 2 509 413 | 2 321 200 | 8d 21h | 1.081 | 501 883 |
| more-mercs — **after** | SP2 1 962 · RD2 1 005 · RD3 564 | 70 | 7 | 2 803 382 | 2 775 600 | 13d 18h | 1.010 | 400 483 |
| steady-max — **after** | SP2 1 962 · RD2 1 005 · RD3 564 | 90 | 9 | 3 126 964 | 2 775 600 | 13d 18h | 1.127 | 347 440 |
| all-in — **after** | RD2 1 634 · RD3 916 | 120 | 12 | 3 658 034 | 2 916 400 | 15d 17h | 1.254 | 304 836 |

His own Troops-first march, priced by the recap on that request, is 2 169 458 for 1 997 400 at 3 burned and 5d 14h —
1.086 a silver. **It is still outside the band**: the winner fields 90 hired, so the token-field half rule asks for
45 and his 25 are refused, exactly as they were before S-93. What changed is that the bar no longer carries a stop his
march beats on all four readings, and that the recommendation is now the same five-stack family — but the thrift end
moved **left in the stock and the queue and right in silver**: 60 hunters / 6 burned / 2 141 540 for 2 091 400 and
10d 5h becomes 50 / 5 / 2 509 413 for **2 321 200** and 8d 21h, which is 17 % more damage and 13 % less queue for
11 % **more** silver. There is no eco stop on this bar yet, and this experiment does not claim one: the reading that
would give him one is A5, and §A says what it costs elsewhere.

### The defect the validator found in the \`all-in\` (2026-09-19)

The prefix shapes were first scored **after** the \`share\` walk and always at the whole remaining stock, so the stop's
"most of the stock fielded first" tie-break could take a shape the walk had never sanctioned. On the evening account
the campaign came out at **28 647 490 for 24 858 800 silver and 175 burned**, against 29 111 661 for 17 179 200 and 78
before S-93 — beaten on damage, silver **and** the stock burned by the "more mercs" stop on the same bar
(29 265 102 / 17 179 200 / 67). Two changes, measured separately: moving the prefix shapes **inside** the walk alone
does **not** fix it (the ladders already shelter the whole stock at share 1 on that army, so the walk's share is 1
either way); what fixes it is **refusing a candidate the shape already found beats on damage, silver and burn at
once**. Both are kept — the first because asking at a share the walk never reached was wrong whether or not it bit,
the second because it is what the figures support. After: **32 348 459 for 19 316 400 and 89 burned**, +11 % damage
for +12 % silver over the pre-S-93 row. A new criterion in \`tests/engine/plan-criteria.test.ts\` — *no stop of the bar
is beaten by another stop of the same bar* on damage, silver and burn — holds it on all thirteen armies and fails
without the refusal.

One cost remains and is not a domination: on the live account at 20 000 the \`all-in\` pays 31 092 400 → **42 085 900**
silver (+35 %) for +1.3 % damage at the same 30 burned. Its tie-break is "most of the stock fielded, then most
damage", with no silver term; a silver term would be a new policy and is not proposed here.`);
    report.save();
  }, 1_800_000);
});
