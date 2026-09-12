import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { version as gameData } from '@/data';
import type { BonusKey, Pool, SpecialKey } from '@/engine/types';
import { newSavedStack } from '@/state/defaults';
import type { SavedStack } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { PinIcon, PoolBadge, ResultsIcon, WarningIcon } from '@/ui/icons';
import { Button, Card, HelpNote, Section, Toggle } from '@/ui/primitives';
import { initResultPersistence, resultCounts, toSavedSummary, useResultStore } from '@/ui/resultStore';

import { amount, relativeTime } from './format';
import { removeFromFormation, restoreToFormation, stopKeepingAll } from './formation';
import { restoreLastResult } from './generate';
import { HpProfile } from './HpProfile';
import { JournalDrawer } from './JournalDrawer';
import { KeepButton } from './KeepButton';
import { applyCounts, hasEdits } from './manual';
import { SavedStacksPanel, StackNameDialog } from './SavedStacks';
import { StackPills } from './StackPills';
import { SummaryCards } from './SummaryCards';
import { TradeoffPanel } from './TradeoffPanel';
import { useRunStore } from './runStore';
import { unitLabel, unitName } from './units';

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

const POOLS = Object.keys(POOL_LABELS) as Pool[];

/** Saved stacks keep the aggregated bonus maps; the zeroes would triple the stored document. */
function stripZeros<K extends string>(map: Record<K, number>): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const [key, value] of Object.entries(map) as [K, number][]) {
    if (value !== 0) out[key] = value;
  }
  return out;
}

/**
 * The same reason repeated for ten unit types is one fact, not ten: an empty pool drops every type it
 * pays for. Identical reasons are collapsed into one line, the unit types kept underneath so each one
 * still gets its own "Keep in march".
 */
function groupDropped(
  dropped: readonly { unitId: string; reason: string }[],
): { reason: string; unitIds: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const entry of dropped) {
    const ids = groups.get(entry.reason) ?? [];
    ids.push(entry.unitId);
    groups.set(entry.reason, ids);
  }
  return [...groups].map(([reason, unitIds]) => ({ reason, unitIds }));
}

/** Results (PLAN §4.8): summary cards, the HP profile, the stacks, the journal, saved stacks. */
export function ResultsSection() {
  const last = useResultStore((state) => state.last);
  const running = useResultStore((state) => state.running);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const removedMercenaries = useRunStore((state) => state.removedMercenaries);
  const tradeoff = useRunStore((state) => state.tradeoff);

  // Manual edits live in the result store so they survive a reload with the result they belong to.
  const counts = useResultStore((state) => state.manualCounts);
  const [sortByHp, setSortByHp] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Bring back the cached result of this march, then keep the cache in step with the store.
  useEffect(() => {
    restoreLastResult();
    return initResultPersistence();
  }, []);

  const edited = useMemo(
    () => (last && hasEdits(last.result, counts) ? applyCounts(last.request, last.result, counts) : null),
    [last, counts],
  );

  const kept = setup?.pinnedUnitIds ?? [];
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

    const outdated = profile !== undefined && profile.updatedAt > last.at;
    const keptHere = kept.filter((unitId) => result.stacks.some((stack) => stack.unitId === unitId));
    const keptElsewhere = kept.filter((unitId) => !keptHere.includes(unitId));

    return (
      <div className="space-y-4">
        {stale && (
          <HelpNote tone="warn">
            This result was generated for another profile or march. Generate again to refresh it.
          </HelpNote>
        )}

        <p className="text-muted text-xs">Generated {relativeTime(last.at)}.</p>

        {outdated && !stale && (
          <HelpNote tone="warn">
            Your profile has changed since this result was generated, so it may be stale. Generate again to
            bring it up to date.
          </HelpNote>
        )}

        <SummaryCards summary={summary} baseline={edited ? last.summary : undefined} />

        {kept.length > 0 && (
          <p className="text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <PinIcon aria-hidden="true" className="text-accent" />
            <span>Pinned: {kept.map((unitId) => unitLabel(unitId, last.request.units)).join(', ')}</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={running}
              onClick={() => {
                stopKeepingAll();
              }}
            >
              Clear all
              <span className="sr-only">{': stop keeping every unit type in'}</span>
            </Button>
          </p>
        )}

        {tradeoff !== null && (
          <TradeoffPanel tradeoff={tradeoff} units={last.request.units} kept={kept} busy={running} />
        )}

        <div className="flex flex-wrap items-center gap-2">
          <h3 className="mr-auto text-sm font-semibold">Stacks, in the order they fall</h3>
          <Toggle label="Sort by total HP" checked={sortByHp} onChange={setSortByHp} className="text-sm" />
          {sortByHp && (
            <Button
              size="sm"
              onClick={() => {
                setSortByHp(false);
              }}
            >
              Back to the order they fall
            </Button>
          )}
        </div>

        <HpProfile stacks={pills} units={last.request.units} kept={kept} />

        <StackPills
          request={last.request}
          stacks={pills}
          pools={result.pools}
          generated={generated}
          kept={kept}
          busy={running}
          onCount={(unitId, count) => {
            useResultStore.getState().editCount(unitId, count);
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
                useResultStore.getState().resetCounts();
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
          <Card tone="warn" padded={false} className="p-3">
            <h3 className="flex items-center gap-1.5 text-sm font-semibold">
              <WarningIcon aria-hidden="true" className="text-warn" />
              Worth a look
            </h3>
            <ul className="mt-1.5 space-y-1 text-xs leading-relaxed">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </Card>
        )}

        {keptElsewhere.length > 0 && (
          <HelpNote tone="warn">
            {keptElsewhere.map((unitId) => unitName(unitId, last.request.units)).join(', ')} stayed out of
            this march even though you keep {keptElsewhere.length === 1 ? 'it' : 'them'} in. Check that the
            tier is still switched on in Troops or Mercenaries, and that the capacity paying for{' '}
            {keptElsewhere.length === 1 ? 'it' : 'them'} is not zero.
          </HelpNote>
        )}

        {result.dropped.length > 0 && (
          <Card padded={false} className="p-3">
            <h3 className="mb-1.5 text-sm font-semibold">Unit types left out</h3>
            <ul className="space-y-2">
              {groupDropped(result.dropped).map((group) => {
                const only = group.unitIds.length === 1 ? (group.unitIds[0] ?? '') : null;
                return (
                  <li key={group.reason} className="text-muted text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0">
                        <span className="text-fg font-medium">
                          {only === null
                            ? `${String(group.unitIds.length)} unit types left out`
                            : unitName(only, last.request.units)}
                        </span>{' '}
                        — {group.reason}
                      </p>
                      {only !== null && (
                        <KeepButton
                          unitId={only}
                          name={unitName(only, last.request.units)}
                          kept={kept.includes(only)}
                          disabled={running}
                        />
                      )}
                    </div>
                    {only === null && (
                      <ul className="mt-1.5 space-y-1.5">
                        {group.unitIds.map((unitId) => {
                          const name = unitName(unitId, last.request.units);
                          return (
                            <li key={unitId} className="flex items-center justify-between gap-2">
                              <span className="truncate">{name}</span>
                              <KeepButton
                                unitId={unitId}
                                name={name}
                                kept={kept.includes(unitId)}
                                disabled={running}
                              />
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
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
                  <span className="flex shrink-0 items-center gap-2">
                    <Button
                      size="sm"
                      disabled={running}
                      onClick={() => {
                        restoreToFormation(unitId);
                      }}
                    >
                      Put it back
                      <span className="sr-only">{`: ${unitName(unitId, last.request.units)}`}</span>
                    </Button>
                    {/* Keeping it in does both: it comes back *and* nothing may drop it again. */}
                    <KeepButton
                      unitId={unitId}
                      name={unitName(unitId, last.request.units)}
                      kept={kept.includes(unitId)}
                      disabled={running}
                    />
                  </span>
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
            initialName={`${setup?.name ?? 'March'} — ${amount(summary.avgDamage)} expected`}
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
        <Card tone="raised" padded={false} className="p-3">
          <h3 className="mb-2 text-sm font-semibold">This march</h3>
          {POOLS.map((pool) => {
            const stacks = result.stacks.filter((stack) => stack.pool === pool);
            if (stacks.length === 0) return null;
            return (
              <div key={pool} className="mb-2 last:mb-0">
                <p className="text-muted nums flex items-center gap-1.5 text-xs font-medium">
                  <PoolBadge pool={pool} size="sm" />
                  {POOL_LABELS[pool]} {amount(result.pools[pool].used)}/{amount(result.pools[pool].capacity)}
                </p>
                <ul className="nums text-xs">
                  {stacks.map((stack) => (
                    <li key={stack.unitId} className="flex justify-between gap-2">
                      <span className="truncate">
                        {unitName(stack.unitId, last.request.units)}
                        {kept.includes(stack.unitId) && (
                          <PinIcon
                            title="Kept in march"
                            className="text-accent ml-1 inline-block align-[-0.1em]"
                          />
                        )}
                      </span>
                      <span className="font-medium">{amount(stack.count)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </Card>
      </aside>
    );
  };

  const announcement =
    last === null
      ? ''
      : `Stacks generated: ${amount(last.result.stacks.length)} stacks, ${amount(
          last.summary.avgDamage,
        )} expected damage.`;

  return (
    <Section
      id="results"
      title="Results"
      icon={<ResultsIcon />}
      description="Stack sizes, the battle summary and the journal."
      summary={
        last === null ? undefined : (
          <span className="text-muted nums">
            {amount(last.result.stacks.length)} stacks · {amount(last.summary.avgDamage)} expected damage
          </span>
        )
      }
      help={
        <>
          <p>
            The monster always hits the stack with the most health left, so the HP profile is the order the
            battle destroys your army in: first to fall on top. A chip shows the unit count; open it for the
            stats behind that count, to edit it by hand, or to keep that type in the march for good.
          </p>
          <p>
            <strong>Where to find it in game:</strong> after the march, the battle report in your Journal
            lists the same numbered hits, so you can hold it next to our journal and check the bonuses you
            typed.
          </p>
        </>
      }
    >
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
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
