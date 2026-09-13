/**
 * Our colour names, told to TypeScript. Without this augmentation `MantineColor` is
 * `DefaultMantineColor`, which ends in `(string & {})` — so `c="guardsman.6"` (a typo) type-checks
 * and ships. Listing the eleven generated ramps plus the neutral scale turns every colour prop in
 * the app into a closed set, which is the point of owning the theme.
 *
 * Mantine's own names stay in the union: `dark` and `gray` are what its dark scheme and its
 * unstyled components reach for, and dropping them would break the library's own defaults.
 */
import type { DefaultMantineColor, MantineColorsTuple } from '@mantine/core';

type PyrrhicColor =
  | 'brass'
  | 'guardsmen'
  | 'specialists'
  | 'engineers'
  | 'monsters'
  | 'mercenaries'
  | 'danger'
  | 'tier5'
  | 'tier6'
  | 'tier7'
  | 'tier8'
  | 'tier9'
  | 'slate'
  | DefaultMantineColor;

declare module '@mantine/core' {
  export interface MantineThemeColorsOverride {
    colors: Record<PyrrhicColor, MantineColorsTuple>;
  }
}
