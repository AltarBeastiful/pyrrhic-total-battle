/**
 * Placeholders for the seven page sections (PLAN §4). Each one already carries its final id, title,
 * description and help text, so the shell, the anchors and the layout are testable before the real
 * editors land: a section story replaces its entry in `SECTIONS` (./index.ts) and nothing else moves.
 */
import { HelpNote, Section } from '../primitives';

interface PlaceholderProps {
  id: string;
  title: string;
  description: string;
  help: string;
  story: string;
}

function Placeholder({ id, title, description, help, story }: PlaceholderProps) {
  return (
    <Section id={id} title={title} description={description} help={<p>{help}</p>}>
      <HelpNote>Coming with {story}.</HelpNote>
    </Section>
  );
}

export function TroopsSection() {
  return (
    <Placeholder
      id="troops"
      title="Troops"
      description="The tiers your account has unlocked, and the unit types to leave out."
      help="Set the lowest and highest tier you can train for guardsmen, specialists, engineers and monsters. Untick a top-tier unit you have not upgraded yet so the calculator never puts it in a stack."
      story="the troops story"
    />
  );
}

export function MercenariesSection() {
  return (
    <Placeholder
      id="mercenaries"
      title="Mercenaries"
      description="Which mercenaries you own and how many of each."
      help="Pick the mercenaries in your inventory and enter how many you own: that number caps the stack. A mercenary the tables do not know yet can be entered by hand from its unit sheet."
      story="the mercenaries story"
    />
  );
}

export function MethodSection() {
  return (
    <Placeholder
      id="method"
      title="Stacking method"
      description="The order your stacks are meant to die in."
      help="Elite Preservation keeps your best troops alive the longest. M's Preservation additionally sizes every mercenary and monster stack below the smallest troop stack. Custom lets you drag the order yourself."
      story="the stacking-method story"
    />
  );
}

export function BonusesSection() {
  return (
    <Placeholder
      id="bonuses"
      title="Bonuses"
      description="Every health and strength source, and the totals they add up to."
      help="Enter each source once — permanent bonuses, captains, equipment, artifacts, titles, VIP, dragon, events — then switch the ones that apply to this march on or off. The totals card shows what the game will show you."
      story="the bonus-source stories"
    />
  );
}

export function EnemySection() {
  return (
    <Placeholder
      id="enemy"
      title="Enemy formation"
      description="How many squads the monster fields, and of which kind."
      help="Most epic monsters field four squads, one of each category. Arachne's event fields eight. The formation decides which of your strength-against bonuses actually count."
      story="the enemy story"
    />
  );
}

export function HousingSection() {
  return (
    <Placeholder
      id="housing"
      title="Housing and march"
      description="Leadership, authority and dominance available for this march, and the Generate button."
      help="Read the three capacities off the march screen in game. Leadership pays for troops, authority for mercenaries, dominance for monsters."
      story="the housing story"
    />
  );
}

export function ResultsSection() {
  return (
    <Placeholder
      id="results"
      title="Results"
      description="Stack sizes, battle summary and the journal."
      help="Once a stack is generated you get the count for every unit type, the minimum, average and maximum damage, what the losses cost to recover, and a hit-by-hit journal you can compare with the in-game report."
      story="the results story"
    />
  );
}
