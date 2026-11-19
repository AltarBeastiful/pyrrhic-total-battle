/**
 * One hero tree on the game's own grid (B-21): a tile per node at its column and row, showing the rank bought,
 * what the plan adds there, and why a node is locked. Tiles sit at the game's own column and row with a line to each parent, each with its name, an icon and its tier.
 * A rank shows only once held or planned; the maximum lives in the editor. Colour is never the only signal (rule 24): a locked tile is dashed and
 * says "Lv 65" or "Parent".
 */
import { ActionIcon, Button, Group, Stack, Text } from '@mantine/core';
import { Lock, Minus, Plus } from 'lucide-react';

import type { TalentRecord, TalentTree as TreeId } from '@/data/types';
import { rankGain, type TalentPlan } from '@/engine/talents';
import { Glyph } from '@/ui/domain/Glyph';
import { NumberField } from '@/ui/kit';

import { percent, statLabel, TREE_LABELS } from './labels';
import { pointsWords, treePoints } from './spentPoints';
import classes from './talents.module.css';
import { talentFamily, talentIcons } from './talentFamily';

/** Rule 10: a stepper only for a short run of values; Army strength has 150 ranks and takes the typed field alone. */
const STEPPER_MAX = 100;

export interface TalentTreeProps {
  talents: readonly TalentRecord[];
  tree: TreeId;
  ranks: Readonly<Record<string, number>>;
  plan: TalentPlan;
  selected: number | null;
  onSelect: (id: number) => void;
  onRank: (id: number, rank: number) => void;
  /** A click on a tile spends one rank on it, as in the game; the page checks the lock and the stock. */
  onSpend: (id: number) => void;
  /** Spend the plan from its first step to the step at this index, inclusive. */
  onSpendPlan: (index: number) => void;
}

/** What the plan adds to each node: the count of its steps. */
export function plannedByNode(plan: TalentPlan): Map<number, number> {
  const out = new Map<number, number>();
  for (const s of plan.steps) out.set(s.nodeId, (out.get(s.nodeId) ?? 0) + 1);
  return out;
}

/** Where each node first comes in the plan: its first step's place, 1-based (story 28). */
function firstStepByNode(plan: TalentPlan): Map<number, number> {
  const out = new Map<number, number>();
  plan.steps.forEach((s, i) => {
    if (!out.has(s.nodeId)) out.set(s.nodeId, i + 1);
  });
  return out;
}

function lockWords(plan: TalentPlan, id: number): string | null {
  const lock = plan.locked[id];
  if (lock === undefined) return null;
  return lock.reason === 'level' ? `Lv ${String(lock.level)}` : 'Parent';
}

/** The game's grid: six columns, cell size in px. Tiles are 124 x 104 inside a 144 x 128 cell. */
const CELL_W = 176;
const CELL_H = 152;
const TILE_W = 156;
const TILE_H = 128;
const COLS = 6;

export function TalentTree({
  talents,
  tree,
  ranks,
  plan,
  selected,
  onSelect,
  onRank,
  onSpend,
  onSpendPlan,
}: TalentTreeProps) {
  const nodes = talents.filter((t) => t.tree === tree);
  const added = plannedByNode(plan);
  const firstStep = firstStepByNode(plan);
  const node = nodes.find((n) => n.id === selected) ?? null;
  const points = treePoints(talents, tree, ranks, plan.steps);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rows = Math.max(...nodes.map((n) => n.layout.y)) + 1;
  const width = COLS * CELL_W;
  const height = rows * CELL_H;
  const centre = (n: TalentRecord): [number, number] => [
    n.layout.x * CELL_W + CELL_W / 2,
    n.layout.y * CELL_H + CELL_H / 2,
  ];
  // One line from each node to each of its parents, as the game draws them; a line into a node that is held
  // is firm, and a line into a node the plan spends on is bold and in the accent colour.
  const lines = nodes.flatMap((n) =>
    n.parents.flatMap((pid) => {
      const p = byId.get(pid);
      if (p === undefined) return [];
      const planned = (added.get(n.id) ?? 0) > 0;
      const lit = (ranks[String(n.id)] ?? 0) > 0 || planned;
      return [{ key: `${String(pid)}-${String(n.id)}`, from: centre(p), to: centre(n), lit, planned }];
    }),
  );

  return (
    <div className={classes.layout}>
      <Stack gap="md" style={{ minWidth: 0 }}>
        <Text fw={600}>
          {TREE_LABELS[tree]} · {pointsWords(points)}
        </Text>
        {/*
          Owner request (talents tree shape): the tree keeps the game's shape and, on a phone, pans sideways INSIDE
          this canvas (tile names stay at the 13 px floor). The page itself never scrolls sideways.
        */}
        <div className={classes.canvas} role="region" aria-label={`${TREE_LABELS[tree]} tree`} tabIndex={0}>
          <div className={classes.plane} style={{ width, height }}>
            <svg className={classes.lines} width={width} height={height} aria-hidden>
              {lines.map((l) => (
                <line
                  key={l.key}
                  x1={l.from[0]}
                  y1={l.from[1]}
                  x2={l.to[0]}
                  y2={l.to[1]}
                  className={classes.line}
                  data-lit={l.lit}
                  data-planned={l.planned}
                />
              ))}
            </svg>
            {nodes.map((n) => {
              const bought = ranks[String(n.id)] ?? 0;
              const plus = added.get(n.id) ?? 0;
              const step = firstStep.get(n.id) ?? null;
              const lock = bought === 0 && plus === 0 ? lockWords(plan, n.id) : null;
              const fam = talentFamily(n.name);
              const icons = talentIcons(n.name, n.stats);
              const state = plus > 0 ? 'planned' : lock !== null ? 'locked' : 'open';
              const spoken =
                `${n.name}, rank ${String(bought)} of ${String(n.maxRank)}` +
                (plus > 0 ? `, the plan adds ${String(plus)}` : '') +
                (step !== null ? `, from step ${String(step)} of the plan` : '') +
                (lock !== null
                  ? plan.locked[n.id]?.reason === 'level'
                    ? `, locked until hero level ${String(plan.locked[n.id]?.level)}`
                    : ', locked until a node above it has a rank'
                  : '');
              const full = bought >= n.maxRank;
              const barState = full ? 'full' : bought > 0 || plus > 0 ? 'part' : 'empty';
              return (
                <div
                  key={n.id}
                  className={classes.tileBox}
                  style={{
                    left: n.layout.x * CELL_W + (CELL_W - TILE_W) / 2,
                    top: n.layout.y * CELL_H + (CELL_H - TILE_H) / 2,
                    width: TILE_W,
                    height: TILE_H,
                  }}
                >
                  <button
                    type="button"
                    className={classes.tile}
                    data-state={state}
                    data-full={full}
                    aria-pressed={selected === n.id}
                    aria-label={spoken}
                    onClick={() => {
                      onSelect(n.id);
                      onSpend(n.id);
                    }}
                  >
                    <span className={classes.head}>
                      <span className={classes.icons}>
                        {icons.subject !== null && <Glyph kind={icons.subject} />}
                        <Glyph kind={icons.stat} />
                      </span>
                      {fam.numeral !== null && <span className={classes.tier}>{fam.numeral}</span>}
                    </span>
                    <span className={classes.name}>{fam.family}</span>
                    {n.maxRank > 1 && lock === null && (
                      <span className={classes.bar} data-bar-state={barState} aria-hidden>
                        <span
                          className={classes.barBought}
                          data-bar="bought"
                          style={{ width: `${String((bought / n.maxRank) * 100)}%` }}
                        />
                        <span
                          className={classes.barPlanned}
                          data-bar="planned"
                          style={{
                            width: `${String((Math.min(plus, n.maxRank - bought) / n.maxRank) * 100)}%`,
                          }}
                        />
                      </span>
                    )}
                    {(bought > 0 || plus > 0 || lock !== null) && (
                      <span className={classes.marks}>
                        {bought > 0 && (
                          <span>
                            {full ? `${String(bought)}/${String(n.maxRank)} max` : `rank ${String(bought)}`}
                          </span>
                        )}
                        {plus > 0 && <span>+{plus}</span>}
                        {lock !== null && (
                          <span
                            className={classes.lock}
                            data-lock={plan.locked[n.id]?.reason === 'level' ? 'level' : 'parent'}
                          >
                            <Lock size={12} aria-hidden />
                            {lock}
                          </span>
                        )}
                      </span>
                    )}
                  </button>
                  {bought > 0 && (
                    <button
                      type="button"
                      className={classes.takeBack}
                      aria-label={`Take one rank back from ${n.name}`}
                      onClick={() => {
                        onSelect(n.id);
                        onRank(n.id, bought - 1);
                      }}
                    >
                      <Minus size={14} aria-hidden />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <Text size="sm" c="dimmed">
          Lines join each node to the node above it that opens it; bold lines lead to nodes the plan spends
          on. Filled tiles are where the plan spends, and the bar on a tile shows its rank out of the maximum,
          the plan&apos;s share lighter. Dashed tiles are locked: Lv is the hero level they need, Parent means
          a node above them must hold a rank first.
        </Text>
      </Stack>
      <aside className={classes.detail} data-empty={node === null} aria-label="Selected node">
        {node !== null ? (
          <NodeEditor
            node={node}
            bought={ranks[String(node.id)] ?? 0}
            plan={plan}
            onRank={onRank}
            onSpendPlan={onSpendPlan}
          />
        ) : (
          <Text size="sm" c="dimmed">
            Tap a node to see what it adds and to set its rank.
          </Text>
        )}
      </aside>
    </div>
  );
}

function NodeEditor({
  node,
  bought,
  plan,
  onRank,
  onSpendPlan,
}: {
  node: TalentRecord;
  bought: number;
  plan: TalentPlan;
  onRank: (id: number, rank: number) => void;
  onSpendPlan: (index: number) => void;
}) {
  // The plan's last step on this node: spending up to it takes every step before it too.
  const lastStep = plan.steps.map((s) => s.nodeId).lastIndexOf(node.id);
  const toHere = lastStep < 0 ? 0 : plan.steps.slice(0, lastStep + 1).reduce((sum, s) => sum + s.cost, 0);
  const fam = talentFamily(node.name);
  const icons = talentIcons(node.name, node.stats);
  const lock = plan.locked[node.id];
  const next = bought < node.maxRank ? rankGain(node.values, bought + 1) : null;
  const set = (rank: number): void => {
    onRank(node.id, Math.max(0, Math.min(node.maxRank, rank)));
  };
  return (
    <Stack gap="xs" aria-label={`${node.name}`} role="group">
      <Group gap="xs" align="center">
        <span className={classes.icons} aria-hidden>
          {icons.subject !== null && <Glyph kind={icons.subject} />}
          <Glyph kind={icons.stat} />
        </span>
        <Text fw={600}>{fam.family}</Text>
        {fam.numeral !== null && <span className={classes.tier}>{fam.numeral}</span>}
      </Group>
      <Text size="sm" c="dimmed">
        {node.stats.map(statLabel).join(', ')}
        {bought > 0 ? `, now ${percent(node.values[bought - 1]!)}` : ''}
        {next !== null
          ? `. Next rank adds ${percent(next)} for ${String(node.costs[bought]!)} points.`
          : '. Fully ranked.'}
      </Text>
      {lock !== undefined && bought === 0 && (
        <Text size="sm">
          {lock.reason === 'level'
            ? `Locked until hero level ${String(lock.level)}.`
            : 'Locked until a node above it holds a rank.'}
        </Text>
      )}
      {lastStep >= 0 && (
        <Button
          size="xs"
          variant="light"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => {
            onSpendPlan(lastStep);
          }}
        >
          {`Spend the plan up to here (${String(toHere)} ${toHere === 1 ? 'point' : 'points'})`}
        </Button>
      )}
      <Group gap="xs" align="flex-end" wrap="nowrap">
        {node.maxRank <= STEPPER_MAX && (
          <ActionIcon
            variant="default"
            size={36}
            aria-label={`Lower ${node.name}`}
            disabled={bought <= 0}
            onClick={() => {
              set(bought - 1);
            }}
          >
            <Minus size={16} aria-hidden />
          </ActionIcon>
        )}
        <NumberField
          label="Rank bought"
          accessibleName={`Rank bought, ${node.name}`}
          value={bought}
          min={0}
          max={node.maxRank}
          onChange={(v) => {
            set(v ?? 0);
          }}
          w={110}
        />
        {node.maxRank <= STEPPER_MAX && (
          <ActionIcon
            variant="default"
            size={36}
            aria-label={`Raise ${node.name}`}
            disabled={bought >= node.maxRank}
            onClick={() => {
              set(bought + 1);
            }}
          >
            <Plus size={16} aria-hidden />
          </ActionIcon>
        )}
        <Text size="sm" c="dimmed" pb={8}>
          of {node.maxRank}
        </Text>
      </Group>
    </Stack>
  );
}
