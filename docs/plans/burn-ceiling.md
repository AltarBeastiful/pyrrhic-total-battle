# Burn ceiling and pool-line defaults

Owner, 2026-10-18: *"sometimes I have a lot of silver and gold but still merc are limited, and in the plans merc
burn and gold are linked. [...] if I try to get less mercs, I have no solution. On the silver saver I know I can
remove a weak stack like SW1 to put more monsters but this ups the merc burned automatically. [...] there should be
a way to conserve merc burns."* Then: *"we could modify the put back and let the user click on the button to up the
mercs max or nearest 10 as he wishes, same for monsters. That could be a setting (default: modify monster and merc,
or monster or merc only, or neither). Burn ceiling can be added. Don't do per-run rates: I want to avoid too many
knobs and keep first usage very simple, with sane defaults."*

Generation is untouched. Everything below acts on the march on screen, like Tight, the push and the round.

## 1. What exists

- Tight (`RaiseModes`, default on both hired pools) caps the burn at the **generated march's** burn.
- The pool line has two toggles per hired pool, re-derived from the march on screen: **push** (to the most the
  kill order takes, S-159) and **round** (every stack to tens, up or down by the best trade, fc0ad33).
- `MARKER_RATES` weighs silver, gold and burn at fixed global rates (`src/config.ts`).

## 2. What is missing

1. A **default** for the pool-line buttons: which pools they apply to, and whether the standing rule is push,
   round or nothing. Today every Generate opens with both off.
2. A **burn ceiling**: a number of hired units the march may burn, independent of silver and gold. Tight's cap is
   the special case "ceiling = generated burn".
3. Removing a stack must not silently re-spend the burn it freed.

## 3. Design

### 3.1 Pool-line default (one setting, three words)

One setting, *Pool line on Generate*: **Both pools** · **Mercs only** · **Monsters only** · **Neither**; the
standing rule it turns on is the one the button last set (push or round). Sane default: **Neither** — a first
run shows the plan's own marches, and the buttons are one click away. A profile field, schema bump, merged
per-section like the other settings (S-49e). Lives in `runStore` beside `pushed`; Reset puts it back.

### 3.2 Burn ceiling (one field)

- `Burn ≤ N`, beside the Raise selector, **empty by default** (= the generated march's burn, which is Tight's
  rule today — no behaviour moves until the owner types a number).
- Typed, it caps the kernel raise's burn budget (`safe`/`tight` already take one) and the push/round: neither
  may take a march past it. Below the generated burn, the march is **trimmed** from the stacks with the worst
  damage per burned unit, so "fewer mercs" becomes a direct request. Above it, Tight may spend up to it.
- Per march, not per campaign: the bar's stops are untouched.
- Rating is unchanged (`markerRates` stays global). No rates in the UI.

### 3.3 Removing a stack keeps the burn

First step is a reproduction: where does the burn climb after removing SW1 on the silver saver — Tight's cap
re-reading the new march, or the resize? The fix differs. Intended behaviour: the burn freed stays unspent unless
the ceiling allows it.

## 4. Gate

- Experiment first: on every benchmark army and stop, the ceiling at the generated burn leaves the march
  **byte-identical** (non-regression, `feedback-benchmark-non-regression`); ceilings at 90/75/50 % report damage
  and burn lost per step.
- One test, both paths (TS and kernel), red first.
- Design rules: cite `docs/design-rules.md` in the UI brief; labels say "merc", not "hired" (except the act).

## 5. Order

1. Reproduce 3.3.
2. Burn ceiling in the kernel raise + experiment.
3. Field on the Raise control.
4. Pool-line default setting.

## Status (2026-10-18)

**Shipped.** Engine half `11225e7`; UI half in the commit that adds this section (`git log -1 -- docs/plans/burn-ceiling.md`).
Verified in the app on the owner's account (2026-10-18): burn saver 7 mercs lost; SW1 out keeps 7; `Burn ≤ 5` trims
the edited march to 5; putting SW1 back under it changes the pills once and keeps 5.

- **§3.3, take-out keeps the burn** (`11225e7`): with no ceiling typed, a take-out re-sizes the stop under the
  stop's own burn (`editBurnCap`, `MarchWithin.burnCap`). SW1 out of the burn saver: 17 → **7** mercs lost
  (experiment 242), and the March reads 7 after the take-out (`burnCeilingAccount.test.tsx`, both kernel paths).
- **§3.2, `Burn ≤` field** at the foot of the army, where the (hidden) raise selector sits: empty by default, the
  march's burn as placeholder, one help line. Run state (`runStore.burnCeiling`): survives a Generate, cleared by
  `reset()`. The march under a ceiling is **the kernel's Tight with that ceiling** (owner, 2026-10-18), never a
  TypeScript climb: the raise search is asked and keyed under it (`raiseSearchKey`, `runRaise` → `liftedCounts`
  → kernel `burnCap`), and a typed ceiling, a March edit or a Generate computes that answer **before** it
  publishes the march, so the march changes on screen once (`changeBurnCeiling`, `resizeMarch`, `runGenerate` +
  `primeRaise`; the owner's put-back flicker, held by a single-change test on his account). The bar's tables stay
  unceilinged — per march, the bar's stops untouched — so under a ceiling the March reads the search, not the
  bar's row. The push respects the ceiling (`pushedCounts`); the round never adds a chunk. Shown only on a plan's
  march (where the raise is offered).
- **§3.1, Pool line on Generate**: account menu, beside the theme — Both · Mercs · Monsters · Neither, default
  Neither. The rule it opens is the one last switched on from a pool line (push by default). Profile
  `settings` (schema v9, migration 8 → 9, synced as its own section, S-49e); a Generate opens the toggles per
  the setting, which also means a push no longer survives a Generate under the default.

**Choices made.**

- **A trim never empties a stack unless nothing else is left** (`trimToBurn`): a ceiling under the burn takes a
  chunk at a time from the merc stack whose chunk costs least, so the kill order keeps its types.
- **A merc put back gets no cap** when the player typed none: putting a merc back is a request to spend, and
  holding it to the stop's burn would trade his other mercs for it. A typed ceiling binds every edit.
- **Above the generated burn**, Tight's own cap still binds (`min(own cap, ceiling)` in the kernel): a higher
  ceiling lets the push spend up to it, not Tight. Revisit if the owner wants Tight to spend up to the ceiling.

**Experiment 243** (the account of 2026-10-18; cells: merc lost · damage (Δ vs Tight today)):

| stop | burn | 100 % (= today, byte-identical) | 90 % | 75 % | 50 % |
|---|---|---|---|---|---|
| burn-saver | 7 | 7 · 16.031M | 6 · 15.536M (−3.1 %) | 5 · 15.073M (−6.0 %) | 3 · 14.162M (−11.7 %) |
| sweet-spot | 16 | 16 · 21.243M | 14 · 20.834M (−1.9 %) | 12 · 20.105M (−5.4 %) | 8 · 18.623M (−12.3 %) |
| more-mercs | 18 | 18 · 21.978M | 16 · 21.589M (−1.8 %) | 13 · 20.497M (−6.7 %) | 9 · 19.014M (−13.5 %) |
| steady-max | 19 | 19 · 23.013M | 17 · 22.338M (−2.9 %) | 14 · 21.464M (−6.7 %) | 9 · 19.239M (−16.4 %) |
| all-in | 24 | 24 · 25.525M | 21 · 26.137M (+2.4 %) | 18 · 25.263M (−1.0 %) | 12 · 21.679M (−15.1 %) |

100 % is byte-identical to today's Tight on 78/78 benchmark stops. Full table: `tools/theorycraft/out/243-the-burn-ceiling.md`.
