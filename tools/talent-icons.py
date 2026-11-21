#!/usr/bin/env python3
"""B-31: turn the game's talent pictures into small web images for the talents page.

Reads the owner's local extraction (talent_icons.json + images) and the app's talent table, and writes
src/ui/sections/talents/art/<visual>.webp (96 px) and art/index.json ({talentId: {file, tint}}).
The folder is git-ignored: the game's art is never committed. Run: python3 tools/talent-icons.py [RECON_ASSETS_DIR]
"""
import colorsys
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RECON = Path(sys.argv[1] if len(sys.argv) > 1 else Path.home() / 'projects/tb-analyze/recon/assets')
OUT = ROOT / 'src/ui/sections/talents/art'
SIZE = 96


def tint_of(img: Image.Image) -> str:
    """Average of the saturated, visible pixels, as a hex colour; grey when the picture has none."""
    px = [p for p in img.convert('RGBA').resize((32, 32)).getdata() if p[3] > 200]
    sat = []
    for r, g, b, _ in px:
        h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if s > 0.35 and v > 0.35:
            sat.append((r, g, b))
    pool = sat or [(p[0], p[1], p[2]) for p in px] or [(128, 128, 128)]
    n = len(pool)
    r, g, b = (sum(c[i] for c in pool) // n for i in range(3))
    return f'#{r:02x}{g:02x}{b:02x}'


def main() -> None:
    icons = json.loads((RECON / 'catalog/talent_icons.json').read_text())['icons']
    by_id = {t: name for name, v in icons.items() for t in v['techs']}
    talents = json.loads((ROOT / 'src/data/tables/talents.json').read_text())
    rows = talents['data'] if isinstance(talents, dict) and 'data' in talents else talents
    OUT.mkdir(parents=True, exist_ok=True)
    index, done = {}, {}
    for t in rows:
        name = by_id.get(t['id'])
        if name is None:
            continue
        if name not in done:
            src = RECON / icons[name]['path']
            if not src.exists():
                continue
            img = Image.open(src).convert('RGBA')
            img.thumbnail((SIZE, SIZE), Image.LANCZOS)
            img.save(OUT / f'{name}.webp', 'WEBP', quality=85)
            done[name] = tint_of(img)
        index[str(t['id'])] = {'file': f'{name}.webp', 'tint': done[name]}
    (OUT / 'index.json').write_text(json.dumps(index, indent=1))
    print(f'{len(done)} pictures, {len(index)}/{len(rows)} talents')


if __name__ == '__main__':
    main()
