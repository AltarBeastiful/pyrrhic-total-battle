/**
 * The enemy formation, as the Battle card reasons about it: how many squads the monster fields and
 * of which kind (PLAN §3.5). Two presets cover almost every epic monster; anything else is typed.
 */
import { CATEGORIES, type Category } from '@/data/types';

/** Squads per category, in the order the game lists them. */
export type Formation = Record<Category, number>;

export const CATEGORY_LABEL: Record<Category, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
};

export const PRESETS = {
  standard: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
  double: { melee: 2, ranged: 2, mounted: 2, flying: 2 },
} as const satisfies Record<string, Formation>;

export type FormationMode = keyof typeof PRESETS | 'custom';

export const MODE_LABELS: Record<FormationMode, string> = {
  standard: '4 standard',
  double: '8 double',
  custom: 'Custom',
};

export const MODES = Object.keys(MODE_LABELS) as FormationMode[];

export const isFormationMode = (value: string): value is FormationMode =>
  (MODES as readonly string[]).includes(value);

export const squadCount = (formation: Formation): number =>
  CATEGORIES.reduce((sum, category) => sum + Math.max(0, formation[category]), 0);

/** Which preset a stored formation is, if any. */
export function detectMode(formation: Formation): FormationMode {
  for (const [mode, preset] of Object.entries(PRESETS) as [FormationMode, Formation][]) {
    if (CATEGORIES.every((category) => formation[category] === preset[category])) return mode;
  }
  return 'custom';
}
