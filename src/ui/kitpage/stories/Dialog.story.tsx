import { Button, Dialog } from '../../kit';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Dialog',
  group: 'kit',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Dialog
        trigger={<Button>About Pyrrhic</Button>}
        title="About Pyrrhic"
        description="A client-side stacking calculator for Total Battle."
        footer={<Button variant="primary">Close</Button>}
      >
        <p>Everything is computed in this browser; nothing is uploaded.</p>
      </Dialog>

      <Dialog
        trigger={<Button variant="danger">Delete this profile</Button>}
        title="Delete this profile?"
        description="This cannot be undone."
        role="alertdialog"
        footer={
          <>
            <Button variant="quiet">Keep it</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      >
        <p>Aydael and its 12 saved marches go with it.</p>
      </Dialog>
    </div>
  ),
};

export default story;
