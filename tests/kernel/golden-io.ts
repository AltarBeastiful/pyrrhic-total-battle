/**
 * **The golden files' reading and writing**, shared by `golden-capture.test.ts` and `advisor-golden.test.ts`:
 * keys sorted so the JSON text is stable, the non-finite numbers encoded (`JSON.stringify` would write `null`),
 * and the wall-clock fields stripped before anything is compared.
 */
/// <reference types="node" />
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const GOLDEN_DIR = fileURLToPath(new URL('../golden/', import.meta.url));

function goldenFile(name: string): string {
  return `${GOLDEN_DIR}${name}`;
}

/** `JSON.stringify` turns `Infinity`/`-Infinity`/`NaN` into `null`; the seeded pools use all three. */
function encodeNumber(value: number): unknown {
  if (Number.isFinite(value)) return value;
  if (Number.isNaN(value)) return { $num: 'NaN' };
  return { $num: value > 0 ? 'Infinity' : '-Infinity' };
}

function decodeNumber(value: Record<string, unknown>): number {
  return value.$num === 'NaN' ? NaN : value.$num === 'Infinity' ? Infinity : -Infinity;
}

/** Every object's keys sorted, recursively — array order is data and stays; the JSON text is then stable. */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (typeof value === 'number') return encodeNumber(value);
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    out[key] = canonical((value as Record<string, unknown>)[key]);
  }
  return out;
}

/** The other half of `canonical`'s number encoding, on the way back in. */
function decode(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(decode);
  if (value === null || typeof value !== 'object') return value;
  const obj = value as Record<string, unknown>;
  if (typeof obj.$num === 'string' && Object.keys(obj).length === 1) return decodeNumber(obj);
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) out[key] = decode(obj[key]);
  return out;
}

export function readGolden<T>(name: string): T {
  return decode(JSON.parse(readFileSync(goldenFile(name), 'utf8'))) as T;
}

/** The data as its golden file holds it (sorted keys, encoded numbers), for a compare with `readEncoded`. */
export function encoded(data: unknown): unknown {
  return JSON.parse(JSON.stringify(canonical(data))) as unknown;
}

/** A golden file as written, numbers left encoded: the other side of `encoded`. */
export function readEncoded(name: string): unknown {
  return JSON.parse(readFileSync(goldenFile(name), 'utf8')) as unknown;
}

/** Writes the golden file and reports its size, in the gate's own words. */
export function writeGolden(name: string, data: unknown): void {
  mkdirSync(GOLDEN_DIR, { recursive: true });
  const text = `${JSON.stringify(canonical(data), null, 1)}\n`;
  writeFileSync(goldenFile(name), text);
  // eslint-disable-next-line no-console -- the gate's report, run by hand under CAPTURE=1
  console.log(`${name}: ${String(Buffer.byteLength(text, 'utf8'))} bytes`);
}

/** Remove the wall-clock fields (`retype.ms`) wherever they sit — `plan-equivalence`'s own `stripClock`. */
export function stripClock(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripClock);
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key === 'retype' && inner !== null && typeof inner === 'object') {
      const { ms: _ms, ...rest } = inner as Record<string, unknown>;
      out[key] = stripClock(rest);
    } else out[key] = stripClock(inner);
  }
  return out;
}
