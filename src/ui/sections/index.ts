/**
 * The page sections, in the order PLAN §4 fixes. The shell renders this array and nothing else, so a
 * section story only has to swap its `Component` here.
 */
import type { ComponentType } from 'react';

import {
  BonusesSection,
  EnemySection,
  HousingSection,
  MercenariesSection,
  MethodSection,
  ResultsSection,
  TroopsSection,
} from './Placeholder';

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
