/**
 * 139 — **the neighbour we never tried** (2026-09-22).
 *
 * The owner, on a march he had just built by hand against the one the app answered with:
 *
 * > "I just checked a march with leonidas and alexander and it seems we don't properly explore alternative
 * > troops depending on heroes bonuses. I hand crafted this vs the generated stack... using spearman and rd
 * > is obvious with the heroes. I'm not asking for specific rules but common verification that we explore
 * > the different solution with the heroes bonuses"
 *
 * **His march**: RD1 883 · ARC2 1 350 · SP2 958 · RD2 489 · RD3 274 · WE 60 · BB 20 · SG 20 · ED 20 ·
 * EMH6 10. **The app's, for the same pools**: SP1 1 621 · RD1 826 · SP2 897 · RD2 458 · RD3 257 · EMH VI 10 ·
 * BB III 20 · SG III 20 · WE III 50 · ED III 20 — 5 600/5 600 leadership, 10/2 180 authority and **570 of
 * 600 dominance**, which the app itself scored 25 % under his.
 *
 * Two defects are visible in that one pair, and both are measurable on every army the benchmark already
 * holds, without reconstructing his case:
 *
 *  1. the generated march fields **Spearman I** and **no Archer II**, where his fields Archer II and no
 *     Spearman I — the *set of types* differs, not the counts;
 *  2. the generated march leaves **30 of 600 dominance** unspent.
 *
 *  - **§A — leftover capacity in what we generate.** Every scenario under both sizer methods: what fraction
 *    of each pool the answer spends, the sizer's **own** sentence about what it left, and whether anything
 *    the army holds could still have been bought with the room. Defect (2), asked of seventeen armies.
 *  - **§B — the neighbour check, and the centre of this experiment.** Take the answer we generate, read the
 *    **set of troop types** it fields, and try every one-type move away from it: swap a fielded type for a
 *    held-but-unfielded one, add one, drop one. Each neighbour is re-sized by the app's own sizer over the
 *    reduced type list — the construction `searchPriority` uses for its subsets (`src/engine/search.ts`
 *    lines 112-134) — priced by the one pricer this repo has (`tests/engine/plan-campaign.ts`), and counted
 *    as **dominating** when it deals strictly more damage *and* fits inside the generated march's own budget
 *    on silver, gold, dragon coins and burn at the 5 % tolerance (`tests/engine/matched-spend.ts`). A
 *    dominating neighbour is a march the player could have had for the same bill and did not get.
 *    **§B2** puts the engine's own subset search (`searchPriority`, exhaustive up to twelve types) beside
 *    the same base, because the app already owns a type-selection search that Generate does not call.
 *    **§B3** asks whether the better type set is one the **plan's** family could even reach: that family is
 *    a *prefix* of the troop ranking, so a set that keeps a weak-per-HP type while dropping a strong one is
 *    outside it by construction.
 *  - **§D — where the bonuses reach type selection and where they do not.** Two rankings decide which types
 *    end up in a march; each claim carries a `file:line`.
 *
 * **What this does not do.** It never varies the captains. Every army is measured under the captains it has
 * enlisted, which is what the owner asked for: not *would another hero be better*, but *given the heroes on
 * this march, do we explore the troop types at all*.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/139-the-neighbour-we-never-tried.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { effectiveTable, rankTroops } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import { searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest } from '../../src/engine/types';
import type { Cost, Spend } from '../../tests/engine/matched-spend';
import { TOLERANCE, fitsInside, overspentOn } from '../../tests/engine/matched-spend';
import { countsOf, hiredIds, price } from '../../tests/engine/plan-campaign';
import type { Scenario } from '../../tests/engine/plan-scenarios';
import { commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import { Report, label, n } from './harness';

/** The two sizings the Battle card offers, under their own names. */
const METHODS = [
  ['elite', 'Tier ladder'],
  ['ms', 'Troops first'],
] as const;

/**
 * **The cap on §B's enumeration.** The neighbourhood is `|F| × |M| + |M| + |F|` re-sizings, which on the
 * benchmark's armies is tens; the cap exists so a future army with forty troop types cannot turn this into
 * an hour, and every cell that hits it is named in the report rather than silently truncated.
 */
const MAX_NEIGHBOURS = 400;

const pct = (value: number): string => `${(value * 100).toFixed(1)} %`;
const gain = (value: number): string => `${value >= 0 ? '+' : ''}${(value * 100).toFixed(1)} %`;
const short = (text: string): string => (text.length > 40 ? `${text.slice(0, 39)}…` : text);

/** A march as this experiment reads it: the four gated costs, the queue, and the damage they bought. */
type Outcome = Spend & { damage: number };

/**
 * **One march, priced by the repo's own arithmetic.** `price` is the single pricer every comparison in this
 * tree is taken on; the burn beside it is the authority-pool chunks, computed exactly as `campaignOf` does
 * (`chunks` of `src/engine/recovery`, over `hiredIds`), because `price` does not return one.
 *
 * The request passed in is always the **whole** army's, never the neighbour's reduced one: `price` walks
 * `request.units` and reads counts off the vector, so pricing every candidate against the same unit list
 * keeps the kill-order ranking — and therefore the battle — one arithmetic across the neighbourhood.
 */
function priceMarch(request: StackRequest, counts: Record<string, number>): Outcome {
  const priced = price(request, counts);
  return {
    damage: priced.damage,
    silver: priced.silver,
    gold: priced.gold,
    dragonCoins: priced.dragonCoins,
    burned: hiredIds(request).reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0),
    seconds: priced.seconds,
  };
}

interface Neighbour {
  kind: 'swap' | 'add' | 'drop';
  /** What moved, in unit labels — the sentence the owner reads: `SP1 → ARC2`. */
  moved: string;
  /** The type list the neighbour is sized over. */
  ids: string[];
}

/**
 * The one-type moves away from a fielded type set. `fielded` and `missing` are **leadership** types only —
 * the troops are what the owner is talking about — and `kept` is every non-leadership type the base march
 * fields, carried unchanged into each neighbour so the move is a troop move and not a stock move.
 */
function neighboursOf(fielded: string[], missing: string[], kept: string[]): Neighbour[] {
  const out: Neighbour[] = [];
  for (const x of fielded) {
    const without = fielded.filter((id) => id !== x);
    for (const y of missing) {
      out.push({ kind: 'swap', moved: `swap ${label(x)} → ${label(y)}`, ids: [...without, y, ...kept] });
    }
  }
  for (const y of missing) out.push({ kind: 'add', moved: `add ${label(y)}`, ids: [...fielded, y, ...kept] });
  for (const x of fielded) {
    out.push({
      kind: 'drop',
      moved: `drop ${label(x)}`,
      ids: [...fielded.filter((id) => id !== x), ...kept],
    });
  }
  return out;
}

/**
 * **Is this type set a prefix of the troop ranking?** `order` is `rankTroops`, weakest damage-per-HP first,
 * so the family the plan searches is its last `k` entries (`src/engine/plan.ts:2793`). A set that is not one
 * of those tails is a march no depth of the plan's ladder family can propose.
 */
function isPrefix(order: readonly string[], ids: readonly string[]): boolean {
  const set = new Set(ids);
  const tail = order.slice(order.length - set.size);
  return tail.length === set.size && tail.every((id) => set.has(id));
}

/** One (army × method) cell of §B. */
interface Cell {
  army: string;
  method: string;
  base: Outcome;
  /** Leadership types the army holds, fields, and holds without fielding. */
  leadership: string[];
  fielded: string[];
  missing: string[];
  kinds: { swap: number; add: number; drop: number };
  tried: number;
  capped: boolean;
  dominating: number;
  /** The best neighbour that dominates the base: more damage inside the same budget. */
  best: { neighbour: Neighbour; out: Outcome } | null;
  /** The best neighbour on damage alone, whether or not it fits — and what it overspends on. */
  loudest: { neighbour: Neighbour; out: Outcome; over: Cost[] } | null;
}

describe.skipIf(!process.env.THEORY)('the neighbour we never tried', () => {
  it('asks what the answer we generate leaves on the table, in capacity and in type sets', () => {
    const profile = ownerProfile();
    const scenarios: Scenario[] = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const report = new Report('139-the-neighbour-we-never-tried');
    report.add('# 139 — the neighbour we never tried\n');
    report.add(
      'The owner: *"it seems we don’t properly explore alternative troops depending on heroes bonuses … ' +
        'I’m not asking for specific rules but common verification that we explore the different solution ' +
        'with the heroes bonuses"*. Two defects are visible in the pair he sent — the generated march fields ' +
        '**Spearman I** where his fields **Archer II**, and it leaves **30 of 600 dominance** unspent — and ' +
        'both are asked here of every army the benchmark holds, under the captains each of them already has ' +
        'enlisted. Nothing below varies a captain.\n',
    );
    report.add(
      `Armies measured: **${String(scenarios.length)}**` +
        `${profile ? '' : ' (the owner’s export was not on disk, so only the common scenarios were built)'}, ` +
        'each under both sizings the Battle card offers. Damage is the **worst opening** throughout ' +
        '(`price`, `tests/engine/plan-campaign.ts`), which is what the plan is ranked on.\n',
    );

    // ---- §A — leftover capacity ----------------------------------------------------------------------
    const poolRows: string[] = [
      '| army | sizing | leadership | authority | dominance | > 1 % left | could still buy | the sizer’s own reason |',
      '|---|---|---:|---:|---:|---|---|---|',
    ];
    /** Every (army × method × pool) that leaves more than 1 % of a housed pool unused. */
    const leftovers: {
      army: string;
      method: string;
      pool: string;
      left: number;
      used: number;
      cap: number;
      buyable: boolean;
      reason: string;
    }[] = [];
    for (const scenario of scenarios) {
      for (const [method, methodName] of METHODS) {
        const request: StackRequest = {
          ...scenario.request,
          options: { ...scenario.request.options, method },
        };
        const sized = sizeStacks(request);
        const counts = countsOf(sized);
        const cells: string[] = [];
        const flagged: string[] = [];
        const buyables: string[] = [];
        const reasons: string[] = [];
        for (const pool of ['leadership', 'authority', 'dominance'] as const) {
          const usage = sized.pools[pool];
          if (usage.capacity <= 0) {
            cells.push('—');
            continue;
          }
          const share = usage.used / usage.capacity;
          cells.push(`${n(usage.used)}/${n(usage.capacity)} · ${pct(share)}`);
          if (1 - share <= 0.01) continue;
          const room = usage.capacity - usage.used;
          // Could the army still put *something* in that room, or is every type of the pool at its stock
          // cap? A pool left over because the stock ran out is not a defect; one left over with a type
          // still buyable is the shape his 570-of-600 dominance has.
          const buyable = request.units.some(
            (unit) =>
              unit.pool === pool &&
              unit.cost <= room &&
              (counts[unit.id] ?? 0) < (request.caps[unit.id] ?? Number.MAX_SAFE_INTEGER),
          );
          // The sizer writes its own sentence for every pool it leaves short (`src/engine/stacker.ts`).
          const said = sized.warnings.find((warning) => warning.includes(`${pool} left unused`));
          const reason = said
            ? said
                .slice(said.indexOf('left unused') + 'left unused'.length)
                .replace(/^[;\s]+/, '')
                .replace(/\.$/, '')
            : '';
          flagged.push(pool);
          if (buyable) buyables.push(pool);
          if (reason) reasons.push(`${pool}: ${reason}`);
          leftovers.push({
            army: scenario.label,
            method: methodName,
            pool,
            left: 1 - share,
            used: usage.used,
            cap: usage.capacity,
            buyable,
            reason,
          });
        }
        poolRows.push(
          `| ${method === 'elite' ? short(scenario.label) : ''} | ${methodName} | ${cells.join(' | ')} | ` +
            `${flagged.length === 0 ? '' : `**${flagged.join(', ')}**`} | ` +
            `${buyables.length === 0 ? '' : `**${buyables.join(', ')}**`} | ${reasons.join('; ')} |`,
        );
      }
    }
    report.add('\n## §A — what the generated answer leaves in the pools\n');
    report.add(
      'Each pool as *used / housed · share spent*; a pool the army does not house reads `—`. **> 1 % left** ' +
        'names every pool the answer leaves more than a hundredth of unspent — the defect his march shows at ' +
        '570 of 600 dominance, 5.0 % left. **Could still buy** narrows that to the pools where a type the ' +
        'army holds would still fit in the room left, so a pool left over because the *stock* ran out is not ' +
        'read as the same thing. The last column is the sizer’s own sentence about it.\n',
    );
    report.add(poolRows.join('\n'));
    const buyableLeft = leftovers.filter((row) => row.buyable);
    const worst = [...buyableLeft].sort((a, b) => b.left - a.left)[0];
    report.add(
      `\n**${String(leftovers.length)}** of the ${String(scenarios.length * METHODS.length * 3)} ` +
        `(army × sizing × pool) readings leave more than 1 % of a housed pool unspent, and on ` +
        `**${String(buyableLeft.length)}** of those the army still holds a type that would fit in the room ` +
        'left. The rest are pools whose stock ran out, where there is nothing left to buy.' +
        (worst
          ? `\n\nThe worst leftover with something still buyable: **${pct(worst.left)}** of ${worst.pool} ` +
            `on *${short(worst.army)}* under ${worst.method} — ${n(worst.used)} of ${n(worst.cap)}` +
            `${worst.reason ? `, and the sizer says it is *"${worst.reason}"*` : ''}.`
          : '\n\nNo pool is left over with a type still buyable.') +
        (buyableLeft.length === 0
          ? ''
          : `\n\n${buyableLeft
              .sort((a, b) => b.left - a.left)
              .slice(0, 20)
              .map(
                (row) =>
                  `- **${pct(row.left)}** of ${row.pool} — *${short(row.army)}*, ${row.method}: ` +
                  `${n(row.used)} of ${n(row.cap)}${row.reason ? ` — *"${row.reason}"*` : ''}`,
              )
              .join('\n')}`) +
        '\n',
    );

    // ---- §B — the neighbour check --------------------------------------------------------------------
    const cells: Cell[] = [];
    for (const scenario of scenarios) {
      for (const [method, methodName] of METHODS) {
        const request: StackRequest = {
          ...scenario.request,
          options: { ...scenario.request.options, method },
        };
        const baseCounts = countsOf(sizeStacks(request));
        const base = priceMarch(request, baseCounts);
        const leadership = request.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
        const fielded = leadership.filter((id) => (baseCounts[id] ?? 0) > 0);
        const missing = leadership.filter((id) => (baseCounts[id] ?? 0) <= 0);
        const kept = request.units
          .filter((unit) => unit.pool !== 'leadership' && (baseCounts[unit.id] ?? 0) > 0)
          .map((unit) => unit.id);
        const all = neighboursOf(fielded, missing, kept);
        const tried = all.slice(0, MAX_NEIGHBOURS);
        const cell: Cell = {
          army: scenario.label,
          method: methodName,
          base,
          leadership,
          fielded,
          missing,
          kinds: {
            swap: tried.filter((one) => one.kind === 'swap').length,
            add: tried.filter((one) => one.kind === 'add').length,
            drop: tried.filter((one) => one.kind === 'drop').length,
          },
          tried: tried.length,
          capped: all.length > tried.length,
          dominating: 0,
          best: null,
          loudest: null,
        };
        for (const neighbour of tried) {
          const included = new Set(neighbour.ids);
          // The construction `searchPriority` scopes a subset with (`src/engine/search.ts:112-134`).
          const scoped: StackRequest = {
            ...request,
            units: request.units.filter((unit) => included.has(unit.id)),
          };
          const out = priceMarch(request, countsOf(sizeStacks(scoped)));
          if (!cell.loudest || out.damage > cell.loudest.out.damage) {
            cell.loudest = { neighbour, out, over: overspentOn(out, base) };
          }
          if (out.damage <= base.damage || !fitsInside(out, base)) continue;
          cell.dominating += 1;
          if (!cell.best || out.damage > cell.best.out.damage) cell.best = { neighbour, out };
        }
        cells.push(cell);
      }
    }

    const bRows: string[] = [
      '| army | sizing | troop types held / fielded | swap · add · drop | dominate | best dominating neighbour | damage |',
      '|---|---|---:|---:|---:|---|---:|',
    ];
    for (const cell of cells) {
      bRows.push(
        `| ${cell.method === 'Tier ladder' ? short(cell.army) : ''} | ${cell.method} | ` +
          `${String(cell.leadership.length)} / ${String(cell.fielded.length)} | ` +
          `${String(cell.kinds.swap)} · ${String(cell.kinds.add)} · ${String(cell.kinds.drop)}` +
          `${cell.capped ? ' (capped)' : ''} | ${String(cell.dominating)} | ` +
          `${cell.best ? `**${cell.best.neighbour.moved}**` : '—'} | ` +
          `${cell.best ? gain(cell.best.out.damage / cell.base.damage - 1) : '—'} |`,
      );
    }
    const beaten = cells.filter((cell) => cell.best !== null);
    const biggest = [...beaten].sort(
      (a, b) => (b.best?.out.damage ?? 0) / b.base.damage - (a.best?.out.damage ?? 0) / a.base.damage,
    )[0];
    const fieldsAll = cells.filter((cell) => cell.missing.length === 0).length;
    report.add('\n## §B — the type-set neighbours of the march we generate\n');
    report.add(
      'The base is what `sizeStacks` answers with over **every** type the army holds — the march the player ' +
        'gets from Generate. `F` is the set of **leadership** types that answer actually fields, `M` the ' +
        'leadership types the army holds and it leaves at zero. Each neighbour is one move — `swap` one of ' +
        '`F` for one of `M`, `add` one of `M`, `drop` one of `F` — re-sized by the same sizer over the ' +
        'reduced type list, carrying the base’s hired and monster stacks unchanged. A neighbour ' +
        '**dominates** when it deals strictly more damage *and* spends no more silver, gold, dragon coins or ' +
        `burn than the base, at the ${pct(TOLERANCE)} tolerance the owner set. A dominating neighbour is a ` +
        'march he could have had for the same bill and did not get.\n',
    );
    report.add(bRows.join('\n'));
    report.add(
      `\n**The generated march fields every troop type the army holds on ${String(fieldsAll)} of the ` +
        `${String(cells.length)} cells**, ` +
        'so `M` is empty there and the neighbourhood has **no `swap` and no `add` move to try at all** — only ' +
        'drops. That is not a property of these armies: `sizeStacks` ' +
        'gives every type in the request a rung and rations the pool across all of them ' +
        '(`src/engine/stacker.ts:229-242`), so it can only leave a type out by rounding its count to zero.\n',
    );
    report.add(
      `**${String(beaten.length)} of the ${String(cells.length)} (army × sizing) cells have at least one ` +
        'dominating neighbour**' +
        (biggest?.best
          ? `, the largest gain **${gain(biggest.best.out.damage / biggest.base.damage - 1)}** — ` +
            `${biggest.best.neighbour.moved} on *${short(biggest.army)}* under ${biggest.method} ` +
            `(${n(biggest.base.damage)} → ${n(biggest.best.out.damage)} damage).`
          : '.') +
        `\n\nCells that hit the ${String(MAX_NEIGHBOURS)}-neighbour cap: ` +
        `${
          cells.filter((cell) => cell.capped).length === 0
            ? '**none**'
            : cells
                .filter((cell) => cell.capped)
                .map((cell) => `*${short(cell.army)}* · ${cell.method}`)
                .join('; ')
        }.\n`,
    );

    report.add('\n### Every dominating cell, with what moved and what it cost\n');
    const detail: string[] = [
      '| army | sizing | move | damage | silver | gold | coins | burn |',
      '|---|---|---|---:|---:|---:|---:|---:|',
    ];
    for (const cell of beaten) {
      const best = cell.best;
      if (!best) continue;
      const ratio = (cost: Cost): string =>
        cell.base[cost] === 0
          ? best.out[cost] === 0
            ? '='
            : 'from 0'
          : gain(best.out[cost] / cell.base[cost] - 1);
      detail.push(
        `| ${short(cell.army)} | ${cell.method} | **${best.neighbour.moved}** | ` +
          `${gain(best.out.damage / cell.base.damage - 1)} | ${ratio('silver')} | ${ratio('gold')} | ` +
          `${ratio('dragonCoins')} | ${ratio('burned')} |`,
      );
    }
    report.add(
      detail.length > 2
        ? detail.join('\n')
        : '_No cell had a dominating neighbour: on every army, under both sizings, no one-type move away ' +
            'from the generated type set bought more damage inside the same budget._',
    );

    report.add('\n### The best neighbour on damage alone, fitting or not\n');
    report.add(
      'The same neighbourhood ranked on damage with the budget ignored, so a move that is only refused by ' +
        'the spend gate is visible as that rather than as no move at all. `over` names the costs it exceeds ' +
        'the base on.\n',
    );
    const loud: string[] = [
      '| army | sizing | best move on damage | damage | silver | fits the base’s budget | over |',
      '|---|---|---|---:|---:|---|---|',
    ];
    for (const cell of cells) {
      const loudest = cell.loudest;
      if (!loudest) continue;
      loud.push(
        `| ${cell.method === 'Tier ladder' ? short(cell.army) : ''} | ${cell.method} | ` +
          `${loudest.neighbour.moved} | ${gain(loudest.out.damage / cell.base.damage - 1)} | ` +
          `${cell.base.silver > 0 ? gain(loudest.out.silver / cell.base.silver - 1) : '—'} | ` +
          `${loudest.over.length === 0 ? 'yes' : '**no**'} | ${loudest.over.join(', ')} |`,
      );
    }
    report.add(loud.join('\n'));

    // The owner's own signature: a march that fields Spearman I while leaving Archer II at home.
    const signature = cells.filter(
      (cell) => cell.fielded.includes('spearman-1') && cell.missing.includes('archer-2'),
    );
    const troopless = cells.filter((cell) => cell.fielded.length === 0);
    report.add(
      `\n**His own signature — Spearman I fielded while Archer II is held and left out — appears on ` +
        `${String(signature.length)} of the ${String(cells.length)} cells.**` +
        (signature.length === 0
          ? ' It cannot appear on a `sizeStacks` answer that holds both types, for the reason above: the ' +
            'sizer leaves no held type out unless its count rounds to zero. A generated march that fields ' +
            'Spearman I and no Archer II therefore came from a path that **selects** types — the plan’s ' +
            'prefix family — or from a request that did not hold Archer II at all.'
          : `\n\n${signature.map((cell) => `- *${short(cell.army)}* · ${cell.method}`).join('\n')}`) +
        `\n\nCells whose generated march fields **no troop type at all**: **${String(troopless.length)}**.\n`,
    );

    // ---- §B2 — the engine's own subset search beside the same base ------------------------------------
    report.add('\n## §B2 — what the engine’s own subset search finds over the same army\n');
    report.add(
      '`searchPriority` (`src/engine/search.ts`) already selects a **subset of types**: exhaustive up to ' +
        `twelve of them, a seeded hill-climb above that, on the app’s own ${n(CAMPAIGN.budgets.search)} ms ` +
        'budget. It is asked here for the worst opening, the reading everything else in this file is priced ' +
        'on, and its answer is priced and gated against the generated base exactly as a neighbour is. It ' +
        'searches **every** pool, not just the troops, so it is a wider move than §B’s one-type neighbours — ' +
        'and it is not what Generate calls.\n',
    );
    const searchRows: string[] = [
      '| army | sizing | types kept | damage | silver | fits the base’s budget | over | exhaustive |',
      '|---|---|---:|---:|---:|---|---|---|',
    ];
    let searchBeats = 0;
    let searchLouder = 0;
    for (const scenario of scenarios) {
      for (const [method, methodName] of METHODS) {
        const request: StackRequest = {
          ...scenario.request,
          options: { ...scenario.request.options, method },
        };
        const base = priceMarch(request, countsOf(sizeStacks(request)));
        const found = searchPriority({
          request,
          objective: 'minDamage',
          budgetMs: CAMPAIGN.budgets.search,
        });
        const out = priceMarch(request, countsOf(found.result));
        const over = overspentOn(out, base);
        if (out.damage > base.damage) searchLouder += 1;
        if (out.damage > base.damage && over.length === 0) searchBeats += 1;
        searchRows.push(
          `| ${method === 'elite' ? short(scenario.label) : ''} | ${methodName} | ` +
            `${String(found.includedUnitIds.length)}/${String(request.units.length)} | ` +
            `${gain(out.damage / base.damage - 1)} | ` +
            `${base.silver > 0 ? gain(out.silver / base.silver - 1) : '—'} | ` +
            `${over.length === 0 ? 'yes' : '**no**'} | ${over.join(', ')} | ` +
            `${found.exhaustive ? 'yes' : `no (${n(found.evaluated)} scored)`} |`,
        );
      }
    }
    report.add(searchRows.join('\n'));
    report.add(
      `\n**The engine’s own subset search out-damages the generated march on ${String(searchLouder)} of the ` +
        `${String(scenarios.length * METHODS.length)} cells and dominates it on ${String(searchBeats)}** — ` +
        'the difference between the two counts is the silver: a subset concentrates the same leadership ' +
        'into higher tiers, which costs more to retrain, and the spend gate refuses that trade.\n',
    );

    // ---- §B3 — is the better set even in the plan's family? -------------------------------------------
    report.add('\n## §B3 — the troop ranking, and whether the better set is a prefix of it\n');
    report.add(
      '`rankTroops` (`src/engine/plan.ts:791-795`) orders the leadership types by `damagePerUnit / hp`, ' +
        '**weakest per point of HP first** — the top rung of the ladder goes to the weakest, so it dies ' +
        'unstruck. Both halves are bonus-scaled (§D), so this order *does* move with the captains. The ' +
        'plan’s family is the last `k` entries of it (`src/engine/plan.ts:2793`), so a type set that keeps a ' +
        'low-ranked type while dropping a higher-ranked one is a march **no depth of that family can ' +
        'propose**. The ranking is printed weakest-first, with each type’s damage per point of HP.\n',
    );
    const rankRows: string[] = ['| army | the troop ranking, weakest damage-per-HP first |', '|---|---|'];
    const orderOf = new Map<string, string[]>();
    for (const scenario of scenarios) {
      const ranked = rankTroops(effectiveTable(scenario.request));
      orderOf.set(
        scenario.label,
        ranked.map((entry) => entry.id),
      );
      rankRows.push(
        `| ${short(scenario.label)} | ` +
          `${ranked.map((entry) => `${label(entry.id)} ${(entry.damagePerUnit / entry.hp).toFixed(2)}`).join(' · ')} |`,
      );
    }
    report.add(rankRows.join('\n'));
    const prefixRows: string[] = [
      '| army | sizing | best move on damage | a prefix of the ranking | best dominating move | a prefix |',
      '|---|---|---|---|---|---|',
    ];
    let outsideFamily = 0;
    for (const cell of cells) {
      const order = orderOf.get(cell.army) ?? [];
      const held = new Set(cell.leadership);
      const reach = (neighbour: Neighbour | undefined): string =>
        neighbour
          ? isPrefix(
              order,
              neighbour.ids.filter((id) => held.has(id)),
            )
            ? 'yes'
            : '**no**'
          : '—';
      if (
        cell.loudest &&
        !isPrefix(
          order,
          cell.loudest.neighbour.ids.filter((id) => held.has(id)),
        )
      ) {
        outsideFamily += 1;
      }
      prefixRows.push(
        `| ${cell.method === 'Tier ladder' ? short(cell.army) : ''} | ${cell.method} | ` +
          `${cell.loudest?.neighbour.moved ?? '—'} | ${reach(cell.loudest?.neighbour)} | ` +
          `${cell.best?.neighbour.moved ?? '—'} | ${reach(cell.best?.neighbour)} |`,
      );
    }
    report.add('\n' + prefixRows.join('\n'));
    report.add(
      `\n**On ${String(outsideFamily)} of the ${String(cells.length)} cells the best one-type move on damage ` +
        'is a set the plan’s prefix family cannot reach**, because the type it drops is not the bottom of ' +
        'the ranking. Those marches are outside the search by construction, whatever the budget.\n',
    );

    /**
     * **The two type sets he quoted, read against the ranking above.** This is not a reconstruction of his
     * camp — his was 5 600 leadership with a 600 dominance pool, and no scenario here is that army. It is
     * the cheapest possible reading of his message: take the **sets of troop types** in the two marches he
     * sent and ask where each one sits in the ranking his own export produces.
     */
    const exportOrder = orderOf.get('2026-09-17 export, its setup (7 000 leadership)');
    if (exportOrder) {
      const his = ['rider-1', 'archer-2', 'spearman-2', 'rider-2', 'rider-3'];
      const ours = ['spearman-1', 'rider-1', 'spearman-2', 'rider-2', 'rider-3'];
      const named = (ids: readonly string[]): string => ids.map((id) => label(id)).join(' · ');
      report.add(
        '\n### The two type sets he sent, against his own export’s ranking\n\n' +
          'Neither march is re-run here — this is the *set* of troop types in each, read against the ranking ' +
          'his export produces (7 000 leadership, his three captains, the row above). His camp was 5 600 ' +
          'leadership with a 600 dominance pool and is not this army, so this says where the two sets sit ' +
          'in the order, nothing more.\n\n' +
          `- the ranking, weakest per HP first: **${named(exportOrder)}**\n` +
          `- its strongest five, which is what a depth-5 prefix fields: ` +
          `**${named(exportOrder.slice(-5))}**\n` +
          `- **his hand-crafted march** fields ${named(his)} — a prefix of the ranking: ` +
          `**${isPrefix(exportOrder, his) ? 'yes' : 'no'}**\n` +
          `- **what the app generated** fields ${named(ours)} — a prefix of the ranking: ` +
          `**${isPrefix(exportOrder, ours) ? 'yes' : 'no'}**\n`,
      );
    }

    // ---- §D — where the bonuses reach type selection --------------------------------------------------
    report.add('\n## §D — where the bonuses do and do not reach type selection\n');
    report.add(
      'Two rankings decide which types are in a march and in what order. They read different things, and ' +
        'only one of them can see a captain.\n\n' +
        '**1. The kill order is hero-blind.** `rankKey` (`src/engine/killOrder.ts:21-33`) builds its sort ' +
        'key out of `unit.pool`, whether the unit is an engineer, `unit.tier`, `unit.group`, `unit.category` ' +
        'and the unit’s index in the list. Its whole signature is `rankKey(unit: UnitDef, index: number)` — ' +
        'there is no bonus argument to pass one in, and the module imports only `Pool`/`UnitDef` from ' +
        '`../data/types` and `StackingOptions` (`src/engine/killOrder.ts:14-15`). `eliteOrder` ' +
        '(`src/engine/killOrder.ts:44-49`) is that key sorted, and `buildKillOrder` ' +
        '(`src/engine/killOrder.ts:55-64`) is `eliteOrder` plus a user’s custom list. **No bonus of any ' +
        'kind reaches it**: the same account with no captain enlisted and with three gets the identical ' +
        'order, which is tier ascending, specialists before guardsmen, ranged → melee → mounted → flying.\n\n' +
        '**2. The troop ranking is hero-aware.** `rankTroops` (`src/engine/plan.ts:791-795`) sorts the ' +
        'leadership entries by `damagePerUnit / hp`, ascending — weakest per point of HP first. Both halves ' +
        'come from `effectiveTable` (`src/engine/plan.ts:759-779`), which calls ' +
        '`effectiveUnit(unit, request.totals, request.enemy, request.activeEvents)` and `hitDamage(eff, 1)`. ' +
        '`effectiveUnit` (`src/engine/units.ts:121-142`) multiplies health by `healthPercent` and strength ' +
        'by `strengthPercent`, each of which sums `totals.health[key]` / `totals.strength[key]` over the ' +
        'unit’s keys (`src/engine/units.ts:100-112`), and `request.totals` is ' +
        '`aggregateBonuses(resolveSources(profile, setup, tables))` — the enlisted captains among them ' +
        '(`src/state/derive.ts:603-617`). **So a captain moves `rankTroops` and cannot move the kill ' +
        'order.** §B3 prints the order it produces on each army.\n\n' +
        '**3. Where the prefix is taken.** The plan’s sizer family is built over a *prefix* of the troop ' +
        'ranking: `sizer(mercs, method, depth)` (`src/engine/plan.ts:2774-2796`) passes ' +
        '`new Set(troops.slice(-depth).map((entry) => entry.id))` to `sizedShape`, and `troops` there is ' +
        '`rankTroops(table)` (`src/engine/plan.ts:2443`). `sizedShape` (`src/engine/plan.ts:1660-1695`) ' +
        'filters `request.units` by that set and hands the rest to `sizeStacks`. So **the prefix is taken ' +
        'off the hero-aware ranking** — the plan’s choice of *which* troop types to field does read the ' +
        'bonuses — while **the order the rungs are laid in, inside the chosen set, is the hero-blind one**: ' +
        '`sizeStacks` sorts its slots by `buildOrderIndex` → `buildKillOrder` ' +
        '(`src/engine/stacker.ts:351-354`, used at `src/engine/stacker.ts:242`), and `sizePool` then gives ' +
        'rank *i* the target `H − i·δ` (`src/engine/stacker.ts:58-62`). The counts that come out are ' +
        'bonus-aware only through `hpPerUnit`.\n\n' +
        '**4. What Generate does, which is the shape §A and §B measure.** `sizeStacks` selects **nothing**. ' +
        'Every type in `request.units` gets a slot (`src/engine/stacker.ts:229-242`) and the pool is ' +
        'rationed across all of them; a type leaves the march only when `floor(target / hpPerUnit)` rounds ' +
        'it to zero or a cap or ceiling removes it. There is no comparison of type against type anywhere in ' +
        'that path — the ladder’s *order* is the kill order, which is hero-blind, and its *membership* is ' +
        'whatever the request was handed. That is what §B measured: the generated march fields every held ' +
        `troop type on ${String(fieldsAll)} of ${String(cells.length)} cells. The one component in the ` +
        'engine that does compare type sets, `searchPriority`, is called from `src/worker/jobs.ts:27` and ' +
        'from `src/engine/campaign.ts:382`, **not** from the Battle card’s Generate.\n\n' +
        '**The verdict.** Of the two rankings, the **kill order is hero-blind and the troop ranking is ' +
        'hero-aware**. The plan’s type *selection* therefore does read the captains; the sizer’s does not ' +
        'select at all. So the owner’s sentence — *"we don’t properly explore alternative troops depending ' +
        'on heroes bonuses"* — is not, on this evidence, a bonus that fails to reach the ranking. It is the ' +
        '**family**: only prefixes of one ranking are ever proposed, and §B3 counts how many of the better ' +
        'sets found here are outside it.\n\n' +
        '**What could not be established from the code.** Which of the two paths produced the march he ' +
        'quoted. His export’s setup carries `options.method: "plan"`, and a march that fields Spearman I ' +
        'while holding Archer II at zero cannot come from `sizeStacks` over a request holding both — but ' +
        'the counts he quotes were not reproduced here and no capture of that run is in the tree, so this ' +
        'is an inference from §B’s measurement and not a reading of his run.\n',
    );

    report.save();
  }, 3_600_000);
});
