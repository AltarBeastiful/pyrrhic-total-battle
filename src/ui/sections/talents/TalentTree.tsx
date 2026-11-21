/**
 * One hero tree on the game's own grid (B-21): a tile per node at its column and row, showing the rank bought,
 * what the plan adds there, and why a node is locked. Tiles sit at the game's own column and row with a line to each parent, each with its name, an icon and its tier.
 * A rank shows only once held or planned; the maximum lives in the editor. Colour is never the only signal (rule 24): a locked tile is dashed and
 * says "Lv 65" or "Parent".
 */
import { ActionIcon, Button, Group, Stack, Text } from '@mantine/core';
import { Lock, Minus, Plus } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import type { TalentRecord, TalentTree as TreeId } from '@/data/types';
import { rankGain, type TalentPlan } from '@/engine/talents';
import { Glyph } from '@/ui/domain/Glyph';
import { Dialog, NumberField } from '@/ui/kit';

import { percent, statLabel, TREE_LABELS } from './labels';
import { keyRankPicks, rankChipLabel, type RankState } from './rankChips';
import { stepsUpToNode } from './spentPoints';
import classes from './talents.module.css';
import { recapSize, splitRecap } from './recap';
import { talentFamily, talentIcons } from './talentFamily';
import { talentArt } from './talentArt';
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
  /** A click outside the tiles, the pad, the strip and the right column, or Escape, closes the selected talent. */
  onClear: () => void;
  onRank: (id: number, rank: number) => void;
  /** The + on the selected tile spends one rank on it, as in the game; the page checks the lock and the stock. */
  onSpend: (id: number) => void;
  /** Buy as many ranks of the node as the stock pays, to its maximum. */
  onMax: (id: number) => void;
  /** Spend this tree's plan steps up to the node and its neighbours on the same level. */
  onSpendPlan: (nodeId: number) => void;
  /** A ranking row asked for this talent: scroll its tile into view once it has rendered (B-29). */
  reveal?: { id: number; at: number } | null;
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

/** Every card is 150 x 146 in a 184 x 182 cell, so the gaps are 34 px across and 36 px down: the rank pad hangs in the row gap (B-31). */
const CELL_W = 184;
const CELL_H = 182;
const TILE_W = 150;
const TILE_H = 146;

export function TalentTree({
  talents,
  tree,
  ranks,
  plan,
  selected,
  onSelect,
  onClear,
  onRank,
  onSpend,
  onMax,
  onSpendPlan,
  reveal = null,
}: TalentTreeProps) {
  const tiles = useRef(new Map<number, HTMLButtonElement>());
  // An effect runs after the commit that drew this tree, so a tile on a tree just switched to is already there.
  useEffect(() => {
    if (reveal === null) return;
    tiles.current.get(reveal.id)?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
  }, [reveal, tree]);
  // B-31: a click outside any tile, its pad, the strip or the right column closes the selection; so does Escape.
  useEffect(() => {
    if (selected === null) return;
    const away = (event: MouseEvent): void => {
      const t = event.target;
      if (!(t instanceof Element)) return;
      if (
        t.closest(
          '[data-tile-box], button, a, input, select, textarea, label, [role="button"], [aria-label="Points and trees"], aside[aria-label="Selected node"], [role="dialog"], [role="listbox"], [role="menu"], [class*="Popover"], [class*="Modal"], [data-portal]',
        ) === null
      ) {
        onClear();
      }
    };
    const key = (event: KeyboardEvent): void => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        document.querySelector('[role="dialog"]') === null
      )
        onClear();
    };
    document.addEventListener('click', away);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('click', away);
      document.removeEventListener('keydown', key);
    };
  }, [selected, onClear]);
  const nodes = talents.filter((t) => t.tree === tree);
  // The pad shows on the selected tile and on the one the pointer or the keyboard is on.
  const [hovered, setHovered] = useState<number | null>(null);
  const added = plannedByNode(plan);
  const firstStep = firstStepByNode(plan);
  const node = nodes.find((n) => n.id === selected) ?? null;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rows = Math.max(...nodes.map((n) => n.layout.y)) + 1;
  // Only the columns the tree uses take room: the tiles keep their size and the empty outer columns go.
  const firstCol = Math.min(...nodes.map((n) => n.layout.x));
  const lastCol = Math.max(...nodes.map((n) => n.layout.x));
  const cols = lastCol - firstCol + 1;
  // The plane is relative: it takes the room it has up to the full grid, and the tiles narrow with it.
  const width = cols * CELL_W;
  const height = rows * CELL_H;
  // A card's box in the plane: lines run from the middle of one card edge to the middle of the next.
  const box = (n: TalentRecord) => ({
    left: (n.layout.x - firstCol) * CELL_W + (CELL_W - TILE_W) / 2,
    top: n.layout.y * CELL_H + (CELL_H - TILE_H) / 2,
  });
  const join = (p: TalentRecord, c: TalentRecord): { from: [number, number]; to: [number, number] } => {
    const a = box(p);
    const b = box(c);
    if (c.layout.y > p.layout.y) {
      return { from: [a.left + TILE_W / 2, a.top + TILE_H], to: [b.left + TILE_W / 2, b.top] };
    }
    const right = c.layout.x > p.layout.x;
    return {
      from: [a.left + (right ? TILE_W : 0), a.top + TILE_H / 2],
      to: [b.left + (right ? 0 : TILE_W), b.top + TILE_H / 2],
    };
  };
  // One line from each node to each of its parents, as the game draws them; a line into a node that is held
  // is firm, and a line into a node the plan spends on is bold and in the accent colour.
  const lines = nodes.flatMap((n) =>
    n.parents.flatMap((pid) => {
      const p = byId.get(pid);
      if (p === undefined) return [];
      const planned = (added.get(n.id) ?? 0) > 0;
      const lit = (ranks[String(pid)] ?? 0) > 0;
      return [{ key: `${String(pid)}-${String(n.id)}`, ...join(p, n), lit, planned }];
    }),
  );

  return (
    <div className={classes.layout}>
      <Stack gap="md" style={{ minWidth: 0 }}>
        {/*
          Owner request (talents tree shape): the tree keeps the game's shape and, on a phone, pans sideways INSIDE
          this canvas (tile names stay at the 13 px floor). The page itself never scrolls sideways.
        */}
        <div className={classes.canvas} role="region" aria-label={`${TREE_LABELS[tree]} tree`} tabIndex={0}>
          <div className={classes.plane} style={{ width, height }}>
            <svg className={classes.lines} width={width} height={height} aria-hidden>
              <defs>
                {[false, true].map((lit) => (
                  <marker
                    key={String(lit)}
                    id={`arrow-${tree}-${String(lit)}`}
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    markerUnits="userSpaceOnUse"
                    orient="auto"
                  >
                    <path d="M0 0L10 5L0 10z" className={classes.arrow} data-lit={lit} />
                  </marker>
                ))}
              </defs>
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
                  markerEnd={`url(#arrow-${tree}-${String(l.lit)})`}
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
              const art = talentArt(n.id);
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
                  data-tile-box
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
                    left: box(n).left,
                    top: box(n).top,
                    width: TILE_W,
                    height: TILE_H,
                  }}
                >
                  <button
                    type="button"
                    className={classes.tile}
                    ref={(el) => {
                      if (el === null) tiles.current.delete(n.id);
                      else tiles.current.set(n.id, el);
                    }}
                    data-node-id={n.id}
                    style={art !== null ? ({ '--a': art.tint } as CSSProperties) : undefined}
                    data-state={state}
                    data-full={full}
                    aria-pressed={selected === n.id}
                    aria-label={spoken}
                    onClick={() => {
                      onSelect(n.id);
                    }}
                  >
                    <span
                      className={classes.pic}
                      aria-hidden
                      style={art !== null ? ({ '--tint': art.tint } as CSSProperties) : undefined}
                    >
                      {art !== null ? (
                        <img src={art.url} alt="" width={48} height={48} draggable={false} />
                      ) : (
                        <span className={classes.icons}>
                          {icons.subject !== null && <Glyph kind={icons.subject} />}
                          <Glyph kind={icons.stat} />
                        </span>
                      )}
                    </span>
                    <span className={classes.name}>{fam.family}</span>
                    <span className={classes.foot}>
                      {lock !== null ? (
                        <span className={classes.marks}>
                          <span
                            className={classes.lock}
                            data-lock={plan.locked[n.id]?.reason === 'level' ? 'level' : 'parent'}
                          >
                            <Lock size={12} aria-hidden />
                            {lock}
                          </span>
                        </span>
                      ) : (
                        <>
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
                          <b className={classes.bonus}>
                            {bought > 0 || plus > 0 ? bonusWords(n, bought, plus) : '—'}
                          </b>
                        </>
                      )}
                    </span>
                  </button>
                  {lock === null && (selected === n.id || hovered === n.id) && (
                    <div
                      className={classes.pad}
                      data-selected={selected === n.id}
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
                        <Minus size={14} aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={classes.padButton}
                        aria-label={`Add one rank to ${n.name}`}
                        disabled={full}
                        onClick={() => {
                          onSpend(n.id);
                        }}
                      >
                        <Plus size={14} aria-hidden />
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
                        Max
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
            Tap a node to see what it adds; its − + and Max buttons then appear under it. Click away to close
            it.
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
  const art = talentArt(node.id);
  const lock = plan.locked[node.id];
  const next = bought < node.maxRank ? rankGain(node.values, bought + 1) : null;
  const set = (rank: number): void => {
    onRank(node.id, Math.max(0, Math.min(node.maxRank, rank)));
  };
  return (
    <Stack gap="xs" aria-label={`${node.name}`} role="group">
      <Group gap="xs" align="center">
        <span
          className={classes.pic}
          aria-hidden
          style={art !== null ? ({ '--tint': art.tint } as CSSProperties) : undefined}
        >
          {art !== null ? (
            <img src={art.url} alt="" width={48} height={48} draggable={false} />
          ) : (
            <span className={classes.icons}>
              {icons.subject !== null && <Glyph kind={icons.subject} />}
              <Glyph kind={icons.stat} />
            </span>
          )}
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

/**
 * The ranks of a node as chips (B-26): about five key ones on a line, a `…` at each gap, and "Show all" opens the same
 * chips one per rank, wrapped, in a box that scrolls on its own and opens on the held rank. Cost and "adds" live in the
 * tooltip and the screen-reader label (rules 24, 25), never in the chip.
 */
function RankTable({ node, bought, plus }: { node: TalentRecord; bought: number; plus: number }) {
  const [all, setAll] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const here = useRef<HTMLLIElement>(null);
  // The full list opens on the held rank (or the first one): it scrolls inside its box, never the page.
  useEffect(() => {
    if (!all) return;
    // The dialog mounts its body behind a transition, so look once the frame has painted.
    const frame = requestAnimationFrame(() => {
      if (box.current !== null && here.current !== null) {
        box.current.scrollTop = Math.max(0, here.current.offsetTop - 60);
      }
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [node.id, all]);
  const last = node.maxRank;
  const picks = keyRankPicks({ last, bought, plus });
  const stateOf = (rank: number): RankState =>
    rank === bought ? 'now' : rank < bought ? 'held' : rank <= bought + plus ? 'plan' : 'open';
  const chip = (rank: number, gap: boolean, anchor = false, tab = true) => {
    const state = stateOf(rank);
    const label = rankChipLabel({ name: node.name, rank, values: node.values, costs: node.costs, state });
    return (
      <li
        key={rank}
        ref={anchor ? here : undefined}
        className={classes.rankChip}
        data-rank={state}
        data-rank-n={rank}
      >
        {gap && <span aria-hidden>…</span>}
        <span
          tabIndex={tab ? 0 : -1}
          title={label}
          aria-label={label}
        >{`${String(rank)}: +${percent(node.values[rank - 1] ?? 0)}`}</span>
      </li>
    );
  };
  return (
    <Stack gap={4}>
      <ul className={classes.rankLine} aria-label={`${node.name} key ranks`}>
        {picks.map((rank, i) => chip(rank, i > 0 && rank - (picks[i - 1] ?? rank) > 1))}
      </ul>
      <Button
        size="compact-xs"
        variant="subtle"
        style={{ alignSelf: 'flex-start' }}
        aria-haspopup="dialog"
        onClick={() => {
          setAll(true);
        }}
      >
        {`Show all ${String(last)} ranks`}
      </Button>
      <Dialog
        opened={all}
        onClose={() => {
          setAll(false);
        }}
        title={`${node.name}: all ${String(last)} ranks`}
        size="lg"
      >
        <div
          ref={box}
          className={classes.rankBox}
          role="region"
          aria-label={`${node.name} ranks`}
          tabIndex={0}
        >
          <ul className={classes.rankLine}>
            {node.values.map((_, i) =>
              (() => {
                const held = i + 1 === Math.max(bought, 1);
                return chip(i + 1, false, held, held);
              })(),
            )}
          </ul>
        </div>
      </Dialog>
    </Stack>
  );
}

/** Every bonus the tree gives, by talent family, the largest first; the families under a quarter complete wait under "Show more". */
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
  const [more, setMore] = useState(false);
  const added = plannedByNode(plan);
  const totals = new Map<string, { now: number; after: number; ranks: number }>();
  const maxByFamily = new Map<string, number>();
  for (const n of nodes) {
    const f = talentFamily(n.name).family;
    maxByFamily.set(f, (maxByFamily.get(f) ?? 0) + n.maxRank);
  }
  for (const n of nodes) {
    const bought = ranks[String(n.id)] ?? 0;
    const upTo = Math.min(n.maxRank, bought + (added.get(n.id) ?? 0));
    const now = bought > 0 ? (n.values[bought - 1] ?? 0) : 0;
    const after = upTo > 0 ? (n.values[upTo - 1] ?? 0) : 0;
    if (now === 0 && after === 0) continue;
    // By talent family, not by stat: "Mounted units' strength", not just "Strength", tiers added together.
    const label = talentFamily(n.name).family;
    const row = totals.get(label) ?? { now: 0, after: 0, ranks: 0 };
    row.now += now;
    row.after += after;
    row.ranks += upTo;
    totals.set(label, row);
  }
  const { shown: top, hidden } = splitRecap(
    [...totals.entries()].map(([label, v]) => ({ label, ...v, maxRanks: maxByFamily.get(label) ?? 0 })),
  );
  const shown = more
    ? [...top, ...hidden].sort((x, y) => recapSize(y) - recapSize(x) || x.label.localeCompare(y.label))
    : top;
  return (
    <section className={classes.recap} aria-label={`${TREE_LABELS[tree]} bonuses`}>
      <Text fw={600} size="sm">
        {`${TREE_LABELS[tree]} bonuses`}
      </Text>
      {top.length === 0 ? (
        <Text size="sm" c="dimmed">
          No bonus yet in this tree.
        </Text>
      ) : (
        <dl className={classes.recapList}>
          {shown.map((v) => (
            <div key={v.label} className={classes.recapRow}>
              <dt>{v.label}</dt>
              <dd>{v.after > v.now ? `+${percent(v.now)} → ${percent(v.after)}` : `+${percent(v.now)}`}</dd>
            </div>
          ))}
        </dl>
      )}
      {hidden.length > 0 && (
        <Button
          size="compact-xs"
          variant="subtle"
          style={{ alignSelf: 'flex-start' }}
          aria-expanded={more}
          onClick={() => {
            setMore((open) => !open);
          }}
        >
          {more ? 'Show less' : `Show ${String(hidden.length)} more`}
        </Button>
      )}
    </section>
  );
}
