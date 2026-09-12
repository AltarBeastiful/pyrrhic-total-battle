/**
 * JSON export / import (S-04, ADR-0004). The file format is the same per-profile document a sync adapter
 * would push, so "export here, import there" and "sync" stay one code path (investigation 0001).
 *
 *   { schemaVersion, dataVersion, kind: 'profile' | 'stack', payload }
 *
 * Import never overwrites silently: `parseImport` only validates and produces a preview, and the caller
 * asks "add as new / replace / cancel" before calling `applyImport`.
 */
import type { StoreApi } from 'zustand';

import { cloneProfileWithNewIds, CURRENT_DATA_VERSION, uniqueProfileName, uuid } from '../state/defaults';
import { migrateProfile, migrateSavedStack, readSchemaVersion } from '../state/migrations';
import { SCHEMA_VERSION } from '../state/schema';
import type { Profile, SavedStack } from '../state/schema';
import type { StoreState } from '../state/store';

export type ImportKind = 'profile' | 'stack';
export type ImportMode = 'add' | 'replace';

export interface ExportedFile {
  filename: string;
  json: string;
}

export interface ProfilePreview {
  name: string;
  createdAt: number;
  setups: number;
  savedStacks: number;
  mercenaries: number;
  bonusSources: number;
}

export interface StackPreview {
  name: string;
  createdAt: number;
  stacks: number;
  units: number;
  avgDamage: number;
}

export interface ParsedProfileImport {
  kind: 'profile';
  schemaVersion: number;
  dataVersion: number;
  preview: ProfilePreview;
  payload: Profile;
}

export interface ParsedStackImport {
  kind: 'stack';
  schemaVersion: number;
  dataVersion: number;
  preview: StackPreview;
  payload: SavedStack;
}

export type ParsedImport = ParsedProfileImport | ParsedStackImport;

// ---- Export ------------------------------------------------------------------------------------------
/** `My Account #2` → `my-account-2`; always non-empty so the filename stays readable. */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug === '' ? 'profile' : slug;
}

function isoDate(at: Date): string {
  return at.toISOString().slice(0, 10);
}

function fileFor(
  kind: ImportKind,
  name: string,
  dataVersion: number,
  payload: unknown,
  at: Date,
): ExportedFile {
  return {
    filename: `pyrrhic-${slugify(name)}-${isoDate(at)}.json`,
    json: `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, dataVersion, kind, payload }, null, 2)}\n`,
  };
}

export function exportProfileFile(
  profile: Profile,
  dataVersion: number = CURRENT_DATA_VERSION,
  at: Date = new Date(),
): ExportedFile {
  return fileFor('profile', profile.name, dataVersion, profile, at);
}

export function exportStackFile(
  stack: SavedStack,
  dataVersion: number = stack.dataVersion,
  at: Date = new Date(),
): ExportedFile {
  return fileFor('stack', stack.name, dataVersion, stack, at);
}

// ---- Import ------------------------------------------------------------------------------------------
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function profilePreview(profile: Profile): ProfilePreview {
  const { sources } = profile;
  return {
    name: profile.name,
    createdAt: profile.createdAt,
    setups: profile.setups.length,
    savedStacks: profile.savedStacks.length,
    mercenaries: profile.mercenaries.selected.length + profile.mercenaries.custom.length,
    bonusSources:
      sources.permanent.length +
      sources.captains.length +
      sources.equipment.length +
      sources.artifacts.length +
      sources.titles.length +
      sources.custom.length,
  };
}

function stackPreview(stack: SavedStack): StackPreview {
  return {
    name: stack.name,
    createdAt: stack.createdAt,
    stacks: stack.counts.length,
    units: stack.counts.reduce((total, entry) => total + entry.count, 0),
    avgDamage: stack.summary.avgDamage,
  };
}

/**
 * Validate and migrate an exported file. Throws an `Error` with a message meant for the import dialog;
 * it never touches the store.
 */
export function parseImport(json: string): ParsedImport {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('This file is not valid JSON.');
  }
  if (!isPlainObject(raw)) throw new Error('This file does not look like a Pyrrhic export.');

  const kind = raw.kind;
  if (kind !== 'profile' && kind !== 'stack') {
    throw new Error('This file does not look like a Pyrrhic export (unknown "kind").');
  }
  const schemaVersion = readSchemaVersion(raw);
  if (schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `This file was written by a newer version of Pyrrhic (schema ${schemaVersion}); update the app first.`,
    );
  }
  const dataVersion = typeof raw.dataVersion === 'number' ? raw.dataVersion : 0;

  if (kind === 'profile') {
    const payload = migrateProfile(raw.payload, schemaVersion);
    return { kind, schemaVersion, dataVersion, preview: profilePreview(payload), payload };
  }
  const payload = migrateSavedStack(raw.payload, schemaVersion);
  return { kind, schemaVersion, dataVersion, preview: stackPreview(payload), payload };
}

/**
 * Apply a parsed import to the store.
 * - `add`: the payload gets brand-new ids and is appended (a profile becomes the active one, and is
 *   renamed when an existing profile already carries that name).
 * - `replace`: a profile replaces the one with the same id, or the active profile when the id is unknown;
 *   a stack replaces the one with the same id inside the active profile, or is appended.
 *
 * Returns the id of the profile or stack that ended up in the store.
 */
export function applyImport(store: StoreApi<StoreState>, parsed: ParsedImport, mode: ImportMode): string {
  const state = store.getState();
  const { doc } = state;

  if (parsed.kind === 'profile') {
    if (mode === 'add') {
      const copy = cloneProfileWithNewIds(
        parsed.payload,
        doc.deviceId,
        uniqueProfileName(
          parsed.payload.name,
          doc.profiles.map((profile) => profile.name),
        ),
      );
      state.addProfile(copy);
      return copy.id;
    }
    const known = doc.profiles.some((profile) => profile.id === parsed.payload.id);
    const targetId = known ? parsed.payload.id : doc.activeProfileId;
    const { id: _id, rev: _rev, updatedAt: _updatedAt, deviceId: _deviceId, ...rest } = parsed.payload;
    state.updateProfile(targetId, rest);
    state.setActiveProfile(targetId);
    return targetId;
  }

  const stack: SavedStack =
    mode === 'add'
      ? { ...parsed.payload, id: uuid(), rev: 0, updatedAt: Date.now(), deviceId: doc.deviceId }
      : parsed.payload;
  state.upsertSavedStack(stack);
  return stack.id;
}
