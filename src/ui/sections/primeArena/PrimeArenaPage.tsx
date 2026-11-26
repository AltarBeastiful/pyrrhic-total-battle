/**
 * The Prime Arena page (B-35): the sixth kind of fight, the arena's two-round match between two armies, planned
 * for the Attack squad against a mirror. It is a page of its own, like the talent planner, rather than another
 * card on the march calculator: nothing here reads the march (`PLAN.md` path untouched), it only reads the
 * account's gear and bonus sources through `primeArenaInputs`.
 *
 * The form is the summary (design rule 6): the division tier, the two typed pools (rule 9), the five captains
 * and the shared gear through the calculator's own Bonuses body bound to the squad (rules 8, 12), and one switch
 * per permanent source and for talents and the dragon, the rules' own defaults on.
 * Generate sits next to the answer (rule 2). The result follows rule 28's order: the recap first, then the
 * stack list as the army, then the story, folded into one log per round. Colours are the unit's group and
 * tier colours through the shared badge (rules 20, 23), words are ours (rule 26).
 */
import { Badge, Button, Group, SegmentedControl, SimpleGrid, Stack, Table, Text, Title } from '@mantine/core';
import { useEffect, useMemo } from 'react';

import { PRIME_ARENA_CAPTAINS, PRIME_ARENA_SOURCES, type PrimeArenaSource } from '@/engine/primeArenaInputs';
import type { PrimeArenaPlan } from '@/engine/primeArenaPlanner';
import type { SetupBinding } from '@/state/setupBinding';
import type { PrimeArenaRound, PrimeArenaSideOutcome } from '@/engine/primeArena';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { TierBadge } from '@/ui/domain';
import { count } from '@/ui/domain/format';
import { romanTier } from '@/ui/domain/unitGroup';
import { Disclosure, NumberField, Panel, SwitchRow } from '@/ui/kit';
import { BonusesBody } from '@/ui/sections/bonuses/BonusesBody';
import type { BodyScope } from '@/ui/sections/bonuses/bodyScope';

import { topTier, usePrimeArenaStore, type PlanBudget } from './primeArenaStore';

const SOURCE_LABELS: Record<PrimeArenaSource, string> = {
  talents: 'Talents',
  hallOfFame: 'Hall of Fame',
  customization: 'Personal technologies',
  armyModernization: 'Army modernization',
  monstersBoost: 'Monuments',
};

/** Five captains take the field; artifacts keep the calculator's three. */
const ARENA_CAPS = { captains: PRIME_ARENA_CAPTAINS, artifacts: 3 } as const;

/**
 * What the arena counts of the cards: captains (no hero, no march type), equipment and artifacts. Titles, events,
 * the temple, VIP and the other pills never count, and the permanent sources have their own switches below.
 */
const ARENA_SCOPE: BodyScope = {
  families: ['captains', 'equipment'],
  folded: ['artifacts'],
  hero: false,
  marchType: false,
  audit: false,
};

const pct = (share: number): string => `${(share * 100).toFixed(1)} %`;

export interface PrimeArenaPageProps {
  /** Tightens the search; tests only. */
  budget?: PlanBudget;
}

export function PrimeArenaPage({ budget }: PrimeArenaPageProps) {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const {
    tier,
    toggles,
    setup: squad,
    running,
    plan,
    planTier,
    setTier,
    setToggle,
    updateSetup,
    seedFrom,
    generate,
  } = usePrimeArenaStore();

  useEffect(() => {
    if (profile === undefined || setup === undefined) return;
    seedFrom(setup);
  }, [profile, setup, seedFrom]);

  // The arena's rules, as the shared body's binding: its own squad, five captains.
  const binding = useMemo<SetupBinding>(
    () => ({
      setup: squad,
      update: (edit) => {
        updateSetup(edit);
      },
      caps: ARENA_CAPS,
    }),
    [squad, updateSetup],
  );
  const tiers = useMemo(() => Array.from({ length: topTier() }, (_, i) => i + 1), []);
  const canGenerate =
    profile !== undefined && !running && squad.housing.leadership + squad.housing.dominance > 0;

  return (
    <Stack gap="lg" component="section" aria-labelledby="prime-arena-title">
      <Panel title={<span id="prime-arena-title">Prime Arena</span>} meta="Attack squad, mirror defender">
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            A match is two rounds between the same two armies. Win both rounds to win; if you split, the
            larger share of surviving troops wins.
          </Text>

          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Division
            </Text>
            <SegmentedControl
              fullWidth
              size="sm"
              aria-label="Division tier"
              value={String(tier)}
              data={tiers.map((tier) => ({ value: String(tier), label: romanTier(tier) }))}
              onChange={(value) => {
                setTier(Number(value));
              }}
            />
          </Stack>

          <SimpleGrid cols={{ base: 1, xs: 2 }}>
            <NumberField
              label="Leadership"
              value={squad.housing.leadership}
              min={0}
              onChange={(value) => {
                updateSetup((s) => ({ housing: { ...s.housing, leadership: value ?? 0 } }));
              }}
            />
            <NumberField
              label="Dominance"
              value={squad.housing.dominance}
              min={0}
              onChange={(value) => {
                updateSetup((s) => ({ housing: { ...s.housing, dominance: value ?? 0 } }));
              }}
            />
          </SimpleGrid>

          {/* The calculator's own cards over the squad: captains (five), equipment sets and artifacts. */}
          {profile !== undefined && (
            <Stack gap="lg">
              <BonusesBody profile={profile} binding={binding} scope={ARENA_SCOPE} />
            </Stack>
          )}

          <Disclosure
            title="Bonus sources"
            summary={`${String(PRIME_ARENA_SOURCES.filter((key) => toggles[key]).length + (squad.active.dragon ? 1 : 0))} counted`}
          >
            <SimpleGrid cols={{ base: 1, xs: 2 }} spacing="xs">
              {PRIME_ARENA_SOURCES.map((key) => (
                <SwitchRow
                  key={key}
                  label={SOURCE_LABELS[key]}
                  checked={toggles[key]}
                  onChange={(on) => {
                    setToggle(key, on);
                  }}
                />
              ))}
              <SwitchRow
                label="Dragon"
                checked={squad.active.dragon}
                onChange={(on) => {
                  updateSetup((s) => ({ active: { ...s.active, dragon: on } }));
                }}
              />
            </SimpleGrid>
          </Disclosure>

          <Group>
            <Button
              disabled={!canGenerate}
              loading={running}
              onClick={() => {
                if (profile !== undefined) generate(profile, budget);
              }}
            >
              Generate
            </Button>
            {running && (
              <Text size="sm" c="dimmed" role="status">
                Searching for the best stack, a few seconds at most.
              </Text>
            )}
            {!canGenerate && !running && (
              <Text size="sm" c="dimmed">
                Type your Leadership or Dominance to plan a stack.
              </Text>
            )}
          </Group>
        </Stack>
      </Panel>

      {plan !== null && (
        <Panel
          title="Result"
          component="section"
          aria-label="Result"
          meta={planTier === null ? undefined : `Tier ${romanTier(planTier)}`}
        >
          <Result plan={plan} />
        </Panel>
      )}
    </Stack>
  );
}

const SIDE_NAME = { attacker: 'Attacker', defender: 'Defender', draw: 'Nobody' } as const;

function Result({ plan }: { plan: PrimeArenaPlan }) {
  const { match, score, stacks, spent } = plan;
  const verdict =
    match.winner === 'draw'
      ? 'A draw'
      : `${SIDE_NAME[match.winner]} wins ${String(Math.max(match.attackerRoundsWon, match.defenderRoundsWon))} to ${String(
          Math.min(match.attackerRoundsWon, match.defenderRoundsWon),
        )}`;
  return (
    <Stack gap="md">
      <Group gap="xs">
        <Badge variant="light" size="lg" radius="sm">
          {verdict}
        </Badge>
        <Text size="sm">
          Survivor share {score.survivorShare.toFixed(2)} of 2 over both rounds. Leadership spent{' '}
          {count(spent.leadership)}, Dominance spent {count(spent.dominance)}.
        </Text>
      </Group>

      <Table aria-label="Stack list" withRowBorders verticalSpacing={4}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Unit</Table.Th>
            <Table.Th ta="right">Count</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {stacks.map(({ unit, count: n }) => (
            <Table.Tr key={unit.id}>
              <Table.Td>
                <Group gap={6} wrap="nowrap">
                  <TierBadge tier={unit.tier} size="sm" />
                  <Text size="sm">{unit.name}</Text>
                </Group>
              </Table.Td>
              <Table.Td ta="right">
                <Text span fw={600} size="lg">
                  {count(n)}
                </Text>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Disclosure title="Battle log" summary="two rounds" defaultOpened>
        <Stack gap="md">
          {match.rounds.map((round, i) => (
            <RoundLog key={i} round={round} index={i + 1} />
          ))}
        </Stack>
      </Disclosure>
    </Stack>
  );
}

function RoundLog({ round, index }: { round: PrimeArenaRound; index: number }) {
  const first = round.first === 'attacker' ? 'Attacker strikes first' : 'Defender strikes first';
  const result = round.winner === 'draw' ? 'Draw' : `${SIDE_NAME[round.winner]} takes the round`;
  return (
    <Stack gap={6}>
      <Title order={4} size="h5">
        Round {index}
      </Title>
      <Text size="sm" c="dimmed">
        {first}. {result}.
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <SideTable name="Attacker" side={round.attacker} />
        <SideTable name="Defender" side={round.defender} />
      </SimpleGrid>
    </Stack>
  );
}

function SideTable({ name, side }: { name: string; side: PrimeArenaSideOutcome }) {
  return (
    <Table aria-label={name} withRowBorders verticalSpacing={2}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>{name}</Table.Th>
          <Table.Th ta="right">Start</Table.Th>
          <Table.Th ta="right">Left</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {side.stacks.map((s) => (
          <Table.Tr key={s.unit.id}>
            <Table.Td>
              <Group gap={6} wrap="nowrap">
                <TierBadge tier={s.unit.tier} size="sm" />
                <Text size="sm">{s.unit.name}</Text>
              </Group>
            </Table.Td>
            <Table.Td ta="right">
              <Text size="sm">{count(s.start)}</Text>
            </Table.Td>
            <Table.Td ta="right">
              <Text size="sm">{count(s.survivors)}</Text>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
      <Table.Tfoot>
        <Table.Tr>
          <Table.Td colSpan={3}>
            <Text size="sm" c="dimmed">
              {pct(side.share)} of the troops survive
            </Text>
          </Table.Td>
        </Table.Tr>
      </Table.Tfoot>
    </Table>
  );
}
