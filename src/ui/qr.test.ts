import { describe, expect, test } from 'vitest';

import {
  encodeDataCodewords,
  encodeQr,
  generatorPolynomial,
  gfMultiply,
  interleaveBlocks,
  qrCapacity,
  qrPath,
  qrSvg,
  qrTotalCodewords,
  reedSolomonRemainder,
  QR_MAX_VERSION,
  type QrCode,
  type QrEcc,
} from './qr';

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);

/** α^exponent in GF(256). */
function gfPow(exponent: number): number {
  let value = 1;
  for (let index = 0; index < exponent; index += 1) value = gfMultiply(value, 2);
  return value;
}

/** Horner evaluation of a codeword polynomial (highest power first). */
function evaluate(codeword: readonly number[], x: number): number {
  let value = 0;
  for (const byte of codeword) value = gfMultiply(value, x) ^ byte;
  return value;
}

describe('capacity tables', () => {
  // Published byte-mode capacities (ISO/IEC 18004 table 7): the cheapest possible check that the
  // ECC block tables are transcribed correctly.
  test.each([
    [1, 'L', 17],
    [1, 'M', 14],
    [10, 'M', 213],
    [25, 'L', 1273],
    [40, 'L', 2953],
    [40, 'M', 2331],
  ] as [number, QrEcc, number][])('version %i level %s holds %i bytes', (version, ecc, expected) => {
    expect(qrCapacity(version, ecc)).toBe(expected);
  });
});

describe('data codewords', () => {
  test('byte mode writes the mode, the length, the payload and the pad bytes', () => {
    const codewords = encodeDataCodewords(bytes('hello'), 1, 'L');
    // 0100 | 00000101 | "hello" | 0000 terminator, then the standard EC/11 padding.
    expect(codewords.slice(0, 7)).toEqual([0x40, 0x56, 0x86, 0x56, 0xc6, 0xc6, 0xf0]);
    expect(codewords.length).toBe(19);
    expect(codewords.slice(7, 11)).toEqual([0xec, 0x11, 0xec, 0x11]);
  });

  test('refuses a payload that does not fit the version', () => {
    expect(() => encodeDataCodewords(bytes('x'.repeat(18)), 1, 'L')).toThrow(/do not fit/);
  });
});

describe('reed-solomon', () => {
  test('the degree-7 generator polynomial matches the standard', () => {
    // g(x) = ∏ (x − α^i): the published table lists the exponents 87, 229, 146, 149, 238, 102, 21.
    const expected = [87, 229, 146, 149, 238, 102, 21].map(gfPow);
    expect(generatorPolynomial(7)).toEqual(expected);
  });

  test.each([7, 10, 26, 30])('a codeword with %i check bytes has zero syndromes', (degree) => {
    const data = Array.from({ length: 40 }, (_, index) => (index * 37 + 11) % 256);
    const codeword = [...data, ...reedSolomonRemainder(data, degree)];
    for (let root = 0; root < degree; root += 1) {
      expect(evaluate(codeword, gfPow(root))).toBe(0);
    }
  });

  test('a single corrupted byte breaks the syndromes (the check is not vacuous)', () => {
    const data = [1, 2, 3, 4, 5];
    const codeword = [...data, ...reedSolomonRemainder(data, 7)];
    codeword[2] = (codeword[2] ?? 0) ^ 0x5a;
    const syndromes = Array.from({ length: 7 }, (_, root) => evaluate(codeword, gfPow(root)));
    expect(syndromes.some((value) => value !== 0)).toBe(true);
  });
});

describe('block interleaving', () => {
  test.each([1, 5, 7, 13, 25, 40])('version %i fills the symbol and keeps every data codeword', (version) => {
    for (const ecc of ['L', 'M'] as QrEcc[]) {
      const payload = Array.from({ length: qrCapacity(version, ecc) }, (_, index) => index % 251);
      const data = encodeDataCodewords(new Uint8Array(payload), version, ecc);
      const codewords = interleaveBlocks(data, version, ecc);
      expect(codewords.length).toBe(qrTotalCodewords(version));

      const counts = new Map<number, number>();
      for (const value of codewords) counts.set(value, (counts.get(value) ?? 0) + 1);
      for (const value of data) {
        const left = counts.get(value) ?? 0;
        expect(left).toBeGreaterThan(0);
        counts.set(value, left - 1);
      }
    }
  });
});

// ---- Matrix ------------------------------------------------------------------------------------------
function isFinder(code: QrCode, originX: number, originY: number): boolean {
  const expected = [
    [1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1],
  ];
  return expected.every((row, y) =>
    row.every((value, x) => (code.modules[originY + y]?.[originX + x] ?? false) === (value === 1)),
  );
}

describe('encodeQr', () => {
  test('picks the smallest version that fits and sizes the matrix accordingly', () => {
    const small = encodeQr('pyrrhic', { ecc: 'M' });
    expect(small.version).toBe(1);
    expect(small.size).toBe(21);
    expect(small.modules.length).toBe(21);
    expect(small.modules.every((row) => row.length === 21)).toBe(true);

    const bigger = encodeQr('x'.repeat(qrCapacity(1, 'M') + 1), { ecc: 'M' });
    expect(bigger.version).toBe(2);
    expect(bigger.size).toBe(25);
  });

  test('draws the three finder patterns and the timing patterns', () => {
    const code = encodeQr('https://example.invalid/#c=abcdef', { ecc: 'L' });
    expect(isFinder(code, 0, 0)).toBe(true);
    expect(isFinder(code, code.size - 7, 0)).toBe(true);
    expect(isFinder(code, 0, code.size - 7)).toBe(true);
    for (let index = 8; index < code.size - 8; index += 1) {
      expect(code.modules[6]?.[index]).toBe(index % 2 === 0);
      expect(code.modules[index]?.[6]).toBe(index % 2 === 0);
    }
    // The module next to the bottom-left finder is dark in every valid symbol.
    expect(code.modules[code.size - 8]?.[8]).toBe(true);
  });

  test('handles a large payload at every supported version', () => {
    const code = encodeQr('a'.repeat(2000), { ecc: 'L' });
    expect(code.version).toBeGreaterThan(25);
    expect(code.version).toBeLessThanOrEqual(QR_MAX_VERSION);
    expect(code.size).toBe(code.version * 4 + 17);
    expect(isFinder(code, 0, 0)).toBe(true);
  });

  test('encodes non-ASCII as UTF-8 bytes', () => {
    const code = encodeQr('mercenaires épiques ⚔');
    expect(code.version).toBeGreaterThanOrEqual(1);
    expect(isFinder(code, 0, 0)).toBe(true);
  });

  test('refuses a payload larger than the largest code', () => {
    expect(() => encodeQr('x'.repeat(qrCapacity(QR_MAX_VERSION, 'L') + 1), { ecc: 'L' })).toThrow(
      /exceed the largest supported code/,
    );
  });

  test('the same text always produces the same matrix', () => {
    expect(encodeQr('stable')).toEqual(encodeQr('stable'));
  });
});

/** Format information strings of ISO/IEC 18004 table 25, levels L and M, masks 0–7. */
const FORMAT_STRINGS: Record<QrEcc, readonly string[]> = {
  L: [
    '111011111000100',
    '111001011110011',
    '111110110101010',
    '111100010011101',
    '110011000101111',
    '110001100011000',
    '110110001000001',
    '110100101110110',
  ],
  M: [
    '101010000010010',
    '101000100100101',
    '101111001111100',
    '101101101001011',
    '100010111111001',
    '100000011001110',
    '100111110010111',
    '100101010100000',
  ],
};

/** Where bit `index` of the format information lives, first copy (ISO/IEC 18004 §8.9). */
function formatPosition(index: number): [number, number] {
  if (index <= 5) return [8, index];
  if (index === 6) return [8, 7];
  if (index === 7) return [8, 8];
  if (index === 8) return [7, 8];
  return [14 - index, 8];
}

describe('format information', () => {
  test.each(['L', 'M'] as QrEcc[])('level %s writes the published bits for the chosen mask', (ecc) => {
    const code = encodeQr('format bits', { ecc });
    const expected = FORMAT_STRINGS[ecc][code.mask];
    expect(expected).toBeDefined();
    for (let index = 0; index < 15; index += 1) {
      const [x, y] = formatPosition(index);
      // The published string is written most-significant bit first.
      const bit = expected?.[14 - index] === '1';
      expect(code.modules[y]?.[x]).toBe(bit);
    }
  });
});

describe('svg output', () => {
  test('path covers every dark module as horizontal runs', () => {
    const code = encodeQr('run merging', { ecc: 'L' });
    const path = qrPath(code);
    const covered = [...path.matchAll(/h(\d+)v1/g)].reduce(
      (total, match) => total + Number(match[1] ?? 0),
      0,
    );
    const dark = code.modules.flat().filter(Boolean).length;
    expect(covered).toBe(dark);
  });

  test('svg carries the quiet zone and a single path', () => {
    const svg = qrSvg('quiet zone', { ecc: 'L', margin: 4 });
    const code = encodeQr('quiet zone', { ecc: 'L' });
    const extent = code.size + 8;
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain(`viewBox="0 0 ${String(extent)} ${String(extent)}"`);
    expect(svg.match(/<path /g)?.length).toBe(1);
    expect(svg.endsWith('</svg>')).toBe(true);
  });
});
