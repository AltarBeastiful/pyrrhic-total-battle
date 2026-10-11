# Screen with As is, then read the survivors with Tight

**Status: built, switched off 2026-10-11** (experiment 202; `CAMPAIGN.advisorScreen = null`; the owner decides). Owner, 2026-10-11: *"right now
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

Results (20 armies, `tools/theorycraft/out/202-screen-then-tight.md`):

- **Tight is a small part of the wall on most armies.** As-is costs 0.89–1.00 of Tight on 15 of 20 (no stop has a
  troop floor to shelter by, so the raise does nothing), 0.72 on the 2026-10-07 account and on one 2026-09-18
  camp. The saving is real only on the heavy armies: the 20 000-dominance camp is 5 116 s by Tight and 59 s
  As is (86×).
- **As is ranks the probes like Tight on most armies and not on the ones where Tight matters.** Spearman ρ on
  the best-stop gain: 1.00 on 12 armies, 0.97–0.99 on four more, but 0.85 (live camp 2026-09-18, 4 000 case),
  0.79 (monsters 3–5 at 900 dominance) and **0.17** (the 20 000-dominance camp). Largest per-stop gap 40.6.
- **No rule is safe.** Pooled over 104 worthwhile Tight gains (≥ 0.25): `top 12` keeps 92 and misses 18 % of the
  gain; `gain > 0` keeps 94 (41 % of probes read) and misses 7 %; `top 5 ∪ ≥ 0.25 × best` keeps 78 (19 %) and
  misses 22 %. **The Tight-best probe is dropped on 2–4 of 20 armies under every rule**, because the shelter
  turns a small As-is gain into the big Tight one (and the reverse).

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

## 4. Verdict and the switch

The idea holds where Tight is cheap and fails where it is dear: the armies that would save the most are the ones
whose As-is reading ranks the probes worst. Since a screen that can drop the best lead is a regression against
`feedback-benchmark-non-regression`, the mechanism ships **off** (`CAMPAIGN.advisorScreen: null`, every row read
by Tight, every golden byte-identical). To try it, set `advisorScreen: { top: 5, share: 0.25 }` in `src/config.ts`
(measured: ~16 % of the owner account's pass; far more on heavy camps; leads missed as above). Rows the screen
dropped are flagged `screened` in `AdvisorRow`; the card does not yet show the flag. A safer screen would need a
reading that sees the shelter without paying for the search (e.g. the Tight raise on the sweet-spot stop only);
not built.

## 5. Gates

- `tests/golden/advisor.json` is read with `screen: null` and is **byte-identical** (no pin moved).
- A new golden-fixture test: on the owner export, every row the screened pass read by Tight equals the all-Tight
  row, the best probe is always kept, and the dropped probes are flagged.
- A unit test on the worker level (`advisor.test.ts`): stage 2 never plans (every Tight job is a `reread`).
- The plan benchmark is untouched (no plan or position changes).
