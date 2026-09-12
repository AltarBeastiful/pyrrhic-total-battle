/**
 * Class fragments shared by the form controls (worker B's half of the kit). They are the field
 * equivalent of `./styles.ts`: import them, never retype them.
 *
 * The shape every control keeps is Material 3's **outlined** field: a visible label at
 * `text-sm font-medium` above the control (a control is never labelled by its placeholder), the
 * control itself as one hairline at the 8 px control radius over a transparent ground — a field has
 * a border *or* a fill, never both — and the help lines below in `text-xs`. Focus replaces that
 * hairline with a 2 px accent outline rather than adding a second ring around it.
 */

/** The column a labelled control lives in; 8 px between the label, the control and its help line. */
export const fieldRoot = 'flex min-w-0 flex-col gap-2';

/** The label above a control: always visible, never a placeholder. */
export const fieldLabel = 'text-fg text-sm font-medium';

/** The quiet line under a control. */
export const fieldDescription = 'text-muted text-xs';

/** The line under a control when it holds something we cannot use. */
export const fieldError = 'text-danger text-xs';

/** How tall a field is: 44 px for a thumb, Material 3's 40 px once there is a pointer. */
export const fieldHeight = 'min-h-11 sm:min-h-10';

/** The box a value sits in: one hairline at the control radius, no fill of its own. */
export const fieldBox = 'rounded-control border-field/60 flex items-center border bg-transparent';

/**
 * The typed value itself: figures line up, the box draws the border. `focus-visible:ring-0` cancels
 * the base stylesheet's catch-all focus ring — the *group* around the input shows the focus, and two
 * rings around one field is the double border this pass removes.
 */
export const fieldInput =
  'nums text-fg placeholder:text-muted w-full min-w-0 bg-transparent outline-none focus-visible:ring-0';

/**
 * The focus treatment of a field: the hairline turns accent and a second accent line is drawn one
 * pixel inside it, which makes the Material 3 two-pixel outlined-field focus without a layout shift
 * and without a ring floating outside a border that is still there.
 */
export const ringWithin = [
  'outline-none',
  'focus-within:border-accent focus-within:outline-1 focus-within:outline-accent focus-within:-outline-offset-1',
  'focus-within:ring-0',
].join(' ');

/**
 * The same ring drawn on a child of an element carrying `group` (a switch track, a checkbox mark:
 * the label takes the focus, the mark shows it).
 */
export const ringFromGroup =
  'group-focus-visible:outline-2 group-focus-visible:outline-accent group-focus-visible:outline-offset-2';

/**
 * A quiet pressable living *inside* a field: the stepper's arrows, a clear button. It carries no
 * chrome of its own — only a round state layer, the way Material 3 draws an icon button inside a
 * text field — and its focus ring is drawn *inside* its box, because the field around it clips
 * anything that reaches past its own rounded edge.
 */
export const fieldButton = [
  'text-muted rounded-chip flex shrink-0 items-center justify-center',
  'hover:text-fg hover:bg-fg/8 pressed:bg-fg/10',
  'outline-none focus-visible:bg-fg/10 focus-visible:outline-2 focus-visible:outline-accent',
  'focus-visible:-outline-offset-2 focus-visible:ring-0',
  'disabled:cursor-not-allowed disabled:opacity-50 motion-safe:transition-colors',
].join(' ');
