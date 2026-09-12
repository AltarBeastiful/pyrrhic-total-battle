/**
 * The page sections, in the order PLAN §4 fixes. The shell renders this array and nothing else, so a
 * section story only has to swap its `Component` here.
 */
import type { ComponentType } from 'react';

import { BonusesSection } from './bonuses/BonusesSection';
import { EnemySection } from './enemy/EnemySection';
import { HousingSection } from './housing/HousingSection';
import { MercenariesSection } from './mercenaries/MercenariesSection';
import { MethodSection } from './method/MethodSection';
import { ResultsSection } from './results/ResultsSection';
import { TroopsSection } from './troops/TroopsSection';

export const SECTION_IDS = [
  'troops',
  'mercenaries',
  'method',
  'bonuses',
  'enemy',
  'housing',
  'results',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export interface SectionSpec {
  /** Anchor id of the `<section>`; also the key of the registry entry. */
  id: SectionId;
  /** Heading, used by the shell and by any future jump-to navigation. */
  title: string;
  Component: ComponentType;
}

export const SECTIONS: readonly SectionSpec[] = [
  { id: 'troops', title: 'Troops', Component: TroopsSection },
  { id: 'mercenaries', title: 'Mercenaries', Component: MercenariesSection },
  { id: 'method', title: 'Stacking method', Component: MethodSection },
  { id: 'bonuses', title: 'Bonuses', Component: BonusesSection },
  { id: 'enemy', title: 'Enemy formation', Component: EnemySection },
  { id: 'housing', title: 'Housing and march', Component: HousingSection },
  { id: 'results', title: 'Results', Component: ResultsSection },
];
