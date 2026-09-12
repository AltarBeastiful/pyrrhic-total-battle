/**
 * One glyph per page section, so the seven cards of PLAN §4 are recognisable before you read their
 * titles — in the jump bar, in the section header, and on a phone where only one card is on screen.
 */
import { Glyph, PathGlyph } from './Icon';
import type { IconProps } from './Icon';

/** Troops — the ranks you own. */
export const TroopsIcon = (props: IconProps) => (
  <Glyph {...props}>
    <circle cx="9" cy="7" r="3" />
    <path d="M3.5 20v-1.3C3.5 16 6 14 9 14s5.5 2 5.5 4.7V20" />
    <path d="M16 4.2a3 3 0 0 1 0 5.6" />
    <path d="M17.5 14.3c1.9.6 3 2.2 3 4.2V20" />
  </Glyph>
);

/** Mercenaries — the purse you hire them with. */
export const MercenariesIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M8 8.5 9.6 4h4.8l1.6 4.5" />
    <path d="M4.6 8.5h14.8A1.6 1.6 0 0 1 21 10.1v8.3a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 18.4v-8.3a1.6 1.6 0 0 1 1.6-1.6Z" />
    <path d="M15.5 14.2h2.5" />
  </Glyph>
);

/** Stacking method — the ladder your stacks fall down. */
export const MethodIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M8 3v18M16 3v18M8 7.5h8M8 12h8M8 16.5h8" />
);

/** Bonuses — the sparkle of everything that adds a percentage. */
export const BonusesIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="m11 3 1.8 4.6L17.4 9.4l-4.6 1.8L11 15.8 9.2 11.2 4.6 9.4l4.6-1.8z" />
    <path d="m18 14.4.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9z" />
  </Glyph>
);

/** Enemy formation — the epic monster you are marching on. */
export const EnemyIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M5.2 9 3.6 4.4 7.8 6.6" />
    <path d="M18.8 9l1.6-4.6-4.2 2.2" />
    <path d="M12 20.6c-4.2 0-7.2-2.8-7.2-6.8C4.8 9.7 7.9 6.9 12 6.9s7.2 2.8 7.2 6.9c0 4-3 6.8-7.2 6.8Z" />
    <path d="M9.4 13h.01M14.6 13h.01" />
    <path d="M9.4 16.8h5.2" />
  </Glyph>
);

/** Housing and march — the camp that carries the march. */
export const HousingIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M12 3.6 21 20H3z" />
    <path d="M12 14.3 15.2 20H8.8z" />
  </Glyph>
);

/** Results — the numbers the march comes back with. */
export const ResultsIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M4 20h16M7.5 20v-6M12 20V6.5M16.5 20v-9" />
);
