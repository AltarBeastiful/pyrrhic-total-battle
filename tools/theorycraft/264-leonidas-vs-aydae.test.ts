/**
 * 264 — **Leonidas against Aydae on the owner's profile**: the champion pass as the page runs it (`runHeroChampion`),
 * printed for two heroes: the star road at their level, the level road at their star, the lead over the field, the
 * valleys, and the trios they sit in with their ladders.
 *
 * `THEORY=1 [ACCOUNT=file] [HEROES=leonidas,aydae] pnpm vitest run tools/theorycraft/264-leonidas-vs-aydae.test.ts`
 * Writes `tools/theorycraft/out/264-leonidas-vs-aydae.md`.
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseImport } from '../../src/share/exportImport';
import { championRoster } from '../../src/state/heroChampionRoster';
import type { Profile } from '../../src/state/schema';
import { createInlineClient } from '../../src/worker/client';
import { runHeroChampion } from '../../src/worker/heroChampion';
import { createCalcPool } from '../../src/worker/pool';

const OUT = 'tools/theorycraft/out/264-leonidas-vs-aydae.md';
const NO_CLOCK = 1_000_000_000;
const FILE = process.env.ACCOUNT ?? 'pyrrhic-my-account-2026-10-11.json';
const IDS = (process.env.HEROES ?? 'leonidas,aydae').split(',');
const f = (value: number, digits = 1): string => value.toFixed(digits);

describe.skipIf(!process.env.THEORY)('264 — Leonidas against Aydae', () => {
  it('prints their roads, leads, valleys and trios', async () => {
    const parsed = parseImport(readFileSync(FILE, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const profile = structuredClone(parsed.payload) as Profile;
    const setup = profile.setups[0]!;
    const pool = createCalcPool({
      size: 1,
      createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
    });
    const lines = ['# 264 — Leonidas against Aydae', '', `Account ${FILE}, setup ${setup.name}.`, ''];
    try {
      const roster = championRoster(profile, setup);
      const { champion } = await runHeroChampion(roster, pool, { budgetMs: NO_CLOCK });
      const name = (id: string): string => roster.heroes.find((h) => h.captainId === id)?.name ?? id;
      lines.push(
        `Champion ${name(champion.champion?.captainId ?? '')} (lead ${f(champion.champion?.lead ?? 0)}), challenger ${name(champion.challenger?.captainId ?? '')}.`,
        `Board: ${champion.board.map((e) => `${name(e.captainId)} ${f(e.lead)} (leads ${String(e.leadsAt.wins)}/${String(e.leadsAt.of)})`).join(' · ')}`,
        `Replaced: ${champion.replaced.map((r) => `${name(r.captainId)} by ${name(r.by)}`).join(', ') || 'none'}`,
        '',
      );
      for (const id of IDS) {
        const hero = roster.heroes.find((h) => h.captainId === id);
        const tile = champion.tiles.find((t) => t.captainId === id);
        lines.push(`## ${name(id)} — now L${String(hero?.level)} ★${String(hero?.star)}`);
        if (tile === undefined) {
          lines.push(
            champion.replaced.some((r) => r.captainId === id) ? 'Replaced.' : 'Not on the board.',
            '',
          );
          continue;
        }
        lines.push(
          `Tier ${tile.tier}, lead ${f(tile.lead)}, today ${tile.today === null ? '?' : f(tile.today)} → potential ${f(tile.potential)}.`,
          `Star road at L${String(hero?.level)}: ${tile.starPath.map((p) => `★${String(p.star)} ${f(p.rating)}`).join(' · ')}`,
          `Level road at ★${String(hero?.star)}: ${tile.levelPath.map((p) => `L${String(p.level)} ${f(p.rating)}`).join(' · ')}`,
          `Valleys (mean of three plans): ${JSON.stringify(champion.valleys[id] ?? 'not read')}`,
          '',
        );
      }
      const trios = champion.trios;
      if (trios !== undefined) {
        lines.push(
          '## Trios',
          trios.ranked
            .slice(0, 8)
            .map((t) => `${t.captainIds.map(name).join(' + ')} ${f(t.rating)}`)
            .join('\n'),
          '',
        );
        const advised = trios.advised;
        if (advised !== null) {
          lines.push(
            `Advised: ${advised.captainIds.map(name).join(' + ')} (now ${f(advised.now)}, ceiling ${f(advised.ceiling)})`,
          );
          for (const m of advised.order)
            lines.push(
              `- ${name(m.captainId)}: +${f(m.gain)} at ★${String(m.bestStar)}; ladder ${m.ladder.stars.map((v, s) => `★${String(s)} ${f(v)}`).join(' · ')}; levels ${m.ladder.levels.map((l) => `L${String(l.level)} ${f(l.rating)}`).join(' · ')}`,
            );
        }
        for (const id of IDS) {
          const ladders = trios.ranked
            .slice(0, 3)
            .flatMap((t) =>
              champion.trios?.ranked.includes(t) && t.captainIds.includes(id)
                ? [`${t.captainIds.map(name).join(' + ')}`]
                : [],
            );
          lines.push(`${name(id)} sits in the top trios: ${ladders.join('; ') || 'none of the top three'}`);
        }
      }
      expect(champion.champion).not.toBeNull();
    } finally {
      pool.dispose();
      writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
  }, 3_600_000);
});
