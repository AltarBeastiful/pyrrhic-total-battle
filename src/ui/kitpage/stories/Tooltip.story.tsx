import { PinIcon, ShareIcon, UndoIcon } from '../../icons';
import { Button, IconButton, Tooltip } from '../../kit';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Tooltip',
  group: 'kit',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Tooltip content="Pin this unit">
        <IconButton label="Pin this unit" variant="secondary">
          <PinIcon />
        </IconButton>
      </Tooltip>

      <Tooltip content="Undo the last change" placement="bottom">
        <IconButton label="Undo the last change" variant="quiet">
          <UndoIcon />
        </IconButton>
      </Tooltip>

      <Tooltip content="Copies a link to this march" placement="right" delay={0}>
        <Button icon={<ShareIcon />}>Share</Button>
      </Tooltip>
    </div>
  ),
};

export default story;
