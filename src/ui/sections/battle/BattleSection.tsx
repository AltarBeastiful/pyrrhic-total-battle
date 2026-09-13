/**
 * Battle (design overhaul §7.4) — one card for everything this march is fought under: what it may
 * carry, who it is fought against, the rule its stacks are sized by, the extra rules that ride on
 * that one, and what a Generate aims at.
 *
 * The arrangement is TotalStack's (investigation 0008), rebuilt on Mantine in our own skin and our
 * own words: the three capacities first as large plain inputs — nobody steps to 84 300 — then the
 * enemy as a caption, a three-segment control and four small count fields; then the method as wide
 * option cards in one row with the radio mark in the top-right corner and the whole card as the
 * target; then the rules that ride on it as switch rows, hidden rather than disabled when they mean
 * nothing; and last the objective, folded to the chosen one on a phone, beside what the losses are
 * paid with.
 *
 * Everything written here belongs to the *march*, not to the account: it all goes to the active
 * battle setup.
 */
import { Alert, Box, Group, NumberInput, SegmentedControl, SimpleGrid, Stack, Text } from '@mantine/core';
import { useId, useState } from 'react';

import { CATEGORIES } from '@/data/types';
import type { Method } from '@/engine';
import { eventEnemyFormation } from '@/state/derive';
import { selectActiveSetup, useStore } from '@/state/store';
import { Glyph } from '@/ui/domain';
import { ChoiceList, NumberField, Panel, SwitchRow } from '@/ui/kit';
import { useResultStore } from '@/ui/resultStore';

import {
  appliesTo,
  isMethod,
  isPriority,
  isRecoveryMode,
  METHOD_CHOICES,
  OBJECTIVE_CHOICES,
  optionsFor,
  POOL_LABELS,
  POOLS,
  RECOVERY_CHOICES,
} from './choices';
import type { OptionKey } from './choices';
import {
  CATEGORY_LABEL,
  detectMode,
  isFormationMode,
  MODE_LABELS,
  MODES,
  PRESETS,
  squadCount,
} from './formation';
import type { Formation } from './formation';
import classes from './battle.module.css';
import { OrderSheet } from './OrderSheet';

export function BattleSection() {
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const error = useResultStore((state) => state.error);
  // "Custom" is a mode, not a formation: it stays chosen while the four fields still read 1·1·1·1.
  const [isManual, setManual] = useState(false);
  const titleId = useId();
  const housingId = useId();
  const enemyId = useId();
  const optionsId = useId();

  if (setup === undefined) return null;

  const { housing, priority, recoveryPlan, options } = setup;
  const forced = eventEnemyFormation(setup);
  const formation: Formation = forced ?? setup.enemy;
  const mode = forced === undefined && isManual ? 'custom' : detectMode(formation);
  const editable = mode === 'custom' && forced === undefined;
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
        // The extra rules belong to the method they were written for (§7.4).
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
    <Panel component="section" id="battle" aria-labelledby={titleId} title="Battle" titleId={titleId}>
      <Stack gap="lg">
        {/*
        What the march may carry. A capacity is typed or pasted off the game's Start March screen,
        never walked to, so the three pools are plain inputs whose whole value is selected the moment
        one takes focus (owner, 2026-09-13). They sit on one row and wrap when the card is narrow.
      */}
        <Stack gap={6}>
          <Text size="xs" fw={500} id={housingId}>
            Housing
          </Text>
          {/* Three across from the small window up, two on a phone — thirds of the panel, as the
            artboard draws them (`.fields`); the biggest wells on the page, because these are the
            figures a player retypes off the game's own march screen. */}
          <SimpleGrid
            cols={{ base: 2, xs: 3 }}
            spacing="lg"
            className={classes.housing}
            aria-labelledby={housingId}
          >
            {POOLS.map((pool) => (
              <Box key={pool} miw={0}>
                <NumberField
                  label={POOL_LABELS[pool]}
                  leftSection={<Glyph kind={pool} />}
                  // A pool at zero is one nobody has filled in yet, so the field stands empty and
                  // invites the number instead of showing a 0 the player never typed.
                  value={housing[pool] === 0 ? null : housing[pool]}
                  min={0}
                  max={100_000_000}
                  allowEmpty
                  onChange={(value) => {
                    updateActiveSetup({ housing: { ...housing, [pool]: value ?? 0 } });
                  }}
                />
              </Box>
            ))}
          </SimpleGrid>
        </Stack>

        {/* Who it is fought against: the count, the three presets, and the squads behind them. */}
        <Stack gap={6}>
          <Text size="xs" fw={500} id={enemyId}>
            {`Enemy stacks: ${String(squadCount(formation))}`}
          </Text>
          {forced === undefined ? (
            <SegmentedControl
              size="xs"
              fullWidth
              maw={520}
              aria-labelledby={enemyId}
              value={mode}
              data={MODES.map((value) => ({ value, label: MODE_LABELS[value] }))}
              onChange={(value) => {
                if (!isFormationMode(value)) return;
                if (value === 'custom') {
                  setManual(true);
                  return;
                }
                setManual(false);
                writeFormation({ ...PRESETS[value] });
              }}
            />
          ) : (
            <Alert color="brass" variant="light" title="Fixed by an event">
              An active event decides the enemy for this march. Turn the event off in Bonuses to choose it
              yourself.
            </Alert>
          )}
          {/* One row of four, at every width (D-54): a squad count is two digits, and two rows of two
            cost a phone 59 px for nothing. */}
          <SimpleGrid cols={4} spacing="xs" maw={520}>
            {CATEGORIES.map((category) => (
              <Box key={category} miw={0}>
                <NumberInput
                  size="xs"
                  label={CATEGORY_LABEL[category]}
                  leftSection={<Glyph kind={category} />}
                  // A preset's squads are still worth reading, so they are shown rather than greyed:
                  // the fields only accept typing under "Custom" (investigation 0008, "Enemy stacks").
                  readOnly={!editable}
                  value={formation[category]}
                  min={0}
                  max={20}
                  allowDecimal={false}
                  allowNegative={false}
                  onChange={(value) => {
                    const next = typeof value === 'number' ? value : Number(value);
                    writeFormation({ ...formation, [category]: Number.isNaN(next) ? 0 : next });
                  }}
                />
              </Box>
            ))}
          </SimpleGrid>
        </Stack>

        {/* The rule the stacks are sized by, and the rules that ride on it. */}
        <Stack gap="sm">
          {/* Three cards side by side where there is room; on a phone the chosen one alone, behind
            "Change Stacking method" (D-54) — the method is set once and read every day. */}
          <ChoiceList
            layout="cards"
            label="Stacking method"
            value={options.method}
            items={METHOD_CHOICES}
            columns={METHOD_CHOICES.length}
            collapsible
            onChange={(value) => {
              if (isMethod(value)) setMethod(value);
            }}
          />
          {/*
          The list a custom order needs is long and nothing like a row of options, so it opens beside
          the card. The button sits under the grid rather than inside the chosen card: a `Radio.Card`
          is itself a button, and a button inside a button is neither valid nor reachable.
        */}
          {options.method === 'custom' && (
            <Group gap="xs">
              <OrderSheet />
            </Group>
          )}

          <Stack gap="xs" role="group" aria-labelledby={optionsId}>
            <Text size="xs" fw={500} id={optionsId}>
              Options
            </Text>
            {/* 8 px apart, the switch immediately before its label (owner, 2026-09-13). */}
            <Stack gap="sm">
              {optionsFor(options.method).map((option) => (
                <SwitchRow
                  key={option.key}
                  label={option.label}
                  description={option.description}
                  checked={options[option.key]}
                  onChange={(on) => {
                    setOption(option.key, on);
                  }}
                />
              ))}
            </Stack>
          </Stack>
        </Stack>

        {/* What a Generate aims at, and what the losses are paid with. */}
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          <ChoiceList
            layout="cards"
            label="Objective"
            value={priority}
            items={OBJECTIVE_CHOICES}
            collapsible
            onChange={(value) => {
              if (isPriority(value)) updateActiveSetup({ priority: value });
            }}
          />

          <Stack gap="sm">
            {/* Three options, so three whole rows and no dropdown (design rule 8; the last select box
              in the app, investigation 0011). */}
            <ChoiceList
              label="Recovery plan"
              value={recoveryPlan.mode}
              items={RECOVERY_CHOICES}
              collapsible
              onChange={(value) => {
                if (!isRecoveryMode(value)) return;
                updateActiveSetup({
                  recoveryPlan: value === 'selective' ? { mode: value, selectiveTop } : { mode: value },
                });
              }}
            />
            {recoveryPlan.mode === 'selective' && (
              <NumberField
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
        </SimpleGrid>

        {noHousing && (
          <Alert color="brass" variant="light">
            Enter your housing values from the march screen first: with no leadership, authority or dominance
            there is nothing to fill.
          </Alert>
        )}

        {error !== null && (
          <Alert color="danger" variant="light" title="That march could not be generated">
            {error}
          </Alert>
        )}
      </Stack>
    </Panel>
  );
}
