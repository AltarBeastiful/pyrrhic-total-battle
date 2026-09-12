import type { ReactNode } from 'react';

import type { Race } from '@/data/types';
import type { Category, Group, Pool, Stack, StackRequest, StackResult, UnitDef } from '@/engine/types';
import { MinusIcon, PinIcon, PlusIcon, PoolBadge, UnitBadge } from '@/ui/icons';
import { Button, cn, Popover } from '@/ui/primitives';

import { removeFromFormation } from './formation';
import { amount, delta, duration, percent, ratio } from './format';
import { CATEGORY_NAME } from './journal';
import { IntegerField } from './IntegerField';
import { KeepButton } from './KeepButton';
import { findUnit, unitBadge } from './units';

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

const POOL_PAYS_FOR: Record<Pool, string> = {
  leadership: 'Troops',
  authority: 'Mercenaries',
  dominance: 'Monsters',
};

const POOLS = Object.keys(POOL_LABELS) as Pool[];

const GROUP_NAME: Record<Group, string> = {
  guardsmen: 'Guardsmen',
  specialist: 'Specialists',
  engineers: 'Engineers',
  monster: 'Monsters',
};

const RACE_NAME: Record<Race, string> = {
  beast: 'Beast',
  elemental: 'Elemental',
  dragon: 'Dragon',
  giant: 'Giant',
};

const CATEGORY_TITLE: Record<Category, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
};

interface StatProps {
  label: string;
  children: ReactNode;
}

function Stat({ label, children }: StatProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="nums text-right font-medium">{children}</dd>
    </div>
  );
}

/** One headed block of the unit popover: this march, the unit itself, what the fight costs you. */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h4 className="text-muted mb-1 text-xs font-semibold tracking-wide uppercase">{title}</h4>
      <dl className="space-y-1 text-xs">{children}</dl>
    </div>
  );
}

interface StackPillProps {
  stack: Stack;
  unit: UnitDef | undefined;
  /** The count the engine generated, so an edited chip can show its delta. */
  generated: number;
  /** Is this type kept in the march by hand? */
  kept: boolean;
  busy: boolean;
  onCount: (unitId: string, count: number) => void;
  onRemove: (unitId: string) => void;
}

function StackPill({ stack, unit, generated, kept, busy, onCount, onRemove }: StackPillProps) {
  const name = unit?.name ?? stack.unitId;
  const label = unit?.label ?? stack.unitId;
  const changed = stack.count !== generated;
  const training = unit?.training;

  return (
    <span
      className={cn(
        'tap rounded-chip inline-flex max-w-full items-center border text-sm',
        changed ? 'border-accent bg-accent-soft' : 'border-field bg-surface',
        stack.count === 0 && 'opacity-60',
      )}
    >
      <Popover
        label={`${name} stack`}
        trigger={
          <button
            type="button"
            className="rounded-chip flex min-h-11 items-center gap-1.5 py-1 pr-1 pl-2.5 font-medium sm:min-h-9"
          >
            <UnitBadge {...unitBadge(unit, stack.pool)} size="sm" />
            {/* The spaces matter: without them the accessible name would read "ARC1930". */}
            <span className="truncate">{label}</span> <span className="nums">{amount(stack.count)}</span>
            {changed && (
              <>
                {' '}
                <span className="text-accent nums text-xs">{delta(stack.count - generated)}</span>
              </>
            )}
          </button>
        }
      >
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <UnitBadge {...unitBadge(unit, stack.pool)} className="mt-0.5" />
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold">{name}</p>
              <p className="text-muted text-xs">
                {label} · {POOL_PAYS_FOR[stack.pool].toLowerCase()}
                {kept ? ' · kept in march' : ''}
              </p>
            </div>
          </div>

          <Block title="This march">
            <Stat label="Units">{amount(stack.count)}</Stat>
            <Stat label="Total HP">{amount(stack.totalHp)}</Stat>
            <Stat label="HP each">{amount(stack.hpPerUnit)}</Stat>
            <Stat label="Strength each">{ratio(stack.strengthPerUnit)}</Stat>
            <Stat label="One hit">{amount(stack.damagePerHit)}</Stat>
            <Stat label="…from strength-against">{amount(stack.featuresDamage)}</Stat>
            <Stat label="Target squad">the {CATEGORY_NAME[stack.target]} squad</Stat>
            <Stat label="Double hit">{percent(stack.doubleDamageChance)}</Stat>
            {stack.strikeTwoSquadsChance > 0 && (
              <Stat label="Strikes two squads">{percent(stack.strikeTwoSquadsChance)}</Stat>
            )}
          </Block>

          <Block title="Unit">
            <Stat label="Tier">{String(unit?.tier ?? '—')}</Stat>
            <Stat label="Category">{unit?.category === undefined ? '—' : CATEGORY_TITLE[unit.category]}</Stat>
            <Stat label="Group">{unit?.group === undefined ? '—' : GROUP_NAME[unit.group]}</Stat>
            <Stat label="Race">{unit?.race === undefined ? '—' : RACE_NAME[unit.race]}</Stat>
            <Stat label="Base HP">{amount(unit?.health ?? 0)}</Stat>
            <Stat label="Base strength">{amount(unit?.strength ?? 0)}</Stat>
            <Stat label="Housing cost">
              {amount(unit?.cost ?? 0)} {POOL_LABELS[stack.pool].toLowerCase()} each
            </Stat>
          </Block>

          <Block title="After the battle">
            <Stat label="Retrain">
              {training === undefined
                ? 'cannot be retrained'
                : `${amount(training.silver)} silver · ${duration(training.seconds)}${
                    training.dragonCoins ? ` · ${amount(training.dragonCoins)} dragon coins` : ''
                  }`}
            </Stat>
            <Stat label="Revive">{amount(unit?.revival.gold ?? 0)} gold each</Stat>
          </Block>

          <IntegerField
            label={`${name} units`}
            value={stack.count}
            min={0}
            max={10_000_000}
            hint="A count you type is played out as it is; nothing is re-sized around it."
            onChange={(value) => {
              onCount(stack.unitId, value);
            }}
          />
          <div className="flex flex-wrap gap-2">
            <KeepButton unitId={stack.unitId} name={name} kept={kept} disabled={busy} />
            <Button
              variant="danger"
              size="sm"
              disabled={busy}
              onClick={() => {
                onRemove(stack.unitId);
              }}
            >
              Remove from march
              <span className="sr-only">{`: ${name}`}</span>
            </Button>
          </div>
        </div>
      </Popover>
      {kept && (
        <PinIcon title={`${name} is kept in the march`} className="text-accent mr-0.5 ml-0.5 shrink-0" />
      )}
      <span className="flex items-center">
        <button
          type="button"
          aria-label={`One fewer ${name}`}
          disabled={stack.count <= 0}
          onClick={() => {
            onCount(stack.unitId, Math.max(0, stack.count - 1));
          }}
          className="text-muted hover:text-fg flex h-11 w-9 items-center justify-center disabled:opacity-40 sm:h-9 sm:w-7"
        >
          <MinusIcon aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`One more ${name}`}
          onClick={() => {
            onCount(stack.unitId, stack.count + 1);
          }}
          className="text-muted hover:text-fg flex h-11 w-9 items-center justify-center rounded-r-full sm:h-9 sm:w-7"
        >
          <PlusIcon aria-hidden="true" />
        </button>
      </span>
    </span>
  );
}

export interface StackPillsProps {
  request: StackRequest;
  /** Stacks in display order (kill order, or total HP descending when the sort toggle is on). */
  stacks: Stack[];
  pools: StackResult['pools'];
  /** Counts as generated, keyed by unit id. */
  generated: Map<string, number>;
  /** Unit ids kept in the march by hand. */
  kept: readonly string[];
  /** A Generate run is in flight. */
  busy?: boolean;
  onCount: (unitId: string, count: number) => void;
  onRemove?: (unitId: string) => void;
}

/** One row of chips per housing pool, each chip a stack (S-24). */
export function StackPills({
  request,
  stacks,
  pools,
  generated,
  kept,
  busy = false,
  onCount,
  onRemove = removeFromFormation,
}: StackPillsProps) {
  return (
    <div className="space-y-3">
      {POOLS.map((pool) => {
        const inPool = stacks.filter((stack) => stack.pool === pool);
        const usage = pools[pool];
        if (inPool.length === 0 && usage.capacity === 0) return null;
        const over = usage.used > usage.capacity;
        return (
          <div key={pool}>
            <div className="mb-1.5 flex items-center gap-2">
              <PoolBadge pool={pool} size="sm" />
              <h4 className="text-sm font-semibold">{POOL_LABELS[pool]}</h4>
              <span
                className={cn(
                  'rounded-chip nums border px-2 py-0.5 text-xs',
                  over ? 'border-danger bg-danger-soft text-fg' : 'border-line bg-raised text-muted',
                )}
              >
                {amount(usage.used)} / {amount(usage.capacity)}
                {over && <span className="font-semibold"> — over capacity</span>}
              </span>
            </div>
            {inPool.length === 0 ? (
              <p className="text-muted text-xs">
                No {POOL_PAYS_FOR[pool].toLowerCase()} stack is in this march.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {inPool.map((stack) => (
                  <StackPill
                    key={stack.unitId}
                    stack={stack}
                    unit={findUnit(stack.unitId, request.units)}
                    generated={generated.get(stack.unitId) ?? stack.count}
                    kept={kept.includes(stack.unitId)}
                    busy={busy}
                    onCount={onCount}
                    onRemove={onRemove}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
