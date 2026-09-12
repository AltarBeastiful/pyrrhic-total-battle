/** Class fragments shared by every kit component. Import these; never retype them. */

/** The focus ring: visible only for keyboard focus, drawn outside the control. */
export const ring =
  'outline-none focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2';

/** Comfortable touch target on phones, tighter with a pointer. */
export const tapTarget = 'min-h-11 sm:min-h-9';

/** Disabled look shared by controls. */
export const disabledLook = 'disabled:cursor-not-allowed disabled:opacity-50';
