/**
 * The dot a chip wears once something is recorded on it — a captain's level, an artifact's stars,
 * a title's value — as TotalStack's chips wear it (investigation 0006: "Aydae ●, Bernard ●").
 *
 * It used to be a bullet typed after the name, a space and a 13 px "•" inside the label, which
 * made every chip with a level about 9 px wider than the same chip without one (owner, 2026-09-17:
 * "could be tighter for the heroes, especially the ones which have a level selected, as they have
 * a dot with extra spacing"). On a chip that carries a gear — and every chip that can record
 * anything does — it now sits in the 14 px strip the chip already reserves for the gear
 * (`kit.module.css`, `.cornerGear`): the gear is a circle on the top corner and never reaches the
 * middle of that strip, so the dot costs no width at all, and a chip with a level is exactly as
 * wide as one without. On a chip with no gear it falls back to an inline mark after the name.
 *
 * Decoration, never the signal alone: the chip's own accessible name and its gear's ("Change
 * Aydae's level" rather than "Set …") already say what the dot says (design rule 24).
 */
import classes from './kit.module.css';

export function ChipDot() {
  return <span aria-hidden="true" className={classes.chipDot} />;
}
