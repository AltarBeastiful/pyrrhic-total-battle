# Screen with As is, then read the survivors with Tight

**Status: implemented 2026-10-11** (experiment 202; `CAMPAIGN.advisorScreen`). Owner, 2026-10-11: *"right now
profile everything computes marches using Tight to match the current battle settings and tight computations are
responsible for a big amount of computations. But in the end, the computations behind profile everything are there
to find possible leads, and just a few of them are interesting. One idea would be to do the whole computation using
as-is (skipping tight) … then if we find anything worth it, we can run tight computations; making sure we're not
redoing all the computations already done; in order to provide correct numbers … This would first require a quick
benchmark to see if worth is roughly the same using as-is or tight as a base."*

## 1. The idea

An advisor pass (`runAdvisor`, `src/worker/advisor.ts`) plans the baseline and every probe's whole campaign, then
reads every stop of every bar *as the March shows it* (`shownMarch`, `src/worker/jobs.ts`): raised by Tight, then
battled. That Tight raise is half the pool's CPU in the owner's 2026-10-10 trace. Most probes are worth nothing,
yet each pays for it.

**Two stages.**

1. **Screen**: the baseline and every probe, planned and read **As is** (the plan's counts battled untouched, no
   raise). Gains come out of the same `readStop`, on the same rating.
2. **Confirm**: the baseline and the **survivors** of the screen, read **again by Tight** — on the bars stage 1
   planned (`reread`: the counts of each stop are kept, no second `planCampaign`), so a survivor's row is exactly
   the row an all-Tight pass gives. A probe the screen dropped keeps its As-is row, marked `screened`.

Nothing in stage 2 is recomputed from stage 1 except what the reading itself changes: the marches. The plans, the
largest other half of the CPU, are paid once.

## 2. The benchmark (experiment 202)

`tools/theorycraft/202-screen-then-tight.test.ts` runs the 29 generic probes through `runAdvisor` twice on every
army (the owner's 2026-10-07 account and every owner / common benchmark scenario), once per reading
(`options.reading`), one inline lane, no clock. Per army: wall, Spearman ρ between the two readings' best-stop
gains and sweet-spot gains, the number of worthwhile probes (gain ≥ 0.25 rating points), and the largest gap on
any stop. Then candidate survivor rules are scored against the Tight answer: do they keep the Tight top 5, every
worthwhile probe, and how much of the total Tight gain would they miss.

Results: see `tools/theorycraft/out/202-screen-then-tight.md` and §4.

## 3. Design

- `ProbeInput.reading: 'tight' | 'as-is'` and `reread` (`src/worker/protocol.ts`); `shownMarch` skips the raise
  under `as-is`.
- `screenSurvivors` (`src/worker/advisor.ts`): a probe goes on when it is among the `top` best by its best stop
  or gains ≥ `share` × the best probe's gain, and never when it gains nothing. `CAMPAIGN.advisorScreen =
  { top, share }`; `null` reads every probe by Tight (one pass, the old behaviour).
- `AdvisorRow.screened?: true` marks a row read As is only.
- Progress: stage 1 reports `n + 1` jobs; stage 2 grows the total once by `survivors + 1`.
- The pass's clock is the whole pass's: stage 2 gets what stage 1 left. A survivor cut in stage 2 is reported
  cut (its Tight reading did not finish); if the Tight baseline is cut, the screen's rows stand, all `screened`.
- **Not touched**: the captain passes (`runCaptainAdvice`, `runCaptainUpgrades`) call `client.probe` themselves
  and still read by Tight; the March's own plan and bar; every figure of a survivor.

## 4. Gates

- `tests/golden/advisor.json` is read with `screen: null` and is **byte-identical** (no pin moved).
- A new golden-fixture test: on the owner export, every row the screened pass read by Tight equals the all-Tight
  row, the best probe is always kept, and the dropped probes are flagged.
- A unit test on the worker level (`advisor.test.ts`): stage 2 never plans (every Tight job is a `reread`).
- The plan benchmark is untouched (no plan or position changes).
