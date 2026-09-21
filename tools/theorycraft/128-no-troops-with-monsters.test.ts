/**
 * 128 — **the monster camp that marches with no troops at all** (owner, 2026-09-21: *"right now with the
 * config I've been using for testing monsters, I get no troops using tier ladder or troop first, check it in
 * the browser then reproduce this case in the engine"*).
 *
 * **Driven in his browser first** (localhost:5173, his live `pyrrhic.v1`, 2026-09-21). The March pane reads
 * **0 of 5 600 leadership** on both methods: three stacks — Battle Boar 50, Stone Gargoyle 37, Epic Monster
 * Hunter VI 14 — with the engine's own warning *"5 600 leadership left unused; nothing in this march needs
 * it."* and `dropped: []`. Pressing Generate again, on either method, answers the same thing.
 *
 * **And the sizers are not what answered it.** Called on that very state, in that very browser, through
 * `buildStackRequest`, both of them fill the pool to the last point and field all seven troop types — so the
 * thing on his screen came from somewhere else. It came from `setup.priority`, which is
 * **`damagePerSilver`** on this setup: `runGenerate` (`ui/sections/march/generate.ts`) branches on the
 * *objective* before it ever reaches the sizer, and a march with an objective on it is `searchPriority`'s
 * answer, not Tier ladder's or Troops first's. The method radio still reads *Troops first*.
 *
 * The search is not malfunctioning either — it is winning the game it was given. Dropping every troop type
 * takes the silver bill from ~2.37 M to 174 K, so damage a silver goes **1.24 → 5.85**, and the objective
 * asks for nothing else. It costs **65 %** of the damage and leaves the whole leadership pool at home.
 *
 * **Everything below goes through `buildStackRequest` on his captured profile and setup**
 * (`docs/research/fixtures/owner-monster-camp-2026-09-21.json`, read out of his browser verbatim) rather
 * than through a hand-written `StackRequest` — his own rule for this repo, 2026-09-21: *"we should always
 * test against current engine using a high level abstraction to avoid missing settings or moving things and
 * forgetting to change it in the test"*. Nothing here names a flag, an option default or a bonus; a default
 * that moves in `derive.ts` moves this experiment with it.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/128-no-troops-with-monsters.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, it } from 'vitest';

import { simulateBattle } from '../../src/engine/battle';
import { searchPriority } from '../../src/engine/search';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { CAMPAIGN } from '../../src/config';
import { buildStackRequest } from '../../src/state/derive';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { Report, label, n } from './harness';

const FIXTURE = new URL('../../docs/research/fixtures/owner-monster-camp-2026-09-21.json', import.meta.url);

/**
 * His camp as his browser holds it. The fixture is the **profile and the setup**, so everything the march
 * depends on — the troop windows, the monster window, the captain, Arachne's Invasion, the housing, the
 * temple, the objective — is read through `buildStackRequest` exactly as the Battle card reads it.
 */
function ownersMonsterCamp(): { profile: Profile; setup: BattleSetup } {
  const raw = JSON.parse(readFileSync(FIXTURE, 'utf8')) as { profile: Profile; setup: BattleSetup };
  return { profile: raw.profile, setup: raw.setup };
}

interface Reading {
  what: string;
  troopTypes: number;
  leadership: string;
  dominance: string;
  min: number;
  avg: number;
  silver: number;
  perSilver: number;
}

function read(what: string, request: StackRequest, result: StackResult): Reading {
  const summary = simulateBattle(result, request);
  return {
    what,
    troopTypes: result.stacks.filter((stack) => stack.pool === 'leadership').length,
    leadership: `${n(result.pools.leadership.used)}/${n(result.pools.leadership.capacity)}`,
    dominance: `${n(result.pools.dominance.used)}/${n(result.pools.dominance.capacity)}`,
    min: summary.minDamage,
    avg: summary.avgDamage,
    silver: summary.recovery.silver,
    perSilver: summary.avgDamage / Math.max(1, summary.recovery.silver),
  };
}

describe.skipIf(!process.env.THEORY)('the monster camp that marches with no troops', () => {
  it('A — the sizers fill the pool; the objective is what empties it', () => {
    const report = new Report('128-no-troops-with-monsters');
    const { profile, setup } = ownersMonsterCamp();
    const request = buildStackRequest(profile, setup);

    report.add(`# 128 — no troops on his monster camp, and what actually answers Generate\n`);
    report.add(
      `His setup: housing **${n(request.housing.leadership)} / ${n(request.housing.authority)} / ${n(
        request.housing.dominance,
      )}**, method **\`${request.options.method}\`**, objective **\`${String(setup.priority)}\`**, ` +
        `events \`${request.activeEvents.join(', ') || 'none'}\`.\n`,
    );

    report.h('A — the units the request carries');
    const byPool: Record<string, string[]> = { leadership: [], authority: [], dominance: [] };
    for (const unit of request.units) byPool[unit.pool]?.push(label(unit.id));
    for (const pool of ['leadership', 'authority', 'dominance'] as const)
      report.add(
        `- **${pool}** — ${String(byPool[pool]?.length ?? 0)} types: ${byPool[pool]?.join(' · ') || '**none**'}`,
      );
    report.add(
      `\nSo the army is not the problem: seven troop types reach the engine on every one of the runs below.`,
    );

    report.h('B — what each way of answering Generate returns');
    const readings: Reading[] = [];
    for (const method of ['elite', 'ms'] as const)
      readings.push(
        read(
          method === 'elite' ? 'Tier ladder (`elite`), the sizer' : 'Troops first (`ms`), the sizer',
          request,
          sizeStacks({ ...request, options: { ...request.options, method } }),
        ),
      );
    const found = searchPriority({
      request,
      objective: 'damagePerSilver',
      budgetMs: CAMPAIGN.budgets.search,
    });
    readings.push(
      read('**the objective on his setup** — `searchPriority(damagePerSilver)`', request, found.result),
    );

    report.add(
      '\n| what answered | troop types | leadership | dominance | worst opening | expected | silver | damage a silver |\n' +
        '|---|---|---|---|---|---|---|---|\n' +
        readings
          .map(
            (r) =>
              `| ${r.what} | **${String(r.troopTypes)}** | ${r.leadership} | ${r.dominance} | ${n(
                r.min,
              )} | ${n(r.avg)} | ${n(r.silver)} | **${r.perSilver.toFixed(3)}** |`,
          )
          .join('\n'),
    );
    report.add(
      `\nThe types the search kept: \`${found.includedUnitIds.join('`, `')}\` — every leadership type is out.`,
    );
    report.save();
  });
});
