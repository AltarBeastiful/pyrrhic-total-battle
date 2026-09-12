/**
 * Unit glyphs: one per category, group, race and housing pool. They are the visual shorthand the
 * whole app uses for a unit type — in a badge, in a filter chip, in a result row — so each one has to
 * read at 16 px. Drawn here by hand on the 24 grid of `Icon.tsx`.
 */
import { Glyph, PathGlyph } from './Icon';
import type { IconProps } from './Icon';

// ---- Categories ---------------------------------------------------------------------------------

/** Melee — a short sword, point up. */
export const MeleeIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M12 2.5 13.7 5.4v8.1h-3.4V5.4z" />
    <path d="M8 13.5h8" />
    <path d="M12 13.5v4.6" />
    <path d="M10.1 18.1h3.8" />
  </Glyph>
);

/** Ranged — a drawn bow with its arrow. */
export const RangedIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M7.2 3.6a12.5 12.5 0 0 1 0 16.8" />
    <path d="M7.2 3.6v16.8" />
    <path d="M5 12h14" />
    <path d="m15.5 8.8 3.3 3.2-3.3 3.2" />
  </Glyph>
);

/** Mounted — a horse's head in profile. */
export const MountedIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M8 21v-3.6c0-2.4.8-4.4 2.4-6L9 8.6 6 10.2V8.4c0-2 1.2-3.4 3.4-4.3L12 3l1.2 2.4c2.8 1.2 4.2 3.6 4.2 7 0 3.4-.7 6.3-2 8.6z" />
    <path d="M10.1 8.1h.01" />
  </Glyph>
);

/** Flying — a single feathered wing. */
export const FlyingIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M3 6.8c5-1.4 8.8.7 10.8 6.2.8 2.2 2.5 3.5 5.2 4.2-5.1 1.6-9-.5-11-6C7.2 8.8 5.5 7.4 3 6.8Z" />
    <path d="M6.3 9.4c2.4.7 4.1 2.2 5.1 4.6" />
  </Glyph>
);

// ---- Groups -------------------------------------------------------------------------------------

/** Guardsmen — a kite shield. */
export const GuardsmenIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M12 3 19.5 5.6v5.9c0 4.3-2.9 7.8-7.5 9.5-4.6-1.7-7.5-5.2-7.5-9.5V5.6z" />
);

/** Specialists — a star, the rank mark. */
export const SpecialistsIcon = (props: IconProps) => (
  <PathGlyph {...props} d="m12 3.2 2.5 5.3 5.7.8-4.1 4.1 1 5.8-5.1-2.8-5.1 2.8 1-5.8-4.1-4.1 5.7-.8z" />
);

/** Engineers — a catapult: wheel, arm, payload. */
export const EngineersIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M3.5 18.5h11" />
    <circle cx="6.5" cy="18.5" r="2.5" />
    <path d="m6.5 18.5 9-9" />
    <circle cx="17.6" cy="7.4" r="2.4" />
    <path d="m11 14 3.2 4.5" />
  </Glyph>
);

/** Monsters — a three-talon claw. */
export const MonstersIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M5 3.8c1.9 4.3 2.5 8.3 1.9 12" />
    <path d="M10.9 3c.9 4.6.8 8.7-.3 12.4" />
    <path d="M16.8 4.2c-.2 4.7-1.3 8.7-3.3 11.9" />
    <path d="M4.6 14.8c2.6 3.8 6 5.5 10.3 5.1 2.1-.2 3.6-1.3 4.5-3.3" />
  </Glyph>
);

// ---- Races --------------------------------------------------------------------------------------

/** Beasts — a paw print. */
export const BeastIcon = (props: IconProps) => (
  <Glyph {...props}>
    <circle cx="6.6" cy="9.6" r="1.8" />
    <circle cx="10.4" cy="6.4" r="1.8" />
    <circle cx="14.4" cy="6.8" r="1.8" />
    <circle cx="17.8" cy="10.2" r="1.7" />
    <path d="M12 11.6c3.1 0 5.7 2.2 5.7 4.9 0 2-1.5 3.4-3.5 3.4-1 0-1.6-.3-2.2-.3s-1.2.3-2.2.3c-2 0-3.5-1.4-3.5-3.4 0-2.7 2.6-4.9 5.7-4.9Z" />
  </Glyph>
);

/** Elementals — a droplet holding a flame. */
export const ElementalIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M12 3.2s6 6.4 6 10.4a6 6 0 0 1-12 0c0-4 6-10.4 6-10.4Z" />
    <path d="M12 17.6a2.6 2.6 0 0 1-2.3-3.8c.6-1.2 2.3-2.7 2.3-2.7s1.7 1.5 2.3 2.7a2.6 2.6 0 0 1-2.3 3.8Z" />
  </Glyph>
);

/** Dragons — a horned head in profile. */
export const DragonIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M3.6 18.6c.3-3.7 1.9-6.5 4.7-8.4l-.8-3.7 3.4 2c1-.3 2-.4 3.1-.4 1.2 0 2.3.2 3.3.6l3.4-2.5-1 4.1c1.3 1.4 2.1 3.1 2.3 5.3-1.3-1.2-2.7-1.6-4.1-1.3.6 1.6.3 3.1-.8 4.4z" />
    <path d="M9.8 12.2h.01" />
  </Glyph>
);

/** Giants — a closed fist. */
export const GiantIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M5.2 11.4c0-1.1.9-2 2-2h9.1c2 0 3.5 1.6 3.5 3.5v2.2c0 2.9-2.4 5.3-5.3 5.3h-4.1a5.2 5.2 0 0 1-5.2-5.2z" />
    <path d="M8.6 9.4V7.6a1.8 1.8 0 0 1 3.6 0v1.8" />
    <path d="M12.2 9.4V6.8a1.8 1.8 0 0 1 3.6 0v2.6" />
    <path d="M5.2 13.6H3.4" />
  </Glyph>
);

// ---- Housing pools ------------------------------------------------------------------------------

/** Leadership — the march banner. */
export const LeadershipIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M6 3v18" />
    <path d="M6 4.5h11.8l-2.5 3.7 2.5 3.7H6z" />
  </Glyph>
);

/** Authority — the coin mercenaries are hired with. */
export const AuthorityIcon = (props: IconProps) => (
  <Glyph {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M14.4 9.2c-.6-.8-1.5-1.2-2.6-1.2-1.6 0-2.7.9-2.7 2.1 0 2.8 5.5 1.4 5.5 4.2 0 1.3-1.2 2.2-2.8 2.2-1.1 0-2.1-.4-2.7-1.2" />
    <path d="M12 6.3v11.4" />
  </Glyph>
);

/** Dominance — the crown monsters march under. */
export const DominanceIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M4 18.5h16" />
    <path d="M4.6 16 3 6.6l4.9 3.5L12 3.8l4.1 6.3L21 6.6 19.4 16z" />
  </Glyph>
);

// ---- Bolder silhouettes -------------------------------------------------------------------------
/**
 * The filled twins of the glyphs above, drawn for the unit tile (`src/ui/domain/UnitTile.tsx`,
 * design plan §6.2): solid shapes and a 2.25 stroke instead of a 1.75 outline, so the silhouette
 * still reads inside a 32 px tile at 16 px. Holes (an eye, a flame) are punched with `evenodd`
 * rather than painted, because a glyph only ever has `currentColor` to work with. The outline set
 * above is unchanged and stays the one used beside text.
 */

/** Melee (filled) — a broad sword, point up. */
export const MeleeFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <path fill="currentColor" stroke="none" d="M12 1.6 14.6 6.2v7.1H9.4V6.2z" />
    <path fill="currentColor" stroke="none" d="M6.9 13.5h10.2v2.6H6.9z" />
    <path fill="currentColor" stroke="none" d="M10.7 16.3h2.6v3.9h-2.6z" />
    <path fill="currentColor" stroke="none" d="M9.2 20.1h5.6v2.3H9.2z" />
  </Glyph>
);

/** Ranged (filled) — a drawn bow, its string and a solid arrowhead. */
export const RangedFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <path strokeWidth="2.6" d="M7 3.2a12.8 12.8 0 0 1 0 17.6" />
    <path strokeWidth="1.4" d="M7 3.2v17.6" />
    <path d="M4.9 12h10" />
    <path fill="currentColor" stroke="none" d="M14.2 7.9 20.4 12l-6.2 4.1z" />
  </Glyph>
);

/** Mounted (filled) — a horse's head in profile, the eye punched out. */
export const MountedFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <path
      fill="currentColor"
      stroke="none"
      fillRule="evenodd"
      d="M7.6 21.4v-4c0-2.5.9-4.6 2.6-6.3L8.7 8.3 5.5 10V8.2c0-2.1 1.3-3.6 3.6-4.6L12 2.3l1.3 2.6c3 1.3 4.5 3.8 4.5 7.5 0 3.6-.7 6.6-2.1 9zm3.1-12.5a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8"
    />
  </Glyph>
);

/** Flying (filled) — a single solid wing. */
export const FlyingFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <path
      fill="currentColor"
      stroke="none"
      d="M2.6 6.4c5.3-1.5 9.3.8 11.4 6.6.9 2.3 2.7 3.7 5.5 4.4-5.4 1.7-9.5-.5-11.6-6.4C7 8.6 5.2 7.1 2.6 6.4Z"
    />
  </Glyph>
);

/** Engineers (filled) — a catapult: solid wheel, thick arm, solid payload. */
export const EngineersFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <path d="M2.8 20.6h12.4" />
    <circle cx="6.6" cy="17.6" r="3.1" fill="currentColor" stroke="none" />
    <path strokeWidth="2.6" d="m6.6 17.6 9.4-9.4" />
    <circle cx="17.8" cy="6.7" r="2.9" fill="currentColor" stroke="none" />
    <path d="m10.9 13.3 3.5 4.9" />
  </Glyph>
);

/** Beasts (filled) — a solid paw print. */
export const BeastFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <ellipse cx="6.2" cy="9.5" rx="2.1" ry="2.4" fill="currentColor" stroke="none" />
    <ellipse cx="10.3" cy="6" rx="2.1" ry="2.5" fill="currentColor" stroke="none" />
    <ellipse cx="14.6" cy="6.3" rx="2.1" ry="2.5" fill="currentColor" stroke="none" />
    <ellipse cx="18.1" cy="10.1" rx="2" ry="2.3" fill="currentColor" stroke="none" />
    <path
      fill="currentColor"
      stroke="none"
      d="M12 11.2c3.3 0 6.1 2.4 6.1 5.3 0 2.2-1.7 3.7-3.9 3.7-1.1 0-1.7-.3-2.2-.3s-1.1.3-2.2.3c-2.2 0-3.9-1.5-3.9-3.7 0-2.9 2.8-5.3 6.1-5.3Z"
    />
  </Glyph>
);

/** Elementals (filled) — a solid droplet with the flame punched out. */
export const ElementalFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <path
      fill="currentColor"
      stroke="none"
      fillRule="evenodd"
      d="M12 2.4s6.5 6.9 6.5 11.2a6.5 6.5 0 0 1-13 0C5.5 9.3 12 2.4 12 2.4Zm0 15.6a2.9 2.9 0 0 1-2.6-4.2c.7-1.3 2.6-3 2.6-3s1.9 1.7 2.6 3a2.9 2.9 0 0 1-2.6 4.2Z"
    />
  </Glyph>
);

/** Dragons (filled) — a solid horned head in profile, the eye punched out. */
export const DragonFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <path
      fill="currentColor"
      stroke="none"
      fillRule="evenodd"
      d="M3.2 19.2c.3-3.9 2-6.9 5-8.9l-.9-4.2 3.8 2.2c1-.3 2.1-.4 3.2-.4 1.3 0 2.5.2 3.5.6l3.8-2.8-1.1 4.6c1.4 1.5 2.2 3.4 2.4 5.7-1.4-1.3-2.9-1.7-4.4-1.4.6 1.8.3 3.4-.9 4.8zm6.6-7a1 1 0 1 0 0-2 1 1 0 0 0 0 2"
    />
  </Glyph>
);

/** Giants (filled) — a solid closed fist. */
export const GiantFillIcon = (props: IconProps) => (
  <Glyph strokeWidth="2.25" {...props}>
    <path
      fill="currentColor"
      stroke="none"
      d="M8.2 9.4V7.3a2.1 2.1 0 0 1 4.2 0v2.1zM12.4 9.4V6.5a2.1 2.1 0 0 1 4.2 0v2.9z"
    />
    <path
      fill="currentColor"
      stroke="none"
      d="M4.8 11.3c0-1.3 1.1-2.4 2.4-2.4h9.3c2.2 0 4 1.8 4 4v2.2c0 3.2-2.6 5.8-5.8 5.8h-4.1a5.8 5.8 0 0 1-5.8-5.8z"
    />
    <path fill="currentColor" stroke="none" d="M5 12.2H3.3a1.2 1.2 0 0 0 0 2.4H5z" />
  </Glyph>
);
