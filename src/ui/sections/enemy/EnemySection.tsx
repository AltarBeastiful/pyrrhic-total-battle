import { useState } from 'react';

import { CATEGORIES, type Category } from '@/data/types';
import { eventEnemyFormation } from '@/state/derive';
import { selectActiveSetup, useStore } from '@/state/store';
import { CheckIcon } from '@/ui/icons';
import { Button, HelpNote, Section } from '@/ui/primitives';

import { IntegerField } from '../results/IntegerField';

const CATEGORY_LABEL: Record<Category, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
};

/** Squads per category, in the order the game lists them. */
type Formation = Record<Category, number>;

const PRESETS = {
  standard: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
  double: { melee: 2, ranged: 2, mounted: 2, flying: 2 },
} as const satisfies Record<string, Formation>;

type Mode = keyof typeof PRESETS | 'custom';

const MODE_LABELS: Record<Mode, string> = {
  standard: 'Standard 4',
  double: 'Double 8',
  custom: 'Custom',
};

const squadCount = (formation: Formation): number =>
  CATEGORIES.reduce((sum, category) => sum + Math.max(0, formation[category]), 0);

/** Which preset a stored formation is, if any. */
function detectMode(formation: Formation): Mode {
  for (const [mode, preset] of Object.entries(PRESETS) as [Mode, Formation][]) {
    if (CATEGORIES.every((category) => formation[category] === preset[category])) return mode;
  }
  return 'custom';
}

function describe(formation: Formation): string {
  const parts = CATEGORIES.filter((category) => formation[category] > 0).map(
    (category) => `${String(formation[category])} ${CATEGORY_LABEL[category].toLowerCase()}`,
  );
  return parts.length === 0 ? 'no squads' : parts.join(', ');
}

/** Enemy formation (PLAN §4.6): how many squads the monster fields, and of which kind. */
export function EnemySection() {
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const [manual, setManual] = useState(false);

  if (!setup) {
    return (
      <Section id="enemy" title="Enemy formation">
        <HelpNote tone="warn">No march is selected.</HelpNote>
      </Section>
    );
  }

  const forced = eventEnemyFormation(setup);
  const formation: Formation = forced ?? setup.enemy;
  const mode: Mode = manual ? 'custom' : detectMode(formation);
  const total = squadCount(formation);

  const write = (next: Formation): void => {
    updateActiveSetup({ enemy: next });
  };

  return (
    <Section
      id="enemy"
      title="Enemy formation"
      description="How many squads the monster fields, and of which kind."
      summary={
        <span className="text-muted">
          {String(total)} squads — {describe(formation)}
        </span>
      }
      help={
        <>
          <p>
            Every squad in the formation attacks once per round, so the number of squads decides how fast your
            stacks fall — and which of your strength-against bonuses count at all: a bonus against flying
            units is worth nothing when the monster fields no flying squad.
          </p>
          <p>
            <strong>Where to find it in game:</strong> tap the epic monster on the map and read the squads on
            its information card before you march. Most epic monsters field four, one of each kind.
          </p>
        </>
      }
    >
      <div className="space-y-3">
        {forced ? (
          <>
            <HelpNote>
              An active event sets the formation for this march: {describe(forced)} ({String(total)} squads).
              Turn the event off in the Bonuses section to choose the formation yourself.
            </HelpNote>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((category) => (
                <div key={category} className="border-line bg-raised rounded-lg border px-3 py-2">
                  <dt className="text-muted text-xs font-medium">{CATEGORY_LABEL[category]}</dt>
                  <dd className="text-sm font-semibold">{String(forced[category])}</dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <>
            <div role="group" aria-label="Enemy preset" className="flex flex-wrap gap-2">
              {(Object.keys(MODE_LABELS) as Mode[]).map((value) => (
                <Button
                  key={value}
                  aria-pressed={mode === value}
                  variant={mode === value ? 'primary' : 'secondary'}
                  icon={mode === value ? <CheckIcon /> : undefined}
                  onClick={() => {
                    if (value === 'custom') {
                      setManual(true);
                      return;
                    }
                    setManual(false);
                    write({ ...PRESETS[value] });
                  }}
                >
                  {MODE_LABELS[value]}
                </Button>
              ))}
            </div>

            {mode === 'custom' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CATEGORIES.map((category) => (
                  <IntegerField
                    key={category}
                    label={CATEGORY_LABEL[category]}
                    value={formation[category]}
                    min={0}
                    max={20}
                    onChange={(value) => {
                      write({ ...formation, [category]: value });
                    }}
                  />
                ))}
              </div>
            )}

            <p className="text-muted text-xs">
              {String(total)} squads in total — {describe(formation)}.
            </p>
          </>
        )}
      </div>
    </Section>
  );
}
