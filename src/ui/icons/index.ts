/**
 * The Pyrrhic icon set. Two bundled packages draw it (design plan D-16): Lucide (ISC) for the verbs,
 * the marks, the sections and the housing pools, Game Icons (CC BY 3.0, `react-icons/gi`) for the
 * unit silhouettes. Both ship with the app — no icon font, no network request (ADR-0002) — and both
 * are credited in the About dialog.
 *
 * Every export below is the same component contract whatever drew it: `currentColor`, sized in `em`,
 * decorative unless you pass `title`. Rules of use are in `docs/design.md` §5: an icon never
 * replaces a label, and a glyph means the same thing everywhere.
 */
export { GameGlyph, Glyph, LucideGlyph, PathGlyph } from './Icon';
export type { GameGlyphProps, GlyphProps, IconProps, LucideGlyphProps } from './Icon';

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

// The filled twins the unit tile asks for. Game Icons are solid already, so each one is its
// outline namesake; the names stay because the tile's contract does.
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
  GripIcon,
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
