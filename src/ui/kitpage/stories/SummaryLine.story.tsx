import { SummaryLine } from '../../domain';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'SummaryLine',
  group: 'domain',
  render: () => (
    <div className="flex flex-col gap-4">
      <SummaryLine
        parts={[
          { group: 'guardsmen', text: 'G1–G4' },
          { group: 'specialists', text: 'S1–S2' },
          { group: 'engineers', text: 'no engineers', muted: true },
          { group: 'monsters', text: 'M3–M5' },
        ]}
        trailing={<span className="text-muted text-sm">⌄</span>}
      />
      <SummaryLine
        parts={[
          { group: 'mercenaries', text: 'ABM6 ×22' },
          { group: 'mercenaries', text: 'ABT6 ×24' },
          { group: 'mercenaries', text: 'BER5 ×∞' },
          { text: '+3 more', muted: true },
        ]}
      />
      <SummaryLine
        parts={[
          { text: 'health +412 %' },
          { text: 'strength +388 %' },
          { text: '4 sources on', muted: true },
        ]}
      />
    </div>
  ),
};

export default story;
