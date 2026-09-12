import { DeltaText } from '../../domain';
import type { KitStory } from '../story';

const number = (n: number) => n.toLocaleString('en-US');

const story: KitStory = {
  name: 'DeltaText',
  group: 'domain',
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline gap-6">
        <DeltaText value={12480} previous={12000} format={number} betterWhen="higher" />
        <DeltaText value={11640} previous={12000} format={number} betterWhen="higher" />
        <DeltaText value={12000} previous={12000} format={number} betterWhen="higher" />
        <DeltaText value={12480} format={number} betterWhen="higher" />
      </div>
      <div className="flex flex-wrap items-baseline gap-6">
        <DeltaText value={9800} previous={12000} format={number} betterWhen="lower" />
        <DeltaText value={14400} previous={12000} format={number} betterWhen="lower" />
        <DeltaText value={3} previous={4} format={(n) => `${n} hits`} betterWhen="lower" />
      </div>
    </div>
  ),
};

export default story;
