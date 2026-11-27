/**
 * The Prime Arena in the calculator's frame (B-35). There is no page of its own: the arena is the second fight the
 * calculator's frame holds, and this file only fills what that frame asks for, in the places it asks for it.
 *
 * - **the setup column** (`ArenaSetup`): the calculator's own Troops card, showing its Guardsmen row on the account's
 *   own troops (one source with the calculator: a step on either page moves both), whose level fixes the pool, and its own Bonuses card, bound to the arena's squad through the same body the
 *   calculator uses (five captains, no hero, no march type, only the sources the arena counts);
 * - **the answer** (`ArenaMatch`, in the March pane's place and, below 1200 px, in the sheet the bar opens);
 * - **the bars** (`ArenaBars`): the calculator's command bar and phone bar over a frame config with the two
 *   pools the arena has, no objective, and a Generate that plans the attack.
 */
import { Stack, Text, VisuallyHidden } from '@mantine/core';
import { ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PRIME_ARENA_PERMANENT, primeArenaInputs } from '@/engine/primeArenaInputs';
import type { Pool } from '@/engine/types';
import { SOURCE_LABELS } from '@/state/defaults';
import { ARENA_MAX_ARTIFACTS, ARENA_MAX_CAPTAINS } from '@/state/schema';
import type { SetupBinding } from '@/state/setupBinding';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Glyph } from '@/ui/domain';
import { GenerateControl } from '@/ui/sections/march';
import { type BodyScope } from '@/ui/sections/bonuses/bodyScope';
import { BonusesSection } from '@/ui/sections/bonuses/BonusesSection';
import { TroopsSection } from '@/ui/sections/troops/TroopsSection';
import { barForm } from '@/ui/shell/useGenerateRun';
import { BottomBarView } from '@/ui/shell/BottomBar';
import type { BarFrame } from '@/ui/shell/barFrame';
import { poolProblem } from '@/ui/shell/command';
import { CommandBarView } from '@/ui/shell/CommandBar';
import { CommandDock } from '@/ui/shell/CommandDock';
import { MarchSheet } from '@/ui/shell/MarchSheet';
import { fabState } from '@/ui/shell/state';

import { ArenaMatch, verdictOf } from './ArenaMatch';
import { ArenaRoleSection } from './ArenaRoleSection';
import { arenaFingerprint, useArenaInputs, usePrimeArenaStore } from './primeArenaStore';

export { ArenaMatch };

/** Five captains and five artifacts take the field (the calculator's march takes three of each). */
const ARENA_CAPS = { captains: ARENA_MAX_CAPTAINS, artifacts: ARENA_MAX_ARTIFACTS } as const;

/** The two pools the arena has: authority does not exist there. */
const ARENA_POOLS: readonly Pool[] = ['leadership', 'dominance'];

/**
 * What the arena counts of the Bonuses card: captains (no hero, no march type), equipment, the permanent sources
 * it has switches for with the talents and the dragon beside them, and the artifacts fold. Titles, events, the
 * temple, VIP and the audit never count there.
 */
const ARENA_SCOPE_BASE: Omit<BodyScope, 'counting'> = {
  families: ['captains', 'equipment', 'permanent'],
  folded: ['artifacts'],
  hero: false,
  marchType: false,
  audit: false,
};

export function ArenaSetup() {
  const profile = useStore(selectActiveProfile);
  const march = useStore(selectActiveSetup);
  const inputs = useArenaInputs();
  const { toggles, setup } = inputs;
  const { setToggle, updateSetup, seedFrom } = usePrimeArenaStore();

  useEffect(() => {
    if (profile === undefined || march === undefined) return;
    seedFrom(march);
  }, [profile, march, seedFrom]);

  // The arena's rules, as the shared body's binding: its own squad, five captains.
  const binding = useMemo<SetupBinding>(
    () => ({
      setup,
      update: (edit) => {
        updateSetup(edit);
      },
      caps: ARENA_CAPS,
    }),
    [setup, updateSetup],
  );
  const scope = useMemo<BodyScope>(
    () => ({
      ...ARENA_SCOPE_BASE,
      counting: {
        builtins: PRIME_ARENA_PERMANENT,
        extras: [
          { key: 'talents', name: SOURCE_LABELS.talents },
          { key: 'dragon', name: SOURCE_LABELS.dragon },
        ],
        isOn: (key) => (key === 'dragon' ? setup.active.dragon : toggles[key as keyof typeof toggles]),
        toggle: (key, on) => {
          if (key === 'dragon') updateSetup((s) => ({ active: { ...s.active, dragon: on } }));
          else setToggle(key as keyof typeof toggles, on);
        },
      },
    }),
    [setup.active.dragon, toggles, setToggle, updateSetup],
  );
  const sources = useMemo(
    () =>
      profile === undefined ? [] : primeArenaInputs({ ...inputs, profile, troops: profile.troops }).sources,
    [inputs, profile],
  );

  return (
    <Stack gap="lg">
      {/* The Guardsmen level is the only row the arena reads: it unlocks the troops of that level and below. */}
      <ArenaRoleSection />
      <TroopsSection frame={{ rows: ['guardsmen'] }} />
      <BonusesSection frame={{ binding, scope, sources }} />
    </Stack>
  );
}

/** What the arena's Generate says it cannot do, in the calculator's own words, or `null`. */
function blockedReason(hasProfile: boolean, leadership: number, dominance: number): string | null {
  if (!hasProfile) return 'No march is selected';
  if (leadership + dominance === 0) return 'Add housing first';
  return null;
}

/** The arena's bar config: two wells, no objective, and a Generate that plans the attack. */
function useArenaBar(): { frame: BarFrame; press: () => void } {
  const profile = useStore(selectActiveProfile);
  const inputs = useArenaInputs();
  const { running, plan, planKey, updateSetup, generate } = usePrimeArenaStore();
  const { leadership, dominance } = inputs.setup.housing;
  const hint = blockedReason(profile !== undefined, leadership, dominance);
  const fingerprint = useMemo(
    () => (profile === undefined ? '' : arenaFingerprint(profile, inputs)),
    [profile, inputs],
  );

  const press = (): void => {
    if (running || hint !== null || profile === undefined) return;
    generate(profile);
  };

  const problems: Record<Pool, string | null> = {
    leadership: poolProblem('leadership', leadership),
    authority: null,
    dominance: poolProblem('dominance', dominance),
  };
  const said = ARENA_POOLS.map((pool) => problems[pool]).filter((problem) => problem !== null);
  const state = fabState({
    running,
    blocked: hint,
    hasResult: plan !== null,
    fingerprint,
    lastRunFingerprint: planKey,
  });

  const frame: BarFrame = {
    label: 'This match',
    pools: ARENA_POOLS,
    housing: inputs.setup.housing,
    problems,
    message: said.length === 0 ? null : said.join(' '),
    setPool: (pool, value) => {
      updateSetup((s) => ({ housing: { ...s.housing, [pool]: value ?? 0 } }));
    },
    objective: null,
    form: barForm(press),
    generate: (
      <GenerateControl
        size="sm"
        state={state}
        hint={hint}
        running={running}
        noun="match"
        tooltip="Plan the best attack for this match"
        onPress={press}
      />
    ),
    answer: <ArenaQuickSummary stale={state === 'stale'} />,
    answerLabel: 'Open the match',
  };
  return { frame, press };
}

/** The match in one line, for the bar below 1200 px: what happened, what survived, and the chevron that opens the sheet. */
function ArenaQuickSummary({ stale }: { stale: boolean }) {
  const plan = usePrimeArenaStore((state) => state.plan);
  if (plan === null) {
    return (
      <Text size="sm" c="dimmed">
        No match yet
      </Text>
    );
  }
  return (
    <Text component="span" size="sm" fw={700} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {stale && <Glyph kind="warning" label="Setup changed since this match" />}
      {verdictOf(plan)}
      <Text span size="xs" c="dimmed" fw={400}>
        {`· ${(plan.score.survivorShare * 50).toFixed(0)} % survive`}
      </Text>
      <ChevronUp size={16} aria-hidden style={{ flex: '0 0 auto' }} />
    </Text>
  );
}

export interface ArenaBarsProps {
  /** The March pane is beside the page (from 1200 px). */
  wide: boolean;
  /** The bar is the desktop one (from 1024 px). */
  barWide: boolean;
}

/**
 * The arena's bottom edge: the calculator's command bar (or the phone's) over the arena's frame config, and where the
 * match has no pane the sheet that holds it, which a finished plan opens by itself as a finished march does.
 */
export function ArenaBars({ wide, barWide }: ArenaBarsProps) {
  const { frame, press } = useArenaBar();
  const plan = usePrimeArenaStore((state) => state.plan);
  const [open, setOpen] = useState(false);
  const [pulse, setPulse] = useState(0);

  // `Ctrl`/`⌘ + Enter` generates from anywhere, as it does on the calculator.
  const pressRef = useRef(press);
  useEffect(() => {
    pressRef.current = press;
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Enter' || !(event.ctrlKey || event.metaKey) || event.repeat) return;
      event.preventDefault();
      pressRef.current();
    };
    globalThis.document.addEventListener('keydown', onKeyDown);
    return () => {
      globalThis.document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  // A plan that lands while the match is off screen opens the sheet, the way a finished march does. The store is
  // subscribed to rather than watched with an effect: it is an external source, and the change is a callback.
  const wideRef = useRef(wide);
  useEffect(() => {
    wideRef.current = wide;
  });
  useEffect(() => {
    let seen = usePrimeArenaStore.getState().plan;
    return usePrimeArenaStore.subscribe((state) => {
      if (state.plan === seen) return;
      seen = state.plan;
      if (state.plan === null) return;
      setPulse((count) => count + 1);
      if (!wideRef.current) setOpen(true);
    });
  }, []);

  const recap = wide ? {} : { onOpenRecap: () => setOpen(true), pulse };

  return (
    <>
      {barWide ? (
        <CommandDock>
          <CommandBarView frame={frame} {...recap} />
        </CommandDock>
      ) : (
        <BottomBarView frame={frame} onOpenRecap={() => setOpen(true)} pulse={pulse} />
      )}
      {!wide && (
        <>
          <VisuallyHidden role="status">
            {open || plan === null ? '' : `Match planned: ${verdictOf(plan)}. Open the match to read it.`}
          </VisuallyHidden>
          <MarchSheet
            opened={open}
            onClose={() => {
              setOpen(false);
            }}
            title="Match"
          >
            <ArenaMatch titled={false} />
          </MarchSheet>
        </>
      )}
    </>
  );
}
