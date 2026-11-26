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

import { BonusesBody } from './BonusesBody';
import { MAX_ACTIVE_CAPTAINS, totalsSummary } from './rows';
import { useActiveSetupBinding } from './SetupBindingContext';
import { SetupBar } from './SetupBar';
import { TotalsFigures } from './TotalsFigures';

/**
 * The calculator's card: the Panel, the TOTAL, the body (`BonusesBody`, shared with the Prime Arena page) and the
 * setup bar that closes the form.
 */
export function BonusesSection() {
  const profile = useStore(selectActiveProfile);
  const binding = useActiveSetupBinding();
  const setup = binding?.setup;
  const titleId = useId();
  const summary = useMemo(() => (profile && setup ? totalsSummary(profile, setup) : null), [profile, setup]);

  if (profile === undefined || binding === null || setup === undefined || summary === null) return null;

  return (
    <Panel
      component="section"
      id="bonuses"
      aria-labelledby={titleId}
      title="Bonuses"
      titleId={titleId}
      // What the form under it currently says, in the artboard's own words: how many captains ride
      // of the three the game allows, and how many sources feed the totals (design plan §5.5).
      meta={`Captains ${String(setup.active.captains.length)}/${String(
        MAX_ACTIVE_CAPTAINS,
      )} · Sources on ${String(summary.on)}`}
    >
      {/* Two parts: what the army gains, and where it comes from (`kit/Sections.tsx`). */}
      <Sections>
        <TotalsFigures summary={summary} />

        {/* One part of the card, under the TOTAL's hairline: everything a source is and does. */}
        <Stack gap="lg">
          <BonusesBody profile={profile} binding={binding} />
          {/* The battle setup closes the form (owner, 2026-09-17: "experiment with moving the battle
              setup at the end of the form"; it stood first, one 16 px gap over the captains, "too
              crowded"). What is on this march is chosen above; which named setup holds that choice —
              keep it, rename it, copy it — is the last thing on the card, with its own room. */}
          <SetupBar profile={profile} setup={setup} />
        </Stack>
      </Sections>
    </Panel>
  );
}
