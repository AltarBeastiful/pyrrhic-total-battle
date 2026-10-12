The clamps A/B on the owner’s live account: the same one full Generate + advisor (218/222’s harness),
run **before → after → before → after** in one process, swapping only the raise kernel
(`setRaiseKernel(createRaiseKernel(module))`). **before** is `HEAD`’s kernel, **after** the one with the
two box clamps in `raise()`’s slot loop (each authority slot at its chunk top, every pool at its housing
spare — applied to `rTo` only, the seed untouched). Timings are the **min** of the two rounds.
- **Sanity: the two builds differ** — re-pricing one captured box on each, the after arm reports a
  **smaller** box (other/probe campaign:tier:monster monster tier 4: space 56,606,376,960 → 53,887,680). The clamps are live; the A/B is not vacuous.
| arm | calls | with a box | walked | searched | Σ raise ms | Σ pass ms |
|---|---:|---:|---:|---:|---:|---:|
| before | 921 | 769 | 351 | 418 | 28371 | 46231 |
| after | 921 | 506 | 421 | 85 | 11950 | 28594 |
- Rounds: before 29085 / 28371 ms raise (48127 / 46231 ms pass); after 12299 / 11950 ms raise (29793 / 28594 ms pass).
- **Σ raise: 28371 ms → 11950 ms (×2.37, saved 57.9 %).**
- **Σ pass: 46231 ms → 28594 ms (saved 38.2 %).**
- **Search mix: 351 walked / 418 searched before → 421 walked / 85 searched after.**
- **Counts moved between the arms: 10**; label mismatches 0 (0 = the two runs made the same calls in the same order).
- Of the movers: **10 searched before, 9 searched after** — the clamp's smaller box is a *different* climb, and the after arm lands on a **higher-rated** vector every time: rating Δ (after − before) **10 up, 0 down** (of 10; +0.02…+0.11 each). No call got worse.

### Calls whose counts moved (the first 10)

| call | before | after | Δ rating | moved counts |
|---|---|---|---:|---|
| captains/probe captain:brunhild:star | searched | searched | 0.074 | battle-boar 43→42, emerald-dragon 47→45, stone-gargoyle 38→39, water-elemental 103→107 |
| captains/probe captain:brunhild:level | searched | searched | 0.100 | battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125 |
| captains/probe captain:brann:star | searched | searched | 0.104 | battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125 |
| captains/probe captain:brann:level | searched | searched | 0.104 | battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125 |
| captains/probe captain:brann:level10 | searched | searched | 0.104 | battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125 |
| captains/probe captain:logos:star | searched | searched | 0.104 | battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125 |
| captains/probe captain:logos:level | searched | searched | 0.104 | battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125 |
| captains/probe captain:logos:level10 | searched | searched | 0.104 | battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125 |
| captains/probe captain:beowulf:level | searched | searched | 0.108 | battle-boar 43→48, stone-gargoyle 35→32, water-elemental 127→125 |
| other/probe sweep:dominance:4 | searched | walked | 0.018 | emerald-dragon 44→43, stone-gargoyle 38→39, water-elemental 108→107 |

### The 10 slowest calls after the change

| call | before ms | after ms |
|---|---:|---:|
| captains/probe captain:alexander:level10 | 794 | 402 |
| other/probe sweep:dominance:32 | 355 | 345 |
| captains/probe captain:minamoto:level10 | 156 | 183 |
| captains/probe captain:minamoto:star | 149 | 174 |
| captains/probe captain:bernard:level | 372 | 171 |
| captains/probe captain:beowulf:star | 422 | 168 |
| captains/probe captain:minamoto:level | 159 | 151 |
| captains/probe alexander,aydae,minamoto | 162 | 150 |
| captains/probe captain:alexander:level | 164 | 148 |
| captains/probe captain:minamoto:level | 153 | 146 |

### What the numbers say

The clamps cut the `Tight` wall from **28371 ms to 11950 ms** (×2.37, 57.9 % of the raise) on the live workload, and the whole Generate + advisor pass from 46231 ms to 28594 ms (38.2 %). The win is the walked/searched flip — the box cap pulls most wide boxes under the walk cap, so the mix moves from 351 walked / 418 searched to 421 walked / 85 searched, and a walked box is both exhaustive and cheap. The safety number is **10** calls whose counts move (of 921; label mismatches 0, so the two runs made the same calls in the same order). They are the same 10 dominance-heavy captain probes experiment 218 flagged — the golden corpus (340 positions) does not carry them, which is why it saw none — and on every one the after arm is **better or equal**, never worse (rating Δ 10 up / 0 down; the smaller box is a different climb that lands on a higher-rated vector). So the clamps are costless-to-better here, not literally count-identical.
