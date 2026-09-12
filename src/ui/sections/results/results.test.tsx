// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { unitById } from '@/data';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { LAST_RESULT_KEY, useResultStore } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import { HousingSection } from '../housing/HousingSection';
import { amount } from './format';
import { ResultsSection } from './ResultsSection';
import { useRunStore } from './runStore';

// The whole page shares one calculation client; in jsdom it is the same engine, on the main thread.
vi.mock('@/ui/calcClient', async () => {
  const { createInlineClient } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  const client = createInlineClient();
  return { getCalcClient: () => client, disposeCalcClient: () => undefined };
});

function Page() {
  return (
    <>
      <HousingSection />
      <ResultsSection />
    </>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  useStore.getState().updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 0 } });
});

afterEach(() => {
  cleanup();
});

const lastResult = () => useResultStore.getState().last;

async function generate(): Promise<void> {
  fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
  await waitFor(() => {
    expect(lastResult()).not.toBeNull();
  });
}

/** Accessible name of a stack pill: its short label and the count it carries. */
function pillName(index = 0): string {
  const stack = lastResult()?.result.stacks[index];
  if (!stack) throw new Error('no stack was generated');
  return `${unitById(stack.unitId)?.label ?? stack.unitId} ${amount(stack.count)}`;
}

/** Accessible name of the chip of one unit id. */
function pillNameOf(unitId: string): string {
  const stack = lastResult()?.result.stacks.find((entry) => entry.unitId === unitId);
  if (!stack) throw new Error(`${unitId} is not in the march`);
  return `${unitById(unitId)?.label ?? unitId} ${amount(stack.count)}`;
}

const setup = () => selectActiveSetup(useStore.getState());

function unitNameOf(index = 0): string {
  const stack = lastResult()?.result.stacks[index];
  return unitById(stack?.unitId ?? '')?.name ?? '';
}

test('Generate sizes the default profile and shows pills and a summary', async () => {
  render(<Page />);
  await generate();

  const result = lastResult();
  expect(result?.result.stacks.length).toBeGreaterThan(0);
  expect(result?.result.pools.leadership.capacity).toBe(4100);

  expect(screen.getByRole('button', { name: pillName() })).toBeTruthy();
  expect(screen.getByText('Expected damage')).toBeTruthy();
  expect(screen.getByText('Value per silver')).toBeTruthy();
  expect(screen.getByText(`${amount(result?.result.pools.leadership.used ?? 0)} / 4,100`)).toBeTruthy();
});

test('a pill popover shows the effective stats behind the count', async () => {
  render(<Page />);
  await generate();

  fireEvent.click(screen.getByRole('button', { name: pillName() }));
  const panel = await screen.findByLabelText(`${unitNameOf()} stack`);
  expect(within(panel).getByText('This march')).toBeTruthy();
  expect(within(panel).getByText('HP each')).toBeTruthy();
  expect(within(panel).getByText('One hit')).toBeTruthy();
  expect(within(panel).getByText('Unit')).toBeTruthy();
  expect(within(panel).getByText('After the battle')).toBeTruthy();
  expect(within(panel).getByRole('button', { name: /Remove from march/ })).toBeTruthy();
});

test('editing a count by hand shows the delta and Undo puts it back', async () => {
  render(<Page />);
  await generate();

  const before = lastResult()?.summary.avgDamage ?? 0;
  fireEvent.click(screen.getByRole('button', { name: `One more ${unitNameOf()}` }));

  expect(screen.getByText('+1')).toBeTruthy();
  expect(screen.getAllByText(/vs generated/).length).toBeGreaterThan(0);
  // The generated result is untouched: only the view is edited.
  expect(lastResult()?.summary.avgDamage).toBe(before);

  fireEvent.click(screen.getByRole('button', { name: 'Back to generated' }));
  expect(screen.queryByText('+1')).toBeNull();
  expect(screen.queryByText(/vs generated/)).toBeNull();
});

test('the journal drawer lists the numbered hits of both strike orders', async () => {
  render(<Page />);
  await generate();

  fireEvent.click(screen.getByRole('button', { name: 'Battle journal' }));
  const drawer = await screen.findByRole('dialog');
  expect(within(drawer).getByText(/rounds · .* friendly hits · 4 enemy squads/)).toBeTruthy();

  // One row per hit, each numbered by its own row header.
  const entries = within(drawer).getAllByRole('rowheader');
  expect(entries.length).toBe(lastResult()?.summary.journals.enemyFirst.entries.length);
  const firstRow = entries[0]?.closest('tr');
  expect(firstRow?.textContent).toMatch(/Your .* squad dealt|The monster's .* squad destroyed/);

  // Radix activates a tab on mouse-down, not on click.
  fireEvent.mouseDown(within(drawer).getByRole('tab', { name: 'You first' }), { button: 0 });
  expect(within(drawer).getAllByRole('rowheader').length).toBe(
    lastResult()?.summary.journals.armyFirst.entries.length,
  );
});

test('two saved stacks can be compared side by side', async () => {
  render(<Page />);
  await generate();

  const save = async (name: string): Promise<void> => {
    fireEvent.click(screen.getByRole('button', { name: 'Save stack' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Stack name'), { target: { value: name } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save stack' }));
  };

  await save('Wide march');
  fireEvent.change(screen.getByLabelText('Leadership'), { target: { value: '2000' } });
  await waitFor(() => {
    expect(screen.getByLabelText('Leadership')).toHaveProperty('value', '2000');
  });
  fireEvent.click(screen.getByRole('button', { name: 'Generate' }));
  await waitFor(() => {
    expect(lastResult()?.result.pools.leadership.capacity).toBe(2000);
  });
  await save('Small march');

  expect(selectActiveProfile(useStore.getState())?.savedStacks).toHaveLength(2);

  fireEvent.click(screen.getByRole('checkbox', { name: /Wide march/ }));
  fireEvent.click(screen.getByRole('checkbox', { name: /Small march/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Compare (2)' }));

  const dialog = await screen.findByRole('dialog');
  expect(within(dialog).getByRole('columnheader', { name: 'Wide march' })).toBeTruthy();
  expect(within(dialog).getByRole('columnheader', { name: 'Small march' })).toBeTruthy();
  expect(within(dialog).getByRole('rowheader', { name: 'Expected damage' })).toBeTruthy();
  expect(within(dialog).getByRole('rowheader', { name: 'Unit counts' })).toBeTruthy();
});

test('removing a unit type from the formation excludes it and generates again', async () => {
  render(<Page />);
  await generate();

  const removed = lastResult()?.result.stacks[0]?.unitId ?? '';
  const name = unitNameOf();
  fireEvent.click(screen.getByRole('button', { name: pillName() }));
  const panel = await screen.findByLabelText(`${name} stack`);
  fireEvent.click(within(panel).getByRole('button', { name: /Remove from march/ }));

  await waitFor(() => {
    expect(selectActiveProfile(useStore.getState())?.troops.excludedUnitIds).toContain(removed);
  });
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === removed)).toBe(false);
  });
  expect(screen.getByText('Removed by you')).toBeTruthy();
});

test('an empty pool is reported once, not once per unit type', async () => {
  // Dominance only: every troop type is dropped for the same reason, which is one fact, not ten.
  useStore.getState().updateActiveSetup({ housing: { leadership: 0, authority: 0, dominance: 200 } });
  render(<Page />);
  await generate();

  const dropped = lastResult()?.result.dropped ?? [];
  expect(dropped.length).toBeGreaterThan(1);

  const line = screen.getByText(`${String(dropped.length)} unit types left out`);
  expect(line.closest('li')?.parentElement?.children).toHaveLength(1);
});

test('the last result and its hand edits come back after a reload', async () => {
  const first = render(<Page />);
  await generate();
  const at = lastResult()?.at;
  fireEvent.click(screen.getByRole('button', { name: `One more ${unitNameOf()}` }));
  expect(window.localStorage.getItem(LAST_RESULT_KEY)).not.toBeNull();

  // Unmounting stops the subscription, so clearing the store here is the reload, not a user action.
  first.unmount();
  useResultStore.getState().clear();
  expect(window.localStorage.getItem(LAST_RESULT_KEY)).not.toBeNull();

  render(<Page />);
  await waitFor(() => {
    expect(lastResult()?.at).toBe(at);
  });
  // The second pill is untouched, so its label and count are the generated ones.
  expect(screen.getByRole('button', { name: pillName(1) })).toBeTruthy();
  expect(screen.getByText('+1')).toBeTruthy();
  expect(screen.getByText(/Generated just now/)).toBeTruthy();
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

test('the HP profile draws one bar per stack', async () => {
  render(<Page />);
  await generate();

  const chart = screen.getByRole('list', { name: /Total HP per stack/ });
  expect(within(chart).getAllByRole('listitem')).toHaveLength(lastResult()?.result.stacks.length ?? 0);
});

test('keeping a left-out unit type in puts it back and remembers it', async () => {
  // 20 leadership is enough for nine of the ten types the default profile owns: exactly one is left out.
  useStore.getState().updateActiveSetup({ housing: { leadership: 20, authority: 0, dominance: 0 } });
  render(<Page />);
  await generate();

  const left = lastResult()?.result.dropped[0]?.unitId ?? '';
  expect(left).not.toBe('');
  const name = unitById(left)?.name ?? left;

  fireEvent.click(screen.getByRole('button', { name: `Keep in march: ${name}` }));

  await waitFor(() => {
    expect(setup()?.pinnedUnitIds).toContain(left);
  });
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === left)).toBe(true);
  });
  expect(screen.getByText(/Pinned:/)).toBeTruthy();
  expect(screen.getByRole('img', { name: `${name} is kept in the march` })).toBeTruthy();

  // Unpinning from the stack's own popover hands it back to the sizer.
  const count = lastResult()?.result.stacks.find((stack) => stack.unitId === left)?.count ?? 0;
  fireEvent.click(screen.getByRole('button', { name: `${unitById(left)?.label ?? left} ${amount(count)}` }));
  const panel = await screen.findByLabelText(`${name} stack`);
  fireEvent.click(within(panel).getByRole('button', { name: `Stop keeping ${name} in the march` }));

  await waitFor(() => {
    expect(setup()?.pinnedUnitIds).not.toContain(left);
  });
});

test('keeping a removed unit type in un-removes it as well as pinning it', async () => {
  render(<Page />);
  await generate();

  const removed = lastResult()?.result.stacks[0]?.unitId ?? '';
  const name = unitNameOf();
  fireEvent.click(screen.getByRole('button', { name: pillName() }));
  const panel = await screen.findByLabelText(`${name} stack`);
  fireEvent.click(within(panel).getByRole('button', { name: /Remove from march/ }));

  await waitFor(() => {
    expect(selectActiveProfile(useStore.getState())?.troops.excludedUnitIds).toContain(removed);
  });

  fireEvent.click(screen.getByRole('button', { name: `Keep in march: ${name}` }));

  await waitFor(() => {
    expect(selectActiveProfile(useStore.getState())?.troops.excludedUnitIds).not.toContain(removed);
  });
  expect(setup()?.pinnedUnitIds).toContain(removed);
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === removed)).toBe(true);
  });
});

test('removing a unit type stops keeping it in, so the two never fight', async () => {
  useStore.getState().updateActiveSetup({ pinnedUnitIds: ['archer-1'] });
  render(<Page />);
  await generate();

  fireEvent.click(screen.getByRole('button', { name: pillNameOf('archer-1') }));
  const panel = await screen.findByLabelText(`${unitById('archer-1')?.name ?? ''} stack`);
  fireEvent.click(within(panel).getByRole('button', { name: /Remove from march/ }));

  await waitFor(() => {
    expect(setup()?.pinnedUnitIds).not.toContain('archer-1');
  });
});
