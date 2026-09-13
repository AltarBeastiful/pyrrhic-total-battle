// @vitest-environment jsdom
/**
 * The Bonuses card, checked the way a player uses it (design plan §7.3, journey J3, D-34): the TOTAL
 * is four labelled figures in the header, captains, artifacts, permanent sources and titles are
 * TotalStack's chips, everything else is a row with a switch and a gear, and the editors are an
 * anchored popover (a level) or a sheet (a form) that repeats the TOTAL so the figures move in view.
 *
 * Everything is selected by role and by accessible name, so a class, a layout or a glyph can change
 * without a test noticing.
 */
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { captains as captainTable } from '@/data';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { BonusesSection } from './BonusesSection';
import { CAPTAIN_CAP_MESSAGE } from './CaptainChips';

// The card pulls in every data table and renders eighty-odd chips; under full-suite load the first
// render can exceed the default 5 s budget, which is the cost of the import, not a hang.
vi.setConfig({ testTimeout: 30_000 });

/**
 * The card is read with **reduced motion on**, which is a real setting we respect (rule 24) and the
 * one that makes a fold honest in jsdom: Mantine's `Collapse` then has no transition to run, so a
 * closed group is absent from the document and an open one is in it, with no timer in between.
 */
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
  // jsdom ships no `scrollIntoView`, and Mantine's combobox keeps the chosen option in view on a
  // timer after the test has moved on; without this the run ends on an unhandled rejection.
  Element.prototype.scrollIntoView ??= () => {};
  globalThis.localStorage.clear();
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

const profile = () => selectActiveProfile(useStore.getState());
const setup = () => selectActiveSetup(useStore.getState());

/** The card itself. */
function card(): HTMLElement {
  const node = document.querySelector('#bonuses');
  if (node === null) throw new Error('the Bonuses card is not on screen');
  return node as HTMLElement;
}

/** The four labelled figures of a TOTAL header, as a name → value map. */
function totals(scope: HTMLElement): Record<string, string> {
  const list = within(scope).getAllByLabelText('Army bonus totals')[0];
  if (list === undefined) throw new Error('no TOTAL on screen');
  const out: Record<string, string> = {};
  for (const term of list.querySelectorAll('dt')) {
    out[term.textContent ?? ''] = term.nextElementSibling?.textContent ?? '';
  }
  return out;
}

/** The line that unfolds the sources. */
const disclosure = (): HTMLElement => within(card()).getByRole('button', { name: /^Sources/ });

function expand(): void {
  const trigger = disclosure();
  if (trigger.getAttribute('aria-expanded') !== 'true') fireEvent.click(trigger);
}

/** Open one accordion group; a closed group is not in the document (`keepMounted={false}`). */
function openGroup(title: string): void {
  const control = within(card()).getByRole('button', { name: new RegExp(`^${title}`) });
  if (control.getAttribute('aria-expanded') !== 'true') fireEvent.click(control);
}

/** A captain chip body, by either of the two names it wears. */
function captainChip(name: string): HTMLElement {
  return (
    within(card()).queryByRole('checkbox', { name: `Send ${name} on this march` }) ??
    within(card()).getByRole('checkbox', { name: `${name}, riding with this march` })
  );
}

const captainGear = (name: string): HTMLElement =>
  within(card()).getByRole('button', { name: new RegExp(`^(Set|Change) ${name}’s level$`) });

/** A chip's visible label; Mantine draws it as a `<label for>` beside the input, not around it. */
function chipLabel(chip: HTMLElement): HTMLElement {
  const label = document.querySelector(`label[for="${chip.id}"]`);
  if (label === null) throw new Error(`no label for ${chip.id}`);
  return label as HTMLElement;
}

/** A kit `Select`: its input carries the combobox role, beside a hidden input of the same name. */
const chooseIn = async (
  user: ReturnType<typeof userEvent.setup>,
  scope: HTMLElement,
  label: string,
  option: string,
): Promise<void> => {
  await user.click(within(scope).getByRole('combobox', { name: label }));
  await user.click(screen.getByRole('option', { name: option }));
};

function typeNumber(scope: HTMLElement, label: string, value: string): void {
  const field = within(scope).getByLabelText(label);
  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
}

const done = (sheet: HTMLElement): void => {
  fireEvent.click(within(sheet).getByRole('button', { name: 'Done' }));
};

// ---- the header ---------------------------------------------------------------------------------
test('the header carries the TOTAL as four labelled figures', () => {
  renderWithTheme(<BonusesSection />);

  expect(within(card()).getByRole('heading', { level: 2, name: 'Bonuses' })).toBeTruthy();
  expect(totals(card())).toEqual({
    Health: '0 %',
    Strength: '0 %',
    Special: '0 %',
    'Sources on': '3',
  });
});

test('a source switched on with nothing typed in it is badged in the header', () => {
  renderWithTheme(<BonusesSection />);

  // VIP, the dragon and the unexplained remainder start switched on and empty.
  expect(within(card()).getByText('3 on but empty')).toBeTruthy();

  expand();
  openGroup('Other');
  fireEvent.click(within(card()).getByRole('switch', { name: 'Dragon' }));

  expect(setup()?.active.dragon).toBe(false);
  expect(within(card()).getByText('2 on but empty')).toBeTruthy();
});

test('the sources are folded away by default and the choice is remembered per device', () => {
  const first = renderWithTheme(<BonusesSection />);
  expect(disclosure().getAttribute('aria-expanded')).toBe('false');

  fireEvent.click(disclosure());
  expect(disclosure().getAttribute('aria-expanded')).toBe('true');
  expect(globalThis.localStorage.getItem('pyrrhic.ui.v1')).toContain('"bonusesExpanded":true');

  first.unmount();
  renderWithTheme(<BonusesSection />);
  expect(disclosure().getAttribute('aria-expanded')).toBe('true');
});

// ---- the captain chips --------------------------------------------------------------------------
test('the row shows the hero and every captain the tables know, and none of them is an Add button', () => {
  renderWithTheme(<BonusesSection />);
  expand();

  const row = within(card()).getByRole('group', { name: 'Captains and hero' });
  expect(within(row).getAllByRole('checkbox')).toHaveLength(captainTable.length + 1);
  expect(within(row).getByRole('checkbox', { name: 'Send Hero on this march' })).toBeTruthy();
  for (const record of captainTable) {
    expect(within(row).getByRole('checkbox', { name: new RegExp(record.name) })).toBeTruthy();
  }
  expect(within(card()).queryByRole('button', { name: /^Add captain/ })).toBeNull();
});

test('a chip sends its captain on the march and takes it off again, and the TOTAL follows', () => {
  renderWithTheme(<BonusesSection />);
  expand();

  fireEvent.click(captainChip('Beowulf'));
  expect(setup()?.active.captains).toHaveLength(1);
  expect(profile()?.sources.captains).toHaveLength(1);

  fireEvent.click(captainChip('Beowulf'));
  expect(setup()?.active.captains).toEqual([]);
  // The entry stays: the level it was given is not lost by leaving it behind for one march.
  expect(profile()?.sources.captains).toHaveLength(1);
});

test('a captain that touches no stack carries no gear, and can still ride along', () => {
  renderWithTheme(<BonusesSection />);
  expand();

  expect(within(card()).queryByRole('button', { name: /Carter’s level$/ })).toBeNull();
  expect(within(card()).getByRole('button', { name: /Beowulf’s level$/ })).toBeTruthy();

  fireEvent.click(captainChip('Carter'));
  expect(setup()?.active.captains).toHaveLength(1);
});

test('the fourth captain is refused, in one line, and the chip stays off', () => {
  renderWithTheme(<BonusesSection />);
  expand();

  for (const name of ['Beowulf', 'Aydae', 'Skadi']) fireEvent.click(captainChip(name));
  expect(setup()?.active.captains).toHaveLength(3);
  expect(within(card()).queryByText(CAPTAIN_CAP_MESSAGE)).toBeNull();

  fireEvent.click(captainChip('Brann'));

  expect(setup()?.active.captains).toHaveLength(3);
  expect(within(card()).getAllByRole('status')[0]?.textContent).toContain(CAPTAIN_CAP_MESSAGE);
  expect((captainChip('Brann') as HTMLInputElement).checked).toBe(false);

  // Taking one out makes room, and the note goes with it.
  fireEvent.click(captainChip('Aydae'));
  fireEvent.click(captainChip('Brann'));
  expect(setup()?.active.captains).toHaveLength(3);
  expect(within(card()).queryByText(CAPTAIN_CAP_MESSAGE)).toBeNull();
});

test('the gear opens an anchored popover with the level and the stars, and never enlists anybody', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  expand();

  await user.click(captainGear('Aydae'));
  expect(captainGear('Aydae').getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('textbox', { name: 'Base level' })).toBeTruthy();
  expect(screen.getByRole('combobox', { name: 'Star level' })).toBeTruthy();

  // The entry is minted by the gear alone; Aydae is still on the bench.
  expect(profile()?.sources.captains).toHaveLength(1);
  expect(setup()?.active.captains).toEqual([]);
  expect((captainChip('Aydae') as HTMLInputElement).checked).toBe(false);
});

test('the popover computes the bonus live and the chip takes a dot once a level is set', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  expand();

  fireEvent.click(captainChip('Aydae'));
  await user.click(captainGear('Aydae'));
  typeNumber(document.body, 'Base level', '20');

  expect(profile()?.sources.captains[0]?.level).toBe(20);
  // Aydae boosts guardsmen only, so the whole-army figure does not move; the footer says what does.
  expect(screen.getByText('+20 % health and strength (guardsmen)')).toBeTruthy();
  expect(totals(card()).Health).toBe('0 %');

  // The gear renames itself once there is something to change, and the chip wears the dot.
  expect(within(card()).getByRole('button', { name: 'Change Aydae’s level' })).toBeTruthy();
  expect(chipLabel(captainChip('Aydae')).textContent).toContain('•');
});

test('a levelled captain moves the TOTAL, stars included', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  expand();

  fireEvent.click(captainChip('Beowulf'));
  await user.click(captainGear('Beowulf'));
  typeNumber(document.body, 'Base level', '20');
  expect(totals(card()).Health).toBe('+20 %');

  await chooseIn(user, document.body, 'Star level', '★3');

  expect(profile()?.sources.captains[0]?.star).toBe(3);
  expect(totals(card()).Health).toBe('+230 %');
  expect(totals(card()).Strength).toBe('+230 %');
});

test('the hero leads the row and its gear opens the pick', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  expand();

  await user.click(within(card()).getByRole('button', { name: /^(Set|Change) Hero’s level$/ }));
  await chooseIn(user, document.body, 'Leading this march', 'Svyatogor');

  expect(profile()?.sources.hero).toBe('svyatogor');
  expect(setup()?.active.hero).toBe(true);
  await waitFor(() => {
    expect(totals(card()).Health).toBe('+50 %');
  });
});

// ---- artifacts, permanent sources and titles ------------------------------------------------------
test('an artifact is equipped from its chip and levelled from its gear', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  expand();
  openGroup('Artifacts');

  const row = within(card()).getByRole('group', { name: 'Artifacts' });
  expect(within(row).getAllByRole('checkbox')).toHaveLength(15);

  fireEvent.click(within(row).getByRole('checkbox', { name: 'Equip Ruby Brooch' }));
  expect(setup()?.active.artifacts).toHaveLength(1);

  await user.click(within(card()).getByRole('button', { name: /Ruby Brooch’s level$/ }));
  expect(screen.getByRole('textbox', { name: 'Level' })).toBeTruthy();
  expect(screen.getByRole('combobox', { name: 'Star rating' })).toBeTruthy();
  typeNumber(document.body, 'Melee strength', '30');

  expect(profile()?.sources.artifacts[0]?.manual?.strength).toEqual({ melee: 30 });
  expect(totals(card()).Strength).toBe('0 %');
});

test('a permanent source is always on, and its gear opens the sheet that moves the TOTAL', () => {
  renderWithTheme(<BonusesSection />);
  expand();
  openGroup('Permanent');

  const chip = within(card()).getByRole('checkbox', { name: 'Hall of Fame, on every march' });
  expect((chip as HTMLInputElement).checked).toBe(true);
  expect(within(card()).queryByRole('switch', { name: 'Hall of Fame' })).toBeNull();

  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Hall of Fame' }));
  const sheet = screen.getByRole('dialog');
  typeNumber(sheet, 'Army health', '40');
  expect(totals(sheet).Health).toBe('+40 %');
  done(sheet);

  expect(totals(card()).Health).toBe('+40 %');
});

test('a title is worn from its chip, with what it is worth written under the name', () => {
  renderWithTheme(<BonusesSection />);
  expand();
  openGroup('Titles');

  const health = within(card()).getByRole('group', { name: 'Titles — health' });
  const chip = within(health).getByRole('checkbox', { name: 'Administrator' });
  expect(chipLabel(chip).textContent).toContain('+25 % HP army');

  fireEvent.click(chip);

  expect(profile()?.sources.titles).toEqual(['administrator']);
  expect(setup()?.active.titles).toEqual(['administrator']);
  expect(totals(card()).Health).toBe('+25 %');
});

// ---- the row groups -------------------------------------------------------------------------------
test('a group with nothing configured is one Add line, and adding puts a switch row in', () => {
  renderWithTheme(<BonusesSection />);
  expand();
  openGroup('Equipment');

  expect(within(card()).queryByRole('listitem')).toBeNull();

  fireEvent.click(within(card()).getByRole('button', { name: 'Add equipment' }));
  done(screen.getByRole('dialog'));

  expect(profile()?.sources.equipment).toHaveLength(1);
  expect(setup()?.active.equipment).toHaveLength(1);
  expect(within(card()).getByRole('switch', { name: 'Emerald Guardian' })).toBeTruthy();
});

test('editing a piece of equipment in its sheet moves the TOTAL', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  expand();
  openGroup('Equipment');
  fireEvent.click(within(card()).getByRole('button', { name: 'Add equipment' }));
  done(screen.getByRole('dialog'));

  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Emerald Guardian' }));
  const sheet = screen.getByRole('dialog');
  await chooseIn(user, sheet, 'Quality', 'Godlike');
  done(sheet);

  expect(profile()?.sources.equipment[0]?.quality).toBe('godlike');
  const row = within(card()).getByRole('switch', { name: 'Emerald Guardian' }).closest('[role="listitem"]');
  expect(row?.textContent).toContain('+128 % health and strength (melee)');
});

test('the temple and training row wears the pin instead of a switch and keeps its sheet', () => {
  renderWithTheme(<BonusesSection />);
  expand();
  openGroup('Recovery');

  expect(within(card()).queryByRole('switch', { name: 'Temple and training' })).toBeNull();

  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Temple and training' }));
  const sheet = screen.getByRole('dialog');
  typeNumber(sheet, 'Temple level', '30');
  typeNumber(sheet, 'Guardsmen training cost reduction', '12.5');
  done(sheet);

  expect(profile()?.recovery.templeLevel).toBe(30);
  expect(profile()?.recovery.trainingCostReduction).toEqual({ guardsmen: 12.5 });
  expect(within(card()).getByText(/revival costs divided by 3.84/)).toBeTruthy();
});

test('every battle setup keeps its own selection of sources', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  expand();
  fireEvent.click(captainChip('Beowulf'));
  const first = setup();

  fireEvent.click(within(card()).getByRole('button', { name: 'New battle setup' }));
  const dialog = screen.getByRole('dialog');
  fireEvent.change(within(dialog).getByLabelText('Setup name'), { target: { value: 'Solo' } });
  fireEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

  expect(profile()?.setups).toHaveLength(2);
  expect(setup()?.name).toBe('Solo');
  expect(setup()?.active.captains).toHaveLength(1);

  fireEvent.click(captainChip('Beowulf'));
  expect(setup()?.active.captains).toEqual([]);

  await chooseIn(user, card(), 'Battle setup', first?.name ?? '');

  expect(setup()?.id).toBe(first?.id);
  expect(setup()?.active.captains).toHaveLength(1);
});
