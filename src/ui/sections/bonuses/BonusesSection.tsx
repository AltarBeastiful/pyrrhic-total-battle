import { useMemo } from 'react';

import { events as eventTable } from '@/data';
import { aggregateBonuses } from '@/engine/bonuses';
import { resolveSources } from '@/state/derive';
import type { BattleSetup, Profile } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { BonusesIcon } from '../../icons';
import { Section } from '../../primitives';
import { ArtifactsBlock } from './ArtifactsBlock';
import { CaptainsBlock } from './CaptainsBlock';
import { EquipmentBlock } from './EquipmentBlock';
import { EventsBlock } from './EventsBlock';
import { count, firstKey, formatPercent } from './labels';
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
      A source is a chip. Tap it to switch it on or off for this march, or tap its gear to edit what it is
      worth. Permanent sources have no switch — they always count.
    </p>
    <p>
      The totals at the bottom are what the game should show you. If they do not match, put the difference
      into the unexplained remainder and the rest of the calculation stays honest.
    </p>
    <p>
      <strong>Where to find it in game:</strong> each block names the screen its figures come from. To check
      the totals, open the march window on a monster — the army bonuses it lists are these ones.
    </p>
  </>
);

/**
 * The header line, always visible: what this march is worth to the whole army, then how many sources
 * feed it, block by block, and the events running. Two lines at most, so it never pushes the section
 * open.
 */
function headerSummary(profile: Profile, setup: BattleSetup): string {
  const totals = aggregateBonuses(resolveSources(profile, setup));
  const { sources } = profile;
  const { active } = setup;
  const parts = [
    `Army health ${formatPercent(totals.health.army)}`,
    `Army strength ${formatPercent(totals.strength.army)}`,
  ];

  const permanent = sources.permanent.filter((entry) => firstKey(entry) !== undefined).length;
  const other =
    (active.vip ? 1 : 0) +
    (active.dragon ? 1 : 0) +
    (active.hero && sources.hero !== undefined ? 1 : 0) +
    (active.unknown ? 1 : 0) +
    active.otherPills.length +
    active.custom.length;

  if (permanent > 0) parts.push(`${String(permanent)} permanent`);
  if (active.captains.length > 0) parts.push(count(active.captains.length, 'captain', 'captains'));
  if (active.equipment.length > 0) parts.push(count(active.equipment.length, 'piece', 'pieces'));
  if (active.artifacts.length > 0) parts.push(count(active.artifacts.length, 'artifact', 'artifacts'));
  if (active.titles.length > 0) parts.push(count(active.titles.length, 'title', 'titles'));
  if (other > 0) parts.push(`${String(other)} other`);
  for (const id of active.events) {
    const record = eventTable.find((entry) => entry.id === id);
    if (record) parts.push(record.name);
  }

  return parts.join(' · ');
}

/**
 * The Bonuses section (S-14 … S-18, and the temple/training half of S-17): every health and strength
 * source of the account, what is switched on for this march, the totals they add up to, and the recovery
 * settings that decide what losses cost.
 */
export function BonusesSection() {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const summary = useMemo(() => (profile && setup ? headerSummary(profile, setup) : ''), [profile, setup]);
  if (!profile || !setup) return null;

  return (
    <Section
      id="bonuses"
      title="Bonuses"
      icon={<BonusesIcon />}
      description="Every health and strength source you own, and what this march adds up to."
      summary={<p className="text-muted nums line-clamp-2">{summary}</p>}
      help={HELP}
    >
      <div className="space-y-4">
        <SetupBar profile={profile} setup={setup} />
        <div className="divide-line divide-y">
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
      </div>
    </Section>
  );
}
