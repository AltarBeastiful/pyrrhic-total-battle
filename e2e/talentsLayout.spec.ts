/// <reference lib="dom" />
/**
 * B-30 Talents page layout, measured with real boxes: the docked strip never covers a card, every card has one size and
 * one footer offset, connectors meet card edge midpoints, the recap and detail column never scroll on their own, the
 * detail sticks only in a tall window, and the rank table opens in a dialog.
 */
import { expect, test, type Page } from '@playwright/test';

import { openApp, pageOverflowsSideways } from './helpers';

const SIZES = [
  { name: 'wide', width: 2000, height: 1100 },
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'phone', width: 390, height: 844 },
] as const;

async function openTalents(page: Page): Promise<void> {
  await openApp(page);
  await page.getByRole('banner').getByRole('button', { name: 'Hero talents' }).click();
  await page.getByRole('textbox', { name: 'Hero level' }).fill('150');
  await page.getByRole('textbox', { name: 'Talent points (your whole stock)' }).fill('40');
  await page.getByRole('radiogroup', { name: 'Tree' }).getByText('Battle', { exact: true }).click();
}

for (const { name, width, height } of SIZES) {
  test(`talents layout at ${name} (${String(width)} px)`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await openTalents(page);
    const tiles = page.locator('button[data-node-id]');
    await expect(tiles.first()).toBeVisible();

    // One size, one footer offset.
    const geo = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('button[data-node-id]')].map((b) => {
        const r = b.getBoundingClientRect();
        const f = b.querySelector<HTMLElement>('[class*="foot"]')!.getBoundingClientRect();
        return { w: r.width, h: r.height, off: f.top - r.top };
      }),
    );
    expect(geo.length).toBeGreaterThan(5);
    for (const g of geo) {
      expect(Math.abs(g.w - geo[0]!.w)).toBeLessThan(0.5);
      expect(Math.abs(g.h - geo[0]!.h)).toBeLessThan(0.5);
      expect(Math.abs(g.off - geo[0]!.off)).toBeLessThan(0.5);
    }

    // Connector ends sit on edge midpoints of cards.
    const miss = await page.evaluate(() => {
      const plane = document.querySelector<HTMLElement>('[role="region"][aria-label$="tree"] > div')!;
      const p = plane.getBoundingClientRect();
      const boxes = [...plane.querySelectorAll<HTMLElement>('button[data-node-id]')].map((b) => {
        const r = b.getBoundingClientRect();
        return { l: r.left - p.left, t: r.top - p.top, r: r.right - p.left, b: r.bottom - p.top };
      });
      const onMid = (x: number, y: number) =>
        boxes.some((q) => {
          const mx = (q.l + q.r) / 2;
          const my = (q.t + q.b) / 2;
          return (
            (Math.abs(x - mx) < 1 && (Math.abs(y - q.t) < 1 || Math.abs(y - q.b) < 1)) ||
            (Math.abs(y - my) < 1 && (Math.abs(x - q.l) < 1 || Math.abs(x - q.r) < 1))
          );
        });
      return [...plane.querySelectorAll('line')].filter(
        (l) =>
          !onMid(+l.getAttribute('x1')!, +l.getAttribute('y1')!) ||
          !onMid(+l.getAttribute('x2')!, +l.getAttribute('y2')!),
      ).length;
    });
    expect(miss).toBe(0);

    // The recap shows at once, whole, with nothing selected and with a card selected.
    const recapRows = async () =>
      page.evaluate(() => {
        const r = document.querySelector<HTMLElement>('section[aria-label$="bonuses"]')!;
        const box = r.getBoundingClientRect();
        const list = r.querySelector<HTMLElement>('dl');
        return { visible: box.height > 0, scrolls: list ? list.scrollHeight > list.clientHeight + 1 : false };
      });
    expect((await recapRows()).visible).toBe(true);
    await tiles.first().click();
    const after = await recapRows();
    expect(after.visible).toBe(true);
    expect(after.scrolls).toBe(false);

    // The detail column has no scroll of its own, the page none sideways.
    const detail = await page.evaluate(() => {
      const d = document.querySelector<HTMLElement>('aside[aria-label="Selected node"]')!;
      return { own: d.scrollHeight > d.clientHeight + 1, pos: getComputedStyle(d).position };
    });
    expect(detail.own).toBe(false);
    expect(await pageOverflowsSideways(page)).toBe(false);
    if (width >= 992) expect(detail.pos).toBe(height >= 760 ? 'sticky' : 'static');

    // Scrolling: the strip stays at the top and never overlaps a card.
    await tiles.last().scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(150);
    const overlap = await page.evaluate(() => {
      const s = document
        .querySelector<HTMLElement>('[aria-label="Points and trees"]')!
        .getBoundingClientRect();
      const hits = [...document.querySelectorAll<HTMLElement>('button[data-node-id]')].filter((b) => {
        const r = b.getBoundingClientRect();
        // A card scrolled behind an opaque strip is hidden by it; what must not happen is a card drawn over it.
        const top = document.elementFromPoint(
          Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1),
          Math.min(Math.max(s.top + s.height / 2, 0), innerHeight - 1),
        );
        return (
          r.top < s.bottom && r.bottom > s.top && r.left < s.right && r.right > s.left && b.contains(top)
        );
      });
      return { top: s.top, hits: hits.length };
    });
    expect(overlap.hits).toBe(0);
    expect(Math.abs(overlap.top)).toBeLessThan(1);
    if (width >= 992 && height >= 760) {
      const gap = await page.evaluate(() => {
        const st = document.querySelector('[aria-label="Points and trees"]')!.getBoundingClientRect();
        const d = document.querySelector('aside[aria-label="Selected node"]')!.getBoundingClientRect();
        return { below: d.top - st.bottom, wide: st.width };
      });
      expect(gap.below).toBeGreaterThanOrEqual(0);
      expect(gap.below).toBeLessThan(16);
    }
  });
}

test('the rank table opens in a dialog, closes on Escape and returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTalents(page);
  await page
    .getByRole('button', { name: /^.+, rank 0 of \d+$/ })
    .first()
    .click();
  const open = page.getByRole('button', { name: /^Show all \d+ ranks$/ });
  await open.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.getByRole('listitem').count()).toBeGreaterThan(1);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(open).toBeFocused();
});

test('the detail column scrolls with the page in a short window', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 700 });
  await openTalents(page);
  const pos = await page.evaluate(
    () => getComputedStyle(document.querySelector('aside[aria-label="Selected node"]')!).position,
  );
  expect(pos).toBe('static');
});

test('B-31 tiles: picture, name on two lines, bonus; the pad hangs under the tile and a click away closes the selection', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openTalents(page);
  const tile = page.getByRole('button', { name: /^.+, rank 0 of \d+$/ }).first();
  await expect(tile.locator('img, [class*="icons"]').first()).toBeVisible();
  // Sizes follow the mockup: a 150 x 146 card, a 70 px picture, and nothing spilling out of the card.
  const sizes = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button[data-node-id]')].map((b) => {
      const r = b.getBoundingClientRect();
      const pic = b.querySelector<HTMLElement>('[class*="pic"]')!.getBoundingClientRect();
      const foot = b.querySelector<HTMLElement>('[class*="foot"]')!.getBoundingClientRect();
      const name = b.querySelector<HTMLElement>('[class*="name"]')!.getBoundingClientRect();
      return {
        w: r.width,
        h: r.height,
        pic: pic.width,
        inside: foot.bottom <= r.bottom && name.bottom <= foot.top + 1,
      };
    }),
  );
  for (const z of sizes) {
    expect(z.w).toBe(150);
    expect(z.h).toBe(146);
    expect(z.pic).toBe(70);
    expect(z.inside).toBe(true);
  }

  await tile.hover();
  const pad = page.getByRole('group', { name: /^Ranks of / });
  await expect(pad).toBeVisible();
  const geo = await page.evaluate(() => {
    const t = document.querySelector<HTMLElement>('button[data-node-id]:hover')!.getBoundingClientRect();
    const p = document
      .querySelector<HTMLElement>('[role="group"][aria-label^="Ranks of"]')!
      .getBoundingClientRect();
    return { tb: t.bottom, tc: t.left + t.width / 2, pt: p.top, pc: p.left + p.width / 2 };
  });
  expect(geo.pt).toBeGreaterThanOrEqual(geo.tb - 1);
  expect(geo.pt - geo.tb).toBeLessThan(4);
  expect(Math.abs(geo.pc - geo.tc)).toBeLessThan(2);

  // + raises the rank: the tile now shows a bonus and − comes alive.
  await pad.getByRole('button', { name: /^Add one rank/ }).click();
  await page
    .getByRole('button', { name: /^.+, rank 1 of \d+/ })
    .first()
    .click();
  await expect(page.getByRole('button', { name: /^.+, rank 1 of \d+/ }).first()).toContainText('+');
  await expect(pad.getByRole('button', { name: /^Take one rank back/ })).toBeEnabled();

  // A click on the right column keeps the selection; a click away closes it.
  const hint = page.getByText(/tap a node to see/i);
  await page.locator('aside[aria-label="Selected node"]').click({ position: { x: 4, y: 4 } });
  await expect(hint).toBeHidden();
  await page.mouse.click(5, 450);
  await expect(hint).toBeVisible();
  expect(await pageOverflowsSideways(page)).toBe(false);
});
