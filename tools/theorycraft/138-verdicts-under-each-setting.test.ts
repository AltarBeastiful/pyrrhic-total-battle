/**
 * 138 — **every verdict in the plan, re-asked under each recovery setting** (S-131, 2026-09-22).
 *
 * Experiment 137 measured that three of the five costs are a property of the march *and the recovery plan*
 * rather than of the march alone — silver ÷5.7 to ÷7.6, gold ×34 to ×61, the queue ÷4.3 to ÷5.4 between
 * `retrain` and `revive` — and then asked whether the **ordering** between two marches moves with them. It
 * asked that of exactly one pair, a synthetic one: the whole army against its troops alone. It came back
 * *no*, and that was recorded with the caveat it deserved: **weak evidence**. The columns move enormously,
 * and they are the columns every comparison in `docs/plans/beating-totalstack.md` rests on.
 *
 * This asks the **real** verdicts instead. Nothing here is synthetic: each section re-runs a judgement the
 * plan actually makes, under all three settings, and reports which ones change their answer.
 *
 *  - **§A — §2's matched-spend verdict, per army.** The bar's stops against the captured answers, on the
 *    four costs, at the 5 % tolerance. Both sides are priced by our engine, so both move with the setting —
 *    which is precisely why the answer cannot be predicted from 137's column table.
 *  - **§B — what each objective answers with.** The five objectives of the Battle card under both sizer
 *    methods. `damage per silver` is asked of a silver bill five times smaller under `revive`; §5.9's whole
 *    finding was that it empties the leadership pool, so the question is whether it still does.
 *  - **§C — the trade gates of S-128.** `stock`, `criteria`, `figures`, `everything` over the bar's own
 *    stops: how many stops each strategy finds beaten. `stock` reads the burn alone and is provably
 *    setting-independent; the other three read silver, gold or the queue and are not.
 *
 * **What the answer is for.** W9 needs a floor, and a floor stated on a setting-dependent cost is a floor
 * that means something different on each account. If the verdicts hold across the three settings, the floor
 * may be stated in the plan's ordinary terms; if they flip, it has to be stated on **coins and the burn**,
 * the two columns 137 measured as unmoved.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/138-verdicts-under-each-setting.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { searchPriority } from '../../src/engine/search';
import type { Priced, StrategyName } from '../../src/engine/trades';
import { STRATEGIES, beatenBy } from '../../src/engine/trades';
import type { RecoverySettings, StackRequest } from '../../src/engine/types';
import type { MatchedSpend } from '../../tests/engine/matched-spend';
import { matchedSpend, verdictWord } from '../../tests/engine/matched-spend';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { asCaptured, campaignOf, countsOf, marchesOf } from '../../tests/engine/plan-campaign';
import type { Scenario } from '../../tests/engine/plan-scenarios';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

/**
 * The three recovery plans, in the order 137 tabled them. `selective · monsters` is the app's own default
 * (`state/defaults.ts`), and 137 measured it sitting **with** `retrain` rather than between the two — so a
 * flip between it and `retrain` would be a much sharper finding than a flip between the extremes.
 */
const MODES: readonly (readonly [string, RecoverySettings['plan']])[] = [
  ['retrain', { mode: 'retrain' }],
  ['revive', { mode: 'revive' }],
  ['selective · monsters', { mode: 'selective', reviveFamilies: ['monsters'] }],
];

const under = (request: StackRequest, plan: RecoverySettings['plan']): StackRequest => ({
  ...request,
  recovery: { ...request.recovery, plan },
});

/** The five objectives the Battle card offers, exactly as `plan-benchmark.test.ts` lists them. */
const OBJECTIVES = [
  ['avgDamage', 'average damage'],
  ['minDamage', 'best worst case'],
  ['damagePerSilver', 'damage per silver'],
  ['damagePerGold', 'damage per gold'],
  ['damagePerDragonCoin', 'damage per dragon coin'],
] as const;

/**
 * **The two sides of §2, priced under one setting.** Ours is the bar's stops and nothing else — the same
 * rule `plan-benchmark.test.ts` follows, for the same reason: a verdict that let the bar claim a sizer's
 * march would score a product nobody ships. Theirs is every captured answer the army can actually field.
 */
function sides(scenario: Scenario, request: StackRequest): { ours: Campaign[]; theirs: Campaign[] } | null {
  let plan;
  try {
    plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return null;
  }
  const ours = plan.alternatives.map((stop) =>
    campaignOf(request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
  );
  const held = new Set(request.units.map((unit) => unit.id));
  const theirs: Campaign[] = [];
  for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
    // A captured answer that fields a troop type this army does not hold is not comparable, and the
    // benchmark does not judge against one either.
    const outside = Object.entries(external.counts).some(([id, count]) => count > 0 && !held.has(id));
    if (outside) continue;
    theirs.push(asCaptured(widenedFor(request, external.counts), external.name, external.counts));
  }
  return { ours, theirs };
}

/** The one line §A prints per army per setting, and the string the flip test compares. */
const said = (verdict: MatchedSpend): string =>
  `${verdictWord(verdict.hardest)} · ${String(verdict.rowsBeaten)}/${String(verdict.rows.length)} beaten · ` +
  `${String(verdict.unfitted)} no-fit`;

const pct = (value: number): string =>
  Number.isFinite(value) ? `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)} %` : '—';

const priceOf = (row: Campaign): Priced => ({
  damage: row.damage,
  silver: row.silver,
  gold: row.gold,
  dragonCoins: row.dragonCoins,
  hired: row.burned,
  seconds: row.seconds,
});

describe.skipIf(!process.env.THEORY)('every verdict, under each recovery setting', () => {
  it('re-asks §2, the objectives and the trade gates three times over', () => {
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('138-verdicts-under-each-setting');
    report.add('# 138 — every verdict in the plan, re-asked under each recovery setting\n');
    report.add(
      'Experiment 137 asked whether the ordering between two marches moves with the recovery setting, and ' +
        'asked it of one synthetic pair. This asks the **real** verdicts: §2’s matched-spend standing, what ' +
        'each objective answers with, and the trade gates of S-128 — each re-run under `retrain`, `revive` ' +
        'and the app’s own `selective · monsters`.\n',
    );

    // ---- §A — the matched-spend verdict --------------------------------------------------------------
    const spendRows: string[] = [
      '| army | setting | hardest row | delta | rows beaten | no stop fits |',
      '|---|---|---|---:|---:|---:|',
    ];
    const spendFlips: string[] = [];
    /** Per army, per setting: the whole verdict, so §D can name the marker that obstructed. */
    const verdictBy = new Map<string, Map<string, { verdict: MatchedSpend; ours: Campaign[] }>>();
    /** Per army, per setting: the stops priced, kept for §C so the plans are searched once. */
    const stopsBy = new Map<string, Map<string, Campaign[]>>();
    for (const scenario of scenarios) {
      const verdicts = new Map<string, string>();
      const perArmy = new Map<string, Campaign[]>();
      for (const [label, plan] of MODES) {
        const both = sides(scenario, under(scenario.request, plan));
        if (!both) {
          spendRows.push(
            `| ${label === 'retrain' ? scenario.label.slice(0, 40) : ''} | ${label} | refused | — | — | — |`,
          );
          verdicts.set(label, 'refused');
          continue;
        }
        perArmy.set(label, both.ours);
        if (both.theirs.length === 0) {
          verdicts.set(label, 'no captured answer');
          continue;
        }
        const verdict = matchedSpend(both.ours, both.theirs);
        verdicts.set(label, said(verdict));
        const forArmy = verdictBy.get(scenario.label) ?? new Map();
        forArmy.set(label, { verdict, ours: both.ours });
        verdictBy.set(scenario.label, forArmy);
        spendRows.push(
          `| ${label === 'retrain' ? scenario.label.slice(0, 40) : ''} | ${label} | ` +
            `${verdictWord(verdict.hardest)} | ${pct(verdict.hardest?.delta ?? Number.NaN)} | ` +
            `${String(verdict.rowsBeaten)}/${String(verdict.rows.length)} | ${String(verdict.unfitted)} |`,
        );
      }
      stopsBy.set(scenario.label, perArmy);
      if (new Set(verdicts.values()).size > 1) {
        spendFlips.push(
          `**${scenario.label.slice(0, 44)}** — ` + [...verdicts].map(([k, v]) => `${k}: ${v}`).join('; '),
        );
      }
    }
    report.add('\n## §A — §2’s matched-spend verdict, per army\n');
    report.add(spendRows.join('\n'));
    report.add(
      `\n**${spendFlips.length === 0 ? 'No army' : String(spendFlips.length) + ' armies'} change the ` +
        `verdict with the setting.**${spendFlips.length === 0 ? '' : '\n\n- ' + spendFlips.join('\n- ')}\n`,
    );

    // ---- §D — why the three armies flip ---------------------------------------------------------------
    report.add('\n## §D — which marker moved, on the armies whose verdict did\n');
    report.add(
      'For each army §A found moving: their **hardest** row, what it charges under this setting, and the ' +
        'cheapest our stops come in at on each of the four costs. A cost is **bold** where every stop of ' +
        'ours is outside their budget on it — the marker that actually obstructs.\n',
    );
    const whyRows: string[] = [
      '| army | setting | cost | theirs | our cheapest | |',
      '|---|---|---|---:|---:|---|',
    ];
    for (const label of spendFlips.map((line) => line.slice(2, line.indexOf('** —')))) {
      const forArmy = [...verdictBy].find(([key]) => key.slice(0, 44) === label)?.[1];
      if (!forArmy) continue;
      for (const [setting] of MODES) {
        const held = forArmy.get(setting);
        if (!held) continue;
        const hardest = held.verdict.hardest;
        if (!hardest) continue;
        for (const cost of ['silver', 'gold', 'dragonCoins', 'burned'] as const) {
          const cheapest = Math.min(...held.ours.map((row) => row[cost]));
          const blocked = held.ours.every((row) => row[cost] > hardest.theirs[cost] * 1.05);
          whyRows.push(
            `| ${cost === 'silver' && setting === 'retrain' ? label : ''} | ` +
              `${cost === 'silver' ? setting : ''} | ${blocked ? `**${cost}**` : cost} | ` +
              `${n(hardest.theirs[cost])} | ${n(cheapest)} | ${blocked ? '**obstructs**' : ''} |`,
          );
        }
      }
    }
    report.add(whyRows.join('\n') + '\n');

    // ---- §B — what each objective answers with -------------------------------------------------------
    const objRows: string[] = [
      '| army | method · objective | retrain | revive | selective · monsters |',
      '|---|---|---|---|---|',
    ];
    const objFlips: string[] = [];
    /** How many moves each objective owns — the rollup that says whether this is one objective or five. */
    const byObjective = new Map<string, number>(OBJECTIVES.map(([, words]) => [words, 0]));
    let trooplessFlips = 0;
    for (const scenario of scenarios) {
      const leadership = new Set(
        scenario.request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id),
      );
      for (const method of ['elite', 'ms'] as const) {
        for (const [objective, words] of OBJECTIVES) {
          const shapes = new Map<string, string>();
          for (const [label, plan] of MODES) {
            const request: StackRequest = {
              ...under(scenario.request, plan),
              options: { ...scenario.request.options, method },
            };
            const counts = countsOf(
              searchPriority({ request, objective, budgetMs: CAMPAIGN.budgets.search }).result,
            );
            const troops = Object.entries(counts).filter(
              ([id, count]) => count > 0 && leadership.has(id),
            ).length;
            const types = Object.values(counts).filter((count) => count > 0).length;
            shapes.set(label, `${String(troops)}t/${String(types)}`);
          }
          const values = [...shapes.values()];
          if (new Set(values).size > 1) {
            const troopless = values.map((v) => v.startsWith('0t'));
            if (new Set(troopless).size > 1) trooplessFlips += 1;
            byObjective.set(words, (byObjective.get(words) ?? 0) + 1);
            objFlips.push(
              `**${scenario.label.slice(0, 34)}** · ${method === 'elite' ? 'Tier ladder' : 'Troops first'} · ` +
                `${words} — ${[...shapes].map(([k, v]) => `${k}: ${v}`).join('; ')}` +
                `${new Set(troopless).size > 1 ? ' — **troopless under one setting and not another**' : ''}`,
            );
            objRows.push(
              `| ${scenario.label.slice(0, 34)} | ${method === 'elite' ? 'ladder' : 'troops first'} · ${words} | ` +
                `${values.join(' | ')} |`,
            );
          }
        }
      }
    }
    report.add('\n## §B — what each objective answers with\n');
    report.add(
      'Read `**a**t/**b**` as *a troop types out of b types fielded*, on the objective’s **first** march — ' +
        'the shape §5.9b counts a troopless answer by, and the one `Campaign.troopTypes` reports. Only the ' +
        'rows that **differ** between settings are printed; every row left out answered with the same shape ' +
        'three times.\n',
    );
    report.add(objRows.length > 2 ? objRows.join('\n') : '_No objective changed its shape on any army._');
    report.add(
      '\n### Which objective moves\n\n' +
        '| objective | answers that move | of |\n|---|---:|---:|\n' +
        [...byObjective]
          .map(([words, count]) => `| ${words} | **${String(count)}** | ${String(scenarios.length * 2)} |`)
          .join('\n') +
        '\n',
    );
    report.add(
      `\n**${String(objFlips.length)}** of the ${String(scenarios.length * 2 * OBJECTIVES.length)} ` +
        `(army × method × objective) answers move with the setting, ` +
        `**${String(trooplessFlips)}** of them across the troopless line.` +
        `${objFlips.length === 0 ? '' : '\n\n- ' + objFlips.join('\n- ')}\n`,
    );

    // ---- §C — the trade gates ------------------------------------------------------------------------
    const gateRows: string[] = [
      '| army | strategy | retrain | revive | selective · monsters |',
      '|---|---|---:|---:|---:|',
    ];
    const gateFlips: string[] = [];
    /** Armies where the **bar itself** offers a different number of stops under a different setting. */
    const stopCounts: string[] = [];
    for (const scenario of scenarios) {
      const perArmy = stopsBy.get(scenario.label);
      if (!perArmy || perArmy.size < MODES.length) continue;
      for (const name of Object.keys(STRATEGIES) as StrategyName[]) {
        const counts = new Map<string, string>();
        for (const [label] of MODES) {
          const stops = perArmy.get(label) ?? [];
          const field = stops.map(priceOf);
          const beaten = field.filter((row) => beatenBy(row, field, STRATEGIES[name]) !== null).length;
          counts.set(label, `${String(beaten)}/${String(field.length)}`);
        }
        const values = [...counts.values()];
        gateRows.push(`| ${scenario.label.slice(0, 34)} | ${name} | ${values.join(' | ')} |`);
        // **A gate flips when its *numerator* moves.** The denominator is how many stops the bar offered,
        // which is a fact about the bar under that setting and not about the gate: counting a row as a flip
        // because `0/4` became `0/3` would report sixteen flips where no gate ever reached a different
        // verdict. The denominator movement is counted separately, below, because it is its own finding.
        if (new Set(values.map((v) => v.split('/')[0])).size > 1) {
          gateFlips.push(
            `**${scenario.label.slice(0, 34)}** · \`${name}\` — ` +
              [...counts].map(([k, v]) => `${k}: ${v}`).join('; '),
          );
        }
        if (new Set(values.map((v) => v.split('/')[1])).size > 1 && name === 'stock') {
          stopCounts.push(
            `**${scenario.label.slice(0, 40)}** — ` +
              [...counts].map(([k, v]) => `${k}: ${v.split('/')[1]}`).join('; '),
          );
        }
      }
    }
    report.add('\n## §C — the trade gates of S-128, over the bar’s own stops\n');
    report.add('How many of the bar’s stops another stop beats outright, under each strategy.\n');
    report.add(gateRows.join('\n'));
    report.add(
      `\n**${gateFlips.length === 0 ? 'No gate reaches' : String(gateFlips.length) + ' gates reach'} a different ` +
        `verdict with the setting.**${gateFlips.length === 0 ? '' : '\n\n- ' + gateFlips.join('\n- ')}\n`,
    );
    report.add(
      `\n**The bar offers a different number of stops on ${String(stopCounts.length)} armies**, which is a ` +
        'fact about the bar under a setting rather than about the gates — it is what moves the denominators ' +
        `above.${stopCounts.length === 0 ? '' : '\n\n- ' + stopCounts.join('\n- ')}\n`,
    );
    report.save();
  }, 3_600_000);
});
