/**
 * The enemy to counter-pick (B-46), as one card in the arena's setup column: a count per unit, typed as the game
 * shows it. Empty means the plan is built all-round, against many assumed armies. The form is the summary (rule 6):
 * every unit of the top tier stands on the card with its tier badge, the lower tiers wait in one fold (rule 4),
 * and the card's meta line says which plan Generate will make.
 */
import { Button, SimpleGrid, Stack, Text } from '@mantine/core';
import { useId, useMemo, useState } from 'react';

import type { UnitDef } from '@/data/types';
import { primeArenaEnemyUnits, primeArenaLevel } from '@/engine/primeArenaInputs';
import { selectActiveProfile, useStore } from '@/state/store';
import { TierBadge } from '@/ui/domain';
import { Disclosure, NumberField, Panel } from '@/ui/kit';

import { usePrimeArenaStore } from './primeArenaStore';

export function ArenaEnemySection() {
  const profile = useStore(selectActiveProfile);
  const enemy = usePrimeArenaStore((state) => state.enemy);
  const setEnemyCount = usePrimeArenaStore((state) => state.setEnemyCount);
  const clearEnemy = usePrimeArenaStore((state) => state.clearEnemy);
  const titleId = useId();
  const counts = useMemo(() => new Map(enemy.map((row) => [row.unitId, row.count])), [enemy]);

  const level = profile === undefined ? 0 : primeArenaLevel(profile.troops);
  const units = useMemo(() => (profile === undefined ? [] : primeArenaEnemyUnits(profile.troops)), [profile]);
  // The top tier, and any unit typed above the level (the Guardsmen level may have moved since).
  const top = units.filter((unit) => unit.tier === level);
  const lower = units.filter((unit) => unit.tier < level).sort((a, b) => b.tier - a.tier);
  const typedLower = lower.filter((unit) => counts.has(unit.id)).length;
  const [opened, setOpened] = useState(typedLower > 0);

  const field = (unit: UnitDef) => (
    <NumberField
      key={unit.id}
      label={unit.name}
      value={counts.get(unit.id) ?? null}
      allowEmpty
      leftSection={<TierBadge tier={unit.tier} />}
      onChange={(value) => {
        setEnemyCount(unit.id, value);
      }}
    />
  );

  return (
    <Panel
      component="section"
      aria-labelledby={titleId}
      title="Enemy"
      titleId={titleId}
      meta={
        enemy.length === 0
          ? 'All-round'
          : `Counter-pick · ${String(enemy.length)} ${enemy.length === 1 ? 'stack' : 'stacks'}`
      }
    >
      <Stack gap="xs">
        <Text size="xs" c="dimmed">
          Know who you will fight? Type their troops and counts, and Generate picks the squad against them,
          with your bonuses on their side. Leave it empty for a squad that does well against many armies.
        </Text>
        <SimpleGrid cols={2} spacing="xs">
          {top.map(field)}
        </SimpleGrid>
        {lower.length > 0 && (
          <Disclosure
            title="Lower tiers"
            summary={typedLower === 0 ? 'none typed' : `${String(typedLower)} typed`}
            opened={opened}
            onChange={setOpened}
          >
            <SimpleGrid cols={2} spacing="xs">
              {lower.map(field)}
            </SimpleGrid>
          </Disclosure>
        )}
        <Button
          variant="light"
          size="compact-sm"
          w="fit-content"
          disabled={enemy.length === 0}
          onClick={clearEnemy}
        >
          Clear enemy
        </Button>
      </Stack>
    </Panel>
  );
}
