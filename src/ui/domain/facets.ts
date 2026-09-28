/**
 * **What a type is filed under** — the words for the facets the game tags a unit with, and the one reading of
 * a unit that says which of them it has.
 *
 * The words were the mercenary picker's own (`sections/mercenaries/labels.ts`, S-12) until the unit sheet
 * needed them too (owner, 2026-09-28: *"in the details of a troop, add the category it fits in (guardsmen,
 * mounted for RD2; specialist melee for SW1…)"*). They live in `domain` now, because they are the interface's
 * vocabulary for a unit rather than one section's: the picker's facet selects, the sheet's heading and any
 * later reader all say "Mounted" the same way (design rule 5 — one name, one thing).
 *
 * **Singular, where the Bonuses card's words are plural** (`BONUS_LABELS`, `sections/bonuses/labels.ts`), and
 * the two are not the same thing: "Specialists +12 % strength" names a *bonus*, one that pays every
 * specialist, while "Specialist" here names *a unit* — this mercenary is one. Both are right in their own
 * frame, and that difference is why these maps are not that one.
 */
import type { Category, Group, Race, UnitDef } from '../../data/types';
import { CATEGORIES } from '../../data/types';
import { unitGroupOf, type UnitGroup } from './unitGroup';

/** The role a type is built for: a guardsman, a specialist, an engineer, a monster. */
export const GROUP_LABELS: Record<Group, string> = {
  guardsmen: 'Guardsmen',
  specialist: 'Specialist',
  engineers: 'Engineers',
  monster: 'Monster',
};

/** The squad a type fights in. */
export const CATEGORY_LABELS: Record<Category, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
};

/** The race a type belongs to — monsters always; beasts, dragons, elementals and giants anywhere. */
export const RACE_LABELS: Record<Race, string> = {
  beast: 'Beast',
  elemental: 'Elemental',
  dragon: 'Dragon',
  giant: 'Giant',
};

/** What one key is called when it names a facet of a type rather than a bonus. */
const FACET_WORD: Record<string, string> = { ...GROUP_LABELS, ...CATEGORY_LABELS, ...RACE_LABELS };

/**
 * The key that names each family's own word, so `facetWords` can drop the one the heading repeats. The
 * interface's five families and the data's four groups are not the same list (`unitGroup.ts`), and
 * mercenaries have no key of their own — a mercenary is a mercenary by its `pool`, not by a tag.
 */
const FAMILY_KEY: Record<UnitGroup, string | undefined> = {
  guardsmen: 'guardsmen',
  specialists: 'specialist',
  engineers: 'engineers',
  monsters: 'monster',
  mercenaries: undefined,
};

/**
 * **The facets this type is filed under, in the game's order** — everything but the family the interface
 * draws it as, which the sheet's heading already names ("Guardsmen II · Mounted": the heading carries the
 * family and the tier, this carries the squads and the races).
 *
 * Read off **`UnitDef.keys`** and never off the unit's `category`, `race` or `group` fields, and that is the
 * whole point of it: `keys` is the list the engine hands the bonus editor (`healthPercent`, `strengthPercent`,
 * `src/engine/units.ts`), so a facet the tables carry is a facet the bonuses reach — the placement a reader is
 * shown and the bonuses the type really gets cannot disagree (design rule 5). It is the same list
 * `src/data/index.ts` builds every kind of unit from.
 *
 * The family's own key is dropped: a guardsman's keys open with `guardsmen`, the word its heading already
 * wears. A **mercenary's** keys are not, because there they are not the same fact — "Mercenaries VI ·
 * Guardsmen" is a mercenary the guardsmen bonuses pay, which is exactly what its tags say.
 */
export function facetWords(unit: UnitDef): string[] {
  const familyKey = FAMILY_KEY[unitGroupOf(unit)];
  return unit.keys.filter((key) => key !== 'army' && key !== familyKey).map((key) => FACET_WORD[key] ?? key);
}

/**
 * **Whether the app is missing the squad this type fights in** — the one facet a type can be left without and
 * the one it cannot be played without: a race and a role are optional by design, a squad is not.
 *
 * `false` for a type that has one, and `false` for an **engineer**, whose record carries none on purpose
 * (`TroopRecord.category`, "absent for engineers"): an engineer is not missing anything, and an alert that
 * fired on all of them would be an alert nobody reads (design rule 15).
 *
 * `true` for the four mercenaries of the 2026-09-18 pull whose tags carry a role and nothing else — the Epic
 * Monster Hunters V, VI and VII and the Superior Epic Monster Hunter II — and for a hand-typed mercenary whose
 * category was left blank (`CustomMercenarySheet`). What reads this is the unit sheet, which **says so**
 * rather than drawing a shorter list a reader would take for the whole truth.
 */
export function squadUnknown(unit: UnitDef): boolean {
  if (unitGroupOf(unit) === 'engineers') return false;
  return !CATEGORIES.some((category) => unit.keys.includes(category));
}
