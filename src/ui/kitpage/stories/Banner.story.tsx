import { Banner, Button } from '../../kit';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'Banner',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-3">
      <Banner tone="info" title="Nothing to compute yet">
        <p>Add a few troops, then press Generate.</p>
      </Banner>

      <Banner tone="warn" title="Two units were left out">
        <p>Guardsmen 1 and Guardsmen 2 did not fit the leadership you have.</p>
      </Banner>

      <Banner
        tone="danger"
        title="The saved march no longer matches this profile"
        actions={
          <>
            <Button size="sm" variant="danger">
              Drop it
            </Button>
            <Button size="sm" variant="quiet">
              Keep it anyway
            </Button>
          </>
        }
      >
        <p>Three of its units are not in the army any more.</p>
      </Banner>

      <Banner tone="ok" onDismiss={() => {}}>
        Copied the link to this march.
      </Banner>

      <Banner tone="info">A single sentence, with no title.</Banner>
    </div>
  ),
};

export default story;
