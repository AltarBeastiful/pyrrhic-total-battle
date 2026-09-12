// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { unitById } from '@/data';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, useStore } from '@/state/store';
import { useResultStore } from '@/ui/resultStore';
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
  expect(screen.getByText('Average damage')).toBeTruthy();
  expect(screen.getByText('Damage / silver')).toBeTruthy();
  expect(screen.getByText(`${amount(result?.result.pools.leadership.used ?? 0)} / 4,100`)).toBeTruthy();
});

test('a pill popover shows the effective stats behind the count', async () => {
  render(<Page />);
  await generate();

  fireEvent.click(screen.getByRole('button', { name: pillName() }));
  const panel = await screen.findByLabelText(`${unitNameOf()} stack`);
  expect(within(panel).getByText('HP per unit')).toBeTruthy();
  expect(within(panel).getByText('Damage per hit')).toBeTruthy();
  expect(within(panel).getByRole('button', { name: 'Remove from formation' })).toBeTruthy();
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

  const entries = within(drawer).getAllByRole('listitem');
  expect(entries.length).toBe(lastResult()?.summary.journals.enemyFirst.entries.length);
  expect(entries[0]?.textContent).toMatch(/Your .* squad dealt|The monster's .* squad destroyed/);

  // Radix activates a tab on mouse-down, not on click.
  fireEvent.mouseDown(within(drawer).getByRole('tab', { name: 'Army first' }), { button: 0 });
  expect(within(drawer).getAllByRole('listitem').length).toBe(
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
  expect(within(dialog).getByRole('rowheader', { name: 'Average damage' })).toBeTruthy();
  expect(within(dialog).getByRole('rowheader', { name: 'Unit counts' })).toBeTruthy();
});

test('removing a unit type from the formation excludes it and generates again', async () => {
  render(<Page />);
  await generate();

  const removed = lastResult()?.result.stacks[0]?.unitId ?? '';
  const name = unitNameOf();
  fireEvent.click(screen.getByRole('button', { name: pillName() }));
  const panel = await screen.findByLabelText(`${name} stack`);
  fireEvent.click(within(panel).getByRole('button', { name: 'Remove from formation' }));

  await waitFor(() => {
    expect(selectActiveProfile(useStore.getState())?.troops.excludedUnitIds).toContain(removed);
  });
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === removed)).toBe(false);
  });
  expect(screen.getByText('Removed by you')).toBeTruthy();
});
