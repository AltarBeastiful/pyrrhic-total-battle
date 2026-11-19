/**
 * One hero tree on the game's own grid (B-21): a tile per node at its column and row, showing the rank bought,
 * what the plan adds there, and why a node is locked. Tiles read in the game's order (row by row), two or three to a row,
 * each with its name, an icon and its tier; the grid's own five columns do not fit names at the 13 px floor of
 * design rule 19. A rank shows only once held or planned; the maximum lives in the editor. Colour is never the only signal (rule 24): a locked tile is dashed and
 * says "Lv 65" or "Parent".
 */
import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { Minus, Plus } from 'lucide-react';

import type { TalentRecord, TalentTree as TreeId } from '@/data/types';
import { rankGain, type TalentPlan } from '@/engine/talents';
import { Glyph } from '@/ui/domain/Glyph';
import { NumberField } from '@/ui/kit';

import { percent, statLabel, TREE_LABELS } from './labels';
import { spentPoints } from './spentPoints';
import classes from './talents.module.css';
import { talentFamily, talentIcons, treeOrder } from './talentFamily';

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
}

/** What the plan adds to each node: the count of its steps. */
export function plannedByNode(plan: TalentPlan): Map<number, number> {
  const out = new Map<number, number>();
  for (const s of plan.steps) out.set(s.nodeId, (out.get(s.nodeId) ?? 0) + 1);
  return out;
}

function lockWords(plan: TalentPlan, id: number): string | null {
  const lock = plan.locked[id];
  if (lock === undefined) return null;
  return lock.reason === 'level' ? `Lv ${String(lock.level)}` : 'Parent';
}

export function TalentTree({ talents, tree, ranks, plan, selected, onSelect, onRank }: TalentTreeProps) {
  const nodes = treeOrder(talents.filter((t) => t.tree === tree));
  const added = plannedByNode(plan);
  const node = nodes.find((n) => n.id === selected) ?? null;
  const points = spentPoints(talents, tree, ranks);

  return (
    <div className={classes.layout}>
      <Stack gap="md">
        <Text fw={600}>
          {TREE_LABELS[tree]} · {points} {points === 1 ? 'point' : 'points'} spent
        </Text>
        <div className={classes.grid}>
          {nodes.map((n) => {
            const bought = ranks[String(n.id)] ?? 0;
            const plus = added.get(n.id) ?? 0;
            const lock = bought === 0 && plus === 0 ? lockWords(plan, n.id) : null;
            const fam = talentFamily(n.name);
            const icons = talentIcons(n.name, n.stats);
            const state = plus > 0 ? 'planned' : lock !== null ? 'locked' : 'open';
            const spoken =
              `${n.name}, rank ${String(bought)} of ${String(n.maxRank)}` +
              (plus > 0 ? `, the plan adds ${String(plus)}` : '') +
              (lock !== null
                ? plan.locked[n.id]?.reason === 'level'
                  ? `, locked until hero level ${String(plan.locked[n.id]?.level)}`
                  : ', locked until a node above it has a rank'
                : '');
            return (
              <button
                key={n.id}
                type="button"
                className={classes.tile}
                data-state={state}
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
                {(bought > 0 || plus > 0 || lock !== null) && (
                  <span className={classes.marks}>
                    {bought > 0 && <span>rank {bought}</span>}
                    {plus > 0 && <span>+{plus}</span>}
                    {lock !== null && <span>{lock}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <Text size="sm" c="dimmed">
          Filled tiles are where the plan spends. Dashed tiles are locked: Lv is the hero level they need,
          Parent means a node above them must hold a rank first.
        </Text>
      </Stack>
      <aside className={classes.detail} data-empty={node === null} aria-label="Selected node">
        {node !== null ? (
          <NodeEditor node={node} bought={ranks[String(node.id)] ?? 0} plan={plan} onRank={onRank} />
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
}: {
  node: TalentRecord;
  bought: number;
  plan: TalentPlan;
  onRank: (id: number, rank: number) => void;
}) {
  const lock = plan.locked[node.id];
  const next = bought < node.maxRank ? rankGain(node.values, bought + 1) : null;
  const set = (rank: number): void => {
    onRank(node.id, Math.max(0, Math.min(node.maxRank, rank)));
  };
  return (
    <Stack gap="xs" aria-label={`${node.name}`} role="group">
      <Text fw={600}>{node.name}</Text>
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
