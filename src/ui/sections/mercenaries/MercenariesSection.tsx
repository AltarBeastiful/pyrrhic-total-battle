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
 * Like Troops, this card describes the *account*: everything is written to the active profile, and
 * nothing here is read from the battle setup or from the march on screen.
 */
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Popover,
  Stack,
  Switch,
  Text,
  Transition,
  UnstyledButton,
} from '@mantine/core';
import { Pencil, Plus, Undo2 } from 'lucide-react';
import { forwardRef, lazy, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';

import type { CustomMercenary, Profile } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { count, Glyph, romanTier, tierInk, TierBadge } from '@/ui/domain';
import { CornerPill, GroupedCombobox, NumberField, Panel, PillRow } from '@/ui/kit';
import type { ComboboxGroup, PillRowItem } from '@/ui/kit';
import { LazySurface } from '@/ui/lazy';

import classes from './mercenaries.module.css';
import { capSpoken, mercGlyph, offerGroups, ownedRows, shortCode } from './rows';
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
  const updateProfile = useStore((state) => state.updateProfile);
  const titleId = useId();

  const mercenaries = profile?.mercenaries;
  const [editor, setEditor] = useState<{ merc?: CustomMercenary } | null>(null);
  const [undo, setUndo] = useState<Removed | null>(null);
  const lastUndo = useRef<Removed | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offerUndo = (removed: Removed): void => {
    if (undoTimer.current !== null) clearTimeout(undoTimer.current);
    lastUndo.current = removed;
    setUndo(removed);
    undoTimer.current = setTimeout(() => {
      setUndo(null);
      undoTimer.current = null;
    }, UNDO_MS);
  };
  useEffect(
    () => () => {
      if (undoTimer.current !== null) clearTimeout(undoTimer.current);
    },
    [],
  );

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

  const patch = (next: Partial<Profile['mercenaries']>): void => {
    updateProfile(profileId, (current) => ({ mercenaries: { ...current.mercenaries, ...next } }));
  };

  const hire = (id: string): void => {
    if (ownedIds.includes(id)) return;
    patch({ selected: [...mercenaries.selected, { id, cap: null }] });
  };

  /**
   * A removal is one press on the pill and comes with a way back (owner, 2026-09-18: "deletion on
   * click on the pill, with a disappearing message: bring back, or cancel"): what was removed, and
   * where it stood, kept for `UNDO_MS` under the row. Put back slots a hired one back at its old
   * index — a hire made in between keeps its place — and a custom one at the end of its own list.
   */
  const release = (id: string): void => {
    const at = mercenaries.selected.findIndex((entry) => entry.id === id);
    const removed = {
      selected: mercenaries.selected.filter((entry) => entry.id === id),
      custom: mercenaries.custom.filter((entry) => entry.id === id),
      at: Math.max(0, at),
      what: owned.find((entry) => entry.id === id)?.unit.name ?? 'Mercenary',
    };
    patch({
      selected: mercenaries.selected.filter((entry) => entry.id !== id),
      custom: mercenaries.custom.filter((entry) => entry.id !== id),
    });
    offerUndo(removed);
  };

  const releaseAll = (): void => {
    const removed = {
      selected: mercenaries.selected,
      custom: mercenaries.custom,
      at: 0,
      what: `${String(owned.length)} mercenaries`,
    };
    patch({ selected: [], custom: [] });
    offerUndo(removed);
  };

  const putBack = (): void => {
    if (undo === null) return;
    const selected = [...mercenaries.selected];
    selected.splice(Math.min(undo.at, selected.length), 0, ...undo.selected);
    patch({ selected, custom: [...mercenaries.custom, ...undo.custom] });
    setUndo(null);
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

  // No × on the pill any more: the pill's own body removes it (owner, 2026-09-18), and the badge —
  // or a custom one's pencil — is the way into its editor.
  const items: PillRowItem[] = owned.map((entry) => ({
    id: entry.id,
    label: null,
    element: entry.isCustom ? (
      <CustomPill
        entry={entry}
        onRemove={() => {
          release(entry.id);
        }}
        onEdit={() => {
          const merc = mercenaries.custom.find((custom) => custom.id === entry.id);
          if (merc !== undefined) setEditor({ merc });
        }}
      />
    ) : (
      <HiredPill
        entry={entry}
        onRemove={() => {
          release(entry.id);
        }}
        onCap={(cap) => {
          setCap(entry.id, cap);
        }}
      />
    ),
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
        {/* One row: the pills and the two ways to add one, wrapping together at 8 px, as the
            spacing contract draws them (`MercenariesSpacing.dc.html`, `.pills`). */}
        <div className={classes.camp}>
          {owned.length > 0 && (
            <PillRow label="Mercenaries you own" items={items} className={classes.pills} />
          )}
          <GroupedCombobox
            triggerLabel="Hire mercenary…"
            searchLabel="Search mercenaries"
            groups={groups}
            onPick={hire}
            emptyMessage="No mercenary of that name. Add it by hand."
            width={240}
          />
          {/* Quiet, in the muted ink (owner, 2026-09-18: "greyish but still visible, as it's seldom
              used"): a mercenary the tables do not carry is a rare thing to type in. */}
          <Button
            variant="subtle"
            color="gray"
            c="dimmed"
            leftSection={<Plus size={14} aria-hidden="true" />}
            onClick={() => {
              setEditor({});
            }}
          >
            Custom mercenary
          </Button>
          {owned.length > 0 && (
            <Button variant="subtle" size="compact-sm" onClick={releaseAll}>
              Deselect all
            </Button>
          )}
        </div>

        {/* The way back, for `UNDO_MS` after a removal: one line under the row, a live region so it
            is read out, and a button that puts back exactly what went. Then it goes by itself — on a
            short fade in and out (owner, 2026-09-18: "a very slight animation"), which the theme
            turns off for anyone who asked their system for stillness. The last message is kept for
            the fade-out, since `undo` is already null while the line is still leaving. */}
        <Transition mounted={undo !== null} transition="fade" duration={160}>
          {(style) => (
            <Group role="status" gap="xs" wrap="nowrap" style={style}>
              <Text span size="sm" c="dimmed">
                {`${(undo ?? lastUndo.current)?.what ?? ''} removed.`}
              </Text>
              <Button
                variant="subtle"
                size="compact-sm"
                leftSection={<Undo2 size={14} aria-hidden />}
                onClick={putBack}
              >
                Put back
              </Button>
            </Group>
          )}
        </Transition>

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
 * it is, the numeral says which tier in that tier's colour, and the figure says how many you own.
 * Inline spans rather than a flex row: the pill's own label box already centres its line, and a
 * `<div>` inside a `<button>` is not HTML.
 */
/**
 * The count badge's three sizes, inline for the same reason `TierBadge` writes its own: the theme's
 * `Badge.vars` land on the element's `style`, and only an inline value outranks them.
 */
/** How long the way back stays under the row after a removal. */
const UNDO_MS = 6000;

/** What a removal took, and where it stood, so "Put back" restores exactly that. */
interface Removed {
  selected: Profile['mercenaries']['selected'];
  custom: Profile['mercenaries']['custom'];
  at: number;
  what: string;
}

const COUNT_BADGE = {
  '--badge-fz': 'var(--mantine-font-size-xs)',
  '--badge-height': '1.25rem',
  '--badge-padding-x': '0.375rem',
} as const;

function PillFace({ entry }: { entry: MercenaryRow }) {
  const tier = entry.unit.tier;
  return (
    <>
      <Glyph kind={mercGlyph(entry.unit)} />
      <Text span size="xs" fw={600}>
        {shortCode(entry.unit.label)}
      </Text>
      {/* The tier as the **badge**, not as a bare Fraunces numeral (the owner's review of
          2026-09-13: "the V number of the mercenary is not easily readable" — the display face drew
          `VI` as `\I` at 13 px). Inter 11/700 in the tier's ink on a wash of it: one object, and the
          same one the picker's rows already wear. */}
      {tier === 0 ? (
        <Text span className={classes.custom} c="dimmed">
          Custom
        </Text>
      ) : (
        <TierBadge tier={tier} />
      )}
      {/* The quantity as a **badge** (owner, 2026-09-18: "move the hired mercs number in a badge"): the
          one figure on the pill reads as a figure rather than as the end of the name, and it is the
          obvious place to press to change it — though the whole face is that button. Neutral, never
          the tier's ink, so the two badges cannot be read as one thing; 13 px, because an owned count
          is information (rule 19) where the tier is a label. `∞` goes through the glyph box inside
          the same badge, so an unlimited pill is exactly as tall as a "1 212" one. */}
    </>
  );
}

/**
 * The owned count as a **badge on the pill's corner**, and the button that edits it (owner,
 * 2026-09-18: "a real badge, like the heroes' one but a bit bigger so it's easily readable, in the
 * upper right corner of the pill"). Round and solid, 20 px against the gear's 18, in the neutral
 * slate so it never reads as the tier's badge; 13 px, because an owned count is information
 * (rule 19) where the tier is a label. `∞` goes through the glyph box inside the same badge.
 */
/** What `Popover.Target` hands its child besides the ref: its ARIA and nothing that styles. */
type TargetProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'color' | 'style' | 'className' | 'children' | 'type' | 'onClick'
>;

const CountBadge = forwardRef<HTMLButtonElement, { entry: MercenaryRow; onPress: () => void } & TargetProps>(
  function CountBadge({ entry, onPress, ...target }, ref) {
    // `ref` and `...target` are the popover's: `Popover.Target` anchors its dropdown on the element it
    // is handed a reference to and stamps its ARIA on it. Without them the editor opened at the page's
    // top-left corner (owner, 2026-09-18: "the popup is opened on the far left corner").
    return (
      <Badge
        // The popover's own props first, so the badge's class, style and press are what stands: the
        // target's `className` would otherwise write over the badge's, and with it the pointer.
        {...target}
        ref={ref}
        component="button"
        type="button"
        variant="filled"
        color="slate"
        autoContrast
        radius="xl"
        tt="none"
        fw={600}
        className={classes.count}
        style={COUNT_BADGE}
        aria-label={`${entry.unit.name}: owned ${capSpoken(entry.cap)}`}
        onClick={onPress}
      >
        {entry.cap === null ? <Glyph kind="unlimited" /> : count(entry.cap)}
      </Badge>
    );
  },
);

/**
 * One mercenary the tables carry. Its body is the quantity: press it and a popover opens under the
 * pill with a plain field — an owned count is typed, never walked to (owner, 2026-09-13) — and the
 * switch that says "as many as the camp pays for".
 */
function HiredPill({
  entry,
  onCap,
  onRemove,
}: {
  entry: MercenaryRow;
  onCap: (cap: number | null) => void;
  onRemove: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const name = entry.unit.name;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      // On the badge's **end**, which is the one edge of it that never moves: the badge is
      // right-aligned on the pill's corner and grows leftward as the figure lands, so a box aligned
      // on its start walked left with every digit (owner, 2026-09-18: "when inputting numbers…
      // the tooltip moves; it shouldn't").
      position="bottom-end"
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
      {/* Two targets on one pill (owner, 2026-09-18): the body removes the mercenary — one press,
          with the way back under the row — and the badge on its top-right corner opens the
          owned-count editor. The popover hangs off the badge, which is a real `<button>`, so
          `aria-expanded` lands where it is allowed (investigation 0007). */}
      <CornerPill
        corner={
          <Popover.Target>
            <CountBadge
              entry={entry}
              onPress={() => {
                setOpened((open) => !open);
              }}
            />
          </Popover.Target>
        }
      >
        <UnstyledButton className={classes.face} fz="sm" aria-label={`Remove ${name}`} onClick={onRemove}>
          <PillFace entry={entry} />
        </UnstyledButton>
      </CornerPill>
      {/* A width of its own, on the dropdown rather than on the popover, and a field that fills it:
          neither the box nor the control inside it is allowed to be sized by what is typed. */}
      <Popover.Dropdown w={CAP_POPOVER_WIDTH} className={classes.capPopover}>
        {/* A form, so that **Enter closes the editor** (owner, 2026-09-18): the figure is already
            written on every keystroke, and Enter is how a typed number is finished. The submit does
            nothing but close; the focus goes back to the badge, as the popover returns it. */}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setOpened(false);
          }}
          onKeyDown={(event) => {
            // Enter in the field, whether or not the browser turns it into a submit (jsdom does
            // not always): the same close. The switch keeps its own keys.
            if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
            if (event.target.type === 'checkbox') return;
            event.preventDefault();
            setOpened(false);
          }}
        >
          <Stack gap="sm">
            {/* The contract's head: the glyph in its box and the name at 14/600 (`.pop h4`). */}
            <Group gap={6} wrap="nowrap">
              <Glyph kind={mercGlyph(entry.unit)} />
              <Text span fz="0.875rem" fw={600}>
                {name}
              </Text>
            </Group>
            <NumberField
              label="Owned"
              value={entry.cap}
              min={0}
              allowEmpty
              w="100%"
              enterKeyHint="done"
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
        </form>
      </Popover.Dropdown>
    </Popover>
  );
}

/**
 * A hand-typed one: there is no owned count to set, so where the badge would be stands the pencil
 * that reopens the form it came from; its body removes it, like every pill's.
 */
function CustomPill({
  entry,
  onEdit,
  onRemove,
}: {
  entry: MercenaryRow;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <CornerPill
      corner={
        <ActionIcon
          size={20}
          radius="xl"
          variant="default"
          aria-label={`Edit ${entry.unit.name}`}
          onClick={onEdit}
        >
          <Pencil size={11} aria-hidden />
        </ActionIcon>
      }
    >
      <UnstyledButton
        className={classes.face}
        fz="sm"
        aria-label={`Remove ${entry.unit.name}`}
        onClick={onRemove}
      >
        <PillFace entry={entry} />
      </UnstyledButton>
    </CornerPill>
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
      {/* A real space, not the row's gap: the badge is an inline `span`, and the accessible-name
          algorithm only puts a space between *block* boxes — without this the row is announced as
          "Bear Vtier 5". CSS gaps are not text. */}{' '}
      <TierBadge tier={entry.unit.tier} />
    </Group>
  );
}
