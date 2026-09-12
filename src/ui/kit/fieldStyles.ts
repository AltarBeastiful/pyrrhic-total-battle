/**
 * Class fragments shared by the form controls (worker B's half of the kit). They are the field
 * equivalent of `./styles.ts`: import them, never retype them.
 *
 * The shape every control keeps: a visible label at `text-sm text-fg` above the control (a control
 * is never labelled by its placeholder), the control itself on `bg-field` inside a `border-line`
 * hairline at the 8 px control radius, and the help lines below in `text-xs`.
 */

/** The column a labelled control lives in. */
export const fieldRoot = 'flex min-w-0 flex-col gap-1';

/** The label above a control: always visible, never a placeholder. */
export const fieldLabel = 'text-fg text-sm font-medium';

/** The quiet line under a control. */
export const fieldDescription = 'text-muted text-xs';

/** The line under a control when it holds something we cannot use. */
export const fieldError = 'text-danger text-xs';

/** The box a value sits in: field surface, hairline border, control radius. */
export const fieldBox = 'rounded-control border-line bg-field flex items-center border';

/** The typed value itself: figures line up, the box draws the border. */
export const fieldInput = 'nums text-fg placeholder:text-muted w-full min-w-0 bg-transparent outline-none';

/**
 * The focus ring drawn around a group when the control inside it takes keyboard focus (a number
 * field, a search field: the input is focused but the border belongs to the group).
 */
export const ringWithin =
  'outline-none focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-2';

/**
 * The same ring drawn on a child of an element carrying `group` (a switch track, a checkbox mark:
 * the label takes the focus, the mark shows it).
 */
export const ringFromGroup =
  'group-focus-visible:outline-2 group-focus-visible:outline-accent group-focus-visible:outline-offset-2';
