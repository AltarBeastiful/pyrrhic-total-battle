/**
 * **How safely the troops shelter the hired stacks** (S-141; owner, 2026-09-24: *"Let's perhaps add a faint
 * warning ? at least if it at 0.01%"*).
 *
 * The engine's enemy always wipes our highest-HP living stack, so a hired stack is sheltered while its total
 * HP is below the lowest troop stack's — the troop floor. A shelter that holds by 0.01 % is a promise the game
 * may not keep: a rounding or a stray bonus it counts and we do not, and the hired stack goes first. This
 * reads the march on screen — generated or edited by hand — off the engine's own stacks (`Stack.totalHp`,
 * `Stack.pool`, the same two figures `shelterCounts` shelters by), and says so in one sentence.
 */
import { CAMPAIGN } from '@/config';
import type { Stack, StackResult, UnitDef } from '@/engine/types';

import { findUnit } from './units';

export interface ShelterReading {
  /** The largest hired stack: the first one a thin shelter would give up. */
  hired: Stack;
  /** The lowest troop stack, the one the whole shelter stands on. */
  troop: Stack;
  /**
   * How far under the troop floor the hired stack sits, as a fraction of the floor: 0.0001 is 0.01 %. Zero
   * is a tie, and a negative margin is a hired stack the enemy reaches before any troop.
   */
  margin: number;
}

/** The largest hired stack against the lowest troop stack, or null when the march fields no pair. */
export function readShelter(stacks: readonly Stack[]): ShelterReading | null {
  let hired: Stack | undefined;
  let troop: Stack | undefined;
  for (const stack of stacks) {
    if (stack.count <= 0) continue;
    if (stack.pool === 'leadership') {
      if (troop === undefined || stack.totalHp < troop.totalHp) troop = stack;
    } else if (hired === undefined || stack.totalHp > hired.totalHp) {
      hired = stack;
    }
  }
  if (hired === undefined || troop === undefined || troop.totalHp <= 0) return null;
  return { hired, troop, margin: (troop.totalHp - hired.totalHp) / troop.totalHp };
}

/** "0.01%", "0.12%", "1.5%": two significant digits, which is where two thin shelters differ. */
export function marginPercent(margin: number): string {
  const value = margin * 100;
  if (value < 0.001) return 'less than 0.001%';
  return `${String(Number(value.toPrecision(2)))}%`;
}

export interface ShelterNote {
  /** `thin`: sheltered, but by less than the warning margin. `over`: not sheltered at all. */
  tone: 'thin' | 'over';
  text: string;
}

/**
 * The sentence the March writes under the army, or null when the shelter is wide enough to say nothing
 * (design rule 15).
 *
 * A hired stack at or over the floor is already said by the engine when the engine made it so — the
 * "Allow damage trades grew…" and "…tie at … HP" lines name the stack in the "Worth a look" alert — so
 * `over` is only written when no warning on the result names that stack already (design rule 5).
 */
export function shelterNote(
  result: Pick<StackResult, 'stacks' | 'warnings'>,
  units: readonly UnitDef[],
  threshold: number = CAMPAIGN.shelterWarning,
): ShelterNote | null {
  const reading = readShelter(result.stacks);
  if (reading === null || reading.margin > threshold) return null;
  const hiredUnit = findUnit(reading.hired.unitId, units);
  const hired = hiredUnit?.name ?? reading.hired.unitId;
  const troop = findUnit(reading.troop.unitId, units)?.name ?? reading.troop.unitId;

  if (reading.margin > 0) {
    return {
      tone: 'thin',
      text:
        `Your ${hired} stack is only ${marginPercent(reading.margin)} lighter than your ${troop} stack: ` +
        'a small HP difference in game could see it fall before your troops.',
    };
  }

  const label = hiredUnit?.label ?? reading.hired.unitId;
  if (result.warnings.some((warning) => warning.includes(label))) return null;
  return {
    tone: 'over',
    text:
      reading.margin === 0
        ? `Your ${hired} stack is as heavy as your ${troop} stack, so the game decides which falls first.`
        : `Your ${hired} stack is heavier than your ${troop} stack, so it falls before your troops.`,
  };
}
