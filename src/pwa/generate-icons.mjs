/**
 * Draws the Pyrrhic app icon and writes it as PNG — with no image dependency.
 *
 * The icon is a stack of three bars (widest at the bottom) on the accent colour: the app sizes
 * stacks of troops, so the mark is a stack. The same drawing exists as `public/icons/icon.svg`;
 * this script rasterises it procedurally (4x4 supersampling) and encodes the pixels with a
 * minimal PNG writer — a PNG is just a signature plus IHDR/IDAT/IEND chunks, and `node:zlib`
 * already provides the deflate that IDAT needs. Run it after changing a colour token:
 *
 *   node src/pwa/generate-icons.mjs
 */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'icons');

// sRGB of the `--pyr-accent` / `--pyr-accent-fg` tokens in src/index.css (light palette).
const ACCENT = [0x3d, 0x64, 0xc7];
const MARK = [0xfc, 0xfc, 0xfc];

// ---------------------------------------------------------------- minimal PNG encoder

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes) {
  let c = 0xffffffff;
  for (const byte of bytes) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

/** 8-bit RGBA (colour type 6), one filter byte (0 = none) per scanline. */
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    raw[y * (1 + width * 4)] = 0;
    rgba.copy(raw, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------- the drawing

/**
 * Rounded-rectangle hit test, used for both the tile and the bars: inside the bounding box and
 * within `radius` of the box shrunk by `radius` on every side (which is the corner centre for a
 * corner point and the point itself in the middle).
 */
function insideRoundedRect(x, y, left, top, width, height, radius) {
  if (x < left || y < top || x > left + width || y > top + height) return false;
  const cx = Math.min(Math.max(x, left + radius), left + width - radius);
  const cy = Math.min(Math.max(y, top + radius), top + height - radius);
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius;
}

/** The three bars, as fractions of the content box. Widest at the bottom: a stack. */
const BARS = [0.45, 0.72, 1];
const BAR_H = 0.18;
const BAR_GAP = 0.09;

function draw(size, { maskable }) {
  // A maskable icon is full-bleed and keeps its content inside the central 80% safe zone;
  // a plain icon is a rounded tile on transparency.
  const content = size * (maskable ? 0.5 : 0.58);
  const stackHeight = content * (3 * BAR_H + 2 * BAR_GAP);
  const contentTop = (size - stackHeight) / 2;
  const tileRadius = size * 0.22;

  const rgba = Buffer.alloc(size * size * 4);
  const samples = 4;
  const step = 1 / samples;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let tile = 0;
      let mark = 0;
      for (let sy = 0; sy < samples; sy += 1) {
        for (let sx = 0; sx < samples; sx += 1) {
          const px = x + (sx + 0.5) * step;
          const py = y + (sy + 0.5) * step;
          if (maskable || insideRoundedRect(px, py, 0, 0, size, size, tileRadius)) tile += 1;
          for (const [index, width] of BARS.entries()) {
            const barWidth = content * width;
            const barTop = contentTop + index * content * (BAR_H + BAR_GAP);
            const barHeight = content * BAR_H;
            if (
              insideRoundedRect(px, py, (size - barWidth) / 2, barTop, barWidth, barHeight, barHeight / 2)
            ) {
              mark += 1;
              break;
            }
          }
        }
      }
      const total = samples * samples;
      const alpha = tile / total;
      const markAlpha = Math.min(mark / total, alpha);
      const offset = (y * size + x) * 4;
      for (let channel = 0; channel < 3; channel += 1) {
        // Composite the mark over the tile, then the tile over transparency.
        const colour = ACCENT[channel] * (1 - markAlpha) + MARK[channel] * markAlpha;
        rgba[offset + channel] = Math.round(colour);
      }
      rgba[offset + 3] = Math.round(alpha * 255);
    }
  }
  return encodePng(size, size, rgba);
}

const hex = (rgb) => `#${rgb.map((n) => n.toString(16).padStart(2, '0')).join('')}`;

function svg() {
  const size = 512;
  const content = size * 0.58;
  const stackHeight = content * (3 * BAR_H + 2 * BAR_GAP);
  const top = (size - stackHeight) / 2;
  const bars = BARS.map((width, index) => {
    const barWidth = content * width;
    const barHeight = content * BAR_H;
    const y = top + index * content * (BAR_H + BAR_GAP);
    const round = (n) => Number(n.toFixed(2));
    return `  <rect x="${round((size - barWidth) / 2)}" y="${round(y)}" width="${round(barWidth)}" height="${round(barHeight)}" rx="${round(barHeight / 2)}" fill="${hex(MARK)}" />`;
  });
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">`,
    `  <title>Pyrrhic</title>`,
    `  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${hex(ACCENT)}" />`,
    ...bars,
    `</svg>`,
    '',
  ].join('\n');
}

mkdirSync(OUT_DIR, { recursive: true });

const files = [
  ['icon-192.png', draw(192, { maskable: false })],
  ['icon-512.png', draw(512, { maskable: false })],
  ['icon-maskable-192.png', draw(192, { maskable: true })],
  ['icon-maskable-512.png', draw(512, { maskable: true })],
  ['apple-touch-icon-180.png', draw(180, { maskable: true })],
  ['icon.svg', Buffer.from(svg(), 'utf8')],
];

for (const [name, bytes] of files) {
  writeFileSync(join(OUT_DIR, name), bytes);
  const digest = createHash('sha256').update(bytes).digest('hex').slice(0, 8);
  console.log(`${name.padEnd(26)} ${String(bytes.length).padStart(7)} bytes  sha256:${digest}`);
}
