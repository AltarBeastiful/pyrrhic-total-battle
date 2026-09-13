# Fixtures captured from TotalStack (2026-09-12)

Real inputs and outputs captured from totalstack.ca with a Pro trial account, used as regression targets for
the engine (stack counts) and as ground truth for the battle-model investigation (S-30). All runs share the same
army unless stated: Guardsmen G1–G3 (all categories), Specialists S1, no Engineers, Monsters M3–M3, Leadership 3000,
Authority 1200, Dominance 200, **all bonuses 0**, temple level 0, no training reductions, enemy formation 4
standard (1 flying, 1 melee, 1 ranged, 1 mounted), recovery plan "Retrain all".

Unit base data (from `../totalstack-data`): ARC1/SP1/SW1 150 hp 50 str cost 1; RD1 300/100/2; ARC2/SP2 270/90/1;
RD2 540/180/2; ARC3/SP3 480/160/1; RD3 960/320/2 (riders: 5% double damage). Monsters (dominance cost):
SG 15,600/5,200 (8), ED 13,500/4,500 (7), BB 11,700/3,900 (6), WE 5,700/1,900 (3). Bear V 66,000/22,000, authority 21.

Files: `totalstack-2026-09-12-runs.json` (zero-bonus runs), `totalstack-2026-09-12-bonus-runs.json` (army +25/+25,
guardsmen +20/+20 via Aydae; engineers E1–E2; events Ragnarok and Arachne's), `totalstack-2026-09-12-mechanics-runs.json`
(title Battlemaster with double-damage/strike-two chances, captain Bernard ranged +10 and Monsters Boost beast +10,
temple 20 with training reductions and all three recovery plans, M's Preservation with mercenaries and army +25% HP), `totalstack-2026-09-12-journal-*.txt` (battle journals).
In-game captures (ground truth for S-30): `ingame-2026-09-11-epic-ancient-report.md` (two reports, transcribed)
and `ingame-2026-09-13/` (a deliberate 9-stack march that settled the attack order, plus the Temple and unit-card
screens; 18 downscaled screenshots and a README — full-size originals are kept outside the repository).

The earlier fixture from the author's own account (bonuses ≠ 0, Elite Preservation) is described in
`docs/research/totalstack-review.md` §3.
