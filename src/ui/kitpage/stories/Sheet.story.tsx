import { Button, Sheet } from '../../kit';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Sheet',
  group: 'kit',
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Sheet
        trigger={<Button variant="secondary">Open the unit sheet</Button>}
        title="Archer 3"
        description="Guardsmen · tier 3 · ranged"
        footer={
          <>
            <Button variant="quiet">Leave out</Button>
            <Button variant="primary">Keep in march</Button>
          </>
        }
      >
        <div className="flex flex-col gap-2">
          <p>Health 2 310 · Strength 1 940 · Speed 24</p>
          <p className="text-muted text-sm">
            The sheet slides up from the bottom of a phone and in from the right once there is room.
          </p>
        </div>
      </Sheet>

      <Sheet
        trigger={<Button>Open a wide one</Button>}
        title="Custom mercenary"
        size="lg"
        footer={<Button variant="primary">Save</Button>}
      >
        <p>A wider panel for an editor with several fields.</p>
      </Sheet>

      <Sheet trigger={<Button variant="quiet">No footer</Button>} title="Battle story">
        <p>Round one: the tier ladder walks from the top down.</p>
      </Sheet>
    </div>
  ),
};

export default story;
