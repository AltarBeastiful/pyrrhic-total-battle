/**
 * S-12 — Mercenaries section (PLAN §4.3).
 *
 * The list of the mercenaries this account has hired, with how many of each it owns, a searchable picker
 * over the built-in table, and a form for one the tables do not carry yet. Like the troops section this
 * describes the *account*, so everything is written to the active profile.
 */
import { Fragment, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { mercenaries as mercenaryTable } from '@/data';
import { CATEGORIES, GROUPS, RACES } from '@/data/types';
import type { Category, Group, MercenaryRecord, Race } from '@/data/types';
import type { CustomMercenary, Profile } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';

import {
  BeastIcon,
  DragonIcon,
  ElementalIcon,
  EngineersIcon,
  FlyingIcon,
  GiantIcon,
  GuardsmenIcon,
  MeleeIcon,
  MercenariesIcon,
  MonstersIcon,
  MountedIcon,
  PencilIcon,
  PlusIcon,
  RangedIcon,
  SearchIcon,
  SpecialistsIcon,
  TrashIcon,
  UnitBadge,
} from '../../icons';
import type { BadgeGroup } from '../../icons';
import { Button, HelpNote, IconButton, NumberField, Pill, Popover, Section } from '../../primitives';
import { CustomMercenaryDialog } from './CustomMercenaryDialog';
import { CATEGORY_LABELS, GROUP_LABELS, RACE_LABELS } from './labels';
import { TextField } from './TextField';

const number = new Intl.NumberFormat('en-US');
const short = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

const TIERS = [...new Set(mercenaryTable.map((merc) => merc.tier))].sort((a, b) => a - b);

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const tierLabel = (tier: number): string => `Tier ${ROMAN[tier - 1] ?? tier}`;

/** No cap typed = you are never asked to field more than you own, because you own enough. */
const UNLIMITED = '∞';
const TIMES = '×';

const GROUP_GLYPHS: Record<Group, ReactNode> = {
  guardsmen: <GuardsmenIcon />,
  specialist: <SpecialistsIcon />,
  engineers: <EngineersIcon />,
  monster: <MonstersIcon />,
};

const CATEGORY_GLYPHS: Record<Category, ReactNode> = {
  melee: <MeleeIcon />,
  ranged: <RangedIcon />,
  mounted: <MountedIcon />,
  flying: <FlyingIcon />,
};

const RACE_GLYPHS: Record<Race, ReactNode> = {
  beast: <BeastIcon />,
  elemental: <ElementalIcon />,
  dragon: <DragonIcon />,
  giant: <GiantIcon />,
};

const HELP = (
  <>
    <p>
      Mercenaries are paid out of authority, not leadership. Add the ones sitting in your camp and type how
      many you own beside each: that number caps the stack, so a march never asks for units you do not have.
      An empty box means &ldquo;as many as the camp can pay for&rdquo;.
    </p>
    <p>
      A capped stack can end up smaller than the stack meant to fall after it. Nothing can be done about that
      — you cannot field what you do not own — and the results say so when it happens.
    </p>
    <p>
      <strong>Where to find it in game:</strong> your camp shows how many of each you own, and a mercenary
      card carries the health, strength, authority cost and revival gold repeated here.
    </p>
  </>
);

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function matches(merc: MercenaryRecord, query: string, tiers: number[], tags: string[][]): boolean {
  if (query !== '') {
    const haystack = `${merc.name} ${merc.label}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  if (tiers.length > 0 && !tiers.includes(merc.tier)) return false;
  for (const facet of tags) {
    if (facet.length > 0 && !facet.some((tag) => (merc.tags as string[]).includes(tag))) return false;
  }
  return true;
}

const tagOf = <T extends string>(merc: MercenaryRecord, allowed: readonly T[]): T | undefined =>
  (merc.tags as string[]).find((tag): tag is T => (allowed as readonly string[]).includes(tag));

/** The facts one mercenary card in game carries, whatever list the mercenary is shown in. */
interface Facts {
  name: string;
  label: string;
  group: Group | undefined;
  category: Category | undefined;
  race: Race | undefined;
  tier: number | undefined;
  cost: number;
  health: number;
  strength: number;
  revivalGold: number;
}

function recordFacts(merc: MercenaryRecord): Facts {
  return {
    name: merc.name,
    label: merc.label,
    group: tagOf(merc, GROUPS),
    category: tagOf(merc, CATEGORIES),
    race: tagOf(merc, RACES),
    tier: merc.tier,
    cost: merc.cost,
    health: merc.health,
    strength: merc.strength,
    revivalGold: merc.revival.gold,
  };
}

function customFacts(merc: CustomMercenary): Facts {
  return {
    name: merc.name,
    label: GROUP_LABELS[merc.role],
    group: merc.role,
    category: merc.category,
    race: merc.race,
    tier: undefined,
    cost: merc.cost,
    health: merc.health,
    strength: merc.strength,
    revivalGold: merc.revivalGold,
  };
}

/** The card as one line of text, for the picker rows: 69 popovers would be a lot of machinery. */
function cardText(facts: Facts): string {
  const tags = [
    facts.tier === undefined ? '' : tierLabel(facts.tier),
    facts.group === undefined ? '' : GROUP_LABELS[facts.group],
    facts.category === undefined ? '' : CATEGORY_LABELS[facts.category],
    facts.race === undefined ? '' : RACE_LABELS[facts.race],
  ].filter((tag) => tag !== '');
  return [
    `${facts.name} — ${tags.join(', ')}`,
    `${number.format(facts.health)} health · ${number.format(facts.strength)} strength · ${number.format(facts.cost)} authority each`,
    `${number.format(facts.revivalGold)} gold to bring one back`,
  ].join('\n');
}

export function MercenariesSection() {
  const profile = useStore(selectActiveProfile);
  const updateProfile = useStore((state) => state.updateProfile);

  const [query, setQuery] = useState('');
  const [tiers, setTiers] = useState<number[]>([]);
  const [roles, setRoles] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [races, setRaces] = useState<Race[]>([]);
  const [editor, setEditor] = useState<{ merc?: CustomMercenary } | null>(null);

  const selectedIds = useMemo(
    () => new Set((profile?.mercenaries.selected ?? []).map((entry) => entry.id)),
    [profile],
  );

  const results = useMemo(
    () =>
      mercenaryTable.filter(
        (merc) =>
          !selectedIds.has(merc.id) &&
          matches(merc, query.trim().toLowerCase(), tiers, [roles, categories, races]),
      ),
    [selectedIds, query, tiers, roles, categories, races],
  );

  if (profile === undefined) return null;

  const selected = profile.mercenaries.selected;
  const custom = profile.mercenaries.custom;

  const patch = (next: Partial<Profile['mercenaries']>): void => {
    updateProfile(profile.id, (current) => ({ mercenaries: { ...current.mercenaries, ...next } }));
  };

  const add = (id: string): void => {
    patch({ selected: [...selected, { id, cap: null }] });
  };
  const remove = (id: string): void => {
    patch({ selected: selected.filter((entry) => entry.id !== id) });
  };
  const setCap = (id: string, cap: number | null): void => {
    patch({ selected: selected.map((entry) => (entry.id === id ? { ...entry, cap } : entry)) });
  };
  const saveCustom = (merc: CustomMercenary): void => {
    patch({
      custom: custom.some((entry) => entry.id === merc.id)
        ? custom.map((entry) => (entry.id === merc.id ? merc : entry))
        : [...custom, merc],
    });
    setEditor(null);
  };
  const deleteCustom = (id: string): void => {
    patch({ custom: custom.filter((entry) => entry.id !== id) });
  };

  const hired = [
    ...selected.map((entry) => {
      const merc = mercenaryTable.find((record) => record.id === entry.id);
      const facts: Facts =
        merc === undefined
          ? {
              name: entry.id,
              label: '??',
              group: undefined,
              category: undefined,
              race: undefined,
              tier: undefined,
              cost: 0,
              health: 0,
              strength: 0,
              revivalGold: 0,
            }
          : recordFacts(merc);
      return { key: entry.id, facts, cap: entry.cap, tag: facts.label };
    }),
    ...custom.map((merc) => {
      const facts = customFacts(merc);
      return { key: merc.id, facts, cap: null, tag: facts.name };
    }),
  ];
  const total = hired.length;
  const shown = hired.slice(0, 6);

  return (
    <Section
      id="mercenaries"
      title="Mercenaries"
      icon={<MercenariesIcon />}
      help={HELP}
      summary={
        <p id="mercenaries-summary" className="text-muted text-xs leading-relaxed">
          {total === 0 ? (
            <span>No mercenary hired yet</span>
          ) : (
            <>
              {shown.map((entry, index) => (
                <Fragment key={entry.key}>
                  {index > 0 && ' \u00b7 '}
                  <span className="whitespace-nowrap">
                    <span className="mr-1 inline-flex align-[-0.15em]">
                      <Badge facts={entry.facts} withTier={false} />
                    </span>
                    <span className="text-fg nums">
                      {entry.tag} {TIMES}
                      {entry.cap === null ? UNLIMITED : number.format(entry.cap)}
                    </span>
                  </span>
                </Fragment>
              ))}
              {total > shown.length && (
                <span className="nums">
                  {' \u00b7 '}+{total - shown.length} more
                </span>
              )}{' '}
              <span className="nums whitespace-nowrap">({total} selected)</span>
            </>
          )}
        </p>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Hired</h3>
            <Button
              size="sm"
              variant="ghost"
              icon={<PlusIcon />}
              onClick={() => {
                setEditor({});
              }}
            >
              Custom mercenary
            </Button>
          </div>
          {total === 0 ? (
            <HelpNote>Add one from the list below and it lands here with its owned quantity.</HelpNote>
          ) : (
            <ul className="border-line divide-line divide-y rounded-lg border">
              {selected.map((entry) => {
                const merc = mercenaryTable.find((record) => record.id === entry.id);
                const facts = merc === undefined ? undefined : recordFacts(merc);
                const name = facts?.name ?? entry.id;
                return (
                  <li key={entry.id} className="flex items-center gap-1.5 px-2 py-1">
                    {facts !== undefined && <Badge facts={facts} />}
                    <span className="min-w-0 flex-1">
                      {facts === undefined ? (
                        <span className="text-sm">{name}</span>
                      ) : (
                        <FactsButton facts={facts} />
                      )}
                    </span>
                    <span aria-hidden="true" className="text-muted text-xs">
                      {TIMES}
                    </span>
                    <NumberField
                      label={`${name} owned`}
                      hideLabel
                      min={0}
                      className="w-20 shrink-0"
                      placeholder={UNLIMITED}
                      value={entry.cap}
                      onChange={(value) => {
                        setCap(entry.id, value);
                      }}
                    />
                    <IconButton
                      label={`Remove ${name}`}
                      variant="danger"
                      size="sm"
                      icon={<TrashIcon />}
                      onClick={() => {
                        remove(entry.id);
                      }}
                    />
                  </li>
                );
              })}
              {custom.map((merc) => {
                const facts = customFacts(merc);
                return (
                  <li key={merc.id} className="flex items-center gap-1.5 px-2 py-1">
                    <Badge facts={facts} />
                    <span className="min-w-0 flex-1">
                      <FactsButton facts={facts} />
                    </span>
                    <span className="text-muted shrink-0 text-xs">custom</span>
                    <IconButton
                      label={`Edit ${merc.name}`}
                      size="sm"
                      icon={<PencilIcon />}
                      onClick={() => {
                        setEditor({ merc });
                      }}
                    />
                    <IconButton
                      label={`Delete ${merc.name}`}
                      variant="danger"
                      size="sm"
                      icon={<TrashIcon />}
                      onClick={() => {
                        deleteCustom(merc.id);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
          {total > 0 && (
            <p className="text-muted text-xs">
              An empty quantity means no limit. Tap a name for the whole card.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold">
            Add a mercenary{' '}
            <span className="text-muted nums font-normal">
              ({results.length} of {mercenaryTable.length})
            </span>
          </h3>
          <TextField
            label="Search mercenaries"
            hideLabel
            type="search"
            prefix={<SearchIcon />}
            value={query}
            onChange={setQuery}
            placeholder="Name or short label"
          />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <FilterGroup caption="tier">
              {TIERS.map((tier) => (
                <Pill
                  key={tier}
                  label={tierLabel(tier)}
                  on={tiers.includes(tier)}
                  onToggle={() => {
                    setTiers((current) => toggle(current, tier));
                  }}
                />
              ))}
            </FilterGroup>
            <FilterGroup caption="role">
              {GROUPS.map((group) => (
                <Pill
                  key={group}
                  label={GROUP_LABELS[group]}
                  badge={GROUP_GLYPHS[group]}
                  on={roles.includes(group)}
                  onToggle={() => {
                    setRoles((current) => toggle(current, group));
                  }}
                />
              ))}
            </FilterGroup>
            <FilterGroup caption="category">
              {CATEGORIES.map((category) => (
                <Pill
                  key={category}
                  label={CATEGORY_LABELS[category]}
                  badge={CATEGORY_GLYPHS[category]}
                  on={categories.includes(category)}
                  onToggle={() => {
                    setCategories((current) => toggle(current, category));
                  }}
                />
              ))}
            </FilterGroup>
            <FilterGroup caption="race">
              {RACES.map((race) => (
                <Pill
                  key={race}
                  label={RACE_LABELS[race]}
                  badge={RACE_GLYPHS[race]}
                  on={races.includes(race)}
                  onToggle={() => {
                    setRaces((current) => toggle(current, race));
                  }}
                />
              ))}
            </FilterGroup>
          </div>
          {results.length === 0 ? (
            <HelpNote>Nothing matches those filters.</HelpNote>
          ) : (
            <ul className="border-line divide-line max-h-72 divide-y overflow-y-auto rounded-lg border">
              {results.map((merc) => {
                const facts = recordFacts(merc);
                return (
                  <li key={merc.id} className="flex items-center gap-1.5 px-2 py-1">
                    <Badge facts={facts} />
                    <span className="min-w-0 flex-1" title={cardText(facts)}>
                      <span className="flex items-baseline gap-1.5">
                        <span className="truncate text-sm font-medium">{facts.name}</span>
                        <span className="text-muted nums shrink-0 text-xs">{facts.label}</span>
                      </span>
                      <span className="text-muted nums block text-xs sm:hidden">
                        {number.format(facts.cost)} authority · {short.format(facts.health)} HP ·{' '}
                        {short.format(facts.strength)} STR
                      </span>
                    </span>
                    <span className="text-muted nums hidden shrink-0 text-xs sm:inline">
                      {number.format(facts.cost)} authority · {short.format(facts.health)} HP ·{' '}
                      {short.format(facts.strength)} STR
                    </span>
                    <Button
                      size="sm"
                      className="shrink-0"
                      icon={<PlusIcon />}
                      aria-label={`Add ${merc.name}`}
                      onClick={() => {
                        add(merc.id);
                      }}
                    >
                      Add
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {editor !== null && (
        <CustomMercenaryDialog
          key={editor.merc?.id ?? 'new'}
          {...(editor.merc === undefined ? {} : { initial: editor.merc })}
          onSubmit={saveCustom}
          onClose={() => {
            setEditor(null);
          }}
        />
      )}
    </Section>
  );
}

function FilterGroup({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={`Filter by ${caption}`} className="flex flex-wrap items-center gap-1">
      {children}
    </div>
  );
}

const BADGE_GROUP: Record<Group, BadgeGroup> = {
  guardsmen: 'guardsmen',
  specialist: 'specialist',
  engineers: 'engineers',
  monster: 'monster',
};

/**
 * The mercenary's mark: its category glyph, its tier and the colour of the role it counts as. The
 * header line drops the numeral, because the short label beside it ("BER5") already carries the tier.
 */
function Badge({ facts, withTier = true }: { facts: Facts; withTier?: boolean }) {
  return (
    <UnitBadge
      group={facts.group === undefined ? 'monster' : BADGE_GROUP[facts.group]}
      {...(facts.category === undefined ? {} : { category: facts.category })}
      {...(facts.tier === undefined || !withTier ? {} : { tier: facts.tier })}
      size="sm"
      className="shrink-0"
    />
  );
}

/** The name, and behind it the card: what the unit is, and what it costs to bring back. */
function FactsButton({ facts }: { facts: Facts }) {
  return (
    <Popover
      label={`${facts.name} card`}
      trigger={
        <button
          type="button"
          className="tap-area hover:text-accent flex min-w-0 items-baseline gap-1.5 text-left"
        >
          <span className="truncate text-sm font-medium">{facts.name}</span>
          <span className="text-muted nums shrink-0 text-xs">{facts.label}</span>
        </button>
      }
    >
      <div className="space-y-2">
        <div>
          <h4 className="text-sm font-semibold">Unit</h4>
          <p className="mt-1 flex flex-wrap items-center gap-1">
            {facts.tier !== undefined && <Tag>{tierLabel(facts.tier)}</Tag>}
            {facts.group !== undefined && (
              <Tag glyph={GROUP_GLYPHS[facts.group]}>{GROUP_LABELS[facts.group]}</Tag>
            )}
            {facts.category !== undefined && (
              <Tag glyph={CATEGORY_GLYPHS[facts.category]}>{CATEGORY_LABELS[facts.category]}</Tag>
            )}
            {facts.race !== undefined && <Tag glyph={RACE_GLYPHS[facts.race]}>{RACE_LABELS[facts.race]}</Tag>}
          </p>
          <p className="text-muted nums mt-1 text-xs">
            {number.format(facts.health)} health · {number.format(facts.strength)} strength ·{' '}
            {number.format(facts.cost)} authority each
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">After the battle</h4>
          <p className="text-muted nums mt-1 text-xs">
            {number.format(facts.revivalGold)} gold to bring one back. Mercenaries are never retrained.
          </p>
        </div>
      </div>
    </Popover>
  );
}

function Tag({ glyph, children }: { glyph?: ReactNode; children: ReactNode }) {
  return (
    <span className="border-line bg-raised text-muted rounded-chip inline-flex items-center gap-1 border px-1.5 py-px text-xs">
      {glyph !== undefined && (
        <span aria-hidden="true" className="text-[0.7rem]">
          {glyph}
        </span>
      )}
      {children}
    </span>
  );
}
