/**
 * 151 — **why the bar stops short on the owner's live camp** (2026-09-23; the owner: *"yes measure why the
 * live camp stops short"*).
 *
 * On the live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited, 4 975 / 2 180) the bar's
 * hardest stop is the steady max's 15,306,859 over four marches, burning 52 chunks; TotalStack's Total
 * Optimization reaches 49,229,801 for 374, and our own Troops first · Generate sizer 50,435,355 for 353
 * (`benchmark-latest.md`). The benchmark's own note on the army names the suspect — every rival there spends
 * the unlimited bears without a ceiling — and this measures it rather than taking it on trust:
 *
 *  - **§A — TotalStack's marches, stack by stack**: each stack's HP in the battle's own kill order
 *    (`planMarch`), the lowest troop stack's HP (the shelter floor, S-87), and every hired stack at or above it
 *    — the stacks the enemy kills before any troop dies;
 *  - **§B — the same marches, sheltered**: every exposed hired stack lowered to one unit under the floor, and
 *    what the march is then worth on every reading;
 *  - **§C — the stock**: how many marches each hired count of theirs lasts on the camp's stock (`lastsMarches`);
 *  - **§D — the plan's own search**: the most damage any plan it summarised reaches, and where the damage
 *    stops — on the frontier, undominated, in the band, on the bar.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/151-why-the-live-camp-stops-short.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { PlanTotals } from '../../src/engine/plan';
import { lastsMarches, planCampaign } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import type { Campaign } from '../../tests/engine/plan-campaign';
import { campaignOf, marchesOf } from '../../tests/engine/plan-campaign';
import { HORIZON, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { totalstackRows, widenedFor } from '../../tests/engine/totalstack-rows';
import { Report, n } from './harness';

const LABEL = 'the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)';

const row = (c: Campaign): string =>
  `${n(c.damage)} | ${n(c.silver)} | ${String(c.burned)} | ${n(c.gold)} | ${n(Math.round(c.seconds / 3600))} h | ` +
  `${(c.silver > 0 ? c.damage / c.silver : 0).toFixed(3)} | ${n(Math.round(c.hiredDamage / Math.max(1, c.burned)))} | ` +
  `${n(Math.round(c.gold > 0 ? c.damage / c.gold : 0))}`;
const HEAD =
  '| march | damage | silver | hired burned | gold | queue | dmg a silver | dmg a merc | dmg a gold |\n' +
  '|---|---:|---:|---:|---:|---:|---:|---:|---:|';

describe.skipIf(!process.env.THEORY)('why the live camp stops short', () => {
  it('measures TotalStack’s marches against the shelter, the stock and the plan’s own search', () => {
    const profile = ownerProfile();
    if (!profile) return;
    const scenario = ownerScenarios(profile).find((s) => s.label === LABEL);
    if (!scenario) throw new Error('the live camp is not among the owner scenarios');
    const request: StackRequest = scenario.request;
    const report = new Report('151-why-the-live-camp-stops-short');
    report.add('# 151 — why the bar stops short on the owner’s live camp\n');
    report.add(
      'Figures are four-march campaigns, worst opening, default recovery. The shelter floor is the HP of the ' +
        'lowest troop stack; a hired stack at or above it is killed before any troop (S-87).\n',
    );
    const pool = (id: string): string => request.units.find((u) => u.id === id)?.pool ?? '?';

    // §A and §B — TotalStack's marches, stack by stack, then sheltered.
    const theirs = totalstackRows(LABEL);
    const partA: string[] = [];
    const partB: string[] = [HEAD];
    const partC: string[] = [
      '| march | hired type | count a march | stock | marches it lasts |',
      '|---|---|---:|---:|---:|',
    ];
    for (const answer of theirs) {
      const req = widenedFor(request, answer.counts);
      const { result } = planMarch(req, answer.counts);
      const troops = result.stacks.filter((s) => s.pool === 'leadership');
      const floor = troops.length > 0 ? Math.min(...troops.map((s) => s.totalHp)) : 0;
      partA.push(
        `\n### ${answer.name}\n\nShelter floor (lowest troop stack): **${n(Math.round(floor))} HP**.\n\n` +
          '| stack (kill order) | pool | count | HP | against the floor |\n|---|---|---:|---:|---|\n' +
          result.stacks
            .map(
              (s) =>
                `| ${s.unitId} | ${s.pool} | ${n(s.count)} | ${n(Math.round(s.totalHp))} | ${
                  s.pool === 'leadership'
                    ? ''
                    : s.totalHp >= floor
                      ? `**exposed — ${(s.totalHp / floor).toFixed(1)}× the floor**`
                      : 'sheltered'
                } |`,
            )
            .join('\n'),
      );
      const sheltered: Record<string, number> = { ...answer.counts };
      for (const s of result.stacks) {
        if (s.pool === 'leadership' || s.totalHp < floor) continue;
        sheltered[s.unitId] = Math.max(0, Math.ceil(floor / s.hpPerUnit) - 1);
      }
      const as = campaignOf(
        req,
        answer.name,
        'external',
        marchesOf({
          counts: answer.counts,
          marches: HORIZON,
        } as unknown as PlanTotals),
      );
      const sh = campaignOf(
        req,
        `${answer.name}, sheltered`,
        'external',
        marchesOf({
          counts: sheltered,
          marches: HORIZON,
        } as unknown as PlanTotals),
      );
      partB.push(`| ${answer.name} — as TotalStack fields it | ${row(as)} |`);
      partB.push(`| ${answer.name} — every hired stack lowered under the floor | ${row(sh)} |`);
      for (const [id, count] of Object.entries(answer.counts)) {
        if (count <= 0 || pool(id) === 'leadership') continue;
        const cap = request.caps[id];
        partC.push(
          `| ${answer.name} | ${id} | ${n(count)} | ${cap === undefined ? 'unlimited' : n(cap)} | ${
            cap === undefined ? '∞' : String(lastsMarches(cap, count))
          } |`,
        );
      }
    }

    // §D — the plan's own search.
    const plan = planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
      withFrontier: true,
    });
    const frontier = plan.frontier ?? [];
    const top = (rows: typeof frontier): string => {
      const best = rows.reduce<(typeof frontier)[number] | undefined>(
        (b, r) => (!b || r.totalDamage > b.totalDamage ? r : b),
        undefined,
      );
      return best
        ? `${n(best.totalDamage)} for ${n(best.silver)} silver, ${String(best.mercLost)} burned, ${n(best.gold)} gold`
        : '—';
    };
    const onFrontier = frontier.filter((r) => r.onFrontier);
    const undominated = frontier.filter((r) => r.undominated);
    const band = frontier.filter((r) => r.undominated && r.inBand);
    const bar = plan.alternatives;
    const partD =
      '| set | plans | its most damage |\n|---|---:|---|\n' +
      `| every plan the search summarised | ${String(onFrontier.length)} | ${top(onFrontier)} |\n` +
      `| undominated | ${String(undominated.length)} | ${top(undominated)} |\n` +
      `| in the band | ${String(band.length)} | ${top(band)} |\n` +
      `| on the bar | ${String(bar.length)} | ${top(bar as unknown as typeof frontier)} |\n`;
    const burnSpread =
      onFrontier.length > 0
        ? `The search's plans burn **${String(Math.min(...onFrontier.map((r) => r.mercLost)))}–${String(
            Math.max(...onFrontier.map((r) => r.mercLost)),
          )}** chunks over the campaign.`
        : '';

    /**
     * **§E — why the band refuses the search's hardest plans.** The band's four arms (`inBand`, `plan.ts`): the
     * march does at least half the damage of the plan's own winning march (`notToken`, the default rule);
     * at least half its damage a silver; more than one troop stack; and every stocked hired type fielded
     * (S-58 B, down to the cut). The winning march's figures are read off the plan's own totals, which are
     * that march's (untailed on this army: the bears are unlimited, so every plan fills the horizon).
     */
    const hiredTypes = request.units.filter((u) => u.pool !== 'leadership').map((u) => u.id);
    const refused = undominated
      .filter((r) => !r.inBand)
      .sort((a, b) => b.totalDamage - a.totalDamage)
      .slice(0, 12);
    const partE =
      `The winning march: ${n(Math.round(plan.repeat.damage))} a march, ${plan.damagePerSilver.toFixed(3)} damage a silver.\n\n` +
      '| plan | damage | silver | burned | gold | damage a march (≥ half the winner?) | dmg a silver (≥ half?) | troop stacks | hired types fielded |\n' +
      '|---|---:|---:|---:|---:|---|---|---:|---|\n' +
      refused
        .map((r) => {
          const troopStacks = Object.entries(r.counts).filter(
            ([id, c]) => c > 0 && pool(id) === 'leadership',
          ).length;
          const fielded = hiredTypes.filter((id) => (r.counts[id] ?? 0) > 0);
          return (
            `| — | ${n(r.totalDamage)} | ${n(r.silver)} | ${String(r.mercLost)} | ${n(r.gold)} | ` +
            `${n(Math.round(r.repeat.damage))} ${r.repeat.damage * 2 >= plan.repeat.damage ? '✓' : '**✗**'} | ` +
            `${r.damagePerSilver.toFixed(3)} ${r.damagePerSilver * 2 >= plan.damagePerSilver ? '✓' : '**✗**'} | ` +
            `${String(troopStacks)}${troopStacks > 1 ? '' : ' **✗**'} | ${fielded.join(', ')}${
              fielded.length < hiredTypes.length
                ? ` **(missing ${hiredTypes.filter((id) => !fielded.includes(id)).join(', ')})**`
                : ''
            } |`
          );
        })
        .join('\n');
    // The hardest refused plan, stack by stack, as the battle fields it.
    const hardest = refused[0];
    const hardestStacks = hardest
      ? (() => {
          const { result } = planMarch(request, hardest.counts);
          const troops = result.stacks.filter((st) => st.pool === 'leadership');
          const floor = troops.length > 0 ? Math.min(...troops.map((st) => st.totalHp)) : 0;
          return (
            `\n\nThe hardest of them, as the battle fields its repeated march (floor ${n(Math.round(floor))} HP):\n\n` +
            '| stack (kill order) | pool | count | HP |\n|---|---|---:|---:|\n' +
            result.stacks
              .map((st) => `| ${st.unitId} | ${st.pool} | ${n(st.count)} | ${n(Math.round(st.totalHp))} |`)
              .join('\n')
          );
        })()
      : '';
    report.add('## §A — TotalStack’s marches, stack by stack\n');
    report.add(partA.join('\n'));
    report.add('\n\n## §B — the same marches, sheltered\n');
    report.add(partB.join('\n'));
    report.add('\n\n## §C — how long their hired counts last on the camp’s stock\n');
    report.add(partC.join('\n'));
    report.add('\n\n## §D — the plan’s own search\n');
    report.add(partD + '\n' + burnSpread + '\n');
    report.add('\n## §E — the hardest plans the band refuses, and which arm refuses them\n');
    report.add(partE + hardestStacks + '\n');
    report.save();
  }, 3_600_000);
});
