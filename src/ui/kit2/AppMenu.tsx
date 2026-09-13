/**
 * The account menu (plan §3): sections with a heading, items that may carry a glyph and a second
 * line, the destructive ones in the danger colour, and one segmented row — the theme switch, which
 * belongs in the menu rather than in the bar because it is set once and then forgotten.
 *
 * The menu is declared as data rather than as children so the shell cannot invent a shape: every
 * entry is one of three kinds and each kind has one appearance.
 */
import { Menu, SegmentedControl, Text } from '@mantine/core';
import type { ReactNode } from 'react';

export interface AppMenuAction {
  kind?: 'action';
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
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

export type AppMenuEntry = AppMenuAction | AppMenuSegment;

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
    <Menu shadow="md" width={width} position="bottom-end" withinPortal={false}>
      {/* The trigger itself, never a wrapper: `Menu.Target` stamps `aria-expanded` and
          `aria-haspopup` onto whatever it is given, and neither is allowed on a `<span>`
          (investigation 0007's `aria-allowed-attr`). The trigger carries its own name. */}
      <Menu.Target>{trigger}</Menu.Target>
      <Menu.Dropdown aria-label={label}>
        {sections.map((section, index) => (
          <div key={section.id}>
            {index > 0 && <Menu.Divider />}
            {section.title !== undefined && <Menu.Label>{section.title}</Menu.Label>}
            {section.entries.map((entry) =>
              entry.kind === 'segment' ? (
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
      </Menu.Dropdown>
    </Menu>
  );
}
