/**
 * Mercenaries (design plan §7.2, amended by the owner) — the camp, as one always-visible list.
 *
 * The card is the summary: the mercenaries you own are on screen the moment the page is, one row
 * each — tile, name, what it is, how many you own as a stepper, the pin when the march keeps it —
 * and they are edited in place, with nothing to unfold. The row itself is the tick box, so putting
 * one back in the camp is a tap anywhere on the line except on its own controls (review point R6).
 *
 * The picker over the 69 built-in mercenaries lives behind one "Add mercenaries" button and opens
 * inline, under the list, at every width: it is a long list that wants the page's own scrolling
 * next to what you already own, not a modal that hides it. It shows itself when nothing is hired
 * yet, because then there is nothing else to look at. A mercenary the tables do not carry is typed
 * into a sheet from the end of the picker.
 *
 * Like Troops, this card describes the *account*: everything is written to the active profile. The
 * only thing it reads from the battle setup is the list of pinned units, to mark them.
 */
import { useId, useMemo, useState } from 'react';

import type { Group, Race } from '@/data/types';
import type { CustomMercenary, Profile } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { UnitTile } from '@/ui/domain';
import {
  Button,
  Card,
  IconButton,
  NumberStepper,
  SearchField,
  SelectableItem,
  SelectableList,
  Switch,
  ToggleGroup,
  ToggleItem,
} from '@/ui/kit';
import { Cluster, Stack } from '@/ui/layout';

import { PencilIcon, PlusIcon } from '../../icons';
import { CustomMercenarySheet } from './CustomMercenarySheet';
import { GROUP_LABELS, RACE_LABELS } from './labels';
import {
  matches,
  MERCENARY_RACES,
  ownedRows,
  ownedText,
  pickerRows,
  recentFirst,
  ROLES,
  TIERS,
} from './rows';
import type { MercenaryRow } from './rows';
import { readRecent, rememberRecent } from './uiPrefs';

/** A pinned mercenary says so in its name: the pin on the tile is a picture, not a word. */
function rowName(entry: MercenaryRow, isPinned: boolean): string {
  return isPinned ? `${entry.label}, kept in the march` : entry.label;
}

export function MercenariesSection() {
  const profile = useStore(selectActiveProfile);
  const pinnedIds = useStore(selectActiveSetup)?.pinnedUnitIds;
  const updateProfile = useStore((state) => state.updateProfile);
  const titleId = useId();

  const mercenaries = profile?.mercenaries;
  const hired = (mercenaries?.selected.length ?? 0) + (mercenaries?.custom.length ?? 0);
  const [picking, setPicking] = useState(() => hired === 0);
  const [recent, setRecent] = useState<string[]>(() => readRecent());
  const [query, setQuery] = useState('');
  const [tiers, setTiers] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [races, setRaces] = useState<string[]>([]);
  const [editor, setEditor] = useState<{ merc?: CustomMercenary } | null>(null);

  const owned = useMemo(() => (mercenaries === undefined ? [] : ownedRows(mercenaries)), [mercenaries]);
  const ownedIds = useMemo(() => owned.map((entry) => entry.id), [owned]);

  const offered = useMemo(() => {
    const filters = {
      query,
      tiers: tiers.map(Number),
      roles: roles as Group[],
      races: races as Race[],
    };
    return recentFirst(
      pickerRows(new Set(ownedIds)).filter((entry) => matches(entry, filters)),
      recent,
    );
  }, [ownedIds, query, tiers, roles, races, recent]);

  if (profile === undefined || mercenaries === undefined) return null;

  const profileId = profile.id;
  const pinned = new Set(pinnedIds ?? []);

  const patch = (next: Partial<Profile['mercenaries']>): void => {
    updateProfile(profileId, (current) => ({ mercenaries: { ...current.mercenaries, ...next } }));
  };

  /** The owned list is ticked all the way down; untick a row and that mercenary leaves the camp. */
  const keepOwned = (keys: string[]): void => {
    const kept = new Set(keys);
    patch({
      selected: mercenaries.selected.filter((entry) => kept.has(entry.id)),
      custom: mercenaries.custom.filter((entry) => kept.has(entry.id)),
    });
  };

  /** The picker starts with nothing ticked, so whatever comes back is what was just hired. */
  const hire = (keys: string[]): void => {
    const added = keys.filter((id) => !ownedIds.includes(id));
    if (added.length === 0) return;
    patch({ selected: [...mercenaries.selected, ...added.map((id) => ({ id, cap: null }))] });
    for (const id of added) setRecent(rememberRecent(id));
  };

  const setCap = (id: string, cap: number | null): void => {
    patch({
      selected: mercenaries.selected.map((entry) => (entry.id === id ? { ...entry, cap } : entry)),
    });
  };

  const saveCustom = (merc: CustomMercenary): void => {
    const custom = mercenaries.custom;
    patch({
      custom: custom.some((entry) => entry.id === merc.id)
        ? custom.map((entry) => (entry.id === merc.id ? merc : entry))
        : [...custom, merc],
    });
    setEditor(null);
  };

  return (
    <Card as="section" id="mercenaries" aria-labelledby={titleId}>
      <Stack gap={4}>
        <Stack gap={2}>
          <h2 id={titleId} className="font-display text-lg">
            Mercenaries
          </h2>
          {owned.length === 0 ? (
            <p className="text-muted text-sm">None hired yet. Find one below and say how many you own.</p>
          ) : (
            <SelectableList label="Mercenaries you own" selectedKeys={ownedIds} onSelectionChange={keepOwned}>
              {owned.map((entry) => (
                <SelectableItem
                  key={entry.id}
                  id={entry.id}
                  label={rowName(entry, pinned.has(entry.id))}
                  actions={
                    entry.isCustom ? (
                      <IconButton
                        label={`Edit ${entry.unit.name}`}
                        onPress={() => {
                          const merc = mercenaries.custom.find((custom) => custom.id === entry.id);
                          if (merc !== undefined) setEditor({ merc });
                        }}
                      >
                        <PencilIcon />
                      </IconButton>
                    ) : (
                      <>
                        <NumberStepper
                          label="Owned"
                          size="sm"
                          min={0}
                          allowEmpty
                          value={entry.cap}
                          onChange={(value) => {
                            setCap(entry.id, value);
                          }}
                        />
                        <Switch
                          label="Unlimited"
                          isSelected={entry.cap === null}
                          onChange={(on) => {
                            setCap(entry.id, on ? null : 0);
                          }}
                        />
                      </>
                    )
                  }
                >
                  <Face entry={entry} isPinned={pinned.has(entry.id)} showOwned />
                </SelectableItem>
              ))}
            </SelectableList>
          )}
        </Stack>

        {picking ? (
          <Stack gap={2}>
            <SearchField
              label="Find a mercenary"
              value={query}
              onChange={setQuery}
              placeholder="Name or code"
            />
            <Cluster gap={4} align="start">
              <ToggleGroup label="Tier" size="sm" selectionMode="multiple" value={tiers} onChange={setTiers}>
                {TIERS.map((tier) => (
                  <ToggleItem key={tier} id={String(tier)} label={`Tier ${tier}`}>
                    {`T${tier}`}
                  </ToggleItem>
                ))}
              </ToggleGroup>
              <ToggleGroup label="Role" size="sm" selectionMode="multiple" value={roles} onChange={setRoles}>
                {ROLES.map((role) => (
                  <ToggleItem key={role} id={role} label={GROUP_LABELS[role]}>
                    {GROUP_LABELS[role]}
                  </ToggleItem>
                ))}
              </ToggleGroup>
              <ToggleGroup label="Race" size="sm" selectionMode="multiple" value={races} onChange={setRaces}>
                {MERCENARY_RACES.map((race) => (
                  <ToggleItem key={race} id={race} label={RACE_LABELS[race]}>
                    {RACE_LABELS[race]}
                  </ToggleItem>
                ))}
              </ToggleGroup>
            </Cluster>
            <SelectableList
              label="Add a mercenary"
              density="compact"
              scrolls
              selectedKeys={[]}
              onSelectionChange={hire}
              emptyState="Nothing matches those filters."
            >
              {offered.map((entry) => (
                <SelectableItem key={entry.id} id={entry.id} label={entry.label}>
                  <Face entry={entry} isPinned={false} />
                </SelectableItem>
              ))}
            </SelectableList>
            <Cluster gap={2} justify="between">
              <Button
                variant="quiet"
                icon={<PlusIcon />}
                onPress={() => {
                  setEditor({});
                }}
              >
                Custom mercenary
              </Button>
              {owned.length > 0 && (
                <Button
                  variant="quiet"
                  onPress={() => {
                    setPicking(false);
                  }}
                >
                  Done adding
                </Button>
              )}
            </Cluster>
          </Stack>
        ) : (
          <Button
            icon={<PlusIcon />}
            onPress={() => {
              setPicking(true);
            }}
          >
            Add mercenaries
          </Button>
        )}
      </Stack>

      {editor !== null && (
        <CustomMercenarySheet
          key={editor.merc?.id ?? 'new'}
          isOpen
          {...(editor.merc === undefined ? {} : { initial: editor.merc })}
          onSubmit={saveCustom}
          onClose={() => {
            setEditor(null);
          }}
        />
      )}
    </Card>
  );
}

/**
 * What every row shows: the tile, the name, and the quiet line of what the mercenary is. An owned
 * row ends that line with the quantity — `×22`, or `×∞` when nothing caps the stack — so the list
 * reads as the recap it is without opening anything.
 */
function Face({
  entry,
  isPinned,
  showOwned = false,
}: {
  entry: MercenaryRow;
  isPinned: boolean;
  /** The row is one of the mercenaries you own, so the quantity belongs on the line. */
  showOwned?: boolean;
}) {
  return (
    <>
      <UnitTile unit={entry.unit} size="sm" state={isPinned ? 'pinned' : 'on'} label="" />
      <Stack gap={1} className="min-w-0">
        <span className="truncate">{entry.unit.name}</span>
        <span className="text-muted truncate text-sm">
          {showOwned && !entry.isCustom ? `${entry.facts} · ${ownedText(entry.cap)}` : entry.facts}
        </span>
      </Stack>
    </>
  );
}
