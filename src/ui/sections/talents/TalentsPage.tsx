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
  Tooltip,
  VisuallyHidden,
} from '@mantine/core';
import { ArrowDown, ArrowUp, CircleHelp, RotateCcw } from 'lucide-react';
import { useId, useMemo, useState } from 'react';

import { talents as TALENTS } from '@/data';
import { TALENT_TREES, type TalentRecord, type TalentTree as TreeId } from '@/data/types';
import {
  goalHasUnitStats,
  STATS_OFF_BY_DEFAULT,
  STRENGTH_SHARES,
  withDefaultStatWeights,
  goalOfTree,
  planTalentPriorities,
  rankGain,
  TALENT_GOALS as GOAL_STATS,
  talentGoalWeights,
  type TalentPriority,
  type TroopGroup,
  type TalentPriorityStep,
  type UnitKind,
} from '@/engine/talents';
import {
  TALENT_CRYPT_TYPES,
  TALENT_MODES,
  TALENT_TROOP_GROUPS,
  TALENT_STRENGTHS,
  TALENT_UNIT_KINDS,
  type TalentCryptType,
  type TalentGoal,
  type TalentMode,
  type TalentStrength,
  type TalentUnitKind,
  type Talents,
} from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { Disclosure, NumberField, Panel } from '@/ui/kit';

import { AllTalentsAnalysis } from './AllTalentsAnalysis';
import { CopyToBattle } from './CopyToBattle';
import { fieldedGroups, fieldedKinds } from './armyKinds';
import { GOAL_LABELS, KIND_LABELS, percent, statLabel, TREE_LABELS, TREE_SHORT } from './labels';
import { spentPoints, stepsUpToNode, treePoints, unlockChain } from './spentPoints';
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

/** The groups the measured strength shares are shown for, in the order a player reads them. */
const SHARE_LABELS: readonly (readonly [keyof typeof STRENGTH_SHARES, string])[] = [
  ['army', 'Army'],
  ['guardsmen', 'Guardsmen'],
  ['mounted', 'Mounted'],
  ['melee', 'Melee'],
  ['ranged', 'Ranged'],
  ['specialist', 'Specialists'],
  ['monster', 'Monsters'],
  ['flying', 'Flying'],
];
const SHARES_NOTE = `A strength point counts by troop group, measured on 22 armies: ${SHARE_LABELS.map(
  ([key, label]) => `${label} x${String(STRENGTH_SHARES[key])}`,
).join(', ')}.`;

const GROUP_LABELS: Readonly<Record<TroopGroup, string>> = {
  guardsmen: 'Guardsmen',
  specialist: 'Specialists',
  monster: 'Monsters',
  engineers: 'Engineers',
};

const CRYPT_LABELS: Readonly<Record<TalentCryptType, string>> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
};

const STRENGTH_TIP = TALENT_STRENGTHS.map((x) => `${STRENGTH_LABELS[x]}. ${STRENGTH_HELP[x]}`).join(' ');
const MODE_TIP = TALENT_MODES.map((m) => `${MODE_LABELS[m]}. ${MODE_HELP[m]}`).join(' ');

const plural = (n: number, word: string): string => `${String(n)} ${word}${n === 1 ? '' : 's'}`;

/** The weight shown on a goal row: "Weight 0.5". */
const weightWords = (w: number): string => `Weight ${String(Math.round(w * 100) / 100)}`;

export function TalentsPage() {
  const profile = useStore(selectActiveProfile);
  const updateProfile = useStore((state) => state.updateProfile);
  const [tree, setTree] = useState<TreeId | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  // A ranking row asked for a talent: the tree opens on it, selects it and scrolls it into view (B-29).
  const [reveal, setReveal] = useState<{ id: number; at: number } | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [modeHelpOpen, setModeHelpOpen] = useState(false);
  const modeHelpId = useId();
  const [message, setMessage] = useState('');
  const helpId = useId();

  const talentsState = profile?.talents;
  const fielded = useMemo(
    () => (profile === undefined ? new Set<UnitKind>() : fieldedKinds(profile)),
    [profile],
  );
  const fieldedGroupSet = useMemo(
    () => (profile === undefined ? new Set<TroopGroup>() : fieldedGroups(profile)),
    [profile],
  );
  const overrides = talentsState?.groupOverrides;
  /** The groups that count: what the account fields, then the player's own switches over it. */
  const groups = useMemo(() => {
    const out = new Set<TroopGroup>(fieldedGroupSet);
    for (const group of TALENT_TROOP_GROUPS) {
      const forcedState = overrides?.[group];
      if (forcedState === true) out.add(group);
      else if (forcedState === false) out.delete(group);
    }
    return out;
  }, [fieldedGroupSet, overrides]);
  const forced = talentsState?.forcedUnitKinds;
  // Monsters and engineers are a kind and a group at once: a group switched on brings its kind.
  const kinds = useMemo(() => {
    const out = new Set<UnitKind>([...fielded, ...(forced ?? [])]);
    if (groups.has('monster')) out.add('monsters');
    if (groups.has('engineers')) out.add('engineers');
    return out;
  }, [fielded, forced, groups]);

  const plan = useMemo(() => {
    if (talentsState === undefined) return null;
    const ranks: Record<number, number> = {};
    for (const [key, value] of Object.entries(talentsState.ranks)) ranks[Number(key)] = value;
    // The stock is what the player has in all; the ranks he holds have spent part of it.
    const heldCost = TALENT_TREES.reduce((sum, t) => sum + spentPoints(TALENTS, t, talentsState.ranks), 0);
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
        points: Math.max(0, (talentsState.pointsOverride ?? 0) - heldCost),
        ranks,
        priority,
        weightsByGoal: withDefaultStatWeights(talentsState.weights),
        kinds,
        crypts: talentsState.crypts,
        groups,
      }),
      goalWeights: talentGoalWeights(priority),
      heldCost,
    };
  }, [talentsState, kinds, groups]);

  if (profile === undefined || talentsState === undefined || plan === null) return null;
  const { plan: result, goalWeights, heldCost } = plan;

  const edit = (patch: Partial<Talents>): void => {
    updateProfile(profile.id, (current) => ({ talents: { ...current.talents, ...patch } }));
  };

  const order = talentsState.goals;
  const ignored = new Set(talentsState.ignored);
  const active = order.filter((g) => !ignored.has(g));
  const first = active[0] ?? order[0]!;
  const stock = talentsState.pointsOverride;
  const left = stock === null ? null : Math.max(0, stock - heldCost);
  const over = stock === null ? 0 : Math.max(0, heldCost - stock);
  const viewTree = tree ?? first; // the rank 1 goal opens the tree of its own name
  const activeStats = active.flatMap((g) => GOAL_STATS[g]);
  const shownStats = activeStats.filter((s) => (result.before[s] ?? 0) !== 0 || (result.after[s] ?? 0) !== 0);
  const gate = result.nextGate === null ? null : BY_ID.get(result.nextGate.nodeId);
  const unitStats = active.some((g) => goalHasUnitStats(g));

  const showTalent = (id: number): void => {
    const node = BY_ID.get(id);
    if (node === undefined) return;
    setTree(node.tree);
    setSelected(id);
    setReveal({ id, at: Date.now() });
  };

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

  /** Take these plan steps: every node on the way reaches its planned rank. */
  const spendSteps = (steps: readonly TalentPriorityStep[]): void => {
    if (steps.length === 0) return;
    updateProfile(profile.id, (current) => {
      const ranks = { ...current.talents.ranks };
      for (const step of steps)
        ranks[String(step.nodeId)] = Math.max(ranks[String(step.nodeId)] ?? 0, step.rank);
      return { talents: { ...current.talents, ranks } };
    });
    const cost = steps.reduce((sum, step) => sum + step.cost, 0);
    setMessage(`Spent ${plural(cost, 'point')} on ${plural(steps.length, 'step')} of the plan.`);
  };

  /** Spend the plan from its first step to step `index`, inclusive, in every tree (the second card). */
  const spendPlanTo = (index: number): void => {
    spendSteps(result.steps.slice(0, index + 1));
  };

  /** Spend the open tree's steps up to a node and its neighbours on the same level. */
  const spendPlanToNode = (nodeId: number): void => {
    spendSteps(stepsUpToNode(TALENTS, result.steps, nodeId));
  };

  /** Give back every rank held in one tree. */
  const resetTree = (id: TreeId): void => {
    const inTree = new Set(TALENTS.filter((t) => t.tree === id).map((t) => String(t.id)));
    updateProfile(profile.id, (current) => {
      const ranks = Object.fromEntries(Object.entries(current.talents.ranks).filter(([k]) => !inTree.has(k)));
      return { talents: { ...current.talents, ranks } };
    });
    setSelected(null);
    setMessage(`${TREE_LABELS[id]} reset: its points are back in your stock.`);
  };

  /**
   * Buy up to `count` ranks of a node, as the game does: one at a time while the stock pays. A node that is only
   * locked by a parent opens first by buying one rank in each ancestor that holds none; a hero-level lock
   * cannot be bought round.
   */
  const buy = (id: number, count: number): void => {
    const rec = BY_ID.get(id);
    if (rec === undefined) return;
    const bought = talentsState.ranks[String(id)] ?? 0;
    if (bought >= rec.maxRank) {
      setMessage(`${rec.name} is at its maximum.`);
      return;
    }
    const lock = bought === 0 ? result.locked[id] : undefined;
    if (lock?.reason === 'level') {
      setMessage(`${rec.name} needs hero level ${String(lock.level)}.`);
      return;
    }
    if (stock === null) {
      setMessage('Not enough points: type your stock of talent points first.');
      return;
    }
    const chain = lock === undefined ? [] : unlockChain(TALENTS, talentsState.ranks, id);
    let have = left ?? 0;
    const unlockCost = chain.reduce((sum, c) => sum + (BY_ID.get(c)?.costs[0] ?? 0), 0);
    let take = 0;
    if (unlockCost <= have) {
      have -= unlockCost;
      while (take < count && bought + take < rec.maxRank) {
        const c = rec.costs[bought + take] ?? 0;
        if (c > have) break;
        have -= c;
        take++;
      }
    }
    if (take === 0) {
      const need = unlockCost + (rec.costs[bought] ?? 0);
      setMessage(
        `Not enough points: ${rec.name} rank ${String(bought + 1)} costs ${String(need)}${chain.length > 0 ? ' with the nodes above it' : ''}, you have ${String(left ?? 0)} left.`,
      );
      return;
    }
    updateProfile(profile.id, (current) => {
      const ranks = { ...current.talents.ranks };
      for (const c of chain) ranks[String(c)] = Math.max(ranks[String(c)] ?? 0, 1);
      ranks[String(id)] = bought + take;
      return { talents: { ...current.talents, ranks } };
    });
    const opened = chain.map((c) => BY_ID.get(c)?.name ?? '');
    setMessage(
      `${opened.length > 0 ? `Opened ${opened.join(', ')}. ` : ''}${rec.name} is now rank ${String(bought + take)}. ${String(have)} points left.`,
    );
  };

  /** A click on +: one rank. */
  const spend = (id: number): void => {
    buy(id, 1);
  };

  const rankOf = new Map(active.map((g, i) => [g, i + 1]));

  const strip = (
    <div className={classes.strip} role="region" aria-label="Points and trees">
      <SegmentedControl
        size="xs"
        styles={{ root: { maxWidth: '100%' }, label: { paddingInline: 6, minWidth: 0 } }}
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
      <div className={classes.stripTotals} role="group" aria-label="Points">
        <span className={classes.bannerSeg}>
          <small>All trees</small>
          <b>{String(heldCost)} spent</b>
          {result.pointsSpent > 0 && <span>{`+ ${String(result.pointsSpent)} planned`}</span>}
          {stock !== null && <span>{`of ${String(stock)} in all`}</span>}
        </span>
        <span className={classes.bannerSeg} data-empty={left === 0}>
          <small>Remaining</small>
          <b>{left === null ? 'Type your points first' : `${String(left)} left`}</b>
        </span>
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<RotateCcw size={14} aria-hidden />}
          disabled={spentPoints(TALENTS, viewTree, talentsState.ranks) === 0}
          onClick={() => {
            resetTree(viewTree);
          }}
        >
          {`Reset points spent in ${TREE_LABELS[viewTree]}`}
        </Button>
      </div>
    </div>
  );

  return (
    <Stack gap="lg">
      <div className={classes.top} data-totals={shownStats.length > 0}>
        <Panel
          component="section"
          title="Hero talents"
          meta={`${GOAL_LABELS[first]} first, level ${String(talentsState.heroLevel)}`}
        >
          <Stack gap="md">
            <Group gap="md" align="flex-start">
              <NumberField
                w={120}
                label="Hero level"
                value={talentsState.heroLevel}
                min={1}
                max={1000}
                onChange={(v) => {
                  edit({ heroLevel: Math.min(1000, Math.max(1, v ?? 1)) });
                }}
              />
              <NumberField
                w={240}
                label="Talent points (your whole stock)"
                value={stock}
                allowEmpty
                min={0}
                onChange={(v) => {
                  edit({ pointsOverride: v });
                }}
              />
              <Stack gap={4}>
                <Text size="sm" fw={500}>
                  How points are spread
                </Text>
                <Group gap={4} wrap="nowrap">
                  <SegmentedControl
                    size="xs"
                    aria-label="How points are spread"
                    value={talentsState.mode}
                    data={TALENT_MODES.map((m) => ({ value: m, label: MODE_LABELS[m] }))}
                    onChange={(v) => {
                      const next = TALENT_MODES.find((m) => m === v);
                      if (next !== undefined) edit({ mode: next });
                    }}
                  />
                  <Tooltip multiline w={280} withArrow label={MODE_TIP}>
                    <ActionIcon
                      variant="subtle"
                      color="slate"
                      size="md"
                      aria-label="What Blended and Strict order mean"
                      aria-expanded={modeHelpOpen}
                      aria-controls={modeHelpId}
                      onClick={() => {
                        setModeHelpOpen((open) => !open);
                      }}
                    >
                      <CircleHelp size={16} aria-hidden />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Stack>
            </Group>
            <div id={modeHelpId} hidden={!modeHelpOpen}>
              {modeHelpOpen && (
                <Stack gap={4}>
                  {TALENT_MODES.map((m) => (
                    <Text key={m} size="sm">
                      <Text span fw={600}>{`${MODE_LABELS[m]}. `}</Text>
                      {MODE_HELP[m]}
                    </Text>
                  ))}
                </Stack>
              )}
            </div>

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
                          <Tooltip multiline w={280} withArrow label={STRENGTH_TIP}>
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
                          </Tooltip>
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
          </Stack>
        </Panel>
        <Panel component="section" title="Battle bonuses" meta="Held ranks only">
          <CopyToBattle />
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
      </div>

      <Panel component="section" title="Bonuses selected" meta="What counts toward the plan">
        <Stack gap="xs">
          <Disclosure title="Weights" summary="Tick the stats you want; each counts 1 unless you change it">
            <div className={classes.goalCols}>
              {active.map((goal) => (
                <Stack key={goal} gap="xs">
                  <Text fw={600} size="sm">
                    {GOAL_LABELS[goal]}
                  </Text>
                  {goal === 'battle' && (
                    <Text size="xs" c="dimmed">
                      {SHARES_NOTE}
                    </Text>
                  )}
                  <div className={classes.statGrid}>
                    {GOAL_STATS[goal].map((stat) => {
                      const offByDefault = STATS_OFF_BY_DEFAULT[goal].includes(stat);
                      const weight = talentsState.weights[goal]?.[stat] ?? (offByDefault ? 0 : 1);
                      // A tick sets the weight to 1 and an untick to 0; going back to the default drops the override.
                      const setWeight = (v: number | null): void => {
                        const rest = { ...talentsState.weights[goal] };
                        if (v === null || v === (offByDefault ? 0 : 1)) delete rest[stat];
                        else rest[stat] = v;
                        edit({ weights: { ...talentsState.weights, [goal]: rest } });
                      };
                      return (
                        <div key={stat} className={classes.statCell}>
                          <Checkbox
                            label={statLabel(stat)}
                            checked={weight > 0}
                            onChange={(event) => setWeight(event.currentTarget.checked ? 1 : 0)}
                          />
                          <div className={classes.statWeight}>
                            <NumberField
                              label="Weight"
                              accessibleName={`Weight of ${statLabel(stat)}`}
                              value={weight}
                              allowDecimal
                              allowEmpty
                              min={0}
                              w={64}
                              onChange={setWeight}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Stack>
              ))}
            </div>
          </Disclosure>
          {goalHasUnitStats('battle') && active.includes('battle') && (
            <Disclosure
              title="Troop groups"
              summary={
                TALENT_TROOP_GROUPS.filter((g) => groups.has(g))
                  .map((g) => GROUP_LABELS[g])
                  .join(', ') || 'None'
              }
            >
              <Stack gap="xs">
                {TALENT_TROOP_GROUPS.map((group) => {
                  const inArmy = fieldedGroupSet.has(group);
                  return (
                    <Checkbox
                      key={group}
                      label={GROUP_LABELS[group]}
                      description={inArmy ? 'In your army' : undefined}
                      checked={groups.has(group)}
                      onChange={(event) => {
                        const on = event.currentTarget.checked;
                        const rest = { ...talentsState.groupOverrides };
                        // Back to what the account says is no override at all.
                        if (on === inArmy) delete rest[group];
                        else rest[group] = on;
                        edit({ groupOverrides: rest });
                      }}
                    />
                  );
                })}
                <Text size="sm" c="dimmed">
                  A group you do not use gets no points, beyond the one rank that opens a stronger talent.
                </Text>
              </Stack>
            </Disclosure>
          )}
          {active.includes('archeology') && (
            <Disclosure
              title="Crypts that count"
              summary={
                talentsState.crypts.length === 0
                  ? 'None'
                  : TALENT_CRYPT_TYPES.filter((c) => talentsState.crypts.includes(c))
                      .map((c) => CRYPT_LABELS[c])
                      .join(', ')
              }
            >
              <Stack gap="xs">
                {TALENT_CRYPT_TYPES.map((type) => (
                  <Checkbox
                    key={type}
                    label={`${CRYPT_LABELS[type]} crypts`}
                    checked={talentsState.crypts.includes(type)}
                    onChange={(event) => {
                      const rest = talentsState.crypts.filter((c) => c !== type);
                      edit({
                        crypts: event.currentTarget.checked
                          ? TALENT_CRYPT_TYPES.filter((c) => c === type || rest.includes(c))
                          : rest,
                      });
                    }}
                  />
                ))}
              </Stack>
            </Disclosure>
          )}
          {unitStats && (
            <Disclosure
              title="Units that count"
              summary={[...kinds].map((k) => KIND_LABELS[k]).join(', ') || 'None'}
            >
              <Stack gap="xs">
                {TALENT_UNIT_KINDS.filter((kind) => kind !== 'monsters').map((kind) => {
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

      <Panel component="section" aria-label="Spend your next points">
        <Disclosure
          title="Spend your next points"
          summary={
            stock === null || left === null
              ? 'Type your points first'
              : `${String(left)} of ${String(stock)} points left`
          }
        >
          <Stack gap="md">
            {stock === null ? (
              <Text>
                Type your whole stock of talent points. The game&apos;s points per hero level are only known
                from level 86 (10 each), so the page cannot work out your total from the level alone. The
                ranks you hold, or click on the tree, spend it, and the plan works on what is left.
              </Text>
            ) : result.steps.length === 0 ? (
              <Text>
                {over > 0
                  ? `The ranks you hold cost ${plural(over, 'point')} more than your stock. Raise the stock, or take a rank back.`
                  : left === 0
                    ? 'No points left to spend, so there is nothing to plan.'
                    : kinds.size === 0 && unitStats
                      ? 'Nothing to plan: no unit counts yet. Set your troops, or tick a kind of unit under Units that count.'
                      : 'No node open at this hero level adds anything for your goals and army, so nothing is planned.'}
              </Text>
            ) : (
              <>
                <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="sm">
                  {result.steps.slice(0, 2).map((step, i) => (
                    <StepCard
                      key={`${String(step.nodeId)}-${String(step.rank)}`}
                      step={step}
                      next={i === 0}
                      onSpend={i === 0 ? spend : undefined}
                      onSpendUpToHere={
                        i > 0
                          ? () => {
                              spendPlanTo(i);
                            }
                          : undefined
                      }
                    />
                  ))}
                </SimpleGrid>
                <Text size="sm">
                  Plan spends {String(result.pointsSpent)} of {String(left ?? 0)} points
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
        </Disclosure>
      </Panel>

      <Panel component="section" title="Tree" meta={TREE_LABELS[viewTree]}>
        <Stack gap="md">
          <AllTalentsAnalysis onSelect={showTalent} />
          <TalentTree
            header={strip}
            talents={TALENTS}
            tree={viewTree}
            ranks={talentsState.ranks}
            plan={result}
            selected={selected}
            onSelect={setSelected}
            onRank={setRank}
            onSpend={spend}
            onMax={(id) => {
              buy(id, Infinity);
            }}
            onSpendPlan={spendPlanToNode}
            reveal={reveal}
          />
        </Stack>
      </Panel>
    </Stack>
  );
}

/** One card: the talent and rank, its goal, the gain, and whether it only opens a stronger talent. */
function StepCard({
  step,
  next,
  onSpend,
  onSpendUpToHere,
}: {
  step: TalentPriorityStep;
  next: boolean;
  onSpend: ((id: number) => void) | undefined;
  onSpendUpToHere: (() => void) | undefined;
}) {
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
        {onSpendUpToHere !== undefined && (
          <Button size="xs" variant="light" style={{ alignSelf: 'flex-start' }} onClick={onSpendUpToHere}>
            Spend up to here
          </Button>
        )}
        {onSpend !== undefined && (
          <Button
            size="xs"
            variant="light"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => {
              onSpend(step.nodeId);
            }}
          >
            Mark as spent
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
