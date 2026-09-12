/**
 * Mercenaries (design plan §7.2, amended by the owner on 2026-09-13 and again after watching
 * TotalStack live, `docs/investigations/0006-totalstack-captain-picker.md`) — the camp as a row of
 * compact pills with a picker under it.
 *
 * The camp is not a list of rows: a player owns four to eight mercenaries and wants to see all of
 * them at once, so each one is a **pill** — category glyph, short code, the tier in its own colour,
 * how many you own, and a remove cross — and the pills wrap like words in a sentence, climbing the
 * tiers as the picker does. The heading
 * counts them and carries the one action that touches all of them. Nothing happens when the body of
 * a pill is pressed: only the quantity (a popover) and the cross (remove) act, so a stray tap never
 * changes the camp.
 *
 * The quantity lives in a popover rather than inside the pill because a labelled field plus its
 * "unlimited" toggle is three times the height of the pill itself; there it also has the room to
 * say what an empty field means.
 *
 * Adding is a combobox and nothing else: players know mercenaries by name and by tier, so you type
 * the name, or you open the list, which is grouped by tier from the lowest up, as TotalStack's is.
 * No Tier/Role/Race chips anywhere. A mercenary the tables do not carry is typed by hand from the
 * button under the field.
 *
 * Like Troops, this card describes the *account*: everything is written to the active profile. The
 * only thing it reads from the battle setup is the list of pinned units, to mark them.
 */
import { lazy, useId, useMemo, useState } from 'react';
import type { ComponentType } from 'react';

import type { Category, Race } from '@/data/types';
import type { CustomMercenary, Profile } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { romanTier, TIER_INK, TierBadge, UnitTile } from '@/ui/domain';
import { Badge, Button, Card, Combobox, IconButton, NumberInput, Popover, Switch } from '@/ui/kit';
import type { ComboboxSection } from '@/ui/kit';
import { Cluster, Stack } from '@/ui/layout';
import { LazySurface } from '@/ui/lazy';

import type { IconProps } from '../../icons';
import {
  BeastFillIcon,
  CloseIcon,
  DragonFillIcon,
  ElementalFillIcon,
  EngineersFillIcon,
  FlyingFillIcon,
  GiantFillIcon,
  MeleeFillIcon,
  MountedFillIcon,
  PencilIcon,
  PinIcon,
  PlusIcon,
  RangedFillIcon,
} from '../../icons';

import { offerGroups, ownedRows, ownedText } from './rows';
import type { MercenaryRow } from './rows';

// The hand-typed-mercenary form is a whole second card's worth of fields for something most players
// never open: it arrives with the first press of "Custom mercenary…" (ui-foundation plan §6).
const CustomMercenarySheet = lazy(() =>
  import('./CustomMercenarySheet').then((module) => ({ default: module.CustomMercenarySheet })),
);

/**
 * The silhouette a pill wears: its category, or its race when the tables tag it as a monster only.
 * The unit tile draws the same set at a size where a whole tile fits; a pill has room for the glyph
 * alone.
 */
const PILL_GLYPH: Record<Category | Race | 'other', ComponentType<IconProps>> = {
  melee: MeleeFillIcon,
  ranged: RangedFillIcon,
  mounted: MountedFillIcon,
  flying: FlyingFillIcon,
  beast: BeastFillIcon,
  elemental: ElementalFillIcon,
  dragon: DragonFillIcon,
  giant: GiantFillIcon,
  other: EngineersFillIcon,
};

/** The short code without its tier digits: the data's "ABM6" is drawn as "ABM" beside a roman VI. */
function shortCode(label: string): string {
  return label.replace(/\d+$/, '') || label;
}

export function MercenariesSection() {
  const profile = useStore(selectActiveProfile);
  const pinnedIds = useStore(selectActiveSetup)?.pinnedUnitIds;
  const updateProfile = useStore((state) => state.updateProfile);
  const titleId = useId();

  const mercenaries = profile?.mercenaries;
  const [editor, setEditor] = useState<{ merc?: CustomMercenary } | null>(null);

  const owned = useMemo(() => (mercenaries === undefined ? [] : ownedRows(mercenaries)), [mercenaries]);
  const ownedIds = useMemo(() => owned.map((entry) => entry.id), [owned]);

  /** The picker: one group per tier, lowest first, each headed by its roman numeral in its colour. */
  const offered = useMemo<ComboboxSection[]>(
    () =>
      offerGroups(new Set(ownedIds)).map((group) => {
        const tone = TIER_INK[group.tier];
        return {
          id: `tier-${group.tier}`,
          title: `Tier ${romanTier(group.tier)}`,
          items: group.rows.map((entry) => ({
            id: entry.id,
            label: entry.label,
            render: () => <Offer entry={entry} />,
          })),
          ...(tone === undefined ? {} : { tone }),
        };
      }),
    [ownedIds],
  );

  if (profile === undefined || mercenaries === undefined) return null;

  const profileId = profile.id;
  const pinned = new Set(pinnedIds ?? []);

  const patch = (next: Partial<Profile['mercenaries']>): void => {
    updateProfile(profileId, (current) => ({ mercenaries: { ...current.mercenaries, ...next } }));
  };

  const hire = (id: string): void => {
    if (ownedIds.includes(id)) return;
    patch({ selected: [...mercenaries.selected, { id, cap: null }] });
  };

  const release = (id: string): void => {
    patch({
      selected: mercenaries.selected.filter((entry) => entry.id !== id),
      custom: mercenaries.custom.filter((entry) => entry.id !== id),
    });
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
    <Card tone="none" shape="flat" as="section" id="mercenaries" aria-labelledby={titleId}>
      <Stack gap={4}>
        <Stack gap={2}>
          <Cluster gap={2} align="center" justify="between">
            <Cluster gap={2} align="center">
              <h2 id={titleId} className="text-lg">
                Mercenaries
              </h2>
              {owned.length > 0 && <span className="text-muted text-sm">({owned.length} selected)</span>}
            </Cluster>
            {owned.length > 0 && (
              <Button
                variant="quiet"
                size="sm"
                onPress={() => {
                  patch({ selected: [], custom: [] });
                }}
              >
                Deselect all
              </Button>
            )}
          </Cluster>

          {owned.length > 0 && (
            <ul aria-label="Mercenaries you own" className="flex flex-wrap gap-2">
              {owned.map((entry) => (
                <li key={entry.id}>
                  <Pill
                    entry={entry}
                    isPinned={pinned.has(entry.id)}
                    onCap={(cap) => {
                      setCap(entry.id, cap);
                    }}
                    onEdit={() => {
                      const merc = mercenaries.custom.find((custom) => custom.id === entry.id);
                      if (merc !== undefined) setEditor({ merc });
                    }}
                    onRemove={() => {
                      release(entry.id);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </Stack>

        <Stack gap={2} align="start">
          <Combobox
            label="Add a mercenary"
            placeholder="Name or code"
            className="w-full"
            description="Type a name, or open the list: mercenaries are grouped by tier."
            sections={offered}
            onSelect={hire}
            emptyState="No mercenary of that name. Add it by hand below."
          />
          <Button
            variant="quiet"
            icon={<PlusIcon />}
            onPress={() => {
              setEditor({});
            }}
          >
            Custom mercenary…
          </Button>
        </Stack>
      </Stack>

      <LazySurface isOpen={editor !== null}>
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
      </LazySurface>
    </Card>
  );
}

/**
 * One mercenary you own: `⚔ ABM VI ×22 ✕`. The glyph and the code say which unit it is, the badge
 * says which tier in that tier's colour, the quantity opens its own editor and the cross gives the
 * mercenary back. A pinned one carries the mark the march keeps it with.
 *
 * The pill is 32 px tall with a pointer and 44 px on a touch screen, where its two buttons owe a
 * thumb that much. The code is the one thing a screen reader never hears: it hears the name.
 */
function Pill({
  entry,
  isPinned,
  onCap,
  onEdit,
  onRemove,
}: {
  entry: MercenaryRow;
  isPinned: boolean;
  onCap: (cap: number | null) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  // Indexed where it is used, the way the unit tile picks its silhouette: a component that comes
  // out of a call during render is a new component on every render.
  const Glyph = PILL_GLYPH[entry.unit.category ?? entry.unit.race ?? 'other'];
  const name = entry.unit.name;

  return (
    <span className="bg-raised rounded-chip flex items-center gap-1 py-0.5 pr-0.5 pl-1.5">
      <Glyph aria-hidden="true" className="text-group-mercenaries-strong size-4 shrink-0" />
      <span aria-hidden="true" className="text-sm font-medium">
        {shortCode(entry.unit.label)}
      </span>
      <span className="sr-only">{name}</span>
      {entry.unit.tier === 0 ? <Badge>Custom</Badge> : <TierBadge tier={entry.unit.tier} />}
      {isPinned && <PinIcon title="kept in the march" className="text-muted size-3.5 shrink-0" />}
      {entry.isCustom ? (
        <IconButton size="sm" label={`Edit ${name}`} onPress={onEdit}>
          <PencilIcon />
        </IconButton>
      ) : (
        <Popover
          label={`How many ${name} you own`}
          trigger={
            <Button
              variant="quiet"
              size="sm"
              className="px-1"
              aria-label={`${name}: owned ${entry.cap === null ? 'unlimited' : entry.cap}`}
            >
              <span className="nums text-sm">{ownedText(entry.cap)}</span>
            </Button>
          }
        >
          <Stack gap={3}>
            <p className="text-base font-medium">{name}</p>
            <NumberInput
              label="Owned"
              min={0}
              allowEmpty
              value={entry.cap}
              description="How many you can field. Empty means as many as the camp pays for."
              onChange={onCap}
            />
            <Switch
              label="Unlimited"
              isSelected={entry.cap === null}
              onChange={(on) => {
                onCap(on ? null : 0);
              }}
            />
          </Stack>
        </Popover>
      )}
      <IconButton size="sm" label={`Remove ${name}`} onPress={onRemove}>
        <CloseIcon />
      </IconButton>
    </span>
  );
}

/** One row of the picker; the combobox draws the ground and the focus, this only fills the line. */
function Offer({ entry }: { entry: MercenaryRow }) {
  return (
    <>
      <UnitTile unit={entry.unit} size="sm" state="on" label="" className="size-8" />
      <span className="min-w-0 flex-1 truncate">{entry.unit.name}</span>
      <TierBadge tier={entry.unit.tier} />
    </>
  );
}
