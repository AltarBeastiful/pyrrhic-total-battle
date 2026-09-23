# The remaining gaps to TotalStack — plan (W12)

**Status: 2026-09-23. Item 1 decided; item 2 measured and refuted (164); item 2b to measure (165); item 3 is the owner’s.**

Source: experiments 162 (`tools/theorycraft/out/162-where-totalstack-still-wins.md`) and 163
(`out/163-an-unsheltered-stop.md`). At 8b1b9a5, **7 of 112** TotalStack rows beat every stop of ours on damage *and*
on the owner's rating (`rate()`, `CAMPAIGN.markerRates`). Every figure is the worst opening (enemy strikes first, the
enemy wipes our highest-HP living stack, every stack is lost), over four marches. Training bonuses are not applied (W11 §6.1, still owed).

The gate for every step (owner, 2026-09-23): an experiment and the benchmark before and after. Every stop of every
army is ranked with `rate()`, and all markers are reported: the ten readings, TotalStack at matched spend, and the
bar's criteria. No pin is re-based.

## 1. `keepReadings` decided by the rating — decided (owner, 2026-09-23: "rating decides")

- **Why:** on Bear V ×1 and ×2 the bar has one stop, and that stop holds "shortest queue". Its re-typing rates +1.59
  (+1.6 % damage, the same silver, +0.09 % queue), and the guard hands it back. Kept, it beats all 4 TotalStack rows.
- **Change:** in `src/engine/plan.ts`, `keepReadings` hands a re-typed stop back only when the reading it costs the bar,
  weighed at `markerRates`, is worth more than the rating it gains.
- **Validate:** experiments 160 and 162 and the benchmark. Expected: TotalStack rows kept 7 → 3. Accepted trade:
  shortest queue +0.09 % on two armies, to be registered by the owner.

## 2. The shelter, as deep as the enemy reaches — to measure (experiment 164)

- **The mechanism (163):** in the enemy-first journal, the stacks wiped before they strike are the highest-HP ones.
  On the live camp, MX has 4 stacks against 4 enemy attacks, and its 4.59M-HP rider-3 wall dies before it strikes.
  The unsheltered candidate adds seven cheap troop stacks, which take the later attacks. Today's rule puts every
  hired stack under the **lowest** troop stack, so cheap small stacks cap the hired count, and sheltering that
  candidate cuts 336 hired.
- **Hypothesis:** a hired stack is safe as long as it is not among the stacks the enemy wipes before it strikes.
  That is the journal's own reading, not a margin. A rule that shelters "under the stacks the enemy reaches first"
  could keep most of 163's +49 % damage on the live camp without putting a hired stack in front.
- **Experiment 164:** on every army, compare three rules: today's rule, "hired never wiped before striking" (read
  off `walkBattle`), and none. Hold hired to the four-march sustain. Rate each against the bar; report every marker
  and the hired per 1M of damage.
- **Risk:** hired +73 % and gold +102 % on the live camp (163). Damage per hired and per gold falls 26 %.

**Measured, 164 (`out/164-shelter-as-deep-as-the-enemy-reaches.md`): refuted — keep today's rule.** Rule (b)
captures nothing (a) does not already give. On 13 armies (a), (b) and (c) choose the same best march, and no hired
stack is wiped before it strikes. Candidate by candidate, (b) rates below (a) 1–12 times per army: lifting a hired stack up the kill
order cuts its strikes from 2–3 to 1 (evening SW: 31.37M → 27.29M for 68 → 76 hired).

What 164 found instead: **on the live camp, today's shelter already allows a march rated +20.98 against MX.** It
takes MM's troops (rider-3 2,441) with the sustain's hired lowered under that wall: arbalester-6 371, bear-5 48 and
legionary-6 400, where MX fields 215 legionaries and 35 bears. It deals 47.47M against 31.54M for 332 hired
against 208, with gold +73 %, silver +12 % and queue +24 %. Every rule holds (sheltered, sustained). The plan simply
does not find it. **This is a search gap, not a policy.**

## 2b. Why the plan under-fills its hired under its own shelter — to measure (experiment 165)

- On the live camp, find which step loses the +20.98 march: the ladder's hired levels, the burn ladder's spacing,
  the frontier, the fold, or the sustain reading. Then fix that step.
- **Validate:** 160 and 162 and the benchmark. The march should reach the bar on the live camp (TotalStack rows kept
  3 → 2, since M's Preservation is beaten) with no stop rated worse anywhere.

## 3. An unsheltered stop, flagged — the owner's decision

163 found that only 1 of 17 armies gains: the live camp, rated +23.44 against MX. If item 2 does not capture that
gain, the fallback is an extra stop admitted only when all of these hold:

- its hired stay within the four-march sustain;
- it rates above 0 against the top stop;
- it out-damages its own sheltered version.

It would carry the words "unsheltered: your hired stand in front". This goes against S-87 ("all the mercs you can
*safely* field"), so it is the owner's call.

## 4. Not a gap

TotalStack's two 49.23M rows on the live camp field 454 arbalesters; four marches sustain 371. The benchmark prices
their counts at our worst opening, so TotalStack's average-damage objective does not inflate them. Their
`minimumDamage`, where a capture has one, is 1.5–5 % under their average.
