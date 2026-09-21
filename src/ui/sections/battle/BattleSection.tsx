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
import {
  Alert,
  Box,
  Checkbox,
  Group,
  NumberInput,
  SegmentedControl,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useId, useState } from 'react';

import { CATEGORIES } from '@/data/types';
import type { UnitFamily } from '@/engine/types';
import { eventEnemyFormation } from '@/state/derive';
import type { SetupMethod } from '@/state/schema';
import { useActiveProfileSlice, useActiveSetupSlice, useStore } from '@/state/store';
import { Glyph, GROUP_LABEL } from '@/ui/domain';
import { ChoiceList, Panel, Sections, SwitchRow } from '@/ui/kit';
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

/**
 * The families a player chooses between, **in the order the two columns read down** (owner,
 * 2026-09-21): guardsmen over monsters on the left, specialists over engineers on the right — the two
 * families an epic march is won and lost with first, then the two it rarely fields. A two-column grid
 * fills row by row, so the list is written in the order the cells are laid, not the order they are read.
 *
 * **Mercenaries are not one of them.** A hired unit cannot be recruited again — there is no camp to
 * recruit it from — so the Temple returns it under every plan and there is nothing here to decide
 * (owner, 2026-09-21; `engine/recovery.ts`, `retrainOne`). A box that cannot be unticked is a box that
 * should not be drawn (design rule 15).
 */
const REVIVABLE = ['guardsmen', 'specialists', 'monsters', 'engineers'] as const satisfies UnitFamily[];

/**
 * **The tier each box is about, in the account's own shorthand** (owner, 2026-09-21: *"maybe we should
 * also precise this next to top monsters / top guardsmen… ex: (RD 3), all M3"*).
 *
 * "Top guardsmen" is a rule, and a rule a player has to hold in their head is a rule they will read
 * wrong: what the Temple actually returns is **every stack at the family's top tier**, which on this
 * account is a figure the Troops card above already names — G3, S1, M3, the same letters and the same
 * numbers `rangeSummary` writes in that card's head (`sections/troops/rows.ts`, design rule 5).
 *
 * The *account's* top tier and not the march's: the card is read before a march exists, and the two
 * agree on every march that fields the rung. A family the account does not field at all says nothing,
 * and its box is drawn all the same — the plan is the setup's, and a player may field that family
 * tomorrow.
 */
const FAMILY_PREFIX: Record<(typeof REVIVABLE)[number], string> = {
  guardsmen: 'G',
  specialists: 'S',
  monsters: 'M',
  engineers: 'E',
};

export function BattleSection() {
  // Only the four fields this card reads (`useActiveSetupSlice`): the housing is typed in the bar
  // under this card, and every keystroke there used to re-render the method cards and the enemy
  // fields for nothing.
  const setup = useActiveSetupSlice((current) => ({
    recoveryPlan: current.recoveryPlan,
    options: current.options,
    enemy: current.enemy,
    active: current.active,
  }));
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);
  // The tier ranges alone, for the shorthand beside each family's box; a keystroke anywhere else on the
  // account does not re-render this card for it.
  const troops = useActiveProfileSlice((current) => ({ troops: current.troops }))?.troops;
  const error = useResultStore((state) => state.error);
  // "Custom" is a mode, not a formation: it stays chosen while the four fields still read 1·1·1·1.
  const [isManual, setManual] = useState(false);
  const titleId = useId();
  const enemyId = useId();
  const optionsId = useId();

  if (setup === undefined) return null;

  const { recoveryPlan, options } = setup;
  const forced = eventEnemyFormation(setup);
  const formation: Formation = forced ?? setup.enemy;
  const mode = forced === undefined && isManual ? 'custom' : detectMode(formation);
  const editable = mode === 'custom' && forced === undefined;
  // No list stored is *every family* (`RecoverySettings.plan`); a new setup arrives with the monsters
  // alone, which is the plan the owner plays (`state/defaults.ts`).
  const reviveFamilies: readonly UnitFamily[] = recoveryPlan.reviveFamilies ?? REVIVABLE;
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
          {/* One card per method side by side where there is room — four since S-56 removed the fifth;
            on a phone the chosen one alone, behind "Change Stacking method" (D-54) — the method is set
            once and read every day. */}
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

          {/* Complete optimization has no rules of its own: a rule that fixes one sizing is the player
              answering the question they asked the search, so the whole block goes with them (§7.4).
              Nor has it any fields — the owner's review of 2026-09-15 took the last two off the card
              (S-56): the marches it plans over and the silver it may spend are policy numbers now, read
              from `src/config.ts`, so there is nothing here for a player to type. */}
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
                // The families are written under every plan, not only the one that reads them: a
                // player who looks at "Retrain everything" and comes back finds their own ticks where
                // they left them, instead of all four back on.
                recoveryPlan: { mode: value, reviveFamilies: [...reviveFamilies] },
              });
            }}
          />
          {/**
           * **Which families come back from the Temple** (owner, 2026-09-21: *"unit types to revive is
           * not clear. We should allow more flexibility like: checkboxes for revive top monster, revive
           * top guardsmen, all selected by default"*).
           *
           * It was a number — "Unit types to revive: 3" — which the player had to translate into an
           * army: three types off one list sorted by tier, so an account with four monster tiers spent
           * the whole allowance on monsters and retrained its guardsmen without ever having been asked.
           * Five boxes, all ticked, say the same thing as an answer to the question a player actually
           * has, and each one is a decision they can see: *the top guardsman comes back, the top
           * monster comes back.*
           *
           * Whole rows are the target (design rule 8) and the family wears the mark it wears
           * everywhere else in the app (rule 21).
           */}
          {recoveryPlan.mode === 'selective' && (
            <Checkbox.Group
              label="Which troop types to revive"
              description="Select which troop types to revive using gold. When selecting a troop type, the best troops only will be revived."
              value={[...reviveFamilies]}
              onChange={(chosen) => {
                updateActiveSetup({
                  recoveryPlan: {
                    mode: 'selective',
                    // Filtered out of the card's own list, never stored in the order they were ticked.
                    reviveFamilies: REVIVABLE.filter((family) => chosen.includes(family)),
                  },
                });
              }}
            >
              {/* Two across, as the four enemy fields above are: a family is two words. */}
              <SimpleGrid cols={2} spacing={8} mt={8} maw={520}>
                {REVIVABLE.map((family) => (
                  <Checkbox
                    key={family}
                    value={family}
                    size="xs"
                    label={
                      <Group gap={6} wrap="nowrap">
                        <Glyph kind={family} />
                        <Text span size="xs">
                          {`Top ${GROUP_LABEL[family].toLowerCase()}`}
                        </Text>
                        {/* A real space, not the row's gap: the accessible-name algorithm only puts one
                            between *block* boxes, so without it the box is announced "Top guardsmenG3"
                            (the same trap `MercenariesSection`'s picker rows carry a note about). CSS
                            gaps are not text. */}{' '}
                        {/* The tier itself, muted, where the account fields one: "Top monsters M3" reads
                            as the rule *and* as the units it will hand the Temple. */}
                        {troops?.[family] != null && (
                          <Text span size="xs" c="dimmed">
                            {`${FAMILY_PREFIX[family]}${String(troops[family].max)}`}
                          </Text>
                        )}
                      </Group>
                    }
                  />
                ))}
              </SimpleGrid>
            </Checkbox.Group>
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
