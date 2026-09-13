// @vitest-environment jsdom
/**
 * The frame (design plan §5.1, frame V1): the landmarks a screen reader navigates by, where the
 * March is at each width, and the one keyboard shortcut. The section registry and the March
 * contract are both stubbed here — this is a test of the frame, not of what it frames, and the
 * five sections are being written in parallel.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { selectActiveSetup, useStore } from '@/state/store';

import { ThemeHarness } from '../kit/testRender';
import { useResultStore } from '../resultStore';
import { useRunStore } from '../sections/march/runStore';
import { DESKTOP_BAR } from './command';
import { Shell } from './Shell';
import { TWO_PANES } from './useMediaQuery';

const calls = vi.hoisted(() => ({ run: 0, cancel: 0 }));

vi.mock('../sections/march/generate', () => ({
  runGenerate: () => {
    calls.run += 1;
    return Promise.resolve();
  },
  cancelGenerate: () => {
    calls.cancel += 1;
  },
}));

/** The four setup cards, as the frame sees them: an anchor, a heading, nothing else. */
vi.mock('../sections', () => {
  const card = (id: string, title: string) => (): ReactNode => (
    <section id={id} aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`}>{title}</h2>
    </section>
  );
  return {
    SECTIONS: [
      { id: 'troops', title: 'Troops', Component: card('troops', 'Troops') },
      { id: 'mercenaries', title: 'Mercenaries', Component: card('mercenaries', 'Mercenaries') },
      { id: 'bonuses', title: 'Bonuses', Component: card('bonuses', 'Bonuses') },
      { id: 'battle', title: 'Battle', Component: card('battle', 'Battle') },
      { id: 'march', title: 'March', Component: card('march', 'March') },
    ],
  };
});

/** The March contract (M-08): the pieces the frame places, each saying where it landed. */
vi.mock('@/ui/sections/march', () => ({
  // The section carries the recap itself now, and on a desktop the whole pane is what sticks, so
  // the section is one block from the figures to the saved marches (owner, 2026-09-13). Generate is
  // not in it at that width — it is the command bar's, and only the phone's sheet keeps one
  // (design plan §5.6).
  MarchSection: (): ReactNode => (
    <section id="march" aria-labelledby="march-h">
      <h2 id="march-h">March</h2>
      <p>recap</p>
    </section>
  ),
  MarchRecap: (): ReactNode => <p>recap</p>,
  MarchQuickSummary: (): ReactNode => <span>quick summary</span>,
  MarchGenerateButton: ({ size }: { size?: string }): ReactNode => (
    <button type="button">Generate {size ?? 'md'}</button>
  ),
  // The frame owns the cached result now that the March lives in the sheet on a phone.
  restoreLastResult: () => false,
  amount: (value: number): string => String(value),
}));

const realMatchMedia = window.matchMedia;

/** Stand in for the browser: only the listed queries match. */
function stubMedia(matching: string[]): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media: string) => ({
      media,
      matches: matching.includes(media),
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

/** 1400 px: the supporting pane is beside the page, and the bar is the desktop one. */
function desktop(): void {
  stubMedia([TWO_PANES, DESKTOP_BAR]);
}

/** 1100 px: room for a row of wells, none for a pane — the March is still in the sheet. */
function tablet(): void {
  stubMedia([DESKTOP_BAR]);
}

function renderShell(): ReturnType<typeof render> {
  return render(<Shell />, { wrapper: ThemeHarness });
}

/**
 * A result the frame can announce. Only the two figures the sentence quotes are real; the rest is
 * the smallest shape `ResultSnapshot` accepts, because the frame reads nothing else.
 */
function fakeResult(stacks: number, avgDamage: number) {
  return {
    request: {} as never,
    result: { stacks: Array.from({ length: stacks }, () => ({})) } as never,
    summary: { avgDamage } as never,
    profileId: 'p',
    setupId: 's',
  };
}

/** The default document has an army but no housing, so a march is blocked until this is called. */
function withHousing(): void {
  useStore.getState().updateActiveSetup({ housing: { leadership: 4100, authority: 0, dominance: 0 } });
}

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
  useResultStore.getState().clear();
  useRunStore.getState().reset();
  calls.run = 0;
  calls.cancel = 0;
  stubMedia([]);
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'matchMedia', { configurable: true, writable: true, value: realMatchMedia });
});

test('the page is a banner, one main and a footer — and no jump bar', () => {
  renderShell();

  expect(screen.getByRole('banner')).toBeTruthy();
  expect(screen.getByRole('main')).toBeTruthy();
  expect(screen.getByRole('contentinfo')).toBeTruthy();
  expect(screen.queryByRole('navigation')).toBeNull();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
});

test('a keyboard reaches the calculator without walking the header', () => {
  renderShell();
  const skip = screen.getByRole('link', { name: 'Skip to the calculator' });
  expect(skip.getAttribute('href')).toBe('#main');
  expect(screen.getByRole('main').id).toBe('main');
});

test('under 1200 px the page is the setup alone — the March is not drawn twice', () => {
  const { container } = renderShell();

  // Design rule 5, resolved 2026-09-13: the March is the sheet, and nothing but the setup is in the
  // page under it (investigation 0011 measured 97 of the sheet's 98 lines repeated from the page).
  const ids = [...container.querySelectorAll('main section[id]')].map((node) => node.id);
  expect(ids).toEqual(['troops', 'mercenaries', 'bonuses', 'battle']);
  expect(container.querySelector('aside')).toBeNull();
  expect(screen.queryByRole('heading', { level: 2, name: 'March' })).toBeNull();
});

test('under 1024 px the command bar carries housing, the objective, the summary and Generate', () => {
  renderShell();

  // Row 1: the three pools as chips, and the fourth chip that opens the objective (§5.6).
  for (const pool of ['Leadership', 'Authority', 'Dominance']) {
    expect(screen.getByRole('button', { name: `${pool} 0` })).toBeTruthy();
  }
  expect(screen.getByRole('button', { name: 'Objective: No priority' })).toBeTruthy();
  // …and nothing is a field until a thumb asks for one.
  expect(screen.queryByRole('textbox', { name: 'Leadership' })).toBeNull();

  // Row 2: the answer, and Generate at the small size both bars use.
  const summary = screen.getByRole('button', { name: 'Open the march recap' });
  expect(within(summary).getByText('quick summary')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Generate sm' })).toBeTruthy();
  // No floating action button anywhere any more (design rule 2 as amended).
  expect(screen.queryByRole('button', { name: /^Generate march/ })).toBeNull();
});

test('a housing chip becomes a field where it stands, and writes the march', async () => {
  const user = userEvent.setup();
  renderShell();

  await user.click(screen.getByRole('button', { name: 'Leadership 0' }));
  const field = screen.getByRole('textbox', { name: 'Leadership' }) as HTMLInputElement;
  expect(field).toBe(document.activeElement);

  await user.keyboard('4100');
  expect(selectActiveSetup(useStore.getState())?.housing.leadership).toBe(4100);

  // Enter puts the figure back, in the chip's own place in the row. (The figure is grouped on the
  // page; the March's formatter is stubbed here, so it reads plainly.)
  await user.keyboard('{Enter}');
  await waitFor(() => {
    expect(screen.getByRole('button', { name: 'Leadership 4100' })).toBeTruthy();
  });
  expect(screen.queryByRole('textbox', { name: 'Leadership' })).toBeNull();
});

test('the summary opens a sheet that holds the whole March section', async () => {
  renderShell();
  fireEvent.click(screen.getByRole('button', { name: 'Open the march recap' }));

  const sheet = await screen.findByRole('dialog', { name: 'March' });
  expect(within(sheet).getByRole('button', { name: 'Close' })).toBeTruthy();
  // The whole March section is in it — and it is the only place the recap is written, because the
  // section carries the recap itself.
  expect(sheet.querySelector('#march')).not.toBeNull();
  expect(within(sheet).getByText('recap')).toBeTruthy();
});

test('a run that lands with the sheet shut is said out loud, and the bar is marked', async () => {
  renderShell();
  const bar = screen.getByRole('button', { name: 'Open the march recap' });
  // The app bar keeps a status line of its own for "Copied", so every live region is read together.
  const status = (): string =>
    screen
      .getAllByRole('status')
      .map((node) => node.textContent ?? '')
      .join('');
  expect(status()).toBe('');

  act(() => {
    useResultStore.getState().setResult(fakeResult(12, 19_639_721));
  });
  await waitFor(() => {
    expect(status()).toMatch(/^March generated: 12 stacks, 19639721 expected damage\./);
  });
  // The eye's half of the same signal, and only where motion is welcome (the class carries a
  // `prefers-reduced-motion` guard of its own).
  expect(bar.querySelector('[class*="pulse"]')).not.toBeNull();

  // Opening the sheet is reading the answer: there is nothing left to announce.
  fireEvent.click(bar);
  await waitFor(() => {
    expect(status()).toBe('');
  });
});

test('at 1400 px the March is the supporting pane, carrying the recap and no Generate', () => {
  desktop();
  const { container } = renderShell();

  const pane = container.querySelector('aside');
  if (pane === null) throw new Error('the supporting pane is missing');
  expect(within(pane as HTMLElement).getByText('recap')).toBeTruthy();
  // Generate lives in the command bar alone (design plan §5.6).
  expect(within(pane as HTMLElement).queryByRole('button', { name: /^Generate/ })).toBeNull();
  expect(within(pane as HTMLElement).getByRole('heading', { level: 2, name: 'March' })).toBeTruthy();

  // The setup keeps the other column, in registry order.
  const setup = [...container.querySelectorAll('main section[id]')]
    .filter((node) => pane.contains(node) === false)
    .map((node) => node.id);
  expect(setup).toEqual(['troops', 'mercenaries', 'bonuses', 'battle']);
});

test('at 1400 px the command bar is wells and a select, and the only Generate on the page', () => {
  desktop();
  renderShell();

  // The three pools are plain fields, filled in place — no chip to open first (design rule 9).
  for (const pool of ['Leadership', 'Authority', 'Dominance']) {
    expect(screen.getByRole('textbox', { name: pool })).toBeTruthy();
  }
  expect(screen.getByRole('combobox', { name: 'Objective' })).toBeTruthy();

  expect(screen.queryByRole('button', { name: 'Open the march recap' })).toBeNull();
  expect(screen.queryByText('quick summary')).toBeNull();
  expect(screen.getAllByRole('button', { name: /^Generate/ })).toHaveLength(1);
});

test('between 1024 and 1199 px the bar is the desktop one, and it carries the answer', () => {
  tablet();
  const { container } = renderShell();

  // The wells, not the chips the review found 341 px wide at this width.
  for (const pool of ['Leadership', 'Authority', 'Dominance']) {
    expect(screen.getByRole('textbox', { name: pool })).toBeTruthy();
  }
  expect(screen.queryByRole('button', { name: 'Leadership 0' })).toBeNull();
  expect(container.querySelector('[class*="bottomBar"]')).toBeNull();

  // …and the March still has no pane at this width, so the answer and its sheet are in the bar.
  expect(container.querySelector('aside')).toBeNull();
  expect(screen.getByRole('button', { name: 'Open the march recap' })).toBeTruthy();
});

test('the command bar is the only thing on the bottom edge, and the page reserves it', () => {
  desktop();
  const { container } = renderShell();

  const sticky = [...container.querySelectorAll('[class]')].filter((node) =>
    [...node.classList].some((name) => name.includes('commandDock') || name.includes('bottomBar')),
  );
  expect(sticky).toHaveLength(1);
  // …and it is the *last* block of the frame, sticky rather than fixed: its height is in the flow,
  // so the page reserves it and the last row of the setup is never hidden under it.
  const footer = screen.getByRole('contentinfo');
  const where = footer.compareDocumentPosition(sticky[0] as Node);
  expect(where & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('Tab walks the bar in the order a march is set up in', async () => {
  desktop();
  const user = userEvent.setup();
  renderShell();

  const order = [
    screen.getByRole('textbox', { name: 'Leadership' }),
    screen.getByRole('textbox', { name: 'Authority' }),
    screen.getByRole('textbox', { name: 'Dominance' }),
    screen.getByRole('combobox', { name: 'Objective' }),
    screen.getByRole('button', { name: 'Generate sm' }),
  ];

  order[0]?.focus();
  for (const next of order.slice(1)) {
    await user.tab();
    expect(document.activeElement).toBe(next);
  }
});

test('Ctrl + Enter generates from anywhere on the page, but never while blocked', () => {
  const { rerender } = renderShell();

  fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
  expect(calls.run).toBe(0);

  withHousing();
  rerender(<Shell />);
  fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });
  expect(calls.run).toBe(1);

  // ⌘ + Enter is the same shortcut on a Mac; Enter on its own is not a shortcut at all.
  fireEvent.keyDown(document, { key: 'Enter', metaKey: true });
  fireEvent.keyDown(document, { key: 'Enter' });
  expect(calls.run).toBe(2);
});
