import { expect, test } from 'vitest';

// Guards the node-environment half of the test setup: the engine, data, share and
// worker layers are plain TypeScript and must run without a DOM.
test('runs in the node environment without a DOM', () => {
  expect(typeof globalThis.document).toBe('undefined');
  expect(1 + 1).toBe(2);
});
