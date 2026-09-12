/**
 * S-12 — Mercenaries section (PLAN §4.3).
 *
 * A searchable picker over the 69 built-in mercenaries, the list of the ones this account owns with the
 * quantity that caps their stack, and a form for a mercenary the tables do not carry yet. Like the troops
 * section this describes the *account*, so everything is written to the active profile.
 */
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { mercenaries as mercenaryTable } from '@/data';
import { CATEGORIES, GROUPS, RACES } from '@/data/types';
import type { Category, Group, MercenaryRecord, Race } from '@/data/types';
import type { CustomMercenary, Profile } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';

import { PencilIcon, PlusIcon, TrashIcon } from '../../icons';
import { Button, HelpNote, IconButton, NumberField, Pill, Section } from '../../primitives';
import { CustomMercenaryDialog } from './CustomMercenaryDialog';
import { CATEGORY_LABELS, GROUP_LABELS, RACE_LABELS } from './labels';
import { TextField } from './TextField';

const number = new Intl.NumberFormat('en-US');

const TIERS = [...new Set(mercenaryTable.map((merc) => merc.tier))].sort((a, b) => a - b);

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
const tierLabel = (tier: number): string => `Tier ${ROMAN[tier - 1] ?? tier}`;

const HELP = (
  <>
    <p>
      Mercenaries are paid for out of authority, not leadership. Pick the ones sitting in your camp, then type
      how many you own next to each: that number caps the stack, and the calculator will never ask you to
      field more than you have. Leave the field empty when you do not want a limit.
    </p>
    <p>
      A capped stack can end up smaller than the stack that should die after it. That is unavoidable — you
      cannot field units you do not own — and the result will point it out.
    </p>
    <p>
      <strong>Where to find this in game:</strong> open the mercenary camp (the tent where you hire them) and
      tap a mercenary to open its sheet — health, strength, authority cost and revival gold are all on it, and
      the quantity you own is on the camp screen itself.
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

  const total = selected.length + custom.length;

  return (
    <Section
      id="mercenaries"
      title="Mercenaries"
      description="Which mercenaries you own and how many of each."
      help={HELP}
      summary={
        <span className="text-muted">
          {total === 0 ? 'None selected' : `${total} selected`}
          {custom.length > 0 && ` · ${custom.length} custom`}
        </span>
      }
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <TextField
            label="Search mercenaries"
            type="search"
            value={query}
            onChange={setQuery}
            placeholder="Name or short label"
          />
          <FilterRow caption="Tier">
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
          </FilterRow>
          <FilterRow caption="Role">
            {GROUPS.map((group) => (
              <Pill
                key={group}
                label={GROUP_LABELS[group]}
                on={roles.includes(group)}
                onToggle={() => {
                  setRoles((current) => toggle(current, group));
                }}
              />
            ))}
          </FilterRow>
          <FilterRow caption="Category">
            {CATEGORIES.map((category) => (
              <Pill
                key={category}
                label={CATEGORY_LABELS[category]}
                on={categories.includes(category)}
                onToggle={() => {
                  setCategories((current) => toggle(current, category));
                }}
              />
            ))}
          </FilterRow>
          <FilterRow caption="Race">
            {RACES.map((race) => (
              <Pill
                key={race}
                label={RACE_LABELS[race]}
                on={races.includes(race)}
                onToggle={() => {
                  setRaces((current) => toggle(current, race));
                }}
              />
            ))}
          </FilterRow>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">
            Available{' '}
            <span className="text-muted font-normal">
              ({results.length} of {mercenaryTable.length})
            </span>
          </h3>
          {results.length === 0 ? (
            <HelpNote>Nothing matches those filters.</HelpNote>
          ) : (
            <ul className="border-line max-h-80 divide-y overflow-y-auto rounded-lg border">
              {results.map((merc) => (
                <li key={merc.id} className="flex items-center gap-2 px-2.5 py-2">
                  <MercenaryFacts
                    label={merc.label}
                    name={merc.name}
                    tier={merc.tier}
                    cost={merc.cost}
                    health={merc.health}
                    strength={merc.strength}
                  />
                  <Button
                    size="sm"
                    icon={<PlusIcon />}
                    aria-label={`Add ${merc.name}`}
                    onClick={() => {
                      add(merc.id);
                    }}
                  >
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Your mercenaries</h3>
          {selected.length === 0 ? (
            <HelpNote>Add a mercenary above and it shows up here with its owned quantity.</HelpNote>
          ) : (
            <ul className="space-y-2">
              {selected.map((entry) => {
                const merc = mercenaryTable.find((record) => record.id === entry.id);
                const name = merc?.name ?? entry.id;
                return (
                  <li
                    key={entry.id}
                    className="border-line flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2"
                  >
                    <MercenaryFacts
                      label={merc?.label ?? '??'}
                      name={name}
                      {...(merc === undefined
                        ? {}
                        : {
                            tier: merc.tier,
                            cost: merc.cost,
                            health: merc.health,
                            strength: merc.strength,
                          })}
                    />
                    <span className="text-muted text-xs">Owned</span>
                    <NumberField
                      label={`${name} owned`}
                      hideLabel
                      min={0}
                      className="w-24"
                      placeholder="All"
                      value={entry.cap}
                      onChange={(value) => {
                        setCap(entry.id, value);
                      }}
                    />
                    <IconButton
                      label={`Remove ${name}`}
                      variant="danger"
                      icon={<TrashIcon />}
                      onClick={() => {
                        remove(entry.id);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
          )}
          <p className="text-muted text-xs">An empty quantity means &ldquo;no limit&rdquo;.</p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Custom mercenaries</h3>
            <Button
              size="sm"
              icon={<PlusIcon />}
              onClick={() => {
                setEditor({});
              }}
            >
              Custom mercenary
            </Button>
          </div>
          {custom.length === 0 ? (
            <p className="text-muted text-xs">
              Nothing here yet. Add one when you own a mercenary the tables do not know.
            </p>
          ) : (
            <ul className="space-y-2">
              {custom.map((merc) => (
                <li
                  key={merc.id}
                  className="border-line flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-2"
                >
                  <MercenaryFacts
                    label={GROUP_LABELS[merc.role]}
                    name={merc.name}
                    cost={merc.cost}
                    health={merc.health}
                    strength={merc.strength}
                  />
                  <IconButton
                    label={`Edit ${merc.name}`}
                    icon={<PencilIcon />}
                    onClick={() => {
                      setEditor({ merc });
                    }}
                  />
                  <IconButton
                    label={`Delete ${merc.name}`}
                    variant="danger"
                    icon={<TrashIcon />}
                    onClick={() => {
                      deleteCustom(merc.id);
                    }}
                  />
                </li>
              ))}
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

function FilterRow({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-muted w-16 text-xs">{caption}</span>
      {children}
    </div>
  );
}

interface MercenaryFactsProps {
  label: string;
  name: string;
  tier?: number;
  cost?: number;
  health?: number;
  strength?: number;
}

/** The one-line identity of a mercenary, shared by the picker, the owned list and the custom list. */
function MercenaryFacts({ label, name, tier, cost, health, strength }: MercenaryFactsProps) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline gap-2">
        <span className="truncate text-sm font-semibold">{name}</span>
        <span className="text-muted text-xs">{label}</span>
      </div>
      <div className="text-muted text-xs">
        {tier !== undefined && `${tierLabel(tier)} · `}
        {cost !== undefined && `${number.format(cost)} authority · `}
        {health !== undefined && `${number.format(health)} HP`}
        {strength !== undefined && ` · ${number.format(strength)} STR`}
      </div>
    </div>
  );
}
