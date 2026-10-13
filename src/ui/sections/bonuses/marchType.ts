/**
 * The march-type choice under the captain chips (W17 C5-0): what each segment is called and what it
 * does to the captains, read off `captains.json` so the words and the derivation cannot drift apart.
 */
import { captains as captainTable } from '@/data';
import type { BattleSetup, Profile, SetupMarchType } from '@/state/schema';

export interface MarchTypeChoice {
  value: SetupMarchType;
  label: string;
  help: string;
}

/** The kind of march, as a sentence names it (`derive.ts` words its caveats the same way). */
const PHRASES = {
  solo: 'a solo march',
  group: 'a group march',
  epic: 'a march against epic monsters',
} as const;

const conditional = captainTable.filter((captain) => captain.onlyOn !== undefined);

/**
 * **Does this march send a captain a march type limits?** The control under the chips changes a reading only for
 * a captain with an `onlyOn` restriction (Amanitore, Hercules); with none **on the march**, every segment reads
 * the same, so the card leaves the control out (rule 15, nothing on screen without value). The test is the
 * captains **selected** (`setup.active.captains`), not the roster: owning one but leaving it on the bench does
 * not change today's march, so the control would only take space (owner, 2026-10-13: *"it should be selected"*).
 * Enlisting a restricted captain brings it in — the way a player reaches the control anyway. A type stored from
 * an earlier march stays inert while no restricted captain is selected (nothing else reaches `onlyOn`), so
 * hiding the control strands nothing that changes a reading.
 */
export function selectsRestrictedCaptain(
  profile: Pick<Profile, 'sources'>,
  setup: Pick<BattleSetup, 'active'>,
): boolean {
  if (conditional.length === 0) return false;
  const restricted = new Set(conditional.map((captain) => captain.id));
  const byEntry = new Map(profile.sources.captains.map((entry) => [entry.id, entry.captainId]));
  return setup.active.captains.some((entryId) => {
    const captainId = byEntry.get(entryId);
    return captainId !== undefined && restricted.has(captainId);
  });
}

function nameList(names: string[]): string {
  return names.length < 2 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1) ?? ''}`;
}

function helpFor(type: keyof typeof PHRASES): string {
  const left = conditional.filter((captain) => captain.onlyOn !== type).map((captain) => captain.name);
  const kept = conditional.filter((captain) => captain.onlyOn === type).map((captain) => captain.name);
  const out = left.length === 0 ? '' : `${nameList(left)} ${left.length === 1 ? 'is' : 'are'} not counted.`;
  const counted = kept.length === 0 ? '' : ` ${nameList(kept)} counts.`;
  return `On ${PHRASES[type]}, a captain limited to another kind of march adds nothing. ${out}${counted}`;
}

export const MARCH_TYPE_CHOICES: readonly MarchTypeChoice[] = [
  {
    value: 'unspecified',
    label: 'Any',
    help: `No kind of march chosen: every captain you send counts, and ${nameList(
      conditional.map((captain) => captain.name),
    )} carry a note about the march they are limited to.`,
  },
  { value: 'solo', label: 'Solo', help: helpFor('solo') },
  { value: 'group', label: 'Group', help: helpFor('group') },
  { value: 'epic', label: 'Epic', help: helpFor('epic') },
];
