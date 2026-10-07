# Tight as the default raise

Owner, 2026-10-07: *"Tight almost always feels better than as is and no other even compares as they always use
more mercs. Lets first check if we can optimize tight further to get better trades, then lets move it as
default; removing the table and other options on the selector; lets keep as is for now, but lets add a hover to
preview the trade it offers (usually a bit less gold and less damage), showing only silver, gold and damage."*

## 1. Can Tight trade better? (experiment 188, gate)

Tight is the exhaustive raise capped at the plan's own authority burn, ranked on **damage alone**: any extra
unit the shelter and the housing allow is taken for one more point of damage, whatever silver and gold it adds.

- **Candidate**: same box, same cap, same seed, ranked by the owner's rating against `As is`
  (`rate(as is, candidate, CAMPAIGN.markerRates)` over damage, silver, gold and the hired burn). The seed (the
  plan's own counts) rates 0, so the rated answer can never rate below `As is`.
- **Measured**: `tools/theorycraft/188-a-rated-tight.test.ts`, every stop of every benchmark army, on the
  TypeScript research copy (`exact-raise.ts`, which now exposes silver and gold to a rank).
- **Gate**: ship the rated rank only if it rates better on some stops and **worse on none**; otherwise
  Tight stays ranked on damage and only the UI part ships.
- **Result (2026-10-07, 56 of 62 stops; 6 boxes over 200 000 vectors skipped on the slow TS path)**: rated
  better on **6**, same on 50, worse on **0**; mean rating against `As is` 1.564 → 1.609. Where the two differ,
  rated against damage-ranked: damage −1.84 %, silver ±0, gold −10.22 % (means). Example, first-run army at 900
  dominance, sweet spot: damage-ranked +6.32 % damage for +25.8 % gold, rated +2.82 % for +2.61 %. Gate passed.
- **If it ships**: the kernel's Tight scores a vector by the rating (`raiseScore` plus the march's recovery
  bill, `kernel/assembly/index.ts`), `tests/golden/raise.json`'s Tight rows are re-captured from the research
  copy with the same rank, and 184 holds the kernel to them. The plan benchmark is untouched (a position never
  moves the campaign).

- **Shipped on the kernel** (`raiseRating`, `kernel/assembly/index.ts`; rates from `CAMPAIGN.markerRates`):
  parity with the research copy on all 62 measured stops. Experiment 189 rates the old golden's damage-ranked
  Tight against the kernel's rated one on **all 68 stops, wide boxes included**: better 9 · same 59 · worse 0,
  mean rating against `As is` 2.535 → 2.669, never below `As is`. Golden: only `tight` rows moved (9 in
  `raise.json`, 4 in `raise-kernel.json`); `raise.test.ts`'s Tight fixture now keeps 5 hunters (−1.2 % damage,
  72 → 32 gold).

## 2. Tight by default, two segments, no table (UI)

1. `RAISE_CHOICES` (`choices.ts`) keeps `As is` and `Tight` only. The other positions stay in the kernel and
   in experiments 180/184; the control just stops offering them.
2. The run store starts and resets on Tight over both hired pools (`DEFAULT_RAISE` in `raise.ts`).
3. The positions table under the plan (`PositionTrade.tsx`, its test, the `PlanPanel` slot) is removed.
4. The worker prices only what is offered (`OFFERED_POSITIONS = ['tight']`), so a bar is priced ~5× faster;
   `positionTrades` keeps an optional list so 184 still prices all five.
5. **The hover preview**: each segment's tooltip draws its sentence and three figures — Damage, Silver,
   Gold (gold only where a march pays any, design rule 15) — with the change against the position on screen
   (none under the one already chosen). Read off the already priced row (`As is` = `trades.own`, Tight = its
   row); while the row is still coming the tooltip is the sentence alone.

## 3. Validation

- Experiment 188 (gate above) and, if the kernel changes, 184 against the re-captured golden.
- Only the touched test files: `march.test.tsx`, `positionsSearch.test.tsx`, `raiseSource.test.tsx`,
  `raise.test.ts`, kernel raise tests if the kernel moves; `pnpm typecheck` and `pnpm lint`. No full suite.

## 4. Follow-ups (owner, 2026-10-07)

- **Tight from the first frame**: a plan's Generate prices its opening stop (`client.positions`) and files it
  (`primePositions`) before the march is drawn; the rest of the bar is priced behind it.
- **The recap's % reference is what the March showed**: `useMarch` publishes its summary (`shownSummary`) and the
  next Generate takes it as the previous run, so Tight is compared with Tight, not with the unraised snapshot.
- **`Tight (old)`**: the damage-ranked Tight beside the rated one for comparison — `RAISE_TIGHT_DAMAGE` (6) is
  `RAISE_TIGHT` with the rating off, nothing else; experiment 189 holds it to the pre-port golden's Tight on all
  68 stops (identical).
