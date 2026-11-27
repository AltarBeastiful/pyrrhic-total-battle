/**
 * Bonuses (design plan §7.3, journey J3) — every health and strength source the account owns, and
 * which of them count for this march.
 *
 * The card opens on the TOTAL — health, strength and double damage for the whole army, then how many
 * sources feed them, four labelled figures a player checks after changing a captain's level — and the
 * hero and the captains are **right under it**, with no line to press first.
 *
 * There used to be a "Sources" fold over the whole list, collapsed by default and remembered per
 * device (D7). It is gone (owner, 2026-09-19: *"the sources title and the fact it can be hidden is
 * useless. Lets just have heroes rightaway so it's clearer and more understandable in the first
 * place"*). It hid the captains, which change every fight, behind a word that named nothing a player
 * was looking for, and it cost the daily journey a tap before it began. Charter rule 4 still asks us
 * to fold what is configured once, and we still do — one fold each for artifacts and titles at the
 * foot of the list, and the audit last — but a fold over *everything* was not that rule.
 *
 * What is left is **every family on screen at once**, each a row of chips behind its name and its
 * count (owner, 2026-09-17; the canvas "Bonuses card redesign"): the hero and the captains, the
 * equipment, the permanent sources, the odds and ends, the events, the temple — the families a
 * player touches on an ordinary day, in the order they touch them. Every source is a chip —
 * TotalStack's own picker, mimicked (D-34) — tinted when it is on, its gear on its own corner, so a
 * whole family reads at a glance.
 */
import { Stack } from '@mantine/core';
import { useId, useMemo } from 'react';

import { selectActiveProfile, useStore } from '@/state/store';
import { Panel, Sections } from '@/ui/kit';

import type { ResolvedSource } from '@/engine/types';
import type { SetupBinding } from '@/state/setupBinding';

import { BonusesBody } from './BonusesBody';
import type { BodyScope } from './bodyScope';
import { totalsSummary, totalsSummaryFromSources } from './rows';
import { useActiveSetupBinding } from './SetupBindingContext';
import { SetupBar } from './SetupBar';
import { TotalsFigures } from './TotalsFigures';

/**
 * A card over another fight than the active march: the Prime Arena binds its own squad, counts fewer families and
 * resolves its sources itself (the talents come from the rank table). Everything else, the Panel, the TOTAL and the
 * body, is the calculator's; there is no setup bar, because the arena has one squad rather than named setups.
 */
export interface BonusesFrame {
  binding: SetupBinding;
  scope: BodyScope;
  /** The sources the fight counts, already resolved, for the TOTAL. */
  sources: ResolvedSource[];
}

/**
 * The calculator's card: the Panel, the TOTAL, the body (`BonusesBody`, shared with the Prime Arena page) and the
 * setup bar that closes the form.
 */
export function BonusesSection({ frame }: { frame?: BonusesFrame } = {}) {
  const profile = useStore(selectActiveProfile);
  const activeBinding = useActiveSetupBinding();
  const binding = frame?.binding ?? activeBinding;
  const setup = binding?.setup;
  const titleId = useId();
  const sources = frame?.sources;
  const summary = useMemo(
    () =>
      sources !== undefined
        ? totalsSummaryFromSources(sources)
        : profile && setup
          ? totalsSummary(profile, setup)
          : null,
    [profile, setup, sources],
  );

  if (profile === undefined || binding === null || setup === undefined || summary === null) return null;
  const captainCap = binding.caps.captains;

  return (
    <Panel
      component="section"
      id="bonuses"
      aria-labelledby={titleId}
      title="Bonuses"
      titleId={titleId}
      // What the form under it currently says, in the artboard's own words: how many captains ride
      // of the three the game allows, and how many sources feed the totals (design plan §5.5).
      meta={`Captains ${String(setup.active.captains.length)}/${String(captainCap)} · Sources on ${String(
        summary.on,
      )}`}
    >
      {/* Two parts: what the army gains, and where it comes from (`kit/Sections.tsx`). */}
      <Sections>
        <TotalsFigures summary={summary} />

        {/* One part of the card, under the TOTAL's hairline: everything a source is and does. */}
        <Stack gap="lg">
          <BonusesBody
            profile={profile}
            binding={binding}
            {...(frame === undefined ? {} : { scope: frame.scope, sources: frame.sources })}
          />
          {/* The battle setup closes the form (owner, 2026-09-17: "experiment with moving the battle
              setup at the end of the form"; it stood first, one 16 px gap over the captains, "too
              crowded"). What is on this march is chosen above; which named setup holds that choice —
              keep it, rename it, copy it — is the last thing on the card, with its own room. */}
          {frame === undefined && <SetupBar profile={profile} setup={setup} />}
        </Stack>
      </Sections>
    </Panel>
  );
}
