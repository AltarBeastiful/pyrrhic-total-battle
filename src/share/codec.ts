/**
 * Share-link codec (S-04, ADR-0005).
 *
 *   https://<host>/#c=<base64url( 0x01 ‖ deflate-raw( UTF-8 JSON ) )>
 *
 * The JSON is `{ k, v, d, p }` — kind, schemaVersion, dataVersion, payload — with default values removed
 * (`stripDefaults`). Nothing is sent anywhere: the fragment never leaves the browser, and decoding never
 * touches stored data (the caller shows the "load shared config" dialog first).
 *
 * `CompressionStream('deflate-raw')` is native in every evergreen browser, Safari ≥ 16.4 and Node ≥ 22,
 * so the codec adds no dependency.
 */
import { battleSetupSchema, savedSummarySchema, SCHEMA_VERSION, stackCountSchema } from '../state/schema';
import type { BattleSetup, Profile, SavedSummary, StackCount } from '../state/schema';
import { CURRENT_DATA_VERSION, SHARE_PROFILE_TEMPLATE, SHARE_SETUP_TEMPLATE } from '../state/defaults';
import { migrateProfile } from '../state/migrations';
import { z } from 'zod';

/** Leading byte of the binary, so the container format can change without breaking old links. */
export const CODEC_VERSION = 0x01;
/** Fragment parameter carrying the code: `#c=…`. */
export const SHARE_PARAM = 'c';

export interface ShareProfilePayload {
  kind: 'profile';
  schemaVersion: number;
  dataVersion: number;
  profile: Profile;
}

export interface ShareBattlePayload {
  kind: 'battle';
  schemaVersion: number;
  dataVersion: number;
  setup: BattleSetup;
  counts: StackCount[];
  summary: SavedSummary | null;
}

export type SharePayload = ShareProfilePayload | ShareBattlePayload;

export interface LinkOptions {
  /** Absolute URL of the app; when omitted only the `#c=…` fragment is returned. */
  baseUrl?: string;
  dataVersion?: number;
}

// ---- Default stripping ------------------------------------------------------------------------------
const OMIT = Symbol('omit');

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, index) => deepEqual(item, b[index]));
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a);
    if (keys.length !== Object.keys(b).length) return false;
    return keys.every((key) => key in b && deepEqual(a[key], b[key]));
  }
  return false;
}

function stripValue(value: unknown, defaults: unknown): unknown | typeof OMIT {
  if (deepEqual(value, defaults)) return OMIT;
  if (isPlainObject(value) && isPlainObject(defaults)) {
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      const stripped = stripValue(child, defaults[key]);
      if (stripped !== OMIT) out[key] = stripped;
    }
    return Object.keys(out).length === 0 ? OMIT : out;
  }
  // Arrays are atomic: an array that differs from the default is sent whole.
  return value;
}

/**
 * Remove everything that equals the corresponding default. Returns `undefined` when the whole value is
 * the default. Assumption (true for schema-validated documents): the value never *omits* a key the
 * defaults object has, because a missing key would be restored to the default rather than to "absent".
 */
export function stripDefaults<T>(value: T, defaults: T): unknown {
  const stripped = stripValue(value, defaults);
  return stripped === OMIT ? undefined : stripped;
}

/** Inverse of `stripDefaults`: deep-merge a stripped payload onto a fresh copy of the defaults. */
export function restoreDefaults<T>(stripped: unknown, defaults: T): T {
  if (stripped === undefined || stripped === null) return structuredClone(defaults);
  if (!isPlainObject(stripped) || !isPlainObject(defaults)) return stripped as T;
  const out: Record<string, unknown> = structuredClone(defaults);
  for (const [key, value] of Object.entries(stripped)) {
    const fallback = defaults[key];
    out[key] = isPlainObject(value) && isPlainObject(fallback) ? restoreDefaults(value, fallback) : value;
  }
  return out as T;
}

// ---- Payload packing ---------------------------------------------------------------------------------
/**
 * Note for future schema versions: a stripped payload can only be restored with the *defaults of its own
 * version*. The current templates are still the right ones at v2, because the only shape change since v1
 * (`BattleSetup.excludedUnitIds`) *added* a field whose default — the empty array — is exactly what a v1
 * setup meant by not having it; a link written at v1 therefore restores unchanged and `migrateProfile`
 * then moves the profile's march exclusions onto its setups. A version that changes an existing default
 * must keep a copy of the older template next to its migration.
 */
function packSetup(setup: BattleSetup): unknown {
  return stripDefaults(setup, SHARE_SETUP_TEMPLATE) ?? {};
}

function unpackSetup(value: unknown): BattleSetup {
  return battleSetupSchema.parse(restoreDefaults(value, SHARE_SETUP_TEMPLATE));
}

/** Saved stacks are not part of a profile link (PLAN §2.1: tiers, mercenaries, bonuses and setups). */
function packProfile(profile: Profile): unknown {
  const withoutChildren = { ...profile, setups: [], savedStacks: [] };
  const stripped = (stripDefaults(withoutChildren, SHARE_PROFILE_TEMPLATE) ?? {}) as Record<string, unknown>;
  return { ...stripped, setups: profile.setups.map(packSetup) };
}

function unpackProfile(value: unknown, schemaVersion: number): Profile {
  const source = isPlainObject(value) ? value : {};
  const { setups, ...rest } = source;
  const restored = restoreDefaults(rest, SHARE_PROFILE_TEMPLATE) as Record<string, unknown>;
  const parsedSetups = (Array.isArray(setups) ? setups : []).map(unpackSetup);
  const profile = migrateProfile({ ...restored, setups: parsedSetups, savedStacks: [] }, schemaVersion);
  if (profile.setups.length === 0) return profile;
  const active = profile.setups.some((setup) => setup.id === profile.activeSetupId);
  return active ? profile : { ...profile, activeSetupId: profile.setups[0]?.id ?? profile.activeSetupId };
}

const wireSchema = z.object({
  k: z.enum(['profile', 'battle']),
  v: z.int().min(0),
  d: z.int().min(0),
  p: z.unknown(),
});

// ---- Binary plumbing ---------------------------------------------------------------------------------
function toStream(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

async function through(bytes: Uint8Array, transform: GenericTransformStream): Promise<Uint8Array> {
  const stream = toStream(bytes).pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const normalized = text.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

// ---- Public API ---------------------------------------------------------------------------------------
export async function encodeShare(payload: SharePayload): Promise<string> {
  const wire =
    payload.kind === 'profile'
      ? { k: 'profile', v: payload.schemaVersion, d: payload.dataVersion, p: packProfile(payload.profile) }
      : {
          k: 'battle',
          v: payload.schemaVersion,
          d: payload.dataVersion,
          p: {
            s: packSetup(payload.setup),
            c: payload.counts,
            ...(payload.summary ? { m: payload.summary } : {}),
          },
        };
  const deflated = await through(
    new TextEncoder().encode(JSON.stringify(wire)),
    new CompressionStream('deflate-raw'),
  );
  const framed = new Uint8Array(deflated.length + 1);
  framed[0] = CODEC_VERSION;
  framed.set(deflated, 1);
  return toBase64Url(framed);
}

/** Accepts a bare code, a `#c=…` fragment or a full URL carrying one. */
export async function decodeShare(fragment: string): Promise<SharePayload> {
  const code = parseLocationHash(fragment) ?? fragment.trim();
  if (code === '') throw new Error('share link: empty payload');
  const bytes = fromBase64Url(code);
  if (bytes.length < 2) throw new Error('share link: payload too short');
  if (bytes[0] !== CODEC_VERSION) {
    throw new Error(`share link: unsupported codec version ${String(bytes[0])}`);
  }
  const json = new TextDecoder().decode(
    await through(bytes.subarray(1), new DecompressionStream('deflate-raw')),
  );
  const wire = wireSchema.parse(JSON.parse(json));
  if (wire.v > SCHEMA_VERSION) {
    throw new Error(`share link: schemaVersion ${wire.v} is newer than this build (${SCHEMA_VERSION})`);
  }
  if (wire.k === 'profile') {
    return {
      kind: 'profile',
      schemaVersion: wire.v,
      dataVersion: wire.d,
      profile: unpackProfile(wire.p, wire.v),
    };
  }
  const body = isPlainObject(wire.p) ? wire.p : {};
  return {
    kind: 'battle',
    schemaVersion: wire.v,
    dataVersion: wire.d,
    setup: unpackSetup(body.s),
    counts: z.array(stackCountSchema).parse(body.c ?? []),
    summary: body.m === undefined ? null : savedSummarySchema.parse(body.m),
  };
}

function withFragment(code: string, baseUrl: string | undefined): string {
  const fragment = `#${SHARE_PARAM}=${code}`;
  if (baseUrl === undefined) return fragment;
  const index = baseUrl.indexOf('#');
  return `${index >= 0 ? baseUrl.slice(0, index) : baseUrl}${fragment}`;
}

/** Whole account: tiers, mercenaries, every bonus source value and the battle setups. */
export async function buildProfileLink(profile: Profile, options: LinkOptions = {}): Promise<string> {
  const code = await encodeShare({
    kind: 'profile',
    schemaVersion: SCHEMA_VERSION,
    dataVersion: options.dataVersion ?? CURRENT_DATA_VERSION,
    profile,
  });
  return withFragment(code, options.baseUrl);
}

/** One march plus its result, small enough to paste in a Discord message (ADR-0005: ≤ 1,500 characters). */
export async function buildBattleLink(
  setup: BattleSetup,
  counts: StackCount[],
  summary: SavedSummary | null = null,
  options: LinkOptions = {},
): Promise<string> {
  const code = await encodeShare({
    kind: 'battle',
    schemaVersion: SCHEMA_VERSION,
    dataVersion: options.dataVersion ?? CURRENT_DATA_VERSION,
    setup,
    counts,
    summary,
  });
  return withFragment(code, options.baseUrl);
}

/** `#c=<code>` → `<code>`; returns null when the fragment carries no share code. */
export function parseLocationHash(hash: string): string | null {
  const index = hash.indexOf('#');
  const raw = index >= 0 ? hash.slice(index + 1) : hash;
  if (raw === '' || !raw.includes('=')) return null;
  return new URLSearchParams(raw).get(SHARE_PARAM);
}
