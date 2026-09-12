/**
 * S-13 — Stacking method section (PLAN §4.4, §3.3).
 *
 * The method is a property of one march, so unlike Troops and Mercenaries this section writes to the
 * active *battle setup*. The custom order is stored as a plain list of unit ids; the list shown here is
 * always the stored one re-merged with the units currently in the march (ids that no longer exist are
 * dropped, new ones are appended in Elite-Preservation order), which is exactly what the engine does when
 * it reads `customOrder`.
 */
import { useId, useMemo } from 'react';

import type { UnitDef } from '@/data/types';
import { buildKillOrder } from '@/engine';
import type { Method, StackingOptions } from '@/engine';
import { buildUnits } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';

import { Button, HelpNote, Section, Toggle, cn } from '../../primitives';
import { KillOrderList } from './KillOrderList';

interface MethodOption {
  id: Method;
  title: string;
  blurb: string;
}

const METHOD_OPTIONS: readonly MethodOption[] = [
  {
    id: 'elite',
    title: 'Elite Preservation',
    blurb:
      'Your cheapest, lowest units take the hits first, so the expensive ones are still standing at the end of the fight. Engineers go first, then tier by tier upwards.',
  },
  {
    id: 'ms',
    title: "M's Preservation",
    blurb:
      'Elite Preservation, plus every mercenary and monster stack is kept smaller than your smallest troop stack, so they only start dying once the troops are gone. Some authority and dominance is left unspent to make that possible.',
  },
  {
    id: 'custom',
    title: 'Custom kill order',
    blurb: 'You decide the order yourself, mixing troops, mercenaries and monsters however you like.',
  },
];

const METHOD_TITLES = new Map(METHOD_OPTIONS.map((option) => [option.id, option.title]));

const HELP = (
  <>
    <p>
      The enemy always hits the stack with the most total health left, so the order in which your stacks die
      is decided by how big you make them. The method is how we pick those sizes.
    </p>
    <p>
      <strong>Elite Preservation</strong> sends the cheap units first: the higher the tier, the longer it
      survives. <strong>M&rsquo;s Preservation</strong> adds a second rule — mercenaries and monsters sit
      below your smallest troop stack, so nothing expensive dies while a cheap troop is still alive; the price
      is unused authority and dominance. <strong>Custom</strong> hands you the list and lets you drag it into
      any order you want.
    </p>
    <p>
      <strong>Round to 10s</strong> makes every mercenary and monster stack a multiple of ten. Training and
      revival happen in chunks of ten and one unit per chunk comes back free, so round numbers are cheaper to
      bring back; the capacity that no longer fits simply stays unused.
    </p>
    <p>
      <strong>Where to find it in game:</strong> nothing here is a screen you can read — the order is only
      visible after the fight, in the battle report, where the stacks fall one by one. Compare that report
      with our journal in Results to check the order came out the way you asked.
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
      description="The order your stacks are meant to die in."
      help={HELP}
      summary={<span className="text-muted">{METHOD_TITLES.get(options.method) ?? options.method}</span>}
    >
      <div className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="sr-only">Stacking method</legend>
          {METHOD_OPTIONS.map((option) => {
            const descriptionId = `${radioName}-${option.id}`;
            const checked = options.method === option.id;
            return (
              <div
                key={option.id}
                className={cn(
                  'rounded-lg border px-3 py-2 transition-colors',
                  checked ? 'border-accent bg-accent-soft' : 'border-line bg-surface',
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
                    className="accent-accent h-4 w-4"
                  />
                  <span className="text-sm font-medium">{option.title}</span>
                </label>
                <p id={descriptionId} className="text-muted mt-1 text-xs leading-relaxed">
                  {option.blurb}
                </p>
              </div>
            );
          })}
        </fieldset>

        <div className="space-y-3">
          <Toggle
            label="Monsters last"
            description={
              options.method === 'elite'
                ? 'Keep every monster stack below your smallest troop stack; mercenaries stay unconstrained.'
                : 'Only available with Elite Preservation.'
            }
            checked={options.monstersLast}
            disabled={options.method !== 'elite'}
            onChange={(on) => {
              setFlag('monstersLast', on);
            }}
          />
          <Toggle
            label="Mercenaries above monsters"
            description={
              options.method === 'ms'
                ? 'Also force every monster stack below your smallest mercenary stack. Off by default: the game does not appear to enforce that chain.'
                : "Only available with M's Preservation."
            }
            checked={options.strictMercsAboveMonsters}
            disabled={options.method !== 'ms'}
            onChange={(on) => {
              setFlag('strictMercsAboveMonsters', on);
            }}
          />
          <Toggle
            label="Relaxed preservation"
            description={
              options.method === 'ms'
                ? 'Lets a monster or mercenary stack grow past your lowest troop stack when that raises both the minimum and the average damage, so some monsters die before your last troops — the results list warns you and names them.'
                : "Only available with M's Preservation."
            }
            checked={options.relaxedPreservation}
            disabled={options.method !== 'ms'}
            onChange={(on) => {
              setFlag('relaxedPreservation', on);
            }}
          />
          <Toggle
            label="Round to 10s"
            description="Mercenary and monster stacks become multiples of ten, because revival works in tens."
            checked={options.roundTo10}
            onChange={(on) => {
              setFlag('roundTo10', on);
            }}
          />
        </div>

        {options.method === 'custom' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Kill order</h3>
              <Button
                size="sm"
                disabled={isDefault}
                onClick={() => {
                  setOrder(defaultOrder);
                }}
              >
                Reset to default
              </Button>
            </div>
            <p className="text-muted text-xs">
              First to die at the top. Drag a row, use its up and down buttons, or focus the drag handle and
              press Space then the arrow keys.
            </p>
            {order.length === 0 ? (
              <HelpNote tone="warn">
                There is no unit type to order yet. Pick tiers in Troops, or mercenaries above.
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
