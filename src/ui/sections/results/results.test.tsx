// @vitest-environment jsdom
/**
 * The March card, by role and by name (design plan §7.5): the recap first, the army as tiles that
 * change the march, the counts to copy with an explicit edit mode, and everything that explains the
 * numbers folded away underneath.
 *
 * The engine runs for real here (the calculation client is the inline one), so every assertion about
 * a count or a figure is an assertion about the engine's own output.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { unitById } from '@/data';
import type { UnitDef } from '@/engine/types';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { LAST_RESULT_KEY, useResultStore } from '@/ui/resultStore';
import { GenerateFab } from '@/ui/shell/GenerateFab';
import type * as WorkerClient from '@/worker/client';

import { amount } from './format';
import { ResultsSection } from './ResultsSection';
import { useRunStore } from './runStore';

// The whole page shares one calculation client; in jsdom it is the same engine, on the main thread.
vi.mock('@/ui/calcClient', async () => {
  const { createInlineClient } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  const client = createInlineClient();
  return { getCalcClient: () => client, disposeCalcClient: () => undefined };
});

const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());

/**
 * The card and the button that fills it. The housing is written to the store rather than typed into
 * the Battle card: what this suite is about is the March, and a second card would only add its own
 * failure modes to every test here.
 */
function Page() {
  return (
    <>
      <ResultsSection />
      <GenerateFab />
    </>
  );
}

/** Change the leadership the march is sized for, the way the Battle card would. */
function setLeadership(leadership: number): void {
  act(() => {
    useStore.getState().updateActiveSetup({ housing: { leadership, authority: 0, dominance: 0 } });
  });
}

beforeEach(() => {
  window.localStorage.clear();
  writeText.mockClear();
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  useStore.getState().updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 0 } });
});

afterEach(() => {
  cleanup();
});

const lastResult = () => useResultStore.getState().last;
const setup = () => selectActiveSetup(useStore.getState());
const profile = () => selectActiveProfile(useStore.getState());

async function generate(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: /^Generate march/ }));
  await waitFor(() => {
    expect(lastResult()).not.toBeNull();
  });
}

/** The unit of the nth generated stack, with the count it was given. */
function stackAt(index = 0): { unit: UnitDef; count: number } {
  const stack = lastResult()?.result.stacks[index];
  if (!stack) throw new Error('no stack was generated');
  const unit = unitById(stack.unitId);
  if (!unit) throw new Error(`${stack.unitId} is not in the tables`);
  return { unit, count: stack.count };
}

/** The accessible name of a marching tile, the way `MarchTiles` writes it. */
function marchingTile(unit: UnitDef, count: number): HTMLElement {
  return screen.getByRole('button', {
    name: `${unit.name}, tier ${String(unit.tier)}, ${amount(count)} in the march — leave out`,
  });
}

function leftOutTile(unit: UnitDef): HTMLElement {
  return screen.getByRole('button', {
    name: `${unit.name}, tier ${String(unit.tier)}, left out — keep in march`,
  });
}

/** The table shape of the counts; the stacked shape carries the same rows under 36 rem. */
function countsTable(): HTMLElement {
  return screen.getByRole('table', { name: /in the order the stacks fall/ });
}

test('the recap comes first, then the tiles, then the counts', async () => {
  render(<Page />);
  await generate();

  const summary = lastResult()?.summary;
  const recap = screen.getByText('Expected damage');
  const tiles = screen.getByRole('group', { name: 'Guardsmen in the march' });
  const counts = screen.getByRole('heading', { name: 'Counts to copy' });

  const follows = (first: Element, second: Element): boolean =>
    (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  expect(follows(recap, tiles)).toBe(true);
  expect(follows(tiles, counts)).toBe(true);

  // The figures are the summary's, not a rounding of it.
  expect(screen.getByText(amount(summary?.avgDamage ?? 0))).toBeTruthy();
  expect(screen.getByText('Damage if the monster strikes first')).toBeTruthy();
  expect(screen.getByText('Value per silver')).toBeTruthy();
});

test('the recap says which way every figure moved since the previous run', async () => {
  render(<Page />);
  await generate();
  expect(useRunStore.getState().previousSummary).toBeNull();

  const before = lastResult()?.summary.avgDamage ?? 0;
  setLeadership(2000);
  await generate();
  await waitFor(() => {
    expect(lastResult()?.result.pools.leadership.capacity).toBe(2000);
  });

  expect(useRunStore.getState().previousSummary?.avgDamage).toBe(before);
  // Half the housing is less damage, and the recap says so in its own words.
  expect(screen.getAllByText('worse').length).toBeGreaterThan(0);
});

test('a tile carries its stack count and a tap leaves that type out', async () => {
  render(<Page />);
  await generate();
  const { unit, count } = stackAt();

  const tile = marchingTile(unit, count);
  expect(tile.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(tile);

  await waitFor(() => {
    expect(profile()?.troops.excludedUnitIds).toContain(unit.id);
  });
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(false);
  });
  // The same tile is still there, dimmed, offering the other half of the gesture.
  expect(leftOutTile(unit).getAttribute('aria-pressed')).toBe('false');
});

test('a tap on a dimmed tile keeps that type in the march for good', async () => {
  // 20 leadership is enough for nine of the ten types the default profile owns: one is left out.
  useStore.getState().updateActiveSetup({ housing: { leadership: 20, authority: 0, dominance: 0 } });
  render(<Page />);
  await generate();

  const leftOut = lastResult()?.result.dropped[0]?.unitId ?? '';
  const unit = unitById(leftOut);
  if (!unit) throw new Error('nothing was left out');

  fireEvent.click(leftOutTile(unit));

  await waitFor(() => {
    expect(setup()?.pinnedUnitIds).toContain(unit.id);
  });
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(true);
  });
});

test('the counts are a table in kill order, and a tap on one copies it', async () => {
  render(<Page />);
  await generate();
  const { unit, count } = stackAt();

  const rows = within(countsTable()).getAllByRole('row');
  // One header row plus one row per stack.
  expect(rows).toHaveLength((lastResult()?.result.stacks.length ?? 0) + 1);

  fireEvent.click(within(countsTable()).getByRole('button', { name: `Copy ${amount(count)}, ${unit.name}` }));
  expect(writeText).toHaveBeenCalledWith(String(count));
});

test('Copy all counts writes one line per stack, in the game’s own shorthand', async () => {
  render(<Page />);
  await generate();

  fireEvent.click(screen.getByRole('button', { name: 'Copy all counts' }));

  const expected = (lastResult()?.result.stacks ?? [])
    .map((stack) => `${unitById(stack.unitId)?.label ?? stack.unitId} ${String(stack.count)}`)
    .join('\n');
  expect(writeText).toHaveBeenCalledWith(expected);
  expect(screen.getAllByRole('status').some((node) => node.textContent === 'Copied')).toBe(true);
});

test('edit counts turns every count into a stepper, and Undo puts the generated ones back', async () => {
  render(<Page />);
  await generate();
  const { unit, count } = stackAt();
  const before = lastResult()?.summary.avgDamage ?? 0;

  expect(screen.queryAllByLabelText(`${unit.name} count`)).toHaveLength(0);
  expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();

  fireEvent.click(screen.getByRole('button', { name: 'Edit counts' }));
  const stepper = within(countsTable()).getByLabelText(`${unit.name} count`);
  expect(stepper).toHaveProperty('value', amount(count));

  fireEvent.click(within(countsTable()).getByRole('button', { name: `Increase ${unit.name} count` }));

  // The march on screen is recomputed on the hand-typed counts; the generated result is untouched.
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
  });
  expect(lastResult()?.summary.avgDamage).toBe(before);
  expect(useResultStore.getState().manualCounts[unit.id]).toBe(count + 1);

  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(useResultStore.getState().manualCounts).toEqual({});
  expect(within(countsTable()).getByLabelText(`${unit.name} count`)).toHaveProperty('value', amount(count));
  // Three battles are played out here (the run, the edit, the undo): a busy machine needs the room.
}, 15_000);

test('the details are folded away until they are asked for', async () => {
  render(<Page />);
  await generate();

  // The disclosure's own name carries its summary; the per-row "Details: …" buttons are others.
  const details = screen.getByRole('button', { name: /^DetailsThe battle story/ });
  expect(details.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByRole('heading', { name: 'Battle story' })).toBeNull();

  fireEvent.click(details);
  await waitFor(() => {
    expect(details.getAttribute('aria-expanded')).toBe('true');
  });
  expect(screen.getByRole('heading', { name: 'Battle story' })).toBeTruthy();
  expect(screen.getByRole('radiogroup', { name: 'Who strikes first' })).toBeTruthy();
  expect(screen.getByRole('list', { name: /Total HP per stack/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Raw journal/ }).getAttribute('aria-expanded')).toBe('false');
});

test('the unit sheet opens from a row and says what the stack does', async () => {
  render(<Page />);
  await generate();
  const { unit, count } = stackAt();

  fireEvent.click(within(countsTable()).getByRole('button', { name: `Details: ${unit.name}` }));

  const sheet = await screen.findByRole('dialog', { name: unit.name });
  expect(within(sheet).getByText('In this march')).toBeTruthy();
  expect(within(sheet).getByText('Why this size')).toBeTruthy();
  expect(within(sheet).getByText(new RegExp(`^${amount(count)} ${unit.name} land`))).toBeTruthy();
  expect(within(sheet).getByRole('meter', { name: 'Health, with bonuses' })).toBeTruthy();
  expect(within(sheet).getByRole('button', { name: 'Keep in march' })).toBeTruthy();
  expect(within(sheet).getByRole('button', { name: 'Leave out' })).toBeTruthy();
});

test('leaving a type out from its sheet excludes it and generates again', async () => {
  render(<Page />);
  await generate();
  const { unit } = stackAt();

  fireEvent.click(within(countsTable()).getByRole('button', { name: `Details: ${unit.name}` }));
  const sheet = await screen.findByRole('dialog', { name: unit.name });
  fireEvent.click(within(sheet).getByRole('button', { name: 'Leave out' }));

  await waitFor(() => {
    expect(profile()?.troops.excludedUnitIds).toContain(unit.id);
  });
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(false);
  });
});

test('the last result and its hand edits come back after a reload', async () => {
  const first = render(<Page />);
  await generate();
  const at = lastResult()?.at;
  const { unit, count } = stackAt();

  fireEvent.click(screen.getByRole('button', { name: 'Edit counts' }));
  fireEvent.click(within(countsTable()).getByRole('button', { name: `Increase ${unit.name} count` }));
  await waitFor(() => {
    expect(useResultStore.getState().manualCounts[unit.id]).toBe(count + 1);
  });
  expect(window.localStorage.getItem(LAST_RESULT_KEY)).not.toBeNull();

  // Unmounting stops the subscription, so clearing the store here is the reload, not a user action.
  first.unmount();
  useResultStore.getState().clear();
  expect(window.localStorage.getItem(LAST_RESULT_KEY)).not.toBeNull();

  render(<Page />);
  await waitFor(() => {
    expect(lastResult()?.at).toBe(at);
  });
  expect(screen.getByText(/Generated just now/)).toBeTruthy();
  expect(
    within(countsTable()).getByRole('button', { name: `Copy ${amount(count + 1)}, ${unit.name}` }),
  ).toBeTruthy();
});

test('a cached result belonging to another march is left alone', async () => {
  const first = render(<Page />);
  await generate();
  first.unmount();
  useResultStore.getState().clear();
  useStore.getState().createSetup('Second march');

  render(<Page />);
  expect(lastResult()).toBeNull();
  expect(screen.getByText(/Nothing generated yet/)).toBeTruthy();
});

test('a result older than the profile is flagged as possibly stale', async () => {
  render(<Page />);
  await generate();
  const snapshot = lastResult();
  if (!snapshot) throw new Error('no result');

  act(() => {
    useResultStore.setState({ last: { ...snapshot, at: snapshot.at - 60_000 } });
  });

  expect(screen.getByText(/Generated 1 minute ago/)).toBeTruthy();
  expect(screen.getByText(/may be stale/)).toBeTruthy();
});

test('two saved marches can be compared side by side', async () => {
  render(<Page />);
  await generate();

  const save = async (name: string): Promise<void> => {
    fireEvent.click(screen.getByRole('button', { name: 'Save this march' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('March name'), { target: { value: name } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save this march' }));
  };

  await save('Wide march');
  setLeadership(2000);
  await generate();
  await waitFor(() => {
    expect(lastResult()?.result.pools.leadership.capacity).toBe(2000);
  });
  await save('Small march');

  expect(profile()?.savedStacks).toHaveLength(2);

  // The saved marches are folded away under the card, as a list you go and get.
  fireEvent.click(screen.getByRole('button', { name: /^Saved marches/ }));
  await waitFor(() => {
    expect(screen.getByRole('checkbox', { name: /Wide march/ })).toBeTruthy();
  });
  fireEvent.click(screen.getByRole('checkbox', { name: /Wide march/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Small march/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Compare (2)' }));

  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByRole('columnheader', { name: 'Wide march' })).toBeTruthy();
  expect(within(dialog).getByRole('rowheader', { name: 'Expected damage' })).toBeTruthy();
});
