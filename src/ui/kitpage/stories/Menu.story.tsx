import { useState } from 'react';

import {
  CheckIcon,
  ChevronDownIcon,
  DownloadIcon,
  DuplicateIcon,
  GearIcon,
  MoonIcon,
  PlusIcon,
  ShareIcon,
  SunIcon,
  SyncIcon,
  TrashIcon,
} from '../../icons';
import { Button, IconButton, Menu, MenuItem, MenuSection, MenuSegment } from '../../kit';
import type { KitStory } from '../story';

function AccountMenu() {
  const [theme, setTheme] = useState('system');
  return (
    <Menu label="Account actions" trigger={<Button iconRight={<ChevronDownIcon />}>Aydael</Button>}>
      <MenuSection title="Profiles">
        <MenuItem id="aydael" icon={<CheckIcon />} description="Saved">
          Aydael
        </MenuItem>
        <MenuItem id="alt" description="12 saved marches">
          Second account
        </MenuItem>
      </MenuSection>
      <MenuSection title="This profile">
        <MenuItem id="new" icon={<PlusIcon />}>
          New profile
        </MenuItem>
        <MenuItem id="duplicate" icon={<DuplicateIcon />}>
          Duplicate this one
        </MenuItem>
        <MenuItem id="delete" icon={<TrashIcon />} isDanger>
          Delete this one
        </MenuItem>
      </MenuSection>
      <MenuSection title="Data">
        <MenuItem id="export" icon={<DownloadIcon />}>
          Export JSON
        </MenuItem>
        <MenuItem id="sync" icon={<SyncIcon />} description="Between your own devices">
          Sync…
        </MenuItem>
        <MenuItem id="share" icon={<ShareIcon />} isDisabled>
          Share this march
        </MenuItem>
      </MenuSection>
      <MenuSegment
        label="Theme"
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'system', label: 'System' },
          { value: 'light', label: 'Light', icon: <SunIcon /> },
          { value: 'dark', label: 'Dark', icon: <MoonIcon /> },
        ]}
      />
    </Menu>
  );
}

const story: KitStory = {
  name: 'Menu',
  group: 'kit',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <AccountMenu />
      <Menu
        label="Result actions"
        placement="bottom start"
        trigger={
          <IconButton label="Result actions" variant="secondary">
            <GearIcon />
          </IconButton>
        }
      >
        <MenuItem id="save">Save this march</MenuItem>
        <MenuItem id="copy">Copy the link</MenuItem>
        <MenuItem id="reset" isDanger>
          Reset the setup
        </MenuItem>
      </Menu>
    </div>
  ),
};

export default story;
