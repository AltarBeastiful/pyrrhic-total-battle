/**
 * The body of the Bonuses card: the caveats, every family of sources as chips, the two folds at the foot and the
 * Summary, with the editors they open. It reads one account and one battle setup, handed in, and writes
 * through the same store actions the card always used. The wrapper (`BonusesSection`) owns the Panel, the
 * TOTAL figures and the setup bar.
 */
import { Alert, Stack } from '@mantine/core';
import { useMemo, useRef, useState } from 'react';

import { equipment as equipmentTable } from '@/data';
import type { ResolvedSource } from '@/engine/types';
import { mintSourceId, setActiveFlag, toggleActiveSource, updateSources } from '@/state/actions/bonuses';
import { sourceCaveats } from '@/state/derive';
import type { Profile } from '@/state/schema';
import type { SetupBinding } from '@/state/setupBinding';
import { Disclosure } from '@/ui/kit';

import { ArtifactChips } from './ArtifactChips';
import { CAPTAIN_CAP_MESSAGE, CaptainChips } from './CaptainChips';
import { FamilyRow } from './FamilyRow';
import { artifactChips, captainChips, permanentChips, titleChips, type CaptainTarget } from './chips';
import { EquipmentSets, SlotCounter } from './EquipmentSets';
import { layoutOf } from './equipmentSets';
import { EquipmentSheet } from './EquipmentSheet';
import { CustomSheet, DragonSheet, PermanentSheet } from './FreeFormSheets';
import { selectsRestrictedCaptain } from './marchType';
import { VipSheet } from './OtherSheets';
import { PermanentChips } from './PermanentChips';
import { RecoverySheet } from './RecoverySheet';
import {
  captainEntryFor,
  firstQuality,
  MAX_ACTIVE_CAPTAINS,
  MAX_EQUIPMENT,
  sourceGroups,
  totalsSummary,
} from './rows';
import type { AddKind, EditorTarget, SourceGroup } from './rows';
import { SetupBindingProvider } from './SetupBindingContext';
import { SourceChips } from './SourceChips';
import { TitleChips } from './TitleChips';
import { TotalsBreakdown } from './TotalsBreakdown';
import { readFold, writeFold, type BonusesFold } from './uiPrefs';
import { type FOLDED, FULL_SCOPE, type ORDER, type BodyScope } from './bodyScope';

const NUMBER_WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

/** The line under the captains when the cap is reached; the calculator's own words for its three. */
function captainRefusal(cap: number): string {
  return cap === MAX_ACTIVE_CAPTAINS
    ? CAPTAIN_CAP_MESSAGE
    : `${NUMBER_WORDS[cap] ?? String(cap)} captains at most take the field. Take one out first.`;
}

export interface BonusesBodyProps {
  profile: Profile;
  binding: SetupBinding;
  scope?: BodyScope;
  /**
   * The sources another fight counts, already resolved (the Prime Arena): the Summary fold reads these, and is
   * drawn even where the scope leaves the calculator's audit out.
   */
  sources?: ResolvedSource[];
}

export function BonusesBody({ profile, binding, scope = FULL_SCOPE, sources }: BonusesBodyProps) {
  const { setup, caps } = binding;
  const maxCaptains = caps.captains;
  const maxArtifacts = caps.artifacts;
  // B-16: a foot fold opens on load when the device left it open or when something in it is on.
  // Resolved once per loaded profile (the document can arrive after the first render), then the
  // hand owns it for the session. The device memory is `uiPrefs`, never the document (rule 4).
  const [folds, setFolds] = useState<Record<BonusesFold, boolean>>({ artifacts: false, titles: false });
  const [resolvedFor, setResolvedFor] = useState<string | null>(null);
  if (resolvedFor !== profile.id) {
    setResolvedFor(profile.id);
    setFolds({
      artifacts: readFold('artifacts') || setup.active.artifacts.length > 0,
      titles: readFold('titles') || setup.active.titles.length > 0,
    });
  }
  const [editor, setEditor] = useState<EditorTarget | null>(null);
  // The set the last piece went into stays chosen for the next Add (B-19: three pieces, three quick adds).
  const lastSet = useRef<string | undefined>(undefined);
  const [refusedCaptain, setRefusedCaptain] = useState(false);
  const [refusedArtifact, setRefusedArtifact] = useState(false);

  const summary = useMemo(() => totalsSummary(profile, setup), [profile, setup]);
  const groups = useMemo(
    () => new Map<string, SourceGroup>(sourceGroups(profile, setup).map((group) => [group.id, group])),
    [profile, setup],
  );
  const captains = useMemo(
    () => captainChips(profile, setup).filter((chip) => scope.hero || chip.target.kind !== 'hero'),
    [profile, setup, scope.hero],
  );
  const artifacts = useMemo(() => artifactChips(profile, setup), [profile, setup]);
  const permanent = useMemo(() => permanentChips(profile), [profile]);
  const titles = useMemo(() => titleChips(setup), [setup]);
  const caveats = useMemo(() => sourceCaveats(profile, setup), [profile, setup]);
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

  /** A tap on a chip body. Up to the cap ride; the next is refused, politely. */
  const enlist = (target: CaptainTarget): void => {
    if (target.kind === 'hero') {
      setActiveFlag(binding, 'hero', !setup.active.hero);
      return;
    }
    const entry = captainEntryFor(profile, target.captainId);
    const on = entry !== undefined && setup.active.captains.includes(entry.id);
    if (!on && setup.active.captains.length >= maxCaptains) {
      setRefusedCaptain(true);
      return;
    }
    setRefusedCaptain(false);
    toggleActiveSource(binding, 'captains', entry?.id ?? captainEntryIdFor(target.captainId), !on);
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
    // The bottom of the game's ladders, level 1 and star 0.1: the player raises it from there.
    updateSources(profileId, (sources) => ({
      ...sources,
      artifacts: [...sources.artifacts, { id, artifactId, level: 1, star: '0.1' }],
    }));
    return id;
  };

  const equipArtifact = (artifactId: string): void => {
    const entry = profile.sources.artifacts.find((candidate) => candidate.artifactId === artifactId);
    const on = entry !== undefined && setup.active.artifacts.includes(entry.id);
    if (!on && setup.active.artifacts.length >= maxArtifacts) {
      setRefusedArtifact(true);
      return;
    }
    setRefusedArtifact(false);
    toggleActiveSource(binding, 'artifacts', entry?.id ?? artifactEntryIdFor(artifactId), !on);
  };

  // ---- the two Add buttons ----------------------------------------------------------------------
  const add = (kind: AddKind): void => {
    if (kind === 'equipment') {
      const first = equipmentTable[0];
      if (first === undefined) return;
      const id = mintSourceId();
      updateSources(profileId, (sources) => ({
        ...sources,
        equipment: [
          ...sources.equipment,
          {
            id,
            equipmentId: first.id,
            quality: firstQuality(first),
            ...(lastSet.current !== undefined &&
            sources.equipment.some((piece) => piece.setId === lastSet.current)
              ? { setId: lastSet.current }
              : {}),
          },
        ],
      }));
      toggleActiveSource(binding, 'equipment', id, true);
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
    toggleActiveSource(binding, 'custom', id, true);
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
    { title: string; summary: React.ReactNode; action?: React.ReactNode; body: React.ReactNode }
  > = {
    captains: {
      title: 'Hero and captains',
      action: scope.captains?.action,
      summary: `${String(setup.active.captains.length)}/${String(maxCaptains)}`,
      body: (
        <CaptainChips
          chips={captains}
          isRefused={refusedCaptain && setup.active.captains.length >= maxCaptains}
          refusal={captainRefusal(maxCaptains)}
          {...(scope.captains === undefined ? {} : { shining: scope.captains.shining })}
          onEnlist={enlist}
          onConfigure={configureCaptain}
          marchType={setup.marchType}
          onMarchType={(marchType) => {
            binding.update(() => ({ marchType }));
          }}
          // The control is drawn only when it can change a reading: a restricted captain (Amanitore, Hercules)
          // is selected on this march. Owning one on the bench reads the same, so it would only take space.
          showMarchType={scope.marchType && selectsRestrictedCaptain(profile, setup)}
        />
      ),
    },
    equipment: {
      title: 'Equipment',
      summary: <SlotCounter worn={setup.active.equipment.length} captains={setup.active.captains.length} />,
      body: (
        <EquipmentSets
          profile={profile}
          setup={setup}
          onEdit={setEditor}
          onAdd={() => {
            add('equipment');
          }}
          addDisabled={profile.sources.equipment.length >= (caps.equipment ?? MAX_EQUIPMENT)}
        />
      ),
    },
    artifacts: {
      title: 'Artifacts',
      summary: `${String(setup.active.artifacts.length)}/${String(maxArtifacts)}`,
      body: (
        <ArtifactChips
          chips={artifacts}
          isRefused={refusedArtifact && setup.active.artifacts.length >= maxArtifacts}
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
      // What is recorded of what is listed: an always-on source with nothing in it is off to the TOTAL.
      summary:
        scope.counting === undefined
          ? `${String(permanent.filter((chip) => chip.value !== '').length)} of ${String(
              permanent.length,
            )} set, always on`
          : `${String(
              [...scope.counting.builtins, ...scope.counting.extras.map((extra) => extra.key)].filter((key) =>
                scope.counting?.isOn(key),
              ).length,
            )} counted`,
      body: (
        <PermanentChips
          chips={permanent}
          onEdit={(id) => {
            setEditor({ kind: 'permanent', id });
          }}
          onAdd={() => {
            add('permanent');
          }}
          {...(scope.counting === undefined ? {} : { counting: scope.counting })}
        />
      ),
    },
    other: { title: 'Other', summary: caption('other'), body: chipGroup('other') },
    events: { title: 'Events', summary: caption('events'), body: chipGroup('events') },
    recovery: { title: 'Recovery', summary: caption('recovery'), body: chipGroup('recovery') },
  };

  return (
    <SetupBindingProvider value={binding}>
      {scope.audit &&
        caveats.map((caveat) => (
          <Alert key={caveat} color="brass" variant="light">
            {caveat}
          </Alert>
        ))}
      <Stack gap="md">
        {scope.families.map((id) => (
          <FamilyRow key={id} title={panels[id].title} count={panels[id].summary} action={panels[id].action}>
            {panels[id].body}
          </FamilyRow>
        ))}
      </Stack>
      {/* The folds share one part, as the March's do: a hairline between two collapsed rows
          is a rule between two rules. The two families set once, then the audit. */}
      <Stack gap={0}>
        {scope.folded.map((id) => (
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
        {/* Renamed from "Every key and what feeds it" (owner, 2026-09-28: *"this section should be
            renamed Summary"*): it already recaps the hero and the captains under every key they
            feed, so the name says what the block is rather than what it contains. */}
        {(scope.audit || sources !== undefined) && (
          <Disclosure title="Summary">
            <TotalsBreakdown {...(sources === undefined ? { profile, setup } : { sources })} />
          </Disclosure>
        )}
      </Stack>
      {editor?.kind === 'equipment' && (
        <EquipmentSheet
          {...sheet}
          entryId={editor.id}
          sets={layoutOf(profile, setup).sets}
          onSetChosen={(setId) => {
            lastSet.current = setId;
          }}
        />
      )}
      {editor?.kind === 'permanent' && <PermanentSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'custom' && <CustomSheet {...sheet} entryId={editor.id} />}
      {editor?.kind === 'vip' && <VipSheet {...sheet} />}
      {editor?.kind === 'dragon' && <DragonSheet {...sheet} />}
      {editor?.kind === 'recovery' && <RecoverySheet {...sheet} />}
    </SetupBindingProvider>
  );
}
