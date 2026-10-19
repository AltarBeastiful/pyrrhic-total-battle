/**
 * The account menu (plan §3): sections with a heading, items that may carry a glyph and a second
 * line, the destructive ones in the danger colour, and one segmented row — the theme switch, which
 * belongs in the menu rather than in the bar because it is set once and then forgotten.
 *
 * The menu is declared as data rather than as children so the shell cannot invent a shape: every
 * entry is one of three kinds and each kind has one appearance.
 */
import { Menu, SegmentedControl, Text, VisuallyHidden } from '@mantine/core';
import type { ReactNode } from 'react';

export interface AppMenuAction {
  kind?: 'action';
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  /** A one-of-many row (a profile switcher): Mantine fixes the role, so the chosen one says "(active)" aloud. */
  checked?: boolean;
  onSelect: () => void;
}

export interface AppMenuSegment {
  kind: 'segment';
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: ReactNode }[];
}

/** A line of status the menu reports and nothing can be pressed on. */
export interface AppMenuNote {
  kind: 'note';
  id: string;
  label: string;
}

export type AppMenuEntry = AppMenuAction | AppMenuSegment | AppMenuNote;

export interface AppMenuSection {
  id: string;
  title?: string;
  entries: AppMenuEntry[];
}

export interface AppMenuProps {
  /** The menu's accessible name, on the trigger. */
  label: string;
  trigger: ReactNode;
  sections: AppMenuSection[];
  width?: number;
}

export function AppMenu({ label, trigger, sections, width = 240 }: AppMenuProps) {
  return (
    // `withInitialFocusPlaceholder` is on by default and renders a `role="presentation"` div as the
    // first child of the `role="menu"` dropdown, which is a child that role does not allow (axe
    // `aria-required-children`). Off, the focus trap lands on the first item — which is what a menu
    // owes the keyboard anyway — but it also painted the first row as hovered on every open, next to
    // the check mark that already marks the active profile. So a wrapper around the sections takes the
    // initial focus (`data-autofocus`; the trap only looks among the dropdown's descendants), and the arrow keys carry it to the first item from there.
    // Portalled to the body and stacked over every bar (`theme.ts`): left in place it was a child of
    // the app bar, which paints at 100 — under the command bar's 250 — so the last rows of a long
    // account menu were covered by the bar at the bottom of the window.
    <Menu shadow="md" width={width} position="bottom-end" withinPortal withInitialFocusPlaceholder={false}>
      {/* The trigger itself, never a wrapper: `Menu.Target` stamps `aria-expanded` and
          `aria-haspopup` onto whatever it is given, and neither is allowed on a `<span>`
          (investigation 0007's `aria-allowed-attr`). The trigger carries its own name. */}
      <Menu.Target>{trigger}</Menu.Target>
      {/* Long menus (a signed-in account has a dozen rows) scroll inside the dropdown instead of
          running past the viewport, where the last rows could not be reached. */}
      <Menu.Dropdown aria-label={label} mah="calc(100dvh - 5rem)" style={{ overflowY: 'auto' }}>
        <div data-autofocus tabIndex={-1} style={{ outline: 0 }}>
          {sections.map((section, index) => (
            <div key={section.id}>
              {index > 0 && <Menu.Divider />}
              {section.title !== undefined && <Menu.Label>{section.title}</Menu.Label>}
              {section.entries.map((entry) =>
                entry.kind === 'note' ? (
                  <Text key={entry.id} size="xs" c="dimmed" px="sm" py={6} role="status">
                    {entry.label}
                  </Text>
                ) : entry.kind === 'segment' ? (
                  <Menu.Item key={entry.id} component="div" closeMenuOnClick={false}>
                    <Text size="xs" c="dimmed" mb={4}>
                      {entry.label}
                    </Text>
                    <SegmentedControl
                      fullWidth
                      size="xs"
                      aria-label={entry.label}
                      data={entry.options}
                      value={entry.value}
                      onChange={entry.onChange}
                    />
                  </Menu.Item>
                ) : (
                  <Menu.Item
                    key={entry.id}
                    leftSection={entry.icon}
                    {...(entry.danger === true ? { color: 'red' as const } : {})}
                    disabled={entry.disabled ?? false}
                    onClick={entry.onSelect}
                  >
                    {entry.label}
                    {entry.checked === true && (
                      <>
                        {' '}
                        <VisuallyHidden>(active)</VisuallyHidden>
                      </>
                    )}
                    {entry.description !== undefined && (
                      <Text size="xs" c="dimmed">
                        {entry.description}
                      </Text>
                    )}
                  </Menu.Item>
                ),
              )}
            </div>
          ))}
        </div>
      </Menu.Dropdown>
    </Menu>
  );
}
