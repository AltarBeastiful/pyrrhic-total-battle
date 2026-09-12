/**
 * One glyph per page section, so the seven cards of PLAN §4 are recognisable before you read their
 * titles — in the app bar, in the section header, and on a phone where only one card is on screen.
 * All Lucide (ISC), like the rest of the interface marks.
 */
import { ChartColumn, ListOrdered, Skull, Sparkles, Tent, Users, Wallet } from 'lucide-react';

import { LucideGlyph } from './Icon';
import type { IconProps } from './Icon';

/** Troops — the ranks you own. */
export const TroopsIcon = (props: IconProps) => <LucideGlyph icon={Users} {...props} />;

/** Mercenaries — the purse you hire them with. */
export const MercenariesIcon = (props: IconProps) => <LucideGlyph icon={Wallet} {...props} />;

/** Stacking method — the kill order your stacks fall in. */
export const MethodIcon = (props: IconProps) => <LucideGlyph icon={ListOrdered} {...props} />;

/** Bonuses — the sparkle of everything that adds a percentage. */
export const BonusesIcon = (props: IconProps) => <LucideGlyph icon={Sparkles} {...props} />;

/** Enemy formation — the epic monster you are marching on. */
export const EnemyIcon = (props: IconProps) => <LucideGlyph icon={Skull} {...props} />;

/** Housing and march — the camp that carries the march. */
export const HousingIcon = (props: IconProps) => <LucideGlyph icon={Tent} {...props} />;

/** Results — the numbers the march comes back with. */
export const ResultsIcon = (props: IconProps) => <LucideGlyph icon={ChartColumn} {...props} />;
