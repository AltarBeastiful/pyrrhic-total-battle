/**
 * One hero tree on the game's own grid (B-21): a tile per node at its column and row, showing the rank bought,
 * what the plan adds there, and why a node is locked. Tiles sit at the game's own column and row with a line to each parent, each with its name, an icon and its tier.
 * A rank shows only once held or planned; the maximum lives in the editor. Colour is never the only signal (rule 24): a locked tile is dashed and
 * says "Lv 65" or "Parent".
 */
import { ActionIcon, Button, Group, Stack, Text } from '@mantine/core';
import { Lock, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { TalentRecord, TalentTree as TreeId } from '@/data/types';
import { rankGain, type TalentPlan } from '@/engine/talents';
import { Glyph } from '@/ui/domain/Glyph';
import { NumberField } from '@/ui/kit';

import { percent, statLabel, TREE_LABELS } from './labels';
import { pointsWords, stepsUpToNode, treePoints } from './spentPoints';
import classes from './talents.module.css';
import { talentFamily, talentIcons } from './talentFamily';
import { TalentAnalysis } from './TalentAnalysis';

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
  /** The + on the selected tile spends one rank on it, as in the game; the page checks the lock and the stock. */
  onSpend: (id: number) => void;
  /** Buy as many ranks of the node as the stock pays, to its maximum. */
  onMax: (id: number) => void;
  /** Spend this tree's plan steps up to the node and its neighbours on the same level. */
  onSpendPlan: (nodeId: number) => void;
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

/** The bonus a tile shows: what the held ranks give, and where the plan takes it ("+4 % → 7.5 %"). */
function bonusWords(n: TalentRecord, bought: number, plus: number): string {
  const now = bought > 0 ? (n.values[bought - 1] ?? 0) : 0;
  if (plus === 0) return `+${percent(now)}`;
  const after = n.values[Math.min(bought + plus, n.maxRank) - 1] ?? now;
  return bought > 0 ? `+${percent(now)} → ${percent(after)}` : `→ +${percent(after)}`;
}

/** The game's grid: cell size in px, tiles 156 x 128 inside a 176 x 152 cell. */
const CELL_W = 176;
const CELL_H = 152;
const TILE_W = 156;
const TILE_H = 128;
/** The narrowest a column gets before the canvas pans sideways instead (tile names stay readable). */
const MIN_CELL_W = 132;

export function TalentTree({
  talents,
  tree,
  ranks,
  plan,
  selected,
  onSelect,
  onRank,
  onSpend,
  onMax,
  onSpendPlan,
}: TalentTreeProps) {
  const nodes = talents.filter((t) => t.tree === tree);
  // The pad shows on the selected tile and on the one the pointer or the keyboard is on.
  const [hovered, setHovered] = useState<number | null>(null);
  const added = plannedByNode(plan);
  const firstStep = firstStepByNode(plan);
  const node = nodes.find((n) => n.id === selected) ?? null;
  const points = treePoints(talents, tree, ranks, plan.steps);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rows = Math.max(...nodes.map((n) => n.layout.y)) + 1;
  // Only the columns the tree uses take room: the tiles keep their size and the empty outer columns go.
  const firstCol = Math.min(...nodes.map((n) => n.layout.x));
  const lastCol = Math.max(...nodes.map((n) => n.layout.x));
  const cols = lastCol - firstCol + 1;
  // The plane is relative: it takes the room it has up to the full grid, and the tiles narrow with it.
  const width = cols * CELL_W;
  const height = rows * CELL_H;
  const centre = (n: TalentRecord): [number, number] => [
    (n.layout.x - firstCol) * CELL_W + CELL_W / 2,
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
          <div
            className={classes.plane}
            style={{ width: '100%', maxWidth: width, minWidth: cols * MIN_CELL_W, height }}
          >
            <svg
              className={classes.lines}
              width="100%"
              height={height}
              viewBox={`0 0 ${String(width)} ${String(height)}`}
              preserveAspectRatio="none"
              aria-hidden
            >
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
                  onMouseEnter={() => {
                    setHovered(n.id);
                  }}
                  onMouseLeave={() => {
                    setHovered(null);
                  }}
                  onFocus={() => {
                    setHovered(n.id);
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setHovered(null);
                  }}
                  style={{
                    left: `${String(((n.layout.x - firstCol + 0.5) / cols) * 100)}%`,
                    transform: 'translateX(-50%)',
                    top: n.layout.y * CELL_H + (CELL_H - TILE_H) / 2,
                    width: `min(${String(TILE_W)}px, calc(${String(100 / cols)}% - 12px))`,
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
                    {(bought > 0 || plus > 0) && (
                      <span className={classes.split}>
                        <span>
                          {[
                            full ? 'max' : bought > 0 ? `rank ${String(bought)}` : '',
                            plus > 0 ? `+${String(plus)}` : '',
                          ]
                            .filter((x) => x !== '')
                            .join(' ')}
                        </span>
                        <b className={classes.bonus}>{bonusWords(n, bought, plus)}</b>
                      </span>
                    )}
                    {lock !== null && bought === 0 && plus === 0 && (
                      <span className={classes.marks}>
                        <span
                          className={classes.lock}
                          data-lock={plan.locked[n.id]?.reason === 'level' ? 'level' : 'parent'}
                        >
                          <Lock size={12} aria-hidden />
                          {lock}
                        </span>
                      </span>
                    )}
                  </button>
                  {(selected === n.id || hovered === n.id) && (
                    <div
                      className={classes.pad}
                      data-above={n.layout.y === rows - 1}
                      role="group"
                      aria-label={`Ranks of ${n.name}`}
                    >
                      <button
                        type="button"
                        className={classes.padButton}
                        aria-label={`Take one rank back from ${n.name}`}
                        disabled={bought <= 0}
                        onClick={() => {
                          onRank(n.id, bought - 1);
                        }}
                      >
                        <Minus size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={classes.padButton}
                        aria-label={`Add one rank to ${n.name}`}
                        onClick={() => {
                          onSpend(n.id);
                        }}
                      >
                        <Plus size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={classes.padMax}
                        aria-label={`Buy ${n.name} up to its maximum`}
                        disabled={full}
                        onClick={() => {
                          onMax(n.id);
                        }}
                      >
                        max
                      </button>
                    </div>
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
        <TreeRecap nodes={nodes} ranks={ranks} plan={plan} tree={tree} />
        {node !== null ? (
          <NodeEditor
            node={node}
            nodes={nodes}
            bought={ranks[String(node.id)] ?? 0}
            plan={plan}
            onRank={onRank}
            onMax={onMax}
            onSpendPlan={onSpendPlan}
          />
        ) : (
          <Text size="sm" c="dimmed">
            Tap a node to see what it adds; its + and - buttons then appear under it.
          </Text>
        )}
      </aside>
    </div>
  );
}

function NodeEditor({
  node,
  nodes,
  bought,
  plan,
  onRank,
  onMax,
  onSpendPlan,
}: {
  node: TalentRecord;
  nodes: readonly TalentRecord[];
  bought: number;
  plan: TalentPlan;
  onRank: (id: number, rank: number) => void;
  onMax: (id: number) => void;
  onSpendPlan: (nodeId: number) => void;
}) {
  // Spending up to here takes this tree's steps up to the node and its neighbours on the same level.
  const upTo = stepsUpToNode(nodes, plan.steps, node.id);
  const toHere = upTo.reduce((sum, s) => sum + s.cost, 0);
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
      <RankTable node={node} bought={bought} plus={plan.steps.filter((st) => st.nodeId === node.id).length} />
      <TalentAnalysis node={node} />
      {lock !== undefined && bought === 0 && (
        <Text size="sm">
          {lock.reason === 'level'
            ? `Locked until hero level ${String(lock.level)}.`
            : 'Locked until a node above it holds a rank.'}
        </Text>
      )}
      {upTo.length > 0 && (
        <Button
          size="xs"
          variant="light"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => {
            onSpendPlan(node.id);
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
      <Group gap="xs">
        <Button
          size="xs"
          variant="light"
          disabled={bought >= node.maxRank}
          onClick={() => {
            onMax(node.id);
          }}
        >
          Max
        </Button>
        <Button
          size="xs"
          variant="default"
          disabled={bought <= 0}
          onClick={() => {
            set(0);
          }}
        >
          Reset
        </Button>
      </Group>
    </Stack>
  );
}

/** Every rank of a node: its cost, what it adds and the total bonus, the held rank marked and the plan's ranks hatched. */
function RankTable({ node, bought, plus }: { node: TalentRecord; bought: number; plus: number }) {
  const box = useRef<HTMLDivElement>(null);
  const here = useRef<HTMLTableRowElement>(null);
  // Open on the held rank (or the first one): the table scrolls inside the panel, never the page.
  useEffect(() => {
    if (box.current !== null && here.current !== null) {
      box.current.scrollTop = Math.max(0, here.current.offsetTop - 60);
    }
  }, [node.id]);
  return (
    <div ref={box} className={classes.rankBox} role="region" aria-label={`${node.name} ranks`} tabIndex={0}>
      <table className={classes.ranks}>
        <thead>
          <tr>
            <th scope="col">Rank</th>
            <th scope="col">Cost</th>
            <th scope="col">Adds</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {node.values.map((value, i) => {
            const rank = i + 1;
            const state =
              rank === bought ? 'now' : rank < bought ? 'held' : rank <= bought + plus ? 'plan' : 'open';
            return (
              <tr key={rank} ref={rank === Math.max(bought, 1) ? here : undefined} data-rank={state}>
                <td>
                  {rank}
                  {state === 'now' && <span className={classes.rankTag}>you are here</span>}
                  {state === 'plan' && <span className={classes.rankTag}>plan</span>}
                </td>
                <td>{node.costs[i]}</td>
                <td>{`+${percent(rankGain(node.values, rank))}`}</td>
                <td>{`+${percent(value)}`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Every bonus the tree gives, by talent family, the largest first: what the held ranks add, and where the plan takes it. */
function TreeRecap({
  nodes,
  ranks,
  plan,
  tree,
}: {
  nodes: readonly TalentRecord[];
  ranks: Readonly<Record<string, number>>;
  plan: TalentPlan;
  tree: TreeId;
}) {
  const added = plannedByNode(plan);
  const totals = new Map<string, { now: number; after: number }>();
  for (const n of nodes) {
    const bought = ranks[String(n.id)] ?? 0;
    const upTo = Math.min(n.maxRank, bought + (added.get(n.id) ?? 0));
    const now = bought > 0 ? (n.values[bought - 1] ?? 0) : 0;
    const after = upTo > 0 ? (n.values[upTo - 1] ?? 0) : 0;
    if (now === 0 && after === 0) continue;
    // By talent family, not by stat: "Mounted units' strength", not just "Strength", tiers added together.
    const label = talentFamily(n.name).family;
    const row = totals.get(label) ?? { now: 0, after: 0 };
    row.now += now;
    row.after += after;
    totals.set(label, row);
  }
  const rows = [...totals.entries()].sort(
    ([a, x], [b, y]) => Math.max(y.now, y.after) - Math.max(x.now, x.after) || a.localeCompare(b),
  );
  return (
    <section className={classes.recap} aria-label={`${TREE_LABELS[tree]} bonuses`}>
      <Text fw={600} size="sm">
        {`${TREE_LABELS[tree]} bonuses`}
      </Text>
      {rows.length === 0 ? (
        <Text size="sm" c="dimmed">
          No bonus yet in this tree.
        </Text>
      ) : (
        <dl className={classes.recapList}>
          {rows.map(([label, v]) => (
            <div key={label} className={classes.recapRow}>
              <dt>{label}</dt>
              <dd>{v.after > v.now ? `+${percent(v.now)} → ${percent(v.after)}` : `+${percent(v.now)}`}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
