/**
 * Action and status glyphs: the verbs of the interface (generate, pin, copy, share, undo…) and the
 * four state marks (check, info, warning, close). Same 24 grid and stroke as every other icon.
 */
import { Glyph, PathGlyph } from './Icon';
import type { IconProps } from './Icon';

// ---- Verbs --------------------------------------------------------------------------------------

/** Generate — run the stacker. */
export const GenerateIcon = (props: IconProps) => <PathGlyph {...props} d="M7.5 4.5 19 12 7.5 19.5z" />;

export const GearIcon = (props: IconProps) => (
  <Glyph {...props}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a1.9 1.9 0 1 1-2.69 2.69l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V21a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a1.9 1.9 0 1 1-2.69-2.69l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.9 1.9 0 1 1 2.69-2.69l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 .97-1.47V3a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.9 1.9 0 1 1 2.69 2.69l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47.97H21a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.47.97Z" />
  </Glyph>
);

export const PencilIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4" />
);

export const PlusIcon = (props: IconProps) => <PathGlyph {...props} d="M12 5v14M5 12h14" />;
export const MinusIcon = (props: IconProps) => <PathGlyph {...props} d="M5 12h14" />;

export const TrashIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
);

export const CopyIcon = (props: IconProps) => <PathGlyph {...props} d="M9 9h10v10H9zM5 15H4V4h11v1" />;

export const DuplicateIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M9 9h10v12H9zM5 15H4V3h11v1M13 12v5m-2.5-2.5h5" />
);

export const ShareIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M12 15V3m0 0L8 7m4-4 4 4M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
);

export const DownloadIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
);

export const UploadIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M12 21V9m0 0 4 4m-4-4-4 4M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
);

/** Sync — the two-way exchange with another device. */
export const SyncIcon = (props: IconProps) => (
  <PathGlyph
    {...props}
    d="M4 9h12.5a3.5 3.5 0 0 1 0 7H16M4 9l3.5-3.5M4 9l3.5 3.5M20 15H7.5a3.5 3.5 0 0 1 0-7H8"
  />
);

/** Pin — keep this one where it is. */
export const PinIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M9 3.5h6l-.8 5.4 2.8 2.5v1.6H7v-1.6l2.8-2.5zM12 13v7.5" />
);

/** Unpin — the same tack, struck through. */
export const UnpinIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M9 3.5h6l-.8 5.4 2.8 2.5v1.6H7v-1.6l2.8-2.5zM12 13v7.5M4 4l16 16" />
);

/** Undo — step back one edit. */
export const UndoIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M4 9h9.5a5.5 5.5 0 0 1 0 11H8M4 9l4-4M4 9l4 4" />
);

/** Reset — put it back the way it was generated. */
export const ResetIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M4.2 12a7.8 7.8 0 1 0 2.3-5.5M4 4.5V10h5.5" />
);

/** Sort — reorder a list. */
export const SortIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M7 4.5v15m0 0-3-3m3 3 3-3M17 19.5v-15m0 0-3 3m3-3 3 3" />
);

/** Search — the mercenary picker's filter field. */
export const SearchIcon = (props: IconProps) => (
  <Glyph {...props}>
    <circle cx="10.8" cy="10.8" r="6.3" />
    <path d="m15.4 15.4 4.4 4.4" />
  </Glyph>
);

// ---- Marks and chevrons -------------------------------------------------------------------------

export const ChevronDownIcon = (props: IconProps) => <PathGlyph {...props} d="m6 9 6 6 6-6" />;
export const ChevronUpIcon = (props: IconProps) => <PathGlyph {...props} d="m18 15-6-6-6 6" />;
export const ChevronLeftIcon = (props: IconProps) => <PathGlyph {...props} d="m15 6-6 6 6 6" />;
export const ChevronRightIcon = (props: IconProps) => <PathGlyph {...props} d="m9 6 6 6-6 6" />;
export const CloseIcon = (props: IconProps) => <PathGlyph {...props} d="M18 6 6 18M6 6l12 12" />;
export const CheckIcon = (props: IconProps) => <PathGlyph {...props} d="m4 12 5 5L20 6" />;

export const InfoIcon = (props: IconProps) => (
  <Glyph {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5m0-8.5v.01" />
  </Glyph>
);

/** Warning — something worked but you should look at it. */
export const WarningIcon = (props: IconProps) => (
  <Glyph {...props}>
    <path d="M10.6 3.9 2.5 18.2A1.6 1.6 0 0 0 3.9 20.6h16.2a1.6 1.6 0 0 0 1.4-2.4L13.4 3.9a1.6 1.6 0 0 0-2.8 0Z" />
    <path d="M12 9.5v4m0 3v.01" />
  </Glyph>
);

// ---- Theme --------------------------------------------------------------------------------------

export const SunIcon = (props: IconProps) => (
  <PathGlyph
    {...props}
    d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
  />
);

export const MoonIcon = (props: IconProps) => (
  <PathGlyph {...props} d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
);
