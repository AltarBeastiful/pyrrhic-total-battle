/**
 * Bonuses (design plan §7.3, journey J3) — every health and strength source the account owns, and
 * which of them count for this march.
 *
 * The card is **one line until you open it**: the TOTAL as three labelled figures — health, strength
 * and double damage for the whole army — plus how many sources feed them and how many of those are
 * switched on with nothing typed in. That is what a player checks after changing a captain's level,
 * and it is above the fold on a phone (J3: open, find, change, see the TOTAL move).
 *
 * Unfolded, the sources are grouped the way the game groups them and each one is a **row**, not a
 * chip: a switch carrying its name, what it is worth on the right, a gear at the end. Editing never
 * happens inline — the gear opens a sheet that repeats the TOTAL, so the figures are visible while
 * they move. Whether the card is open is remembered per device (decision D7), never in the document.
 */
import { useId, useMemo, useState } from 'react';

import { artifacts as artifactTable, equipment as equipmentTable, titles as titleTable } from '@/data';
import { mintSourceId, setTitleOwned, toggleActiveSource, updateSources } from '@/state/actions/bonuses';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Card, Disclosure } from '@/ui/kit';
import { Stack } from '@/ui/layout';

import { ArtifactSheet } from './ArtifactSheet';
import { CaptainSheet } from './CaptainSheet';
import { EquipmentSheet } from './EquipmentSheet';
import { CustomSheet, DragonSheet, PermanentSheet, RemainderSheet } from './FreeFormSheets';
import { HeroSheet, VipSheet } from './OtherSheets';
import { RecoverySheet } from './RecoverySheet';
import {
  firstQuality,
  MAX_ACTIVE_ARTIFACTS,
  MAX_ACTIVE_CAPTAINS,
  SORTED_CAPTAINS,
  sourceGroups,
  starKeys,
  totalsSummary,
} from './rows';
import type { AddKind, EditorTarget } from './rows';
import { SetupBar } from './SetupBar';
import { SourceList } from './SourceList';
import { TitleSheet } from './TitleSheet';
import { TotalsBreakdown } from './TotalsBreakdown';
import { TotalsFigures } from './TotalsFigures';
import { readExpanded, writeExpanded } from './uiPrefs';

export function BonusesSection() {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const titleId = useId();
  const [expanded, setExpanded] = useState(readExpanded);
  const [editor, setEditor] = useState<EditorTarget | null>(null);

  const summary = useMemo(() => (profile && setup ? totalsSummary(profile, setup) : null), [profile, setup]);
  const groups = useMemo(() => (profile && setup ? sourceGroups(profile, setup) : []), [profile, setup]);

  if (profile === undefined || setup === undefined || summary === null) return null;
  const profileId = profile.id;

  /** Every "Add …" button creates the entry with the game's own defaults and opens its editor. */
  const add = (kind: AddKind): void => {
    if (kind === 'captain') {
      const owned = new Set(profile.sources.captains.map((entry) => entry.captainId));
      const pick = SORTED_CAPTAINS.find((record) => !owned.has(record.id));
      if (pick === undefined) return;
      const id = mintSourceId();
      updateSources(profileId, (sources) => ({
        ...sources,
        captains: [...sources.captains, { id, captainId: pick.id, level: 0, star: 0 }],
      }));
      if (setup.active.captains.length < MAX_ACTIVE_CAPTAINS) toggleActiveSource('captains', id, true);
      setEditor({ kind: 'captain', id });
      return;
    }

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

    if (kind === 'artifact') {
      const owned = new Set(profile.sources.artifacts.map((entry) => entry.artifactId));
      const pick = artifactTable.find((record) => !owned.has(record.id)) ?? artifactTable[0];
      if (pick === undefined) return;
      const id = mintSourceId();
      const star = starKeys(pick)[0] ?? '0.0';
      updateSources(profileId, (sources) => ({
        ...sources,
        artifacts: [...sources.artifacts, { id, artifactId: pick.id, level: 1, star }],
      }));
      if (setup.active.artifacts.length < MAX_ACTIVE_ARTIFACTS) toggleActiveSource('artifacts', id, true);
      setEditor({ kind: 'artifact', id });
      return;
    }

    if (kind === 'title') {
      const held = new Set(profile.sources.titles);
      const pick = titleTable.find((record) => !held.has(record.id));
      if (pick === undefined) return;
      setTitleOwned(profileId, pick.id, true);
      toggleActiveSource('titles', pick.id, true);
      setEditor({ kind: 'title', id: pick.id });
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

  return (
    <Card tone="none" shape="flat" as="section" id="bonuses" aria-labelledby={titleId}>
      <Stack gap={3}>
        <Stack gap={2}>
          <h2 id={titleId} className="text-lg">
            Bonuses
          </h2>
          <TotalsFigures summary={summary} />
        </Stack>

        <Disclosure
          title="Sources"
          summary="Switch on what counts for this march"
          isExpanded={expanded}
          onExpandedChange={(next) => {
            setExpanded(next);
            writeExpanded(next);
          }}
        >
          <Stack gap={6}>
            <SetupBar profile={profile} setup={setup} />
            {groups.map((group) => (
              <SourceList
                key={group.id}
                group={group}
                onEdit={setEditor}
                onAdd={(entry) => {
                  if (entry.add !== undefined) add(entry.add.kind);
                }}
              />
            ))}
            <TotalsBreakdown profile={profile} setup={setup} />
          </Stack>
        </Disclosure>
      </Stack>

      {editor?.kind === 'captain' && <CaptainSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'equipment' && <EquipmentSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'artifact' && <ArtifactSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'title' && (
        <TitleSheet
          {...sheet}
          titleId={editor.id}
          onRetarget={(id) => {
            setEditor({ kind: 'title', id });
          }}
        />
      )}
      {editor?.kind === 'permanent' && <PermanentSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'custom' && <CustomSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'vip' && <VipSheet {...sheet} />}
      {editor?.kind === 'hero' && <HeroSheet {...sheet} />}
      {editor?.kind === 'dragon' && <DragonSheet {...sheet} />}
      {editor?.kind === 'remainder' && <RemainderSheet {...sheet} />}
      {editor?.kind === 'recovery' && <RecoverySheet {...sheet} />}
    </Card>
  );
}
