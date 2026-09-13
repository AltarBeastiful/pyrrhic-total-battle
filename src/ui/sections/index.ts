/**
 * The page sections, in the order the design plan fixes (§5.1): the army first, the bonuses that
 * multiply it, the battle it is fought under, and the march that comes out. The shell renders this
 * array and nothing else, so a section story only has to swap its `Component` here.
 */
import type { ComponentType } from 'react';

import { BattleSection } from './battle/BattleSection';
import { BonusesSection } from './bonuses/BonusesSection';
import { MarchSection } from './march';
import { MercenariesSection } from './mercenaries/MercenariesSection';
import { TroopsSection } from './troops/TroopsSection';

export const SECTION_IDS = ['troops', 'mercenaries', 'bonuses', 'battle', 'march'] as const;

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
  { id: 'bonuses', title: 'Bonuses', Component: BonusesSection },
  { id: 'battle', title: 'Battle', Component: BattleSection },
  { id: 'march', title: 'March', Component: MarchSection },
];
