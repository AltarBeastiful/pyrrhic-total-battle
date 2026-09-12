import type { ReactNode } from 'react';

import { GenerateIcon } from '../../icons';
import { FloatingAction } from '../../kit';
import { Stack } from '../../layout';
import { AppBar } from '../../shell/AppBar';
import type { KitStory } from '../story';

/**
 * The floating button is `fixed`; `transform-gpu` on the frame makes it a containing block, so the
 * four states sit in four corners here instead of stacking in the corner of the kit page.
 */
function Frame({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-muted text-xs">{label}</span>
      <div className="rounded-card border-line bg-bg relative h-28 w-56 max-w-full transform-gpu overflow-hidden border">
        {children}
      </div>
    </div>
  );
}

const story: KitStory = {
  name: 'Shell',
  group: 'shell',
  render: () => (
    <Stack gap={4}>
      <div className="rounded-card border-line bg-bg overflow-hidden border">
        <AppBar />
      </div>

      <div className="flex flex-wrap gap-4">
        <Frame label="ready (below xl)">
          <FloatingAction label="Generate march" state="ready" icon={<GenerateIcon />} />
        </Frame>
        <Frame label="stale — the setup changed">
          <FloatingAction label="Generate march" state="stale" icon={<GenerateIcon />} />
        </Frame>
        <Frame label="running — press cancels">
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
        <Frame label="under 400 px">
          <FloatingAction label="Generate march" state="ready" icon={<GenerateIcon />} showLabel={false} />
        </Frame>
      </div>
    </Stack>
  ),
};

export default story;
