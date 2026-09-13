/**
 * The March (design plan §7.5, design rule 28): the answer, then the army, then the counts, then
 * everything that explains them.
 *
 * The order is the order a player reads in — the figures they compare marches by first, the army as
 * tiles they change with one tap second, the counts they retype into the game third. What is left —
 * what a priority search gave up, the battle story, the HP profile — sits under it, folded.
 *
 * The section is the answer *and* the controls that shape it: leaving a type out, keeping one in,
 * editing a count by hand. Every one of them re-sizes the march, because numbers on screen must
 * always answer the question that is in the form.
 *
 * On a desktop Generate is not here: it is in the command bar on the bottom edge, with the housing
 * and the objective (design plan §5.6, design rule 5 — never say the same thing twice on one
 * screen). In the phone's sheet it stays, under the recap.
 *
 * Below 1200 px this whole section **is** the recap sheet the bottom bar opens (design rule 5 as
 * resolved on 2026-09-13): it is not drawn in the page a second time, so the answer is written once
 * and the page never has to travel to it.
 */
import { Alert, Button, Group, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { Share2 } from 'lucide-react';
import { lazy, useId, useState } from 'react';

import { version as gameData } from '@/data';
import type { BonusKey, Pool, SpecialKey, UnitDef } from '@/engine/types';
import { buildBattleLink } from '@/share/codec';
import { newSavedStack } from '@/state/defaults';
import type { SavedStack } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Disclosure, Sections } from '@/ui/kit';
import { LazySurface } from '@/ui/lazy';
import { copyText } from '@/ui/profile/download';
import { resultCounts, toSavedSummary, useResultStore } from '@/ui/resultStore';
import { MARCH_ANCHOR } from '@/ui/shell/march';
import classes from './march.module.css';
import { TWO_PANES, useMediaQuery } from '@/ui/shell/useMediaQuery';

import { CampaignFold, CampaignSizing } from './CampaignPanel';
import { amount } from './format';
import { MarchGenerateButton } from './MarchGenerateButton';
import { MarchCountsBar, MarchLeftOut, MarchPills } from './MarchPills';
import { MarchRecap } from './MarchRecap';
import { useRunStore } from './runStore';
import { TradeoffStrip } from './TradeoffStrip';
import { UnitSheet } from './UnitSheet';
import { useMarch } from './useMarch';

// Four surfaces nobody sees until they ask for them, each heavy in its own way: the journal, the HP
// chart, the saved marches and the dialog that names one (ui-foundation plan §6). Saving a march
// and opening the list share one fetch.
const BattleStory = lazy(() => import('./BattleStory').then((module) => ({ default: module.BattleStory })));
const HpProfile = lazy(() => import('./HpProfile').then((module) => ({ default: module.HpProfile })));
const SavedMarchesPanel = lazy(() =>
  import('./SavedMarches').then((module) => ({ default: module.SavedMarchesPanel })),
);
const MarchNameDialog = lazy(() =>
  import('./SavedMarches').then((module) => ({ default: module.MarchNameDialog })),
);

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'leadership',
  authority: 'authority',
  dominance: 'dominance',
};

/** Saved marches keep the aggregated bonus maps; the zeroes would triple the stored document. */
function stripZeros<K extends string>(map: Record<K, number>): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const [key, value] of Object.entries(map) as [K, number][]) {
    if (value !== 0) out[key] = value;
  }
  return out;
}

export function MarchSection() {
  const march = useMarch();
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const tradeoff = useRunStore((state) => state.tradeoff);
  // The recap travels with Generate: in the pane's header on a desktop, here on one column.
  const twoPanes = useMediaQuery(TWO_PANES);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetUnit, setSheetUnit] = useState<UnitDef | null>(null);
  const [notice, setNotice] = useState('');
  // The folded surfaces are controlled, because what is inside them is only fetched on first open.
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const titleId = useId();

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

  // A result that belongs to another profile or another march entirely — a different fact from
  // "the setup moved", which the recap says in one line of its own now (owner, 2026-09-13: the
  // "Possibly stale" alert that used to sit here said the same thing in a bigger box, design
  // rule 5).
  const otherMarch =
    snapshot !== null &&
    profile !== undefined &&
    setup !== undefined &&
    (snapshot.profileId !== profile.id || snapshot.setupId !== setup.id);

  const announcement =
    snapshot === null || summary === null || result === null
      ? ''
      : `March generated: ${amount(result.stacks.length)} stacks, ${amount(summary.avgDamage)} expected damage.`;

  return (
    // No ground of its own at either width (M-09 polish list, spike 0009's `v1-desktop.jpg`): the
    // March pane is one surface and the recap sheet is another, and a card inside either of them
    // would be a card inside a card.
    //
    // **The pane is parts, and the parts are told apart by one hairline with 16 px above and below**
    // (the owner's review of 2026-09-13: "the battle summary is crammed and misses clear
    // separation"). `Sections` is the one place that draws that (`kit/Sections.tsx`,
    // `docs/design.md` §4); every direct child below is a part, and a part that is not on screen
    // takes its line with it. The spacing contract's four — recap · pools and pills · left out ·
    // actions — are the first four, and everything the March has that the artboard does not follows
    // in the same rhythm rather than in a rhythm of its own.
    <Sections
      component="section"
      id={MARCH_ANCHOR}
      // In the sheet the sheet's own header is the heading, so the section takes its name from a
      // label instead of writing "March" on the screen a second time (design rule 5).
      {...(twoPanes ? { 'aria-labelledby': titleId } : { 'aria-label': 'March' })}
    >
      {/*
        1 — the answer. Nothing in here sticks on its own any more (owner, 2026-09-13): on a desktop
        the *pane* is the sticky element (`shell/MarchPane.tsx`), because a block pinned inside the
        column is a block the rest of the column scrolls behind.
      */}
      <Stack gap="md">
        {/* Inside the part rather than beside it: `Sections` gives every *direct* child a hairline
            and 16 px, and a visually hidden live region is a child with no height — one that would
            take the "first part" exemption with it and put a rule above the recap. */}
        <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>

        {(twoPanes || result !== null) && (
          <Group justify="space-between" wrap="nowrap" gap="sm">
            {twoPanes ? (
              <Title order={2} id={titleId}>
                March
              </Title>
            ) : (
              <span />
            )}
            {/* The stack count is the card's meta, in the one shape every card's meta has: 12 px
                muted, right-aligned beside the title (docs/design.md §4). It was a badge, which is
                a box inside a box for a two-word summary. */}
            {result !== null && (
              <Text span className={classes.meta} c="dimmed">
                {`${String(result.stacks.length)} stacks`}
              </Text>
            )}
          </Group>
        )}

        <MarchRecap />
        {/* Under the figures, and only after a complete optimization: the sizing the search chose,
            which is the one thing about this answer the player did not decide themselves (S-54). */}
        <CampaignSizing />
        {/* Generate is the command bar's on a desktop and nowhere else (design plan §5.6): the
            pane would be saying the same thing twice, 200 px above the bar that says it. In the
            sheet it stays, because the sheet is a focus trap over the bar and the answer and the
            action travel together (design rule 2). */}
        {!twoPanes && <MarchGenerateButton fullWidth />}
      </Stack>

      {/* 2 — the pools and the stacks they paid for. The army steps back with the figures while the
          setup has moved under it (`march.module.css`, `.outOfDate`): the whole answer dims together
          or none of it. */}
      {snapshot !== null && result !== null && summary !== null && (
        <div data-stale={String(march.stale)} className={march.stale ? classes.outOfDate : undefined}>
          <MarchPills
            rows={march.pools}
            editing={editing}
            onCount={(unitId, count) => {
              useResultStore.getState().editCount(unitId, count);
            }}
            onDetails={setSheetUnit}
          />
        </div>
      )}

      {/* 3 — what this march leaves at home. */}
      {snapshot !== null && march.leftOut.length > 0 && <MarchLeftOut leftOut={march.leftOut} />}

      {/* 4 — the things a player does with a whole march: copy the counts, edit them, keep it,
          send it. One part, because they are one kind of thing (the save and share row used to sit
          four hairlines further down, under the folds). */}
      {snapshot !== null && result !== null && summary !== null && (
        <Stack gap="sm">
          <Group gap="sm" wrap="wrap">
            <MarchCountsBar
              countRows={march.rows}
              editing={editing}
              onEditing={setEditing}
              edited={march.edited}
              onUndo={() => {
                useResultStore.getState().resetCounts();
              }}
            />
            {/* Generate is the one filled control on this page (docs/design.md §1). */}
            <Button
              size="compact-sm"
              variant="default"
              onClick={() => {
                setSaving(true);
              }}
            >
              Save this march
            </Button>
            <Button
              size="compact-sm"
              variant="default"
              leftSection={<Share2 size={14} aria-hidden />}
              onClick={share}
            >
              Share
            </Button>
            <Text span role="status" className={classes.meta} c="dimmed">
              {notice}
            </Text>
          </Group>
          {march.edited && (
            <Text className={classes.meta} c="dimmed">
              Counts edited by hand. The figures above are recomputed on them; nothing is re-sized, so the
              housing is yours to balance.
            </Text>
          )}
        </Stack>
      )}

      {/* 5 — anything worth a look about this particular march. Alerts are the one tinted block the
          design still allows (docs/design.md §2), and they are gathered into one part so they never
          stripe the pane. */}
      {snapshot !== null && result !== null && notices(march, result, otherMarch) && (
        <Stack gap="sm">
          {otherMarch && (
            <Alert color="brass" title="Another march">
              This result was generated for another profile or march. Generate again to refresh it.
            </Alert>
          )}
          {march.overflow.length > 0 && (
            <Alert color="red" title="Over capacity">
              {`Over capacity in ${march.overflow
                .map((pool) => POOL_LABELS[pool])
                .join(', ')}. The game will refuse a march that does not fit.`}
            </Alert>
          )}
          {/* One alert, not one per line: four stacked blocks pushed the army off the screen, and
              every one of them said the same word. */}
          {result.warnings.length > 0 && (
            <Alert color="brass" title="Worth a look">
              <Stack component="ul" gap={2} m={0} pl="md">
                {result.warnings.map((warning) => (
                  <Text component="li" key={warning} size="sm">
                    {warning}
                  </Text>
                ))}
              </Stack>
            </Alert>
          )}
        </Stack>
      )}

      {/* 6 — what the objective bought, in the three shapes investigation 0013 §5 asks for. */}
      {snapshot !== null && tradeoff !== null && <TradeoffStrip tradeoff={tradeoff} />}

      {/* 7 — everything that is folded away. The folds share one part: a hairline between two
          collapsed rows is a rule between two rules. The campaign comes first of them — it explains
          the answer, where the other two are reference (S-54). */}
      <Stack gap={0}>
        <CampaignFold />
        {snapshot !== null && result !== null && summary !== null && (
          <Disclosure
            title="Details"
            summary="The battle story and the HP profile"
            opened={detailsOpen}
            onChange={setDetailsOpen}
          >
            <LazySurface isOpen={detailsOpen} reserve="panel">
              <Stack gap="md">
                <BattleStory request={snapshot.request} summary={summary} />
                <HpProfile stacks={result.stacks} units={snapshot.request.units} />
              </Stack>
            </LazySurface>
          </Disclosure>
        )}
        {profile !== undefined && (
          <Disclosure
            title="Saved marches"
            summary={
              profile.savedStacks.length === 0
                ? 'Nothing saved yet'
                : `${amount(profile.savedStacks.length)} saved`
            }
            opened={savedOpen}
            onChange={setSavedOpen}
          >
            <LazySurface isOpen={savedOpen} reserve="panel">
              <SavedMarchesPanel profile={profile} />
            </LazySurface>
          </Disclosure>
        )}
      </Stack>

      {/* Neither of these draws anything in the flow: they are the two surfaces the March raises. */}
      {snapshot !== null && result !== null && summary !== null && (
        <UnitSheet
          unit={sheetUnit}
          row={march.rows.find((row) => row.unit.id === sheetUnit?.id)}
          totalDamage={summary.journals.enemyFirst.totalDamage}
          onClose={() => {
            setSheetUnit(null);
          }}
          onEditCount={() => {
            setEditing(true);
          }}
        />
      )}
      {saving && summary !== null && (
        <LazySurface isOpen={saving}>
          <MarchNameDialog
            opened={saving}
            title="Save this march"
            description="It is kept inside the active profile, with the march it came from."
            confirmLabel="Save this march"
            initialName={`${setup?.name ?? 'March'} — ${amount(summary.avgDamage)} expected`}
            onConfirm={saveMarch}
            onCancel={() => {
              setSaving(false);
            }}
          />
        </LazySurface>
      )}
    </Sections>
  );
}

/** Whether part 5 has anything in it; an empty part would still draw its hairline. */
function notices(
  march: ReturnType<typeof useMarch>,
  result: { warnings: string[] },
  otherMarch: boolean,
): boolean {
  return otherMarch || march.overflow.length > 0 || result.warnings.length > 0;
}
