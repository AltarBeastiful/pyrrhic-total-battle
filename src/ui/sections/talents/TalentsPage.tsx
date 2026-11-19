/**
 * The Talents page (B-21): the hero's level, the points to spend and a goal in, an ordered list of ranks out,
 * and the same answer drawn on the game's own tree. The plan is a pure function (`src/engine/talents.ts`) that
 * is cheap enough to run on every keystroke, so nothing is computed behind a button.
 *
 * **Points.** Only the points the player types are used: the game's points-per-level table below hero level 86
 * is not known to us (only "10 per level from 86"), and a per-level rate alone cannot give a total, so a figure
 * is never invented from the level. Until one is typed the page says so (story 40) and plans nothing.
 *
 * **Army.** The unit kinds that count are read from the account (`armyKinds.ts`) and the player may add more
 * by ticking them; a kind the army already has is shown ticked and fixed. Engineers have no tick (the saved
 * plan has no engineers choice): they count when the engineers row is in use.
 *
 * Design rules 1, 3-5, 15, 17-24, 26, 28.
 */
import { Checkbox, Group, Radio, SegmentedControl, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';

import { talents as TALENTS } from '@/data';
import { TALENT_TREES, type TalentTree as TreeId } from '@/data/types';
import {
  goalHasUnitStats,
  rankGain,
  rankTalentGoals,
  TALENT_GOALS as GOAL_STATS,
  type TalentStep,
  type UnitKind,
} from '@/engine/talents';
import { TALENT_GOALS, TALENT_UNIT_KINDS, type TalentUnitKind, type Talents } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { Disclosure, NumberField, Panel } from '@/ui/kit';

import { fieldedKinds } from './armyKinds';
import { GOAL_LABELS, KIND_LABELS, percent, statLabel, TREE_LABELS, TREE_SHORT } from './labels';
import { treePoints } from './spentPoints';
import { TalentTree } from './TalentTree';

const BY_ID = new Map(TALENTS.map((t) => [t.id, t]));

interface Run {
  nodeId: number;
  from: number;
  to: number;
  cost: number;
  gain: number;
  opens: number | null;
  filler: boolean;
}

/** Consecutive ranks of one node read as one line: "ranks 3 to 9" rather than seven. */
function runsOf(steps: readonly TalentStep[]): Run[] {
  const runs: Run[] = [];
  for (const s of steps) {
    const rec = BY_ID.get(s.nodeId)!;
    const gain = rankGain(rec.values, s.rank);
    const last = runs.at(-1);
    if (
      last !== undefined &&
      last.nodeId === s.nodeId &&
      last.opens === s.opens &&
      last.filler === s.filler &&
      last.to === s.rank - 1
    ) {
      last.to = s.rank;
      last.cost += s.cost;
      last.gain += gain;
    } else {
      runs.push({
        nodeId: s.nodeId,
        from: s.rank,
        to: s.rank,
        cost: s.cost,
        gain,
        opens: s.opens,
        filler: s.filler,
      });
    }
  }
  return runs;
}

const plural = (n: number, word: string): string => `${String(n)} ${word}${n === 1 ? '' : 's'}`;

export function TalentsPage() {
  const profile = useStore(selectActiveProfile);
  const updateProfile = useStore((state) => state.updateProfile);
  const [tree, setTree] = useState<TreeId | null>(null);
  const [selected, setSelected] = useState<number | null>(null);

  const talentsState = profile?.talents;
  const fielded = useMemo(
    () => (profile === undefined ? new Set<UnitKind>() : fieldedKinds(profile)),
    [profile],
  );

  const goal = talentsState?.goals[0] ?? 'battle'; // B-22 interim: rank 1 stands in for the single goal
  const forced = talentsState?.forcedUnitKinds;
  const kinds = useMemo(() => new Set<UnitKind>([...fielded, ...(forced ?? [])]), [fielded, forced]);

  /** The three goals compared on the same points, best value per point first; the saved goal's plan is among them. */
  const ranking = useMemo(() => {
    if (talentsState === undefined) return null;
    const ranks: Record<number, number> = {};
    for (const [key, value] of Object.entries(talentsState.ranks)) ranks[Number(key)] = value;
    return rankTalentGoals({
      talents: TALENTS,
      heroLevel: talentsState.heroLevel,
      points: talentsState.pointsOverride ?? 0,
      ranks,
      weightsByGoal: talentsState.weights,
      kinds,
    });
  }, [talentsState, kinds]);
  const plan = ranking?.find((r) => r.goal === goal)?.plan ?? null;

  if (profile === undefined || talentsState === undefined || ranking === null || plan === null) return null;

  const edit = (patch: Partial<Talents>): void => {
    updateProfile(profile.id, (current) => ({ talents: { ...current.talents, ...patch } }));
  };

  const points = talentsState.pointsOverride;
  const runs = runsOf(plan.steps);
  const viewTree = tree ?? goal; // a goal opens the tree of its own name
  const goalStats = GOAL_STATS[goal];
  const shownStats = goalStats.filter((s) => (plan.before[s] ?? 0) !== 0 || (plan.after[s] ?? 0) !== 0);
  const gate = plan.nextGate === null ? null : BY_ID.get(plan.nextGate.nodeId);

  const setRank = (id: number, rank: number): void => {
    updateProfile(profile.id, (current) => {
      const ranks = { ...current.talents.ranks };
      if (rank <= 0) delete ranks[String(id)];
      else ranks[String(id)] = rank;
      return { talents: { ...current.talents, ranks } };
    });
  };

  return (
    <Stack gap="lg">
      <Panel
        component="section"
        title="Hero talents"
        meta={`${GOAL_LABELS[goal]}, level ${String(talentsState.heroLevel)}`}
      >
        <Stack gap="md">
          <Group gap="md" align="flex-start" grow>
            <NumberField
              label="Hero level"
              value={talentsState.heroLevel}
              min={1}
              max={1000}
              onChange={(v) => {
                edit({ heroLevel: Math.min(1000, Math.max(1, v ?? 1)) });
              }}
            />
            <NumberField
              label="Points to spend"
              value={points}
              allowEmpty
              min={0}
              onChange={(v) => {
                edit({ pointsOverride: v });
              }}
            />
          </Group>
          <Radio.Group
            label="Goals, best value per point first"
            description="Choose one to see its plan, totals and tree."
            value={goal}
            onChange={(v) => {
              const next = TALENT_GOALS.find((g) => g === v);
              if (next === undefined) return;
              edit({ goals: [next, ...talentsState.goals.filter((g) => g !== next)] });
              setTree(null);
            }}
          >
            <Stack gap="xs" mt="xs" role="presentation">
              {ranking.map((r, i) => (
                <Radio
                  key={r.goal}
                  value={r.goal}
                  label={
                    <>
                      <Text span fw={600}>{`${String(i + 1)}. ${GOAL_LABELS[r.goal]}`}</Text>
                      <Text span size="sm" c="dimmed" display="block">
                        {r.valuePerPoint === null
                          ? (r.reason ?? '')
                          : `${percent(r.valuePerPoint)} per point, ${plural(r.pointsSpent, 'point')} spent`}
                      </Text>
                    </>
                  }
                />
              ))}
            </Stack>
          </Radio.Group>
          <Disclosure title="Weights" summary="Every stat counts 1 unless you change it">
            <Stack gap="xs">
              {goalStats.map((stat) => (
                <NumberField
                  key={stat}
                  label={statLabel(stat)}
                  accessibleName={`Weight of ${statLabel(stat)}`}
                  value={talentsState.weights[goal]?.[stat] ?? 1}
                  allowDecimal
                  allowEmpty
                  min={0}
                  onChange={(v) => {
                    // Empty means the default of 1, which is no override at all.
                    const rest = { ...talentsState.weights[goal] };
                    if (v === null) delete rest[stat];
                    else rest[stat] = v;
                    edit({ weights: { ...talentsState.weights, [goal]: rest } });
                  }}
                />
              ))}
            </Stack>
          </Disclosure>
          {goalHasUnitStats(goal) && (
            <Disclosure
              title="Units that count"
              summary={[...kinds].map((k) => KIND_LABELS[k]).join(', ') || 'None'}
            >
              <Stack gap="xs">
                {TALENT_UNIT_KINDS.map((kind) => {
                  const inArmy = fielded.has(kind);
                  return (
                    <Checkbox
                      key={kind}
                      label={KIND_LABELS[kind]}
                      description={inArmy ? 'In your army' : undefined}
                      checked={inArmy || talentsState.forcedUnitKinds.includes(kind)}
                      disabled={inArmy}
                      onChange={(event) => {
                        const on = event.currentTarget.checked;
                        const rest = talentsState.forcedUnitKinds.filter((k) => k !== kind);
                        edit({ forcedUnitKinds: on ? [...rest, kind as TalentUnitKind] : rest });
                      }}
                    />
                  );
                })}
                {fielded.has('engineers') && (
                  <Text size="sm" c="dimmed">
                    Engineers count too: your army uses them.
                  </Text>
                )}
              </Stack>
            </Disclosure>
          )}
        </Stack>
      </Panel>

      <Panel
        component="section"
        title="Spend in this order"
        meta={points === null ? undefined : plural(points, 'point')}
      >
        <Stack gap="md">
          {points === null ? (
            <Text>
              Type the points you have to spend. The game&apos;s points per hero level are only known from
              level 86 (10 each), so the page cannot work out your total from the level alone.
            </Text>
          ) : runs.length === 0 ? (
            <Text>
              {points === 0
                ? 'No points to spend, so there is nothing to plan.'
                : kinds.size === 0 && goalHasUnitStats(goal)
                  ? 'Nothing to plan: no unit counts yet. Set your troops, or tick a kind of unit under Units that count.'
                  : 'No node open at this hero level adds anything for this goal and army, so nothing is planned.'}
            </Text>
          ) : (
            <>
              <Text>
                Plan spends {String(plan.pointsSpent)} of {String(points)} points
                {plan.pointsLeft > 0 ? `, ${String(plan.pointsLeft)} left.` : '.'}
              </Text>
              <ol aria-label="Spend in this order" style={{ margin: 0, paddingInlineStart: '1.5rem' }}>
                {runs.map((run, i) => {
                  const rec = BY_ID.get(run.nodeId)!;
                  const opened = run.opens === null ? null : BY_ID.get(run.opens);
                  return (
                    <li key={`${String(run.nodeId)}-${String(run.from)}-${String(i)}`}>
                      <Text span fw={600}>
                        {rec.name}
                      </Text>
                      {run.from === run.to
                        ? `, rank ${String(run.to)}`
                        : `, ranks ${String(run.from)} to ${String(run.to)}`}
                      {`, ${plural(run.cost, 'point')}, ${run.gain >= 0 ? '+' : ''}${percent(run.gain)} ${rec.stats.map(statLabel).join(', ')}`}
                      {run.filler && (
                        <Text span c="dimmed">
                          {'. Filler, no gain for this goal'}
                        </Text>
                      )}
                      {opened !== null && opened !== undefined && (
                        <Text span c="dimmed">{`. Opens ${opened.name}`}</Text>
                      )}
                    </li>
                  );
                })}
              </ol>
              {plan.pointsLeft > 0 && (
                <Text size="sm" c="dimmed">
                  {plural(plan.pointsLeft, 'point')} left over: less than the cheapest rank still open.
                </Text>
              )}
            </>
          )}
          {gate !== null && gate !== undefined && plan.nextGate !== null && (
            <Text size="sm">
              At level {String(plan.nextGate.level)}, {gate.name} opens, worth {percent(plan.nextGate.value)}{' '}
              for {plural(plan.nextGate.points, 'point')}.
            </Text>
          )}
        </Stack>
      </Panel>

      {shownStats.length > 0 && (
        <Panel component="section" title="Totals" meta="Before, then after">
          <Stack gap={4}>
            {shownStats.map((stat) => (
              <Group key={stat} justify="space-between" wrap="nowrap">
                <Text size="sm">{statLabel(stat)}</Text>
                <Text size="sm">
                  {percent(plan.before[stat] ?? 0)} to {percent(plan.after[stat] ?? 0)}
                </Text>
              </Group>
            ))}
          </Stack>
        </Panel>
      )}

      <Panel component="section" title="Tree" meta={TREE_LABELS[viewTree]}>
        <Stack gap="md">
          <SegmentedControl
            fullWidth
            styles={{ root: { maxWidth: '100%' }, label: { paddingInline: 4, minWidth: 0 } }}
            aria-label="Tree"
            value={viewTree}
            data={TALENT_TREES.map((t) => ({
              value: t,
              label: (
                <span style={{ display: 'grid', lineHeight: 1.2 }}>
                  <span>{TREE_SHORT[t]}</span>
                  <span>{`${String(treePoints(TALENTS, t, talentsState.ranks, plan.steps).spent)} spent`}</span>
                  {treePoints(TALENTS, t, talentsState.ranks, plan.steps).planned > 0 && (
                    <span>{`${String(treePoints(TALENTS, t, talentsState.ranks, plan.steps).planned)} planned`}</span>
                  )}
                </span>
              ),
            }))}
            onChange={(v) => {
              const next = TALENT_TREES.find((t) => t === v);
              if (next === undefined) return;
              setTree(next);
              setSelected(null);
            }}
          />
          <TalentTree
            talents={TALENTS}
            tree={viewTree}
            ranks={talentsState.ranks}
            plan={plan}
            selected={selected}
            onSelect={setSelected}
            onRank={setRank}
          />
        </Stack>
      </Panel>
    </Stack>
  );
}
