import { Card } from '../../kit';
import type { KitStory } from '../story';

const tones = ['surface', 'raised', 'sunken', 'accent', 'info', 'warn', 'danger'] as const;
const paddings = ['none', 'sm', 'md'] as const;

const story: KitStory = {
  name: 'Card',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        {tones.map((tone) => (
          <Card key={tone} tone={tone} className="w-48">
            <p className="font-medium">{tone}</p>
            <p className="text-muted text-sm">Average damage 1.67 M</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-start gap-3">
        {paddings.map((padding) => (
          <Card key={padding} tone="raised" padding={padding} className="w-40">
            <p className="text-sm">padding {padding}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Card as="article" className="w-60">
          <p className="text-sm">as=&quot;article&quot;</p>
        </Card>
        <Card as="section" aria-label="Bonuses" className="w-60">
          <p className="text-sm">as=&quot;section&quot;, named &quot;Bonuses&quot;</p>
        </Card>
      </div>
    </div>
  ),
};

export default story;
