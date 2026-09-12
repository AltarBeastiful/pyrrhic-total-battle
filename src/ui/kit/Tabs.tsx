/**
 * Material 3's **primary tabs**: one row of labels over a hairline, the chosen one marked by a
 * 2 px indicator in the accent and by its ink going from muted to full. Only the chosen panel is
 * mounted, so the tabs of a dialog cost what one panel costs.
 *
 * The arrow keys walk the row and `Home`/`End` jump to its ends — React Aria's roving focus, not a
 * tab stop per label.
 */
import type { ReactNode } from 'react';
import { Tab, TabList, TabPanel, Tabs as RACTabs } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';
import { ring, stateLayer, tapTarget } from './styles';

export interface TabItem {
  /** Matches the `value` the caller holds. */
  value: string;
  /** The visible text of the tab. */
  label: string;
  /** What the tab shows; mounted only while it is the chosen one. */
  content: ReactNode;
}

export interface TabsProps {
  /** The name of the tab row for assistive tech ("Sync"). */
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: TabItem[];
  className?: string;
}

const tabsStyles = tv({
  slots: {
    root: 'flex min-h-0 flex-col gap-4',
    list: 'border-line flex gap-1 overflow-x-auto border-b',
    tab: cn(
      'relative -mb-px inline-flex cursor-pointer items-center justify-center whitespace-nowrap',
      'rounded-t-control border-b-2 border-transparent px-4 text-sm font-medium',
      'text-muted selected:text-fg selected:border-accent',
      'motion-safe:transition-colors motion-safe:duration-fast',
      'disabled:cursor-not-allowed disabled:opacity-50',
      stateLayer,
      ring,
      'focus-visible:-outline-offset-2',
      tapTarget,
    ),
    panel: 'min-h-0 outline-none',
  },
});

export function Tabs({ label, value, onChange, items, className }: TabsProps) {
  const styles = tabsStyles();

  return (
    <RACTabs
      className={cn(styles.root(), className)}
      selectedKey={value}
      onSelectionChange={(key) => {
        onChange(String(key));
      }}
    >
      <TabList aria-label={label} className={styles.list()}>
        {items.map((item) => (
          <Tab key={item.value} id={item.value} className={styles.tab()}>
            {item.label}
          </Tab>
        ))}
      </TabList>
      {items.map((item) => (
        <TabPanel key={item.value} id={item.value} className={styles.panel()}>
          {item.content}
        </TabPanel>
      ))}
    </RACTabs>
  );
}
