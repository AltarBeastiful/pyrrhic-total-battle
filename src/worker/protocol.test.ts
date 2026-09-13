import { describe, expect, test } from 'vitest';

import {
  errorPayload,
  isCalcRequestMessage,
  isCalcResponseMessage,
  nextJobId,
  type CalcRequestMessage,
  type CalcResponseMessage,
} from './protocol';

const stackRequest = { units: [], caps: {}, housing: { leadership: 1, authority: 0, dominance: 0 } };

describe('job ids', () => {
  test('are unique and carry the prefix', () => {
    const first = nextJobId('stack');
    const second = nextJobId('stack');
    expect(first).not.toBe(second);
    expect(first.startsWith('stack-')).toBe(true);
  });
});

describe('errorPayload', () => {
  test('flattens anything thrown to a message', () => {
    expect(errorPayload(new Error('boom'))).toEqual({ message: 'boom' });
    expect(errorPayload('boom')).toEqual({ message: 'boom' });
    expect(errorPayload(42)).toEqual({ message: 'Calculation failed.' });
  });
});

describe('request guard', () => {
  test('accepts the four request kinds', () => {
    expect(isCalcRequestMessage({ kind: 'stack', id: 'a', request: stackRequest })).toBe(true);
    expect(isCalcRequestMessage({ kind: 'search', id: 'b', request: { request: stackRequest } })).toBe(true);
    expect(
      isCalcRequestMessage({
        kind: 'complete',
        id: 'd',
        request: { request: stackRequest, campaign: { marches: 10 } },
      }),
    ).toBe(true);
    expect(isCalcRequestMessage({ kind: 'cancel', id: 'c' })).toBe(true);
  });

  test('rejects foreign messages', () => {
    expect(isCalcRequestMessage(null)).toBe(false);
    expect(isCalcRequestMessage({ kind: 'stack' })).toBe(false);
    expect(isCalcRequestMessage({ kind: 'stack', id: '', request: stackRequest })).toBe(false);
    expect(isCalcRequestMessage({ kind: 'stack', id: 'a' })).toBe(false);
    expect(isCalcRequestMessage({ kind: 'vite:hmr', id: 'a' })).toBe(false);
  });
});

describe('response guard', () => {
  test('accepts every response kind', () => {
    expect(isCalcResponseMessage({ kind: 'stack', id: 'a', result: {}, summary: {} })).toBe(true);
    expect(isCalcResponseMessage({ kind: 'progress', id: 'a', progress: {} })).toBe(true);
    expect(isCalcResponseMessage({ kind: 'search', id: 'a', result: {} })).toBe(true);
    expect(isCalcResponseMessage({ kind: 'complete', id: 'a', result: {} })).toBe(true);
    expect(isCalcResponseMessage({ kind: 'cancelled', id: 'a' })).toBe(true);
    expect(isCalcResponseMessage({ kind: 'error', id: 'a', error: { message: 'no' } })).toBe(true);
  });

  test('rejects malformed responses', () => {
    expect(isCalcResponseMessage({ kind: 'stack', id: 'a', result: {} })).toBe(false);
    expect(isCalcResponseMessage({ kind: 'error', id: 'a', error: {} })).toBe(false);
    expect(isCalcResponseMessage({ kind: 'unknown', id: 'a' })).toBe(false);
    expect(isCalcResponseMessage('stack')).toBe(false);
  });
});

describe('structured cloning', () => {
  test('a request survives the worker boundary unchanged', () => {
    const message = {
      kind: 'stack',
      id: 'stack-1',
      request: { ...stackRequest, activeEvents: ['ragnarok'] },
    } as unknown as CalcRequestMessage;
    const clone: unknown = structuredClone(message);
    expect(clone).toEqual(message);
    expect(isCalcRequestMessage(clone)).toBe(true);
  });

  test('a response survives the worker boundary unchanged', () => {
    const message = {
      kind: 'stack',
      id: 'stack-1',
      result: { stacks: [{ unitId: 'archer-1', count: 930 }], dropped: [], warnings: [] },
      summary: { stackCount: 1, minDamage: 1, maxDamage: 3, avgDamage: 2 },
    } as unknown as CalcResponseMessage;
    const clone: unknown = structuredClone(message);
    expect(clone).toEqual(message);
    expect(isCalcResponseMessage(clone)).toBe(true);
  });
});
