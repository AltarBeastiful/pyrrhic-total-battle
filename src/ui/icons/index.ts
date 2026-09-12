/**
 * The Pyrrhic icon set: hand-drawn inline SVG, one 24 grid, one stroke weight, `currentColor` only.
 * No icon package and no network request (ADR-0002).
 *
 * Rules of use are in `docs/design.md`: an icon never replaces a label, it is decorative
 * (`aria-hidden`) unless you pass `title`, and a glyph means the same thing everywhere.
 */
export { Glyph, PathGlyph } from './Icon';
export type { GlyphProps, IconProps } from './Icon';

// Categories, groups, races, housing pools.
export {
  AuthorityIcon,
  BeastIcon,
  DominanceIcon,
  DragonIcon,
  ElementalIcon,
  EngineersIcon,
  FlyingIcon,
  GiantIcon,
  GuardsmenIcon,
  LeadershipIcon,
  MeleeIcon,
  MonstersIcon,
  MountedIcon,
  RangedIcon,
  SpecialistsIcon,
} from './units';

// The filled twins of the category, group and race glyphs, drawn for the unit tile.
export {
  BeastFillIcon,
  DragonFillIcon,
  ElementalFillIcon,
  EngineersFillIcon,
  FlyingFillIcon,
  GiantFillIcon,
  MeleeFillIcon,
  MountedFillIcon,
  RangedFillIcon,
} from './units';

// Verbs and state marks.
export {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  CloseIcon,
  CopyIcon,
  DownloadIcon,
  DuplicateIcon,
  GearIcon,
  GenerateIcon,
  InfoIcon,
  MinusIcon,
  MoonIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  ResetIcon,
  SearchIcon,
  ShareIcon,
  SortIcon,
  SunIcon,
  SyncIcon,
  TrashIcon,
  UndoIcon,
  UnpinIcon,
  UploadIcon,
  WarningIcon,
} from './actions';

// One per page section.
export {
  BonusesIcon,
  EnemyIcon,
  HousingIcon,
  MercenariesIcon,
  MethodIcon,
  ResultsIcon,
  TroopsIcon,
} from './sections';

// Composite marks.
export { PoolBadge, UnitBadge } from './badges';
export type {
  BadgeCategory,
  BadgeGroup,
  BadgePool,
  BadgeSize,
  PoolBadgeProps,
  UnitBadgeProps,
} from './badges';
