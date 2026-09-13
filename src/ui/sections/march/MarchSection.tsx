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
import { Alert, Badge, Button, Group, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { Share2 } from 'lucide-react';
import { lazy, useId, useState } from 'react';

import { version as gameData } from '@/data';
import type { BonusKey, Pool, SpecialKey, UnitDef } from '@/engine/types';
import { buildBattleLink } from '@/share/codec';
import { newSavedStack } from '@/state/defaults';
import type { SavedStack } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Disclosure } from '@/ui/kit';
import { LazySurface } from '@/ui/lazy';
import { copyText } from '@/ui/profile/download';
import { resultCounts, toSavedSummary, useResultStore } from '@/ui/resultStore';
import { MARCH_ANCHOR } from '@/ui/shell/march';
import classes from './march.module.css';
import { TWO_PANES, useMediaQuery } from '@/ui/shell/useMediaQuery';

import { amount } from './format';
import { MarchGenerateButton } from './MarchGenerateButton';
import { MarchCountsBar, MarchPills } from './MarchPills';
import { MarchRecap } from './MarchRecap';
import { useRunStore } from './runStore';
import { TradeoffStrip } from './TradeoffStrip';
import { UnitSheet } from './UnitSheet';
import { unitName } from './units';
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
    <Stack
      component="section"
      id={MARCH_ANCHOR}
      // In the sheet the sheet's own header is the heading, so the section takes its name from a
      // label instead of writing "March" on the screen a second time (design rule 5).
      {...(twoPanes ? { 'aria-labelledby': titleId } : { 'aria-label': 'March' })}
      gap="md"
    >
      <VisuallyHidden aria-live="polite">{announcement}</VisuallyHidden>

      {/*
        The answer, and then the army. Nothing in here sticks on its own any more (owner,
        2026-09-13): on a desktop the *pane* is the sticky element (`shell/MarchPane.tsx`), because a
        block pinned inside the column is a block the rest of the column scrolls behind.
      */}
      <div>
        <Stack gap="md">
          <Group justify="space-between" gap="xs">
            <Group gap="xs">
              {twoPanes && (
                <Title order={2} id={titleId}>
                  March
                </Title>
              )}
              {result !== null && (
                <Badge variant="light" color="gray" tt="none">
                  {`${String(result.stacks.length)} stacks`}
                </Badge>
              )}
            </Group>
          </Group>

          <MarchRecap />
          {/* Generate is the command bar's on a desktop and nowhere else (design plan §5.6): the
              pane would be saying the same thing twice, 200 px above the bar that says it. In the
              sheet it stays, because the sheet is a focus trap over the bar and the answer and the
              action travel together (design rule 2). */}
          {!twoPanes && <MarchGenerateButton fullWidth />}

          {snapshot !== null && result !== null && summary !== null && (
            /* The army steps back with the figures while the setup has moved under it
               (`march.module.css`, `.outOfDate`): the whole answer dims together or none of it. */
            <div data-stale={String(march.stale)} className={march.stale ? classes.outOfDate : undefined}>
              <MarchPills
                rows={march.pools}
                leftOut={march.leftOut}
                editing={editing}
                onCount={(unitId, count) => {
                  useResultStore.getState().editCount(unitId, count);
                }}
                onDetails={setSheetUnit}
              />
            </div>
          )}
        </Stack>
      </div>

      {snapshot !== null && result !== null && summary !== null && (
        <>
          <MarchCountsBar
            countRows={march.rows}
            editing={editing}
            onEditing={setEditing}
            edited={march.edited}
            onUndo={() => {
              useResultStore.getState().resetCounts();
            }}
          />

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
          {march.keptElsewhere.length > 0 && (
            <Alert color="brass" title="Kept in, but not marching">
              {`${march.keptElsewhere
                .map((unitId) => unitName(unitId, snapshot.request.units))
                .join(', ')} stayed out of this march even though you keep ${
                march.keptElsewhere.length === 1 ? 'it' : 'them'
              } in. Check that the tier is still switched on, and that the capacity paying for ${
                march.keptElsewhere.length === 1 ? 'it' : 'them'
              } is not zero.`}
            </Alert>
          )}

          {march.edited && (
            <Text size="xs" c="dimmed">
              Counts edited by hand. The figures above are recomputed on them; nothing is re-sized, so the
              housing is yours to balance.
            </Text>
          )}

          {tradeoff !== null && tradeoff.excludedUnitIds.length > 0 && <TradeoffStrip tradeoff={tradeoff} />}

          <Disclosure
            title="Details"
            summary="The battle story and the HP profile"
            opened={detailsOpen}
            onChange={setDetailsOpen}
          >
            <LazySurface isOpen={detailsOpen} reserve="panel">
              <Stack gap="md">
                <BattleStory request={snapshot.request} summary={summary} />
                <HpProfile stacks={result.stacks} units={snapshot.request.units} kept={march.pinned} />
              </Stack>
            </LazySurface>
          </Disclosure>

          <Group gap="xs">
            {/* Generate is the one filled control on this page (docs/design.md §1). */}
            <Button
              variant="default"
              onClick={() => {
                setSaving(true);
              }}
            >
              Save this march
            </Button>
            <Button variant="default" leftSection={<Share2 size={14} aria-hidden />} onClick={share}>
              Share
            </Button>
            <Text span role="status" size="xs" c="dimmed">
              {notice}
            </Text>
          </Group>

          <UnitSheet
            unit={sheetUnit}
            row={march.rows.find((row) => row.unit.id === sheetUnit?.id)}
            totalDamage={summary.journals.enemyFirst.totalDamage}
            pinned={sheetUnit !== null && march.pinned.includes(sheetUnit.id)}
            onClose={() => {
              setSheetUnit(null);
            }}
            onEditCount={() => {
              setEditing(true);
            }}
          />

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
        </>
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
  );
}
