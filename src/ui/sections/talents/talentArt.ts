/**
 * The game's picture for a talent (B-31). The images are made by `tools/talent-icons.py` into the git-ignored `art/`
 * folder; on a checkout without them the globs below are empty and a tile falls back to the glyph icons.
 */
interface ArtRow {
  file: string;
  tint: string;
}

const indexes = import.meta.glob<ArtRow | Record<string, ArtRow>>('./art/index.json', { eager: true, import: 'default' });
const urls = import.meta.glob<string>('./art/*.webp', { eager: true, import: 'default', query: '?no-inline' });

const index = (Object.values(indexes)[0] ?? {}) as Record<string, ArtRow>;

export interface TalentArt {
  url: string;
  tint: string;
}

export function talentArt(id: number): TalentArt | null {
  const row = index[String(id)];
  if (row === undefined) return null;
  const url = urls[`./art/${row.file}`];
  return url === undefined ? null : { url, tint: row.tint };
}
