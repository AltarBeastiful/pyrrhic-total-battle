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

import { SECTIONS } from './index';

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
    render(<Component />);
    const unnamed: string[] = [];
    for (const role of NAMED_ROLES) {
      for (const element of screen.queryAllByRole(role, { hidden: true })) {
        if (accessibleName(element) === '') unnamed.push(`${role}: ${describeUnnamed(element)}`);
      }
    }
    expect(unnamed).toEqual([]);
  });

  test('anything with two states announces which one it is in', () => {
    const { container } = render(<Component />);

    // A pill is a toggle: `aria-pressed`, never colour alone.
    for (const pill of container.querySelectorAll('button[aria-pressed]')) {
      expect(['true', 'false']).toContain(pill.getAttribute('aria-pressed'));
    }
    for (const toggle of screen.queryAllByRole('switch', { hidden: true })) {
      expect(['true', 'false']).toContain(toggle.getAttribute('aria-checked'));
      expect(accessibleName(toggle)).not.toBe('');
    }
    // A collapsed body is announced as collapsed.
    for (const disclosure of container.querySelectorAll('button[aria-expanded]')) {
      expect(['true', 'false']).toContain(disclosure.getAttribute('aria-expanded'));
    }
  });
});

test('the sections that carry pills really expose them as toggles', () => {
  for (const [, Component] of sections.filter(([title]) =>
    ['Troops', 'Mercenaries', 'Bonuses', 'Enemy formation'].includes(title),
  )) {
    const { container, unmount } = render(<Component />);
    expect(container.querySelectorAll('[aria-pressed]').length).toBeGreaterThan(0);
    unmount();
  }
});

test('the enemy fields revealed by the Custom preset are labelled too', () => {
  const enemy = SECTIONS.find((section) => section.id === 'enemy');
  if (enemy === undefined) throw new Error('the enemy section left the registry');
  const Enemy = enemy.Component;
  render(<Enemy />);
  fireEvent.click(screen.getByRole('button', { name: 'Custom' }));

  const fields = screen.getAllByRole('textbox');
  expect(fields).toHaveLength(4);
  expect(fields.map(accessibleName)).toEqual(['Melee', 'Ranged', 'Mounted', 'Flying']);
});

test('every section is a landmark region named by its own heading', () => {
  for (const spec of SECTIONS) {
    const { container, unmount } = render(<spec.Component />);
    const region = container.querySelector(`section#${spec.id}`);
    expect(region).not.toBeNull();
    const heading = within(region as HTMLElement).getByRole('heading', { level: 2 });
    expect(region?.getAttribute('aria-labelledby')).toBe(heading.id);
    expect(heading.textContent).toContain(spec.title);
    unmount();
  }
});
