/**
 * What a thumb leaves behind (the owner's phone review, 2026-09-13: "square borders appearing around
 * chips after a tap").
 *
 * A phone has no pointer, and Chrome keeps `:hover` on the last element a thumb landed on until the
 * next tap lands somewhere else. Every hover rule in the app is therefore written inside
 * `@media (hover: hover)`; an unguarded one is a highlight that appears after a press and never goes
 * away, which is what the screenshots showed. The ring itself is a *keyboard's* ring and has to keep
 * working, so both halves are asserted here: nothing after a tap, the ring after a `Tab`.
 *
 * The emulation is a real touch context (`isMobile` + `hasTouch`), which is what makes
 * `(hover: hover)` false — a desktop context reports a pointer whatever its viewport size, so this
 * cannot ride in one of the other specs.
 */
import { expect, test, type Locator } from '@playwright/test';

import { openApp, watchConsole } from './helpers';

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

/**
 * What a chip looks like right now: the label is the box you see, the input carries the state.
 *
 * `e2e/` compiles without the DOM lib (`e2e/helpers.ts` explains why), so the snippet handed to the
 * browser describes only the shape it touches — and the cast has to sit inside the callback,
 * because the function is serialised and cannot close over anything declared out here.
 */
interface ChipPaint {
  focusVisible: boolean;
  outlineWidth: string;
  borderColor: string;
  background: string;
}

async function chipPaint(chip: Locator): Promise<ChipPaint> {
  return chip.evaluate((node): ChipPaint => {
    interface Painted {
      matches: (selector: string) => boolean;
      parentElement: { querySelector: (selector: string) => Painted } | null;
    }
    const view = globalThis as unknown as {
      getComputedStyle: (element: unknown) => {
        outlineStyle: string;
        outlineWidth: string;
        borderColor: string;
        backgroundColor: string;
      };
    };
    const input = node as unknown as Painted;
    const label = input.parentElement?.querySelector('label');
    const style = view.getComputedStyle(label);
    return {
      focusVisible: input.matches(':focus-visible'),
      outlineWidth: style.outlineStyle === 'none' ? '0px' : style.outlineWidth,
      borderColor: style.borderColor,
      background: style.backgroundColor,
    };
  });
}

test('a tapped chip keeps no ring and no hover ground, and a Tab still rings', async ({ page }) => {
  const problems = watchConsole(page);
  await openApp(page);

  const block = page.locator('#troops');
  const row = block.getByRole('group', { name: 'Guardsmen at G3' });
  const archer = block.getByRole('checkbox', { name: 'Archer III' });
  await expect(archer).toBeChecked();

  const on = await chipPaint(archer);

  // The press a player makes: a real tap, on the chip's own body.
  await row.getByText('ARC', { exact: true }).tap();
  await expect(archer).not.toBeChecked();

  const afterTap = await chipPaint(archer);
  expect(afterTap.focusVisible, 'a tap must not raise the keyboard ring').toBe(false);
  expect(afterTap.outlineWidth, 'a tap must not draw a ring around the chip').toBe('0px');
  // Off is the ground the panel is cut from, not a hover wash left on the last thing touched.
  expect(afterTap.background).toBe('rgba(0, 0, 0, 0)');
  // …and the two states are told apart by the ring around the chip, which did change.
  expect(afterTap.borderColor).not.toBe(on.borderColor);

  // The same chip, reached with the keyboard: the ring is the whole of design rule 24 and is still
  // there. From a fresh page, because `Tab` after a press starts *from the thing pressed* and so
  // walks past it — the row is one tab stop and the next stop is outside the group.
  await page.reload();
  await expect(block.getByRole('heading', { level: 2, name: 'Troops' })).toBeVisible();

  const focused = async (): Promise<boolean> =>
    archer.evaluate((node) => {
      const view = globalThis as unknown as { document: { activeElement: unknown } };
      return node === view.document.activeElement;
    });

  for (let step = 0; step < 40 && !(await focused()); step += 1) {
    await page.keyboard.press('Tab');
  }
  expect(await focused(), 'the chip was never reached with Tab').toBe(true);
  const afterTab = await chipPaint(archer);
  expect(afterTab.focusVisible, 'a keyboard must raise the ring').toBe(true);
  expect(afterTab.outlineWidth).not.toBe('0px');

  expect(problems).toEqual([]);
});
