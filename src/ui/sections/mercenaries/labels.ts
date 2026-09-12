/** Display names for the facets a mercenary is tagged with (S-12). */
import type { Category, Group, Race } from '@/data/types';

export const GROUP_LABELS: Record<Group, string> = {
  guardsmen: 'Guardsmen',
  specialist: 'Specialist',
  engineers: 'Engineers',
  monster: 'Monster',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
};

export const RACE_LABELS: Record<Race, string> = {
  beast: 'Beast',
  elemental: 'Elemental',
  dragon: 'Dragon',
  giant: 'Giant',
};
