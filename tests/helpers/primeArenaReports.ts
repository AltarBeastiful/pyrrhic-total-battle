/**
 * The two Prime Arena reports of 2026-11-27 (B-46) against the same defender: the first lost with the planner's
 * squad, the second won with the game's default fill. The match engine is held to them turn by turn.
 *
 * One line per logged hit: side, attacker, its living count, target, the living count the report shows on the
 * target before the hit, units killed, damage, "additional damage from features", `D` when it rolled double.
 * A = attacker (us), D = defender. SP/SW/ARC/RD = Spearman/Swordsman/Archer/Rider,
 * MD/MAG/IP/GM = Magic Dragon / Many-Armed Guardian / Ice Phoenix / Gorgon Medusa.
 *
 * The bonuses are fitted from the reports (theory-craft 371): strength totals from the damage lines, and one
 * health percentage per stack type from the kills. With health left unrounded every logged kill count comes out
 * exactly; with health rounded to whole points per unit no value of seven of the stacks fits.
 */
import { unitById } from '../../src/data';
import type { UnitDef } from '../../src/data/types';
import type { PrimeArenaArmy } from '../../src/engine/primeArena';
import type { BonusTotals } from '../../src/engine/types';
import { totalsFrom } from '../helpers/request';

const LOST_R1 = `
A MAG 888 RD4 7995 7995 90242603 10270063
D SP4 12586 MAG 888 131 26013122 0
A GM 162 SW4 12586 5450 19702440 5384879
D ARC4 12586 MAG 757 164 32400517 6423895
A IP 108 IP 202 81 17010540 4094280
D GM 304 MAG 593 150 29767680 10104960
A SW4 6593 GM 304 200 29692894 17427607
D MAG 276 IP 108 108 25722360 8590027
A SP3 7419 GM 104 90 13176144 2136672
D MD 233 MAG 443 125 24692175 5906550
A SP2 13187 ARC4 12586 2194 11037519 0
D SW4 7136 GM 162 162 22832280 13721568
A SW2 17308 ARC4 10392 4623 23256759 13263986
D IP 121 MAG 318 55 11015234 0
A SW3 8241 SW4 7136 5446 19686100 11227538
D SP4 12586 MAG 263 132 26013122 0
A MAG 131 IP 121 95 19848465 4598100
D MAG 276 SW4 6593 5587 19321380 0
A SP3 7419 SP4 12586 2194 11039472 0
D MD 233 MAG 131 125 24692175 5906550
A SP2 13187 MD 233 59 11037519 0
D ARC4 5769 SW2 17308 13837 14851309 2944497
A SW3 8241 SP4 10392 3914 19686100 11227538
D SW4 1690 SW3 8241 3280 6258577 3643894
A SW2 3471 ARC4 5769 927 4663982 2660001
D IP 26 SP3 7419 933 2366909 0
A SW4 1006 SP4 6478 865 4355678 2484166
D GM 14 SP2 13187 960 1370880 465360
A SP2 12227 MAG 276 63 10233999 0
D MAG 213 SP2 12227 10450 14911065 0
A SP3 6486 MD 174 52 9651168 0
D SP4 5613 SP3 6486 4573 11601116 0
A SW3 4961 ARC4 4842 2356 11850836 6758866
D MD 122 SW3 4961 4961 9465251 2264157
A SW2 3471 SP4 5613 928 4663982 2660001
D ARC4 2486 SP3 1913 1913 4852494 962081
A SW4 1006 SP4 4685 865 4355678 2484166
D SW4 1690 SW2 3471 3471 3724502 2168494
A MAG 6 IP 26 4 909090 210600
D IP 22 SW4 1006 579 2002769 0
D GM 14 SW4 427 396 1370880 465360
A SP2 1777 GM 14 11 1679265 191916
D MAG 213 SP2 1777 1777 2535244 0
A MAG 6 IP 22 4 909090 210600
D MD 122 MAG 6 6 1163375 278287
A SW4 31 GM 3 1 139614 81944
D SP4 3820 SW4 31 31 105213 0
`;

const LOST_R2 = `
D RD4 7995 MAG 888 192 38126236 0
A MAG 696 RD4 7995 7995 90242603 10270063
D SP4 12586 MAG 696 132 26013122 0
A GM 162 SW4 12586 5450 19702440 5384879
D ARC4 12586 MAG 564 327 64801034 12847790 D
A IP 108 IP 202 81 17010540 4094280
D GM 304 MAG 237 150 29767680 10104960
A SW4 6593 GM 304 200 29692894 17427607
D MAG 276 IP 108 108 25722360 8590027
A SP3 7419 GM 104 90 13176144 2136672
D MD 233 GM 162 162 22832280 6545152
A SP2 13187 ARC4 12586 2194 11037519 0
D SW4 7136 SW4 6593 6593 22800242 13274847
A SW2 17308 ARC4 10392 4623 23256759 13263986
D IP 121 SW2 17308 10263 11015234 0
A SW3 8241 SW4 7136 5446 19686100 11227538
D SP4 12586 SP3 7419 7419 18820519 0
A SP2 13187 SP4 12586 4388 22075038 0 D
D MAG 276 SP2 13187 13187 18817189 0
A MAG 87 IP 121 63 13181805 3053700
D MD 233 MAG 87 87 17049328 4078324
A SW3 8241 SP4 8198 3913 19686100 11227538
D ARC4 5769 SW3 8241 7783 14851309 2944497
A SW2 7045 ARC4 5769 1882 9466366 5398936
D IP 58 SW2 7045 4920 5280029 0
D SW4 1690 SW2 2125 2125 2280548 1327789
D GM 14 SW3 458 458 872519 296185
`;

const WON_R1 = `
A RD4 6593 ARC4 12586 9494 47761010 8374427
D RD4 7995 ARC4 13188 13188 47328435 9954789
A SP4 13187 GM 304 304 44925120 10108152
D SP4 12586 GM 325 254 35867960 9854838
A MAG 296 IP 202 202 42289710 9796844
D SW4 12586 RD4 6593 5245 51427654 31955225
A MD 251 MD 233 193 35711025 8132400
D MAG 276 IP 216 121 29008980 9687600
A SW4 13187 RD4 7995 5505 62143737 37611302
D ARC4 3092 IP 95 36 8408168 2026497
A IP 59 MD 40 40 7329900 1371974
A GM 71 SW4 12586 2388 8635020 2360040
D SP4 12586 SW4 13187 7522 26013122 0
A SP4 13187 SW4 10198 9839 35565339 0
D MAG 276 SP4 13187 4202 19321380 0
A MAG 296 SP4 12586 6850 34458840 0
D RD4 2490 MD 251 85 15037010 3162798
A MD 166 MAG 276 140 22447350 4208100
D ARC4 3092 IP 59 35 8408168 2026497
A SW4 5665 RD4 2490 2365 26696312 16157430
D SW4 359 RD4 1348 149 1466909 911483
A RD4 1199 ARC4 3092 1727 8685795 1522969
A GM 71 SP4 5736 1716 8635020 2360040
A IP 24 MAG 136 18 2870280 0
D SP4 4020 GM 71 71 9937540 2730371
A MAG 296 SP4 4020 4020 20217999 0
D MAG 118 RD4 1199 1023 10024690 1764100
A SP4 8985 MAG 118 118 18868590 0
D ARC4 1365 IP 24 15 3711885 894621
A MD 166 ARC4 1365 1365 6865054 1563364
D RD4 125 MD 166 4 754870 158775
A SW4 5665 RD4 125 125 1402554 848868
D SW4 359 RD4 176 149 1466909 911483
A IP 9 SW4 359 298 1076355 0
A RD4 27 SW4 61 44 161298 0
D SW4 17 RD4 27 7 69463 43162
A MAG 296 SW4 17 17 58490 0
`;

const WON_R2 = `
D RD4 7995 ARC4 13188 13188 47328435 9954789
A RD4 6593 ARC4 12586 9494 47761010 8374427
D SP4 12586 GM 325 254 35867960 9854838
A SP4 13187 GM 304 304 44925120 10108152
D SW4 12586 RD4 6593 5245 51427654 31955225
A MAG 296 IP 202 202 42289710 9796844
D MAG 276 IP 216 121 29008980 9687600
A MD 251 MD 233 193 35711025 8132400
D ARC4 3092 IP 95 36 8408168 2026497
A SW4 13187 RD4 7995 5505 62143737 37611302
D MD 40 MD 251 25 4521000 1296000
A IP 59 MD 40 40 7329900 1371974
A GM 71 SW4 12586 2388 8635020 2360040
D SP4 12586 SW4 13187 7522 26013122 0
A SP4 13187 SW4 10198 9839 35565339 0
D MAG 276 SP4 13187 4202 19321380 0
A MAG 296 SP4 12586 6850 34458840 0
D RD4 2490 MD 226 86 15037010 3162798
A MD 140 MAG 276 236 37863000 7098000 D
D ARC4 3092 IP 59 35 8408168 2026497
A SW4 5665 RD4 2490 2365 26696312 16157430
D SW4 359 RD4 1348 149 1466909 911483
A RD4 1199 ARC4 3092 1727 8685795 1522969
A GM 71 SP4 5736 1716 8635020 2360040
A IP 24 SP4 4020 571 2870280 0
D SP4 3449 GM 71 70 9829063 2700567
A MAG 296 SP4 3449 3449 17347719 0
D ARC4 1365 IP 24 15 3711885 894621
A SP4 8985 ARC4 1365 1365 6865054 0
D MAG 40 RD4 1199 347 3398200 598000
A MD 140 MAG 40 40 6323220 1185384
D RD4 125 MD 140 4 754870 158775
A SW4 5665 RD4 125 125 1402554 848868
D SW4 359 RD4 852 149 1466909 911483
A RD4 703 SW4 359 359 1296143 0 D
`;

const IDS = {
  SP2: 'spearman-2',
  SP3: 'spearman-3',
  SP4: 'spearman-4',
  SW2: 'swordsman-2',
  SW3: 'swordsman-3',
  SW4: 'swordsman-4',
  ARC4: 'archer-4',
  RD4: 'rider-4',
  MD: 'magic-dragon',
  MAG: 'many-armed-guardian',
  IP: 'ice-phoenix',
  GM: 'gorgon-medusa',
} as const;
export type Label = keyof typeof IDS;

type Side = 'attacker' | 'defender';

/** Health bonus in percent per stack type, per side. */
const HEALTH: Record<Side, Partial<Record<Label, number>>> = {
  attacker: {
    SP2: 428.5,
    SP3: 428.5,
    SP4: 428.5,
    SW2: 297.5,
    SW3: 297.5,
    SW4: 297.5,
    ARC4: 312.5,
    RD4: 463.5,
    MD: 290.5,
    MAG: 407.5,
    IP: 367,
    GM: 291,
  },
  defender: { SP4: 478.2, SW4: 315.5, ARC4: 478.2, RD4: 548.7, MD: 310.5, MAG: 310.2, IP: 310.2, GM: 310.4 },
};

const TOTALS: Record<Side, BonusTotals> = {
  attacker: totalsFrom({
    strength: {
      army: 299,
      guardsmen: 290,
      specialist: 1.5,
      monster: 255.5,
      melee: 241,
      ranged: 78,
      mounted: 341,
      flying: 49,
      beast: 4,
    },
    special: { guardsmenDoubleDamageChance: 1.9 },
  }),
  defender: totalsFrom({
    strength: {
      guardsmen: 179.2,
      monster: 5,
      melee: 433.5,
      ranged: 432.5,
      mounted: 543,
      flying: 430.5,
      beast: 1.5,
    },
  }),
};

/** A report's unit: the table's, its fitted health bonus folded into its health (the totals carry none). */
function fitted(side: Side, label: Label): UnitDef {
  const unit = unitById(IDS[label]);
  const percent = HEALTH[side][label];
  if (unit === undefined || percent === undefined) throw new Error(`no ${side} ${label}`);
  return { ...unit, health: (unit.health * (100 + percent)) / 100 };
}

function army(side: Side, spec: string): { army: PrimeArenaArmy; labels: Label[] } {
  const stacks = spec.split(', ').map((part) => {
    const [label, count] = part.split(' ') as [Label, string];
    return { label, unit: fitted(side, label), count: Number(count) };
  });
  return {
    army: { totals: TOTALS[side], stacks: stacks.map(({ unit, count }) => ({ unit, count })) },
    labels: stacks.map((s) => s.label),
  };
}

export interface ReportHit {
  side: Side;
  actor: Label;
  actorCount: number;
  target: Label;
  targetCount: number;
  kills: number;
  damage: number;
  double: boolean;
}

function parse(text: string): ReportHit[] {
  return text
    .trim()
    .split('\n')
    .map((line) => {
      const [side, actor, actorCount, target, targetCount, kills, damage, , double] = line.split(' ');
      return {
        side: side === 'A' ? 'attacker' : 'defender',
        actor: actor as Label,
        actorCount: Number(actorCount),
        target: target as Label,
        targetCount: Number(targetCount),
        kills: Number(kills),
        damage: Number(damage),
        double: double === 'D',
      };
    });
}

const DEFENDER = 'ARC4 12586, SP4 12586, SW4 12586, RD4 7995, MD 233, MAG 276, IP 202, GM 304';

/** One reported match: both armies, its two rounds' hits, and the surviving share the game showed per round. */
export const REPORTS = [
  {
    name: "lost with the planner's squad",
    attacker: army('attacker', 'SP2 13187, SW2 17308, SP3 7419, SW3 8241, SW4 6593, MAG 888, IP 108, GM 162'),
    defender: army('defender', DEFENDER),
    rounds: [parse(LOST_R1), parse(LOST_R2)] as const,
    shares: [
      [0, 19],
      [0, 26],
    ],
    winner: 'defender',
  },
  {
    name: "won with the game's default fill",
    attacker: army('attacker', 'ARC4 13188, SP4 13187, SW4 13187, RD4 6593, MD 251, MAG 296, IP 216, GM 325'),
    defender: army('defender', DEFENDER),
    rounds: [parse(WON_R1), parse(WON_R2)] as const,
    shares: [
      [31, 0],
      [32, 0],
    ],
    winner: 'attacker',
  },
] as const;
