import { CloseIcon, GearIcon, PencilIcon, PinIcon, TrashIcon } from '../../icons';
import { IconButton } from '../../kit';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'IconButton',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <IconButton label="Edit the profile name" size="sm" variant="quiet">
          <PencilIcon />
        </IconButton>
        <IconButton label="Pin this unit" size="md" variant="quiet">
          <PinIcon />
        </IconButton>
        <IconButton label="Close the sheet" size="sm" variant="secondary">
          <CloseIcon />
        </IconButton>
        <IconButton label="Open the settings" size="md" variant="secondary">
          <GearIcon />
        </IconButton>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <IconButton label="Delete (disabled)" variant="quiet" isDisabled>
          <TrashIcon />
        </IconButton>
        <IconButton label="Delete (disabled, bordered)" variant="secondary" isDisabled>
          <TrashIcon />
        </IconButton>
      </div>
    </div>
  ),
};

export default story;
