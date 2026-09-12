import { CheckIcon, ChevronDownIcon, GenerateIcon } from '../../icons';
import { Button } from '../../kit';
import type { KitStory } from '../story';

const variants = ['primary', 'secondary', 'quiet', 'danger'] as const;
const sizes = ['sm', 'md', 'lg'] as const;

const story: KitStory = {
  name: 'Button',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {sizes.map((size) => (
            <Button key={size} variant={variant} size={size}>
              {`${variant} ${size}`}
            </Button>
          ))}
        </div>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" icon={<GenerateIcon />}>
          With a glyph
        </Button>
        <Button iconRight={<ChevronDownIcon />}>Trailing chevron</Button>
        <Button icon={<CheckIcon />} iconRight={<ChevronDownIcon />}>
          Both
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" isPending>
          Running
        </Button>
        <Button isDisabled>Disabled</Button>
        <Button variant="primary" isDisabled>
          Disabled primary
        </Button>
        <Button variant="danger" isDisabled>
          Disabled danger
        </Button>
      </div>

      <Button variant="primary" fullWidth icon={<GenerateIcon />}>
        Full width
      </Button>
    </div>
  ),
};

export default story;
