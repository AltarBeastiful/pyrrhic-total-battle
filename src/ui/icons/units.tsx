/**
 * Unit glyphs: one per category, group and race, plus the three housing pools. They are the visual
 * shorthand the whole app uses for a unit type — in a badge, in a filter chip, in a result row, on a
 * tile — so each one has to read at 16 px.
 *
 * The units come from **Game Icons** (`react-icons/gi`, CC BY 3.0, credited in the About dialog):
 * solid silhouettes, chosen one per meaning after comparing the candidates at 16 px on the kit page
 * (`Icons.story.tsx`). The pools take a Lucide mark instead — they count capacity, they are not a
 * kind of soldier.
 */
import { Coins, Crown, Flag } from 'lucide-react';
import {
  GiBroadsword,
  GiCatapult,
  GiDragonHead,
  GiFist,
  GiFlame,
  GiFlatPawPrint,
  GiHighShot,
  GiHorseHead,
  GiShield,
  GiSpikyWing,
  GiStarShuriken,
  GiTripleClaws,
} from 'react-icons/gi';

import { GameGlyph, LucideGlyph } from './Icon';
import type { IconProps } from './Icon';

// ---- Categories ---------------------------------------------------------------------------------

/** Melee — a broadsword, point up. */
export const MeleeIcon = (props: IconProps) => <GameGlyph icon={GiBroadsword} {...props} />;

/** Ranged — a drawn bow and its arrow. */
export const RangedIcon = (props: IconProps) => <GameGlyph icon={GiHighShot} {...props} />;

/** Mounted — a horse's head in profile. */
export const MountedIcon = (props: IconProps) => <GameGlyph icon={GiHorseHead} {...props} />;

/** Flying — a single swept wing. */
export const FlyingIcon = (props: IconProps) => <GameGlyph icon={GiSpikyWing} {...props} />;

// ---- Groups -------------------------------------------------------------------------------------

/** Guardsmen — a shield. */
export const GuardsmenIcon = (props: IconProps) => <GameGlyph icon={GiShield} {...props} />;

/** Specialists — a star, the rank mark. */
export const SpecialistsIcon = (props: IconProps) => <GameGlyph icon={GiStarShuriken} {...props} />;

/** Engineers — a catapult. */
export const EngineersIcon = (props: IconProps) => <GameGlyph icon={GiCatapult} {...props} />;

/** Monsters — three talons. */
export const MonstersIcon = (props: IconProps) => <GameGlyph icon={GiTripleClaws} {...props} />;

// ---- Races --------------------------------------------------------------------------------------

/** Beasts — a paw print. */
export const BeastIcon = (props: IconProps) => <GameGlyph icon={GiFlatPawPrint} {...props} />;

/** Elementals — a flame. */
export const ElementalIcon = (props: IconProps) => <GameGlyph icon={GiFlame} {...props} />;

/** Dragons — a horned head in profile. */
export const DragonIcon = (props: IconProps) => <GameGlyph icon={GiDragonHead} {...props} />;

/** Giants — a closed fist. */
export const GiantIcon = (props: IconProps) => <GameGlyph icon={GiFist} {...props} />;

// ---- Housing pools ------------------------------------------------------------------------------

/** Leadership — the march banner. */
export const LeadershipIcon = (props: IconProps) => <LucideGlyph icon={Flag} {...props} />;

/** Authority — the coin mercenaries are hired with. */
export const AuthorityIcon = (props: IconProps) => <LucideGlyph icon={Coins} {...props} />;

/** Dominance — the crown monsters march under. */
export const DominanceIcon = (props: IconProps) => <LucideGlyph icon={Crown} {...props} />;

// ---- The filled twins ---------------------------------------------------------------------------
/**
 * The unit tile (`src/ui/domain/UnitTile.tsx`, design plan §6.2) asks for a bolder silhouette than
 * the one that sits beside text. Game Icons are solid shapes already — filling them is what they
 * are — so each twin is now the same drawing as its outline name. The `*FillIcon` exports stay so
 * the tile keeps its contract and so a future set can make the two differ again.
 */
export const MeleeFillIcon = MeleeIcon;
export const RangedFillIcon = RangedIcon;
export const MountedFillIcon = MountedIcon;
export const FlyingFillIcon = FlyingIcon;
export const EngineersFillIcon = EngineersIcon;
export const BeastFillIcon = BeastIcon;
export const ElementalFillIcon = ElementalIcon;
export const DragonFillIcon = DragonIcon;
export const GiantFillIcon = GiantIcon;
