/** **At most one call a frame** (W18 P4): the latest arguments win, `flush` applies now, `drop` forgets. */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { frameBatch } from './frameBatch';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('many pushes in one frame apply once, with the latest arguments', () => {
  const apply = vi.fn();
  const batch = frameBatch(apply);
  for (let done = 1; done <= 30; done += 1) batch.push(done, 30);
  expect(apply).not.toHaveBeenCalled();
  vi.advanceTimersByTime(20);
  expect(apply).toHaveBeenCalledTimes(1);
  expect(apply).toHaveBeenCalledWith(30, 30);
  batch.push(31, 31);
  vi.advanceTimersByTime(20);
  expect(apply).toHaveBeenCalledTimes(2);
});

test('flush applies a pending call now and once', () => {
  const apply = vi.fn();
  const batch = frameBatch(apply);
  batch.push(3, 30);
  batch.flush();
  expect(apply).toHaveBeenCalledWith(3, 30);
  vi.advanceTimersByTime(20);
  batch.flush();
  expect(apply).toHaveBeenCalledTimes(1);
});

test('drop forgets a pending call', () => {
  const apply = vi.fn();
  const batch = frameBatch(apply);
  batch.push(3, 30);
  batch.drop();
  vi.advanceTimersByTime(20);
  expect(apply).not.toHaveBeenCalled();
});
