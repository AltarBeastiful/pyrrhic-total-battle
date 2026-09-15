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
import { Alert, Group, Stack, Text, Title, VisuallyHidden } from '@mantine/core';
import { useId, useState } from 'react';

import type { Pool, UnitDef } from '@/engine/types';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Sections } from '@/ui/kit';
import { useResultStore } from '@/ui/resultStore';
import { MARCH_ANCHOR } from '@/ui/shell/march';
import { TWO_PANES, useMediaQuery } from '@/ui/shell/useMediaQuery';

import { PlanFold, PlanSizing } from './PlanPanel';
import { amount } from './format';
import { MarchActions, MarchDetailsFold, MarchObjectives, MarchSavedFold } from './MarchFoot';
import { MarchGenerateButton } from './MarchGenerateButton';
import { MarchLeftOut, MarchPills } from './MarchPills';
import { MarchRecap } from './MarchRecap';
import { useRunStore } from './runStore';
import { UnitSheet } from './UnitSheet';
import { useMarch } from './useMarch';
import classes from './march.module.css';

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'leadership',
  authority: 'authority',
  dominance: 'dominance',
};

export function MarchSection() {
  const march = useMarch();
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  // The recap travels with Generate: in the pane's header on a desktop, here on one column.
  const twoPanes = useMediaQuery(TWO_PANES);

  const [sheetUnit, setSheetUnit] = useState<UnitDef | null>(null);
  // The counts' edit mode lives in the run store: the row that switches it is on the other side of the
  // page from the pills it turns into fields (`MarchFoot.tsx`, `runStore.ts`).
  const editing = useRunStore((state) => state.editingCounts);
  const titleId = useId();

  const { snapshot, result, summary } = march;

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
        the *pane* is the sticky element (`shell/MarchPane.tsx`) — while the March fits the window,
        which is what keeps the pane from ever taking a scroll of its own (design rule 17) — because
        a block pinned inside the column is a block the rest of the column scrolls behind.
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
        {/* Under the figures, and only after a complete optimization: the sizing the plan chose, which
            is the one thing about this answer the player did not decide themselves (S-55). */}
        <PlanSizing />
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

      {/* 4 — the things a player does with a whole march: copy the counts, edit them, keep it, send
          it. One part, because they are one kind of thing. **In the sheet only** (owner, 2026-09-15):
          on a desktop they are the foot of the setup column instead (`MarchFoot.tsx`), because the
          pane has to stay shorter than the column it sits beside for it to stick. */}
      {!twoPanes && <MarchActions />}

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

      {/* 6 — what the objective bought. The sheet's only: on a desktop it is the first block of the
          setup column's foot (`MarchFoot.tsx`), out of the 280 px the pane cannot spare. */}
      {!twoPanes && <MarchObjectives />}

      {/* 7 — everything that is folded away. The folds share one part: a hairline between two
          collapsed rows is a rule between two rules. The plan comes first of them — it explains the
          answer, where the other two are reference (S-55). */}
      <Stack gap={0}>
        <PlanFold />
        {/* The two reference folds are the sheet's as well: the plan's own assessment stays with the
            answer in the pane, and these two go down the column with everything else that explains
            rather than answers (owner, 2026-09-15). */}
        {!twoPanes && <MarchDetailsFold />}
        {!twoPanes && <MarchSavedFold />}
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
            useRunStore.getState().setEditingCounts(true);
          }}
        />
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
