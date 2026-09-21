/**
 * The command bar as a thumb and a keyboard meet it (the independent review of 2026-09-13).
 *
 * Four of that review's findings can only be checked in a real browser, because every one of them
 * is a measurement or a browser behaviour rather than a piece of markup:
 *
 * - the on-screen keyboard used to cover the bar. `interactive-widget=resizes-content` turns the
 *   keyboard into a *shorter page*, which is exactly what shrinking the viewport is here;
 * - the targets: 44 px chips and answer row, a 48 px Generate on a phone;
 * - 1 100 px used to draw the phone bar, with four chips 341 px wide;
 * - `Enter` in a housing field does nothing unless the bar is a form.
 */
import { expect, test, type Locator, type Page } from '@playwright/test';

import {
  editHousing,
  generateButton,
  generateState,
  housingChip,
  marchSection,
  objectiveChip,
  objectiveSelect,
  openApp,
  settle,
  watchConsole,
} from './helpers';

/** The bar itself, at either width: one form, named after what it writes. */
const bar = (page: Page): Locator => page.getByRole('form', { name: 'This march' });

/** What a box measures right now; the specs below only ever ask about heights and widths. */
async function box(locator: Locator) {
  const found = await locator.boundingBox();
  if (found === null) throw new Error('the element is not on the page');
  return found;
}

/** Choose Complete optimization: the one method that decides the objective for itself. */
async function lockObjective(page: Page): Promise<void> {
  const battle = page.locator('#battle');
  const change = battle.getByRole('button', { name: 'Change Stacking method' });
  if ((await change.count()) > 0) await change.click();
  await battle.getByRole('radio', { name: 'Complete optimization' }).click();
}

/** The ⓘ that carries the locked objective's reason where the bar has no room to print it. */
const objectiveWhy = (page: Page): Locator =>
  page.getByRole('button', { name: 'Why the objective is decided by the plan' });

/**
 * What a control is painted with: the five declarations that make two of them the same object.
 *
 * `e2e/` compiles without the DOM lib (`e2e/helpers.ts` explains why), so the snippet handed to the
 * browser describes only the shape it touches, and the cast sits inside the callback because the
 * function is serialised and cannot close over anything declared out here.
 */
interface Paint {
  background: string;
  border: string;
  ink: string;
  shadow: string;
  opacity: string;
}

async function paint(control: Locator): Promise<Paint> {
  return control.evaluate((node): Paint => {
    const view = globalThis as unknown as {
      getComputedStyle: (element: unknown) => {
        backgroundColor: string;
        borderColor: string;
        color: string;
        boxShadow: string;
        opacity: string;
      };
    };
    const style = view.getComputedStyle(node);
    return {
      background: style.backgroundColor,
      border: style.borderColor,
      ink: style.color,
      shadow: style.boxShadow,
      opacity: style.opacity,
    };
  });
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test('the bar and the field being typed in stay above the keyboard', async ({ page }) => {
    const problems = watchConsole(page);
    await openApp(page);

    const field = await editHousing(page, 'Leadership');

    // The keyboard, as the meta tag makes the page see it: the window is 344 px shorter.
    await page.setViewportSize({ width: 390, height: 500 });
    await expect(field).toBeVisible();

    const fieldBox = await box(field);
    expect(fieldBox.y + fieldBox.height, 'the open field is under the keyboard').toBeLessThanOrEqual(500);

    const barBox = await box(bar(page));
    expect(barBox.y + barBox.height, 'the bar is under the keyboard').toBeLessThanOrEqual(501);
    await expect(generateButton(page)).toBeVisible();

    expect(problems).toEqual([]);
  });

  test('every chip is a 44 px target, Generate is 48, and the bar sits on the bottom edge', async ({
    page,
  }) => {
    await openApp(page);

    const chip = housingChip(page, 'Leadership');
    expect(Math.round((await box(chip)).height)).toBe(44);
    expect(Math.round((await box(page.getByRole('button', { name: /^Objective: / }))).height)).toBe(44);
    expect(Math.round((await box(generateButton(page))).height)).toBe(48);

    // Full bleed: the ground reaches the bottom of the window and both of its sides, so no live
    // page scrolls past underneath it.
    const barBox = await box(bar(page));
    expect(Math.round(barBox.y + barBox.height)).toBe(844);
    expect(Math.round(barBox.x)).toBe(0);
    expect(Math.round(barBox.width)).toBe(390);

    // And the chip says which pool it is in words, not in an emoji alone.
    await expect(chip).toContainText('Lead');
  });

  /**
   * **The locked objective's reason is a press, not a paragraph** (owner, 2026-09-21). It was two
   * lines of prose above the chips, which took the 390 px bar from 120 px to 164 — a quarter of the
   * height of the keyboard it shares this edge of the window with. The ⓘ next to the chip holds it
   * now, at the row's own 44 px, and the row still fits: four chips and the button on one line.
   */
  test('a locked objective is an ⓘ beside the chip, and the bar does not grow for it', async ({ page }) => {
    await openApp(page);

    const before = Math.round((await box(bar(page))).height);
    await lockObjective(page);
    await expect(objectiveChip(page)).toBeDisabled();

    const why = objectiveWhy(page);
    const target = await box(why);
    expect(Math.round(target.height)).toBe(44);
    // On the chips' own line, to the right of the chip it speaks for, and the bar is as it was.
    const chip = await box(objectiveChip(page));
    expect(Math.round(target.y)).toBe(Math.round(chip.y));
    expect(target.x).toBeGreaterThan(chip.x);
    expect(Math.round((await box(bar(page))).height)).toBe(before);

    // Nothing is drawn until it is pressed: the one copy on the page is the clipped one the button
    // is described by, which is how a popover says anything to a screen reader before it opens.
    const said = page.getByText('The plan weighs damage against what it costs, so it decides this itself.');
    await expect(said).toHaveCount(1);
    expect(Math.round((await box(said)).height)).toBeLessThanOrEqual(1);

    await why.click();
    await expect(said).toHaveCount(2);
    await expect(said.last()).toBeVisible();
    expect((await box(said.last())).height).toBeGreaterThan(16);
  });

  /**
   * The bar is one control set drawn twice, so it has to be one *material* twice over (owner,
   * 2026-09-19: *"I need the same color of desktop wide mode in mobile mode"*). Only a browser can
   * check it: the chips are the app's own CSS and the wells one width up are Mantine's, and the two
   * had drifted apart in both schemes — `#101413` against `#2b3231` in the dark one, because the
   * chips read the well token the artboards draw with and Mantine overrides it on every input
   * wrapper — while a locked objective was greyed out at 1400 px and looked live at 390.
   */
  test('a chip is the same material as the well it is one width up', async ({ page }) => {
    await openApp(page);

    // The plan decides the objective for itself: the one state the fourth chip is locked in.
    const battle = page.locator('#battle');
    await battle.getByRole('button', { name: 'Change Stacking method' }).click();
    await battle.getByRole('radio', { name: 'Complete optimization' }).click();
    await expect(objectiveChip(page)).toBeDisabled();

    const chip = await paint(housingChip(page, 'Leadership'));
    const locked = await paint(objectiveChip(page));

    await page.setViewportSize({ width: 1400, height: 900 });
    const well = await paint(page.getByRole('textbox', { name: 'Leadership', exact: true }));
    const disabled = await paint(objectiveSelect(page));

    expect(chip, 'a housing chip and the housing well it becomes').toEqual(well);
    expect(locked, 'a locked objective chip and the locked objective select').toEqual(disabled);
  });
});

test.describe('between 1024 and 1199 px', () => {
  test.use({ viewport: { width: 1100, height: 800 } });

  test('the bar is the desktop one, and its wells stop at 220 px', async ({ page }) => {
    await openApp(page);

    // Wells standing open, not chips waiting to be tapped.
    await expect(housingChip(page, 'Leadership')).toHaveCount(0);
    for (const pool of ['Leadership', 'Authority', 'Dominance'] as const) {
      const field = page.getByRole('textbox', { name: pool, exact: true });
      await expect(field).toBeVisible();
      expect((await box(field)).width, `${pool} is wider than 220 px`).toBeLessThanOrEqual(220);
    }
    const objective = page.getByRole('combobox', { name: 'Objective' });
    expect((await box(objective)).width).toBeLessThanOrEqual(220);

    // The March has no pane at this width, so the answer is in the bar and opens the sheet.
    await page.getByRole('button', { name: 'Open the march recap' }).click();
    await expect(page.getByRole('dialog', { name: 'March' })).toBeVisible();
  });

  /**
   * The width where the sentence cannot be printed at all: the four wells share this row with the
   * answer and Generate, and there is no column left for it (measured 2026-09-21, 14 px *short* of
   * the four wells' own 220 px). So this bar takes the phone's answer — the ⓘ — and stays one row.
   */
  test('the reason is behind the ⓘ here too, and the bar stays one row', async ({ page }) => {
    await openApp(page);

    const before = Math.round((await box(bar(page))).height);
    await lockObjective(page);
    await expect(objectiveSelect(page)).toBeDisabled();

    await expect(objectiveWhy(page)).toBeVisible();
    // Nothing under the well: with no description rendered, the select has nothing to point at.
    await expect(objectiveSelect(page)).not.toHaveAttribute('aria-describedby', /./);
    expect(Math.round((await box(bar(page))).height)).toBe(before);
  });

  /**
   * **The wells give way, Generate never does.** The row is the tightest here — four wells, the
   * answer and the gold button on 1 052 px — and `.commandFields` asks for what is left of the row
   * rather than for the width of everything in it (`flex: 1 1 0`, `shell.module.css`). With `auto`
   * it asked for more than the row had and the shrink came off Generate: measured 2026-09-21, a
   * button whose own label wrapped inside a height the bar pins at 44 px, so nothing *looked* wrong
   * until you read it. The button carries a `Ctrl ↵` hint wherever the pointer is fine, which is
   * 45 px of the width this protects — hence a comparison rather than a number: the same button, at
   * the widest window and at the narrowest, is the same size.
   */
  test('Generate is the same button at 1 100 px as at 1 663, with the objective locked', async ({ page }) => {
    await openApp(page);
    await lockObjective(page);
    // Housing in, so the button is live and carries its full label rather than "Add housing first".
    await (await editHousing(page, 'Leadership')).fill('84300');

    const tight = await box(generateButton(page));
    await page.setViewportSize({ width: 1663, height: 887 });
    const roomy = await box(generateButton(page));

    expect(Math.round(tight.width)).toBe(Math.round(roomy.width));
    expect(Math.round(tight.height)).toBe(Math.round(roomy.height));
  });
});

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1400, height: 900 } });

  test('Enter in a housing field generates, and a figure past the ceiling is said once', async ({ page }) => {
    const problems = watchConsole(page);
    await openApp(page);

    const field = await editHousing(page, 'Leadership');
    await field.fill('4100');
    await field.press('Enter');
    await settle(page);
    await expect(generateState(page)).toHaveAttribute('data-state', 'ready');
    // A march came back: the pane carries its figures.
    await expect(marchSection(page).getByText('Expected damage', { exact: true })).toBeVisible();

    // The keypad a phone would open on this field, and the pool's ceiling, said once above the row.
    expect(await field.getAttribute('inputmode')).toBe('numeric');
    expect(await field.getAttribute('enterkeyhint')).toBe('go');

    await field.fill('200000000');
    const message = bar(page).getByRole('alert');
    await expect(message).toHaveText('Leadership is over the 100 000 000 a pool can hold.');
    await expect(field).toHaveAttribute('aria-invalid', 'true');

    expect(problems).toEqual([]);
  });

  /**
   * **A locked objective costs the bar nothing** (owner, 2026-09-21: *"could be on the right side of
   * the objective to avoid too high bar"*). The sentence used to be printed under the well and the
   * bar grew by a third to carry it — 88 px to 119.7 at 1400, and 134 at 1100, over the 120 px
   * `--pyr-commandbar-height` reserves for it. Only a browser can check this: it is a measurement of
   * a wrapped paragraph in a flex row, and the grid that fixes it is CSS the tests cannot render.
   */
  test('the reason stands beside the objective, and the bar keeps its height', async ({ page }) => {
    await openApp(page);

    const before = Math.round((await box(bar(page))).height);
    await lockObjective(page);
    await expect(objectiveSelect(page)).toBeDisabled();

    const reason = bar(page).getByText(
      'The plan weighs damage against what it costs, so it decides this itself.',
    );
    await expect(reason).toBeVisible();
    // Printed, so there is nothing to press for it.
    await expect(objectiveWhy(page)).toHaveCount(0);

    // Beside the well, not under it: the next column along, and two lines of it (owner: *"keep it on
    // two lines though for readability"*). 13 px is the design's one caption size and Mantine writes
    // 11 px inline on a sized input's description, so the size is asserted where it is drawn.
    const well = await box(objectiveSelect(page));
    const said = await box(reason);
    expect(said.x).toBeGreaterThan(well.x + well.width);
    await expect(reason).toHaveCSS('font-size', '13px');
    expect(Math.round(said.height)).toBeGreaterThan(24);
    expect(Math.round(said.height)).toBeLessThanOrEqual(44);
    expect(Math.round((await box(bar(page))).height)).toBe(before);
  });
});
