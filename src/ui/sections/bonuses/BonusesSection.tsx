import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { Section } from '../../primitives';
import { ArtifactsBlock } from './ArtifactsBlock';
import { CaptainsBlock } from './CaptainsBlock';
import { EquipmentBlock } from './EquipmentBlock';
import { EventsBlock } from './EventsBlock';
import { OtherBlock } from './OtherBlock';
import { PermanentBlock } from './PermanentBlock';
import { SetupBar } from './SetupBar';
import { TempleBlock } from './TempleBlock';
import { TitlesBlock } from './TitlesBlock';
import { TotalsBlock } from './TotalsBlock';

const HELP = (
  <>
    <p>
      Type every bonus your account has once: the profile remembers the values. A battle setup then decides
      which of them are switched on for the march you are calculating.
    </p>
    <p>
      A pill is a source. Tap it to switch it on or off for this march; tap its gear to edit what it is worth.
      Permanent sources have no switch — they always count.
    </p>
    <p>
      The totals at the bottom are what the game should show you. If they do not match a battle report, put
      the difference into Unknown sources and the rest of the calculation stays honest.
    </p>
  </>
);

/**
 * The Bonuses section (S-14 … S-18, and the temple/training half of S-17): every health and strength
 * source of the account, what is switched on for this march, the totals they add up to, and the recovery
 * settings that decide what losses cost.
 */
export function BonusesSection() {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  if (!profile || !setup) return null;

  return (
    <Section
      id="bonuses"
      title="Bonuses"
      description="Every health and strength source, and the totals they add up to."
      help={HELP}
    >
      <div className="space-y-5">
        <SetupBar profile={profile} setup={setup} />
        <PermanentBlock profile={profile} />
        <CaptainsBlock profile={profile} setup={setup} />
        <EquipmentBlock profile={profile} setup={setup} />
        <ArtifactsBlock profile={profile} setup={setup} />
        <TitlesBlock profile={profile} setup={setup} />
        <OtherBlock profile={profile} setup={setup} />
        <EventsBlock setup={setup} />
        <TotalsBlock profile={profile} setup={setup} />
        <TempleBlock profile={profile} />
      </div>
    </Section>
  );
}
