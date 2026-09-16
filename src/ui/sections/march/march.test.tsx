// @vitest-environment jsdom
/**
 * The March, by role and by name (design plan §7.5): the recap first, the army as pills that change
 * the march — a press leaves a type out, the corner mark opens its sheet — the counts with an
 * explicit edit mode, and everything that explains the numbers folded away underneath, plus the
 * three contract components the shell renders elsewhere (the quick summary, the recap sheet and
 * Generate).
 *
 * The engine runs for real here (the calculation client is the inline one), so every assertion about
 * a count or a figure is an assertion about the engine's own output.
 */
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { CAMPAIGN } from '@/config';
import { unitById } from '@/data';
import type { Objective, UnitDef } from '@/engine/types';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';
import { initResultPersistence, LAST_RESULT_KEY, useResultStore } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import { restoreLastResult } from './generate';
import { amount } from './format';
import { MarchQuickSummary } from './MarchQuickSummary';
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
  // The cache is the frame's business since the March moved into the phone's sheet (`ui/shell`), so
  // the harness plays the frame's part: restore on mount, keep the cache in step while mounted.
  useEffect(() => {
    restoreLastResult();
    return initResultPersistence();
  }, []);

  // Generate is the section's own on one column (the width jsdom answers with), so the harness adds
  // none of its own: two buttons with one name is what the frame is careful never to draw.
  return <MarchSection />;
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

/**
 * A marching stack's pill. **A press leaves that type out** (owner, 2026-09-13): the primary action
 * is direct, the name says so, and the corner mark is the only way into the unit sheet.
 */
function stackPill(unit: UnitDef, count: number): HTMLElement {
  return screen.getByRole('button', { name: `${unit.name}, ${amount(count)} — leave out` });
}

/**
 * A type this march does not field: a small outlined pill in the row under the pools. Its name says
 * *who* left it out, because a player wants to know which of the two it was.
 */
function leftOutPill(unit: UnitDef, reason: 'you' | 'the search' = 'the search'): HTMLElement {
  return screen.getByRole('button', { name: `${unit.name}, left out by ${reason} — put back` });
}

/** The corner mark on a pill, and the same name on any other way into the sheet. */
function detailsButtons(unit: UnitDef): HTMLElement[] {
  return screen.getAllByRole('button', { name: `Details: ${unit.name}` });
}

test('the recap comes first, then the pills, then the two count actions', async () => {
  renderWithTheme(<Page />);
  await generate();

  const recap = screen.getByText(/^Expected damage/);
  const pills = screen.getByRole('group', { name: 'Leadership stacks' });
  const copyAll = screen.getByRole('button', { name: 'Copy all counts' });

  const follows = (first: Element, second: Element): boolean =>
    (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  expect(follows(recap, pills)).toBe(true);
  expect(follows(pills, copyAll)).toBe(true);
});

test('the recap is the figures a march is compared by, the expected damage first', async () => {
  renderWithTheme(<Page />);
  await generate();

  const summary = lastResult()?.summary;
  expect(screen.getByText(amount(summary?.avgDamage ?? 0))).toBeTruthy();
  for (const label of ['Worst opening', 'Silver to recover', 'Gold to recover', 'Damage per silver']) {
    expect(screen.getByText(label)).toBeTruthy();
  }
  // How many times the army swings is a fact about a stack, so it is said in the unit sheet alone
  // (owner, 2026-09-13) and never in the recap.
  expect(screen.queryByText('Hits landed')).toBeNull();
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

test('the pool says what the march spent, over the stacks it paid for', async () => {
  renderWithTheme(<Page />);
  await generate();

  // The figure is the gauge now (design rule 5): "4 100 🛡️ of 4 100 leadership", not a bar saying
  // it again — and the pool's *name* is on the line, because an emoji is never the only label
  // (the spacing contract, `MarchPaneSpacing.dc.html`, `.pool .of`).
  expect(screen.getByText(amount(4100))).toBeTruthy();
  expect(screen.getByText(`of ${amount(4100)} leadership`)).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Leadership stacks' })).toBeTruthy();
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

test('a press on a pill leaves that type out of the march, and copies nothing', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit, count } = stackAt();

  const pill = stackPill(unit, count);
  expect(pill.closest('[data-stack]')?.getAttribute('data-count')).toBe(String(count));
  // The on half of a toggle written across two rows: pressed here, not pressed in the row below.
  expect(pill.getAttribute('aria-pressed')).toBe('true');

  fireEvent.click(pill);

  // The march is re-sized on the spot and the type is gone from it. It is *the march on screen*
  // that leaves it out: nothing in the document moved, neither the account's own types (S-53)…
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(false);
  });
  expect(profile()?.troops.excludedUnitIds).not.toContain(unit.id);
  expect(useRunStore.getState().leftOutByPlayer).toContain(unit.id);
  expect(useRunStore.getState().includedUnitIds).not.toContain(unit.id);
  // …and into the row under the pools, where a press puts it back.
  expect(leftOutPill(unit, 'you').getAttribute('aria-pressed')).toBe('false');
  // Tap-to-copy is gone: "Copy all counts" is the one copy on the page.
  expect(writeText).not.toHaveBeenCalled();
}, 20_000);

test('a March edit re-sizes in place and never marks the answer out of date', async () => {
  renderWithTheme(<Page />);
  await generate();
  const fingerprint = useRunStore.getState().lastRunFingerprint;
  const { unit, count } = stackAt();
  const before = lastResult()?.result.pools.leadership.used ?? 0;

  fireEvent.click(stackPill(unit, count));
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(false);
  });

  // The setup did not move, so neither did the fingerprint the staleness warning is drawn from.
  expect(useRunStore.getState().lastRunFingerprint).toBe(fingerprint);
  expect(document.querySelector('[data-stale="true"]')).toBeNull();
  // The remaining types were re-sized on the housing the type gave back.
  expect(lastResult()?.result.pools.leadership.used).toBeGreaterThanOrEqual(before - unit.cost);
}, 20_000);

test('putting a type back is simply putting it in: the sizer decides its count', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit, count } = stackAt();

  fireEvent.click(stackPill(unit, count));
  await waitFor(() => {
    expect(useRunStore.getState().leftOutByPlayer).toContain(unit.id);
  });

  fireEvent.click(leftOutPill(unit, 'you'));

  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(true);
  });
  // Nothing holds it there: it is in the march, exactly like every other type.
  expect(useRunStore.getState().leftOutByPlayer).not.toContain(unit.id);
  expect(useRunStore.getState().includedUnitIds).toContain(unit.id);
}, 20_000);

test('Generate is a fresh solve: it forgets what the March left out', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit, count } = stackAt();

  fireEvent.click(stackPill(unit, count));
  await waitFor(() => {
    expect(useRunStore.getState().leftOutByPlayer).toContain(unit.id);
  });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /^Generate march/ }));
    await waitFor(() => {
      expect(useRunStore.getState().leftOutByPlayer).toEqual([]);
    });
  });

  // The whole army is back: Generate solves on what the forms describe and nothing else.
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(true);
  });
}, 20_000);

test('the corner mark, and nothing else on the pill, opens the unit sheet', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  const [mark] = detailsButtons(unit);
  fireEvent.click(mark as HTMLElement);

  const sheet = await screen.findByRole('dialog', { name: unit.name });
  expect(within(sheet).getByRole('button', { name: 'Leave out' })).toBeTruthy();
  expect(writeText).not.toHaveBeenCalled();
}, 15_000);

test('a type the sizer dropped is offered again when it is put back, and stays out if it still does not fit', async () => {
  // 20 leadership is enough for nine of the ten types the default profile owns: one is left out.
  setLeadership(20);
  renderWithTheme(<Page />);
  await generate();

  const dropped = lastResult()?.result.dropped[0]?.unitId ?? '';
  const unit = unitById(dropped);
  if (!unit) throw new Error('nothing was left out');

  // Nobody took this one out by hand, so the pill says the solver did.
  const pill = leftOutPill(unit, 'the search');
  expect(useRunStore.getState().includedUnitIds).toContain(unit.id);

  fireEvent.click(pill);

  // It was already offered to the sizer, which could not pay for it: it comes straight back to the
  // row with the sizer's own reason. Nothing forces a type in any more (S-53).
  await waitFor(() => {
    expect(lastResult()?.result.dropped.map((entry) => entry.unitId)).toContain(unit.id);
  });
  expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(false);
}, 15_000);

test('every stack has a pill, in kill order, and there is no table under them', async () => {
  renderWithTheme(<Page />);
  await generate();

  const pills = [...document.querySelectorAll('[data-stack]')];
  expect(pills).toHaveLength(lastResult()?.result.stacks.length ?? 0);
  // Kill order, first to fall first — the order the engine returned the stacks in.
  expect(pills.map((node) => node.getAttribute('data-stack'))).toEqual(
    (lastResult()?.result.stacks ?? []).map((stack) => unitById(stack.unitId)?.label ?? ''),
  );
  // The per-stack table is gone: the pills are the counts (owner, 2026-09-13).
  expect(screen.queryByRole('table', { name: /in the order the stacks fall/ })).toBeNull();
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

  fireEvent.click(screen.getByRole('button', { name: 'Edit counts' }));
  // The toggle says it is on, and says what the press would do next.
  expect(screen.getByRole('button', { name: 'Done editing' }).getAttribute('aria-pressed')).toBe('true');
  // The field is the pill's own count, in place.
  const field = screen.getByLabelText(`${unit.name} count`);
  expect(field).toHaveProperty('value', amount(count));

  // A count is typed, not walked to: the field carries no step buttons, and the keyboard still steps.
  expect(screen.queryByRole('button', { name: /^Increase/ })).toBeNull();
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

  // The mark in the pill's corner is the way in, and the only one: the long press it used to share
  // the pill with is gone with tap-to-copy (owner, 2026-09-13).
  const [fromPill] = detailsButtons(unit);
  fireEvent.click(fromPill as HTMLElement);

  const sheet = await screen.findByRole('dialog', { name: unit.name });
  expect(within(sheet).getByText('In this march')).toBeTruthy();
  expect(within(sheet).getByText('Why this size')).toBeTruthy();
  expect(within(sheet).getByText(new RegExp(`^${amount(count)} ${unit.name} land`))).toBeTruthy();
  // A marching type has no "put back": it is already in (S-53).
  expect(within(sheet).queryByRole('button', { name: /put back/i })).toBeNull();
  expect(within(sheet).getByRole('button', { name: 'Leave out' })).toBeTruthy();
});

test('leaving a type out from its sheet takes it out of the march and re-sizes the rest', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  fireEvent.click(detailsButtons(unit)[0] as HTMLElement);
  const sheet = await screen.findByRole('dialog', { name: unit.name });
  fireEvent.click(within(sheet).getByRole('button', { name: 'Leave out' }));

  await waitFor(() => {
    expect(useRunStore.getState().leftOutByPlayer).toContain(unit.id);
  });
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(false);
  });
}, 15_000);

/** The comparison runs five real searches before the table exists; jsdom runs them inline. */
const TABLE_WAIT = { timeout: 25_000 };

/** The seven figures a run's trade-off carries, with whatever the test needs written over them. */
const TRADEOFF_FIGURES = {
  friendlyHits: 4,
  minDamage: 1,
  maxDamage: 2,
  avgDamage: 3,
  silver: 4,
  gold: 5,
  dragonCoins: 0,
};

/** Put a finished priority search on screen, with the types it left at home. */
function landTradeoff(objective: Objective, excludedUnitIds: string[], keep: string): void {
  act(() => {
    useRunStore.setState({
      tradeoff: {
        objective,
        includedUnitIds: [keep],
        excludedUnitIds,
        selection: TRADEOFF_FIGURES,
        baseline: { ...TRADEOFF_FIGURES, avgDamage: 6 },
      },
    });
  });
}

test('a priority that dropped nothing says so in one line, and draws no strip', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  // Investigation 0013 §5.1: on an army already trimmed to what the search would pick, the old
  // strip was seven zero deltas. One sentence says the same thing and is true.
  landTradeoff('avgDamage', [], unit.id);

  expect(screen.getByText(/keeps every type/)).toBeTruthy();
  expect(screen.queryByRole('table', { name: 'Every objective on this army' })).toBeNull();
});

test('an objective this march cannot be ranked by says so instead of pretending', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  // Investigation 0013 §5.2: `dragonCoins: 0` on the all-types march means every candidate divided
  // by zero, so nothing was compared and the winner is the plain march.
  landTradeoff('damagePerDragonCoin', ['spearman-1'], unit.id);

  expect(screen.getByText(/cannot be compared/)).toBeTruthy();
  expect(screen.queryByRole('table', { name: 'Every objective on this army' })).toBeNull();
});

test('what the search gave up is the objectives side by side, and a row runs one', async () => {
  useStore.getState().updateActiveSetup({ priority: 'avgDamage' });
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  landTradeoff('avgDamage', ['spearman-1'], unit.id);

  // Investigation 0013 §5.3: five searches on the same request, four figures each, one row per
  // objective. They run after the main one, so the table arrives a tick later.
  expect(screen.getByRole('heading', { name: 'Objectives compared' })).toBeTruthy();
  const table = await screen.findByRole('table', { name: 'Every objective on this army' }, TABLE_WAIT);
  expect(within(table).getAllByRole('row').length).toBe(6);

  // Design rule 29's second half: the alternatives are offered next to the answer, and choosing one
  // is one press — it writes the objective and generates again.
  const at = lastResult()?.at;
  fireEvent.click(within(table).getByRole('button', { name: 'Generate with Best worst case' }));
  expect(setup()?.priority).toBe('minDamage');
  await waitFor(() => {
    expect(lastResult()?.at).not.toBe(at);
  });
}, 30_000);

test('complete optimization answers with a plan, and the March draws it instead of the objectives', async () => {
  // The plan method (S-55): the army alone decides the marches, the counts and the split between silver
  // and the hired stock. It is the fourth and last method since S-56 removed the S-54 one it replaced.
  // The plan is planned from the army alone — and an army with no mercenaries has no plan at all
  // (`planCampaign` refuses it) — so this suite hands it a stock, the way the Mercenaries card would.
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 92 },
    { id: 'arbalester-6', cap: 76 },
    { id: 'legionary-6', cap: 72 },
    { id: 'chariot-6', cap: 37 },
  ];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup((current) => ({
      housing: { leadership: 4_100, authority: 2_000, dominance: 0 },
      options: { ...current.options, method: 'plan' },
    }));
  });
  renderWithTheme(<Page />);
  await generate();

  // The one thing about this answer the player did not choose: what sized it.
  const plan = useRunStore.getState().plan;
  expect(plan).not.toBeNull();
  expect(plan?.marches).toBe(CAMPAIGN.marches);
  expect(screen.getByText(/^Planned from the army:/)).toBeTruthy();

  // **Open on arrival** (S-59: the owner's 2026-09-16 review — "it becomes a new part of the recap"), with
  // the answer's headline on the row either way.
  const fold = screen.getByRole('button', { name: /^Plan/ });
  expect(fold.getAttribute('aria-expanded')).toBe('true');
  expect(fold.textContent).toContain('damage a march');

  // The trade the plan chose from, one row per answer the engine offers: a plan the player may be asked to
  // march.
  const trade = screen.getByRole('table', { name: 'Every plan on the trade' });
  expect(within(trade).getAllByRole('row').length).toBeGreaterThan(2);

  // And it folds away on request: the chevron is how a player whose pane no longer sticks gets one that
  // does, and what is left on the row is still the answer.
  fireEvent.click(fold);
  await waitFor(() => {
    expect(fold.getAttribute('aria-expanded')).toBe('false');
  });
  expect(fold.textContent).toContain('damage a march');

  // And it *replaces* the objectives comparison: five more searches to compare one battle would explain
  // nothing that a plan over ten marches has not already said.
  expect(useRunStore.getState().tradeoff).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Objectives compared' })).toBeNull();
}, 30_000);
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

test('the recap is the figures alone, and the section under it carries the pools and the army', async () => {
  setLeadership(20);
  renderWithTheme(<Page />);
  await generate();

  // The figures, once (design rule 5): the hero, the five comparisons and nothing else.
  const recap = screen.getByLabelText('This march in figures');
  expect(within(recap).getByText(/^Expected damage/)).toBeTruthy();
  expect(within(recap).queryByRole('group', { name: 'Leadership stacks' })).toBeNull();

  // The pools and the army are the section's own, and each is there exactly once.
  expect(screen.getAllByRole('group', { name: 'Leadership stacks' })).toHaveLength(1);
  expect(screen.getAllByText(/^Expected damage/)).toHaveLength(1);
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

  fireEvent.click(screen.getByRole('button', { name: 'Edit counts' }));
  fireEvent.keyDown(screen.getByLabelText(`${unit.name} count`), { key: 'ArrowUp' });
  await waitFor(() => {
    expect(useResultStore.getState().manualCounts[unit.id]).toBe(count + 1);
  });
  expect(window.localStorage.getItem(LAST_RESULT_KEY)).not.toBeNull();

  // Unmounting stops the subscription, so clearing the store here is the reload, not a user action.
  // Both stores are cleared because a reload recreates both: the run store's own view state — which
  // counts are being edited — belongs to the run that just ended (owner, 2026-09-15).
  first.unmount();
  useResultStore.getState().clear();
  useRunStore.getState().reset();

  renderWithTheme(<Page />);
  await waitFor(() => {
    expect(lastResult()?.at).toBe(at);
  });
  expect(stackPill(unit, count + 1)).toBeTruthy();
}, 20_000);

test('a fresh march says nothing about its age; a stale one says so and steps back', async () => {
  renderWithTheme(<Page />);
  await generate();

  // When the answer is current there is nothing to read about it: no clock, no marker, no dimming
  // (owner, 2026-09-13 — "generated 5 minutes ago" is not a question anybody asks).
  const recap = screen.getByLabelText('This march in figures');
  expect(within(recap).queryByText(/generated/i)).toBeNull();
  expect(screen.queryByText(/Setup changed since this march/)).toBeNull();
  for (const block of document.querySelectorAll('[data-stale]')) {
    expect(block.getAttribute('data-stale')).toBe('false');
  }
  const generateButton = screen.getByRole('button', { name: 'Generate march' });
  expect(generateButton.closest('[data-state]')?.getAttribute('data-state')).toBe('ready');

  // Move the form under the answer: the figures and the pills step back together, one line in the
  // warning ink says what happened, and Generate keeps its dot.
  setLeadership(2000);

  expect(screen.getByText('Setup changed since this march. Generate to refresh.')).toBeTruthy();
  expect(screen.getByRole('img', { name: 'Out of date' })).toBeTruthy();
  const dimmed = [...document.querySelectorAll('[data-stale]')];
  expect(dimmed.length).toBeGreaterThanOrEqual(2);
  for (const block of dimmed) expect(block.getAttribute('data-stale')).toBe('true');
  expect(generateButton.closest('[data-state]')?.getAttribute('data-state')).toBe('stale');

  // …and generating again puts it all back.
  await generate();
  await waitFor(() => {
    expect(screen.queryByText(/Setup changed since this march/)).toBeNull();
  });
}, 20_000);

test('the phone bar’s answer line carries the warning marker only while the march is stale', async () => {
  renderWithTheme(<Page />);
  await generate();
  cleanup();

  renderWithTheme(<MarchQuickSummary onOpen={() => {}} />);
  expect(screen.queryByRole('img', { name: 'Setup changed since this march' })).toBeNull();

  setLeadership(2000);
  expect(screen.getByRole('img', { name: 'Setup changed since this march' })).toBeTruthy();
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
