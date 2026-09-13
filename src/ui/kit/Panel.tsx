/**
 * The page's one object (design plan §5.5, direction A — artboards `docs/design-canvas/`): a lit
 * block with a faint top light, one hairline and one soft shadow. Every setup section is one, the
 * March is the brighter and deeper `pane` variant of it, and anything sunk into either — a
 * read-only figure, a housing field's ground — is the `well`.
 *
 * The shapes themselves are three classes in `theme.module.css` reading variables that
 * `cssVariablesResolver` writes out of `DEPTH` in `palette.ts`. That is the whole point of this
 * component: a section asks for a panel, never for a gradient, a border colour or a shadow (design
 * rule 23; `docs/design.md` §2).
 *
 * When it is given a `title` it writes the panel's head as the artboards draw it: the title on the
 * left at the h2 step, and the muted meta line right-aligned beside it ("G1–G3 · S1", "2 hired").
 * The meta is a *summary of the form under it*, never a second control — design rule 6.
 */
import { Text, Title } from '@mantine/core';
import { createElement, type CSSProperties, type ReactNode } from 'react';

import classes from '../theme.module.css';

export type PanelSurface = 'panel' | 'pane' | 'well';

export interface PanelProps {
  /** Which of the three surfaces this is. Defaults to the setup section's `panel`. */
  surface?: PanelSurface;
  /** The element to draw. A setup section is a `section`, the March pane an `aside`. */
  component?: 'div' | 'section' | 'aside' | 'article';
  id?: string;
  /** The panel's title, at the h2 step. Given, the panel draws its own head. */
  title?: ReactNode;
  /** The id the title is given, so the section can be `aria-labelledby` it. */
  titleId?: string;
  /** Right-aligned and muted, beside the title: what the form under it currently says. */
  meta?: ReactNode;
  /** The one style a caller may set: the pane runs the height of the column it sticks in. */
  style?: CSSProperties;
  /** Names the region when there is no visible title. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  children: ReactNode;
}

const SURFACE_CLASS: Record<PanelSurface, string> = {
  panel: classes.panel ?? '',
  pane: classes.pane ?? '',
  well: classes.well ?? '',
};

export function Panel({
  surface = 'panel',
  component = 'div',
  id,
  title,
  titleId,
  meta,
  children,
  ...rest
}: PanelProps) {
  // `createElement` rather than `<Box component={…}>`: Mantine's polymorphic `component` prop wants
  // a literal, and this one is a prop of ours. Nothing Box adds is needed here — the class is the
  // whole styling, and it reads theme variables.
  return createElement(
    component,
    { id, className: SURFACE_CLASS[surface], ...rest },
    title === undefined ? null : (
      <div key="head" className={classes.panelHeader}>
        <Title order={2} id={titleId}>
          {title}
        </Title>
        {meta !== undefined && (
          <Text span size="xs" fw={500} c="dimmed" className={classes.panelMeta}>
            {meta}
          </Text>
        )}
      </div>
    ),
    children,
  );
}
