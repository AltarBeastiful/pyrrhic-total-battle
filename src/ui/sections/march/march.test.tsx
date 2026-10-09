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
import { largestSustained, lastsMarches, planRepeats } from '@/engine';
import type { Objective, UnitDef } from '@/engine/types';
import { updateSources } from '@/state/actions/bonuses';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { facetWords, squadUnknown } from '@/ui/domain';
import { renderWithTheme } from '@/ui/kit/testRender';
import { initResultPersistence, LAST_RESULT_KEY, useResultStore } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import { DamageSplit } from './DamageSplit';
import { restoreLastResult } from './generate';
import { amount, bonusLines, compactRatio, compactTwo, duration, ratio, signedPercent } from './format';
import { MarchRaiseControl } from './MarchPills';
import { MarchQuickSummary } from './MarchQuickSummary';
import { MarchSection } from './MarchSection';
import { UnitSheet } from './UnitSheet';
import { hiredLost, stockRun } from './hired';
import type { PositionTrades } from './positions';
import { positionsKey, usePositionsStore } from './positionsSearch';
import { raiseSearchKey, useRaiseSearchStore } from './raiseSearch';
import { burnOf, countsOf, DEFAULT_RAISE, NO_RAISE, raisedCounts } from './raise';
import type { RaiseMode } from './raise';
import { marchRows, unitBonus } from './rows';
import { pickOf, useRunStore } from './runStore';
import { worstDamageByPool } from './worst';

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
  // **These tests were written on `As is`**, the start of a run until 2026-10-07; a run starts on `Tight` now
  // (`DEFAULT_RAISE`, tested below) and they put it back to the start they describe.
  useRunStore.setState({ raiseModes: NO_RAISE });
  setLeadership(4100);
});

/**
 * **A position the control no longer offers** (owner, 2026-10-07: only `As is` and `Tight` are segments), put
 * the way a press used to: the run store's own rule over both hired blocks (`setRaiseMode`). The kernel and the
 * arithmetic behind `Most`, `Best v2` and `Safe` are unchanged, and these tests are about that arithmetic.
 */
function chooseRaise(mode: RaiseMode): void {
  act(() => {
    useRunStore.getState().setRaiseMode(mode);
  });
}

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
  return screen.getByRole('button', { name: `${unit.name}, ${amount(count)}: leave out` });
}

/**
 * A type this march does not field: a small outlined pill in the row under the pools. Its name says
 * *who* left it out, because a player wants to know which of the two it was.
 */
function leftOutPill(unit: UnitDef, reason: 'you' | 'the search' = 'the search'): HTMLElement {
  return screen.getByRole('button', { name: `${unit.name}, left out by ${reason}: put back` });
}

/** The corner mark on a pill, and the same name on any other way into the sheet. */
function detailsButtons(unit: UnitDef): HTMLElement[] {
  return screen.getAllByRole('button', { name: `Details: ${unit.name}` });
}

test('the marks are on the heading, then the recap, then the pills', async () => {
  renderWithTheme(<Page />);
  await generate();

  const stacks = screen.getByText(/^\d[\d\s]* stacks$/);
  const copyAll = screen.getByRole('button', { name: 'Copy all counts' });
  const recap = screen.getByText(/^Expected damage/);
  const pills = screen.getByRole('group', { name: 'Leadership stacks' });

  const follows = (first: Element, second: Element): boolean =>
    (first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
  // The heading line reads "March · 12 stacks · the marks" (owner, 2026-09-21): what a player does
  // with the march is beside the answer now, not a page below it at the foot of the setup column.
  expect(follows(stacks, copyAll)).toBe(true);
  expect(follows(copyAll, recap)).toBe(true);
  expect(follows(recap, pills)).toBe(true);
});

test('the recap is the figures a march is compared by, the expected damage first', async () => {
  renderWithTheme(<Page />);
  await generate();

  const summary = lastResult()?.summary;
  // The hero, in the notes' own notation since S-148: two decimals, and the grouped figure one hover away
  // (`DeltaText`'s `exact`, on the hero's own `Text`).
  expect(screen.getByText(compactTwo(summary?.avgDamage ?? 0, 2))).toBeTruthy();
  for (const label of [
    // "Worst opening" until 2026-09-21; the figure is the same enemy-first journal's (owner: one word).
    'Damage',
    'Silver to recover',
    'Gold to recover',
    'Time to recover',
    'Damage per silver',
  ]) {
    expect(screen.getByText(label)).toBeTruthy();
  }
  /**
   * **And "Damage per silver" is the bar's own reading** (S-108, 2026-09-19; the owner: *"damage/silver
   * differs in the plan table and in the battle summary"*). It printed `summary.damagePerSilver`, which
   * divides `avgDamage` — the midpoint of the two openings, TotalStack's reading of its Battle Summary and
   * the priority search's own objective — while the plan's trade divides the **worst opening** since S-94.
   * The two fields still differ on this very march, which is why the assertion is worth making: the recap
   * reads the figure two rows above it.
   */
  const perSilver = screen.getByText('Damage per silver').closest('dt')?.nextElementSibling;
  const silver = summary?.recovery.silver ?? 0;
  expect(silver).toBeGreaterThan(0);
  // `compactRatio` and not `ratio` since S-148: below 100 the two are the same string, and above it the
  // ratio takes the notation the plan's own trade prints for the same figure (`format.ts`, rule 5).
  expect(perSilver?.textContent).toContain(compactRatio((summary?.minDamage ?? 0) / silver));
  // **And the digits the notation rounds are this row's own**, not the grid's (`DeltaText`'s `exact`, S-148):
  // a rate's full form is `ratio` — two decimals below 100 — where a total's is `amount`'s grouped integer.
  // The single shared writer this shipped with first put a "3" in the title of a line reading "2.91", which
  // is a figure contradicting the line under it; the adversarial review caught it and this is what holds it.
  expect(perSilver?.querySelector('[title]')?.getAttribute('title')).toBe(
    ratio((summary?.minDamage ?? 0) / silver),
  );
  expect(summary?.damagePerSilver).toBeGreaterThan((summary?.minDamage ?? 0) / silver);
  // How many times the army swings is a fact about a stack, so it is said in the unit sheet alone
  // (owner, 2026-09-13) and never in the recap.
  expect(screen.queryByText('Hits landed')).toBeNull();
  // And the two figures a march only has when it trains a monster are not among them on an account with
  // no dominance pool (S-102, design rule 15) — the case below is the other half of this one.
  expect(screen.queryByText('Dragon coins to recover')).toBeNull();
  expect(screen.queryByText('Damage per dragon coin')).toBeNull();
});

/**
 * **The third price a march is paid in, and what it bought** (S-102, 2026-09-19; the owner: *"monsters have
 * a 3-cost: training time, silver and dragon coins. TotalStack computes the total of dragon coins needed for
 * a stack if present and the dmg/dragon coins."*).
 *
 * A dominance monster is **trained**, not hired: it never touches "Merc lost" below (that figure is the
 * authority pool's, `./hired`, and so is the engine's own burn axis since S-102). Its price is the silver and
 * the queue it shares with the troops plus these coins, which nothing else in the game spends — so the recap
 * says them, and says what they bought beside "Damage per silver".
 *
 * **Both only while the march spends one** (design rule 15). The figures are the engine's own
 * (`recovery.dragonCoins`, `damagePerDragonCoin`); the recap computes nothing.
 */
test('the recap says the dragon coins a monster march costs, and what they bought', async () => {
  renderWithTheme(<Page />);
  await generate();
  expect(lastResult()?.summary.recovery.dragonCoins).toBe(0);

  // Open the monster tier window and house a dominance pool, the way the Battle card would: experiment
  // 110's camp, tiers 3–5 against 900 dominance.
  const before = lastResult();
  act(() => {
    const state = useStore.getState();
    const active = selectActiveProfile(state);
    if (active) {
      state.updateProfile(active.id, (current) => ({
        troops: { ...current.troops, monsters: { min: 3, max: 5 } },
      }));
    }
    state.updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 900 } });
  });
  fireEvent.click(screen.getByRole('button', { name: /^Generate march/ }));
  await waitFor(() => {
    expect(lastResult()).not.toBe(before);
  });

  const summary = lastResult()?.summary;
  const coins = summary?.recovery.dragonCoins ?? 0;
  expect(coins, 'a march that houses 900 dominance trains monsters back').toBeGreaterThan(0);
  const figures = screen.getByLabelText('March figures');
  const cost = within(figures).getByText('Dragon coins to recover').closest('dt')?.nextElementSibling;
  expect(cost?.textContent).toContain(compactTwo(coins, 2));
  // **On the worst opening, like the plan's** (S-108): `summary.damagePerDragonCoin` divides the midpoint
  // of the two openings, which is TotalStack's reading of its Battle Summary and the priority search's own
  // objective; the recap divides the figure it prints two rows above, so the two screens agree.
  const per = within(figures).getByText('Damage per dragon coin').closest('dt')?.nextElementSibling;
  expect(per?.textContent).toContain(compactRatio((summary?.minDamage ?? 0) / coins));
  expect(summary?.minDamage).toBeLessThan(summary?.avgDamage ?? 0);
});

/**
 * **What the march costs in time**, beside what it costs in coin (owner, 2026-09-18: *"generation sometimes
 * skips low-level stacks and misses some damage that seems cheap; it is mainly because one thing is not taken
 * into account: troops of higher tier are longer to train. Adding training time on the battle summary is the
 * first step."*).
 *
 * The figure is the engine's own `recovery.seconds` — the recap computes nothing — written the way the game
 * writes a training queue, and it is **one figure for the whole march**: the recap never splits it by pool.
 */
test('the recap says how long the march takes to recover, in the training queue\u2019s own words', async () => {
  renderWithTheme(<Page />);
  await generate();

  const seconds = lastResult()?.summary.recovery.seconds ?? 0;
  expect(seconds).toBeGreaterThan(0);
  const figures = screen.getByLabelText('March figures');
  const time = within(figures).getByText('Time to recover').closest('dt')?.nextElementSibling;
  expect(time?.textContent).toContain(duration(seconds));
  // "5d 23h", never "509 400": a queue is read in days and hours, not in seconds (`format.ts`).
  expect(time?.textContent).not.toContain(amount(seconds));
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

/**
 * **The corner mark says what this march's bonuses give its type, and the sheet it opens says it again
 * where the figures are** (owner, 2026-09-28: *"in the detail of a troop in the battle summary, add the
 * percent of bonus in health and strength in a good place. And on the hover of the information badge
 * opening the troop detail, add a tooltip to read those with text like Health: +xx.x% / Strength:
 * +xx.x%"*).
 *
 * One pair of figures, two places and one set of words (design rule 5): the hover is what a player
 * comparing two pills reads without leaving the pane, and the sheet's bars — base against the value with
 * every bonus — carry the percentages of the gap between them.
 */
test('the corner mark previews the type’s bonuses, and the sheet writes them beside its bars', async () => {
  // One permanent source, worth +40 % health and +12 % strength to the whole army (`army` is the key that
  // reaches every unit), so the two lines are a real measurement rather than two noughts.
  const owner = profile();
  if (owner === undefined) throw new Error('the harness has an active profile');
  act(() => {
    updateSources(owner.id, (sources) => ({
      ...sources,
      permanent: [
        ...sources.permanent,
        { id: 'test-bonus', name: 'Test bonus', health: { army: 40 }, strength: { army: 12 } },
      ],
    }));
  });
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();
  const totals = lastResult()?.request.totals;
  if (totals === undefined) throw new Error('a run carries the bonuses it was computed under');

  // The engine's own two sums for this type, read exactly as the components read them (`unitBonus`), and
  // written as the March writes a signed percent.
  const bonus = unitBonus(unit, totals);
  const [healthLine, strengthLine] = bonusLines(bonus.health, bonus.strength);
  expect(healthLine).toBe('Health: +40%');
  expect(strengthLine).toBe('Strength: +12%');

  const [mark] = detailsButtons(unit);
  fireEvent.mouseEnter(mark as HTMLElement);
  expect(await screen.findByText(healthLine)).toBeTruthy();
  expect(screen.getByText(strengthLine)).toBeTruthy();
  // …and they are the mark's own description as well: a tooltip a screen reader only meets while it is
  // open is a figure half the readers do not get (design rule 24).
  const describedBy = mark?.getAttribute('aria-describedby') ?? '';
  expect(describedBy).not.toBe('');
  expect(document.getElementById(describedBy)?.textContent).toBe(`${healthLine} ${strengthLine}`);

  fireEvent.click(mark as HTMLElement);
  const sheet = await screen.findByRole('dialog', { name: unit.name });
  // The same two percentages, each on the label line of the bar it moves.
  expect(within(sheet).getByText(signedPercent(bonus.health))).toBeTruthy();
  expect(within(sheet).getByText(signedPercent(bonus.strength))).toBeTruthy();
  // And the bar under the health one is the value the engine stacks this type with (`effectiveUnit`), so
  // the gap a reader sees *is* the percent above it.
  expect(
    within(sheet).getByText(amount(Math.round((unit.health * (100 + bonus.health)) / 100))),
  ).toBeTruthy();
}, 15_000);

/**
 * **The sheet says where those two figures come from** (owner, 2026-09-28: *"in the troop detail, add a
 * field that details where they get their bonuses from for a troop, listing the bonuses applied source and
 * amount"*). One row per source — named as the Bonuses card names it, with the amount that source gives
 * **this** type — which is the Summary block of that card narrowed to the keys the type answers to.
 *
 * Two sources, one of which only a melee-answering type gets, and the rows have to **add up to the figure
 * on the bar above them**: a list that says something the bars do not is the sheet arguing with itself.
 */
test('the sheet lists every source of the type’s bonuses, with what each one gives it', async () => {
  const owner = profile();
  if (owner === undefined) throw new Error('the harness has an active profile');
  act(() => {
    updateSources(owner.id, (sources) => ({
      ...sources,
      permanent: [
        ...sources.permanent,
        { id: 'feeds-army', name: 'Army banner', health: { army: 40 }, strength: { army: 12 } },
        { id: 'feeds-melee', name: 'Melee drill', health: { melee: 25 }, strength: {} },
      ],
    }));
  });
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();
  const totals = lastResult()?.request.totals;
  if (totals === undefined) throw new Error('a run carries the bonuses it was computed under');

  const [mark] = detailsButtons(unit);
  fireEvent.click(mark as HTMLElement);
  const sheet = await screen.findByRole('dialog', { name: unit.name });

  const list = within(sheet).getByLabelText('Where the bonuses come from');
  const rows = [...list.querySelectorAll('dt')].map((term) => ({
    name: term.textContent,
    amount: term.nextElementSibling?.textContent ?? '',
  }));
  // Resolution order, and the melee source only where melee is one of the type's keys.
  expect(rows.map((row) => row.name)).toEqual(
    unit.keys.includes('melee') ? ['Army banner', 'Melee drill'] : ['Army banner'],
  );
  expect(rows[0]?.amount).toBe('+40% health / +12% strength');

  // The invariant: what the list says is what the bar says. The amounts are read back out of the text, so
  // this compares the screen against the engine's own sums (`unitBonus`) rather than one helper with itself.
  const sum = rows
    .map((row) => ({
      health: Number(/([+-][\d.]+)% health/.exec(row.amount)?.[1] ?? 0),
      strength: Number(/([+-][\d.]+)% strength/.exec(row.amount)?.[1] ?? 0),
    }))
    .reduce(
      (total, row) => ({ health: total.health + row.health, strength: total.strength + row.strength }),
      { health: 0, strength: 0 },
    );
  const bonus = unitBonus(unit, totals);
  expect(sum.health).toBeCloseTo(bonus.health, 6);
  expect(sum.strength).toBeCloseTo(bonus.strength, 6);
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

test('Enter in a count field is Done editing, as Escape is', async () => {
  // Owner, 2026-10-02: *"when editing counts, validate with enter key."*
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  fireEvent.click(screen.getByRole('button', { name: 'Edit counts' }));
  fireEvent.keyDown(screen.getByLabelText(`${unit.name} count`), { key: 'Enter' });

  expect(screen.queryAllByLabelText(`${unit.name} count`)).toHaveLength(0);
  expect(screen.getByRole('button', { name: 'Edit counts' }).getAttribute('aria-pressed')).toBe('false');
});

test('an emptied count keeps its pill until the mode is left', async () => {
  // Owner, 2026-09-21: *"if I erase the content of the field of a merc, the merc is deleted. It should
  // only be deleted on done editing cause it can prevent me from typing."* Erasing is the first half of
  // typing another figure, and the pill used to fall into the "Left out" row between the two, taking
  // the focused field with it.
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  fireEvent.click(screen.getByRole('button', { name: 'Edit counts' }));
  const field = screen.getByLabelText(`${unit.name} count`);
  fireEvent.change(field, { target: { value: '' } });

  // The box stays empty — that is what makes the next digit possible — and the march is already
  // computed on the 0 it means.
  await waitFor(() => {
    expect(useResultStore.getState().manualCounts[unit.id]).toBe(0);
  });
  expect(screen.getByLabelText(`${unit.name} count`)).toHaveProperty('value', '');
  expect(screen.queryByRole('button', { name: `${unit.name}, left out by you: put back` })).toBeNull();

  // …and the digits that follow land in the same field, which never moved.
  fireEvent.change(screen.getByLabelText(`${unit.name} count`), { target: { value: '12' } });
  await waitFor(() => {
    expect(useResultStore.getState().manualCounts[unit.id]).toBe(12);
  });
  expect(screen.getByLabelText(`${unit.name} count`)).toHaveProperty('value', '12');

  // Emptied again and left there, the removal lands where the owner asked for it: on "Done editing".
  fireEvent.change(screen.getByLabelText(`${unit.name} count`), { target: { value: '' } });
  await waitFor(() => {
    expect(useResultStore.getState().manualCounts[unit.id]).toBe(0);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Done editing' }));
  await waitFor(() => {
    expect(screen.getByRole('button', { name: new RegExp(`^${unit.name}, left out by`) })).toBeTruthy();
  });
}, 25_000);

test('the details are folded away until they are asked for, and open on the HP profile', async () => {
  renderWithTheme(<Page />);
  await generate();

  const details = screen.getByRole('button', { name: 'Details The HP profile and the battle story' });
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

  // The chart comes first and the story second (owner, 2026-09-18): the health stack is what a
  // glance is after, and the story's paragraphs used to stand between the fold and it.
  const headings = screen.getAllByRole('heading', { level: 4 }).map((node) => node.textContent);
  expect(headings).toEqual(['HP profile', 'Battle story']);

  // And above both of them, the split this march's damage came from — the first thing in the fold.
  const split = screen.getByLabelText("Where this march's damage came from");
  expect(split.compareDocumentPosition(screen.getByRole('heading', { level: 4, name: 'HP profile' }))).toBe(
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
  // This march hires nobody (authority 0 in the harness), so the hired figures say so rather than
  // dividing by nothing: "—" is what `ratio` prints for a resource of zero.
  expect(within(split).getByText('Troops')).toBeTruthy();
  expect(within(split).getByText('Mercs')).toBeTruthy();
  expect(within(split).getByText('Damage a merc')).toBeTruthy();
  expect(within(split).getByText('—')).toBeTruthy();
}, 25_000);

/**
 * The damage split on its own, on a fixture: the engine's `damageByPool` and the hired units the
 * march burns are the only two things it reads, so the fixture is those two.
 */
test('the damage split says what each pool hit for, its share, and what a hired unit was worth', () => {
  // **The enemy-first journal, not the midpoint** (S-108): the block is summed from the same journal the
  // plan's bar reads, so the two screens print one figure for one march (the owner: *"damage/silver differs
  // in the plan table and in the battle summary"*). Two army lines here, one a pool.
  renderWithTheme(
    <DamageSplit
      summary={{
        journals: {
          enemyFirst: {
            entries: [
              { n: 1, actor: 'army', unitId: 'archer-1', damage: 1_800_000, hits: 2 },
              { n: 2, actor: 'enemy', unitId: 'archer-1', damage: 9_999_999, hits: 1 },
              { n: 3, actor: 'army', unitId: 'archer-1', damage: 1_424_000, hits: 1 },
              { n: 4, actor: 'army', unitId: 'epic-monster-hunter-6', damage: 1_976_000, hits: 2 },
            ],
          },
        },
      }}
      stacks={[
        { unitId: 'archer-1', pool: 'leadership', count: 4_100 },
        // 260 hired units cost 26 for good: ten of them are one (`chunks`), which is what the plan's
        // trade prints as "Merc" for the same march.
        { unitId: 'epic-monster-hunter-6', pool: 'authority', count: 260 },
      ]}
    />,
  );

  const split = screen.getByLabelText("Where this march's damage came from");
  // Compact figures with the share beside them: 3.22M of 5.2M is 62 %, 1.98M is 38 %.
  expect(within(split).getByText('3.2M · 62%')).toBeTruthy();
  expect(within(split).getByText('2M · 38%')).toBeTruthy();
  // **The hired line over the hired units lost** (S-105): 1 976 000 over 26, not the march's whole
  // 5 200 000 over 26 — the owner read the old figure as *"a damage per hired almost above total damage"*.
  // Printed in the short notation since 2026-09-28, like the trade's "Per merc": 76 000 is "76K".
  expect(within(split).getByText('76K')).toBeTruthy();
  // Three figures, and no fourth: nothing fought out of the dominance pool (design rule 15).
  expect(within(split).queryByText('Monsters')).toBeNull();
  expect(within(split).getAllByRole('term')).toHaveLength(3);
});

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

/**
 * **What the type is filed under, under its name** (owner, 2026-09-28: *"in the details of a troop, add the
 * category it fits in (guardsmen, mounted for RD2; specialist melee for SW1…)"*).
 *
 * The heading carries the family and the tier; the line adds the squads and races the same type answers to —
 * which are the ones a bonus can be bought for, because both are read off the same keys the engine sums
 * (`facetWords`, `src/ui/domain`).
 */
test('the unit sheet says what its type is filed under', async () => {
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  fireEvent.click(detailsButtons(unit)[0] as HTMLElement);
  const sheet = await screen.findByRole('dialog', { name: unit.name });

  const words = facetWords(unit);
  expect(words.length, 'the first stack is a troop with a squad').toBeGreaterThan(0);
  expect(within(sheet).getByText(new RegExp(`· ${words.join(', ')}$`))).toBeTruthy();
  expect(squadUnknown(unit)).toBe(false);
});

/**
 * **A type the tables carry no squad for says so** — the other half of the same ask: *"alert if something is
 * missing"*. The four mercenaries of the 2026-09-18 pull carry a role and no squad, so no squad bonus reaches
 * them, and a heading that simply stopped would let a reader take the shorter list for the whole truth.
 */
test('a type with no squad on file is flagged in its sheet, where the bars are', async () => {
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 92 }];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup({ housing: { leadership: 4_100, authority: 2_000, dominance: 0 } });
  });
  renderWithTheme(<Page />);
  await generate();

  const unit = unitById('epic-monster-hunter-6');
  if (unit === undefined) throw new Error('the monster hunter is not in the tables');
  expect(squadUnknown(unit)).toBe(true);
  fireEvent.click(detailsButtons(unit)[0] as HTMLElement);

  const sheet = await screen.findByRole('dialog', { name: unit.name });
  // The heading names the family, the tier and the one facet the tags do carry…
  expect(within(sheet).getByText(/^Mercenaries VI · Guardsmen$/)).toBeTruthy();
  // …and the alert says what is missing, in the block the two bars are in.
  const alert = within(sheet).getByText(/^No squad is recorded for /);
  expect(alert.textContent).toContain('melee, ranged, mounted or flying');
}, 20_000);

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
  // No sizing line under the figures (owner, 2026-09-17): the Plan block below says what sized it.
  expect(screen.queryByText(/^Planned from the army:/)).toBeNull();

  // **Open on arrival** (S-59: the owner's 2026-09-16 review — "it becomes a new part of the recap"), with
  // the answer's headline on the row either way.
  const fold = screen.getByRole('button', { name: /^Plan/ });
  expect(fold.getAttribute('aria-expanded')).toBe('true');
  expect(fold.textContent).toContain('damage a march');

  // The trade the plan chose from, one row per answer the engine offers: a plan the player may be asked to
  // march.
  // Its name carries the unit its column heads stopped repeating (S-59 screen review, 2026-09-16), and it
  // is a `grid` because each of its rows is a control the player picks between.
  const trade = screen.getByRole('grid', {
    name: 'Every plan on the trade, one repeated march each',
  });
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
test('putting a type back on a plan re-sizes that stop inside the plan’s rules, and the pane says so', async () => {
  // S-104, the owner's report of 2026-09-19 — *"adding back troops doesn't shield the mercs"*, and what he
  // asked for instead: *"I'm able to put it back in and the plan then computes safely the best course of
  // action with the new parameters in mind (the spot selected, monster or any other troop put back) without
  // putting out another, because then we're manually fixing the reco without clicking Generate."* The plan
  // needs a hired stock to spread, so the harness hands it one, as the "answers with a plan" case does.
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

  const plan = useRunStore.getState().plan;
  const generated = lastResult();
  if (plan === null || !generated) throw new Error('the plan method answered with no plan');
  const marching = new Set(generated.result.stacks.map((stack) => stack.unitId));
  const absent = generated.request.units.find((unit) => unit.pool === 'leadership' && !marching.has(unit.id));
  if (!absent) throw new Error('this plan fields every troop type: nothing to put back');

  fireEvent.click(leftOutPill(absent, 'the search'));
  await waitFor(() => {
    expect(useRunStore.getState().resize).not.toBeNull();
  });

  // It went through the plan's own rules (`resizeMarchOver`) and not through the plain sizer.
  expect(useRunStore.getState().resize?.inPlan).toBe(true);
  // And the pane says so, in the one line under the pills (design rule 15).
  expect(screen.getByText(/^Re-sized with .*Nothing else was pushed out/)).toBeTruthy();

  const stacks = lastResult()?.result.stacks ?? [];
  const troops = stacks.filter((stack) => stack.pool === 'leadership');
  const hired = stacks.filter((stack) => stack.pool !== 'leadership');
  expect(troops.length).toBeGreaterThan(0);
  expect(hired.length).toBeGreaterThan(0);
  // The shelter: every hired stack strictly under the lowest troop stack (S-87), which is the whole report.
  expect(Math.max(...hired.map((stack) => stack.totalHp))).toBeLessThan(
    Math.min(...troops.map((stack) => stack.totalHp)),
  );
  /**
   * **And it spends no more of the stock than the campaign the bar is reading can afford** (S-107,
   * 2026-09-19): the bound is what the account sustains over the marches this stop plays
   * (`largestSustained`), not the stop's own count — which was the ceiling until then, and which made
   * taking a troop type out a no-op (the owner: *"I'm left with a merc stack that's below what could be
   * added with proper shielding"*).
   */
  const stop = plan.recommend ?? plan;
  const repeats = planRepeats(stop);
  for (const stack of hired) {
    const unit = generated.request.units.find((one) => one.id === stack.unitId);
    const held = generated.request.caps[stack.unitId];
    const bound =
      held === undefined
        ? Math.floor(generated.request.housing.authority / Math.max(1, unit?.cost ?? 1))
        : largestSustained(held, repeats);
    expect(stack.count).toBeLessThanOrEqual(bound);
  }
  // The bar is still the plan's — the tweaked march is the pane's — and no run was started.
  expect(useRunStore.getState().plan).toBe(plan);
  expect(lastResult()?.at).toBe(generated.at);
}, 30_000);

test('taking a troop out of the far-right stop re-computes the mercenaries upward', async () => {
  /**
   * **S-112**, the owner's report of 2026-09-20, the fourth on the same edit: *"if I choose total opt with
   * the highest merc spent slider option, and take out a troop, the number of mercs used in a march doesn't
   * go up. I thought we had simplified enough the slider that it would always mean 'select on the far right,
   * always get the most mercs I can safely use in march'."*
   *
   * The engine had been right since S-107 — the bound is what the stock sustains over the stop's marches,
   * never the stop's own count. The March pane defeated it by writing the plan's counts over
   * `StackRequest.caps`, which is where `capOf` reads the **stock** from: on the `all-in` (a `sequence`, so
   * `planRepeats` is 1) `largestSustained(stopCount, 1)` is the stop's count to the unit, so the ceiling the
   * fix removed was handed straight back. The troops re-computed and the mercenaries could not.
   *
   * So this test drives the two halves the report names — the bar at its far right, then a take-out — through
   * the real pane, and asks for the two things that were wrong: the caps are the **account's**, and the
   * hired count **rises**.
   */
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  const stock: Record<string, number> = {
    'epic-monster-hunter-6': 92,
    'arbalester-6': 76,
    'legionary-6': 72,
    'chariot-6': 37,
  };
  stocked.mercenaries.selected = Object.entries(stock).map(([id, cap]) => ({ id, cap }));
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup((current) => ({
      housing: { leadership: 4_100, authority: 2_000, dominance: 0 },
      options: { ...current.options, method: 'plan' },
    }));
  });
  renderWithTheme(<Page />);
  await generate();

  const plan = useRunStore.getState().plan;
  const generated = lastResult();
  if (plan === null || !generated) throw new Error('the plan method answered with no plan');

  /**
   * **The request the pane holds carries the account's own stock**, and not the hired spend the plan
   * decided. This is the whole defect: every reader downstream — `capOf` for the bound, `hiredStock` for the
   * recap's *"% of the stock"* — asks these caps what the account owns.
   */
  for (const [id, cap] of Object.entries(stock)) expect(generated.request.caps[id]).toBe(cap);

  // The far right of the bar: *"the most mercs I can safely use in march"*. Arrow keys rather than a press
  // on the track, because the track's geometry is zero in jsdom and the value is what this is about.
  const bar = screen.getByRole('slider', { name: 'Where on the trade to read the plan' });
  const last = plan.alternatives.length - 1;
  for (let step = 0; step < plan.alternatives.length; step += 1)
    fireEvent.keyDown(bar, { key: 'ArrowRight' });
  await waitFor(() => {
    expect(useRunStore.getState().planPick).toBe(last);
  });
  const stop = pickOf(plan, last);
  const hiredOf = (snapshot: ReturnType<typeof lastResult>): number =>
    (snapshot?.result.stacks ?? [])
      .filter((stack) => stack.pool !== 'leadership')
      .reduce((sum, stack) => sum + stack.count, 0);
  const before = hiredOf(lastResult());
  expect(before).toBeGreaterThan(0);

  // Out goes the **lowest** troop stack, which is the one the shelter stands on: its leadership goes to the
  // stacks that are left, the floor rises, and more hired units fit under it than the stop was standing on.
  const troopStacks = (lastResult()?.result.stacks ?? []).filter((stack) => stack.pool === 'leadership');
  const floorStack = troopStacks.reduce((low, stack) => (stack.totalHp < low.totalHp ? stack : low));
  const floorUnit = unitById(floorStack.unitId);
  if (!floorUnit) throw new Error(`${floorStack.unitId} is not in the tables`);
  fireEvent.click(stackPill(floorUnit, floorStack.count));
  await waitFor(() => {
    expect(useRunStore.getState().resize).not.toBeNull();
  });

  const after = lastResult();
  const hired = (after?.result.stacks ?? []).filter((stack) => stack.pool !== 'leadership');
  const troops = (after?.result.stacks ?? []).filter((stack) => stack.pool === 'leadership');
  // The type he took out is out, and the plan's own rules still drew the march.
  expect(after?.result.stacks.some((stack) => stack.unitId === floorUnit.id)).toBe(false);
  expect(useRunStore.getState().resize?.inPlan).toBe(true);

  // **The report, answered**: the mercenaries went up, not sideways.
  expect(hiredOf(after)).toBeGreaterThan(before);
  // At least one hired type stands above what that stop fielded — the count the old ceiling pinned it to.
  expect(hired.some((stack) => stack.count > (stop.counts[stack.unitId] ?? 0))).toBe(true);

  // And it is still safe: every hired stack under the lowest troop stack (S-87), and no type spent past what
  // the account sustains over the marches this stop plays (S-107), read off the **profile's** stock.
  expect(Math.max(...hired.map((stack) => stack.totalHp))).toBeLessThan(
    Math.min(...troops.map((stack) => stack.totalHp)),
  );
  const repeats = planRepeats(stop);
  for (const stack of hired) {
    const held = stock[stack.unitId];
    if (held === undefined) throw new Error(`${stack.unitId} is not one of the account's mercenaries`);
    expect(stack.count).toBeLessThanOrEqual(largestSustained(held, repeats));
  }
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

/**
 * S-112 — **the recap's hired line says what the stock bought** (owner, 2026-09-20: *"in the battle summary,
 * instead of the percent of total mercs spent, replace it with the dmg per merc using a small notation:
 * 265k, 1.23m… and note this should be updated with each generate and troop left out recalculation"*).
 *
 * The share of the account's stock was a fact about the account; this is a fact about the march, and it is
 * the one the bar's "Per merc" column already prints — so the two screens say one thing (design rule 5).
 */
test('the recap says what a hired unit bought, and re-says it when the march is re-sized', async () => {
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 92 }];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup({ housing: { leadership: 4_100, authority: 2_000, dominance: 0 } });
  });
  renderWithTheme(<Page />);
  await generate();

  /** The figure as the engine defines it (S-105 over S-108): the authority stacks' own worst opening. */
  const saidNow = (): string => {
    const snapshot = lastResult();
    if (!snapshot) throw new Error('no march');
    const lost = hiredLost(snapshot.result.stacks);
    const hiredDamage = worstDamageByPool(
      snapshot.summary.journals.enemyFirst,
      snapshot.result.stacks,
    ).authority;
    return `· ${compactTwo(hiredDamage / lost)} a merc`;
  };

  const line = screen.getByText(/a merc$/);
  expect(line.textContent).toBe(saidNow());
  // …and it is printed in the owner's own notation (2026-09-20): at most one decimal, spent only
  // where it buys a second digit — "325K", "1.2M", never "431.78K". (This fixture's hired stack is
  // the biggest on the field, so it strikes nothing in the worst opening and the figure is a plain
  // nought: the hired units bought no damage at all, which is the fact the line is there to carry.)
  expect(line.textContent).toMatch(/^· \d+(\.\d)?[KMB]? a merc$/u);
  // The share of the account's whole stock is gone from the card, which is what the figure replaced.
  expect(screen.queryByText(/% of \d/)).toBeNull();

  // **And it follows a re-size, not just a Generate.** Leaving a troop type out re-sizes the march in place
  // (`resizeMarch`) — the hired stacks are re-derived under a new troop floor (S-107), so both halves of
  // this ratio move and the card has to be reading the march it is drawing.
  const before = line.textContent;
  // A **troop** type, explicitly: leaving the hired stack out would leave nothing hired to divide by, and
  // the line would rightly disappear instead of moving (design rule 15). The first stack of this march is
  // the hired one, so the index is found rather than assumed.
  const troopAt = lastResult()?.result.stacks.findIndex((stack) => stack.pool === 'leadership') ?? -1;
  if (troopAt < 0) throw new Error('this march fields no troops');
  const { unit, count } = stackAt(troopAt);
  fireEvent.click(stackPill(unit, count));
  await waitFor(() => {
    expect(lastResult()?.result.stacks.some((stack) => stack.unitId === unit.id)).toBe(false);
  });
  await waitFor(() => {
    expect(screen.getByText(/a merc$/).textContent).toBe(saidNow());
  });
  expect(screen.getByText(/a merc$/).textContent).not.toBe(before);
}, 30_000);

test('a thin shelter is a faint line under the army, and a hired stack over the floor a plainer one', async () => {
  // S-141 (owner, 2026-09-24: *"Let's perhaps add a faint warning ? at least if it at 0.01%"*). The fixture of
  // the test above: its hired stack is the biggest on the field, so it is not sheltered at all.
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 92 }];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup({ housing: { leadership: 4_100, authority: 2_000, dominance: 0 } });
  });
  renderWithTheme(<Page />);
  await generate();
  const snapshot = lastResult();
  if (!snapshot) throw new Error('no result');
  const hunter = unitById('epic-monster-hunter-6');
  const troops = snapshot.result.stacks.filter((stack) => stack.pool === 'leadership');
  const lowest = troops.reduce((low, stack) => (stack.totalHp < low.totalHp ? stack : low));
  const troop = unitById(lowest.unitId);
  if (!hunter || !troop) throw new Error('the fixture’s units are not in the tables');

  // Not sheltered: the stronger sentence, in the body ink rather than the muted one.
  const over = screen.getByText(
    `Your ${hunter.name} stack is heavier than your ${troop.name} stack, so it falls before your troops.`,
  );
  expect(over.getAttribute('data-shelter')).toBe('over');
  expect(over.getAttribute('style') ?? '').not.toContain('dimmed');
  // No box and no icon: the line is plain text inside the army, not an alert.
  expect(over.closest('[role="alert"]')).toBeNull();

  /** The march on screen with its hired stack `margin` under the troop floor. */
  const shelteredBy = (margin: number): void => {
    act(() => {
      useResultStore.setState({
        last: {
          ...snapshot,
          result: {
            ...snapshot.result,
            stacks: snapshot.result.stacks.map((stack) =>
              stack.unitId === hunter.id
                ? { ...stack, totalHp: Math.floor(lowest.totalHp * (1 - margin)) }
                : stack,
            ),
          },
        },
      });
    });
  };

  shelteredBy(0.0001);
  // The troop floor here is a few tens of thousands of HP, so one HP is a few thousandths of a percent and the
  // margin prints as "0.01%" give or take its second digit; the exact figure is `shelter.test.ts`'s.
  const thin = screen.getByText(
    new RegExp(
      `^Your ${hunter.name} stack is only 0\\.01\\d?% lighter than your ${troop.name} stack: ` +
        'a small HP difference in game could see it fall before your troops\\.$',
      'u',
    ),
  );
  expect(thin.getAttribute('data-shelter')).toBe('thin');
  // Faint: the theme's muted ink, at the pane's meta size.
  expect(thin.getAttribute('style')).toContain('dimmed');

  shelteredBy(0.015);
  expect(screen.getByText(/only 1\.5% lighter/)).toBeTruthy();

  shelteredBy(0.03);
  expect(document.querySelector('[data-shelter]')).toBeNull();

  // **And it reads a hand edit**: the generated march back, then the hired stack typed down to one unit —
  // which the troops shelter by far more than 2 %, so the line goes.
  act(() => {
    useResultStore.setState({ last: snapshot });
  });
  expect(document.querySelector('[data-shelter="over"]')).not.toBeNull();
  act(() => {
    useResultStore.getState().editCount(hunter.id, 1);
  });
  await waitFor(() => {
    expect(document.querySelector('[data-shelter]')).toBeNull();
  });
}, 30_000);

// ---- The sheltered raise (S-142) ------------------------------------------------------------------
/**
 * The march **as the pills show it**, which is not the same thing as the result the engine filed: every
 * assertion below is about what the player reads and copies, not about what `useResultStore.last` holds —
 * the raise is a replay of the counts on the march on screen, and the generated answer is deliberately
 * left exactly as it came out of the search.
 */
function shownCounts(): Record<string, number> {
  const out: Record<string, number> = {};
  for (const tile of document.querySelectorAll('#march [data-stack]')) {
    const label = tile.getAttribute('data-stack');
    if (label !== null) out[label] = Number(tile.getAttribute('data-count'));
  }
  return out;
}

/** Every stack on screen, with the pool that pays for it and its health a unit, off the filed result. */
function shownStacks(): { label: string; pool: string; hp: number; count: number }[] {
  const counts = shownCounts();
  return (lastResult()?.result.stacks ?? []).map((stack) => {
    const unit = unitById(stack.unitId);
    return {
      label: unit?.label ?? stack.unitId,
      pool: stack.pool,
      hp: stack.hpPerUnit,
      count: counts[unit?.label ?? stack.unitId] ?? 0,
    };
  });
}

/** The total HP of the largest hired stack on screen, and of the lowest troop stack it must stay under. */
function shelterNow(): { hired: number; floor: number } {
  const shown = shownStacks();
  const total = (one: { hp: number; count: number }): number => one.hp * one.count;
  const troops = shown.filter((one) => one.pool === 'leadership' && one.count > 0).map(total);
  const hired = shown.filter((one) => one.pool !== 'leadership' && one.count > 0).map(total);
  return { hired: Math.max(...hired), floor: Math.min(...troops) };
}

/**
 * **An army whose plan stops below the shelter** — the case the whole control is for. The plan spreads the
 * stock over `CAMPAIGN.marches` marches, so on a troop floor this high it fields far fewer mercenaries than
 * the troops would shelter (measured on this seed: 30 of the 44 that fit); a raise spends one march's worth
 * of a stock the account owns.
 */
async function generateFromAPlan(): Promise<void> {
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 92 }];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup((current) => ({
      housing: { leadership: 12_000, authority: 2_000, dominance: 0 },
      options: { ...current.options, method: 'plan' },
    }));
  });
  renderWithTheme(<Page />);
  await generate();
}

const raiseControl = (pool: string): HTMLElement =>
  screen.getByRole('radiogroup', { name: `${pool} counts` });

test('the raise is offered on a hired pool, and lifts the counts where the troops shelter them', async () => {
  await generateFromAPlan();
  const before = shownCounts();
  expect(Object.keys(before).length, 'the plan fields no hired stack to raise').toBeGreaterThan(0);

  // A march with no monsters has no monsters' control, and the troops are what shelters: never raised.
  expect(screen.queryByRole('radiogroup', { name: 'Monster counts' })).toBeNull();
  expect(screen.queryByRole('radiogroup', { name: 'Troop counts' })).toBeNull();

  const filed = lastResult();
  chooseRaise('most');
  await waitFor(() => {
    expect(shownCounts()).not.toEqual(before);
  });

  // **No Generate was run**: the answer the search filed is the same object, untouched.
  expect(lastResult()).toBe(filed);

  // And every stack it moved stands strictly under the lowest troop stack — the promise of the control.
  const { hired, floor } = shelterNow();
  expect(hired).toBeLessThan(floor);
});

test('“as is” puts the generated counts back, and the raise is one replay, not a solve', async () => {
  await generateFromAPlan();
  const generated = shownCounts();
  const mercenaries = raiseControl('Mercenary');

  chooseRaise('most');
  await waitFor(() => {
    expect(shownCounts()).not.toEqual(generated);
  });
  // The sentence under the figures says what happened, in the same muted ink as the hand-edit line.
  expect(screen.getByText(/Raised to what the troops shelter/)).toBeTruthy();

  fireEvent.click(within(mercenaries).getByRole('radio', { name: 'As is' }));
  await waitFor(() => {
    expect(shownCounts()).toEqual(generated);
  });
  expect(screen.queryByText(/Raised to what the troops shelter/)).toBeNull();
});

test('the damage positions are raises too, and they add no line to the pane', async () => {
  await generateFromAPlan();
  const control = raiseControl('Mercenary');
  const plan = shownCounts();

  // **The control offers three segments** (owner, 2026-10-07): `As is`, `Tight`, and `Tight (old)` beside it
  // for the comparison.
  expect(within(control).getAllByRole('radio')).toHaveLength(3);
  expect(within(control).queryByRole('radio', { name: 'Best' })).toBeNull();

  // `Most` first, so the comparison below has the ceiling to measure the damage answer against — and so the
  // pane is in the state the sentence is drawn in before a damage position suppresses it (`MarchFoot.tsx`).
  chooseRaise('most');
  await waitFor(() => {
    expect(screen.getByText(/Raised to what the troops shelter/)).toBeTruthy();
  });
  const most = shownCounts();

  chooseRaise('v2');
  await waitFor(() => {
    expect(useRunStore.getState().raiseModes).toEqual({ authority: 'v2', dominance: 'v2' });
  });
  // The position that promises **damage** and not units: what it fields is at least the plan's own counts
  // (it is a raise, never a cut) and never more than `Most` would field (the same ceiling bounds it).
  const best = shownCounts();
  for (const [label, count] of Object.entries(best)) {
    expect(count, `${label} fell below the plan's own count`).toBeGreaterThanOrEqual(plan[label] ?? 0);
    expect(count, `${label} went past what Most fields`).toBeLessThanOrEqual(most[label] ?? count);
  }
  // **And the March says nothing about it** (owner, 2026-09-29: *"it moves the ui its unpleasant"*): the
  // segment and its tooltip are the disclosure, and neither `Most`'s sentence nor a new one is drawn.
  expect(screen.queryByText(/Raised to what the troops shelter/)).toBeNull();
  expect(screen.queryByText(/hits hardest with under the troops/)).toBeNull();
}, 30_000);

test('one position over both hired blocks, for every segment and not only the searched ones', async () => {
  /**
   * **The two controls are two views of one rule** (S-149; owner, 2026-09-30: *"make it linked between monsters
   * and merc (it's already the case for tight normally)"*). `Best v2`, `Safe` and `Tight` always were — each is
   * one search walking both pools — and the unit positions were not: a press on the mercenaries' block left the
   * monsters where they stood. The owner asked for the same rule on all six, which is also what every row
   * under the plan is priced as (`positions.ts`), so the press and the table now mean one thing.
   */
  await generateFromAPlan();
  chooseRaise('most');
  await waitFor(() => {
    expect(useRunStore.getState().raiseModes).toEqual({ authority: 'most', dominance: 'most' });
  });

  // The block a press lands on is not part of the question: the store has no pool to write over, so the two
  // entries cannot come apart — which is the whole of the promise, and why `setRaiseMode` takes no pool.
  act(() => {
    useRunStore.getState().setRaiseMode('tight');
  });
  expect(useRunStore.getState().raiseModes).toEqual({ authority: 'tight', dominance: 'tight' });
  act(() => {
    useRunStore.getState().setRaiseMode('off');
  });
  expect(useRunStore.getState().raiseModes).toEqual({ authority: 'off', dominance: 'off' });
}, 30_000);

test('the position is remembered: the next Generate arrives already raised', async () => {
  await generateFromAPlan();
  chooseRaise('most');
  await waitFor(() => {
    expect(screen.getByText(/Raised to what the troops shelter/)).toBeTruthy();
  });

  await generate();

  // The rule outlived the run it was set in — the owner's *"remember position when clicking generate again"* —
  // and it is one rule: both hired pools carry it (S-149).
  expect(useRunStore.getState().raiseModes).toEqual({ authority: 'most', dominance: 'most' });
  const filed = lastResult();
  const counts = shownCounts();
  const raised = (filed?.result.stacks ?? []).some(
    (stack) => stack.pool === 'authority' && (counts[unitById(stack.unitId)?.label ?? ''] ?? 0) > stack.count,
  );
  expect(raised, 'the new march came back at the generated counts').toBe(true);
  expect(screen.getByText(/Raised to what the troops shelter/)).toBeTruthy();
}, 30_000);

test('a count typed by hand is the player’s last word, and wins over the raise', async () => {
  await generateFromAPlan();
  chooseRaise('most');
  await waitFor(() => {
    expect(screen.getByText(/Raised to what the troops shelter/)).toBeTruthy();
  });

  const hunter = unitById('epic-monster-hunter-6');
  if (hunter === undefined) throw new Error('the hunter is not in the tables');
  act(() => {
    useResultStore.getState().editCount(hunter.id, 3);
  });
  await waitFor(() => {
    expect(shownCounts()[hunter.label]).toBe(3);
  });
  // The raise is still standing for the rest: the position is not undone by a typed figure.
  expect(useRunStore.getState().raiseModes.authority).toBe('most');
});

test('a sizer’s march offers no raise: its exact fill has already taken the pool and the shelter', async () => {
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 92 }];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup((current) => ({
      housing: { leadership: 12_000, authority: 2_000, dominance: 0 },
      // Tier ladder, the default: `sizePool` fills authority to the brim, so there is nothing to ask for.
      options: { ...current.options, method: 'elite' },
    }));
  });
  renderWithTheme(<Page />);
  await generate();

  // The mercenary **is** marching — the pool is drawn — and the control is not, because nothing it could
  // offer is left (design rule 15).
  expect(shownStacks().some((stack) => stack.pool === 'authority')).toBe(true);
  expect(screen.queryByRole('radiogroup', { name: 'Mercenary counts' })).toBeNull();
}, 30_000);

test('the exhaustive position is one position over both blocks, and draws no line either', async () => {
  await generateFromAPlan();
  const plan = shownCounts();

  chooseRaise('v2');
  // **One position, not two** (S-143b; owner, 2026-09-29: *"give another options for both"*): the search
  // walks the mercenaries and the monsters together, so pressing the segment on either block puts both of
  // them on it and the two controls are two views of one standing rule.
  await waitFor(() => {
    expect(useRunStore.getState().raiseModes).toEqual({ authority: 'v2', dominance: 'v2' });
  });

  // The answer arrives from the client and it is a raise on the same bounds as the four shipped positions:
  // never below the plan's own count for that stack.
  await waitFor(() => {
    for (const [label, count] of Object.entries(shownCounts())) {
      expect(count, `${label} fell below the plan’s own count`).toBeGreaterThanOrEqual(plan[label] ?? 0);
    }
  });
  // **And it really is the search's answer and not the seed still standing**: the entry is settled for the
  // march and position on screen, which is the state the loader in the segment stops on. A test that only
  // looked at the figures could pass on the climb's counts alone.
  const { entry } = useRaiseSearchStore.getState();
  const filed = useResultStore.getState().last;
  expect(entry?.status).toBe('done');
  expect(filed).not.toBeNull();
  if (filed !== null) {
    expect(entry?.key).toBe(raiseSearchKey(filed.result, { authority: 'v2', dominance: 'v2' }));
  }
  // **And it says nothing in the pane**, for `Best`'s reason and in `Best`'s own words: the segment and its
  // tooltip are the disclosure, and a line that appeared with every press would move the pane.
  expect(screen.queryByText(/Raised to what the troops shelter/)).toBeNull();
  expect(screen.queryByText(/hits hardest with under the troops/)).toBeNull();
}, 60_000);

test('the chosen segment carries the wait itself, and the control says it is busy', () => {
  /**
   * **The one state the journeys cannot reach** (S-143b): the e2e's army has a box of a few dozen vectors,
   * so `Best v2` answers before a frame is painted and the loader is never seen. It is the state a real
   * account sits in for up to fifty seconds, so it is drawn here directly — inside the segment's own label,
   * which is what keeps the pane from shifting while the search runs.
   */
  const { container, rerender } = renderWithTheme(
    <MarchRaiseControl pool="authority" value="tight" searching trades={null} onChange={() => undefined} />,
  );
  const control = screen.getByRole('radiogroup', { name: 'Mercenary counts' });
  expect(control.getAttribute('aria-busy')).toBe('true');
  // The mark is *in* the segment the player pressed, and it goes when the answer does. `toBeTruthy` and not
  // `not.toBeNull`: a selector that matched nothing at all would satisfy the latter.
  expect(container.querySelectorAll('.mantine-Loader-root')).toHaveLength(1);
  // **In the `Best v2` segment and nowhere else**: the mark belongs in the box the player pressed, since a
  // line of text arriving under the figures is the thing this control is not allowed to do.
  const mark = container.querySelector('.mantine-Loader-root');
  expect(mark?.closest('.mantine-SegmentedControl-control')?.textContent).toContain('Tight');

  rerender(
    <MarchRaiseControl
      pool="authority"
      value="tight"
      searching={false}
      trades={null}
      onChange={() => undefined}
    />,
  );
  expect(control.getAttribute('aria-busy')).toBe('false');
  expect(container.querySelectorAll('.mantine-Loader-root')).toHaveLength(0);
});

test('a March edit asks the search again rather than merging the previous march’s answer', async () => {
  /**
   * **The defect the adversarial review of 2026-09-29 found** (S-143b). `resizeMarch` re-files the re-sized
   * march under the **same stamp** on purpose (*"the same run, re-sized"*, `generate.ts`), so a search key
   * built on `snapshot.at` let an answer asked about the march *before* a put-back be merged into the march
   * *after* it — silently, `status` already `done`, with the shelter line suppressed because a raise is on.
   * The troops that come back lower the floor, so those counts can sit over the new ceiling and under the
   * new plan's own count. The key names the result object now, and this holds it there.
   */
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

  const generated = lastResult();
  if (!generated) throw new Error('the plan method answered with no march');
  const marching = new Set(generated.result.stacks.map((stack) => stack.unitId));
  const absent = generated.request.units.find((unit) => unit.pool === 'leadership' && !marching.has(unit.id));
  if (!absent) throw new Error('this plan fields every troop type: nothing to put back');

  chooseRaise('v2');
  await waitFor(() => {
    expect(useRaiseSearchStore.getState().entry?.status).toBe('done');
  });
  const before = useRaiseSearchStore.getState().entry?.key;

  fireEvent.click(leftOutPill(absent, 'the search'));
  await waitFor(() => {
    expect(useRunStore.getState().resize).not.toBeNull();
  });

  // The answer that belonged to the previous march is gone with it: the new march re-asks, under a new key,
  // and until it lands the pane draws the climb's counts on the *new* march — never the old ones.
  expect(useRaiseSearchStore.getState().entry?.key ?? null).not.toBe(before);
  const { hired, floor } = shelterNow();
  expect(hired).toBeLessThan(floor);
}, 60_000);

test('the capped positions are the same joint search, and Safe spends no more stock than Best', async () => {
  /**
   * **The two positions S-144 adds, driven the way a player drives them** (owner, 2026-09-29: *"we could have a
   * safe best-v2 that is bestv2 but accounting for merc lost and dmg/merc"*). `safe` is `v2`'s own search under
   * a budget of authority chunks — the burn `marchOf` counts — so the promise is checked on the march the pane
   * is actually showing: **a raise**, never below the plan's own count, and **never burning more of the hired
   * stock than the climb** on the same march. What is asserted here is the promise and not a figure,
   * because the figure moves with the army while the promise is the position.
   */
  await generateFromAPlan();
  const plan = shownCounts();

  chooseRaise('safe');
  // One standing rule over both blocks, exactly as `Best v2` is (S-143b): the search walks them together.
  await waitFor(() => {
    expect(useRunStore.getState().raiseModes).toEqual({ authority: 'safe', dominance: 'safe' });
  });
  await waitFor(() => {
    expect(useRaiseSearchStore.getState().entry?.status).toBe('done');
  });

  const filed = lastResult();
  expect(filed).not.toBeNull();
  if (filed === null) return;
  // The answer is the capped search's own and not the climb still standing: filed under the safe key.
  expect(useRaiseSearchStore.getState().entry?.key).toBe(
    raiseSearchKey(filed.result, { authority: 'safe', dominance: 'safe' }),
  );

  const shown = shownCounts();
  for (const [label, count] of Object.entries(shown)) {
    expect(count, `${label} fell below the plan’s own count`).toBeGreaterThanOrEqual(plan[label] ?? 0);
  }

  const own = countsOf(filed.result);
  const shipped = raisedCounts(filed.request, filed.result, { authority: 'v2', dominance: 'v2' }) ?? {};
  expect(burnOf(filed.result, { ...own, ...shown })).toBeLessThanOrEqual(
    burnOf(filed.result, { ...own, ...shipped }),
  );
}, 60_000);

/**
 * **A position the plan has already priced** (S-149; owner, 2026-09-30: *"make the positions selector (as is,
 * tight…) use the already computed assemblyscript values (should be same as engine/TS)"*).
 *
 * The block under the plan prices the five positions on every stop of the bar, in the wasm, before a player
 * presses anything — and a press used to answer the same question again through the exhaustive raise's search,
 * measured at 2.7 ms median and up to 51 s (`out/182-v2-cost.md`). The suite's own client is the inline one,
 * where the block is deliberately not priced at all (`positionsSearch.ts` stops on a client with no worker, and
 * a whole bar of positions there is minutes), so the table is planted here the way the worker would file it —
 * and what is asserted is the **asking**: the press lands on that row, and no search is started for an answer
 * already in hand.
 */
function pricedBar(counts: Record<string, number>): PositionTrades {
  const zero = { damage: 0, mercLost: 0, units: 0, silver: 0, gold: 0, seconds: 0, hiredDamage: 0 };
  return {
    own: zero,
    rows: (['tens', 'most', 'v2', 'safe', 'tight'] as const).map((mode) => ({
      mode,
      counts,
      how: null,
      space: 0,
      scored: 0,
      ...zero,
    })),
  };
}

/** Plant the bar's tables for the run on screen: every stop of it, priced as the worker would have. */
function plantPricedBar(counts: Record<string, number>): void {
  const snapshot = lastResult();
  const plan = useRunStore.getState().plan;
  if (snapshot === null || plan === null) throw new Error('the plan method filed no plan and no march');
  const at = useRunStore.getState().planPick;
  usePositionsStore.setState({
    entry: {
      key: positionsKey(plan, snapshot.request),
      stops: plan.alternatives.map((_row, index) => (index === at ? pricedBar(counts) : null)),
    },
  });
}

test('a position the plan has already priced is landed on, and nothing is searched for it', async () => {
  await generateFromAPlan();
  const hunter = unitById('epic-monster-hunter-6');
  if (hunter === undefined) throw new Error('the hunter is not in the tables');
  const before = shownCounts()[hunter.label] ?? 0;
  expect(before, 'the plan fielded no mercenary to raise').toBeGreaterThan(0);

  // The bar as the block under the plan holds it: the stop on screen, with the hunter five higher — the
  // counts a press lands on, and a number nothing else in this fixture produces.
  const shown = lastResult();
  if (shown === null) throw new Error('the plan method answered with no march');
  plantPricedBar({ ...countsOf(shown.result), [hunter.id]: before + 5 });

  chooseRaise('most');
  await waitFor(() => {
    expect(shownCounts()[hunter.label]).toBe(before + 5);
  });
  // **The whole of the promise**: the answer was already in hand, so no search was asked for — the control
  // has no wait to draw, and the entry the search files is never written.
  expect(useRaiseSearchStore.getState().entry).toBeNull();
}, 30_000);

test('a march the plan did not size is not read off the table, and is searched instead', async () => {
  // The re-size re-files the march under the **same request and stamp** (`generate.ts`), so the table under
  // the plan is still the one it was — and it is now a raise of a march that is not on screen, over a shelter
  // the edit moved. The guard is the counts, and this is what it is for.
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

  const generated = lastResult();
  if (generated === null) throw new Error('the plan method answered with no march');
  plantPricedBar(countsOf(generated.result));

  // A March edit: a troop type the plan left out goes back in, and the march on screen is re-sized.
  const marching = new Set(generated.result.stacks.map((stack) => stack.unitId));
  const absent = generated.request.units.find((unit) => unit.pool === 'leadership' && !marching.has(unit.id));
  if (absent === undefined) throw new Error('this plan fields every troop type: nothing to put back');
  fireEvent.click(leftOutPill(absent, 'the search'));
  await waitFor(() => {
    expect(useRunStore.getState().resize).not.toBeNull();
  });

  // The table stands — the plan has not moved — and the control does **not** land on it: the March's own
  // path answers, which is the climb first and the search behind it.
  const before = useRaiseSearchStore.getState().entry;
  expect(before).toBeNull();
  chooseRaise('v2');
  await waitFor(() => {
    expect(useRaiseSearchStore.getState().entry?.status).toBe('done');
  });
}, 60_000);

// ---- What the stock buys (S-148) -----------------------------------------------------------------
/**
 * **What a hired stack burns of the account's stock, and what that buys** (owner, 2026-09-29: *"I need a way
 * to understand which merc is doing most damage using all my stock over a few marches until it runs out…
 * what would be good for me is to know how much damage a stack does, we can add this to the troop detail
 * pane. And maybe add a small calculation there, computing how much similar march I can do with my stock and
 * showing the total damages."*).
 *
 * The test's job is the **copy branches**, not the arithmetic: the chunks a march burns and the marches a
 * stock carries are `chunks` and `lastsMarches` (`./hired`, held against the engine's own in `hired.test.ts`),
 * and every figure asserted below is read back through the same function the sheet calls. What is pinned here
 * is the shape of the sentence — an English plural for two marches and up, the pointed "this march and no
 * more" for exactly one, and the plain fact for a count the stock cannot field once.
 */

/** A type's sheet, opened the way a player opens it: the mark in its pill's corner. */
async function openSheet(unitId: string): Promise<HTMLElement> {
  const unit = unitById(unitId);
  if (unit === undefined) throw new Error(`${unitId} is not in the tables`);
  fireEvent.click(detailsButtons(unit)[0] as HTMLElement);
  return screen.findByRole('dialog', { name: unit.name });
}

/**
 * The harness of the three stock cases: one hired type the account owns a count of, sized by an authority
 * pool the caller picks. A **small** pool is what puts the generated count under the cap — and that is the
 * case the owner asked about, since a stock only runs over several marches when a march fields less of it
 * than the account holds.
 */
function stockedAccount(authority: number, cap: number, leadership = 4_100): void {
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap }];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup({ housing: { leadership, authority, dominance: 0 } });
  });
}

/** The stock run the sheet's block is drawn from, read the way the component reads it. */
function stockOf(unitId: string): {
  row: ReturnType<typeof marchRows>[number];
  held: number;
  run: ReturnType<typeof stockRun>;
} {
  const snapshot = lastResult();
  if (snapshot === null) throw new Error('no march was generated');
  const row = marchRows(snapshot.request, snapshot.result, snapshot.result, snapshot.summary).find(
    (one) => one.unit.id === unitId,
  );
  if (row === undefined) throw new Error(`${unitId} is not marching`);
  const held = snapshot.request.caps[unitId];
  if (held === undefined) throw new Error(`${unitId} has no cap on this account`);
  return {
    row,
    held,
    run: stockRun(held, row.stack.count, row.damage),
  };
}

test('the unit sheet says how many marches the stock lasts, and what they come to', async () => {
  // 40 authority and 92 owned: the march fields far fewer than the account holds, which is the whole
  // question the block answers.
  stockedAccount(40, 92, 12_000);
  renderWithTheme(<Page />);
  await generate();

  const { row, held, run } = stockOf('epic-monster-hunter-6');
  const unit = row.unit;
  // **The total is the stack's own over the run** (the owner, 2026-10-02: *"remove the total damage 570M from
  // the march in all. its not helpful"*): the marches counted times this stack's damage in one march, and no
  // figure of the march's at all — so the sentence below can hold the count and the total to each other.
  expect(run.marches).toBeGreaterThan(1);
  expect(row.damage).toBeGreaterThan(0);
  expect(run.stackDamage).toBe(run.marches * row.damage);
  // And the count of marches is the engine's own, not a second opinion the sheet keeps.
  expect(run.marches).toBe(lastsMarches(held, row.stack.count));

  const sheet = await openSheet(unit.id);
  expect(within(sheet).getByText('How many marches the stock lasts')).toBeTruthy();
  expect(
    within(sheet).getByText(
      `You own ${amount(held)} ${unit.name}, and a march of this size burns ${amount(
        run.burn,
      )} of them for good.`,
    ),
  ).toBeTruthy();
  expect(
    within(sheet).getByText(
      `That is ${amount(run.marches)} marches like this one: ${compactTwo(
        run.stackDamage,
        2,
      )} damage from this stack in all.`,
    ),
  ).toBeTruthy();
  // The block sits between the two it continues and explains, in the sheet's own rhythm.
  const titles = [...sheet.querySelectorAll('h4')].map((node) => node.textContent);
  expect(titles).toEqual([
    'In this march',
    'How many marches the stock lasts',
    'Why this size',
    'Unit',
    'Where the bonuses come from',
  ]);
}, 20_000);

test('a stock that fields the count once says so, rather than pluralising one march', async () => {
  // The cap is what the marched count is here (2000 authority, 92 owned): `lastsMarches`' own `+ 1` is the
  // one march the count itself pays for, and the sentence says it in its own words.
  stockedAccount(2_000, 92);
  renderWithTheme(<Page />);
  await generate();

  const { row, held, run } = stockOf('epic-monster-hunter-6');
  expect(held).toBe(row.stack.count);
  expect(run.marches).toBe(1);

  const sheet = await openSheet(row.unit.id);
  expect(
    within(sheet).getByText(
      `That is this march and no more: ${compactTwo(run.stackDamage, 2)} damage from this stack.`,
    ),
  ).toBeTruthy();
  // …and never the plural the same figure would have produced.
  expect(within(sheet).queryByText(/marches like this one/)).toBeNull();
  // And the march's own total is nowhere in the block: the sentence is about this stack (S-148, amended).
  expect(sheet.textContent).not.toContain('from the march');
}, 20_000);

test('a count typed past the stock says the march runs past it, and promises nothing', async () => {
  // A hand-typed count can exceed the cap while the counts are edited (owner, 2026-09-21), and `marches`
  // comes back **unclamped** so this case is reachable rather than theoretical (`./hired`). Both damage
  // totals would be a fiction about marches nothing can field, so the block says the fact instead.
  stockedAccount(2_000, 92);
  renderWithTheme(<Page />);
  await generate();

  act(() => {
    useResultStore.getState().editCount('epic-monster-hunter-6', 96);
  });
  await waitFor(() => {
    expect(useResultStore.getState().manualCounts['epic-monster-hunter-6']).toBe(96);
  });

  const sheet = await openSheet('epic-monster-hunter-6');
  expect(
    within(sheet).getByText('You field 96 and own 92, so this march runs past your stock.'),
  ).toBeTruthy();
  expect(within(sheet).queryByText(/damage from this stack/)).toBeNull();
}, 20_000);

test('the stock block is not drawn for a troop, whose count is a price and never a stock', async () => {
  // A troop is retrained: no cap is ever written for it (`buildUnits`, `state/derive.ts:505` — `caps` comes
  // from `profile.mercenaries.selected` alone), and the engine's own reason is S-102's: only hired units are
  // rationed. The block is design rule 15's — nothing on screen without value.
  renderWithTheme(<Page />);
  await generate();
  const { unit } = stackAt();

  const sheet = await openSheet(unit.id);
  expect(within(sheet).getByText('In this march')).toBeTruthy();
  expect(within(sheet).queryByText('How many marches the stock lasts')).toBeNull();
  expect(lastResult()?.request.caps[unit.id]).toBeUndefined();
});

test('the stock block is not drawn for an uncapped mercenary, whose run-out cannot be counted', async () => {
  // "Unlimited" is a mercenary the player entered no owned count for: absent from `caps` by construction,
  // so there is no denominator and no run-out — the same line the recap's hired row reads as held.
  const root = newRoot();
  const stocked = root.profiles[0];
  if (stocked === undefined) throw new Error('newRoot() must create one profile');
  stocked.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: null }];
  act(() => {
    useStore.getState().replaceDocument(root);
    useStore.getState().updateActiveSetup({ housing: { leadership: 4_100, authority: 2_000, dominance: 0 } });
  });
  renderWithTheme(<Page />);
  await generate();

  const sheet = await openSheet('epic-monster-hunter-6');
  expect(within(sheet).getByText('In this march')).toBeTruthy();
  expect(within(sheet).queryByText('How many marches the stock lasts')).toBeNull();
  expect(lastResult()?.request.caps['epic-monster-hunter-6']).toBeUndefined();
}, 20_000);

test('the stock block is drawn only for a stack the march fields', async () => {
  // A type left out of the march has no stack to repeat, and one edited to nothing has none either: the
  // sheet is reachable for the first only by being put back (the left-out row's pill is the press that
  // returns it), so the case is drawn directly here — with the same totals a real run carries.
  renderWithTheme(<Page />);
  await generate();
  const totals = lastResult()?.request.totals;
  if (totals === undefined) throw new Error('a run carries the bonuses it was computed under');
  const unit = unitById('epic-monster-hunter-6');
  if (unit === undefined) throw new Error('the monster hunter is not in the tables');
  cleanup();

  renderWithTheme(
    <UnitSheet
      unit={unit}
      totals={totals}
      sources={[]}
      totalDamage={0}
      held={92}
      onClose={() => undefined}
      onEditCount={() => undefined}
    />,
  );
  expect(screen.getByText(/^Left out of this march/)).toBeTruthy();
  expect(screen.queryByText('How many marches the stock lasts')).toBeNull();

  // And no stock at all is the other absence: an account that owns none of the type has nothing to run out.
  cleanup();
  renderWithTheme(
    <UnitSheet
      unit={unit}
      totals={totals}
      sources={[]}
      totalDamage={0}
      held={0}
      onClose={() => undefined}
      onEditCount={() => undefined}
    />,
  );
  expect(screen.queryByText('How many marches the stock lasts')).toBeNull();
});

test('a run starts on Tight over both hired blocks, and Reset puts it back there', () => {
  // Owner, 2026-10-07: *"lets move it as default"*.
  useRunStore.setState({ raiseModes: NO_RAISE });
  useRunStore.getState().reset();
  expect(useRunStore.getState().raiseModes).toEqual(DEFAULT_RAISE);
  expect(DEFAULT_RAISE).toEqual({ authority: 'tight', dominance: 'tight' });
});

test('hovering As is previews the trade it offers against Tight, and says nothing under the chosen one', async () => {
  const reading = (damage: number, silver: number, gold: number) => ({
    damage,
    silver,
    gold,
    seconds: 0,
    mercLost: 0,
    units: 0,
    hiredDamage: 0,
  });
  const trades: PositionTrades = {
    own: reading(900, 80, 10),
    rows: [{ mode: 'tight', counts: {}, how: 'searched', space: 1, scored: 1, ...reading(1000, 100, 20) }],
  };
  renderWithTheme(
    <MarchRaiseControl
      pool="authority"
      value="tight"
      searching={false}
      trades={trades}
      onChange={() => undefined}
    />,
  );
  const asIs = screen.getByText('As is');
  fireEvent.focus(asIs);
  fireEvent.mouseEnter(asIs);
  const tip = await screen.findByRole('tooltip');
  expect(tip.textContent).toContain('The counts the march was generated with.');
  expect(tip.textContent).toContain('Damage 900');
  expect(tip.textContent).toContain('Silver 80');
  expect(tip.textContent).toContain('Gold 10');
  // Against Tight: 900 of 1000 is -10 %, 80 of 100 is -20 %, 10 of 20 is -50 %.
  expect(tip.textContent).toContain('-10%');
  expect(tip.textContent).toContain('-20%');
  expect(tip.textContent).toContain('-50%');
  // The accessible description carries the same figures, for a reader that never sees the tooltip.
  expect(
    screen.getByRole('radiogroup', { name: 'Mercenary counts' }).getAttribute('aria-describedby'),
  ).not.toBeNull();
  expect(document.body.textContent).toContain(
    'As is: The counts the march was generated with. Damage 900 (-10%)',
  );
  // Tight is the chosen one: its figures, with no change beside them.
  expect(document.body.textContent).toContain(
    'Tight: Raises the hired stacks without burning one more chunk of mercs',
  );
  expect(document.body.textContent).toContain('Silver 100, Gold 20.');
});
