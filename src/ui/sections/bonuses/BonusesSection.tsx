/**
 * Bonuses (design plan §7.3, journey J3) — every health and strength source the account owns, and
 * which of them count for this march.
 *
 * The card is **one line until you open it**: the TOTAL as four labelled figures — health, strength
 * and double damage for the whole army, then how many sources feed them — plus a badge when one of
 * those is switched on with nothing typed in. That is what a player checks after changing a
 * captain's level, and it is above the fold on a phone (J3: open, find, change, see the TOTAL move).
 *
 * Unfolded, the sources are **every family on screen at once**, each a row of chips behind its
 * name and its count (owner, 2026-09-17; the canvas "Bonuses card redesign"): the hero and the
 * captains, the equipment, the permanent sources, the odds and ends, the events, the temple — the
 * families a player touches on an ordinary day, in the order they touch them. The accordion that
 * held them, one fold each with the captains alone open, hid the obvious ones and drew the rest as
 * switch rows with the gear on the far side of the card; now every source is a chip — TotalStack's
 * own picker, mimicked (D-34) — tinted when it is on, its gear on its own corner, so a whole family
 * reads at a glance. The two families set once, artifacts and titles, keep a fold each at the foot
 * of the list, remembered per device like the card itself (D7), and the audit is the last fold.
 */
import { Alert, Stack } from '@mantine/core';
import { useId, useMemo, useState } from 'react';

import { artifacts as artifactTable, equipment as equipmentTable } from '@/data';
import { mintSourceId, toggleActiveSource, updateSources } from '@/state/actions/bonuses';
import { setActiveFlag } from '@/state/actions/bonuses';
import { sourceCaveats } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Disclosure, Panel, Sections } from '@/ui/kit';

import { ArtifactChips } from './ArtifactChips';
import { CaptainChips } from './CaptainChips';
import { FamilyRow } from './FamilyRow';
import { artifactChips, captainChips, permanentChips, titleChips, type CaptainTarget } from './chips';
import { EquipmentSheet } from './EquipmentSheet';
import { CustomSheet, DragonSheet, PermanentSheet, RemainderSheet } from './FreeFormSheets';
import { VipSheet } from './OtherSheets';
import { PermanentChips } from './PermanentChips';
import { RecoverySheet } from './RecoverySheet';
import {
  captainEntryFor,
  firstQuality,
  MAX_ACTIVE_ARTIFACTS,
  MAX_ACTIVE_CAPTAINS,
  sourceGroups,
  starKeys,
  totalsSummary,
} from './rows';
import type { AddKind, EditorTarget, SourceGroup } from './rows';
import { SetupBar } from './SetupBar';
import { SourceChips } from './SourceChips';
import { TitleChips } from './TitleChips';
import { TotalsBreakdown } from './TotalsBreakdown';
import { TotalsFigures } from './TotalsFigures';
import { readExpanded, readFold, writeExpanded, writeFold, type BonusesFold } from './uiPrefs';

/**
 * The families on screen, in the order a player touches them on an ordinary day: who rides, what
 * they wear, what the account always has, what else counts, what is running, the temple. The two
 * set once come after, folded (`FOLDED`).
 */
const ORDER = ['captains', 'equipment', 'permanent', 'other', 'events', 'recovery'] as const;
const FOLDED = ['artifacts', 'titles'] as const satisfies readonly BonusesFold[];

export function BonusesSection() {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const titleId = useId();
  const [expanded, setExpanded] = useState(readExpanded);
  const [folds, setFolds] = useState<Record<BonusesFold, boolean>>(() => ({
    artifacts: readFold('artifacts'),
    titles: readFold('titles'),
  }));
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  const [refusedCaptain, setRefusedCaptain] = useState(false);
  const [refusedArtifact, setRefusedArtifact] = useState(false);

  const summary = useMemo(() => (profile && setup ? totalsSummary(profile, setup) : null), [profile, setup]);
  const groups = useMemo(
    () =>
      profile && setup
        ? new Map(sourceGroups(profile, setup).map((group) => [group.id, group]))
        : new Map<string, SourceGroup>(),
    [profile, setup],
  );
  const captains = useMemo(() => (profile && setup ? captainChips(profile, setup) : []), [profile, setup]);
  const artifacts = useMemo(() => (profile && setup ? artifactChips(profile, setup) : []), [profile, setup]);
  const permanent = useMemo(() => (profile ? permanentChips(profile) : []), [profile]);
  const titles = useMemo(() => (setup ? titleChips(setup) : []), [setup]);
  const caveats = useMemo(() => (profile && setup ? sourceCaveats(profile, setup) : []), [profile, setup]);

  if (profile === undefined || setup === undefined || summary === null) return null;
  const profileId = profile.id;

  // ---- captains ---------------------------------------------------------------------------------
  /**
   * The captain row has no Add button: the entry that records a level and a star count is minted by
   * the first tap, whether that tap enlisted the captain or opened its gear.
   */
  const captainEntryIdFor = (captainId: string): string => {
    const found = captainEntryFor(profile, captainId);
    if (found !== undefined) return found.id;
    const id = mintSourceId();
    updateSources(profileId, (sources) => ({
      ...sources,
      captains: [...sources.captains, { id, captainId, level: 0, star: 0 }],
    }));
    return id;
  };

  /** A tap on a chip body. Three ride with a march; the fourth is refused, politely. */
  const enlist = (target: CaptainTarget): void => {
    if (target.kind === 'hero') {
      setActiveFlag('hero', !setup.active.hero);
      return;
    }
    const entry = captainEntryFor(profile, target.captainId);
    const on = entry !== undefined && setup.active.captains.includes(entry.id);
    if (!on && setup.active.captains.length >= MAX_ACTIVE_CAPTAINS) {
      setRefusedCaptain(true);
      return;
    }
    setRefusedCaptain(false);
    toggleActiveSource('captains', entry?.id ?? captainEntryIdFor(target.captainId), !on);
  };

  /** A tap on a gear. It mints the entry the popover writes into and never changes who marches. */
  const configureCaptain = (target: CaptainTarget): void => {
    if (target.kind === 'captain') captainEntryIdFor(target.captainId);
  };

  // ---- artifacts --------------------------------------------------------------------------------
  const artifactEntryIdFor = (artifactId: string): string => {
    const found = profile.sources.artifacts.find((entry) => entry.artifactId === artifactId);
    if (found !== undefined) return found.id;
    const id = mintSourceId();
    const record = artifactTable.find((entry) => entry.id === artifactId);
    const star = starKeys(record)[0] ?? '0.0';
    updateSources(profileId, (sources) => ({
      ...sources,
      artifacts: [...sources.artifacts, { id, artifactId, level: 1, star }],
    }));
    return id;
  };

  const equipArtifact = (artifactId: string): void => {
    const entry = profile.sources.artifacts.find((candidate) => candidate.artifactId === artifactId);
    const on = entry !== undefined && setup.active.artifacts.includes(entry.id);
    if (!on && setup.active.artifacts.length >= MAX_ACTIVE_ARTIFACTS) {
      setRefusedArtifact(true);
      return;
    }
    setRefusedArtifact(false);
    toggleActiveSource('artifacts', entry?.id ?? artifactEntryIdFor(artifactId), !on);
  };

  // ---- the two Add buttons ----------------------------------------------------------------------
  const add = (kind: AddKind): void => {
    if (kind === 'equipment') {
      const first = equipmentTable[0];
      if (first === undefined) return;
      const id = mintSourceId();
      updateSources(profileId, (sources) => ({
        ...sources,
        equipment: [...sources.equipment, { id, equipmentId: first.id, quality: firstQuality(first) }],
      }));
      toggleActiveSource('equipment', id, true);
      setEditor({ kind: 'equipment', id });
      return;
    }

    if (kind === 'permanent') {
      const id = mintSourceId();
      updateSources(profileId, (sources) => ({
        ...sources,
        permanent: [...sources.permanent, { id, name: 'New permanent source', health: {}, strength: {} }],
      }));
      setEditor({ kind: 'permanent', id });
      return;
    }

    const id = mintSourceId();
    updateSources(profileId, (sources) => ({
      ...sources,
      custom: [...sources.custom, { id, name: 'New source', health: {}, strength: {} }],
    }));
    toggleActiveSource('custom', id, true);
    setEditor({ kind: 'custom', id });
  };

  const close = (): void => {
    setEditor(null);
  };
  const sheet = { profile, summary, onClose: close };

  const chipGroup = (id: string) => {
    const group = groups.get(id);
    if (group === undefined) return null;
    return (
      <SourceChips
        group={group}
        onEdit={setEditor}
        onAdd={(entry) => {
          if (entry.add !== undefined) add(entry.add.kind);
        }}
      />
    );
  };

  const caption = (id: string): string => groups.get(id)?.caption ?? '';

  const panels: Record<
    (typeof ORDER)[number] | (typeof FOLDED)[number],
    { title: string; summary: string; body: React.ReactNode }
  > = {
    captains: {
      title: 'Hero and captains',
      summary: `${String(setup.active.captains.length)}/${String(MAX_ACTIVE_CAPTAINS)}`,
      body: (
        <CaptainChips
          chips={captains}
          isRefused={refusedCaptain && setup.active.captains.length >= MAX_ACTIVE_CAPTAINS}
          onEnlist={enlist}
          onConfigure={configureCaptain}
        />
      ),
    },
    equipment: { title: 'Equipment', summary: caption('equipment'), body: chipGroup('equipment') },
    artifacts: {
      title: 'Artifacts',
      summary: `${String(setup.active.artifacts.length)}/${String(MAX_ACTIVE_ARTIFACTS)}`,
      body: (
        <ArtifactChips
          chips={artifacts}
          isRefused={refusedArtifact && setup.active.artifacts.length >= MAX_ACTIVE_ARTIFACTS}
          onToggle={equipArtifact}
          onConfigure={artifactEntryIdFor}
        />
      ),
    },
    titles: {
      title: 'Titles',
      summary: `${String(setup.active.titles.length)} worn`,
      body: <TitleChips profileId={profileId} families={titles} />,
    },
    permanent: {
      title: 'Permanent',
      summary: `${String(permanent.length)} always on`,
      body: (
        <PermanentChips
          chips={permanent}
          onEdit={(id) => {
            setEditor({ kind: 'permanent', id });
          }}
          onAdd={() => {
            add('permanent');
          }}
        />
      ),
    },
    other: { title: 'Other', summary: caption('other'), body: chipGroup('other') },
    events: { title: 'Events', summary: caption('events'), body: chipGroup('events') },
    recovery: { title: 'Recovery', summary: 'always on', body: chipGroup('recovery') },
  };

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

        {/*
          No summary beside the title: the TOTAL is already above it and stays there, and a second
          line saying the same thing would only be cut in half at 390 px (rule 5).
        */}
        <Disclosure
          title="Sources"
          opened={expanded}
          onChange={(next) => {
            setExpanded(next);
            writeExpanded(next);
          }}
        >
          <Stack gap="md">
            <SetupBar profile={profile} setup={setup} />
            {caveats.map((caveat) => (
              <Alert key={caveat} color="brass" variant="light">
                {caveat}
              </Alert>
            ))}
            {ORDER.map((id) => (
              <FamilyRow key={id} title={panels[id].title} count={panels[id].summary}>
                {panels[id].body}
              </FamilyRow>
            ))}
            {/* The folds share one part, as the March's do: a hairline between two collapsed rows
                is a rule between two rules. The two families set once, then the audit. */}
            <Stack gap={0}>
              {FOLDED.map((id) => (
                <Disclosure
                  key={id}
                  title={panels[id].title}
                  summary={panels[id].summary}
                  opened={folds[id]}
                  onChange={(next) => {
                    setFolds((current) => ({ ...current, [id]: next }));
                    writeFold(id, next);
                  }}
                >
                  {panels[id].body}
                </Disclosure>
              ))}
              <Disclosure title="Every key and what feeds it">
                <TotalsBreakdown profile={profile} setup={setup} />
              </Disclosure>
            </Stack>
          </Stack>
        </Disclosure>
      </Sections>

      {editor?.kind === 'equipment' && <EquipmentSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'permanent' && <PermanentSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'custom' && <CustomSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'vip' && <VipSheet {...sheet} />}
      {editor?.kind === 'dragon' && <DragonSheet {...sheet} />}
      {editor?.kind === 'remainder' && <RemainderSheet {...sheet} />}
      {editor?.kind === 'recovery' && <RecoverySheet {...sheet} />}
    </Panel>
  );
}
