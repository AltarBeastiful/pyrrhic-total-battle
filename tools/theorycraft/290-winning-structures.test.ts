/**
 * 290 — **what the winning shapes look like** (archetype research, task step 1). For the 2026-10-22 account at Leonidas
 * ★0/★1/★2 and each of the merc saver / silver saver / sweet spot: every frontier shape at the stop's burn is re-typed,
 * read on the cheap Tight proxy (0 restarts), the top 10 by the proxy on the full Tight; the top-10 after-Tight shapes are
 * described structurally (troop slots in kill order, HP vector, hired stacks). Writes a JSONL of every candidate
 * (counts, pre, proxy) for 291/292, and a text digest.
 *
 * `THEORY=1 ACCT=<file> OUTF=<digest> DATA=<jsonl> pnpm vitest run tools/theorycraft/290-winning-structures.test.ts`
 */
/// <reference types="node" />
import { appendFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import {
  admissible,
  CAMPAIGN,
  accountInput,
  frontierCands,
  fullKernel,
  planCampaign,
  proxyKernel,
  rate,
  structOf,
  tight,
  typeTable,
  useFull,
  STOPS,
} from './290-common';

const short = (id: string): string =>
  id
    .replace('swordsman', 'SW')
    .replace('spearman', 'SP')
    .replace('archer', 'AR')
    .replace('rider', 'RD')
    .replace('-', '');

describe.skipIf(!process.env.THEORY)('290 — winning structures', () => {
  it('describes', () => {
    useFull();
    writeFileSync(process.env.DATA!, '');
    const out: string[] = [];
    for (const star of [0, 1, 2]) {
      const input = accountInput(star);
      const plan = planCampaign({ ...input, withFrontier: true });
      const tt = typeTable(input.request);
      for (const stop of plan.alternatives) {
        if (!STOPS.includes(stop.pick) || stop.sequence !== undefined) continue;
        const burn = stop.repeat.mercLost;
        const shipped = tight(fullKernel, input.request, stop.counts);
        const { cands, shapes } = frontierCands(input, plan.frontier ?? [], stop.counts, burn);
        const rows = cands.map((c) => {
          const p = tight(proxyKernel, input.request, c.counts);
          return { ...c, r0: rate(shipped.bill, p.bill, CAMPAIGN.markerRates), p0: p.bill };
        });
        rows.sort((a, b) => b.r0 - a.r0);
        const adm = rows.filter((r) => admissible(stop.pick, shipped.bill, r.p0));
        const top = adm.slice(0, 10).map((r) => ({ ...r, f: tight(fullKernel, input.request, r.counts) }));
        const scored = top.map((r) => ({
          ...r,
          rf: rate(shipped.bill, r.f.bill, CAMPAIGN.markerRates),
          ok: admissible(stop.pick, shipped.bill, r.f.bill),
        }));
        scored.sort((a, b) => Number(b.ok) - Number(a.ok) || b.rf - a.rf);
        out.push(
          `== ★${String(star)} ${stop.pick} burn ${String(burn)} | frontier shapes ${String(shapes)} cands ${String(cands.length)} | admissible ${String(adm.length)} | shipped Tight ${String(shipped.bill.damage)}/${String(Math.round(shipped.bill.silver ?? 0))} q ${String(Math.round(shipped.bill.seconds ?? 0))}`,
        );
        const sig = {
          hired: new Set<string>(),
          k: new Set<number>(),
          perm: new Set<string>(),
          hp: new Set<string>(),
          out: new Set<string>(),
          coarse: new Set<string>(),
        };
        for (const r of scored) {
          const s = structOf(input.request, r.counts);
          const hiredSig = JSON.stringify(Object.entries(s.hired).sort());
          const outTypes = [...tt.keys()]
            .filter(
              (id) =>
                tt.get(id) &&
                !s.troops.includes(id) &&
                ['ranged', 'melee', 'mounted'].includes(tt.get(id)!.cat) &&
                tt.get(id)!.tier <= 3 &&
                !id.endsWith('-6'),
            )
            .sort()
            .join(',');
          sig.hired.add(hiredSig);
          sig.k.add(s.troops.length);
          sig.perm.add(s.troops.join(','));
          sig.hp.add(s.hp.map((h) => Math.round(h / 1e4)).join(','));
          sig.out.add(outTypes);
          sig.coarse.add(s.troops.map((id) => `${tt.get(id)!.cat[0]}${String(tt.get(id)!.tier)}`).join(''));
          out.push(
            `  rf ${r.rf.toFixed(2).padStart(6)} d ${String(r.f.bill.damage)} s ${String(Math.round(r.f.bill.silver ?? 0))} q ${String(Math.round(r.f.bill.seconds ?? 0))} ${r.ok ? '' : 'INADMISSIBLE '}| k ${String(s.troops.length)} | ${s.troops.map(short).join(' ')} | hp ${String(Math.round(s.hp[0]! / 1e3))}k..${String(Math.round(s.hp[s.hp.length - 1]! / 1e3))}k | hired ${Object.entries(
              s.hired,
            )
              .map(([k, v]) => `${k.replace('-6', '')}:${String(v)}`)
              .join(' ')}`,
          );
        }
        out.push(
          `  distinct among top10: hired ${String(sig.hired.size)} k ${String(sig.k.size)} (${[...sig.k].join('/')}) perm ${String(sig.perm.size)} hpvec(10k-rounded) ${String(sig.hp.size)} tiers-out ${String(sig.out.size)} class-order ${String(sig.coarse.size)}`,
        );
        for (const r of rows)
          appendFileSync(
            process.env.DATA!,
            JSON.stringify({
              star,
              pick: stop.pick,
              burn,
              counts: r.counts,
              pre: +r.pre.toFixed(3),
              r0: +r.r0.toFixed(3),
              b0: r.p0,
            }) + '\n',
          );
        // Within-frontier diversity (all cands)
        const all = cands.map((c) => structOf(input.request, c.counts));
        out.push(
          `  all ${String(cands.length)} cands: distinct hired ${String(new Set(all.map((s) => JSON.stringify(Object.entries(s.hired).sort()))).size)} k-values ${[...new Set(all.map((s) => s.troops.length))].sort().join('/')} hpvec ${String(new Set(all.map((s) => s.hp.map((h) => Math.round(h / 1e4)).join(','))).size)} perms ${String(new Set(all.map((s) => s.troops.join(','))).size)}`,
        );
        writeFileSync(process.env.OUTF!, out.join('\n') + '\n');
      }
    }
  }, 3_600_000);
});
