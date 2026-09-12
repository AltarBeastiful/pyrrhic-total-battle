/**
 * Battle (design plan §7.4) — one card for everything this march is fought under: who it is fought
 * against, what it may carry, the rule its stacks are sized by, the extra rules that go with that
 * rule, and what a Generate aims at. It replaces the three legacy sections (Stacking method, Enemy
 * formation, Housing and march), which were a mishmash of cards, selects and disabled toggles.
 *
 * Material 3 anatomy throughout: the formation is a segmented button, every number is a stepper,
 * the method and the objective are single-select lists whose whole row is the target, and the extra
 * rules are switch rows. A rule that does not apply to the chosen method is **hidden, not
 * disabled** — a control you cannot use teaches nothing.
 *
 * Everything here belongs to the *march*, not to the account: it is all written to the active
 * battle setup.
 */
import { useId, useState } from 'react';

import { CATEGORIES } from '@/data/types';
import type { Method } from '@/engine';
import { eventEnemyFormation } from '@/state/derive';
import { RECOVERY_MODES } from '@/state/schema';
import { selectActiveSetup, useStore } from '@/state/store';
import { PoolBadge } from '@/ui/icons';
import { Banner, Card, NumberStepper, OptionList, Segmented, Select, Switch } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';
import { useResultStore } from '@/ui/resultStore';
import { MEDIUM, useMediaQuery } from '@/ui/shell/useMediaQuery';

import {
  appliesTo,
  isMethod,
  isPriority,
  METHOD_CHOICES,
  OBJECTIVE_CHOICES,
  optionsFor,
  POOL_HINTS,
  POOL_LABELS,
  POOLS,
  RECOVERY_LABELS,
} from './choices';
import type { OptionKey } from './choices';
import {
  CATEGORY_LABEL,
  describeFormation,
  detectMode,
  isFormationMode,
  MODE_LABELS,
  MODES,
  PRESETS,
  squadCount,
} from './formation';
import type { Formation } from './formation';
import { OrderSheet } from './OrderSheet';

export function BattleSection() {
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const error = useResultStore((state) => state.error);
  // Under Material 3's medium window the objective list folds to the chosen row (§7.4).
  const isMedium = useMediaQuery(MEDIUM);
  // "Custom" is a mode, not a formation: it stays chosen while the four fields still read 1·1·1·1.
  const [isManual, setManual] = useState(false);
  const titleId = useId();
  const optionsId = useId();

  if (setup === undefined) return null;

  const { housing, priority, recoveryPlan, options } = setup;
  const forced = eventEnemyFormation(setup);
  const formation: Formation = forced ?? setup.enemy;
  const mode = forced === undefined && isManual ? 'custom' : detectMode(formation);
  const squads = squadCount(formation);
  const selectiveTop = recoveryPlan.selectiveTop ?? 3;
  // Nothing to fill: the engine would answer with an empty march and a list of identical reasons.
  const noHousing = housing.leadership + housing.authority + housing.dominance === 0;

  const writeFormation = (next: Formation): void => {
    updateActiveSetup({ enemy: next });
  };

  const setMethod = (method: Method): void => {
    updateActiveSetup((current) => ({
      options: {
        ...current.options,
        method,
        // The extra rules belong to the method they were written for (PLAN §3.3).
        monstersLast: appliesTo('monstersLast', method) && current.options.monstersLast,
        strictMercsAboveMonsters:
          appliesTo('strictMercsAboveMonsters', method) && current.options.strictMercsAboveMonsters,
        relaxedPreservation: appliesTo('relaxedPreservation', method) && current.options.relaxedPreservation,
      },
    }));
  };

  const setOption = (key: OptionKey, on: boolean): void => {
    updateActiveSetup((current) => {
      const next = { ...current.options };
      next[key] = on;
      return { options: next };
    });
  };

  return (
    <Card as="section" id="battle" aria-labelledby={titleId}>
      <Stack gap={4}>
        <h2 id={titleId} className="font-display text-lg">
          Battle
        </h2>

        {/* Who you are fighting, and what you may bring. */}
        <Grid cols={{ base: 1, lg: 2 }} gap={4}>
          <Stack gap={3}>
            {forced === undefined ? (
              <Segmented
                label="Enemy formation"
                value={mode}
                onChange={(value) => {
                  if (!isFormationMode(value)) return;
                  if (value === 'custom') {
                    setManual(true);
                    return;
                  }
                  setManual(false);
                  writeFormation({ ...PRESETS[value] });
                }}
                options={MODES.map((value) => ({ value, label: MODE_LABELS[value] }))}
              />
            ) : (
              <Banner tone="info" title="Enemy formation">
                An active event fixes the formation for this march. Turn the event off in Bonuses to choose it
                yourself.
              </Banner>
            )}

            {mode === 'custom' && forced === undefined && (
              <Grid cols={{ base: 2, sm: 4 }} gap={2}>
                {CATEGORIES.map((category) => (
                  <NumberStepper
                    key={category}
                    label={CATEGORY_LABEL[category]}
                    size="sm"
                    value={formation[category]}
                    min={0}
                    max={20}
                    onChange={(value) => {
                      writeFormation({ ...formation, [category]: value ?? 0 });
                    }}
                  />
                ))}
              </Grid>
            )}

            <p className="text-muted text-sm">
              {`${String(squads)} squads: ${describeFormation(formation)}.`}
            </p>
          </Stack>

          <Grid cols={{ base: 1, sm: 3 }} gap={3}>
            {POOLS.map((pool) => (
              <NumberStepper
                key={pool}
                label={POOL_LABELS[pool]}
                description={POOL_HINTS[pool]}
                prefix={<PoolBadge pool={pool} size="sm" />}
                // A pool at zero is a pool nobody has filled in yet, so the field stands empty and
                // invites the number instead of showing a 0 the player never typed.
                value={housing[pool] === 0 ? null : housing[pool]}
                min={0}
                max={100_000_000}
                bigStep={100}
                hugeStep={1000}
                allowEmpty
                onChange={(value) => {
                  updateActiveSetup({ housing: { ...housing, [pool]: value ?? 0 } });
                }}
              />
            ))}
          </Grid>
        </Grid>

        {/* The rule the stacks are sized by, and the rules that ride on it. */}
        <Grid cols={{ base: 1, lg: 2 }} gap={4}>
          <OptionList
            label="Stacking method"
            value={options.method}
            onChange={(value) => {
              if (isMethod(value)) setMethod(value);
            }}
            options={METHOD_CHOICES.map((choice) => ({
              value: choice.value,
              title: choice.title,
              description: choice.description,
              ...(choice.value === 'custom' ? { trailing: <OrderSheet /> } : {}),
            }))}
          />

          <Stack gap={3} role="group" aria-labelledby={optionsId}>
            <h3 id={optionsId} className="text-sm font-medium">
              Options
            </h3>
            {optionsFor(options.method).map((option) => (
              <Switch
                key={option.key}
                label={option.label}
                description={option.description}
                isSelected={options[option.key]}
                onChange={(on) => {
                  setOption(option.key, on);
                }}
              />
            ))}
          </Stack>
        </Grid>

        {/* What a Generate aims at, and what the losses are paid with. */}
        <Grid cols={{ base: 1, lg: 2 }} gap={4}>
          <OptionList
            label="Objective"
            collapsible={!isMedium}
            value={priority}
            onChange={(value) => {
              if (isPriority(value)) updateActiveSetup({ priority: value });
            }}
            options={OBJECTIVE_CHOICES.map((choice) => ({
              value: choice.value,
              title: choice.title,
              description: choice.description,
            }))}
          />

          <Stack gap={3}>
            <Select
              label="Recovery plan"
              value={recoveryPlan.mode}
              options={RECOVERY_MODES.map((value) => ({ value, label: RECOVERY_LABELS[value] }))}
              onChange={(value) => {
                const next = RECOVERY_MODES.find((mode) => mode === value);
                if (next === undefined) return;
                updateActiveSetup({
                  recoveryPlan: next === 'selective' ? { mode: next, selectiveTop } : { mode: next },
                });
              }}
            />
            {recoveryPlan.mode === 'selective' && (
              <NumberStepper
                label="Unit types to revive"
                description="The highest tiers are revived, everything else is retrained."
                value={selectiveTop}
                min={1}
                max={20}
                onChange={(value) => {
                  updateActiveSetup({ recoveryPlan: { mode: 'selective', selectiveTop: value ?? 1 } });
                }}
              />
            )}
          </Stack>
        </Grid>

        {noHousing && (
          <Banner tone="warn">
            Enter your housing values from the march screen first: with no leadership, authority or dominance
            there is nothing to fill.
          </Banner>
        )}

        {error !== null && <Banner tone="danger">{error}</Banner>}
      </Stack>
    </Card>
  );
}
