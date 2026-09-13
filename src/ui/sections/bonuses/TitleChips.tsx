/**
 * The titles of the kingdom, as TotalStack draws them (investigation 0006): the same chips again,
 * split under Health, Strength and Other, with what the title is worth written under its name.
 *
 * A title has nothing to set — the tables carry its figures — so there is no gear here, and the
 * whole family is three `ChipRow`s: the kit's memoised wrapping row, which is exactly this shape.
 * Wearing a title also records that the account holds it, so a profile never claims a bonus from a
 * title it never earned.
 */
import { Stack, Text } from '@mantine/core';

import { setTitleOwned, toggleActiveSource } from '@/state/actions/bonuses';
import { ChipRow } from '@/ui/kit2';

import type { TitleFamilyRow } from './chips';

export interface TitleChipsProps {
  profileId: string;
  families: TitleFamilyRow[];
}

export function TitleChips({ profileId, families }: TitleChipsProps) {
  return (
    <Stack gap="xs">
      {families.map((family) => (
        <Stack key={family.family} gap={2}>
          <Text size="xs" c="dimmed">
            {family.label}
          </Text>
          <ChipRow
            label={`Titles — ${family.label.toLowerCase()}`}
            gap={8}
            items={family.chips.map((chip) => ({
              value: chip.id,
              label: chip.name,
              name: chip.name,
              ...(chip.value === '' ? {} : { sublabel: chip.value }),
            }))}
            value={family.chips.filter((chip) => chip.worn).map((chip) => chip.id)}
            onChange={(next) => {
              const chosen = new Set(next);
              for (const chip of family.chips) {
                if (chosen.has(chip.id) === chip.worn) continue;
                setTitleOwned(profileId, chip.id, chosen.has(chip.id));
                if (chosen.has(chip.id)) toggleActiveSource('titles', chip.id, true);
              }
            }}
          />
        </Stack>
      ))}
    </Stack>
  );
}
