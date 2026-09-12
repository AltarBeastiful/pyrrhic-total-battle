import { GroupMarker, GROUP_LABEL, UNIT_GROUPS } from '../../domain';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'GroupMarker',
  group: 'domain',
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        {UNIT_GROUPS.map((group) => (
          <GroupMarker key={group} group={group} label={GROUP_LABEL[group]} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {UNIT_GROUPS.map((group) => (
          <GroupMarker key={group} group={group} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <GroupMarker group="guardsmen" label="G1–G4" />
        <GroupMarker group="specialists" label="S1–S2" />
        <GroupMarker group="engineers" label="no engineers" />
        <GroupMarker group="monsters" label="M3–M5" />
      </div>
    </div>
  ),
};

export default story;
