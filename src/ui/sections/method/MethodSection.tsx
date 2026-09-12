/**
 * S-13 — Stacking method section (PLAN §4.4, §3.3).
 *
 * The method belongs to one march, so unlike Troops and Mercenaries this section writes to the active
 * *battle setup*. Your own order is stored as a plain list of unit ids; the list shown here is always the
 * stored one re-merged with the units currently in the march (ids that no longer exist are dropped, new
 * ones are appended in tier-ladder order), which is exactly what the engine does when it reads
 * `customOrder`.
 */
import { useId, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { UnitDef } from '@/data/types';
import { buildKillOrder } from '@/engine';
import type { Method, StackingOptions } from '@/engine';
import { buildUnits } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { GuardsmenIcon, MethodIcon, ResetIcon, SortIcon } from '../../icons';
import { Button, HelpNote, Section, Toggle, cn } from '../../primitives';
import { KillOrderList } from './KillOrderList';

interface MethodOption {
  id: Method;
  title: string;
  icon: ReactNode;
  blurb: string;
}

/** The three rules, in the words of the glossary in `docs/design.md` §7. */
const METHOD_OPTIONS: readonly MethodOption[] = [
  {
    id: 'elite',
    title: 'Tier ladder',
    icon: <MethodIcon />,
    blurb: 'Your cheapest, lowest-tier stacks take the hits first; each higher tier stands one step later.',
  },
  {
    id: 'ms',
    title: 'Troops first',
    icon: <GuardsmenIcon />,
    blurb:
      'Every mercenary and monster stack is kept smaller than your smallest troop stack, so hired units only fall after all your troops.',
  },
  {
    id: 'custom',
    title: 'Your own order',
    icon: <SortIcon />,
    blurb: 'You decide which stack falls first, mixing troops, mercenaries and monsters.',
  },
];

const METHOD_TITLES = new Map(METHOD_OPTIONS.map((option) => [option.id, option.title]));

const HELP = (
  <>
    <p>
      The enemy always strikes the stack with the most health still standing, so the size you give a stack
      decides when it falls. A method is the rule we size them by.
    </p>
    <p>
      <strong>Tier ladder</strong> spends the cheap units first: the higher the tier, the longer it stands.{' '}
      <strong>Troops first</strong> adds one rule on top — every hired stack stays under your smallest troop
      stack, so nothing expensive falls while a cheap troop is still up; the price is authority and dominance
      left unspent. <strong>Your own order</strong> hands you the list and lets you drag it around.
    </p>
    <p>
      <strong>Hired units in tens</strong> makes every mercenary and monster stack a multiple of ten: reviving
      happens in tens and one unit per ten comes back free, so round stacks are cheaper to bring back. The
      capacity that no longer fits stays unused.
    </p>
    <p>
      <strong>Where to find it in game:</strong> nowhere — you only see who fell first in the battle report
      afterwards, so hold that report next to our journal in Results to check the order came out as you asked.
    </p>
  </>
);

export function MethodSection() {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const radioName = useId();

  const units = useMemo<UnitDef[]>(() => (profile === undefined ? [] : buildUnits(profile).units), [profile]);

  if (profile === undefined || setup === undefined) return null;

  const options = setup.options;
  const stored = options.customOrder ?? [];
  // `StackingOptions` treats `customOrder` as strictly absent-or-present, so it is passed explicitly
  // rather than spread from the stored options (which type it as `string[] | undefined`).
  const base: StackingOptions = {
    method: options.method,
    strictMercsAboveMonsters: options.strictMercsAboveMonsters,
    monstersLast: options.monstersLast,
    roundTo10: options.roundTo10,
  };
  const defaultOrder = buildKillOrder(units, { ...base, method: 'elite' });
  const order = buildKillOrder(units, { ...base, method: 'custom', customOrder: stored });
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const isDefault = order.length === defaultOrder.length && order.every((id, i) => id === defaultOrder[i]);

  // The header line: the rule, then the extra rules that are switched on, in the words of the toggles.
  const extras = [
    options.monstersLast ? 'monsters after troops' : '',
    options.strictMercsAboveMonsters ? 'monsters after mercenaries' : '',
    options.relaxedPreservation ? 'damage trades' : '',
    options.roundTo10 ? 'tens' : '',
  ].filter((word) => word !== '');

  const setMethod = (method: Method): void => {
    updateActiveSetup((current) => ({
      options: {
        ...current.options,
        method,
        // The method-specific flags are exclusive with the method they do not belong to (PLAN §3.3).
        monstersLast: method === 'elite' ? current.options.monstersLast : false,
        strictMercsAboveMonsters: method === 'ms' ? current.options.strictMercsAboveMonsters : false,
        relaxedPreservation: method === 'ms' ? current.options.relaxedPreservation : false,
      },
    }));
  };

  const setFlag = (
    key: 'monstersLast' | 'strictMercsAboveMonsters' | 'relaxedPreservation' | 'roundTo10',
    on: boolean,
  ): void => {
    updateActiveSetup((current) => {
      const next = { ...current.options };
      next[key] = on;
      return { options: next };
    });
  };

  const setOrder = (next: string[]): void => {
    updateActiveSetup((current) => ({ options: { ...current.options, customOrder: next } }));
  };

  return (
    <Section
      id="method"
      title="Stacking method"
      icon={<MethodIcon />}
      help={HELP}
      summary={
        <p id="method-summary" className="text-xs">
          <span className="text-fg font-medium">{METHOD_TITLES.get(options.method) ?? options.method}</span>
          {extras.map((word) => (
            <span key={word} className="text-muted">
              {' · '}
              {word}
            </span>
          ))}
        </p>
      }
    >
      <div className="space-y-3">
        <fieldset className="grid gap-2 sm:grid-cols-3">
          <legend className="sr-only">Stacking method</legend>
          {METHOD_OPTIONS.map((option) => {
            const descriptionId = `${radioName}-${option.id}`;
            const checked = options.method === option.id;
            return (
              <div
                key={option.id}
                className={cn(
                  'flex flex-col gap-1 rounded-lg border px-2.5 py-2 transition-colors',
                  checked
                    ? 'border-accent bg-accent-soft shadow-card'
                    : 'border-line bg-surface hover:border-accent-line',
                )}
              >
                <label className="tap flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name={radioName}
                    value={option.id}
                    checked={checked}
                    aria-describedby={descriptionId}
                    onChange={() => {
                      setMethod(option.id);
                    }}
                    className="h-4 w-4 shrink-0"
                  />
                  <span aria-hidden="true" className={cn('shrink-0', checked ? 'text-accent' : 'text-muted')}>
                    {option.icon}
                  </span>
                  <span className="text-sm font-medium">{option.title}</span>
                </label>
                <p id={descriptionId} className="text-muted text-xs leading-relaxed">
                  {option.blurb}
                </p>
              </div>
            );
          })}
        </fieldset>

        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle
            label="Monsters after troops"
            description={
              options.method === 'elite'
                ? 'Keep every monster stack below your smallest troop stack; mercenaries stay free.'
                : 'Only with the tier ladder.'
            }
            checked={options.monstersLast}
            disabled={options.method !== 'elite'}
            onChange={(on) => {
              setFlag('monstersLast', on);
            }}
          />
          <Toggle
            label="Monsters after mercenaries"
            description={
              options.method === 'ms'
                ? 'Also keep every monster stack below your smallest mercenary stack. Off by default: the game does not seem to chain them that way.'
                : 'Only with Troops first.'
            }
            checked={options.strictMercsAboveMonsters}
            disabled={options.method !== 'ms'}
            onChange={(on) => {
              setFlag('strictMercsAboveMonsters', on);
            }}
          />
          <Toggle
            label="Allow damage trades"
            description={
              options.method === 'ms'
                ? 'Let a hired stack grow past your smallest troop stack when that raises the damage; the results name every stack it affects.'
                : 'Only with Troops first.'
            }
            checked={options.relaxedPreservation}
            disabled={options.method !== 'ms'}
            onChange={(on) => {
              setFlag('relaxedPreservation', on);
            }}
          />
          <Toggle
            label="Hired units in tens"
            description="Mercenary and monster stacks become multiples of ten, because reviving works in tens."
            checked={options.roundTo10}
            onChange={(on) => {
              setFlag('roundTo10', on);
            }}
          />
        </div>

        {options.method === 'custom' && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Order of the fall</h3>
              <Button
                size="sm"
                variant="ghost"
                icon={<ResetIcon />}
                disabled={isDefault}
                onClick={() => {
                  setOrder(defaultOrder);
                }}
              >
                Back to the tier ladder
              </Button>
            </div>
            <p className="text-muted text-xs">
              First to fall at the top. Drag a row, use its arrows, or pick the handle up with Space and move
              it with the arrow keys.
            </p>
            {order.length === 0 ? (
              <HelpNote tone="warn">
                There is no stack to order yet. Pick tiers in Troops, or hire a mercenary.
              </HelpNote>
            ) : (
              <KillOrderList order={order} units={unitsById} onChange={setOrder} />
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
