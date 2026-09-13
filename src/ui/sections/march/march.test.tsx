// @vitest-environment jsdom
/**
 * The March, by role and by name (design plan §7.5): the recap first, the army as tiles that change
 * the march, the counts to copy with an explicit edit mode, and everything that explains the numbers
 * folded away underneath — plus the three contract components the shell renders elsewhere (the
 * quick summary, the recap sheet and Generate).
 *
 * The engine runs for real here (the calculation client is the inline one), so every assertion about
 * a count or a figure is an assertion about the engine's own output.
 */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { unitById } from '@/data';
import type { UnitDef } from '@/engine/types';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit2/testRender';
import { LAST_RESULT_KEY, useResultStore } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import { amount } from './format';
import { MarchGenerateButton } from './MarchGenerateButton';
import { MarchQuickSummary } from './MarchQuickSummary';
import { MarchRecap } from './MarchRecap';
import { MarchSection } from './MarchSection';
import { useRunStore } from './runStore';

// The whole page shares one calculation client; in jsdom it is the same engine, on the main thread.
vi.mock('@/ui/calcClient', async () => {
  const { createInlineClient } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  const client = createInlineClient();
  return { getCalcClient: () => client, disposeCalcClient: () => undefined };
});

const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());

/**
 * The section and the button that fills it. The housing is written to the store rather than typed
 * into the Battle card: what this suite is about is the March, and a second card would only add its
 * own failure modes to every test here.
 */
function Page() {
  return (
    <>
      <MarchGenerateButton />
      <MarchSection />
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
  setLeadership(4100);
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

/** The accessible name of a marching tile, the way `tileLabel` writes it. */
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

/** The stacked shape, which is what the 360 dp March pane draws at any window width. */
function countsList(): HTMLElement {
  return screen.getByRole('list', { name: /in the order the stacks fall/ });
}

test('the recap comes first, then the tiles, then the counts', async () => {
  renderWithTheme(<Page />);
  await generate();

  const recap = screen.getByText('Expected damage');
  const tiles = screen.getByRole('group', { name: 'Guardsmen in the march' });
  const counts = screen.getByRole('heading', { name: 'Counts to copy' });

  const follows = (first: Element, second: Element): boolean =>
    (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  expect(follows(recap, tiles)).toBe(true);
  expect(follows(tiles, counts)).toBe(true);
});

test('the recap is the figures a march is compared by, the expected damage first', async () => {
  renderWithTheme(<Page />);
  await generate();

  const summary = lastResult()?.summary;
  expect(screen.getByText(amount(summary?.avgDamage ?? 0))).toBeTruthy();
  for (const label of [
    'Worst opening',
    'Hits landed',
    'Silver to recover',
    'Gold to recover',
    'Damage per silver',
  ]) {
    expect(screen.getByText(label)).toBeTruthy();
  }
});

test('the recap says which way every figure moved since the previous run', async () => {
  renderWithTheme(<Page />);
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
}, 15_000);

test('the pools say what the march spent, brim to brim', async () => {
  renderWithTheme(<Page />);
  await generate();

  expect(screen.getByText(`${amount(4100)} of ${amount(4100)}`)).toBeTruthy();
});

test('Generate names the state it is in: ready, then stale when the setup moves', async () => {
  renderWithTheme(<Page />);
  const button = screen.getByRole('button', { name: 'Generate march' });
  expect(button.closest('[data-state]')?.getAttribute('data-state')).toBe('ready');

  await generate();
  expect(button.closest('[data-state]')?.getAttribute('data-state')).toBe('ready');

  setLeadership(2000);
  expect(button.closest('[data-state]')?.getAttribute('data-state')).toBe('stale');
});

test('Generate is blocked, and says why, when nothing pays for the march', async () => {
  setLeadership(0);
  renderWithTheme(<Page />);

  const button = screen.getByRole('button', { name: 'Generate march: Add housing first' });
  expect(button.getAttribute('aria-disabled')).toBe('true');
  expect(button.textContent).toContain('Add housing first');
  expect(button.closest('[data-state]')?.getAttribute('data-state')).toBe('blocked');
});

test('the quick summary is one line, and nothing at all before the first run', async () => {
  const onOpen = vi.fn();
  const view = renderWithTheme(<MarchQuickSummary onOpen={onOpen} />);
  expect(screen.getByText('No march yet')).toBeTruthy();
  view.unmount();

  renderWithTheme(<Page />);
  await generate();
  cleanup();

  renderWithTheme(<MarchQuickSummary onOpen={onOpen} />);
  const line = screen.getByRole('button', { name: 'Open the full march summary' });
  // Compact figures, because the line is cut rather than wrapped: "954.5K", "1.7M".
  expect(line.textContent).toMatch(/[\d.]+[KM]/);
  // The cost is a coin and a figure; the coin carries the word a screen reader needs.
  expect(within(line).getByRole('img', { name: 'silver to recover' })).toBeTruthy();
  fireEvent.click(line);
  expect(onOpen).toHaveBeenCalled();
});

test('a tile carries its stack count and a tap leaves that type out', async () => {
  renderWithTheme(<Page />);
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
}, 15_000);

test('a tap on a dimmed tile keeps that type in the march for good', async () => {
  // 20 leadership is enough for nine of the ten types the default profile owns: one is left out.
  setLeadership(20);
  renderWithTheme(<Page />);
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
}, 15_000);

test('the counts are a table in kill order, and a tap on one copies it', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit, count } = stackAt();

  const rows = within(countsTable()).getAllByRole('row');
  // One header row plus one row per stack.
  expect(rows).toHaveLength((lastResult()?.result.stacks.length ?? 0) + 1);

  fireEvent.click(within(countsTable()).getByRole('button', { name: `Copy ${amount(count)}, ${unit.name}` }));
  expect(writeText).toHaveBeenCalledWith(String(count));
});

test('the same counts are stacked rows for a narrow card, with the same name', async () => {
  renderWithTheme(<Page />);
  await generate();

  expect(within(countsList()).getAllByRole('listitem')).toHaveLength(lastResult()?.result.stacks.length ?? 0);
  expect(screen.getByText('Falls first')).toBeTruthy();
  expect(screen.getByText('Falls last')).toBeTruthy();
});

test('Copy all counts writes one line per stack, in the game’s own shorthand', async () => {
  renderWithTheme(<Page />);
  await generate();

  fireEvent.click(screen.getByRole('button', { name: 'Copy all counts' }));

  const expected = (lastResult()?.result.stacks ?? [])
    .map((stack) => `${unitById(stack.unitId)?.label ?? stack.unitId} ${String(stack.count)}`)
    .join('\n');
  expect(writeText).toHaveBeenCalledWith(expected);
});

test('editing counts is a mode, and Undo puts the generated ones back', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit, count } = stackAt();
  const generated = lastResult()?.summary.avgDamage ?? 0;

  expect(screen.queryAllByLabelText(`${unit.name} count`)).toHaveLength(0);
  expect(screen.queryByRole('button', { name: 'Undo' })).toBeNull();

  fireEvent.click(screen.getByRole('radio', { name: 'Edit counts' }));
  const field = within(countsTable()).getByLabelText(`${unit.name} count`);
  expect(field).toHaveProperty('value', amount(count));

  // A count is typed, not walked to: the field carries no step buttons, and the keyboard still steps.
  expect(within(countsTable()).queryByRole('button', { name: /^Increase/ })).toBeNull();
  fireEvent.keyDown(field, { key: 'ArrowUp' });

  // The march on screen is recomputed on the hand-typed counts; the generated result is untouched.
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Undo' })).toBeTruthy();
  });
  expect(lastResult()?.summary.avgDamage).toBe(generated);
  expect(useResultStore.getState().manualCounts[unit.id]).toBe(count + 1);
  expect(screen.getByText(/Counts edited by hand/)).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
  expect(useResultStore.getState().manualCounts).toEqual({});
  // Three battles are played out here (the run, the edit, the undo): a busy machine needs the room.
}, 20_000);

test('the details are folded away until they are asked for', async () => {
  renderWithTheme(<Page />);
  await generate();

  const details = screen.getByRole('button', { name: 'Details The battle story and the HP profile' });
  expect(details.getAttribute('aria-expanded')).toBe('false');
  expect(screen.queryByText('Battle story')).toBeNull();

  fireEvent.click(details);
  await waitFor(() => {
    expect(details.getAttribute('aria-expanded')).toBe('true');
  });
  // The story and the chart are chunks of their own (T-06); Vitest transforms them on demand.
  expect(await screen.findByText('Battle story', {}, { timeout: 15_000 })).toBeTruthy();
  expect(screen.getByRole('list', { name: /Total HP per stack/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Raw journal/ }).getAttribute('aria-expanded')).toBe('false');
}, 25_000);

test('the unit sheet opens from a tile and says what the stack does, in sentences', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit, count } = stackAt();

  // The figure under a tile is the way in; the same name sits on the row's info button below, and
  // the tiles come first.
  const [fromTile] = screen.getAllByRole('button', { name: `Details: ${unit.name}` });
  fireEvent.click(fromTile as HTMLElement);

  const sheet = await screen.findByRole('dialog', { name: unit.name });
  expect(within(sheet).getByText('In this march')).toBeTruthy();
  expect(within(sheet).getByText('Why this size')).toBeTruthy();
  expect(within(sheet).getByText(new RegExp(`^${amount(count)} ${unit.name} land`))).toBeTruthy();
  expect(within(sheet).getByRole('button', { name: 'Keep in march' })).toBeTruthy();
  expect(within(sheet).getByRole('button', { name: 'Leave out' })).toBeTruthy();
});

test('leaving a type out from its sheet excludes it and generates again', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  fireEvent.click(within(countsList()).getByRole('button', { name: `Details: ${unit.name}` }));
  const sheet = await screen.findByRole('dialog', { name: unit.name });
  fireEvent.click(within(sheet).getByRole('button', { name: 'Leave out' }));

  await waitFor(() => {
    expect(profile()?.troops.excludedUnitIds).toContain(unit.id);
  });
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(false);
  });
}, 15_000);

test('what the search gave up is said beside what it won', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();
  const figures = {
    friendlyHits: 4,
    minDamage: 1,
    maxDamage: 2,
    avgDamage: 3,
    silver: 4,
    gold: 5,
    dragonCoins: 0,
  };

  act(() => {
    useRunStore.setState({
      tradeoff: {
        objective: 'minDamage',
        includedUnitIds: [unit.id],
        excludedUnitIds: ['spearman-1'],
        selection: figures,
        baseline: { ...figures, avgDamage: 6 },
      },
    });
  });

  expect(screen.getByRole('heading', { name: 'Compared with all types' })).toBeTruthy();
  expect(screen.getByText(`All types ${amount(6)}`)).toBeTruthy();
});

test('a warning from the engine is an alert under the recap', async () => {
  renderWithTheme(<Page />);
  await generate();
  const snapshot = lastResult();
  if (!snapshot) throw new Error('no result');

  act(() => {
    useResultStore.setState({
      last: { ...snapshot, result: { ...snapshot.result, warnings: ['Authority is spent on nothing'] } },
    });
  });

  expect(screen.getByText('Authority is spent on nothing')).toBeTruthy();
  expect(screen.getByText('Worth a look')).toBeTruthy();
});

test('the recap sheet adds what each pool bought and what stayed at home', async () => {
  setLeadership(20);
  renderWithTheme(<Page />);
  await generate();
  cleanup();

  renderWithTheme(<MarchRecap variant="sheet" />);
  expect(screen.getByText('Expected damage')).toBeTruthy();
  expect(screen.getByRole('progressbar', { name: 'Leadership used' })).toBeTruthy();
  expect(screen.getByText('Left out — tap to put back')).toBeTruthy();
}, 15_000);

test('a march can be saved, and is found again under the fold', async () => {
  renderWithTheme(<Page />);
  await generate();

  fireEvent.click(screen.getByRole('button', { name: 'Save this march' }));
  const dialog = await screen.findByRole('dialog', {}, { timeout: 15_000 });
  fireEvent.change(within(dialog).getByLabelText('March name'), { target: { value: 'Wide march' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Save this march' }));

  await waitFor(() => {
    expect(profile()?.savedStacks).toHaveLength(1);
  });

  fireEvent.click(screen.getByRole('button', { name: /^Saved marches/ }));
  expect(await screen.findByRole('checkbox', { name: 'Wide march' }, { timeout: 15_000 })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Rename Wide march' })).toBeTruthy();
}, 25_000);

test('the last result and its hand edits come back after a reload', async () => {
  const first = renderWithTheme(<Page />);
  await generate();
  const at = lastResult()?.at;
  const { unit, count } = stackAt();

  fireEvent.click(screen.getByRole('radio', { name: 'Edit counts' }));
  fireEvent.keyDown(within(countsTable()).getByLabelText(`${unit.name} count`), { key: 'ArrowUp' });
  await waitFor(() => {
    expect(useResultStore.getState().manualCounts[unit.id]).toBe(count + 1);
  });
  expect(window.localStorage.getItem(LAST_RESULT_KEY)).not.toBeNull();

  // Unmounting stops the subscription, so clearing the store here is the reload, not a user action.
  first.unmount();
  useResultStore.getState().clear();

  renderWithTheme(<Page />);
  await waitFor(() => {
    expect(lastResult()?.at).toBe(at);
  });
  expect(screen.getByText(/Generated just now/)).toBeTruthy();
  expect(
    within(countsTable()).getByRole('button', { name: `Copy ${amount(count + 1)}, ${unit.name}` }),
  ).toBeTruthy();
}, 20_000);

test('a cached result belonging to another march is left alone', async () => {
  const first = renderWithTheme(<Page />);
  await generate();
  first.unmount();
  useResultStore.getState().clear();
  act(() => {
    useStore.getState().createSetup('Second march');
  });

  renderWithTheme(<Page />);
  expect(lastResult()).toBeNull();
  expect(screen.getByText(/Nothing generated yet/)).toBeTruthy();
});
