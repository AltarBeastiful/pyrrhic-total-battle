import { Badge } from '../../kit';
import type { KitStory } from '../story';

const semantic = ['neutral', 'accent', 'info', 'ok', 'warn', 'danger'] as const;
const groups = ['guardsmen', 'specialists', 'engineers', 'monsters', 'mercenaries'] as const;

const story: KitStory = {
  name: 'Badge',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {semantic.map((tone) => (
          <Badge key={tone} tone={tone} size="sm">
            {tone}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {semantic.map((tone) => (
          <Badge key={tone} tone={tone} size="md">
            {tone}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {groups.map((tone) => (
          <Badge key={tone} tone={tone} size="md">
            {tone}
          </Badge>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">25 types</Badge>
        <Badge tone="accent">×22</Badge>
        <Badge tone="ok">2 hits</Badge>
        <Badge tone="warn">412 lost</Badge>
      </div>
    </div>
  ),
};

export default story;
