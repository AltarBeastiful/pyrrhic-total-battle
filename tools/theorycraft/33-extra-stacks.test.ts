/**
 * C4 — what one more unit type is worth (investigation 0015).
 *
 * Three questions, one at a time on top of two base marches — the 8-type pool (SW1 SP2 RD2 RD3 + the four
 * mercenaries) and the exhaustive winner at authority 2,000 (ARC2 RD2 RD3 + the four mercenaries):
 *
 *   (a) **owned, currently left out** — ARC2, RD1, SP1, ARC1, the four types `excludedUnitIds` drops;
 *   (b) **if unlocked** — SP3, ARC3, Catapult I (engineers, 10 leadership, 1,500 HP, no strength-against at
 *       all) and a second specialist (SW2). The account's technology is guardsmen tiers 1-3 and specialists
 *       tier 1 only (`troops` in the export), so none of these is available today;
 *   (c) **only if you own or can train them** — one monster type at a time from `monsters.json`, paid out of
 *       the 800 dominance the march never touches.
 *
 * Every row reports average damage, retrain silver, revive/retrain gold, dragon coins, where the
 * mercenaries land in the kill order and how many hits each side of the journal gives them, because that
 * is what actually decides whether an extra type helps: with N = 4 enemy squads only the **last two or
 * three** kill positions are struck twice, so adding a stack pushes someone out of a double-hit slot.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/33-extra-stacks.test.ts`
 */
import { describe, it } from 'vitest';

import { monsters as monsterTable, unitById } from '../../src/data';
import { CHUNK } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import {
  EIGHT,
  MERC_IDS,
  Report,
  evaluate,
  label,
  lines,
  loadOwner,
  march,
  n,
  scenarioB,
  table,
  withMethod,
  withUnits,
} from './harness';

const WINNER7 = ['archer-2', 'rider-2', 'rider-3', ...MERC_IDS] as const;
const MERC_SET = new Set<string>(MERC_IDS);

/** `EMH6 #5 (1/1) · ABT6 #6 (2/2) · …` — where the hired units sit and how often they strike. */
function mercLine(request: StackRequest, extra?: string): string {
  const ev = evaluate(request);
  return lines(ev)
    .filter((row) => MERC_SET.has(row.unitId))
    .map(
      (row) =>
        `${row.label} #${String(row.position)} (${String(row.hitsEnemyFirst)}/${String(row.hitsArmyFirst)})`,
    )
    .join(' · ')
    .concat(extra ?? '');
}

interface Row {
  what: string;
  method: string;
  avg: number;
  delta: number;
  silver: number;
  gold: number;
  dragonCoins: number;
  hits: string;
  mercs: string;
  count: string;
  march: string;
}

describe.skipIf(!process.env.THEORY)('C4 extra stacks', () => {
  it('prices one more unit type', () => {
    const report = new Report('33-extra-stacks');
    const owner = loadOwner();

    const bases = [
      { key: 'eight', name: '8 types (SW1 SP2 RD2 RD3 + 4 mercs)', ids: [...EIGHT] },
      { key: 'winner', name: 'winner 7 types (ARC2 RD2 RD3 + 4 mercs)', ids: [...WINNER7] },
    ] as const;

    report.add('# C4 — what one more unit type is worth');
    report.add(
      '\nScenario B. Housing leadership 4,343 · authority 2,000 · dominance 800; caps EMH6 92 / ABT6 76 / ' +
        'LGN6 72 / CHR6 37. Enemy 1 melee / 1 ranged / 1 mounted / 1 flying, so N = 4.',
    );
    report.add(
      '\n**Read the mercenary column first.** With N = 4 the hits a stack gets are a function of its kill ' +
        'position only: `expectedHits(p, 4)` is 0/1 at p = 1, then 1 for p = 2…5, then 2 for p = 6…9. So the ' +
        'bottom of the HP ladder is worth double, and an extra type earns its place mostly by *pushing the ' +
        'mercenaries down into the double-hit slots* — not by the damage it does itself.',
    );

    const rows: Row[] = [];
    const measure = (
      what: string,
      methodName: 'ms' | 'msRelaxed' | 'elite',
      request: StackRequest,
      baseAvg: number,
      addedId?: string,
    ): Row => {
      const ev = evaluate(request);
      const added = addedId ? ev.result.stacks.find((stack) => stack.unitId === addedId) : undefined;
      const row: Row = {
        what,
        method: methodName,
        avg: ev.summary.avgDamage,
        delta: ev.summary.avgDamage - baseAvg,
        silver: ev.summary.recovery.silver,
        gold: ev.summary.recovery.gold,
        dragonCoins: ev.summary.recovery.dragonCoins,
        hits: `${String(ev.summary.journals.enemyFirst.friendlyHits)}/${String(ev.summary.journals.armyFirst.friendlyHits)}`,
        mercs: mercLine(request),
        count: added ? `${n(added.count)} @ ${n(added.hpPerUnit)} HP` : addedId ? 'dropped' : '—',
        march: march(ev.result),
      };
      rows.push(row);
      return row;
    };

    const header =
      '| what | method | avg | Δ | added stack | silver | gold | coins | hits E/A | mercenaries: # (hits E/A) |';
    const rule = '|---|---|---|---|---|---|---|---|---|---|';
    const line = (row: Row): string =>
      `| ${row.what} | ${row.method} | ${n(row.avg)} | ${n(row.delta)} | ${row.count} | ${n(row.silver)} | ${n(row.gold)} | ${n(row.dragonCoins)} | ${row.hits} | ${row.mercs} |`;

    for (const base of bases) {
      report.h(`Base march — ${base.name}`);
      for (const method of ['ms', 'msRelaxed'] as const) {
        const request = withMethod(withUnits(scenarioB(owner.twelve), base.ids), method);
        const ev = evaluate(request);
        report.add(`\n**${method}** — ${march(ev.result)}`);
        report.add(table(ev));
      }
    }

    // ---- (a) owned types put back -------------------------------------------------------------------
    report.h('(a) Owned types the setup leaves out, one at a time');
    report.add(
      'ARC2, RD1, SP1 and ARC1 are in `excludedUnitIds`; the account can field them today. Everything else ' +
        'stays as it is — same housing, same caps, same bonuses.',
    );
    for (const base of bases) {
      report.add(`\n### on top of the ${base.name}\n`);
      report.add(header);
      report.add(rule);
      for (const method of ['ms', 'msRelaxed'] as const) {
        const baseRequest = withMethod(withUnits(scenarioB(owner.twelve), base.ids), method);
        const baseAvg = evaluate(baseRequest).summary.avgDamage;
        report.add(line(measure('— (base)', method, baseRequest, baseAvg)));
        for (const id of ['archer-2', 'rider-1', 'spearman-1', 'archer-1']) {
          if (base.ids.includes(id as never)) continue;
          const request = withMethod(withUnits(scenarioB(owner.twelve), [...base.ids, id]), method);
          report.add(line(measure(`+ ${label(id)}`, method, request, baseAvg, id)));
        }
      }
    }

    // ---- (b) types the account may not have unlocked -------------------------------------------------
    report.h('(b) "If unlocked" — types the account does not have today');
    report.add(
      'The export sets guardsmen tiers 1-3, specialists tier 1 only, engineers and monsters `null` (the row ' +
        'is switched off). So **every row in this section assumes a technology the account does not have**: ' +
        'SP3 and ARC3 are tier-3 guardsmen the top-tier chips exclude, SW2 is a tier-2 specialist, and ' +
        'Catapult I is an engineer — 10 leadership, 1,500 HP, 250 strength and **no strength-against at all**, ' +
        'so it always hits the melee squad with a bare base hit.',
    );
    const unlockable = ['spearman-3', 'archer-3', 'catapult-1', 'swordsman-2'];
    for (const base of bases) {
      report.add(`\n### on top of the ${base.name}\n`);
      report.add(header);
      report.add(rule);
      for (const method of ['ms', 'msRelaxed'] as const) {
        const baseRequest = withMethod(withUnits(scenarioB(owner.twelve), base.ids), method);
        const baseAvg = evaluate(baseRequest).summary.avgDamage;
        report.add(line(measure('— (base)', method, baseRequest, baseAvg)));
        for (const id of unlockable) {
          if (base.ids.includes(id as never)) continue;
          const request = withMethod(withUnits(scenarioB(owner.twelve), [...base.ids, id]), method);
          report.add(line(measure(`+ ${label(id)} *(if unlocked)*`, method, request, baseAvg, id)));
        }
      }
    }

    // ---- (c) monsters --------------------------------------------------------------------------------
    report.h('(c) One monster type, paid from the 800 dominance nothing else uses');
    report.add(
      '**Only if you own them or can train them.** The export has `monsters: null` — the row is switched ' +
        'off entirely, so the account fields no monsters at all and the 800 dominance is dead housing in ' +
        'every march this tool generates. Each row below adds exactly one monster type and lets the sizer ' +
        'spend that dominance on it.',
    );
    report.add(
      '\nMonsters are trained and revived **ten at a time** (`recovery.ts`, `CHUNK = 10`): the retrain cost ' +
        'is `ceil(n / 10) × training.silver` and `ceil(n / 10) × training.dragonCoins`, and "retrain all" ' +
        'still charges the monsters’ revive gold because monsters cannot be retrained back into a march. ' +
        'The per-chunk prices come straight from `monsters.json`.',
    );
    report.add('\n**Price list, per chunk of ten** (`monsters.json`):\n');
    report.add(
      '| monster | tier | category · race | dominance/unit | HP | strength | strength-against | silver /10 | dragon coins /10 | revive gold/unit |',
    );
    report.add('|---|---|---|---|---|---|---|---|---|---|');
    for (const record of monsterTable) {
      report.add(
        `| ${record.name} (${record.label}) | ${String(record.tier)} | ${record.category} · ${record.race} | ${n(record.cost)} | ${n(record.health)} | ${n(record.strength)} | ${
          Object.entries(record.strengthAgainst ?? {})
            .map(([key, value]) => `${key} +${n(value ?? 0)}`)
            .join(', ') || '—'
        } | ${n(record.training?.silver ?? 0)} | ${n(record.training?.dragonCoins ?? 0)} | ${n(record.revival.gold)} |`,
      );
    }

    for (const base of bases) {
      report.add(`\n### one monster on top of the ${base.name} (\`msRelaxed\`)\n`);
      report.add(header);
      report.add(rule);
      const baseRequest = withMethod(withUnits(scenarioB(owner.twelve), base.ids), 'msRelaxed');
      const baseAvg = evaluate(baseRequest).summary.avgDamage;
      report.add(line(measure('— (base)', 'msRelaxed', baseRequest, baseAvg)));
      const monsterRows: { name: string; row: Row }[] = [];
      for (const record of monsterTable) {
        const request = withMethod(withUnits(scenarioB(owner.twelve), [...base.ids, record.id]), 'msRelaxed');
        const row = measure(
          `+ ${record.label} *(only if you own them)*`,
          'msRelaxed',
          request,
          baseAvg,
          record.id,
        );
        monsterRows.push({ name: record.name, row });
      }
      for (const { row } of monsterRows.sort((a, b) => b.row.delta - a.row.delta)) report.add(line(row));
    }

    // ---- The best of each, in full -------------------------------------------------------------------
    report.h('The three best additions, in full (winner march, scenario B, `msRelaxed`)');
    {
      const baseRequest = withMethod(withUnits(scenarioB(owner.twelve), WINNER7), 'msRelaxed');
      const baseAvg = evaluate(baseRequest).summary.avgDamage;
      const candidates = [
        ...['archer-2', 'rider-1', 'spearman-1', 'archer-1', ...unlockable],
        ...monsterTable.map((record) => record.id),
      ].filter((id) => !WINNER7.includes(id as never));
      const ranked = candidates
        .map((id) => {
          const request = withMethod(withUnits(scenarioB(owner.twelve), [...WINNER7, id]), 'msRelaxed');
          return { id, request, avg: evaluate(request).summary.avgDamage };
        })
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 3);
      for (const entry of ranked) {
        const ev = evaluate(entry.request);
        const unit = unitById(entry.id);
        report.add(
          `\n### + ${label(entry.id)} (${unit?.pool ?? ''}, ${n(unit?.cost ?? 0)} per unit) — ${n(entry.avg - baseAvg)} over the base\n`,
        );
        report.add(march(ev.result));
        report.add(table(ev));
        report.add(
          `dragon coins ${n(ev.summary.recovery.dragonCoins)} · chunks of ${String(CHUNK)} · warnings: ${ev.result.warnings.join(' | ') || 'none'}`,
        );
      }
    }

    report.h('Monsters: how many the sizer actually fields, and where the damage comes from');
    report.add(
      'Every monster row above fields exactly **one** unit out of 800 dominance, and that is worth ' +
        'explaining. Under `ms` the monster pool gets the same ceiling as the mercenaries — `smallest troop ' +
        'stack HP − 1` — and a tier-7-to-9 monster has more HP in **one** unit than the whole troop stack, so ' +
        '`sizePool` drops it. It reappears at 1 only because `relaxPreservation` (Allow damage trades) checks ' +
        'the cap and the housing but **not** the ceiling, so it can push one unit in over the top; the sizer ' +
        'then says so in its warnings ("Allow damage trades grew DEV2 to 1; it now falls before RD3"). Under ' +
        '`elite` there is no ceiling at all and the dominance is spent in full.',
    );
    report.add('\n| monster | method | units | dominance | min | avg | max | dragon coins | damage / coin |');
    report.add('|---|---|---|---|---|---|---|---|---|');
    for (const id of ['devastator-2', 'kraken-2', 'trickster-2', 'water-elemental', 'battle-boar']) {
      for (const method of ['ms', 'msRelaxed', 'elite'] as const) {
        const request = withMethod(withUnits(scenarioB(owner.twelve), [...WINNER7, id]), method);
        const ev = evaluate(request);
        const stack = ev.result.stacks.find((entry) => entry.unitId === id);
        report.add(
          `| ${label(id)} | ${method} | ${n(stack?.count ?? 0)} | ${n(ev.result.pools.dominance.used)} | ${n(ev.summary.minDamage)} | ${n(ev.summary.avgDamage)} | ${n(ev.summary.maxDamage)} | ${n(ev.summary.recovery.dragonCoins)} | ${n(ev.summary.damagePerDragonCoin)} |`,
        );
      }
    }
    report.add(
      '\n**Where the damage comes from matters.** A single huge monster lands at kill position 1, where ' +
        '`expectedHits(1, 4)` is **0 enemy-first and 1 army-first**. So its whole contribution sits in the ' +
        'maximum and none of it in the minimum: on the winner march DEV2 takes the average from 7,843,624 to ' +
        '21,102,063 but the *minimum* only moves because the mercenaries were pushed down into double-hit ' +
        'slots. A player who is told "average damage 21 M" and then fights enemy-first sees 9.3 M. The gain ' +
        'is real but it is a coin flip on who strikes first, and the damage-per-dragon-coin column is the ' +
        'honest way to compare it with the troop and mercenary rows, which cost no coins at all.',
    );

    report.h('Reading it');
    report.add(
      '- **An extra troop type is not free: it costs a kill position.** Every type added takes leadership ' +
        'away from the others and inserts one more stack in the ladder, which shifts everybody below it down ' +
        'one slot. Because the hits-per-position curve is a staircase (0/1, 1, 1, 1, 1, 2, 2, 2, 2 for N = 4), ' +
        'an addition is worth a lot when it pushes a mercenary from a 1-hit slot into a 2-hit slot and worth ' +
        'less than nothing when it does the reverse.\n' +
        '- **Catapult I is the clearest demonstration of a stack with no features.** It has no ' +
        '`strengthAgainst` entry of any kind, so it targets the melee squad with a bare `count × 250 × ' +
        '(1 + Σ strength %)`, and it costs 10 leadership per unit — the worst damage-per-leadership in the ' +
        'game data. Its only possible use is as HP on top of the ladder, and `killOrder.ts` ranks engineers ' +
        'first for exactly that reason.\n' +
        '- **Monsters are paid in dragon coins, which no other stack costs.** The dominance is free — nothing ' +
        'else in this account can spend it — but the retrain bill is `ceil(n/10) ×` the table price, and for ' +
        'the tier-7 to tier-9 monsters that is 1,600 to 2,200 dragon coins per chunk of ten. A row can look ' +
        'excellent on average damage and be unaffordable; `damagePerDragonCoin` is the figure to compare.\n' +
        '- Whether the account owns or can train a given monster, and whether the technology for SP3 / ARC3 / ' +
        'SW2 / Catapult I exists, are **game questions** this report cannot answer.',
    );

    report.save();
  });
});
