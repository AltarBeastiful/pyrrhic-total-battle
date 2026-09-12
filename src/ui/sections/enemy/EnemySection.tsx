import { useState } from 'react';
import type { ComponentType } from 'react';

import { events as eventTable } from '@/data';
import { CATEGORIES, type Category } from '@/data/types';
import { eventEnemyFormation } from '@/state/derive';
import { selectActiveSetup, useStore } from '@/state/store';
import {
  CheckIcon,
  EnemyIcon,
  FlyingIcon,
  MeleeIcon,
  MountedIcon,
  RangedIcon,
  type IconProps,
} from '@/ui/icons';
import { Card, cn, HelpNote, Section } from '@/ui/primitives';

import { IntegerField } from '../results/IntegerField';

const CATEGORY_LABEL: Record<Category, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
};

const CATEGORY_GLYPH: Record<Category, ComponentType<IconProps>> = {
  melee: MeleeIcon,
  ranged: RangedIcon,
  mounted: MountedIcon,
  flying: FlyingIcon,
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

const MODES = Object.keys(MODE_LABELS) as Mode[];

const squadCount = (formation: Formation): number =>
  CATEGORIES.reduce((sum, category) => sum + Math.max(0, formation[category]), 0);

/** Which preset a stored formation is, if any. */
function detectMode(formation: Formation): Mode {
  for (const [mode, preset] of Object.entries(PRESETS) as [Mode, Formation][]) {
    if (CATEGORIES.every((category) => formation[category] === preset[category])) return mode;
  }
  return 'custom';
}

/** "1 melee · 1 ranged · 1 mounted · 1 flying", kinds with no squad left out. */
function describe(formation: Formation): string {
  const parts = CATEGORIES.filter((category) => formation[category] > 0).map(
    (category) => `${String(formation[category])} ${CATEGORY_LABEL[category].toLowerCase()}`,
  );
  return parts.length === 0 ? 'no squads' : parts.join(' · ');
}

/** The name of the active event that fixes the formation, for the header line. */
function forcingEvent(eventIds: readonly string[]): string | undefined {
  let name: string | undefined;
  for (const id of eventIds) {
    const record = eventTable.find((event) => event.id === id);
    if (record?.enemyFormation) name = record.name;
  }
  return name;
}

/** Enemy formation (PLAN §4.6): how many squads the monster fields, and of which kind. */
export function EnemySection() {
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const [manual, setManual] = useState(false);

  if (!setup) {
    return (
      <Section id="enemy" title="Enemy formation" icon={<EnemyIcon />}>
        <HelpNote tone="warn">No march is selected.</HelpNote>
      </Section>
    );
  }

  const forced = eventEnemyFormation(setup);
  const formation: Formation = forced ?? setup.enemy;
  const mode: Mode = manual ? 'custom' : detectMode(formation);
  const total = squadCount(formation);
  const eventName = forced ? forcingEvent(setup.active.events) : undefined;

  const write = (next: Formation): void => {
    updateActiveSetup({ enemy: next });
  };

  return (
    <Section
      id="enemy"
      title="Enemy formation"
      icon={<EnemyIcon />}
      description="How many squads the monster fields, and of which kind."
      summary={
        <span className="text-muted nums">
          {String(total)} squads: {describe(formation)}
          {eventName === undefined ? '' : ` — forced by ${eventName}`}
        </span>
      }
      help={
        <>
          <p>
            Every squad attacks once a round, so the number of squads decides how fast your stacks fall — and
            which of your strength-against bonuses count at all: a bonus against flying units is worth nothing
            when the monster fields no flying squad.
          </p>
          <p>
            <strong>Where to find it in game:</strong> tap the epic monster on the map and count the squads on
            its information card before you march.
          </p>
        </>
      }
    >
      <div className="space-y-3">
        {forced ? (
          <>
            <HelpNote>
              {eventName ?? 'An active event'} fixes the formation for this march: {describe(forced)} (
              {String(total)} squads). Turn the event off in Bonuses to choose it yourself.
            </HelpNote>
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CATEGORIES.map((category) => {
                const Glyph = CATEGORY_GLYPH[category];
                return (
                  <Card key={category} tone="raised" padded={false} className="px-3 py-2">
                    <dt className="text-muted flex items-center gap-1.5 text-xs font-medium">
                      <Glyph aria-hidden="true" />
                      {CATEGORY_LABEL[category]}
                    </dt>
                    <dd className="nums text-lg font-semibold">{String(forced[category])}</dd>
                  </Card>
                );
              })}
            </dl>
          </>
        ) : (
          <>
            {/* One segmented control: three chips welded together, the chosen one carrying the accent. */}
            <div
              role="group"
              aria-label="Enemy formation preset"
              className="border-field bg-surface inline-flex w-full max-w-sm overflow-hidden rounded-lg border"
            >
              {MODES.map((value, index) => {
                const on = mode === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      if (value === 'custom') {
                        setManual(true);
                        return;
                      }
                      setManual(false);
                      write({ ...PRESETS[value] });
                    }}
                    className={cn(
                      'tap flex flex-1 items-center justify-center gap-1.5 px-3 text-sm font-medium transition-colors',
                      index > 0 && 'border-field border-l',
                      on ? 'bg-accent text-accent-fg' : 'text-muted hover:bg-raised',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn('flex h-4 w-4 items-center justify-center', !on && 'opacity-0')}
                    >
                      <CheckIcon />
                    </span>
                    {MODE_LABELS[value]}
                  </button>
                );
              })}
            </div>

            {mode === 'custom' && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {CATEGORIES.map((category) => {
                  const Glyph = CATEGORY_GLYPH[category];
                  return (
                    <IntegerField
                      key={category}
                      label={CATEGORY_LABEL[category]}
                      prefix={<Glyph />}
                      value={formation[category]}
                      min={0}
                      max={20}
                      onChange={(value) => {
                        write({ ...formation, [category]: value });
                      }}
                    />
                  );
                })}
              </div>
            )}

            <p className="text-muted nums text-xs">
              {String(total)} squads in total: {describe(formation)}.
            </p>
          </>
        )}
      </div>
    </Section>
  );
}
