/**
 * Action and status glyphs: the verbs of the interface (generate, pin, copy, share, undo…) and the
 * four state marks (check, info, warning, close). Every one is a Lucide drawing (ISC) wrapped in the
 * Pyrrhic contract, so the whole set shares one grid, one 2 px stroke and one pair of caps.
 *
 * The export name is the promise, not the drawing: a section imports `ResetIcon`, and which Lucide
 * glyph that is stays a decision of this file.
 */
import {
  ArrowUpDown,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  CopyPlus,
  Download,
  Info,
  Minus,
  Moon,
  Pencil,
  Pin,
  PinOff,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Share,
  Sun,
  Trash,
  TriangleAlert,
  Undo2,
  Upload,
  X,
} from 'lucide-react';

import { LucideGlyph } from './Icon';
import type { IconProps } from './Icon';

// ---- Verbs --------------------------------------------------------------------------------------

/** Generate — run the stacker. */
export const GenerateIcon = (props: IconProps) => <LucideGlyph icon={Play} {...props} />;

/** Gear — open the editor of the thing beside it. */
export const GearIcon = (props: IconProps) => <LucideGlyph icon={Settings} {...props} />;

export const PencilIcon = (props: IconProps) => <LucideGlyph icon={Pencil} {...props} />;
export const PlusIcon = (props: IconProps) => <LucideGlyph icon={Plus} {...props} />;
export const MinusIcon = (props: IconProps) => <LucideGlyph icon={Minus} {...props} />;
export const TrashIcon = (props: IconProps) => <LucideGlyph icon={Trash} {...props} />;
export const CopyIcon = (props: IconProps) => <LucideGlyph icon={Copy} {...props} />;

/** Duplicate — a copy that becomes a second thing, not a copy to the clipboard. */
export const DuplicateIcon = (props: IconProps) => <LucideGlyph icon={CopyPlus} {...props} />;

export const ShareIcon = (props: IconProps) => <LucideGlyph icon={Share} {...props} />;
export const DownloadIcon = (props: IconProps) => <LucideGlyph icon={Download} {...props} />;
export const UploadIcon = (props: IconProps) => <LucideGlyph icon={Upload} {...props} />;

/** Sync — the two-way exchange with another device. */
export const SyncIcon = (props: IconProps) => <LucideGlyph icon={RefreshCw} {...props} />;

/** Pin — keep this one where it is. */
export const PinIcon = (props: IconProps) => <LucideGlyph icon={Pin} {...props} />;

/** Unpin — the same tack, struck through. */
export const UnpinIcon = (props: IconProps) => <LucideGlyph icon={PinOff} {...props} />;

/** Undo — step back one edit. */
export const UndoIcon = (props: IconProps) => <LucideGlyph icon={Undo2} {...props} />;

/** Reset — put it back the way it was generated. */
export const ResetIcon = (props: IconProps) => <LucideGlyph icon={RotateCcw} {...props} />;

/** Sort — reorder a list. */
export const SortIcon = (props: IconProps) => <LucideGlyph icon={ArrowUpDown} {...props} />;

/** Search — the mercenary picker's filter field. */
export const SearchIcon = (props: IconProps) => <LucideGlyph icon={Search} {...props} />;

// ---- Marks and chevrons -------------------------------------------------------------------------

export const ChevronDownIcon = (props: IconProps) => <LucideGlyph icon={ChevronDown} {...props} />;
export const ChevronUpIcon = (props: IconProps) => <LucideGlyph icon={ChevronUp} {...props} />;
export const ChevronLeftIcon = (props: IconProps) => <LucideGlyph icon={ChevronLeft} {...props} />;
export const ChevronRightIcon = (props: IconProps) => <LucideGlyph icon={ChevronRight} {...props} />;
export const CloseIcon = (props: IconProps) => <LucideGlyph icon={X} {...props} />;
export const CheckIcon = (props: IconProps) => <LucideGlyph icon={Check} {...props} />;
export const InfoIcon = (props: IconProps) => <LucideGlyph icon={Info} {...props} />;

/** Warning — something worked but you should look at it. */
export const WarningIcon = (props: IconProps) => <LucideGlyph icon={TriangleAlert} {...props} />;

// ---- Theme --------------------------------------------------------------------------------------

export const SunIcon = (props: IconProps) => <LucideGlyph icon={Sun} {...props} />;
export const MoonIcon = (props: IconProps) => <LucideGlyph icon={Moon} {...props} />;
