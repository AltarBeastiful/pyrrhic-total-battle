/**
 * A minimal QR encoder, written here because the app takes no runtime dependency it does not need
 * (ADR-0003) and makes no network request (ADR-0002). Scope: **byte mode only**, error correction
 * L or M, every version — which is what a share link needs (a version-40 L code holds 2,953 bytes,
 * the budget ADR-0005 sets for offering a QR at all; anything longer is offered as a file instead).
 *
 * Structure follows ISO/IEC 18004: data codewords → Reed–Solomon blocks → interleave → module
 * placement → mask selection by penalty score → format/version information.
 */

export type QrEcc = 'L' | 'M';

export interface QrCode {
  version: number;
  ecc: QrEcc;
  /** Mask pattern (0–7) the penalty score selected. */
  mask: number;
  /** Modules per side (`4 × version + 17`). */
  size: number;
  /** `modules[y][x]` — true is a dark module. */
  modules: boolean[][];
}

export interface QrOptions {
  ecc?: QrEcc;
  minVersion?: number;
  maxVersion?: number;
}

export const QR_MIN_VERSION = 1;
export const QR_MAX_VERSION = 40;

/** Error-correction codewords per block, versions 1–40 (ISO/IEC 18004 table 13, levels L and M). */
const ECC_CODEWORDS_PER_BLOCK: Record<QrEcc, readonly number[]> = {
  L: [
    7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30,
    30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30,
  ],
  M: [
    10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28,
    28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
  ],
};

/** Number of error-correction blocks, versions 1–40 (ISO/IEC 18004 table 13, levels L and M). */
const ECC_BLOCKS: Record<QrEcc, readonly number[]> = {
  L: [
    1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17,
    18, 19, 19, 20, 21, 22, 24, 25,
  ],
  M: [
    1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29,
    31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
  ],
};

/** Two bits identifying the level inside the format information. */
const ECC_FORMAT_BITS: Record<QrEcc, number> = { L: 1, M: 0 };

const PAD_BYTES = [0xec, 0x11] as const;

function tableValue(table: readonly number[], version: number, what: string): number {
  const value = table[version - 1];
  if (value === undefined) throw new Error(`QR: no ${what} for version ${String(version)}`);
  return value;
}

// ---- Capacity ----------------------------------------------------------------------------------------
/** Data+ECC modules available in a version, before any codeword is placed. */
function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const alignCount = Math.floor(version / 7) + 2;
    result -= (25 * alignCount - 10) * alignCount - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

/** Data + error-correction codewords a version holds in total. */
export function qrTotalCodewords(version: number): number {
  return Math.floor(rawDataModules(version) / 8);
}

function dataCodewords(version: number, ecc: QrEcc): number {
  const blocks = tableValue(ECC_BLOCKS[ecc], version, 'block count');
  const perBlock = tableValue(ECC_CODEWORDS_PER_BLOCK[ecc], version, 'ECC codewords');
  return qrTotalCodewords(version) - perBlock * blocks;
}

/** Byte-mode character-count indicator: 8 bits up to version 9, 16 bits from version 10. */
function countBits(version: number): number {
  return version <= 9 ? 8 : 16;
}

/** How many bytes of payload fit in this version at this level (mode and length indicators removed). */
export function qrCapacity(version: number, ecc: QrEcc): number {
  return Math.floor((dataCodewords(version, ecc) * 8 - 4 - countBits(version)) / 8);
}

// ---- Data codewords ----------------------------------------------------------------------------------
class BitBuffer {
  private readonly bits: number[] = [];

  append(value: number, length: number): void {
    for (let index = length - 1; index >= 0; index -= 1) this.bits.push((value >>> index) & 1);
  }

  get length(): number {
    return this.bits.length;
  }

  toBytes(): number[] {
    const bytes: number[] = [];
    for (let index = 0; index < this.bits.length; index += 8) {
      let byte = 0;
      for (let offset = 0; offset < 8; offset += 1) byte = (byte << 1) | (this.bits[index + offset] ?? 0);
      bytes.push(byte);
    }
    return bytes;
  }
}

/** Mode indicator, length, payload, terminator and padding — the data half of the codeword stream. */
export function encodeDataCodewords(bytes: Uint8Array, version: number, ecc: QrEcc): number[] {
  const capacity = dataCodewords(version, ecc) * 8;
  const buffer = new BitBuffer();
  buffer.append(0b0100, 4); // byte mode
  buffer.append(bytes.length, countBits(version));
  for (const byte of bytes) buffer.append(byte, 8);
  if (buffer.length > capacity) {
    throw new Error(`QR: ${String(bytes.length)} bytes do not fit in version ${String(version)}`);
  }
  buffer.append(0, Math.min(4, capacity - buffer.length)); // terminator
  buffer.append(0, (8 - (buffer.length % 8)) % 8); // byte alignment
  const codewords = buffer.toBytes();
  for (let index = 0; codewords.length * 8 < capacity; index += 1) {
    codewords.push(PAD_BYTES[index % 2] ?? 0xec);
  }
  return codewords;
}

// ---- Reed–Solomon ------------------------------------------------------------------------------------
/** Multiplication in GF(256) with the QR primitive polynomial x⁸ + x⁴ + x³ + x² + 1 (0x11d). */
export function gfMultiply(a: number, b: number): number {
  let result = 0;
  let left = a;
  let right = b;
  while (right > 0) {
    if ((right & 1) !== 0) result ^= left;
    left = (left << 1) ^ ((left >>> 7) * 0x11d);
    right >>>= 1;
  }
  return result & 0xff;
}

/** Generator polynomial of the given degree, highest power first, without the leading 1. */
export function generatorPolynomial(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let step = 0; step < degree; step += 1) {
    for (let index = 0; index < degree; index += 1) {
      result[index] = gfMultiply(result[index] ?? 0, root) ^ (result[index + 1] ?? 0);
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

/** The remainder of the data polynomial divided by the generator: the block's ECC codewords. */
export function reedSolomonRemainder(data: readonly number[], degree: number): number[] {
  const generator = generatorPolynomial(degree);
  const remainder = new Array<number>(degree).fill(0);
  for (const byte of data) {
    const factor = byte ^ (remainder.shift() ?? 0);
    remainder.push(0);
    for (let index = 0; index < degree; index += 1) {
      remainder[index] = (remainder[index] ?? 0) ^ gfMultiply(generator[index] ?? 0, factor);
    }
  }
  return remainder;
}

/** Split into blocks, add ECC to each, then interleave them the way the standard prescribes. */
export function interleaveBlocks(data: readonly number[], version: number, ecc: QrEcc): number[] {
  const blockCount = tableValue(ECC_BLOCKS[ecc], version, 'block count');
  const eccLength = tableValue(ECC_CODEWORDS_PER_BLOCK[ecc], version, 'ECC codewords');
  const total = qrTotalCodewords(version);
  const shortBlockLength = Math.floor(total / blockCount);
  const shortBlockCount = blockCount - (total % blockCount);

  // Every block is padded to the same length with a placeholder, so the columns line up; the
  // placeholder position is then skipped while interleaving (ISO/IEC 18004 §8.6).
  const blocks: number[][] = [];
  let offset = 0;
  for (let index = 0; index < blockCount; index += 1) {
    const length = shortBlockLength - eccLength + (index < shortBlockCount ? 0 : 1);
    const chunk = data.slice(offset, offset + length);
    offset += length;
    const check = reedSolomonRemainder(chunk, eccLength);
    blocks.push(index < shortBlockCount ? [...chunk, 0, ...check] : [...chunk, ...check]);
  }

  const result: number[] = [];
  for (let index = 0; index <= shortBlockLength; index += 1) {
    blocks.forEach((block, blockIndex) => {
      if (index === shortBlockLength - eccLength && blockIndex < shortBlockCount) return;
      const value = block[index];
      if (value !== undefined) result.push(value);
    });
  }
  return result;
}

// ---- Module placement --------------------------------------------------------------------------------
function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const size = version * 4 + 17;
  // Version 32 is the one place the general formula disagrees with the standard's table.
  const step = version === 32 ? 26 : Math.ceil((size - 13) / (count * 2 - 2)) * 2;
  const positions = [6];
  for (let pos = size - 7; positions.length < count; pos -= step) positions.splice(1, 0, pos);
  return positions;
}

function bit(value: number, index: number): boolean {
  return ((value >>> index) & 1) !== 0;
}

class Matrix {
  readonly version: number;
  readonly ecc: QrEcc;
  readonly size: number;
  readonly modules: boolean[][];
  private readonly reserved: boolean[][];

  constructor(version: number, ecc: QrEcc) {
    this.version = version;
    this.ecc = ecc;
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.reserved = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.drawFunctionPatterns();
  }

  private set(x: number, y: number, dark: boolean): void {
    const row = this.modules[y];
    const mask = this.reserved[y];
    if (row === undefined || mask === undefined || x < 0 || x >= this.size) return;
    row[x] = dark;
    mask[x] = true;
  }

  private isReserved(x: number, y: number): boolean {
    return this.reserved[y]?.[x] ?? true;
  }

  private drawFinder(centerX: number, centerY: number): void {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) {
          this.set(x, y, distance !== 2 && distance !== 4);
        }
      }
    }
  }

  private drawAlignment(centerX: number, centerY: number): void {
    for (let dy = -2; dy <= 2; dy += 1) {
      for (let dx = -2; dx <= 2; dx += 1) {
        this.set(centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  private drawFunctionPatterns(): void {
    for (let index = 0; index < this.size; index += 1) {
      this.set(6, index, index % 2 === 0);
      this.set(index, 6, index % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(this.size - 4, 3);
    this.drawFinder(3, this.size - 4);

    const positions = alignmentPositions(this.version);
    const last = positions.length - 1;
    positions.forEach((y, row) => {
      positions.forEach((x, column) => {
        const corner =
          (row === 0 && column === 0) || (row === 0 && column === last) || (row === last && column === 0);
        if (!corner) this.drawAlignment(x, y);
      });
    });

    this.drawFormatBits(0); // reserves the area; rewritten once the mask is chosen
    this.drawVersionBits();
  }

  drawFormatBits(mask: number): void {
    const data = (ECC_FORMAT_BITS[this.ecc] << 3) | mask;
    let remainder = data;
    for (let index = 0; index < 10; index += 1) {
      remainder = (remainder << 1) ^ ((remainder >>> 9) * 0x537);
    }
    const bits = (((data << 10) | remainder) ^ 0x5412) & 0x7fff;

    for (let index = 0; index <= 5; index += 1) this.set(8, index, bit(bits, index));
    this.set(8, 7, bit(bits, 6));
    this.set(8, 8, bit(bits, 7));
    this.set(7, 8, bit(bits, 8));
    for (let index = 9; index < 15; index += 1) this.set(14 - index, 8, bit(bits, index));

    for (let index = 0; index < 8; index += 1) this.set(this.size - 1 - index, 8, bit(bits, index));
    for (let index = 8; index < 15; index += 1) this.set(8, this.size - 15 + index, bit(bits, index));
    this.set(8, this.size - 8, true); // the always-dark module
  }

  private drawVersionBits(): void {
    if (this.version < 7) return;
    let remainder = this.version;
    for (let index = 0; index < 12; index += 1) {
      remainder = (remainder << 1) ^ ((remainder >>> 11) * 0x1f25);
    }
    const bits = (this.version << 12) | remainder;
    for (let index = 0; index < 18; index += 1) {
      const dark = bit(bits, index);
      const a = this.size - 11 + (index % 3);
      const b = Math.floor(index / 3);
      this.set(a, b, dark);
      this.set(b, a, dark);
    }
  }

  /** Zigzag placement of the codeword stream over every non-function module. */
  drawCodewords(codewords: readonly number[]): void {
    let index = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      const column = right === 6 ? 5 : right;
      for (let vertical = 0; vertical < this.size; vertical += 1) {
        for (let offset = 0; offset < 2; offset += 1) {
          const x = column - offset;
          const upward = ((column + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vertical : vertical;
          if (this.isReserved(x, y) || index >= codewords.length * 8) continue;
          const byte = codewords[index >>> 3] ?? 0;
          const row = this.modules[y];
          if (row !== undefined) row[x] = bit(byte, 7 - (index & 7));
          index += 1;
        }
      }
    }
  }

  /** XOR the data modules with a mask pattern; applying it twice restores the matrix. */
  applyMask(mask: number): void {
    for (let y = 0; y < this.size; y += 1) {
      for (let x = 0; x < this.size; x += 1) {
        if (this.isReserved(x, y)) continue;
        const row = this.modules[y];
        if (row !== undefined) row[x] = (row[x] ?? false) !== maskCondition(mask, x, y);
      }
    }
  }

  dark(x: number, y: number): boolean {
    return this.modules[y]?.[x] ?? false;
  }
}

function maskCondition(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

const FINDER_RUN = [true, false, true, true, true, false, true] as const;

function hasFinderLike(line: readonly boolean[], start: number): boolean {
  for (let index = 0; index < FINDER_RUN.length; index += 1) {
    if (line[start + index] !== FINDER_RUN[index]) return false;
  }
  const before = line.slice(Math.max(0, start - 4), start);
  const after = line.slice(start + 7, start + 11);
  const clear = (run: readonly boolean[]): boolean => run.length === 4 && run.every((module) => !module);
  return clear(before) || clear(after);
}

/** The four penalty rules of §8.8.2; the mask with the lowest score wins. */
function penaltyScore(matrix: Matrix): number {
  const size = matrix.size;
  let score = 0;
  const lines: boolean[][] = [];
  for (let y = 0; y < size; y += 1) {
    lines.push(Array.from({ length: size }, (_, x) => matrix.dark(x, y)));
  }
  for (let x = 0; x < size; x += 1) {
    lines.push(Array.from({ length: size }, (_, y) => matrix.dark(x, y)));
  }

  for (const line of lines) {
    let runLength = 1;
    for (let index = 1; index <= line.length; index += 1) {
      if (index < line.length && line[index] === line[index - 1]) {
        runLength += 1;
        continue;
      }
      if (runLength >= 5) score += 3 + (runLength - 5);
      runLength = 1;
    }
    for (let start = 0; start + 7 <= line.length; start += 1) {
      if (hasFinderLike(line, start)) score += 40;
    }
  }

  let dark = 0;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      if (matrix.dark(x, y)) dark += 1;
      if (x + 1 < size && y + 1 < size) {
        const value = matrix.dark(x, y);
        if (
          value === matrix.dark(x + 1, y) &&
          value === matrix.dark(x, y + 1) &&
          value === matrix.dark(x + 1, y + 1)
        ) {
          score += 3;
        }
      }
    }
  }
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return score;
}

// ---- Public API --------------------------------------------------------------------------------------
/** Encode `text` (UTF-8, byte mode) into the smallest version that fits. */
export function encodeQr(text: string, options: QrOptions = {}): QrCode {
  const ecc = options.ecc ?? 'M';
  const minVersion = Math.max(QR_MIN_VERSION, options.minVersion ?? QR_MIN_VERSION);
  const maxVersion = Math.min(QR_MAX_VERSION, options.maxVersion ?? QR_MAX_VERSION);
  const bytes = new TextEncoder().encode(text);

  let version = minVersion;
  while (version <= maxVersion && bytes.length > qrCapacity(version, ecc)) version += 1;
  if (version > maxVersion) {
    throw new Error(
      `QR: ${String(bytes.length)} bytes exceed the largest supported code (version ${String(maxVersion)}, level ${ecc})`,
    );
  }

  const codewords = interleaveBlocks(encodeDataCodewords(bytes, version, ecc), version, ecc);
  const matrix = new Matrix(version, ecc);
  matrix.drawCodewords(codewords);

  let bestMask = 0;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask += 1) {
    matrix.applyMask(mask);
    matrix.drawFormatBits(mask);
    const score = penaltyScore(matrix);
    if (score < bestScore) {
      bestScore = score;
      bestMask = mask;
    }
    matrix.applyMask(mask);
  }
  matrix.applyMask(bestMask);
  matrix.drawFormatBits(bestMask);

  return { version, ecc, mask: bestMask, size: matrix.size, modules: matrix.modules };
}

/** SVG path data for the dark modules, one unit per module, horizontal runs merged. */
export function qrPath(code: QrCode): string {
  const parts: string[] = [];
  for (let y = 0; y < code.size; y += 1) {
    let x = 0;
    while (x < code.size) {
      if (code.modules[y]?.[x] !== true) {
        x += 1;
        continue;
      }
      let run = 1;
      while (code.modules[y]?.[x + run] === true) run += 1;
      parts.push(`M${String(x)} ${String(y)}h${String(run)}v1h-${String(run)}z`);
      x += run;
    }
  }
  return parts.join('');
}

export interface QrSvgOptions extends QrOptions {
  /** Quiet zone in modules; the standard asks for 4. */
  margin?: number;
}

/**
 * A standalone `<svg>` string. The React shell renders the same path itself; this exists for tests
 * and for anything that needs the markup as text.
 */
export function qrSvg(text: string, options: QrSvgOptions = {}): string {
  const code = encodeQr(text, options);
  const margin = options.margin ?? 4;
  const extent = code.size + margin * 2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(extent)} ${String(extent)}" shape-rendering="crispEdges">` +
    `<rect width="${String(extent)}" height="${String(extent)}" fill="#ffffff"/>` +
    `<g transform="translate(${String(margin)} ${String(margin)})"><path d="${qrPath(code)}" fill="#000000"/></g>` +
    `</svg>`
  );
}
