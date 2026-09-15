/**
 * Where the march lives, and nothing else.
 *
 * It used to hold `scrollToMarch`, which pushed a phone the whole height of the setup column after
 * every Generate (2.14 screens, measured by `e2e/journeys.spec.ts` on 2026-09-13). The frame no
 * longer needs it: the March is the sticky pane's own column on a desktop and the sheet the bottom
 * bar opens on a phone, so a run changes what is already on screen and the page never moves under
 * the thumb (design rules 5 and 17).
 */

/** The anchor of the March section (the registry id): its landmark, and what specs locate it by. */
export const MARCH_ANCHOR = 'march';

/**
 * The anchor of the March's second half, the panel at the foot of the setup column (owner,
 * 2026-09-15). It has no registry id of its own: it is not a page *section*, it is the second host of
 * blocks the March already owns, drawn only from 1200 px up — below that they live in the March sheet
 * instead, which is the same March written in the one place a phone has room for.
 */
export const MARCH_FOOT_ANCHOR = 'march-foot';
