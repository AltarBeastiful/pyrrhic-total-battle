/**
 * The whole icon set, every glyph under the name you import it by (design plan D-16). This is the
 * page the choice of drawing is made on: each glyph is shown at 16 px — the smallest place it has to
 * work, a badge or a tile — and at 32 px, in both themes.
 *
 * The two families are shown apart on purpose. Game Icons are solid silhouettes and Lucide glyphs
 * are 2 px strokes; they are meant to look different, because one says *what a unit is* and the
 * other says *what a control does*.
 */
import type { ComponentType } from 'react';

import * as icons from '@/ui/icons';
import type { IconProps } from '@/ui/icons';

import type { KitStory } from '../story';

type Glyph = readonly [string, ComponentType<IconProps>];

const SET = Object.fromEntries(Object.entries(icons).filter(([name]) => name.endsWith('Icon'))) as Record<
  string,
  ComponentType<IconProps>
>;

/** Named so a reviewer can check a family at a glance, and so nothing is quietly left out. */
const FAMILIES: readonly { title: string; note: string; names: readonly string[] }[] = [
  {
    title: 'Units — Game Icons (CC BY 3.0)',
    note: 'Category, group and race. Solid silhouettes: they have to read inside a 32 px tile.',
    names: [
      'MeleeIcon',
      'RangedIcon',
      'MountedIcon',
      'FlyingIcon',
      'GuardsmenIcon',
      'SpecialistsIcon',
      'EngineersIcon',
      'MonstersIcon',
      'BeastIcon',
      'ElementalIcon',
      'DragonIcon',
      'GiantIcon',
    ],
  },
  {
    title: 'Housing pools — Lucide',
    note: 'A pool counts capacity; it is not a kind of soldier, so it keeps the interface stroke.',
    names: ['LeadershipIcon', 'AuthorityIcon', 'DominanceIcon'],
  },
  {
    title: 'Sections — Lucide',
    note: 'One per card of the page, in the order the page shows them.',
    names: [
      'TroopsIcon',
      'MercenariesIcon',
      'BonusesIcon',
      'EnemyIcon',
      'MethodIcon',
      'HousingIcon',
      'ResultsIcon',
    ],
  },
  {
    title: 'Verbs — Lucide',
    note: 'What a control does. One meaning per glyph: the gear always opens an editor.',
    names: [
      'GenerateIcon',
      'GearIcon',
      'PencilIcon',
      'PlusIcon',
      'MinusIcon',
      'TrashIcon',
      'CopyIcon',
      'DuplicateIcon',
      'ShareIcon',
      'DownloadIcon',
      'UploadIcon',
      'SyncIcon',
      'PinIcon',
      'UnpinIcon',
      'UndoIcon',
      'ResetIcon',
      'SortIcon',
      'SearchIcon',
    ],
  },
  {
    title: 'Marks and chevrons — Lucide',
    note: 'State, direction and the theme switch.',
    names: [
      'CheckIcon',
      'CloseIcon',
      'InfoIcon',
      'WarningIcon',
      'ChevronUpIcon',
      'ChevronDownIcon',
      'ChevronLeftIcon',
      'ChevronRightIcon',
      'SunIcon',
      'MoonIcon',
    ],
  },
  {
    title: 'Filled twins — the unit tile',
    note: 'What `UnitTile` asks for. Game Icons are solid already, so each one is its namesake.',
    names: [
      'MeleeFillIcon',
      'RangedFillIcon',
      'MountedFillIcon',
      'FlyingFillIcon',
      'EngineersFillIcon',
      'BeastFillIcon',
      'ElementalFillIcon',
      'DragonFillIcon',
      'GiantFillIcon',
    ],
  },
];

function glyphsOf(names: readonly string[]): Glyph[] {
  return names.flatMap((name) => {
    const Drawing = SET[name];
    return Drawing ? [[name, Drawing] as Glyph] : [];
  });
}

/** Anything exported but not listed above, so a new glyph cannot hide from the review. */
const LISTED = new Set(FAMILIES.flatMap((family) => family.names));
const REST = Object.keys(SET).filter((name) => !LISTED.has(name));

function Cell({ name, Drawing }: { name: string; Drawing: ComponentType<IconProps> }) {
  return (
    <div className="border-line bg-surface rounded-control flex flex-col items-center gap-2 border p-2">
      <div className="text-fg flex h-8 items-end gap-3">
        <Drawing className="h-4 w-4" />
        <Drawing className="h-8 w-8" />
      </div>
      <span className="text-muted font-mono text-xs break-all">{name}</span>
    </div>
  );
}

function Family({ title, note, names }: { title: string; note: string; names: readonly string[] }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="text-muted text-xs">{note}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {glyphsOf(names).map(([name, Drawing]) => (
          <Cell key={name} name={name} Drawing={Drawing} />
        ))}
      </div>
    </section>
  );
}

const story: KitStory = {
  name: 'Icons',
  group: 'kit',
  render: () => (
    <div className="flex flex-col gap-6">
      {FAMILIES.map((family) => (
        <Family key={family.title} {...family} />
      ))}
      {REST.length > 0 && (
        <Family title="Not yet filed" note="Exported by the set but missing above." names={REST} />
      )}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">In place</h3>
        <p className="text-muted text-xs">
          A glyph is decorative and takes the colour and the size of the text beside it; only a glyph standing
          alone gets a name.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-muted inline-flex items-center gap-1 text-xs">
            <icons.PinIcon /> kept
          </span>
          <span className="inline-flex items-center gap-1 text-sm">
            <icons.WarningIcon /> Leadership is short by 1 200
          </span>
          <span className="text-accent inline-flex items-center gap-2 text-lg">
            <icons.GenerateIcon /> Generate
          </span>
          <icons.UnitBadge group="guardsmen" category="ranged" tier={3} />
          <icons.UnitBadge group="monster" category="flying" tier={5} />
          <icons.PoolBadge pool="authority" label="Authority" />
        </div>
      </section>
    </div>
  ),
};

export default story;
