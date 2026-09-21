/**
 * The March's second half (owner, 2026-09-15): everything that *explains* the answer rather than being
 * it. On a desktop these three blocks sit at the foot of the setup column so the March pane stays
 * shorter than it — which is what lets the pane stick
 * with its head pinned for good (`shell/usePaneStick.ts`: a pane that does not fit the room the window
 * leaves it sticks at both ends instead, and its recap is one flick of the wheel away rather than on screen).
 * Measured the same day: the pane was **771 px against 768 px of room at 1400×900**, so it did not
 * stick at any window size.
 *
 * **Two hosts, never both.** The blocks below are placed by `MarchFoot` when the pane is drawn, and by
 * `MarchSection` when the March is the phone's sheet (`!twoPanes`) — the same flag `MarchSection`
 * already switches its composition on, so "the March is written once" is the guarantee the single
 * Generate already relies on (design rule 5). Nothing here is drawn twice on one screen at any width.
 *
 * What stays in the pane is what the pane is *for*: the figures, the army, what it left at home, the
 * plan's own assessment (`PlanSizing`, `PlanFold`) — and, since 2026-09-21, the marks that copy, edit,
 * keep and send the march, which are on the March's heading at both widths and belong to no host but the
 * card itself (`MarchActions`). What is down here is reference: the objective comparison, the damage
 * split with the HP profile and the battle story, and the saved list.
 */
import { Group, Stack, Text } from '@mantine/core';
import { BookmarkPlus, Share2 } from 'lucide-react';
import { lazy, useState } from 'react';

import { version as gameData } from '@/data';
import type { BonusKey, SpecialKey } from '@/engine/types';
import { buildBattleLink } from '@/share/codec';
import { newSavedStack } from '@/state/defaults';
import type { SavedStack } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Disclosure, Panel, Sections } from '@/ui/kit';
import { LazySurface } from '@/ui/lazy';
import { copyText } from '@/ui/profile/download';
import { resultCounts, toSavedSummary, useResultStore } from '@/ui/resultStore';
import { MARCH_FOOT_ANCHOR } from '@/ui/shell/march';

import { DamageSplit } from './DamageSplit';
import { MarchAction, MarchCountsBar } from './MarchPills';
import classes from './march.module.css';
import { amount } from './format';
import { TradeoffStrip } from './TradeoffStrip';
import { useRunStore } from './runStore';
import { useMarch } from './useMarch';

// Three surfaces nobody sees until they ask for them, each heavy in its own way: the journal, the HP
// chart, the saved marches and the dialog that names one (ui-foundation plan §6). Saving a march and
// opening the list share one fetch.
const BattleStory = lazy(() => import('./BattleStory').then((module) => ({ default: module.BattleStory })));
const HpProfile = lazy(() => import('./HpProfile').then((module) => ({ default: module.HpProfile })));
const SavedMarchesPanel = lazy(() =>
  import('./SavedMarches').then((module) => ({ default: module.SavedMarchesPanel })),
);
const MarchNameDialog = lazy(() =>
  import('./SavedMarches').then((module) => ({ default: module.MarchNameDialog })),
);

/** Saved marches keep the aggregated bonus maps; the zeroes would triple the stored document. */
function stripZeros<K extends string>(map: Record<K, number>): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const [key, value] of Object.entries(map) as [K, number][]) {
    if (value !== 0) out[key] = value;
  }
  return out;
}

/**
 * What the objective bought, in the three shapes investigation 0013 §5 asks for. One part of its own,
 * and the tallest block the pane used to carry (~280 px measured).
 */
export function MarchObjectives() {
  const tradeoff = useRunStore((state) => state.tradeoff);
  if (tradeoff === null) return null;
  return <TradeoffStrip tradeoff={tradeoff} />;
}

/**
 * The HP profile and the battle story: reference, read once, so it stays folded (design rule 4).
 *
 * Two changes the owner asked for on 2026-09-18. The fold **opens on the damage split** — troop
 * damage against hired damage, and what a hired unit lost is worth — because that is what guides the
 * next march, and neither the story nor the chart says it (`DamageSplit`). And the **HP profile
 * comes first**: "invert the position of battle story and health stack so we see health stack
 * quickly". The chart is the shorter of the two and the one a player checks at a glance, while the
 * story is a round-by-round read; putting the story's paragraphs above it meant scrolling past them
 * every time. `DamageSplit` is not lazy — it is a handful of numbers already in hand — so it draws
 * the moment the fold opens, while the two heavy surfaces under it arrive with their chunks.
 */
export function MarchDetailsFold() {
  const { snapshot, result, summary } = useMarch();
  const [open, setOpen] = useState(false);
  if (snapshot === null || result === null || summary === null) return null;
  return (
    <Disclosure
      title="Details"
      summary="The HP profile and the battle story"
      opened={open}
      onChange={setOpen}
    >
      <LazySurface isOpen={open} reserve="panel">
        <Stack gap="md">
          <DamageSplit summary={summary} stacks={result.stacks} />
          <HpProfile stacks={result.stacks} units={snapshot.request.units} />
          <BattleStory request={snapshot.request} summary={summary} />
        </Stack>
      </LazySurface>
    </Disclosure>
  );
}

/** Yesterday's marches, kept in the profile. Draws before the first Generate too — it is where the
 * list is discovered at all. */
export function MarchSavedFold() {
  const profile = useStore(selectActiveProfile);
  const [open, setOpen] = useState(false);
  if (profile === undefined) return null;
  return (
    <Disclosure
      title="Saved marches"
      summary={
        profile.savedStacks.length === 0 ? 'Nothing saved yet' : `${amount(profile.savedStacks.length)} saved`
      }
      opened={open}
      onChange={setOpen}
    >
      <LazySurface isOpen={open} reserve="panel">
        <SavedMarchesPanel profile={profile} />
      </LazySurface>
    </Disclosure>
  );
}

/**
 * The things a player does with a whole march: copy every count, edit them by hand, keep the march,
 * send it. One toolbar, because they are one kind of thing.
 *
 * **Marks, on the March's own title line** (owner, 2026-09-21: *"editing count, copy and share could be
 * closer to summary and use icons to avoid crowding the ui"*). They were five labelled buttons at the
 * foot of the setup column, a whole page away from the figures and the pills they act on — the owner
 * reads the answer in the pane and had to travel to the other end of the page to copy it. As marks they
 * cost the pane no line at all: they sit beside the "12 stacks" meta on the March's heading
 * (`MarchSection.tsx`), at both widths, which is the one row on the card that was half empty.
 *
 * The edit mode it switches lives in the run store, not here: the stack pills it turns into fields are
 * in the March pane, which is the other side of the page on a desktop (`runStore.ts`, `editingCounts`).
 */
export function MarchActions() {
  const march = useMarch();
  const setup = useStore(selectActiveSetup);
  const editing = useRunStore((state) => state.editingCounts);
  const setEditing = useRunStore((state) => state.setEditingCounts);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const { snapshot, result, summary } = march;

  const saveMarch = (name: string): void => {
    if (!setup || snapshot === null || result === null || summary === null) return;
    const state = useStore.getState();
    const saved: SavedStack = {
      ...newSavedStack(name, setup, state.doc.deviceId),
      totals: {
        health: stripZeros<BonusKey>(snapshot.request.totals.health),
        strength: stripZeros<BonusKey>(snapshot.request.totals.strength),
        special: stripZeros<SpecialKey>(snapshot.request.totals.special),
      },
      counts: resultCounts(result),
      summary: toSavedSummary(summary),
      dataVersion: gameData.dataVersion,
    };
    state.addSavedStack(saved);
    setSaving(false);
  };

  const share = (): void => {
    if (!setup || result === null || summary === null) return;
    const baseUrl = typeof window === 'undefined' ? '' : window.location.href;
    void buildBattleLink(setup, resultCounts(result), toSavedSummary(summary), {
      baseUrl,
      dataVersion: gameData.dataVersion,
    })
      .then(copyText)
      .then((ok) => {
        setNotice(ok ? 'Link copied' : 'The link could not be copied');
      })
      .catch(() => {
        setNotice('The link could not be built');
      });
  };

  if (snapshot === null || result === null || summary === null) return null;

  return (
    // `nowrap`, and 4 px apart: a toolbar on a heading line that wrapped would push the title off its
    // own row. Five marks are 170 px, which the 360 dp pane has beside "12 stacks".
    <Group gap={4} wrap="nowrap">
      <MarchCountsBar
        countRows={march.rows}
        editing={editing}
        onEditing={setEditing}
        edited={march.edited}
        onUndo={() => {
          useResultStore.getState().resetCounts();
        }}
      />
      {/* Generate is the one filled control on this page (docs/design.md §1), so these are all subtle
          marks; only the edit toggle fills, and only while it is on. */}
      <MarchAction
        label="Save this march"
        icon={<BookmarkPlus size={16} aria-hidden />}
        onClick={() => {
          setSaving(true);
        }}
      />
      <MarchAction label="Share" icon={<Share2 size={16} aria-hidden />} onClick={share} />
      <Text span role="status" className={classes.meta} c="dimmed">
        {notice}
      </Text>
      {saving && (
        <LazySurface isOpen={saving}>
          <MarchNameDialog
            opened={saving}
            title="Save this march"
            description="It is kept inside the active profile, with the march it came from."
            confirmLabel="Save this march"
            initialName={`${setup?.name ?? 'March'}, ${amount(summary.avgDamage)} expected`}
            onConfirm={saveMarch}
            onCancel={() => {
              setSaving(false);
            }}
          />
        </LazySurface>
      )}
    </Group>
  );
}

/**
 * **What a hand edit did to the figures**, under them, and only while it is true (design rule 15). It
 * used to hang under the row of buttons at the foot of the page; the row is a toolbar on the heading now
 * and a sentence cannot live on a heading line, so the line moved to the one place it is about — the
 * figures it explains (`MarchSection.tsx`, part 1).
 */
export function MarchEditedNote() {
  const { edited } = useMarch();
  if (!edited) return null;
  return (
    <Text className={classes.meta} c="dimmed">
      Counts edited by hand. The figures are recomputed on them; nothing is re-sized, so the housing is yours
      to balance.
    </Text>
  );
}

/**
 * The foot of the setup column: the March's second half as one panel, in the order a player reads it
 * — what the objective bought, then what happened, then what is saved.
 *
 * It draws from the first load, before any march has been run: the saved list is where "nothing saved
 * yet" is discovered, and the other two parts take their hairline with them when they have nothing
 * to say (`kit/Sections.tsx`).
 */
export function MarchFoot() {
  return (
    <Panel
      component="section"
      id={MARCH_FOOT_ANCHOR}
      title="This march in full"
      titleId={`${MARCH_FOOT_ANCHOR}-title`}
    >
      {/* The three blocks are the *direct* children on purpose: a part that has nothing to say
          renders nothing, and takes its hairline and its 16 px with it (`kit/Sections.tsx`). A
          wrapper `<div>` would leave an empty part behind. */}
      <Sections>
        <MarchObjectives />
        <MarchDetailsFold />
        <MarchSavedFold />
      </Sections>
    </Panel>
  );
}
