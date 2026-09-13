/**
 * Battle (design overhaul §7.4, amended by design plan §5.6) — one card for the rules this march is
 * fought under: who it is fought against, the rule its stacks are sized by, the extra rules that
 * ride on that one, the order of the fall and what the losses are paid with.
 *
 * What changes with *every* march left this card on 2026-09-13 (owner's choice, story D-56): the
 * three housing capacities and the objective are in the command bar on the bottom edge, beside
 * Generate, where a player retypes them without leaving the answer. What is left is configured and
 * read, not retyped.
 *
 * The arrangement is TotalStack's (investigation 0008), rebuilt on Mantine in our own skin and our
 * own words: the enemy as a caption, a three-segment control and four small count fields; then the
 * method as wide option cards in one row with the radio mark in the top-right corner and the whole
 * card as the target; then the rules that ride on it as switch rows, hidden rather than disabled
 * when they mean nothing; and last what the losses are paid with.
 *
 * Everything written here belongs to the *march*, not to the account: it all goes to the active
 * battle setup.
 */
import { Alert, Box, Group, NumberInput, SegmentedControl, SimpleGrid, Stack, Text } from '@mantine/core';
import { useId, useState } from 'react';

import { CATEGORIES } from '@/data/types';
import { eventEnemyFormation } from '@/state/derive';
import { DEFAULT_MARCHES, MAX_MARCHES } from '@/state/schema';
import type { SetupMethod } from '@/state/schema';
import { selectActiveSetup, useStore } from '@/state/store';
import { Glyph } from '@/ui/domain';
import { ChoiceList, NumberField, Panel, Sections, SwitchRow } from '@/ui/kit';
import { useResultStore } from '@/ui/resultStore';

import { appliesTo, isMethod, isRecoveryMode, METHOD_CHOICES, optionsFor, RECOVERY_CHOICES } from './choices';
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
import { OrderSheet } from './OrderSheet';

export function BattleSection() {
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  const error = useResultStore((state) => state.error);
  // "Custom" is a mode, not a formation: it stays chosen while the four fields still read 1·1·1·1.
  const [isManual, setManual] = useState(false);
  const titleId = useId();
  const enemyId = useId();
  const optionsId = useId();

  if (setup === undefined) return null;

  const { recoveryPlan, options, campaign } = setup;
  const forced = eventEnemyFormation(setup);
  const formation: Formation = forced ?? setup.enemy;
  const mode = forced === undefined && isManual ? 'custom' : detectMode(formation);
  const editable = mode === 'custom' && forced === undefined;
  const selectiveTop = recoveryPlan.selectiveTop ?? 3;
  const rules = optionsFor(options.method);

  const writeFormation = (next: Formation): void => {
    updateActiveSetup({ enemy: next });
  };

  const setMethod = (method: SetupMethod): void => {
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
      {/* Three parts, told apart the way every card's parts are: one hairline, 16 px above and
          below (`kit/Sections.tsx`, docs/design.md §4). They were 16 px of air and nothing else,
          which is why the owner read the card as one run of controls. */}
      <Sections>
        {/* Who it is fought against: the count, the three presets, and the squads behind them. */}
        <Stack gap={8}>
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
        <Stack gap="md">
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

          {/* What a campaign is (S-54). Two fields in the card's own field style, under the method
              they belong to, and only while it is chosen — the rest of the card is about one march. */}
          {options.method === 'complete' && (
            <Stack gap="sm" maw={520}>
              <NumberField
                label="Marches planned"
                description="How many times you fight this army before hiring again."
                value={campaign.marches}
                min={1}
                max={MAX_MARCHES}
                onChange={(value) => {
                  updateActiveSetup((current) => ({
                    campaign: { ...current.campaign, marches: value ?? DEFAULT_MARCHES },
                  }));
                }}
              />
              <NumberField
                label="Silver budget"
                description="Empty means no limit. A campaign stops before a march it cannot pay for, so pair it with the damage-per-silver objective."
                value={campaign.silverBudget ?? null}
                allowEmpty
                placeholder="Unlimited"
                min={0}
                leftSection={<Glyph kind="silver" />}
                onChange={(value) => {
                  updateActiveSetup((current) => ({
                    campaign: {
                      marches: current.campaign.marches,
                      ...(value === null ? {} : { silverBudget: value }),
                    },
                  }));
                }}
              />
            </Stack>
          )}

          {/* Complete optimization has none: a rule that fixes one sizing is the player answering the
              question they asked the search, so the whole block goes with them (§7.4). */}
          {rules.length > 0 && (
            <Stack gap="xs" role="group" aria-labelledby={optionsId}>
              <Text size="xs" fw={500} id={optionsId}>
                Options
              </Text>
              {/* 8 px apart, the switch immediately before its label (owner, 2026-09-13). */}
              <Stack gap="sm">
                {rules.map((option) => (
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
          )}
        </Stack>

        {/* What the losses are paid with. The objective used to sit beside it; it is in the command
          bar now, where it is read every day (design plan §5.6). */}
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

        {error !== null && (
          <Alert color="danger" variant="light" title="That march could not be generated">
            {error}
          </Alert>
        )}
      </Sections>
    </Panel>
  );
}
