# The hero champion by leadership

Owner, 2026-10-23, on the 10-22 account export: *"if I move the leadership from 7000 to 13k or 15k the
leaderboard changes, showing that end-game heroes depend also on the leadership pool, which grows inevitably
with higher levels."* Dominance is a possible second axis. Alexander is irrelevant to the point: the owner's
account is the worked example, other players hold other heroes, so nothing in the logic may name a hero.

Follows [the hero champion](the-hero-champion.md). Status: **closed, no effect (2026-10-23)** — experiment 297 found no champion crossover and a noise-sized reshuffle
behind it; see *Outcome* at the end. Settled in the grilling session of 2026-10-23.

## Problem Statement

The hero champion pass reads every hero on the march as it stands, at the setup's live leadership (11,815 on
the owner's account). Leadership grows with every level the player gains, so the hero worth levelling toward
the end game is the one who leads at the leadership the player will have, not the one who leads today. The
owner saw the leaderboard reorder between 7k, 13k and 15k. Today the report names one champion and one
"aim" (the hero to take to ★5) as if the pool were fixed, so the advice can be right today and wrong in the
end game, and nothing on the page says so.

## Solution

The hero report keeps today's verdict at the live leadership and adds the leadership axis beside it:

1. Each hero tile gets a small **by leadership** strip: the hero's rank at each leadership anchor.
2. The page names a **crossover** when the champion changes along the anchors ("X leads until about 13k, then
   Y"), and says nothing when one hero leads at every anchor.
3. The **aim at ★5** advice is re-read at the top anchor, since that is the end game the player is building
   toward.
4. The anchors are the player's live leadership plus a configured ladder of higher values (13k and 15k to
   start). Anchors below the live value are skipped: leadership does not fall.
5. A **second wave** after the base pass does the extra reading, so the base report never waits for it. It
   reads only the podium's top three plus any hero within 10 % of third place, and solo curves only. When the
   clock cuts it, the strip carries the existing "partial" badge.
6. The dominance pool is **not** swept unless experiment 297 shows it flips the podium; then it joins as a
   second axis under the same rules.

The logic is roster-agnostic: owned heroes come from the loaded account, never from a list.

## Experiment gate (297)

Before any build, a throwaway experiment reads every owned hero of the 10-22 export at leadership 7k, 11.8k
(live), 13k and 15k, with dominance at 2,000 and again at 4,000, and reports:

- where the podium and the solo champion flip along leadership, and by how much (rating units);
- whether the aim at ★5 flips;
- whether dominance 2,000 to 4,000 moves the podium at all (decides story 12 below and the dominance axis);
- the plan count and wall-clock of the second wave on a 6-worker pool.

If leadership flips nothing on the 10-22 account and on the other exports to hand, the spec is closed as
"no effect" and the experiment's note is the deliverable.

## User Stories

1. As a player, I want the report to tell me when the best hero changes as my leadership grows, so that I do
   not level toward a hero who only leads today.
2. As a player, I want today's champion and podium unchanged at my live leadership, so that the advice I
   already rely on does not move under me.
3. As a player, I want a "by leadership" strip on each hero tile, so that I see how that hero ranks as my pool
   grows.
4. As a player, I want a named crossover ("X leads until about 13k, then Y"), so that I know at what pool the
   advice changes.
5. As a player, I want no crossover text when one hero leads at every anchor, so that the page stays quiet
   when the answer is stable.
6. As a player, I want the aim at ★5 re-read at the highest leadership, so that the end-game hero is the one I
   am told to build.
7. As a player with low leadership, I want anchors below my live value skipped, so that I am never shown a pool
   I can no longer have.
8. As a player whose leadership already exceeds the ladder, I want my live value to be the only anchor and the
   strip to stay absent, so that nothing misleading appears.
9. As a player with a different roster, I want the same analysis for the heroes I own, so that the report is
   not tuned to anyone's account.
10. As a player on a slow machine, I want the base report to finish before the leadership sweep starts, so
    that I read the main answer without waiting.
11. As a player, I want a "partial" badge on a strip the clock cut short, so that I do not trust a half-read
    crossover.
12. As a player, I want dominance considered only if it changes the outcome, so that the page does not grow an
    axis that never matters.
13. As a player, I want the progress bar to keep never stepping back across both waves, so that it does not
    look stuck or broken when the second wave adds jobs.
14. As a player, I want a hero within 10 % of third place to be read at every anchor, so that a close contender
    who overtakes at 15k is not missed.
15. As a player, I want a hero far below the podium left unread at the extra anchors, so that the sweep stays
    within its time budget.
16. As a player, I want the sweep to read solo curves only, so that the cost stays proportionate and trio
    claims stay untold where a single-plan read is below the noise floor.
17. As the owner debugging a stall, I want a per-wave timing log under the profiling switch, so that I can
    paste one run from my export and the stall can be found from data.
18. As the owner, I want the ladder of higher leadership values to live in the one config file, so that I can
    change 13k and 15k without touching code.
19. As the owner, I want the pool-size assumption (6 workers) to be the measured basis of the time budget, so
    that a figure taken on 15 workers is never quoted again.
20. As a maintainer, I want tests on a synthetic roster, so that no test depends on a real player's heroes.

## Implementation Decisions

- The leadership axis rides the existing **variant** seam of the champion roster, which already builds the
  march with the leadership housing moved. It generalises from a small relative jitter to an absolute
  leadership value; the jitter used for valley noise stays as it is.
- The anchor list is derived in one place from the setup's live leadership and the configured ladder (values
  at or below the live value dropped, live value always first).
- The base pass is unchanged and reads at the live leadership. The leadership sweep is a **second wave** with
  its own batch, added after the base pass; it reuses the pass's pool batching, never idles workers at the
  tail, and respects the pass's clock.
- Wave-two selection: the podium's top three (the same three as the page's "Right now" podium) plus every hero
  whose rating is within 10 % of third place. Solo curves only; no trio ladders or valleys.
- Output gains a per-hero ranking by anchor, an optional crossover record on the champion, and a flag marking
  a strip as partial. The aim-at-★5 read is repeated at the top anchor only.
- Progress: both waves share one monotone progress; the bar stays short of full until the whole pass ends and
  closes at 100 % even when the clock cuts jobs (existing behaviour, extended to wave two).
- Time budgets, measured on a 6-worker pool (the real pool cap, not 15): at most 60 s for the base pass and
  at most 60 s more for the second wave. First lever if missed: a coarser grid; the champion sharpening stays.
- A per-wave timing log is emitted under the existing profiling switch and folds out of the production build.
- No hero name appears in the logic. The experiment script's hardcoded hero list becomes "the owned heroes of
  the loaded account".
- Trio valleys stay untold (experiment 262 put them below the noise floor).
- The kernel item closes: the plans already run in the kernel. It reopens only if the sweep needs a new
  kernel entry point.
- Dominance: no change unless experiment 297 flips the podium; then the same anchor mechanism takes a second
  axis, and the wave-two budget is re-derived.

## Testing Decisions

- A good test drives the pass the way the page does and asserts what the player would see (the crossover, the
  strip, the badge), never which job was sent where.
- **One seam, the highest existing one:** the champion pass run against a roster and a fake pool, as the
  existing champion tests do. Leadership anchors, crossover, wave-two selection, the partial flag, skipped
  low anchors and monotone progress are all asserted there on a synthetic roster.
- The profile/UI side gets one e2e journey on the owner's export asserting the strip and a crossover appear
  and the partial badge on a clock cut; builds precede e2e (`pnpm build`), because the preview serves a stale
  dist.
- Engine-only tests are acceptable while the kernel is untouched; the moment a kernel entry point is added,
  the rule "one test, both paths" applies: red on both first, then green on both.
- Prior art: the champion pass tests (valley, ladder, progress, partial data) and the J7 journey.

## Out of Scope

- Sweeping dominance (unless experiment 297 says so), monster tier or camp: those stay fixed to the plan.
- Trio ladders and trio valleys across anchors.
- Heroes far below the podium at the extra anchors.
- A kernel port.
- Lowering leadership below the live value.
- Housekeeping of stray files (done separately: delete wget logs, `__pycache__` and the `udo apt-mark…` file;
  move the Signal keyring and sources out of the repo; gitignore the 10-07 export, `__pycache__/`, `wget-log*`).

## Further Notes

- The 33 s figure of the previous round was measured on 15 workers; on the real cap of 6 it is about 80 s for
  the base pass alone, which is why the budgets above are stated on 6.
- The owner's saved 7,000-leadership stack falls outside the anchors by construction (below live), but the
  experiment still reads 7k to see how far the leaderboard moves.
- The "blocks on one task" report was never reproduced from the Node harness; the timing log is the way to
  find it.

## Outcome (2026-10-23, experiment 297)

Experiment 297 (`tools/theorycraft/297-leadership-flips.test.ts`, note `tools/theorycraft/out/297-leadership-flips.md`)
read every owned hero of the 10-22 export on solo curves (stars 0 to 6, level grid of `levelStep`) at leadership 7,000,
11,815 (live), 13,000 and 15,000 with dominance 2,000, and at the live leadership with dominance 4,000.

- **The champion never changes.** Cleopatra leads at every pool, peak rating 56.3 / 57.7 / 61.4 / 58.9, against 20 to 37
  for the runner-up. The aim at ★5 is the same hero at every pool. No crossover exists to name.
- **Positions 2 to 5 reorder, but not as a trend.** Alexander 3rd, 5th, 7th, 5th; Aydae 4th, 3rd, 5th, 3rd; Minamoto 5th,
  4th, 3rd, 4th (7k, 11.8k, 13k, 15k). The order flips back and forth between anchors, and the swings (Leonidas 29.7 at
  13k, 20.8 at 15k) are the size of the single-plan noise of experiment 262 (median 5.5 rating units). The data do not
  separate a leadership effect from that noise.
- **Dominance 2,000 to 4,000** also reshuffles positions 2 to 4 (Aydae 2nd, Minamoto 3rd, Leonidas 4th, instead of Leonidas
  2nd, Aydae 3rd), with the same noise caveat. By the spec's rule that makes it a candidate axis, but it is not worth an
  axis while the reshuffle cannot be told from noise.
- **Cost.** 157 to 231 s per leadership setting on one inline worker (688 s with dominance 4,000): the sweep is not free.
- **Not measured.** Only the 10-22 export was read (the older exports predate the roster); the second wave's plan count and
  6-worker wall-clock were not measured, since the build did not go ahead.

**Decision:** the spec is closed as "no effect"; nothing is built, `src/` is untouched. It reopens if a later account shows a
champion that changes with the pool, or if the single-plan noise is cut below the gap between positions 2 and 5 (then a
strip shown only when a gap exceeds the noise floor would be the form to build).
