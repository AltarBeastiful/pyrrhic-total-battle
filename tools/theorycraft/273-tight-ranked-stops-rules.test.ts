/**
 * 273 — **which selection rule recovers the Tight-ranked winner, and at what cost** (scores 272's data, no engine
 * call). For each stop, the replacement is the best candidate *on the full Tight reading* among those the rule sends
 * to the full Tight, if it beats the shipped stop (rating > 0) and keeps the stop's identity; the shipped stop
 * otherwise — so every rule is ≥ 0 on every stop by construction, and the question is how much of the oracle (full
 * Tight on every candidate) it keeps and what it costs.
 *
 * Identity, on the full Tight figures: same burn (the frontier rows are read at the stop's own burn); the silver
 * saver no more silver than the shipped one; `steady-max` / `all-in` no less damage; `thrifty` is never replaced
 * (it is read off the finished bar, not the frontier). The bar's order (stops other than `all-in` rising strictly
 * in Tight damage, as they did shipped) is checked after the replacement.
 *
 * `THEORY=1 INF=<272's jsonl> OUTF=<file> pnpm vitest run tools/theorycraft/273-tight-ranked-stops-rules.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

interface Row { pre: number; r0: number; r4: number; rf: number; bill: { d: number; s: number; g: number; h: number }; ms0: number; ms4: number; msf: number }
interface Stop {
  label: string; index: number; pick: string; burn: number; complete: boolean; cands: number;
  shipped: { tight: { d: number; s: number }; ms: number }; retypeMs: number; buildMs: number; rows: Row[];
  bar: { pick: string; burn: number; seq: boolean }[];
}
interface Rule { name: string; pick: (rows: Row[]) => Row[]; proxy: 'none' | 'r0' | 'r4' }

const top = (rows: Row[], by: (r: Row) => number, k: number): Row[] => [...rows].sort((a, b) => by(b) - by(a)).slice(0, k);
const RULES: Rule[] = [
  { name: 'oracle (all)', pick: (r) => r, proxy: 'none' },
  ...[1, 3, 5, 10, 20].map((k): Rule => ({ name: `pre top ${String(k)}`, pick: (r) => top(r, (x) => x.pre, k), proxy: 'none' })),
  ...[1, 3, 5, 10].map((k): Rule => ({ name: `r0 top ${String(k)}`, pick: (r) => top(r, (x) => x.r0, k), proxy: 'r0' })),
  ...[1, 3, 5].map((k): Rule => ({ name: `r4 top ${String(k)}`, pick: (r) => top(r, (x) => x.r4, k), proxy: 'r4' })),
  ...[3, 5].map((k): Rule => ({ name: `pre top ${String(k)} ∪ r0 top ${String(k)}`, pick: (r) => [...new Set([...top(r, (x) => x.pre, k), ...top(r, (x) => x.r0, k)])], proxy: 'r0' })),
  ...[1, 3, 5].map((k): Rule => ({ name: `r0 top ${String(k)}, r0 > 0`, pick: (r) => top(r.filter((x) => x.r0 > 0), (x) => x.r0, k), proxy: 'r0' })),
  { name: 'r0 only (no full re-read)', pick: (r) => top(r, (x) => x.r0, 1), proxy: 'r0' },
];

const feasible = (s: Stop, r: Row): boolean => {
  if (s.pick === 'thrifty') return false;
  if (s.pick === 'silver-saver' && r.bill.s > s.shipped.tight.s) return false;
  if ((s.pick === 'steady-max' || s.pick === 'all-in') && r.bill.d < s.shipped.tight.d) return false;
  return true;
};

describe.skipIf(!process.env.THEORY)('273 — tight-ranked stops, rules', () => {
  it('scores the rules', () => {
    const lines = readFileSync(process.env.INF!, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as Stop & { skipped?: string });
    const stops = lines.filter((s) => s.skipped === undefined);
    const out: string[] = [];
    const cases = [...new Set(stops.map((s) => s.label))];
    out.push(`stops ${String(stops.length)} over ${String(cases.length)} cases; incomplete (budget cut) ${String(stops.filter((s) => !s.complete).length)}; skipped cases ${String(lines.length - stops.length)}`);
    for (const rule of RULES) {
      let improved = 0, equal = 0, worse = 0, sum = 0, best = 0, missed = 0, orderBreaks = 0;
      const caseMs = new Map<string, number>();
      const chosen = new Map<Stop, { gain: number; d: number; s: number }>();
      let sig = 0;
      for (const s of stops) {
        // Cost: every candidate's retype + build, the proxy on all of them, the full Tight on the picked ones.
        const pickedRows = rule.name.startsWith('r0 only') ? [] : rule.pick(s.rows);
        let ms = s.retypeMs + s.buildMs + pickedRows.reduce((a, r) => a + r.msf, 0);
        if (rule.proxy === 'r0') ms += s.rows.reduce((a, r) => a + r.ms0, 0);
        if (rule.proxy === 'r4') ms += s.rows.reduce((a, r) => a + r.ms4, 0);
        caseMs.set(s.label, (caseMs.get(s.label) ?? 0) + ms);
        let pool = rule.name.startsWith('r0 only') ? top(s.rows, (x) => x.r0, 1) : pickedRows;
        pool = pool.filter((r) => feasible(s, r));
        const win = pool.reduce<Row | null>((m, r) => (r.rf > (m?.rf ?? 0) ? r : m), null);
        // 'r0 only' trusts the proxy: it would ship a candidate the full Tight rates < 0 — counted as worse.
        const gain = rule.name.startsWith('r0 only') ? (win === null || win.r0 <= 0 ? 0 : win.rf) : (win?.rf ?? 0);
        chosen.set(s, { gain, d: gain !== 0 && win !== null ? win.bill.d : s.shipped.tight.d, s: gain !== 0 && win !== null ? win.bill.s : s.shipped.tight.s });
        if (gain >= 0.25) sig += 1;
        const oracle = Math.max(0, ...s.rows.filter((r) => feasible(s, r)).map((r) => r.rf));
        if (gain > 1e-9) improved += 1;
        else if (gain < -1e-9) worse += 1;
        else equal += 1;
        if (gain < oracle - 1e-9) missed += 1;
        sum += gain;
        best = Math.max(best, gain);
      }
      // The bar's order on Tight damage, stops other than all-in, wherever it held shipped.
      for (const label of cases) {
        const bar = stops.filter((s) => s.label === label && s.pick !== 'all-in').sort((a, b) => a.index - b.index);
        for (let i = 1; i < bar.length; i += 1) {
          const lo = bar[i - 1]!, hi = bar[i]!;
          const heldShipped = hi.shipped.tight.d > lo.shipped.tight.d;
          if (heldShipped && !(chosen.get(hi)!.d > chosen.get(lo)!.d)) orderBreaks += 1;
        }
      }
      const ms = [...caseMs.values()];
      // Star-up on the account's merc saver: the chosen Tight march at ★0, ★1, ★2.
      const mono = [0, 1, 2]
        .map((k) => stops.find((x) => x.label === `acct ★${String(k)}` && x.pick === 'burn-saver'))
        .map((x) => (x === undefined ? '-' : `${String(chosen.get(x)!.d)}/${String(chosen.get(x)!.s)}`))
        .join(' → ');
      out.push(
        `${rule.name.padEnd(26)} | improved ${String(improved)} (≥0.25: ${String(sig)}) equal ${String(equal)} worse ${String(worse)} | below oracle ${String(missed)} | Σ gain ${sum.toFixed(2)} mean ${(sum / stops.length).toFixed(2)} best ${best.toFixed(2)} | order breaks ${String(orderBreaks)} | per-case added s: mean ${(ms.reduce((a, b) => a + b, 0) / ms.length / 1000).toFixed(1)} max ${(Math.max(...ms) / 1000).toFixed(1)} | acct merc saver ★0→★2 d/s ${mono}`,
      );
    }
    // Per case, under one rule (`RULE`, default r0 top 3): stops improved/equal/worse, best and mean gain, seconds added.
    const chosenRule = RULES.find((r) => r.name === (process.env.RULE ?? 'r0 top 3'))!;
    out.push('', `per case under "${chosenRule.name}": label | improved/equal/worse | best | mean | added s | oracle Σ | complete`);
    for (const label of cases) {
      const mine = stops.filter((s) => s.label === label);
      let imp = 0, eq = 0, wo = 0, best = 0, sum = 0, ms = 0, orc = 0;
      for (const s of mine) {
        const picked = chosenRule.pick(s.rows);
        ms += s.retypeMs + s.buildMs + picked.reduce((a, r) => a + r.msf, 0) + s.rows.reduce((a, r) => a + r.ms0, 0);
        const gain = Math.max(0, ...picked.filter((r) => feasible(s, r)).map((r) => r.rf));
        orc += Math.max(0, ...s.rows.filter((r) => feasible(s, r)).map((r) => r.rf));
        if (gain > 0.005) imp += 1; else if (gain < 0) wo += 1; else eq += 1;
        best = Math.max(best, gain);
        sum += gain;
      }
      out.push(`${label.slice(0, 70)} | ${String(imp)}/${String(eq)}/${String(wo)} | ${best.toFixed(2)} | ${(sum / mine.length).toFixed(2)} | ${(ms / 1000).toFixed(1)} | ${orc.toFixed(2)} | ${mine.every((s) => s.complete) ? 'yes' : 'NO (budget cut)'}`);
    }
    // Per case and stop: the oracle and the rule the report recommends.
    out.push('', 'per stop: label | pick | cands | shipped tight d/s | oracle gain | pre top5 | r0 top3 | r0 top5');
    for (const s of stops) {
      const f = s.rows.filter((r) => feasible(s, r));
      const g = (rows: Row[]) => Math.max(0, ...rows.filter((r) => feasible(s, r)).map((r) => r.rf)).toFixed(2);
      out.push(`${s.label} | ${s.pick} | ${String(s.cands)}${s.complete ? '' : ' (cut)'} | ${String(s.shipped.tight.d)}/${String(s.shipped.tight.s)} | ${g(f)} | ${g(top(s.rows, (x) => x.pre, 5))} | ${g(top(s.rows, (x) => x.r0, 3))} | ${g(top(s.rows, (x) => x.r0, 5))}`);
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  });
});
