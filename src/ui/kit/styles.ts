/** Class fragments shared by every kit component. Import these; never retype them. */

/** The focus ring: visible only for keyboard focus, drawn outside the control. */
export const ring =
  'outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2';

/** Comfortable touch target on phones, tighter with a pointer. */
export const tapTarget = 'min-h-11 sm:min-h-9';

/**
 * The height of a control that sits in a row of fields: 44 px for a thumb, the Material 3 button and
 * text-field height of 40 px once there is a pointer. Buttons, steppers, selects and segments all
 * use it, so a button always lines up with the field beside it.
 */
export const controlHeight = 'min-h-11 sm:min-h-10';

/**
 * The Material 3 state layer over a *neutral* container: the on-surface colour at 8 % on hover and
 * 10 % on press or keyboard focus, instead of a bespoke hover colour per component.
 *
 * The variant names are the plugin's, not React Aria's attribute names: `hover:` and `focus:` are
 * rewritten to match `data-hovered`/`data-focused` as well as the native pseudo-classes, while
 * `pressed:` and `selected:` exist only as data attributes. `hovered:` and `focused:` are *not*
 * variants — they compile to nothing, which is how the kit's hover states came to be missing.
 */
export const stateLayer = 'hover:bg-fg/8 pressed:bg-fg/10 focus-visible:bg-fg/10';

/** The same layer for an element React Aria does not own: `active:`, since there is no `data-pressed`. */
export const stateLayerDom = 'hover:bg-fg/8 active:bg-fg/10 focus-visible:bg-fg/10';

/**
 * The state layer over a *coloured* container, where a tint of the foreground would be invisible: an
 * `::after` in the on-colour at the same 8 / 10 / 10 %. Pair it with the control's own radius
 * (`after:rounded-control`, `after:rounded-chip`) so the layer keeps the shape of what it covers.
 */
export const stateLayerOn = [
  'relative after:pointer-events-none after:absolute after:inset-0 after:bg-current after:opacity-0',
  'after:transition-opacity after:motion-safe:duration-fast',
  'hover:after:opacity-8 pressed:after:opacity-10 focus-visible:after:opacity-10',
].join(' ');

/** Disabled look shared by controls. */
export const disabledLook = 'disabled:cursor-not-allowed disabled:opacity-50';
