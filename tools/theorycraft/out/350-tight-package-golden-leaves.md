# 350/351 — exact Tight package in a worktree (kernel = kx8h, algo 22 + rating memo + 271 hashed memo as defaults)

raise-kernel.json: 1430 answers (golden 1430); leaves differing {"scored":8}
  scored on the differing answers: golden Σ 17356876 → package Σ 12166611 (8 answers, every one lower: true)
raise.json: 73 stops, 365 rows; leaves differing {"scored":16}
  scored on the differing rows: golden Σ 162591255 → package Σ 117146206 (16 rows, every one lower: true)

Full suite in the worktree:
⎯⎯⎯⎯⎯⎯⎯ Failed Tests 5 ⎯⎯⎯⎯⎯⎯⎯
 FAIL  tests/kernel/golden-capture.test.ts > the golden capture (E3 S0) > raise.json: the kernel alone answers every stop’s five positions
 FAIL  tests/kernel/raise-kernel.test.ts > the raise positions on the kernel > answers every position of army first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) as the TypeScript once did
 FAIL  tests/kernel/raise-kernel.test.ts > the raise positions on the kernel > answers every position of army first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) as the TypeScript once did
 FAIL  tests/kernel/raise-kernel.test.ts > the raise positions on the kernel > answers every position of army his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) as the TypeScript once did
 FAIL  tests/kernel/raise-kernel.test.ts > the raise positions on the kernel > takes the whole-roster path and the tie-break the TypeScript did
 Test Files  2 failed | 163 passed | 262 skipped (427)
      Tests  5 failed | 2169 passed | 631 skipped (2805)

plan-benchmark + advisor-golden:
 Test Files  2 passed (2)
      Tests  22 passed (22)
benchmark-latest.json: only timing fields differ from HEAD.
