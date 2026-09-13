/**
 * Mercenaries (design plan §7.2, amended by the owner on 2026-09-13 and again after watching
 * TotalStack live, `docs/investigations/0006-totalstack-captain-picker.md`) — the camp as a row of
 * tiny pills with a picker under it, rebuilt on Mantine (M-05).
 *
 * The camp is not a list of rows: a player owns four to eight mercenaries and wants to see all of
 * them at once, so each one is a **pill** — category glyph, short code, the tier in its own colour,
 * how many you own, and a remove cross — and the pills wrap like words in a sentence, climbing the
 * tiers as the picker does. The heading counts them and carries the one action that touches all of
 * them.
 *
 * Pressing the body of a pill opens the quantity in a popover rather than editing it in place: a
 * labelled field plus its "unlimited" switch is three times the height of the pill itself, and
 * there it has the room to say what an empty field means. The cross is a second, separate button,
 * so a stray tap never releases a mercenary. A hand-typed one has no quantity to set, so its body
 * opens its own sheet instead.
 *
 * Adding is a combobox and nothing else: players know mercenaries by name and by tier, so you type
 * the name, or you open the list, which is grouped by tier from the lowest up, as TotalStack's is.
 * No Tier/Role/Race chips anywhere. A mercenary the tables do not carry is typed by hand from the
 * button beside the picker.
 *
 * Like Troops, this card describes the *account*: everything is written to the active profile. The
 * only thing it reads from the battle setup is the list of pinned units, to mark them.
 */
import { Button, Group, Popover, Stack, Switch, Text, UnstyledButton } from '@mantine/core';
import { Plus } from 'lucide-react';
import { lazy, useId, useMemo, useState } from 'react';

import type { CustomMercenary, Profile } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Glyph, romanTier, tierInk, TierBadge } from '@/ui/domain';
import { GroupedCombobox, NumberField, Panel, PillRow } from '@/ui/kit';
import type { ComboboxGroup, PillRowItem } from '@/ui/kit';
import { LazySurface } from '@/ui/lazy';

import { capSpoken, capText, mercGlyph, offerGroups, ownedRows, shortCode } from './rows';
import type { MercenaryRow } from './rows';

// The hand-typed-mercenary form is a whole second card's worth of fields for something most players
// never open: it arrives with the first press of "Custom mercenary" (ui-foundation plan §6).
const CustomMercenarySheet = lazy(() =>
  import('./CustomMercenarySheet').then((module) => ({ default: module.CustomMercenarySheet })),
);

/** How wide the owned-count editor is, in every state it can be in. */
const CAP_POPOVER_WIDTH = 280;

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
  const groups = useMemo<ComboboxGroup[]>(
    () =>
      offerGroups(new Set(ownedIds)).map((group) => ({
        key: `tier-${group.tier}`,
        label: (
          <Text span size="xs" fw={600} c={tierInk(group.tier)}>
            Tier {romanTier(group.tier)}
          </Text>
        ),
        options: group.rows.map((entry) => ({
          value: entry.id,
          label: <Offer entry={entry} />,
          searchText: `${entry.unit.name} ${entry.unit.label}`,
        })),
      })),
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

  const items: PillRowItem[] = owned.map((entry) => ({
    id: entry.id,
    label: entry.isCustom ? (
      <CustomPill
        entry={entry}
        isPinned={pinned.has(entry.id)}
        onEdit={() => {
          const merc = mercenaries.custom.find((custom) => custom.id === entry.id);
          if (merc !== undefined) setEditor({ merc });
        }}
      />
    ) : (
      <HiredPill
        entry={entry}
        isPinned={pinned.has(entry.id)}
        onCap={(cap) => {
          setCap(entry.id, cap);
        }}
      />
    ),
    removeLabel: `Remove ${entry.unit.name}`,
    onRemove: () => {
      release(entry.id);
    },
  }));

  return (
    <Panel
      component="section"
      id="mercenaries"
      aria-labelledby={titleId}
      title="Mercenaries"
      titleId={titleId}
      meta={owned.length === 0 ? 'none hired' : `${String(owned.length)} hired`}
    >
      <Stack gap="sm">
        {owned.length > 0 && <PillRow label="Mercenaries you own" items={items} />}

        <Group gap="xs" wrap="wrap">
          <GroupedCombobox
            triggerLabel="Hire mercenary…"
            searchLabel="Search mercenaries"
            groups={groups}
            onPick={hire}
            emptyMessage="No mercenary of that name. Add it by hand."
            width={240}
          />
          <Button
            variant="subtle"
            leftSection={<Plus size={14} aria-hidden="true" />}
            onClick={() => {
              setEditor({});
            }}
          >
            Custom mercenary
          </Button>
          {owned.length > 0 && (
            <Button
              variant="subtle"
              size="compact-sm"
              onClick={() => {
                patch({ selected: [], custom: [] });
              }}
            >
              Deselect all
            </Button>
          )}
        </Group>

        {owned.length === 0 && (
          <Text size="sm" c="dimmed">
            Type a name, or open the list: mercenaries are grouped by tier, lowest first.
          </Text>
        )}
      </Stack>

      <LazySurface isOpen={editor !== null}>
        {editor !== null && (
          <CustomMercenarySheet
            key={editor.merc?.id ?? 'new'}
            opened
            {...(editor.merc === undefined ? {} : { initial: editor.merc })}
            onSubmit={saveCustom}
            onClose={() => {
              setEditor(null);
            }}
          />
        )}
      </LazySurface>
    </Panel>
  );
}

/**
 * What a pill says, in TotalStack's own order: `🐴 EMH V ∞`. The glyph and the code say which unit
 * it is, the numeral says which tier in that tier's colour, the figure says how many you own, and a
 * pinned one carries the mark the march keeps it with. Inline spans rather than a flex row: the
 * pill's own label box already centres its line, and a `<div>` inside a `<button>` is not HTML.
 */
function PillFace({ entry, isPinned }: { entry: MercenaryRow; isPinned: boolean }) {
  const tier = entry.unit.tier;
  return (
    <>
      <Glyph kind={mercGlyph(entry.unit)} />
      <Text span size="xs" fw={600} ml={5}>
        {shortCode(entry.unit.label)}
      </Text>
      {tier === 0 ? (
        <Text span size="xs" c="dimmed" ml={5}>
          Custom
        </Text>
      ) : (
        <Text span size="xs" variant="numeral" c={tierInk(tier)} ml={5}>
          {romanTier(tier)}
        </Text>
      )}
      {/* The quantity is a plain figure: Fraunces is for the tier numeral alone (design §3). */}
      {!entry.isCustom && (
        <Text span size="xs" ml={7}>
          {capText(entry.cap)}
        </Text>
      )}
      {isPinned && (
        <Text span size="xs" ml={5}>
          <Glyph kind="pin" scale={0.85} />
        </Text>
      )}
    </>
  );
}

/**
 * One mercenary the tables carry. Its body is the quantity: press it and a popover opens under the
 * pill with a plain field — an owned count is typed, never walked to (owner, 2026-09-13) — and the
 * switch that says "as many as the camp pays for".
 */
function HiredPill({
  entry,
  isPinned,
  onCap,
}: {
  entry: MercenaryRow;
  isPinned: boolean;
  onCap: (cap: number | null) => void;
}) {
  const [opened, setOpened] = useState(false);
  const name = entry.unit.name;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      withinPortal
      keepMounted={false}
      // The editor must not move while a figure is being typed into it (the owner's phone review,
      // 2026-09-13: it jumped sideways between the empty field and "1 212"). The pill it hangs off
      // *does* widen as the figure lands — that is the figure — and floating-ui's flip had turned
      // the dropdown's start alignment into an **end** alignment to fit it on a 390 px screen, so
      // the box was pinned to an edge that moves. Off the cross axis, the alignment stays at the
      // pill's start and `shift` clamps the box to the window instead: one position, whatever the
      // pill under it does.
      middlewares={{ flip: { crossAxis: false } }}
      trapFocus
      returnFocus
    >
      <Popover.Target>
        <UnstyledButton
          fz="sm"
          aria-label={`${name}: owned ${capSpoken(entry.cap)}`}
          onClick={() => {
            setOpened((open) => !open);
          }}
        >
          <PillFace entry={entry} isPinned={isPinned} />
        </UnstyledButton>
      </Popover.Target>
      {/* A width of its own, on the dropdown rather than on the popover, and a field that fills it:
          neither the box nor the control inside it is allowed to be sized by what is typed. */}
      <Popover.Dropdown w={CAP_POPOVER_WIDTH}>
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            {name}
          </Text>
          <NumberField
            label="Owned"
            value={entry.cap}
            min={0}
            allowEmpty
            w="100%"
            description="Empty means as many as the camp pays for."
            onChange={onCap}
          />
          <Switch
            size="xs"
            label="Unlimited"
            checked={entry.cap === null}
            onChange={(event) => {
              onCap(event.currentTarget.checked ? null : 0);
            }}
          />
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

/** A hand-typed one: there is no owned count to set, so its body opens the form it came from. */
function CustomPill({
  entry,
  isPinned,
  onEdit,
}: {
  entry: MercenaryRow;
  isPinned: boolean;
  onEdit: () => void;
}) {
  return (
    <UnstyledButton fz="sm" aria-label={`Edit ${entry.unit.name}`} onClick={onEdit}>
      <PillFace entry={entry} isPinned={isPinned} />
    </UnstyledButton>
  );
}

/** One row of the picker: the same glyph the pill will wear, the name, and the tier in its colour. */
function Offer({ entry }: { entry: MercenaryRow }) {
  return (
    <Group gap="xs" wrap="nowrap">
      <Glyph kind={mercGlyph(entry.unit)} />
      <Text span size="sm" style={{ flex: 1 }}>
        {entry.unit.name}
      </Text>
      <TierBadge tier={entry.unit.tier} />
    </Group>
  );
}
