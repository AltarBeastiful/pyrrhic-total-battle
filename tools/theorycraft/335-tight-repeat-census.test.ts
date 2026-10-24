/**
 * 335 — **how many Tight calls ask a question already answered** (330's corpus). A call's answer is a pure
 * function of what the kernel is handed: the packed table (`packRequest` with the base march's tie-break
 * column), the base counts, the caps, the modes and the burn cap. Keyed on exactly those bytes, per source:
 * calls, distinct keys, and the searched wall a cross-call answer memo would not spend (332's per-call
 * figures). A memo keyed on the full bytes cannot answer differently, so it is exact by construction.
 *
 * `THEORY=1 OUTF=<file> pnpm vitest run tools/theorycraft/335-tight-repeat-census.test.ts`
 */
/// <reference types="node" />
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { packRequest } from '../../src/kernel/pack';

import { loadCorpus, SCRATCH } from './331-tight-replay';

describe.skipIf(!process.env.THEORY)('335 — Tight repeat census', () => {
  it('counts', () => {
    const corpus = loadCorpus();
    const base = readFileSync(`${SCRATCH}/332-base.jsonl`, 'utf8').trim().split('\n').map((l) => JSON.parse(l) as { i: number; src: string; how: number; msRepo: number });
    const bySrc = new Map<string, { calls: number; keys: Set<string>; ms: number; msSaved: number; searched: number; searchedRepeat: number; label: Map<string, number> }>();
    for (const r of base) {
      const call = corpus.calls[r.i]!;
      const request = corpus.requests[call.req]!;
      const order = new Map(call.input.base.stacks.map((s, k) => [s.unitId, k]));
      const packed = packRequest(request, CAMPAIGN.markerRates, undefined, Int32Array.from(request.units, (u) => order.get(u.id) ?? -1));
      const own = new Map(call.input.base.stacks.map((s) => [s.unitId, s.count]));
      const h = createHash('sha1');
      h.update(Buffer.from(packed.table.buffer, packed.table.byteOffset, packed.table.byteLength));
      h.update(JSON.stringify([packed.ids, packed.ids.map((id) => own.get(id) ?? 0), packed.ids.map((id) => request.caps[id] ?? -1), call.input.modes, call.input.burnCap ?? null]));
      const key = h.digest('hex');
      const g = bySrc.get(r.src) ?? { calls: 0, keys: new Set<string>(), ms: 0, msSaved: 0, searched: 0, searchedRepeat: 0, label: new Map<string, number>() };
      bySrc.set(r.src, g);
      g.calls += 1;
      g.ms += r.msRepo;
      if (r.how === 2) g.searched += 1;
      if (g.keys.has(key)) {
        g.msSaved += r.msRepo;
        if (r.how === 2) g.searchedRepeat += 1;
        const lab = call.label.replace(/ .*/, '');
        g.label.set(lab, (g.label.get(lab) ?? 0) + 1);
      }
      g.keys.add(key);
    }
    const out: string[] = ['| src | calls | distinct | repeats | searched | searched repeats | Tight ms | ms a memo saves | repeats by job |', '|---|---:|---:|---:|---:|---:|---:|---:|---|'];
    for (const [src, g] of bySrc)
      out.push(`| ${src} | ${g.calls} | ${g.keys.size} | ${g.calls - g.keys.size} | ${g.searched} | ${g.searchedRepeat} | ${g.ms.toFixed(0)} | ${g.msSaved.toFixed(0)} (${((g.msSaved / g.ms) * 100).toFixed(1)} %) | ${JSON.stringify([...g.label])} |`);
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 3_600_000);
});
