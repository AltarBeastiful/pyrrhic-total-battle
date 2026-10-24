# Descent from the flat 11-slot shape — conclusions (2026-10-24)

Experiments 300 (descent V3), 301 (stack-number rule), 353 (read on the Tight package), 360/361 (planner port and
timing). Account: `pyrrhic-my-account-2026-10-22.json`. The planner port is kept as
`docs/research/patches/360-descent-ship.patch` (not applied; `src/` was reverted on the owner's decision).

## What it is

Seed every troop type on near-flat leadership slots (4 orders x 2 hired variants), fit each lay to the stop's pre-Tight
queue (and the silver saver's silver), retype with the rated climb, then drop one type per step, ranked by the
0-restart Tight proxy, at most 60 marches; full Tight on the top 6. Deterministic, a function of the request only.

## Measured

- Account, rating vs the shipped stop on full Tight: merc saver +8.91 / +22.64 / +8.60 at stars 0/1/2; silver saver
  0 / +9.28 / +9.52. The star-1 winner is the same 11-slot flat structure as the frontier's best (+22.64 vs +22.61).
  Sweet spot ~0 (the frontier's slot orders win there, +1.8 to +2.5).
- Monotone across stars for the merc saver and silver saver; the sweet spot is not (-2.26 from star 1 to 2).
- 39 benchmark stops, as an added candidate only: 22 improved, 17 equal, 0 worse; only 3 pass the rated-stops
  minRating of 5 (localStorage camp silver saver +12.53, message camp merc saver +9.25, 4 000-leadership silver
  saver +6.65).
- Cost: search 0.3 to 0.9 s per stop; the top-6 Tight read was 4.3 to 8.6 s on the old kernel, 1.1 to 2.2 s on the
  exact Tight package (544 / 602 / 477 ms with the six reads in parallel). Top-1 and top-2 picked the same winner as
  top-6 on 9/9 account and 39/39 benchmark stops.
- Shipped in the planner (360/361): moved exactly 8 stops, none worse, merc saver monotone across stars. But every
  advisor and captain probe plans a campaign, so a full live Generate + advisor pass went 5.6 s -> 46.0 s on 15
  workers (x8.2; 771 -> 8 495 Tight calls), and the plan alone 0.4 -> 3.5 s. `planCampaign` is synchronous inside a
  worker job and cannot use the pool.
- Trade-offs it carried: the account merc savers lose about 9 % damage before Tight (monster stacks at 10, refilled by
  Tight); merc-saver silver rises in several rows (Monster 3-5 +20 %, message camp +4.8 %).

## Stack number (301)

Winning marches field every type on 39 of 48 stops; slots near-flat (within 1 to 2 %). Rule of thumb, fitted on 7
points with no hold-out: flatQ = queue of a flat all-types lay at full leadership / the stop's queue; below 0.95 the
types dropped = round(5 x (1 - flatQ)), tier 1 first; otherwise all types (silver saver: window m-3..m). The window
held 46 of 48 winners and cut visited marches by 30 % with no gain lost. Treat it as an ordering hint.

## Decision

Reverted: the owner judged the Leonidas star regression already fixed, and the x8.2 pass cost was not worth the
remaining gain. If it is wanted again: switch it off for advisor/captain plans, or read only the top 1 or 2, and
re-base `plans.json` (15 entries) and `advisor.json` (27 leaves in one probe stop).
