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
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { captains as captainTable } from '@/data';
import { updateSources } from '@/state/actions/bonuses';
import { newRoot } from '@/state/defaults';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { renderWithTheme } from '@/ui/kit/testRender';

import { BonusesSection } from './BonusesSection';
import { CAPTAIN_CAP_MESSAGE } from './CaptainChips';

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

/**
 * Open one of the two foot folds (artifacts, titles). Every other family is on screen the moment
 * the sources are, so for those this is a no-op — the name is kept so a test reads as the journey.
 */
function openGroup(title: string): void {
  const control = within(card()).queryByRole('button', { name: new RegExp(`^${title}`) });
  if (control !== null && control.getAttribute('aria-expanded') !== 'true') fireEvent.click(control);
}

/** A source chip that can be switched, by either of the two names it wears. */
const sourceChip = (name: string): HTMLElement =>
  within(card()).getByRole('checkbox', {
    name: new RegExp(`^(Switch on ${name}|${name}, on for this march)$`),
  });

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
  // Nothing is on: a new account has chosen no captain, worn no title and switched nothing on.
  expect(totals(card())).toEqual({
    Health: '0 %',
    Strength: '0 %',
    Special: '0 %',
    'Sources on': '0',
  });
});

test('VIP and the dragon start switched off', () => {
  renderWithTheme(<BonusesSection />);
  // Owner, 2026-09-19. A fresh account is VIP 0 with an empty dragon, so both stood on and empty:
  // two chips claiming to count for a march they add nothing to. They are a choice now, like every
  // other switchable source, and the count above says none.
  expect(setup()?.active.vip).toBe(false);
  expect(setup()?.active.dragon).toBe(false);
  expect((sourceChip('VIP level 0') as HTMLInputElement).checked).toBe(false);
  expect((sourceChip('Dragon') as HTMLInputElement).checked).toBe(false);
});

test('a source switched on with nothing typed in it reads "—" on its own chip, and nowhere else', () => {
  renderWithTheme(<BonusesSection />);

  // The card's old "N on but empty" badge is retired (owner, 2026-09-13): it named a number a
  // player could do nothing with. The chip that has no value says so, where the value would be.
  expect(within(card()).queryByText(/on but empty/)).toBeNull();

  // No fold to open: the Other family is on screen with the sources (owner, 2026-09-17).
  expect(within(card()).queryByRole('button', { name: /^Other/ })).toBeNull();
  // The dragon starts off, so it has to be switched on before it can be on and empty.
  fireEvent.click(sourceChip('Dragon'));
  expect(setup()?.active.dragon).toBe(true);
  expect(chipLabel(sourceChip('Dragon')).textContent).toContain('—');

  fireEvent.click(sourceChip('Dragon'));
  expect(setup()?.active.dragon).toBe(false);
});

test('the sources are not behind a fold: the captains are on screen with the TOTAL', () => {
  renderWithTheme(<BonusesSection />);

  // Owner, 2026-09-19: the "Sources" line named nothing a player was looking for and cost the daily
  // journey a tap before it began. Nothing has to be pressed to reach the family that changes most.
  expect(within(card()).queryByRole('button', { name: /^Sources/ })).toBeNull();
  expect(captainChip('Beowulf')).toBeTruthy();
  expect(within(card()).getByText('Hero and captains')).toBeTruthy();

  // The two families set once keep a fold each, and the audit is still the last one (charter rule 4).
  // It is named "Summary" since 2026-09-28 (owner: "this section should be renamed Summary").
  expect(within(card()).getByRole('button', { name: /^Artifacts/ })).toBeTruthy();
  expect(within(card()).getByRole('button', { name: /^Titles/ })).toBeTruthy();
  expect(within(card()).getByRole('button', { name: 'Summary' })).toBeTruthy();
});

// ---- the captain chips --------------------------------------------------------------------------
test('the row shows the hero and every captain the tables know, and none of them is an Add button', () => {
  renderWithTheme(<BonusesSection />);
  const row = within(card()).getByRole('group', { name: 'Captains and hero' });
  expect(within(row).getAllByRole('checkbox')).toHaveLength(captainTable.length + 1);
  expect(within(row).getByRole('checkbox', { name: 'Send Hero on this march' })).toBeTruthy();
  for (const record of captainTable) {
    expect(within(row).getByRole('checkbox', { name: new RegExp(record.name) })).toBeTruthy();
  }
  expect(within(card()).queryByRole('button', { name: /^Add captain/ })).toBeNull();
});

test('the captain grid is one tab stop, the arrows walk it, and only its own gear is reachable', () => {
  renderWithTheme(<BonusesSection />);
  const row = within(card()).getByRole('group', { name: 'Captains and hero' });
  const chips = within(row).getAllByRole('checkbox');
  const gears = within(row).getAllByRole('button');
  // Design rule 24b: investigation 0011 measured 52 tab stops here. One is in the tab order now.
  expect(chips.length + gears.length).toBeGreaterThan(40);
  expect([...chips, ...gears].filter((node) => node.tabIndex === 0)).toHaveLength(2);

  // The arrows move between the chips; the pair left in the order is the focused chip and its gear.
  const first = chips[0] as HTMLElement;
  first.focus();
  fireEvent.keyDown(first, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(chips[1]);
  expect((chips[1] as HTMLElement).tabIndex).toBe(0);
  expect(first.tabIndex).toBe(-1);
});

test('a chip sends its captain on the march and takes it off again, and the TOTAL follows', () => {
  renderWithTheme(<BonusesSection />);
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
  expect(within(card()).queryByRole('button', { name: /Carter’s level$/ })).toBeNull();
  expect(within(card()).getByRole('button', { name: /Beowulf’s level$/ })).toBeTruthy();

  fireEvent.click(captainChip('Carter'));
  expect(setup()?.active.captains).toHaveLength(1);
});

test('the fourth captain is refused, in one line, and the chip stays off', () => {
  renderWithTheme(<BonusesSection />);
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

test('the march type is out of the way until a restricted captain is selected, then sits under the chips', () => {
  renderWithTheme(<BonusesSection />);
  // No captain with a march-type restriction is on the march: the control would change nothing, so it is not drawn.
  expect(within(card()).queryByRole('radiogroup', { name: 'March type' })).toBeNull();

  // Selecting a restricted captain (Amanitore, group-only) brings it in, starting on Any.
  fireEvent.click(captainChip('Amanitore'));
  const control = within(card()).getByRole('radiogroup', { name: 'March type' });
  const radios = within(control).getAllByRole('radio');
  expect(radios.map((radio) => radio.getAttribute('value'))).toEqual([
    'unspecified',
    'solo',
    'group',
    'epic',
  ]);
  expect((within(control).getByRole('radio', { name: 'Any' }) as HTMLInputElement).checked).toBe(true);
  expect(setup()?.marchType).toBe('unspecified');

  fireEvent.click(within(control).getByRole('radio', { name: 'Epic' }));
  expect(setup()?.marchType).toBe('epic');
  expect((within(control).getByRole('radio', { name: 'Epic' }) as HTMLInputElement).checked).toBe(true);
});

test('the control follows the selection: owning a restricted captain off the march is not enough', () => {
  renderWithTheme(<BonusesSection />);
  fireEvent.click(captainChip('Amanitore'));
  expect(within(card()).getByRole('radiogroup', { name: 'March type' })).toBeTruthy();
  // Taking him off the march leaves the entry owned but unselected: the control changes nothing, so it leaves.
  fireEvent.click(captainChip('Amanitore'));
  expect(within(card()).queryByRole('radiogroup', { name: 'March type' })).toBeNull();
});

test('choosing a march type gates the captains: a group-only captain is not counted on a solo march', () => {
  renderWithTheme(<BonusesSection />);
  // Enlisting Amanitore brings the control in; it is not there before (it could change nothing).
  fireEvent.click(captainChip('Amanitore'));
  const control = within(card()).getByRole('radiogroup', { name: 'March type' });

  // Any: today's behaviour, the restriction is a note and nothing is gated.
  expect(within(card()).getByText(/^Amanitore: /)).toBeTruthy();
  expect(within(card()).queryByText(/Amanitore is not counted/)).toBeNull();

  fireEvent.click(within(control).getByRole('radio', { name: 'Solo' }));
  expect(within(card()).getByText(/Amanitore is not counted on a solo march/)).toBeTruthy();

  // On a group march the restriction is met and the card says nothing about it.
  fireEvent.click(within(control).getByRole('radio', { name: 'Group' }));
  expect(within(card()).queryByText(/^Amanitore: |Amanitore is not counted/)).toBeNull();
});

test('each segment says, in its tooltip, which captains the march type leaves out', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  fireEvent.click(captainChip('Amanitore'));
  const control = within(card()).getByRole('radiogroup', { name: 'March type' });

  await user.hover(within(control).getByText('Solo'));
  expect(await screen.findByText(/Amanitore and Hercules are not counted/)).toBeTruthy();
});

test('a type stored on an earlier march is out of the way while no restricted captain is selected', () => {
  // The type is inert with no restricted captain to gate (nothing else reaches `onlyOn`), so the control stays
  // out; it comes back with the captain, where it can be changed.
  useStore.getState().updateActiveSetup(() => ({ marchType: 'group' }));
  renderWithTheme(<BonusesSection />);
  expect(within(card()).queryByRole('radiogroup', { name: 'March type' })).toBeNull();
  fireEvent.click(captainChip('Amanitore'));
  const control = within(card()).getByRole('radiogroup', { name: 'March type' });
  expect((within(control).getByRole('radio', { name: 'Group' }) as HTMLInputElement).checked).toBe(true);
  fireEvent.click(within(control).getByRole('radio', { name: 'Any' }));
  expect(setup()?.marchType).toBe('unspecified');
});

test('the gear opens an anchored popover with the level and the stars, and never enlists anybody', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  await user.click(captainGear('Aydae'));
  expect(captainGear('Aydae').getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByRole('textbox', { name: 'Base level' })).toBeTruthy();
  expect(screen.getByRole('combobox', { name: 'Star level' })).toBeTruthy();

  // The entry is minted by the gear alone; Aydae is still on the bench.
  expect(profile()?.sources.captains).toHaveLength(1);
  expect(setup()?.active.captains).toEqual([]);
  expect((captainChip('Aydae') as HTMLInputElement).checked).toBe(false);
});

test('the popover computes the bonus live and the chip wears the level once it is set', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  fireEvent.click(captainChip('Aydae'));
  await user.click(captainGear('Aydae'));
  typeNumber(document.body, 'Base level', '20');

  expect(profile()?.sources.captains[0]?.level).toBe(20);
  // Aydae boosts guardsmen only, so the whole-army figure does not move; the footer says what does.
  expect(screen.getByText('Level 20: +20 % health and strength (guardsmen)')).toBeTruthy();
  expect(totals(card()).Health).toBe('0 %');

  // The gear renames itself once there is something to change, and the level takes its place on the
  // corner: the row says who is at what level without a tap (owner, 2026-10-02).
  const gear = within(card()).getByRole('button', { name: 'Change Aydae’s level' });
  expect(gear.textContent).toBe('20');
  expect(gear.getAttribute('aria-describedby')).not.toBeNull();
  expect(document.getElementById(gear.getAttribute('aria-describedby') ?? '')?.textContent).toBe('Level 20');
  expect(chipLabel(captainChip('Aydae')).querySelector('[class*="chipDot"]')).toBeNull();
});

test('the popover lists every line a captain is worth, never "and 1 more"', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  await user.click(captainGear('Aydae'));
  typeNumber(document.body, 'Base level', '20');
  // Aydae's two blocks do not move together at ★2 — 20 % health against 35 % strength — so a row
  // summary would say "+20 % health (guardsmen) and 1 more" (owner, 2026-09-28: *"at this level should
  // always show all rows"*). The popover says both, in its own two rows.
  await chooseIn(user, document.body, 'Star level', '★2');

  const worth = screen.getByLabelText('What this captain adds');
  expect([...worth.querySelectorAll('dd')].map((node) => node.textContent)).toEqual([
    'Level 20: +20 % health and strength (guardsmen)',
    '2 stars: +15 % strength (guardsmen)',
  ]);
  // The label is worn by the first row alone: the block reads as one figure with two lines.
  expect(screen.getByText('At this level')).toBeTruthy();
  expect(within(worth).queryByText(/ and 1 more/)).toBeNull();
});

test('a levelled captain moves the TOTAL, stars included', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  fireEvent.click(captainChip('Beowulf'));
  await user.click(captainGear('Beowulf'));
  typeNumber(document.body, 'Base level', '20');
  expect(totals(card()).Health).toBe('+20 %');

  await chooseIn(user, document.body, 'Star level', '★4');

  expect(profile()?.sources.captains[0]?.star).toBe(3);
  expect(totals(card()).Health).toBe('+230 %');
  expect(totals(card()).Strength).toBe('+230 %');
});

test('the hero leads the row and its gear opens the pick', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
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
  openGroup('Artifacts');

  const row = within(card()).getByRole('group', { name: 'Artifacts' });
  expect(within(row).getAllByRole('checkbox')).toHaveLength(16);
  expect(within(row).getByRole('checkbox', { name: "Equip Mars' Twin Blades" })).toBeTruthy();

  fireEvent.click(within(row).getByRole('checkbox', { name: 'Equip Ruby Brooch' }));
  expect(setup()?.active.artifacts).toHaveLength(1);
  // A new artifact starts at the bottom of the game's ladders.
  expect(profile()?.sources.artifacts[0]).toMatchObject({ level: 1, star: '0.1' });

  await user.click(within(card()).getByRole('button', { name: /Ruby Brooch’s level$/ }));
  const editor = screen.getByRole('dialog');
  expect(within(editor).getByRole('combobox', { name: 'Star rating' })).toBeTruthy();
  // The level is the one figure to type: the percentages are the game's.
  expect(
    within(editor)
      .getAllByRole('textbox')
      .map((field) => field.getAttribute('inputmode')),
  ).toEqual(['numeric']);
  expect(within(editor).getByText('+18.5 % health and strength (melee)')).toBeTruthy();

  typeNumber(editor, 'Level', '20');
  expect(within(editor).getByText('+28 % health and strength (melee)')).toBeTruthy();
  typeNumber(editor, 'Level', '0');
  expect(profile()?.sources.artifacts[0]?.level).toBe(1);
});

test('the march ignores what an artifact gives against other players, and its Summary lists strike two squads', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  openGroup('Artifacts');
  await user.click(within(card()).getByRole('checkbox', { name: "Equip Mars' Twin Blades" }));
  await user.click(within(card()).getByRole('button', { name: /Mars' Twin Blades’s level$/ }));
  expect(within(screen.getByRole('dialog')).getByText('+1.1 % strike two squads chance')).toBeTruthy();
  await user.keyboard('{Escape}');

  await user.click(within(card()).getByRole('button', { name: 'Summary' }));
  const special = within(card()).getByRole('region', { name: 'Special' });
  expect(within(special).getByText('Strike two squads chance')).toBeTruthy();
  const strength = within(card()).getByRole('region', { name: 'Strength' });
  expect(within(strength).queryByText("Mars' Twin Blades L1 ★0.1")).toBeNull();
});

/** The editor behind an artifact's gear, and its buttons by name. */
async function artifactEditor(user: ReturnType<typeof userEvent.setup>, name: string) {
  openGroup('Artifacts');
  fireEvent.click(within(card()).getByRole('checkbox', { name: `Equip ${name}` }));
  await user.click(within(card()).getByRole('button', { name: new RegExp(`${name}’s level$`) }));
  const editor = screen.getByRole('dialog');
  const button = (label: string): HTMLElement => within(editor).getByRole('button', { name: label });
  return { editor, button };
}

const isOff = (node: HTMLElement): boolean => node.getAttribute('aria-disabled') === 'true';

test('+ and − move an artifact’s level by one, stop at 1 and 60, and the bonuses follow', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor, button } = await artifactEditor(user, 'Ruby Brooch');
  const level = () => profile()?.sources.artifacts[0]?.level;

  // A new artifact is at level 1, the bottom: nothing to take down.
  expect(isOff(button('Lower level'))).toBe(true);
  await user.click(button('Raise level'));
  expect(level()).toBe(2);
  expect(within(editor).getByText('+19 % health and strength (melee)')).toBeTruthy();
  await user.click(button('Lower level'));
  expect(level()).toBe(1);
  expect(within(editor).getByText('+18.5 % health and strength (melee)')).toBeTruthy();

  typeNumber(editor, 'Level', '59');
  await user.click(button('Raise level'));
  expect(level()).toBe(60);
  expect(isOff(button('Raise level'))).toBe(true);
});

test('+ and − move an artifact’s star by one segment, stop at 0.1 and 5.0, and the bonuses follow', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor, button } = await artifactEditor(user, 'Ruby Brooch');
  const star = () => profile()?.sources.artifacts[0]?.star;

  expect(isOff(button('Lower star rating'))).toBe(true);
  await user.click(button('Raise star rating'));
  expect(star()).toBe('0.2');
  expect(within(editor).getByText('+19.5 % health and strength (melee)')).toBeTruthy();
  await user.click(button('Lower star rating'));
  expect(star()).toBe('0.1');
  expect(within(editor).getByText('+18.5 % health and strength (melee)')).toBeTruthy();

  // The next segment is the next step of the game's ladder: a whole star follows its fourth segment.
  for (const [from, to] of [
    ['2.0', '2.1'],
    ['1.4', '2.0'],
    ['4.4', '5.0'],
  ] as const) {
    await chooseIn(user, editor, 'Star rating', `★ ${from}`);
    await user.click(button('Raise star rating'));
    expect(star()).toBe(to);
  }
  expect(isOff(button('Raise star rating'))).toBe(true);
});

test('the artifact steppers work from the keyboard, and the end of a ladder keeps the focus', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor, button } = await artifactEditor(user, 'Ruby Brooch');
  typeNumber(editor, 'Level', '59');

  button('Raise level').focus();
  await user.keyboard('{Enter}');
  expect(profile()?.sources.artifacts[0]?.level).toBe(60);
  // A natively disabled button drops the focus to the page, and Escape then no longer reaches the editor.
  expect(document.activeElement).toBe(button('Raise level'));
  expect((button('Raise level') as HTMLButtonElement).disabled).toBe(false);
  await user.keyboard('{Enter}');
  expect(profile()?.sources.artifacts[0]?.level).toBe(60);

  button('Raise star rating').focus();
  await user.keyboard(' ');
  expect(profile()?.sources.artifacts[0]?.star).toBe('0.2');
  await user.keyboard('{Escape}');
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

// ---- B-42: the random bonus lines -----------------------------------------------------------------
const savedLines = () => profile()?.sources.artifacts[0]?.lines;
const lineFields = (editor: HTMLElement): string[] =>
  within(editor)
    .queryAllByRole('combobox', { name: /^Random bonus \d$/ })
    .map((field) => field.getAttribute('aria-label') ?? '');

/** Picks an option on one line: the choice is named by what it reads, "not counted" included. */
async function pickLine(
  user: ReturnType<typeof userEvent.setup>,
  editor: HTMLElement,
  line: number,
  option: RegExp,
): Promise<void> {
  await user.click(within(editor).getByRole('combobox', { name: `Random bonus ${String(line)}` }));
  await user.click(within(editor).getByRole('option', { name: option }));
}

/** What a line says under its option, as a screen reader gets it with the field. */
function lineNote(editor: HTMLElement, line: number): string | null {
  const field = within(editor).getByRole('combobox', { name: `Random bonus ${String(line)}` });
  const ids = (field.getAttribute('aria-describedby') ?? '').split(' ');
  const text = ids.map((id) => document.getElementById(id)?.textContent ?? '').join('');
  return text === '' ? null : text;
}

const lineValues = (editor: HTMLElement, line: number): HTMLElement =>
  within(editor).getByRole('radiogroup', { name: `Random bonus ${String(line)} value` });

test('an artifact shows one random bonus line per whole star reached, five at most', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor, button } = await artifactEditor(user, 'Heart of the Forest');

  expect(lineFields(editor)).toEqual([]);
  expect(within(editor).getByText('Random bonus lines open from star 1.0.')).toBeTruthy();
  await chooseIn(user, editor, 'Star rating', '★ 0.4');
  expect(lineFields(editor)).toEqual([]);
  await user.click(button('Raise star rating'));
  expect(lineFields(editor)).toEqual(['Random bonus 1']);
  await chooseIn(user, editor, 'Star rating', '★ 3.4');
  expect(lineFields(editor)).toHaveLength(3);
  await chooseIn(user, editor, 'Star rating', '★ 5.0');
  expect(lineFields(editor)).toHaveLength(5);
});

test('a line takes an option, then one of its three values, and the bonuses follow', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor } = await artifactEditor(user, 'Heart of the Forest');
  await chooseIn(user, editor, 'Star rating', '★ 2.0');
  expect(within(editor).getByText('+207 % strength (army)')).toBeTruthy(); // level 1: 42, star 2.0: 165

  expect(within(editor).queryByRole('radiogroup')).toBeNull();
  await pickLine(user, editor, 2, /^Army strength$/);
  // Line 1 stays empty; the new line starts on the smallest of the three values.
  expect(savedLines()).toEqual([null, { option: 'armyStrength', rarity: 'rare' }]);
  expect(within(editor).getByText('+227 % strength (army)')).toBeTruthy();

  const values = within(lineValues(editor, 2)).getAllByRole('radio');
  expect(values.map((radio) => radio.closest('div')?.textContent)).toEqual([
    '+20 %Rare',
    '+40 %Epic',
    '+100 %Legendary',
  ]);
  await user.click(within(lineValues(editor, 2)).getByRole('radio', { name: /Legendary/ }));
  expect(savedLines()?.[1]).toEqual({ option: 'armyStrength', rarity: 'legendary' });
  expect(within(editor).getByText('+307 % strength (army)')).toBeTruthy();

  // Another option on the same line keeps the rarity; the same option on two lines adds up.
  await pickLine(user, editor, 1, /^Army strength$/);
  expect(within(editor).getByText('+327 % strength (army)')).toBeTruthy();
  await pickLine(user, editor, 2, /^Army health$/);
  expect(savedLines()?.[1]).toEqual({ option: 'armyHealth', rarity: 'legendary' });

  // A line can be emptied again, and a profile with every line empty records none.
  await pickLine(user, editor, 2, /^Empty$/);
  expect(savedLines()).toEqual([{ option: 'armyStrength', rarity: 'rare' }]);
  await pickLine(user, editor, 1, /^Empty$/);
  expect(savedLines()).toBeUndefined();
});

test('lowering the star hides a line and stops counting it; raising the star brings it back', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor, button } = await artifactEditor(user, 'Heart of the Forest');
  await chooseIn(user, editor, 'Star rating', '★ 2.0');
  await pickLine(user, editor, 2, /^Army strength$/);

  await user.click(button('Lower star rating'));
  expect(lineFields(editor)).toEqual(['Random bonus 1']);
  expect(within(editor).getByText('+194 % strength (army)')).toBeTruthy(); // 42 + star 1.4: 152
  // Hidden, not forgotten: a pick on another line keeps it.
  await pickLine(user, editor, 1, /^Army health$/);
  expect(savedLines()?.[1]).toEqual({ option: 'armyStrength', rarity: 'rare' });

  await user.click(button('Raise star rating'));
  expect(within(editor).getByRole('combobox', { name: 'Random bonus 2' })).toHaveProperty(
    'value',
    'Army strength',
  );
  expect(within(editor).getByText('+227 % strength (army)')).toBeTruthy();
});

test('the march marks the options it does not count, and leaves them selectable', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor } = await artifactEditor(user, "Zeus' Lightning");
  await chooseIn(user, editor, 'Star rating', '★ 2.0');
  await user.click(within(editor).getByRole('combobox', { name: 'Random bonus 1' }));
  // The artifact's own options and no other, each saying whether it counts here.
  expect(
    within(editor)
      .getAllByRole('option')
      .map((option) => option.textContent),
  ).toEqual([
    'Empty',
    'AuthorityNot counted',
    'DominanceNot counted',
    'Double damage chance',
    'LeadershipNot counted',
  ]);
  await user.click(within(editor).getByRole('option', { name: /Leadership/ }));
  expect(savedLines()).toEqual([{ option: 'leadership', rarity: 'rare' }]);
  expect(lineNote(editor, 1)).toBe('Not counted');
  await pickLine(user, editor, 1, /^Double damage chance$/);
  expect(lineNote(editor, 1)).toBeNull();
  // The march's housing takes no capacity (B-44), so no capacity figure reads as one that counts.
  expect(within(editor).queryByText(/% (leadership|dominance)$/)).toBeNull();
});

test('the march marks a line against other players as not counted', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor } = await artifactEditor(user, 'Ruby Brooch');
  await chooseIn(user, editor, 'Star rating', '★ 1.0');
  await pickLine(user, editor, 1, /^Melee strength and health against other players\s*Not counted$/);
  expect(lineNote(editor, 1)).toBe('Against other players, not counted');
  expect(within(editor).getByText('+23 % health and strength (melee)')).toBeTruthy();
});

test('the march shows what a level gives that it does not count, marked, so + is seen to move it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor, button } = await artifactEditor(user, "Zeus' Lightning");
  // Zeus' levels raise capacity alone, which no march counts.
  expect(within(editor).getByText('+2.5 % leadership · Not counted')).toBeTruthy();
  expect(within(editor).getByText('+2.5 % dominance · Not counted')).toBeTruthy();
  typeNumber(editor, 'Level', '59');
  await user.click(button('Raise level'));
  expect(within(editor).getByText('+25 % leadership · Not counted')).toBeTruthy();
  expect(within(editor).getByText('+0.7 % double damage chance')).toBeTruthy();
});

test.each([
  // Level 1 and star 0.1: Mars against other players from the level alone; Forest Crown 17.5 + 18, both ways.
  ["Mars' Twin Blades", '+42 % health and strength (army)', []],
  ['Forest Crown', '+35.5 % health and strength (army)', ['+35.5 % health and strength (army)']],
])('the march shows what %s gives against other players, marked', async (name, against, counted) => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor } = await artifactEditor(user, name);
  expect(within(editor).getByText(`${against} · Against other players, not counted`)).toBeTruthy();
  for (const line of counted) expect(within(editor).getByText(line)).toBeTruthy();
});

test('an emptied level field saves nothing, so a new level can be typed into it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  const { editor } = await artifactEditor(user, 'Ruby Brooch');
  const level = () => profile()?.sources.artifacts[0]?.level;
  const field = within(editor).getByRole('textbox', { name: 'Level' });
  typeNumber(editor, 'Level', '35');

  await user.clear(field);
  expect(field).toHaveProperty('value', '');
  expect(level()).toBe(35);
  await user.type(field, '42');
  expect(level()).toBe(42);
  expect(field).toHaveProperty('value', '42');

  // Left empty, the field goes back to the level that is saved.
  await user.clear(field);
  await user.tab();
  expect(field).toHaveProperty('value', '42');
  expect(level()).toBe(42);
});

test('a captain’s editor has no + and − buttons', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  await user.click(captainGear('Aydae'));

  expect(within(screen.getByRole('dialog')).queryByRole('button', { name: /^(Raise|Lower) / })).toBeNull();
});

test('the star rating offers the game’s 25 steps, from 0.1 to 5.0', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  openGroup('Artifacts');
  await user.click(within(card()).getByRole('button', { name: /Heart of the Forest’s level$/ }));
  await user.click(screen.getByRole('combobox', { name: 'Star rating' }));

  const steps = screen.getAllByRole('option').map((option) => option.textContent);
  expect(steps).toHaveLength(25);
  expect([steps[0], steps.at(-1)]).toEqual(['★ 0.1', '★ 5.0']);
});

test('a permanent source is on while something is recorded in it, and its gear opens the sheet that moves the TOTAL', () => {
  renderWithTheme(<BonusesSection />);
  openGroup('Permanent');

  // Nothing recorded yet: the chip reads as off, because to the TOTAL it is (owner, 2026-09-17).
  const empty = within(card()).getByRole('checkbox', { name: 'Set Hall of Fame' });
  expect((empty as HTMLInputElement).checked).toBe(false);
  expect(within(card()).queryByRole('switch', { name: 'Hall of Fame' })).toBeNull();

  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Hall of Fame' }));
  const sheet = screen.getByRole('dialog');
  typeNumber(sheet, 'Army health', '40');
  expect(totals(sheet).Health).toBe('+40 %');
  done(sheet);

  expect(totals(card()).Health).toBe('+40 %');
  // And with a value in it, it is on — always, with no switch to flip.
  const chip = within(card()).getByRole('checkbox', { name: 'Hall of Fame, on every march' });
  expect((chip as HTMLInputElement).checked).toBe(true);
});

test('Customization takes a negative figure, to correct a total the game screens do not explain', () => {
  renderWithTheme(<BonusesSection />);
  openGroup('Permanent');

  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Customization' }));
  const sheet = screen.getByRole('dialog');
  typeNumber(sheet, 'Flying health', '-1');
  typeNumber(sheet, 'Mounted health', '5');
  done(sheet);

  const custom = profile()?.sources.permanent.find((entry) => entry.builtin === 'customization');
  expect(custom?.health).toEqual({ flying: -1, mounted: 5 });
});

test('the Hero Talents form asks only for strength and health on the nine keys a talent can touch', () => {
  renderWithTheme(<BonusesSection />);
  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Hero Talents' }));
  const sheet = screen.getByRole('dialog');
  for (const kind of [
    'Army',
    'Melee',
    'Ranged',
    'Mounted',
    'Flying',
    'Monsters',
    'Guardsmen',
    'Specialists',
    'Engineers',
  ]) {
    expect(within(sheet).getByLabelText(`${kind} health`)).toBeTruthy();
    expect(within(sheet).getByLabelText(`${kind} strength`)).toBeTruthy();
  }
  for (const race of ['Beasts', 'Giants', 'Elementals', 'Dragons']) {
    expect(within(sheet).queryByLabelText(`${race} health`)).toBeNull();
    expect(within(sheet).queryByLabelText(`${race} strength`)).toBeNull();
  }
  expect(within(sheet).queryByLabelText(/double damage/i)).toBeNull();
  expect(within(sheet).getAllByRole('textbox')).toHaveLength(18);
  done(sheet);
});

test('a hover over a source chip raises every line it is worth', async () => {
  renderWithTheme(<BonusesSection />);
  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Army Modernization' }));
  const sheet = screen.getByRole('dialog');
  typeNumber(sheet, 'Army health', '40');
  typeNumber(sheet, 'Melee strength', '12');
  done(sheet);

  // The chip's own line stops at one key ("… and 1 more"); the tooltip says both (owner, 2026-09-17).
  const chip = within(card()).getByRole('checkbox', { name: 'Army Modernization, on every march' });
  expect(chipLabel(chip).textContent).toContain('and 1 more');
  fireEvent.mouseEnter(chipLabel(chip).closest('span[style]') ?? chipLabel(chip));
  expect(await screen.findByText('Melee +12 % strength')).toBeTruthy();
  expect(screen.getByText('Army +40 % health')).toBeTruthy();
});

test('a title is worn from its chip, with what it is worth written under the name', () => {
  renderWithTheme(<BonusesSection />);
  openGroup('Titles');

  const health = within(card()).getByRole('group', { name: 'Titles: health' });
  const chip = within(health).getByRole('checkbox', { name: 'Administrator' });
  expect(chipLabel(chip).textContent).toContain('+25 % HP army');

  fireEvent.click(chip);

  expect(profile()?.sources.titles).toEqual(['administrator']);
  expect(setup()?.active.titles).toEqual(['administrator']);
  expect(totals(card()).Health).toBe('+25 %');
});

// ---- the row groups -------------------------------------------------------------------------------
test('a family with nothing configured is one Add line, and adding puts a chip in', () => {
  renderWithTheme(<BonusesSection />);
  expect(within(card()).queryByRole('group', { name: 'Equipment' })).toBeNull();

  fireEvent.click(within(card()).getByRole('button', { name: 'Add equipment' }));
  done(screen.getByRole('dialog'));

  expect(profile()?.sources.equipment).toHaveLength(1);
  expect(setup()?.active.equipment).toHaveLength(1);
  const chip = sourceChip('Emerald Guardian');
  expect((chip as HTMLInputElement).checked).toBe(true);
  expect(within(card()).getByRole('group', { name: 'Equipment' })).toBeTruthy();
});

test('editing a piece of equipment in its sheet moves the TOTAL', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
  openGroup('Equipment');
  fireEvent.click(within(card()).getByRole('button', { name: 'Add equipment' }));
  done(screen.getByRole('dialog'));

  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Emerald Guardian' }));
  const sheet = screen.getByRole('dialog');
  await chooseIn(user, sheet, 'Quality', 'Godlike');
  done(sheet);

  expect(profile()?.sources.equipment[0]?.quality).toBe('godlike');
  expect(chipLabel(sourceChip('Emerald Guardian')).textContent).toContain('+128 % HP/STR melee');
});

test('the temple chip is off until something is typed into it, then on every march', () => {
  renderWithTheme(<BonusesSection />);
  // A level-0 temple divides revival costs by 1, which is no bonus at all: the chip used to say so
  // and read as switched on for it (owner, 2026-09-19). Untouched, it is a chip with nothing in it.
  const empty = within(card()).getByRole('checkbox', { name: 'Set Temple and training' });
  expect((empty as HTMLInputElement).checked).toBe(false);
  expect(chipLabel(empty).textContent).toContain('—');

  fireEvent.click(within(card()).getByRole('button', { name: 'Edit Temple and training' }));
  const sheet = screen.getByRole('dialog');
  typeNumber(sheet, 'Temple level', '30');
  typeNumber(sheet, 'Guardsmen training cost reduction', '12.5');
  done(sheet);

  expect(profile()?.recovery.templeLevel).toBe(30);
  expect(profile()?.recovery.trainingCostReduction).toEqual({ guardsmen: 12.5 });
  const filled = within(card()).getByRole('checkbox', { name: 'Temple and training, on every march' });
  expect((filled as HTMLInputElement).checked).toBe(true);
  expect(within(card()).getByText(/revival costs divided by 3.84/)).toBeTruthy();
});

test('every battle setup keeps its own selection of sources', async () => {
  const user = userEvent.setup();
  renderWithTheme(<BonusesSection />);
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

// ---- B-16: the Artifacts and Titles folds open on load ------------------------------------------

const foldControl = (title: string): HTMLElement =>
  within(card()).getByRole('button', { name: new RegExp(`^${title}`) });
const isOpen = (title: string): boolean => foldControl(title).getAttribute('aria-expanded') === 'true';

test('B-16: with nothing active and no stored state, both folds are closed', () => {
  renderWithTheme(<BonusesSection />);
  expect(isOpen('Artifacts')).toBe(false);
  expect(isOpen('Titles')).toBe(false);
});

test('B-16: an active title opens Titles on mount, and only Titles', () => {
  useStore.getState().updateActiveSetup((s) => ({ active: { ...s.active, titles: ['some-title'] } }));
  renderWithTheme(<BonusesSection />);
  expect(isOpen('Titles')).toBe(true);
  expect(isOpen('Artifacts')).toBe(false);
});

test('B-16: an active artifact opens Artifacts on mount, and only Artifacts', () => {
  useStore.getState().updateActiveSetup((s) => ({ active: { ...s.active, artifacts: ['some-entry'] } }));
  renderWithTheme(<BonusesSection />);
  expect(isOpen('Artifacts')).toBe(true);
  expect(isOpen('Titles')).toBe(false);
});

test('B-16: a fold left open stays open after a remount with nothing active', () => {
  const first = renderWithTheme(<BonusesSection />);
  fireEvent.click(foldControl('Titles'));
  first.unmount();
  renderWithTheme(<BonusesSection />);
  expect(isOpen('Titles')).toBe(true);
  expect(isOpen('Artifacts')).toBe(false);
});

test('B-16: collapsing an active fold by hand holds for the session, and the document never carries it', () => {
  useStore.getState().updateActiveSetup((s) => ({ active: { ...s.active, titles: ['some-title'] } }));
  const before = JSON.stringify(useStore.getState().doc);
  renderWithTheme(<BonusesSection />);
  fireEvent.click(foldControl('Titles'));
  expect(isOpen('Titles')).toBe(false);
  expect(JSON.stringify(useStore.getState().doc)).toBe(before);
});

test('B-16: a document that arrives after mount with an active title opens Titles', () => {
  renderWithTheme(<BonusesSection />);
  expect(isOpen('Titles')).toBe(false);
  const root = newRoot();
  const loaded = {
    ...root,
    profiles: root.profiles.map((p) => ({
      ...p,
      setups: p.setups.map((s) => ({ ...s, active: { ...s.active, titles: ['some-title'] } })),
    })),
  };
  act(() => {
    useStore.getState().replaceDocument(loaded);
  });
  expect(isOpen('Titles')).toBe(true);
});

// ---- B-19: sets, grade badges, tighter pills -------------------------------------------------------
type Seed = { id: string; equipmentId: string; quality?: string; setId?: string; on?: boolean };

/** Put pieces straight into the profile, switched on or not, as an account with gear already has. */
function seedPieces(pieces: Seed[], names: Record<string, string> = {}): void {
  updateSources(profile()!.id, (sources) => ({
    ...sources,
    equipment: pieces.map(({ on: _on, quality = 'rare', ...piece }) => ({
      ...piece,
      quality: quality as never,
    })),
    equipmentSetNames: names,
  }));
  useStore.getState().updateActiveSetup((current) => ({
    active: {
      ...current.active,
      equipment: pieces.filter((piece) => piece.on === true).map((piece) => piece.id),
    },
  }));
}

const alexander: Seed[] = [
  { id: 'a1', equipmentId: 'emerald-guardian', setId: 's1', on: true },
  { id: 'a2', equipmentId: 'war-master', setId: 's1', on: true },
  { id: 'a3', equipmentId: 'steppe-enslaver', setId: 's1' },
];

const setToggle = (name: string): HTMLInputElement =>
  within(card()).getByRole('checkbox', { name: new RegExp(`^${name}, \\d of \\d on$`) });

test('a piece wears the letter of its grade and a tight bonus line, the full line on hover', async () => {
  const user = userEvent.setup();
  seedPieces([{ id: 'p1', equipmentId: 'emerald-guardian', quality: 'godlike', on: true }]);
  renderWithTheme(<BonusesSection />);

  const label = chipLabel(sourceChip('Emerald Guardian'));
  expect(within(label).getByRole('img', { name: 'Godlike grade' }).textContent).toBe('G');
  expect(label.textContent).toContain('+128 % HP/STR melee');

  await user.hover(label);
  expect(await screen.findByRole('tooltip')).toBeTruthy();
  expect(screen.getByRole('tooltip').textContent).toContain('Godlike quality');
  expect(screen.getByRole('tooltip').textContent).toContain('+128 % health / +128 % strength');
});

test('a switched-off piece keeps its letter, with no ring that comes and goes', () => {
  seedPieces([
    { id: 'p1', equipmentId: 'emerald-guardian', quality: 'epic', on: true },
    { id: 'p2', equipmentId: 'war-master', quality: 'epic' },
  ]);
  renderWithTheme(<BonusesSection />);
  const on = within(chipLabel(sourceChip('Emerald Guardian'))).getByRole('img', { name: 'Epic grade' });
  const off = within(chipLabel(sourceChip('War Master'))).getByRole('img', { name: 'Epic grade' });
  expect(off.textContent).toBe('E');
  expect(off.getAttribute('data-variant')).toBe(on.getAttribute('data-variant'));
});

test('pieces without a set live in a No set card, and an empty profile shows only Add', () => {
  renderWithTheme(<BonusesSection />);
  expect(within(card()).queryByRole('group', { name: 'No set' })).toBeNull();
  cleanup();

  seedPieces([{ id: 'p1', equipmentId: 'war-master' }]);
  renderWithTheme(<BonusesSection />);
  const loose = within(card()).getByRole('group', { name: 'No set' });
  expect(within(loose).getByRole('checkbox', { name: 'Switch on War Master' })).toBeTruthy();
  expect(within(loose).queryByRole('checkbox', { name: /of \d on$/ })).toBeNull();
});

test('a set toggle is tri-state: a part-on set turns all on, a full set turns all off', () => {
  seedPieces(alexander, { s1: 'Alexander' });
  renderWithTheme(<BonusesSection />);

  const toggle = setToggle('Alexander');
  expect(toggle.indeterminate).toBe(true);
  expect(toggle.getAttribute('aria-label')).toBe('Alexander, 2 of 3 on');

  fireEvent.click(toggle);
  expect(setup()?.active.equipment.toSorted()).toEqual(['a1', 'a2', 'a3']);
  expect(setToggle('Alexander').checked).toBe(true);

  fireEvent.click(setToggle('Alexander'));
  expect(setup()?.active.equipment).toEqual([]);
  expect(setToggle('Alexander').checked).toBe(false);
  expect(setToggle('Alexander').indeterminate).toBe(false);
});

test('a piece inside a set still switches alone, and two sets are not exclusive', () => {
  seedPieces([...alexander, { id: 'b1', equipmentId: 'guardian-of-justice', setId: 's2' }], {
    s1: 'Alexander',
    s2: 'Caesar',
  });
  renderWithTheme(<BonusesSection />);

  fireEvent.click(sourceChip('Steppe Enslaver'));
  expect(setup()?.active.equipment).toContain('a3');
  expect(setToggle('Alexander').checked).toBe(true);

  fireEvent.click(setToggle('Caesar'));
  expect(setup()?.active.equipment.toSorted()).toEqual(['a1', 'a2', 'a3', 'b1']);
});

test('an unnamed set is titled by what it boosts and its commonest grade, numbered when two read alike', () => {
  seedPieces([
    { id: 'a1', equipmentId: 'guardian-of-justice', quality: 'uncommon', setId: 's1' },
    { id: 'a2', equipmentId: 'guardian-of-justice', quality: 'epic', setId: 's1' },
    { id: 'a3', equipmentId: 'guardian-of-justice', quality: 'epic', setId: 's1' },
    { id: 'b1', equipmentId: 'guardian-of-justice', quality: 'epic', setId: 's2' },
  ]);
  renderWithTheme(<BonusesSection />);
  expect(within(card()).getByRole('group', { name: 'Set Guardsmen (E)' })).toBeTruthy();
  expect(within(card()).getByRole('group', { name: 'Set Guardsmen (E) 2' })).toBeTruthy();
});

test('Add set puts an empty set in: New set, then New set 2, and the first holds nothing yet', () => {
  seedPieces([{ id: 'l1', equipmentId: 'war-master' }]);
  renderWithTheme(<BonusesSection />);

  fireEvent.click(within(card()).getByRole('button', { name: 'Add set' }));
  fireEvent.click(within(card()).getByRole('button', { name: 'Add set' }));
  expect(within(card()).getByRole('group', { name: 'Set New set' })).toBeTruthy();
  expect(within(card()).getByRole('group', { name: 'Set New set 2' })).toBeTruthy();
  // Nothing in it yet: its toggle has nothing to switch.
  expect((setToggle('New set') as HTMLInputElement).disabled).toBe(true);
});

test('an empty set can be added to a profile with no piece', () => {
  renderWithTheme(<BonusesSection />);
  fireEvent.click(within(card()).getByRole('button', { name: 'Add set' }));
  expect(within(card()).getByRole('group', { name: 'Set New set' })).toBeTruthy();

  fireEvent.click(within(card()).getByRole('button', { name: 'Delete empty set New set' }));
  expect(within(card()).queryByRole('group', { name: 'Set New set' })).toBeNull();
  expect(profile()?.sources.equipmentSetNames).toBeUndefined();
});

test('a set is renamed in place: Enter keeps the name, Escape gives it up', async () => {
  const user = userEvent.setup();
  seedPieces(alexander, { s1: 'Alexander' });
  renderWithTheme(<BonusesSection />);

  const field = () => within(card()).getByRole('textbox', { name: /^Name of set/ });
  await user.click(field());
  await user.keyboard('Caesar{Enter}');
  expect(profile()?.sources.equipmentSetNames).toEqual({ s1: 'Caesar' });

  await user.click(field());
  await user.keyboard('Nero{Escape}');
  expect(profile()?.sources.equipmentSetNames).toEqual({ s1: 'Caesar' });

  await user.click(field());
  await user.keyboard('Nero');
  await user.click(document.body);
  expect(profile()?.sources.equipmentSetNames).toEqual({ s1: 'Nero' });
});

test('Add equipment keeps the chosen set for the next piece, and the sheet can start a new set', async () => {
  const user = userEvent.setup();
  seedPieces([{ id: 'a1', equipmentId: 'war-master', setId: 's1' }], { s1: 'Alexander' });
  renderWithTheme(<BonusesSection />);

  fireEvent.click(within(card()).getByRole('button', { name: 'Add equipment' }));
  let sheet = screen.getByRole('dialog');
  expect(profile()?.sources.equipment[1]?.setId).toBeUndefined();
  await chooseIn(user, sheet, 'Set', 'Alexander');
  expect(profile()?.sources.equipment[1]?.setId).toBe('s1');
  done(sheet);

  fireEvent.click(within(card()).getByRole('button', { name: 'Add equipment' }));
  expect(profile()?.sources.equipment[2]?.setId).toBe('s1');
  sheet = screen.getByRole('dialog');
  await chooseIn(user, sheet, 'Set', 'New set');
  const fresh = profile()?.sources.equipment[2]?.setId;
  expect(fresh).toBeDefined();
  expect(fresh).not.toBe('s1');
});

test.each([
  [0, 6],
  [1, 3],
  [2, 6],
  [3, 9],
])('the slot counter with %i captains reads against %i slots, quietly', (captains, slots) => {
  seedPieces([{ id: 'p1', equipmentId: 'war-master', on: true }]);
  const ids = captainTable.slice(0, captains).map((record, index) => ({
    id: `c${String(index)}`,
    captainId: record.id,
    level: 1,
    star: 0,
  }));
  updateSources(profile()!.id, (sources) => ({ ...sources, captains: ids }));
  useStore.getState().updateActiveSetup((current) => ({
    active: { ...current.active, captains: ids.map((entry) => entry.id) },
  }));
  renderWithTheme(<BonusesSection />);
  expect(within(card()).getByText(`1 of ${String(slots)} worn`)).toBeTruthy();
});

test('wearing more than the slots tints the counter and blocks nothing', () => {
  const nine = Array.from({ length: 7 }, (_, index) => ({
    id: `p${String(index)}`,
    equipmentId: 'war-master',
    on: true,
  }));
  seedPieces(nine);
  renderWithTheme(<BonusesSection />);
  const counter = within(card()).getByText('7 of 6 worn');
  expect(counter.getAttribute('data-over')).toBe('true');
  expect(setup()?.active.equipment).toHaveLength(7);
  expect(within(card()).queryByRole('alert')).toBeNull();
});

// ---- B-20: drag a piece onto a set -------------------------------------------------------------------
/**
 * jsdom has no layout, so the drop targets get boxes of their own: the sets stack down the card and
 * the pointer is released inside the one dragged to. Everything else measures as nothing.
 */
const BOXES: Record<string, [number, number]> = {
  'Set Alexander': [0, 100],
  'Set Caesar': [100, 200],
  'No set': [200, 300],
  // Below every card: a release here is a release over nothing.
  Nowhere: [900, 1000],
};

function stubBoxes(): () => void {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    const [top, bottom] = BOXES[this.getAttribute('aria-label') ?? ''] ?? [0, 0];
    const wide = bottom === 0 ? 0 : 500;
    return {
      top,
      bottom,
      left: 0,
      right: wide,
      width: wide,
      height: bottom - top,
      x: 0,
      y: top,
      toJSON: () => ({}),
    };
  };
  return () => {
    Element.prototype.getBoundingClientRect = original;
  };
}

/** Press a piece, move past the activation distance, then release over a target by its group name. */
async function dragPiece(name: string, target: string): Promise<void> {
  const [, bottom] = BOXES[target] ?? [0, 0];
  const grip = sourceChip(name).closest('[data-piece-id]');
  if (grip === null) throw new Error(`${name} cannot be dragged`);
  const y = (BOXES[target]?.[0] ?? 0) + (bottom - (BOXES[target]?.[0] ?? 0)) / 2;
  fireEvent.mouseDown(grip, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.mouseMove(document, { clientX: 20, clientY: 30 });
  fireEvent.mouseMove(document, { clientX: 50, clientY: y });
  await act(async () => {
    await Promise.resolve();
  });
  fireEvent.mouseUp(document, { clientX: 50, clientY: y });
  // dnd-kit swallows every click on the document until 50 ms after a drag ends: wait it out, or the click
  // of this test (or of the next one) is lost.
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 60));
  });
}

const setOf = (id: string): string | undefined =>
  profile()?.sources.equipment.find((p) => p.id === id)?.setId;

test('dropping a piece on another set moves it there and switches nothing', async () => {
  const restore = stubBoxes();
  seedPieces([...alexander, { id: 'b1', equipmentId: 'guardian-of-justice', setId: 's2' }], {
    s1: 'Alexander',
    s2: 'Caesar',
  });
  renderWithTheme(<BonusesSection />);
  const before = setup()?.active.equipment.toSorted();

  await dragPiece('Steppe Enslaver', 'Set Caesar');
  restore();

  expect(setOf('a3')).toBe('s2');
  expect(setup()?.active.equipment.toSorted()).toEqual(before);
});

test('dropping a piece on No set takes it out of its set, even when no piece was loose', async () => {
  const restore = stubBoxes();
  seedPieces(alexander, { s1: 'Alexander' });
  renderWithTheme(<BonusesSection />);
  expect(within(card()).queryByRole('group', { name: 'No set' })).toBeNull();

  await dragPiece('War Master', 'No set');
  restore();

  expect(setOf('a2')).toBeUndefined();
  expect(setup()?.active.equipment.toSorted()).toEqual(['a1', 'a2']);
});

test('dropping a piece on its own set, or on nothing, changes nothing', async () => {
  const restore = stubBoxes();
  seedPieces(alexander, { s1: 'Alexander' });
  renderWithTheme(<BonusesSection />);
  const before = profile()?.sources.equipment;
  const on = setup()?.active.equipment;

  await dragPiece('War Master', 'Set Alexander');
  expect(profile()?.sources.equipment).toEqual(before);
  expect(setup()?.active.equipment).toEqual(on);

  await dragPiece('War Master', 'Nowhere');
  restore();
  expect(profile()?.sources.equipment).toEqual(before);
  expect(setup()?.active.equipment).toEqual(on);
});

test('a plain click on a piece still switches it, and the No set card is gone once a drag ends', async () => {
  const restore = stubBoxes();
  seedPieces(alexander, { s1: 'Alexander' });
  renderWithTheme(<BonusesSection />);

  fireEvent.click(sourceChip('Steppe Enslaver'));
  expect(setup()?.active.equipment).toContain('a3');

  await dragPiece('War Master', 'Set Alexander');
  restore();
  expect(within(card()).queryByRole('group', { name: 'No set' })).toBeNull();
});
