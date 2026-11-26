import { expect, test } from 'vitest';

import { defaultPermanentSources, SOURCE_LABELS } from './defaults';
import { BUILTIN_PERMANENT_SOURCES } from './schema';

test('every built-in permanent source has one label, and the default rows are named from it', () => {
  for (const builtin of BUILTIN_PERMANENT_SOURCES) {
    expect(SOURCE_LABELS[builtin]).not.toBe('');
  }
  for (const row of defaultPermanentSources()) {
    expect(row.builtin).toBeDefined();
    if (row.builtin !== undefined) expect(row.name).toBe(SOURCE_LABELS[row.builtin]);
  }
});

test('the switches that are not permanent rows are named in the same table', () => {
  expect(SOURCE_LABELS.talents).toBe('Talents');
  expect(SOURCE_LABELS.dragon).toBe('Dragon');
});
