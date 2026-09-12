import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { version as gameData } from '@/data';
import type { BonusKey, Pool, SpecialKey } from '@/engine/types';
import { newSavedStack } from '@/state/defaults';
import type { SavedStack } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Button, Card, HelpNote, Section, Toggle } from '@/ui/primitives';
import { resultCounts, toSavedSummary, useResultStore } from '@/ui/resultStore';

import { amount } from './format';
import { runGenerate } from './generate';
import { JournalDrawer } from './JournalDrawer';
import { applyCounts, hasEdits } from './manual';
import { SavedStacksPanel, StackNameDialog } from './SavedStacks';
import { StackPills } from './StackPills';
import { SummaryCards } from './SummaryCards';
import { useRunStore } from './runStore';
import { unitName } from './units';

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

/** Saved stacks keep the aggregated bonus maps; the zeroes would triple the stored document. */
function stripZeros<K extends string>(map: Record<K, number>): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const [key, value] of Object.entries(map) as [K, number][]) {
    if (value !== 0) out[key] = value;
  }
  return out;
}

/**
 * Take a unit type out of the formation and generate again. A mercenary leaves the owned list (its cap is
 * remembered so it can come back); anything else is added to the profile's per-unit exclusions, which is
 * where the Troops section reads them from too.
 */
function removeFromFormation(unitId: string): void {
  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  if (!profile) return;
  const owned = profile.mercenaries.selected.find((entry) => entry.id === unitId);
  if (owned) {
    useRunStore.getState().rememberMercenary({ id: owned.id, cap: owned.cap });
    state.updateProfile(profile.id, (current) => ({
      mercenaries: {
        ...current.mercenaries,
        selected: current.mercenaries.selected.filter((entry) => entry.id !== unitId),
      },
    }));
  } else {
    state.updateProfile(profile.id, (current) => ({
      troops: {
        ...current.troops,
        excludedUnitIds: current.troops.excludedUnitIds.includes(unitId)
          ? current.troops.excludedUnitIds
          : [...current.troops.excludedUnitIds, unitId],
      },
    }));
  }
  void runGenerate();
}

function restoreToFormation(unitId: string): void {
  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  if (!profile) return;
  const removed = useRunStore.getState().removedMercenaries.find((entry) => entry.id === unitId);
  if (removed) {
    useRunStore.getState().forgetMercenary(unitId);
    state.updateProfile(profile.id, (current) => ({
      mercenaries: {
        ...current.mercenaries,
        selected: current.mercenaries.selected.some((entry) => entry.id === unitId)
          ? current.mercenaries.selected
          : [...current.mercenaries.selected, { id: removed.id, cap: removed.cap }],
      },
    }));
  }
  state.updateProfile(profile.id, (current) => ({
    troops: {
      ...current.troops,
      excludedUnitIds: current.troops.excludedUnitIds.filter((id) => id !== unitId),
    },
  }));
  void runGenerate();
}

/** Results (PLAN §4.8): summary cards, the stacks themselves, the journal, saved stacks. */
export function ResultsSection() {
  const last = useResultStore((state) => state.last);
  const running = useResultStore((state) => state.running);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const removedMercenaries = useRunStore((state) => state.removedMercenaries);

  const [counts, setCounts] = useState<Record<string, number>>({});
  const [stamp, setStamp] = useState(last?.at ?? 0);
  const [sortByHp, setSortByHp] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // A new result replaces the manual edits: they belong to the formation they were made on.
  if ((last?.at ?? 0) !== stamp) {
    setStamp(last?.at ?? 0);
    setCounts({});
  }

  const edited = useMemo(
    () => (last && hasEdits(last.result, counts) ? applyCounts(last.request, last.result, counts) : null),
    [last, counts],
  );

  const excludedIds = profile?.troops.excludedUnitIds ?? [];
  const removedIds = [...excludedIds, ...removedMercenaries.map((entry) => entry.id)];

  const saveStack = (name: string): void => {
    if (!last || !setup) return;
    const state = useStore.getState();
    const result = edited?.result ?? last.result;
    const summary = edited?.summary ?? last.summary;
    const saved: SavedStack = {
      ...newSavedStack(name, setup, state.doc.deviceId),
      totals: {
        health: stripZeros<BonusKey>(last.request.totals.health),
        strength: stripZeros<BonusKey>(last.request.totals.strength),
        special: stripZeros<SpecialKey>(last.request.totals.special),
      },
      counts: resultCounts(result),
      summary: toSavedSummary(summary),
      dataVersion: gameData.dataVersion,
    };
    state.addSavedStack(saved);
    setSaving(false);
  };

  const body = (): ReactNode => {
    if (!last) {
      return (
        <HelpNote>
          Nothing generated yet. Enter your housing above and press Generate; the stacks, the battle summary
          and the journal appear here.
        </HelpNote>
      );
    }

    const stale =
      profile !== undefined &&
      setup !== undefined &&
      (last.profileId !== profile.id || last.setupId !== setup.id);
    const result = edited?.result ?? last.result;
    const summary = edited?.summary ?? last.summary;
    const generated = new Map(last.result.stacks.map((stack) => [stack.unitId, stack.count]));
    const byId = new Map(result.stacks.map((stack) => [stack.unitId, stack]));
    const pills = last.result.stacks.map(
      (stack) =>
        byId.get(stack.unitId) ?? {
          ...stack,
          count: 0,
          totalHp: 0,
          damagePerHit: 0,
          featuresDamage: 0,
        },
    );
    if (sortByHp) pills.sort((a, b) => b.totalHp - a.totalHp);

    return (
      <div className="space-y-4">
        {stale && (
          <HelpNote tone="warn">
            This result was generated for another profile or march. Generate again to refresh it.
          </HelpNote>
        )}

        <SummaryCards summary={summary} baseline={edited ? last.summary : undefined} />

        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-sm font-semibold">Stacks, in the order they die</h3>
          <Toggle label="Sort by total HP" checked={sortByHp} onChange={setSortByHp} className="text-sm" />
          {sortByHp && (
            <Button
              size="sm"
              onClick={() => {
                setSortByHp(false);
              }}
            >
              Reset order
            </Button>
          )}
        </div>

        <StackPills
          request={last.request}
          stacks={pills}
          pools={result.pools}
          generated={generated}
          onCount={(unitId, count) => {
            setCounts((current) => ({ ...current, [unitId]: count }));
          }}
          onRemove={removeFromFormation}
        />

        {edited && (
          <div className="flex flex-wrap items-center gap-2">
            <HelpNote className="mr-auto">
              Counts edited by hand. The summary above compares them with the generated stacks; nothing is
              re-sized, so the housing is yours to balance.
            </HelpNote>
            <Button
              onClick={() => {
                setCounts({});
              }}
            >
              Back to generated
            </Button>
          </div>
        )}

        {edited && edited.overflow.length > 0 && (
          <HelpNote tone="danger">
            Over capacity in {edited.overflow.map((pool) => POOL_LABELS[pool].toLowerCase()).join(', ')}. The
            game will refuse a march that does not fit.
          </HelpNote>
        )}

        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((warning) => (
              <HelpNote key={warning} tone="warn">
                {warning}
              </HelpNote>
            ))}
          </div>
        )}

        {result.dropped.length > 0 && (
          <Card padded={false} className="p-3">
            <h3 className="mb-1.5 text-sm font-semibold">Unit types left out</h3>
            <ul className="text-muted space-y-1 text-xs">
              {result.dropped.map((entry) => (
                <li key={entry.unitId}>
                  <span className="text-fg font-medium">{unitName(entry.unitId, last.request.units)}</span> —{' '}
                  {entry.reason}
                </li>
              ))}
            </ul>
          </Card>
        )}

        {removedIds.length > 0 && (
          <Card padded={false} className="p-3">
            <h3 className="mb-1.5 text-sm font-semibold">Removed by you</h3>
            <ul className="space-y-1.5">
              {removedIds.map((unitId) => (
                <li key={unitId} className="flex items-center justify-between gap-2 text-xs">
                  {/* A removed unit type is out of the request, so a custom mercenary is named here. */}
                  <span className="truncate">
                    {profile?.mercenaries.custom.find((entry) => entry.id === unitId)?.name ??
                      unitName(unitId, last.request.units)}
                  </span>
                  <Button
                    size="sm"
                    disabled={running}
                    onClick={() => {
                      restoreToFormation(unitId);
                    }}
                  >
                    Restore
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              setJournalOpen(true);
            }}
          >
            Battle journal
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setSaving(true);
            }}
          >
            Save stack
          </Button>
        </div>

        <JournalDrawer
          open={journalOpen}
          onOpenChange={setJournalOpen}
          request={last.request}
          journals={summary.journals}
        />
        {saving && (
          <StackNameDialog
            open
            title="Save this stack"
            description="It is kept inside the active profile, with the march it came from."
            confirmLabel="Save stack"
            initialName={`${setup?.name ?? 'March'} — ${amount(summary.avgDamage)} avg`}
            onConfirm={saveStack}
            onCancel={() => {
              setSaving(false);
            }}
          />
        )}
      </div>
    );
  };

  const aside = (): ReactNode => {
    if (!last) return null;
    const result = edited?.result ?? last.result;
    return (
      <aside className="hidden xl:block">
        <div className="border-line bg-raised sticky top-4 rounded-xl border p-3">
          <h3 className="mb-2 text-sm font-semibold">Formation</h3>
          {(Object.keys(POOL_LABELS) as Pool[]).map((pool) => {
            const stacks = result.stacks.filter((stack) => stack.pool === pool);
            if (stacks.length === 0) return null;
            return (
              <div key={pool} className="mb-2 last:mb-0">
                <p className="text-muted text-xs font-medium">
                  {POOL_LABELS[pool]} {amount(result.pools[pool].used)}/{amount(result.pools[pool].capacity)}
                </p>
                <ul className="text-xs tabular-nums">
                  {stacks.map((stack) => (
                    <li key={stack.unitId} className="flex justify-between gap-2">
                      <span className="truncate">{unitName(stack.unitId, last.request.units)}</span>
                      <span className="font-medium">{amount(stack.count)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </aside>
    );
  };

  return (
    <Section
      id="results"
      title="Results"
      description="Stack sizes, the battle summary and the journal."
      summary={
        last === null ? undefined : (
          <span className="text-muted">
            {amount(last.result.stacks.length)} stacks · {amount(last.summary.avgDamage)} average damage
          </span>
        )
      }
      help={
        <>
          <p>
            Stacks are listed in the order the enemy destroys them: highest total HP first. The pill shows the
            unit count; open it for the effective stats behind that count and for the manual edit.
          </p>
          <p>
            Where to find it in game: after the march, the battle report in your Journal lists the same
            numbered hits. Compare it with our journal to check the bonuses you entered.
          </p>
        </>
      }
    >
      <div className="space-y-4 xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-4 xl:space-y-0">
        <div className="space-y-4">
          {body()}
          {profile !== undefined && <SavedStacksPanel profile={profile} />}
        </div>
        {aside()}
      </div>
    </Section>
  );
}
