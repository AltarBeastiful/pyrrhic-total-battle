/**
 * The March card (design plan §7.5, amended by the owner): the answer, then the army, then the
 * counts, then everything that explains them.
 *
 * The order is the order a player reads in: the figures they compare marches by first, the army as
 * tiles they can change with one tap second, the counts they retype into the game third. What is
 * left — the trade-off of a priority search, the battle story, the HP profile — sits under it, and
 * the story and the profile are folded away.
 *
 * The card is the answer *and* the controls that shape it: leaving a type out, keeping one in,
 * editing a count by hand. Every one of them re-sizes the march, because numbers on screen must
 * always answer the question that is in the form.
 */
import { useEffect, useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { version as gameData } from '@/data';
import type { BonusKey, Pool, SpecialKey, UnitDef } from '@/engine/types';
import { buildBattleLink } from '@/share/codec';
import { newSavedStack } from '@/state/defaults';
import type { SavedStack } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { PoolField } from '@/ui/domain';
import { Banner, Button, Card, Disclosure } from '@/ui/kit';
import { Cluster, Grid, Stack } from '@/ui/layout';
import { copyText } from '@/ui/profile/download';
import { initResultPersistence, resultCounts, toSavedSummary, useResultStore } from '@/ui/resultStore';

import { ShareIcon } from '../../icons';
import { BattleStory } from './BattleStory';
import { amount, relativeTime } from './format';
import { restoreLastResult } from './generate';
import { HpProfile } from './HpProfile';
import { applyCounts, hasEdits } from './manual';
import { MarchCounts } from './MarchCounts';
import { MarchTiles } from './MarchTiles';
import { Recap } from './Recap';
import { marchRows, tileRows } from './rows';
import { SavedStacksPanel, StackNameDialog } from './SavedStacks';
import { TradeoffPanel } from './TradeoffPanel';
import { UnitSheet } from './UnitSheet';
import { useRunStore } from './runStore';
import { unitName } from './units';

const POOLS: Pool[] = ['leadership', 'authority', 'dominance'];

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

/** Saved marches keep the aggregated bonus maps; the zeroes would triple the stored document. */
function stripZeros<K extends string>(map: Record<K, number>): Partial<Record<K, number>> {
  const out: Partial<Record<K, number>> = {};
  for (const [key, value] of Object.entries(map) as [K, number][]) {
    if (value !== 0) out[key] = value;
  }
  return out;
}

export function ResultsSection() {
  const last = useResultStore((state) => state.last);
  // Manual edits live in the result store so they survive a reload with the result they belong to.
  const counts = useResultStore((state) => state.manualCounts);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const removedMercenaries = useRunStore((state) => state.removedMercenaries);
  const tradeoff = useRunStore((state) => state.tradeoff);
  const previousSummary = useRunStore((state) => state.previousSummary);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheetUnit, setSheetUnit] = useState<UnitDef | null>(null);
  const [notice, setNotice] = useState('');
  const titleId = useId();

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
  const leftOutIds = [
    ...(profile?.troops.excludedUnitIds ?? []),
    ...removedMercenaries.map((entry) => entry.id),
  ];

  const body = (): ReactNode => {
    if (last === null) {
      return (
        <p className="text-muted">
          Nothing generated yet. Set your housing above and press Generate; the counts to copy, the figures
          and the battle story appear here.
        </p>
      );
    }

    const result = edited?.result ?? last.result;
    const summary = edited?.summary ?? last.summary;
    const rows = marchRows(last.request, last.result, result, summary);
    const tiles = tileRows({
      units: last.request.units,
      counts: new Map(result.stacks.map((stack) => [stack.unitId, stack.count])),
      pinned: kept,
      leftOutIds,
    });

    const stale =
      profile !== undefined &&
      setup !== undefined &&
      (last.profileId !== profile.id || last.setupId !== setup.id);
    const outdated = profile !== undefined && profile.updatedAt > last.at;
    const keptElsewhere = kept.filter((unitId) => !result.stacks.some((s) => s.unitId === unitId));

    const saveMarch = (name: string): void => {
      if (!setup) return;
      const state = useStore.getState();
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

    const share = (): void => {
      if (!setup) return;
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

    return (
      <Stack gap={4}>
        <Recap summary={summary} {...(previousSummary === null ? {} : { previous: previousSummary })} />

        {stale && (
          <Banner tone="warn">
            This result was generated for another profile or march. Generate again to refresh it.
          </Banner>
        )}
        {outdated && !stale && (
          <Banner tone="warn">
            Your profile has changed since this result was generated, so it may be stale. Generate again to
            bring it up to date.
          </Banner>
        )}
        {edited && edited.overflow.length > 0 && (
          <Banner tone="danger">
            {`Over capacity in ${edited.overflow
              .map((pool) => POOL_LABELS[pool].toLowerCase())
              .join(', ')}. The game will refuse a march that does not fit.`}
          </Banner>
        )}
        {result.warnings.map((warning) => (
          <Banner key={warning} tone="warn" title="Worth a look">
            {warning}
          </Banner>
        ))}
        {keptElsewhere.length > 0 && (
          <Banner tone="warn">
            {`${keptElsewhere
              .map((unitId) => unitName(unitId, last.request.units))
              .join(', ')} stayed out of this march even though you keep ${
              keptElsewhere.length === 1 ? 'it' : 'them'
            } in. Check that the tier is still switched on, and that the capacity paying for ${
              keptElsewhere.length === 1 ? 'it' : 'them'
            } is not zero.`}
          </Banner>
        )}

        <MarchTiles rows={tiles} onDetails={setSheetUnit} />

        <Grid cols={{ base: 1, sm: 3 }} gap={2}>
          {POOLS.filter((pool) => result.pools[pool].capacity > 0 || result.pools[pool].used > 0).map(
            (pool) => (
              <PoolField
                key={pool}
                pool={pool}
                used={result.pools[pool].used}
                total={result.pools[pool].capacity}
              />
            ),
          )}
        </Grid>

        <MarchCounts
          rows={rows}
          editing={editing}
          onEditing={setEditing}
          edited={edited !== null}
          onCount={(unitId, count) => {
            useResultStore.getState().editCount(unitId, count);
          }}
          onUndo={() => {
            useResultStore.getState().resetCounts();
          }}
          onDetails={setSheetUnit}
        />

        {edited && (
          <p className="text-muted text-sm">
            Counts edited by hand. The figures above are recomputed on them; nothing is re-sized, so the
            housing is yours to balance.
          </p>
        )}

        {tradeoff !== null && tradeoff.excludedUnitIds.length > 0 && <TradeoffPanel tradeoff={tradeoff} />}

        <Disclosure title="Details" summary="The battle story and the HP profile">
          <Stack gap={4}>
            <BattleStory request={last.request} summary={summary} />
            <HpProfile stacks={result.stacks} units={last.request.units} kept={kept} />
          </Stack>
        </Disclosure>

        <Cluster gap={2}>
          <Button
            variant="primary"
            onPress={() => {
              setSaving(true);
            }}
          >
            Save this march
          </Button>
          <Button icon={<ShareIcon />} onPress={share}>
            Share
          </Button>
          <span role="status" className="text-muted text-sm">
            {notice}
          </span>
        </Cluster>

        <UnitSheet
          unit={sheetUnit}
          row={rows.find((row) => row.unit.id === sheetUnit?.id)}
          totalDamage={summary.journals.enemyFirst.totalDamage}
          pinned={sheetUnit !== null && kept.includes(sheetUnit.id)}
          onOpenChange={(open) => {
            if (!open) setSheetUnit(null);
          }}
          onEditCount={() => {
            setEditing(true);
          }}
        />

        {saving && (
          <StackNameDialog
            open
            title="Save this march"
            description="It is kept inside the active profile, with the march it came from."
            confirmLabel="Save this march"
            initialName={`${setup?.name ?? 'March'} — ${amount(summary.avgDamage)} expected`}
            onConfirm={saveMarch}
            onCancel={() => {
              setSaving(false);
            }}
          />
        )}
      </Stack>
    );
  };

  const announcement =
    last === null
      ? ''
      : `March generated: ${amount(last.result.stacks.length)} stacks, ${amount(
          last.summary.avgDamage,
        )} expected damage.`;

  return (
    <Card as="section" id="results" aria-labelledby={titleId} className="@container">
      <Stack gap={4}>
        <Cluster gap={2} justify="between">
          <h2 id={titleId} className="font-display text-lg">
            March
          </h2>
          {last !== null && (
            <span className="text-muted text-sm">{`Generated ${relativeTime(last.at)}`}</span>
          )}
        </Cluster>
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
        {body()}

        {profile !== undefined && (
          <Disclosure
            title="Saved marches"
            summary={
              profile.savedStacks.length === 0
                ? 'Nothing saved yet'
                : `${amount(profile.savedStacks.length)} saved`
            }
          >
            <SavedStacksPanel profile={profile} />
          </Disclosure>
        )}
      </Stack>
    </Card>
  );
}
