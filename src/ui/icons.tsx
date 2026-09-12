/**
 * The handful of icons the shell needs, as inline SVG: no icon dependency, no network request
 * (ADR-0002). Each one is a 24×24 stroke glyph that inherits `currentColor` and the font size.
 */
import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

function Glyph({ d, ...props }: IconProps & { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      width="1.15em"
      height="1.15em"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

export const GearIcon = (props: IconProps) => (
  <Glyph
    {...props}
    d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a1.9 1.9 0 1 1-2.69 2.69l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-.97 1.47V21a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a1.9 1.9 0 1 1-2.69-2.69l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-.97H3a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a1.9 1.9 0 1 1 2.69-2.69l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 .97-1.47V3a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 .97 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a1.9 1.9 0 1 1 2.69 2.69l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47.97H21a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.47.97Z"
  />
);

export const ChevronDownIcon = (props: IconProps) => <Glyph {...props} d="m6 9 6 6 6-6" />;
export const ChevronUpIcon = (props: IconProps) => <Glyph {...props} d="m18 15-6-6-6 6" />;
export const CloseIcon = (props: IconProps) => <Glyph {...props} d="M18 6 6 18M6 6l12 12" />;
export const PlusIcon = (props: IconProps) => <Glyph {...props} d="M12 5v14M5 12h14" />;
export const CopyIcon = (props: IconProps) => <Glyph {...props} d="M9 9h10v10H9zM5 15H4V4h11v1" />;
export const CheckIcon = (props: IconProps) => <Glyph {...props} d="m4 12 5 5L20 6" />;
export const ShareIcon = (props: IconProps) => (
  <Glyph {...props} d="M12 15V3m0 0L8 7m4-4 4 4M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
);
export const DownloadIcon = (props: IconProps) => (
  <Glyph {...props} d="M12 3v12m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
);
export const UploadIcon = (props: IconProps) => (
  <Glyph {...props} d="M12 21V9m0 0 4 4m-4-4-4 4M4 7V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2" />
);
export const TrashIcon = (props: IconProps) => (
  <Glyph {...props} d="M4 7h16M10 11v6m4-6v6M6 7l1 13h10l1-13M9 7V4h6v3" />
);
export const SunIcon = (props: IconProps) => (
  <Glyph
    {...props}
    d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2m0 18v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M1 12h2m18 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
  />
);
export const MoonIcon = (props: IconProps) => (
  <Glyph {...props} d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
);
export const InfoIcon = (props: IconProps) => (
  <Glyph {...props} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 11v5m0-8.5v.01" />
);
export const DuplicateIcon = (props: IconProps) => (
  <Glyph {...props} d="M9 9h10v12H9zM5 15H4V3h11v1M13 12v5m-2.5-2.5h5" />
);
export const PencilIcon = (props: IconProps) => <Glyph {...props} d="M4 20h4L20 8l-4-4L4 16v4ZM14 6l4 4" />;
