import type { ReactNode } from 'react';

/** One entry on the kit page: every variant, size and state of one component, with no app state. */
export interface KitStory {
  name: string;
  group: 'kit' | 'layout' | 'domain' | 'shell';
  render: () => ReactNode;
}
