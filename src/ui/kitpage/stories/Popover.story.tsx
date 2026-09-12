import { InfoIcon } from '../../icons';
import { Button, IconButton, Popover } from '../../kit';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Popover',
  group: 'kit',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Popover
        label="How the tier ladder works"
        trigger={
          <IconButton label="What is the tier ladder?" variant="secondary">
            <InfoIcon />
          </IconButton>
        }
      >
        <p className="text-sm">
          The ladder fills the march from the highest tier down, stopping when leadership runs out.
        </p>
      </Popover>

      <Popover label="Left out" placement="right" trigger={<Button>Anchored to the right</Button>}>
        <p className="text-sm">Guardsmen 1 and Guardsmen 2 did not make the march.</p>
      </Popover>

      <Popover label="A long one" placement="top" trigger={<Button variant="quiet">Scrolls</Button>}>
        <div className="flex flex-col gap-2 text-sm">
          {Array.from({ length: 12 }, (_, index) => (
            <p key={index}>Line {index + 1} of a panel that scrolls inside the viewport.</p>
          ))}
        </div>
      </Popover>
    </div>
  ),
};

export default story;
