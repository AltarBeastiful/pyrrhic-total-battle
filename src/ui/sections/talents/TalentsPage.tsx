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
import { Checkbox, Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { useMemo, useState } from 'react';

import { talents as TALENTS } from '@/data';
import { TALENT_TREES, type TalentTree as TreeId } from '@/data/types';
import { planTalents, TALENT_GOALS as GOAL_STATS, type TalentStep, type UnitKind } from '@/engine/talents';
import {
  TALENT_GOALS,
  TALENT_UNIT_KINDS,
  type TalentGoal,
  type TalentUnitKind,
  type Talents,
} from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { Disclosure, NumberField, Panel } from '@/ui/kit';

import { fieldedKinds } from './armyKinds';
import { GOAL_LABELS, KIND_LABELS, percent, statLabel, TREE_LABELS } from './labels';
import { TalentTree } from './TalentTree';

const BY_ID = new Map(TALENTS.map((t) => [t.id, t]));

const TREE_SHORT: Record<TreeId, string> = {
  battle: 'Battle',
  expert: 'Expert',
  economy: 'Economy',
  archeology: 'Archeology',
};

/** The tree a goal is mostly played on, which the view opens on. */
const GOAL_TREE: Record<TalentGoal, TreeId> = {
  battle: 'battle',
  economy: 'economy',
  archeology: 'archeology',
};

interface Run {
  nodeId: number;
  from: number;
  to: number;
  cost: number;
  gain: number;
  opens: number | null;
}

/** Consecutive ranks of one node read as one line: "ranks 3 to 9" rather than seven. */
function runsOf(steps: readonly TalentStep[]): Run[] {
  const runs: Run[] = [];
  for (const s of steps) {
    const rec = BY_ID.get(s.nodeId)!;
    const gain = rec.values[s.rank - 1]! - (s.rank > 1 ? rec.values[s.rank - 2]! : 0);
    const last = runs.at(-1);
    if (last !== undefined && last.nodeId === s.nodeId && last.opens === s.opens && last.to === s.rank - 1) {
      last.to = s.rank;
      last.cost += s.cost;
      last.gain += gain;
    } else {
      runs.push({ nodeId: s.nodeId, from: s.rank, to: s.rank, cost: s.cost, gain, opens: s.opens });
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

  const goal = talentsState?.goal ?? 'battle';
  const forced = talentsState?.forcedUnitKinds;
  const kinds = useMemo(() => new Set<UnitKind>([...fielded, ...(forced ?? [])]), [fielded, forced]);

  const plan = useMemo(() => {
    if (talentsState === undefined) return null;
    const ranks: Record<number, number> = {};
    for (const [key, value] of Object.entries(talentsState.ranks)) ranks[Number(key)] = value;
    return planTalents({
      talents: TALENTS,
      heroLevel: talentsState.heroLevel,
      points: talentsState.pointsOverride ?? 0,
      ranks,
      goal: talentsState.goal,
      weights: talentsState.weights[talentsState.goal] ?? {},
      kinds,
    });
  }, [talentsState, kinds]);

  if (profile === undefined || talentsState === undefined || plan === null) return null;

  const edit = (patch: Partial<Talents>): void => {
    updateProfile(profile.id, (current) => ({ talents: { ...current.talents, ...patch } }));
  };

  const points = talentsState.pointsOverride;
  const runs = runsOf(plan.steps);
  const viewTree = tree ?? GOAL_TREE[goal];
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
                edit({ heroLevel: v ?? 1 });
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
          <SegmentedControl
            fullWidth
            aria-label="Goal"
            value={goal}
            data={TALENT_GOALS.map((g) => ({ value: g, label: GOAL_LABELS[g] }))}
            onChange={(v) => {
              const next = TALENT_GOALS.find((g) => g === v);
              if (next === undefined) return;
              edit({ goal: next });
              setTree(null);
            }}
          />
          <Disclosure title="Weights" summary="Every stat counts 1 unless you change it">
            <Stack gap="xs">
              {goalStats.map((stat) => (
                <NumberField
                  key={stat}
                  label={statLabel(stat)}
                  accessibleName={`Weight of ${statLabel(stat)}`}
                  value={talentsState.weights[goal]?.[stat] ?? 1}
                  allowDecimal
                  min={0}
                  onChange={(v) => {
                    edit({
                      weights: {
                        ...talentsState.weights,
                        [goal]: { ...talentsState.weights[goal], [stat]: v ?? 1 },
                      },
                    });
                  }}
                />
              ))}
            </Stack>
          </Disclosure>
          {goal === 'battle' && (
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
                : kinds.size === 0 && goal === 'battle'
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
                      {opened !== null && opened !== undefined && (
                        <Text span c="dimmed">{`. Opens ${opened.name}`}</Text>
                      )}
                    </li>
                  );
                })}
              </ol>
              {plan.pointsLeft > 0 && (
                <Text size="sm" c="dimmed">
                  {plural(plan.pointsLeft, 'point')} left over: no further rank that is open adds anything for
                  this goal and army, or the next one costs more than what is left.
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
            aria-label="Tree"
            value={viewTree}
            data={TALENT_TREES.map((t) => ({ value: t, label: TREE_SHORT[t] }))}
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
