/**
 * 256 — **which pass makes the merc saver at ★0 and ★1** (follows 255): the merc saver's unraised figures with each
 * post-pass of `CAMPAIGN.planFixes` / `putBack` switched off in turn, for Leonidas ★0 and ★1.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file> pnpm vitest run tools/theorycraft/256-merc-saver-passes.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';

describe.skipIf(!process.env.THEORY)('256 — merc saver passes', () => {
  it('switches the passes off', () => {
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const out: string[] = [];
    const variants: [string, Record<string, unknown>][] = [
      ['shipped', {}],
      ['no retype', { retype: undefined }],
      ['no putBack', { putBack: undefined }],
      ['no fold', { foldTo: undefined }],
      ['no tierCandidate', { tierCandidate: false }],
      ['no fifthStop', { fifthStop: undefined }],
      ['no dropTypes', { dropTypes: undefined }],
      ['bare (no retype/putBack/fold/fifth/drop)', { retype: undefined, putBack: undefined, foldTo: undefined, fifthStop: undefined, dropTypes: undefined }],
    ];
    for (const star of [0, 1]) {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      for (const [name, patch] of variants) {
        const input = { ...buildPlanRequest(profile, profile.setups[0]!), ...patch };
        const plan = planCampaign(input);
        const s = plan.alternatives.find((a) => a.pick === 'burn-saver');
        out.push(
          `★${String(star)} ${name.padEnd(40)} ${s ? `dmg ${String(s.repeat.damage)} silver ${String(Math.round(s.repeat.silver))} burn ${String(s.repeat.mercLost)} putBack ${s.putBack?.unitId ?? '-'} retyped ${String(s.retyped?.marches ?? '-')} types ${String(Object.keys(s.counts).length)}` : 'no merc saver'}`,
        );
      }
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 1_800_000);
});
