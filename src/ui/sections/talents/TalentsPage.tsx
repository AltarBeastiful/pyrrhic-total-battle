/**
 * The Talents page (B-21, priorities B-22): the hero's level, the points to spend and the goals ranked in, the
 * next two points out as cards, and the whole plan drawn on the game's own tree. The plan is a pure function
 * (`src/engine/talents.ts`) that is cheap enough to run on every keystroke, so nothing is computed behind a
 * button: a changed order, ignore, strength or mode redraws the plan at once (story 29).
 *
 * **Goals.** One row per goal, rank 1 first: rank, name and weight, the strength selector and its help on the
 * rank 1 row only, two move buttons and an ignore toggle. At least one goal stays active (story 4): the last
 * active goal's ignore button is disabled. The state keeps `ignored` as a list; the engine takes a record, and
 * the page converts at this boundary.
 *
 * **Ignored goals buy nothing (story 3).** The engine spends leftover points on fillers (no value for any
 * goal) and never in an ignored goal's tree, so those points go to an active tree or are shown as left over.
 *
 * **Points.** Only the points the player types are used: the game's points-per-level table below hero level 86
 * is not known to us (only "10 per level from 86"), and a per-level rate alone cannot give a total, so a figure
 * is never invented from the level. Until one is typed the page says so (story 40) and plans nothing.
 *
 * **Army.** The unit kinds that count are read from the account (`armyKinds.ts`) and the player may add more
 * by ticking them; a kind the army already has is shown ticked and fixed. Engineers have no tick (the saved
 * plan has no engineers choice): they count when the engineers row is in use.
 *
 * Not shipped: the mockup's "Mark as spent" on the first card (the owner's call at build time); the rank
 * editor on the tree already moves the plan forward.
 *
 * Design rules 1, 3-5, 15, 17-24, 26, 28.
 */
import {
  ActionIcon,
  Badge,
  Button,
  Checkbox,
  Group,
  Paper,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
  VisuallyHidden,
} from '@mantine/core';
import { ArrowDown, ArrowUp, CircleHelp } from 'lucide-react';
import { useId, useMemo, useState } from 'react';

import { talents as TALENTS } from '@/data';
import { TALENT_TREES, type TalentRecord, type TalentTree as TreeId } from '@/data/types';
import {
  goalHasUnitStats,
  goalOfTree,
  planTalentPriorities,
  rankGain,
  TALENT_GOALS as GOAL_STATS,
  talentGoalWeights,
  type TalentPriority,
  type TalentPriorityStep,
  type UnitKind,
} from '@/engine/talents';
import {
  TALENT_MODES,
  TALENT_STRENGTHS,
  TALENT_UNIT_KINDS,
  type TalentGoal,
  type TalentMode,
  type TalentStrength,
  type TalentUnitKind,
  type Talents,
} from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { Disclosure, NumberField, Panel } from '@/ui/kit';

import { fieldedKinds } from './armyKinds';
import { GOAL_LABELS, KIND_LABELS, percent, statLabel, TREE_LABELS, TREE_SHORT } from './labels';
import { treePoints } from './spentPoints';
import classes from './talents.module.css';
import { TalentTree } from './TalentTree';

const BY_ID = new Map(TALENTS.map((t) => [t.id, t]));

const STRENGTH_LABELS: Readonly<Record<TalentStrength, string>> = {
  focus: 'Focus',
  lean: 'Lean',
  even: 'Even',
};
const STRENGTH_HELP: Readonly<Record<TalentStrength, string>> = {
  focus: 'Rank 2 counts half, rank 3 a quarter. Lower goals get only the points a top goal cannot use well.',
  lean: 'Rank 2 counts 80 %, rank 3 60 %. Cheap wins on lower goals show up early.',
  even: 'Every goal counts the same, so the order does not matter.',
};
const MODE_LABELS: Readonly<Record<TalentMode, string>> = { blended: 'Blended', strict: 'Strict order' };
const MODE_HELP: Readonly<Record<TalentMode, string>> = {
  blended: 'One list: each point goes where it adds the most after the goal weights.',
  strict: 'Fills rank 1 first, then rank 2, then rank 3.',
};

const plural = (n: number, word: string): string => `${String(n)} ${word}${n === 1 ? '' : 's'}`;

/** The weight shown on a goal row: "Weight 0.5". */
const weightWords = (w: number): string => `Weight ${String(Math.round(w * 100) / 100)}`;

export function TalentsPage() {
  const profile = useStore(selectActiveProfile);
  const updateProfile = useStore((state) => state.updateProfile);
  const [tree, setTree] = useState<TreeId | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [message, setMessage] = useState('');
  const helpId = useId();

  const talentsState = profile?.talents;
  const fielded = useMemo(
    () => (profile === undefined ? new Set<UnitKind>() : fieldedKinds(profile)),
    [profile],
  );
  const forced = talentsState?.forcedUnitKinds;
  const kinds = useMemo(() => new Set<UnitKind>([...fielded, ...(forced ?? [])]), [fielded, forced]);

  const plan = useMemo(() => {
    if (talentsState === undefined) return null;
    const ranks: Record<number, number> = {};
    for (const [key, value] of Object.entries(talentsState.ranks)) ranks[Number(key)] = value;
    const priority: TalentPriority = {
      order: talentsState.goals,
      ignored: Object.fromEntries(talentsState.ignored.map((g) => [g, true])),
      strength: talentsState.strength,
      mode: talentsState.mode,
    };
    return {
      plan: planTalentPriorities({
        talents: TALENTS,
        heroLevel: talentsState.heroLevel,
        points: talentsState.pointsOverride ?? 0,
        ranks,
        priority,
        weightsByGoal: talentsState.weights,
        kinds,
      }),
      goalWeights: talentGoalWeights(priority),
    };
  }, [talentsState, kinds]);

  if (profile === undefined || talentsState === undefined || plan === null) return null;
  const { plan: result, goalWeights } = plan;

  const edit = (patch: Partial<Talents>): void => {
    updateProfile(profile.id, (current) => ({ talents: { ...current.talents, ...patch } }));
  };

  const order = talentsState.goals;
  const ignored = new Set(talentsState.ignored);
  const active = order.filter((g) => !ignored.has(g));
  const first = active[0] ?? order[0]!;
  const points = talentsState.pointsOverride;
  const viewTree = tree ?? first; // the rank 1 goal opens the tree of its own name
  const activeStats = active.flatMap((g) => GOAL_STATS[g]);
  const shownStats = activeStats.filter((s) => (result.before[s] ?? 0) !== 0 || (result.after[s] ?? 0) !== 0);
  const gate = result.nextGate === null ? null : BY_ID.get(result.nextGate.nodeId);
  const unitStats = active.some((g) => goalHasUnitStats(g));

  const move = (goal: TalentGoal, delta: -1 | 1): void => {
    const i = order.indexOf(goal);
    const target = i + delta;
    if (i < 0 || target < 0 || target >= order.length) return;
    const next = [...order];
    next.splice(i, 1);
    next.splice(target, 0, goal);
    edit({ goals: next });
    // The rank the row shows: among the active goals only; an ignored goal has none.
    const nextActive = next.filter((g) => !ignored.has(g));
    setMessage(
      ignored.has(goal)
        ? `${GOAL_LABELS[goal]} moved ${delta < 0 ? 'up' : 'down'}. It is ignored.`
        : `${GOAL_LABELS[goal]} is now ${String(nextActive.indexOf(goal) + 1)} of ${String(nextActive.length)}.`,
    );
  };

  const toggleIgnore = (goal: TalentGoal): void => {
    if (ignored.has(goal)) edit({ ignored: talentsState.ignored.filter((g) => g !== goal) });
    else if (active.length > 1) edit({ ignored: [...talentsState.ignored, goal] });
  };

  const setRank = (id: number, rank: number): void => {
    updateProfile(profile.id, (current) => {
      const ranks = { ...current.talents.ranks };
      if (rank <= 0) delete ranks[String(id)];
      else ranks[String(id)] = rank;
      return { talents: { ...current.talents, ranks } };
    });
  };

  const rankOf = new Map(active.map((g, i) => [g, i + 1]));

  return (
    <Stack gap="lg">
      <Panel
        component="section"
        title="Hero talents"
        meta={`${GOAL_LABELS[first]} first, level ${String(talentsState.heroLevel)}`}
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

          <Stack gap={6}>
            <Text fw={600} size="sm">
              Goals, most wanted first
            </Text>
            <Stack
              component="ul"
              gap={4}
              aria-label="Goals, most wanted first"
              style={{ listStyle: 'none', margin: 0, padding: 0 }}
            >
              {order.map((goal, index) => {
                const off = ignored.has(goal);
                const rank = rankOf.get(goal) ?? null;
                const isFirst = rank === 1;
                const name = GOAL_LABELS[goal];
                return (
                  <Paper
                    key={goal}
                    component="li"
                    withBorder
                    p={6}
                    radius="sm"
                    className={classes.goalRow}
                    data-off={off}
                  >
                    <Text fw={700} ta="center" className={classes.goalRank} aria-hidden={off}>
                      {rank ?? ''}
                    </Text>
                    <div className={classes.goalName}>
                      <Text fw={600} size="sm" {...(off ? { c: 'dimmed' } : {})}>
                        {name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {off ? 'Ignored' : weightWords(goalWeights[goal])}
                      </Text>
                    </div>
                    {isFirst && (
                      <Group gap={4} wrap="nowrap" className={classes.goalStrength}>
                        <SegmentedControl
                          size="xs"
                          aria-label="Strength of rank 1"
                          value={talentsState.strength}
                          data={TALENT_STRENGTHS.map((s) => ({ value: s, label: STRENGTH_LABELS[s] }))}
                          onChange={(v) => {
                            const next = TALENT_STRENGTHS.find((s) => s === v);
                            if (next !== undefined) edit({ strength: next });
                          }}
                        />
                        <ActionIcon
                          variant="subtle"
                          color="slate"
                          size="md"
                          aria-label="What Focus, Lean and Even mean"
                          aria-expanded={helpOpen}
                          aria-controls={helpId}
                          onClick={() => {
                            setHelpOpen((open) => !open);
                          }}
                        >
                          <CircleHelp size={16} aria-hidden />
                        </ActionIcon>
                      </Group>
                    )}
                    <Group gap={2} wrap="nowrap" className={classes.goalMoves}>
                      <ActionIcon
                        variant="subtle"
                        color="slate"
                        size="md"
                        aria-label={`Move ${name} up`}
                        disabled={index === 0}
                        onClick={() => {
                          move(goal, -1);
                        }}
                      >
                        <ArrowUp size={14} aria-hidden />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="slate"
                        size="md"
                        aria-label={`Move ${name} down`}
                        disabled={index === order.length - 1}
                        onClick={() => {
                          move(goal, 1);
                        }}
                      >
                        <ArrowDown size={14} aria-hidden />
                      </ActionIcon>
                      <Button
                        size="compact-sm"
                        variant={off ? 'filled' : 'default'}
                        aria-label={`Ignore ${name}`}
                        aria-pressed={off}
                        disabled={!off && active.length <= 1}
                        onClick={() => {
                          toggleIgnore(goal);
                        }}
                      >
                        {off ? 'Ignored' : 'Ignore'}
                      </Button>
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
            <VisuallyHidden role="status">{message}</VisuallyHidden>
            <div id={helpId} hidden={!helpOpen}>
              {helpOpen && (
                <Stack gap={4}>
                  {TALENT_STRENGTHS.map((s) => (
                    <Text key={s} size="sm">
                      <Text span fw={600}>{`${STRENGTH_LABELS[s]}. `}</Text>
                      {STRENGTH_HELP[s]}
                    </Text>
                  ))}
                </Stack>
              )}
            </div>
          </Stack>

          <Stack gap={4}>
            <Text fw={600} size="sm">
              How points are spread
            </Text>
            <SegmentedControl
              aria-label="How points are spread"
              value={talentsState.mode}
              data={TALENT_MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
              onChange={(v) => {
                const next = TALENT_MODES.find((m) => m === v);
                if (next !== undefined) edit({ mode: next });
              }}
              style={{ alignSelf: 'flex-start', maxWidth: '100%' }}
            />
            <Text size="sm" c="dimmed">
              {MODE_HELP[talentsState.mode]}
            </Text>
          </Stack>

          <Disclosure title="Weights" summary="Every stat counts 1 unless you change it">
            <Stack gap="md">
              {active.map((goal) => (
                <Stack key={goal} gap="xs">
                  <Text fw={600} size="sm">
                    {GOAL_LABELS[goal]}
                  </Text>
                  {GOAL_STATS[goal].map((stat) => (
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
              ))}
            </Stack>
          </Disclosure>
          {unitStats && (
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
        title="Spend your next points"
        meta={points === null ? undefined : plural(points, 'point')}
      >
        <Stack gap="md">
          {points === null ? (
            <Text>
              Type the points you have to spend. The game&apos;s points per hero level are only known from
              level 86 (10 each), so the page cannot work out your total from the level alone.
            </Text>
          ) : result.steps.length === 0 ? (
            <Text>
              {points === 0
                ? 'No points to spend, so there is nothing to plan.'
                : kinds.size === 0 && unitStats
                  ? 'Nothing to plan: no unit counts yet. Set your troops, or tick a kind of unit under Units that count.'
                  : 'No node open at this hero level adds anything for your goals and army, so nothing is planned.'}
            </Text>
          ) : (
            <>
              <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
                {result.steps.slice(0, 2).map((step, i) => (
                  <StepCard key={`${String(step.nodeId)}-${String(step.rank)}`} step={step} next={i === 0} />
                ))}
              </SimpleGrid>
              <Text size="sm">
                Plan spends {String(result.pointsSpent)} of {String(points)} points
                {result.pointsLeft > 0 ? `, ${String(result.pointsLeft)} left.` : '.'} The tree below shows
                every step in order.
              </Text>
              {result.pointsLeft > 0 && (
                <Text size="sm" c="dimmed">
                  {plural(result.pointsLeft, 'point')} left over: less than the cheapest rank still open
                  {ignored.size > 0 ? ', or only in a goal you ignore' : ''}.
                </Text>
              )}
            </>
          )}
          {gate !== null && gate !== undefined && result.nextGate !== null && (
            <Text size="sm">
              At level {String(result.nextGate.level)}, {gate.name} opens, worth{' '}
              {percent(result.nextGate.value)} for {plural(result.nextGate.points, 'point')}.
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
                  {percent(result.before[stat] ?? 0)} to {percent(result.after[stat] ?? 0)}
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
            data={TALENT_TREES.map((t) => {
              const counts = treePoints(TALENTS, t, talentsState.ranks, result.steps);
              return {
                value: t,
                label: (
                  <span style={{ display: 'grid', lineHeight: 1.2 }}>
                    <span>{TREE_SHORT[t]}</span>
                    <span>{`${String(counts.spent)} spent`}</span>
                    {counts.planned > 0 && <span>{`${String(counts.planned)} planned`}</span>}
                  </span>
                ),
              };
            })}
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
            plan={result}
            selected={selected}
            onSelect={setSelected}
            onRank={setRank}
          />
        </Stack>
      </Panel>
    </Stack>
  );
}

/** One card: the talent and rank, its goal, the gain, and whether it only opens a stronger talent. */
function StepCard({ step, next }: { step: TalentPriorityStep; next: boolean }) {
  const rec: TalentRecord = BY_ID.get(step.nodeId)!;
  const title = next ? 'Next point' : 'Then';
  const goal = step.goal ?? goalOfTree(rec.tree);
  const gain = rankGain(rec.values, step.rank);
  const opened = step.opens === null ? null : BY_ID.get(step.opens);
  return (
    <Paper
      component="article"
      aria-label={title}
      withBorder
      p="sm"
      radius="sm"
      className={classes.stepCard}
      data-next={next}
    >
      <Stack gap={4}>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase">
          {title}
        </Text>
        <Text fw={700} size={next ? 'lg' : 'md'}>
          {rec.name}
          <Text span c="dimmed" fw={400} size="sm">{`, rank ${String(step.rank)}`}</Text>
        </Text>
        <Group gap="xs">
          <Badge variant="light" color="gray">
            {GOAL_LABELS[goal]}
          </Badge>
          <Text size="sm" c="dimmed">
            {plural(step.cost, 'point')}
          </Text>
        </Group>
        <Text fw={600}>
          {`${gain >= 0 ? '+' : ''}${percent(gain)} ${rec.stats.map(statLabel).join(', ')}`}
        </Text>
        {opened !== null && opened !== undefined && (
          <Text size="sm">{`Opens a stronger talent: ${opened.name}`}</Text>
        )}
        {step.filler && (
          <Text size="sm" c="dimmed">
            No gain for your goals: it spends points nothing better can use.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
