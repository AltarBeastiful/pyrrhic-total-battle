// @vitest-environment jsdom
/**
 * The frame (design plan §5.1, frame V1): the landmarks a screen reader navigates by, where the
 * March is at each width, and the one keyboard shortcut. The section registry and the March
 * contract are both stubbed here — this is a test of the frame, not of what it frames, and the
 * five sections are being written in parallel.
 */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { ThemeHarness } from '../kit/testRender';
import { useResultStore } from '../resultStore';
import { useRunStore } from '../sections/march/runStore';
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
  // The section carries the recap and Generate itself now: on a desktop they are the head of the
  // sticky "march at a glance" block inside it, not something the pane wraps around it
  // (owner, 2026-09-13).
  MarchSection: (): ReactNode => (
    <section id="march" aria-labelledby="march-h">
      <h2 id="march-h">March</h2>
      <p>recap</p>
      <button type="button">Generate md</button>
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

/** 1400 px: the supporting pane is beside the page. Nothing else matches. */
function desktop(): void {
  stubMedia([TWO_PANES]);
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

test('under 1200 px the bottom app bar carries the summary and Generate', () => {
  renderShell();

  const summary = screen.getByRole('button', { name: 'Open the march recap' });
  expect(within(summary).getByText('quick summary')).toBeTruthy();
  // The bar's Generate is the small one; the pane's is the full-width one.
  expect(screen.getByRole('button', { name: 'Generate sm' })).toBeTruthy();
  // No floating action button anywhere any more (design rule 2 as amended).
  expect(screen.queryByRole('button', { name: /^Generate march/ })).toBeNull();
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

test('at 1400 px the March is the supporting pane, carrying the recap and Generate', () => {
  desktop();
  const { container } = renderShell();

  const pane = container.querySelector('aside');
  if (pane === null) throw new Error('the supporting pane is missing');
  expect(within(pane as HTMLElement).getByText('recap')).toBeTruthy();
  expect(within(pane as HTMLElement).getByRole('button', { name: 'Generate md' })).toBeTruthy();
  expect(within(pane as HTMLElement).getByRole('heading', { level: 2, name: 'March' })).toBeTruthy();

  // The setup keeps the other column, in registry order.
  const setup = [...container.querySelectorAll('main section[id]')]
    .filter((node) => pane.contains(node) === false)
    .map((node) => node.id);
  expect(setup).toEqual(['troops', 'mercenaries', 'bonuses', 'battle']);
});

test('at 1400 px there is no bottom bar and no second summary', () => {
  desktop();
  renderShell();

  expect(screen.queryByRole('button', { name: 'Open the march recap' })).toBeNull();
  expect(screen.queryByText('quick summary')).toBeNull();
  expect(screen.getAllByRole('button', { name: /^Generate/ })).toHaveLength(1);
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
