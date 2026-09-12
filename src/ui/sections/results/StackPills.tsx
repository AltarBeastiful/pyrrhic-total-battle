import type { ReactNode } from 'react';

import type { Pool, Stack, StackRequest, StackResult, UnitDef } from '@/engine/types';
import { Button, cn, Popover } from '@/ui/primitives';

import { amount, delta, percent, ratio } from './format';
import { CATEGORY_NAME } from './journal';
import { IntegerField } from './IntegerField';
import { findUnit } from './units';

const POOL_LABELS: Record<Pool, string> = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
};

const POOLS = Object.keys(POOL_LABELS) as Pool[];

interface StatProps {
  label: string;
  children: ReactNode;
}

function Stat({ label, children }: StatProps) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted shrink-0">{label}</dt>
      <dd className="text-right font-medium tabular-nums">{children}</dd>
    </div>
  );
}

interface StackPillProps {
  stack: Stack;
  unit: UnitDef | undefined;
  /** The count the engine generated, so an edited pill can show its delta. */
  generated: number;
  onCount: (unitId: string, count: number) => void;
  onRemove: (unitId: string) => void;
}

function StackPill({ stack, unit, generated, onCount, onRemove }: StackPillProps) {
  const name = unit?.name ?? stack.unitId;
  const label = unit?.label ?? stack.unitId;
  const changed = stack.count !== generated;
  const training = unit?.training;

  return (
    <span
      className={cn(
        'tap inline-flex max-w-full items-center rounded-full border text-sm',
        changed ? 'border-accent bg-accent-soft' : 'border-field bg-surface',
        stack.count === 0 && 'opacity-60',
      )}
    >
      <Popover
        label={`${name} stack`}
        trigger={
          <button
            type="button"
            className="flex min-h-11 items-center gap-1.5 rounded-l-full py-1 pr-1 pl-3 font-medium sm:min-h-9"
          >
            {/* The spaces matter: without them the accessible name would read "ARC1930". */}
            <span className="truncate">{label}</span>{' '}
            <span className="tabular-nums">{amount(stack.count)}</span>
            {changed && (
              <>
                {' '}
                <span className="text-accent text-xs tabular-nums">{delta(stack.count - generated)}</span>
              </>
            )}
          </button>
        }
      >
        <div className="space-y-3">
          <div>
            <p className="text-sm font-semibold">{name}</p>
            <p className="text-muted text-xs">
              Tier {String(unit?.tier ?? '?')} · {unit?.keys.join(', ') ?? '—'}
            </p>
          </div>
          <dl className="space-y-1 text-xs">
            <Stat label="Cost">
              {amount(unit?.cost ?? 0)} {POOL_LABELS[stack.pool].toLowerCase()} per unit
            </Stat>
            <Stat label="HP per unit">{amount(stack.hpPerUnit)}</Stat>
            <Stat label="Total HP">{amount(stack.totalHp)}</Stat>
            <Stat label="Strength per unit">{ratio(stack.strengthPerUnit)}</Stat>
            <Stat label="Damage per hit">{amount(stack.damagePerHit)}</Stat>
            <Stat label="…from features">{amount(stack.featuresDamage)}</Stat>
            <Stat label="Double damage">{percent(stack.doubleDamageChance)}</Stat>
            {stack.strikeTwoSquadsChance > 0 && (
              <Stat label="Strike two squads">{percent(stack.strikeTwoSquadsChance)}</Stat>
            )}
            <Stat label="Targets">the {CATEGORY_NAME[stack.target]} squad</Stat>
            <Stat label="Training">
              {training === undefined
                ? 'cannot be retrained'
                : `${amount(training.silver)} silver${
                    training.dragonCoins ? ` · ${amount(training.dragonCoins)} dragon coins` : ''
                  }`}
            </Stat>
            <Stat label="Revival">{amount(unit?.revival.gold ?? 0)} gold per unit</Stat>
          </dl>
          <IntegerField
            label={`${name} units`}
            value={stack.count}
            min={0}
            max={10_000_000}
            hint="Editing a count re-runs the battle on these units; it does not re-size anything."
            onChange={(value) => {
              onCount(stack.unitId, value);
            }}
          />
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              onRemove(stack.unitId);
            }}
          >
            Remove from formation
          </Button>
        </div>
      </Popover>
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
          <span aria-hidden="true">−</span>
        </button>
        <button
          type="button"
          aria-label={`One more ${name}`}
          onClick={() => {
            onCount(stack.unitId, stack.count + 1);
          }}
          className="text-muted hover:text-fg flex h-11 w-9 items-center justify-center rounded-r-full sm:h-9 sm:w-7"
        >
          <span aria-hidden="true">+</span>
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
  onCount: (unitId: string, count: number) => void;
  onRemove: (unitId: string) => void;
}

/** One row of pills per housing pool, each pill a stack (S-24). */
export function StackPills({ request, stacks, pools, generated, onCount, onRemove }: StackPillsProps) {
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
              <h4 className="text-sm font-semibold">{POOL_LABELS[pool]}</h4>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-xs tabular-nums',
                  over ? 'border-danger bg-danger/10 text-fg' : 'border-line bg-raised text-muted',
                )}
              >
                {amount(usage.used)} / {amount(usage.capacity)}
                {over && <span className="font-semibold"> — over capacity</span>}
              </span>
            </div>
            {inPool.length === 0 ? (
              <p className="text-muted text-xs">No unit type of this pool is in the formation.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {inPool.map((stack) => (
                  <StackPill
                    key={stack.unitId}
                    stack={stack}
                    unit={findUnit(stack.unitId, request.units)}
                    generated={generated.get(stack.unitId) ?? stack.count}
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
