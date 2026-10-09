---
type: analysis
title: Todos triage, ideas already done or obsolete
created: 2026-10-09
tags: [backlog, triage]
related: ['[[00-inventory]]', '[[01-relevant]]', '[[03-needs-owner]]', '[[Progression-Advisor-Plan]]']
---

# Done or obsolete

| Id | Class | Evidence |
| --- | --- | --- |
| T-02 raise to what the troops shelter | done | S-142 (`docs/PLAN.md` line 442), marked done by the owner in `todos.md` itself. |
| T-05 round to the nearest 10 while shielded | done | S-142 carries the `Most, in tens` position; the plan itself ignores `roundTo10` on purpose (benchmark scenario 18, commit `d19aa5b`). |
| T-06 Enter validates count edits | done | Commit `6a1a27d` (2026-10-02); `src/ui/kit/enterCommits.ts`, used by `CornerGear.tsx`, `Sheet.tsx`, `MarchPills.tsx`. |
| T-07 Enter validates in popups | done | Same commit and files; `Sheet` walks to the next typed field and closes on the last. |
| T-09 advice on what would improve the plan | done | S-150 to S-158: advisor pool, probes, "What to upgrade next" card (`AdvisorCard.tsx`), typed upgrades, captain advice, other questions. Overlaps [[Progression-Advisor-Plan]] Phases 01 to 06. |
| T-10 guide next moves in research or training | done | S-153 (typed upgrades ranked by gain per cost), S-157 (next star or level), S-158 (next tier, merc stock, horizon). |
| T-14 account with Google login | done | S-49c, S-49d, S-49e: commits `c308f14`, `fea7eaf`, `2c129b4`; ADR `docs/decisions/0009-optional-account-sync.md`, plan `docs/plans/sso-accounts.md`. Remaining operations items (Discord secret, rotate a leaked secret, phone tests) are listed in that plan, not a todo of this file. |
| T-17 picture of two heroes with different quality 3-sets | obsolete | An illustration, not an ask; the image file `image.png` is not in the repo. Its content is carried by T-18. |
| T-22 sliding leadership and dominance | done | S-158 and `docs/plans/advisor-step-d.md`: dominance and leadership sweeps drawn as step lists with the flattening point. Phase 06 of the advisor playbook. |
| T-23 use the actual planning algorithm for the sweeps | done | Same: a sweep is a list of `Probe`s each run through the real plan (`src/engine/advisor-sweeps.ts`). |
| T-25 mobile Back closes the popup | done | Commit `6a1a27d`; `src/ui/kit/backCloses.ts` (touch only), used by `Dialog.tsx` and `MarchSheet.tsx`, test `backCloses.test.tsx`. |
| T-26 safe push of mercs or monsters to fill the stack | done | S-142 and S-144: `Most`, `Safe`, `Tight`; Tight is the default (commit `1cb2ac9`). |
| T-31 check Tight can trade better first | done | `docs/plans/tight-default.md` section 1: experiments 188 and 189, rated Tight better on 9 of 68 stops, worse on 0. |
| T-32 Tight default, remove the table and the other options | done | Commit `1cb2ac9`: the selector is `As is` and `Tight`, the positions table is gone, the worker prices only `tight`. |
| T-33 hover preview of the trade (silver, gold, damage) | done | Same commit; `docs/plans/tight-default.md` section 2 item 5, gold shown only where a march pays any (design rule 15). |
