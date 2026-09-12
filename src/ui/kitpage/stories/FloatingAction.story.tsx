import type { ReactNode } from 'react';

import { GenerateIcon } from '../../icons';
import { FloatingAction } from '../../kit';
import type { KitStory } from '../story';

/**
 * The real button is `fixed`. `transform-gpu` on the frame makes it a containing block, so each
 * state can be seen in its own corner instead of four of them stacked on the page.
 */
function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted text-xs">{label}</span>
      <div className="rounded-card border-line bg-bg relative h-32 w-64 max-w-full transform-gpu overflow-hidden border">
        {children}
      </div>
    </div>
  );
}

const story: KitStory = {
  name: 'FloatingAction',
  group: 'kit',
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Frame label="ready">
        <FloatingAction label="Generate march" state="ready" icon={<GenerateIcon />} />
      </Frame>
      <Frame label="stale">
        <FloatingAction label="Generate march" state="stale" icon={<GenerateIcon />} />
      </Frame>
      <Frame label="running">
        <FloatingAction label="Generate march" state="running" icon={<GenerateIcon />} />
      </Frame>
      <Frame label="blocked">
        <FloatingAction
          label="Generate march"
          state="blocked"
          hint="Add troops first"
          icon={<GenerateIcon />}
        />
      </Frame>
      <Frame label="glyph only">
        <FloatingAction label="Generate march" state="ready" icon={<GenerateIcon />} showLabel={false} />
      </Frame>
    </div>
  ),
};

export default story;
