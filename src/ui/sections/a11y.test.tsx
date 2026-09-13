// @vitest-environment jsdom
/**
 * S-52 — the accessibility floor every section has to stay above.
 *
 * Two rules, checked on the real sections rather than on a mock: every control you can type in or
 * pick from has an accessible name, and every control with two states says which one it is in.
 * They are cheap to run and they catch the two regressions that actually happen — a field that
 * loses its label when a grid is refactored, and a pill that becomes a plain button.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';
import { ThemeHarness } from '@/ui/kit2/testRender';

import { SECTIONS } from './index';

/** Every section is rendered inside the provider `main.tsx` mounts, as the app renders it (M-01). */
function renderSection(ui: Parameters<typeof render>[0]): ReturnType<typeof render> {
  return render(ui, { wrapper: ThemeHarness });
}

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

/** The roles a player types into or picks from; each one needs a name they can hear. */
const NAMED_ROLES = ['textbox', 'searchbox', 'spinbutton', 'combobox', 'checkbox', 'radio'] as const;

function textOf(node: Element | null): string {
  return (node?.textContent ?? '').trim();
}

/**
 * The accessible name of a form control, computed the way a screen reader does for the four
 * labelling patterns this app uses: `aria-label`, `aria-labelledby`, `<label for>` and a wrapping
 * `<label>`.
 */
function accessibleName(element: HTMLElement): string {
  const aria = element.getAttribute('aria-label');
  if (aria !== null && aria.trim() !== '') return aria.trim();

  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy !== null) {
    const named = labelledBy
      .split(/\s+/)
      .map((id) => textOf(element.ownerDocument.getElementById(id)))
      .join(' ')
      .trim();
    if (named !== '') return named;
  }

  const { id } = element;
  if (id !== '') {
    const forLabel = element.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (textOf(forLabel) !== '') return textOf(forLabel);
  }

  const wrapping = element.closest('label');
  if (wrapping !== null && textOf(wrapping) !== '') return textOf(wrapping);

  return textOf(element) || (element.getAttribute('title') ?? '').trim();
}

function describeUnnamed(element: HTMLElement): string {
  return `<${element.tagName.toLowerCase()} type=${element.getAttribute('type') ?? '—'} class="${element.className}">`;
}

const sections: [string, ComponentType][] = SECTIONS.map((section) => [section.title, section.Component]);

describe.each(sections)('%s', (_title, Component) => {
  test('every field a player fills in has an accessible name', () => {
    renderSection(<Component />);
    const unnamed: string[] = [];
    for (const role of NAMED_ROLES) {
      for (const element of screen.queryAllByRole(role, { hidden: true })) {
        if (accessibleName(element) === '') unnamed.push(`${role}: ${describeUnnamed(element)}`);
      }
    }
    expect(unnamed).toEqual([]);
  });

  test('anything with two states announces which one it is in', () => {
    const { container } = renderSection(<Component />);

    // A tile or a pill that is pressed in says so: `aria-pressed` on a button, `checked` on the
    // checkbox a chip really is — never colour alone.
    for (const pill of container.querySelectorAll('button[aria-pressed]')) {
      expect(['true', 'false']).toContain(pill.getAttribute('aria-pressed'));
    }
    for (const box of screen.queryAllByRole('checkbox', { hidden: true })) {
      if (box instanceof HTMLInputElement) expect(typeof box.checked).toBe('boolean');
      else expect(['true', 'false']).toContain(box.getAttribute('aria-checked'));
      expect(accessibleName(box)).not.toBe('');
    }
    // The kit's switch is a native checkbox wearing `role="switch"`, so its state is the input's
    // own `checked`; anything else has to spell it out with `aria-checked`.
    for (const toggle of screen.queryAllByRole('switch', { hidden: true })) {
      const state = toggle.getAttribute('aria-checked');
      if (toggle instanceof HTMLInputElement) expect(typeof toggle.checked).toBe('boolean');
      else expect(['true', 'false']).toContain(state);
      expect(accessibleName(toggle)).not.toBe('');
    }
    // A collapsed body is announced as collapsed.
    for (const disclosure of container.querySelectorAll('button[aria-expanded]')) {
      expect(['true', 'false']).toContain(disclosure.getAttribute('aria-expanded'));
    }
  });
});

test('the army cards expose the two shapes a player picks with', () => {
  // Troops is a grid of tiles you press in and out; how a tile is built is the card's business —
  // a Mantine chip is a checkbox, a tile may be a pressed button — so what is asked for is a role
  // with two states and a name, not one attribute.
  const Troops = sections.find(([title]) => title === 'Troops')?.[1];
  if (Troops === undefined) throw new Error('the troops section left the registry');
  const { unmount } = renderSection(<Troops />);
  const toggles = [
    ...screen.queryAllByRole('checkbox', { hidden: true }),
    ...screen.queryAllByRole('switch', { hidden: true }),
    ...screen.queryAllByRole('button', { pressed: true, hidden: true }),
    ...screen.queryAllByRole('button', { pressed: false, hidden: true }),
  ];
  expect(toggles.length).toBeGreaterThan(0);
  for (const toggle of toggles) expect(accessibleName(toggle)).not.toBe('');
  unmount();

  // Mercenaries is the other shape: a searched list, never a wall of filter chips (design rule 11).
  const Mercenaries = sections.find(([title]) => title === 'Mercenaries')?.[1];
  if (Mercenaries === undefined) throw new Error('the mercenaries section left the registry');
  renderSection(<Mercenaries />);
  const options = screen.queryAllByRole('option', { hidden: true });
  expect(options.length).toBeGreaterThan(0);
  for (const option of options) expect(accessibleName(option)).not.toBe('');
});

test('the enemy fields revealed by the Custom preset are labelled too', () => {
  const battle = SECTIONS.find((section) => section.id === 'battle');
  if (battle === undefined) throw new Error('the battle section left the registry');
  const Battle = battle.Component;
  renderSection(<Battle />);
  fireEvent.click(screen.getByRole('radio', { name: 'Custom' }));

  const fields = screen.getAllByRole('textbox').map(accessibleName);
  for (const name of ['Melee', 'Ranged', 'Mounted', 'Flying']) expect(fields).toContain(name);
});

test('every section is a landmark region named by its own heading', () => {
  for (const spec of SECTIONS) {
    const { container, unmount } = renderSection(<spec.Component />);
    const region = container.querySelector(`section#${spec.id}`);
    // The March section is the contract's stub until M-08 lands; it becomes a region with it.
    if (region === null && spec.id === 'march') {
      unmount();
      continue;
    }
    expect(region).not.toBeNull();
    const heading = within(region as HTMLElement).getByRole('heading', { level: 2 });
    expect(region?.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent).toContain(spec.title);
    unmount();
  }
});
