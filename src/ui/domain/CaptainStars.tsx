/**
 * A captain's stars, drawn after the name on its chip (owner, 2026-10-02; artifact "Captain Level Badges",
 * proposal G). One star, two in a row, then two rows — 2 over 1, 2 over 2, 2 over 3 — and above
 * `CAPTAIN_STAR_ICONS_UP_TO` the count written before a single star ("6★"), so the star separates it from
 * the level on the badge above.
 *
 * Every size here is part of one sum (`domain.module.css`, `.stars`): the top row of a two-row cluster is
 * the tallest thing on the name's line, and it has to stay clear of the level badge on the chip's corner,
 * which is what lets every chip keep the same spacing. Decoration only: the gear's description says it.
 */
import { CAPTAIN_STAR_ICONS_UP_TO } from '@/config';

import classes from './domain.module.css';

/** Stars per row, top row first. */
const ROWS: Record<number, number[]> = { 1: [1], 2: [2], 3: [2, 1], 4: [2, 2], 5: [2, 3] };

function Star() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5 1.4-7.1-5.3-5 7.2-.9z"
      />
    </svg>
  );
}

export interface CaptainStarsProps {
  star: number;
}

export function CaptainStars({ star }: CaptainStarsProps) {
  if (star <= 0) return null;
  const rows = ROWS[star];
  if (star > CAPTAIN_STAR_ICONS_UP_TO || rows === undefined) {
    return (
      <span aria-hidden="true" className={classes.stars} data-shape="count">
        {star}
        <Star />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={classes.stars}
      data-shape={rows.length === 1 ? (star === 1 ? 'one' : 'row') : 'rows'}
    >
      {rows.map((count, index) => (
        <span key={index} className={classes.starRow}>
          {Array.from({ length: count }, (_, i) => (
            <Star key={i} />
          ))}
        </span>
      ))}
    </span>
  );
}
