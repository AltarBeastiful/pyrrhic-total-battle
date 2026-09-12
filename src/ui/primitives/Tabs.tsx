import * as RadixTabs from '@radix-ui/react-tabs';
import type { ReactNode } from 'react';

import { cn } from './cn';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  items: TabItem[];
  /** Accessible name of the tab list. */
  label?: string;
  className?: string;
}

export function Tabs({ value, onValueChange, items, label, className }: TabsProps) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className={className}>
      <RadixTabs.List
        {...(label === undefined ? {} : { 'aria-label': label })}
        className="border-line mb-3 flex gap-1 overflow-x-auto border-b"
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'tap text-muted -mb-px rounded-t-lg border-b-2 border-transparent px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
              'hover:text-fg data-[state=active]:border-accent data-[state=active]:bg-accent-soft/50 data-[state=active]:text-fg',
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="outline-none">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
