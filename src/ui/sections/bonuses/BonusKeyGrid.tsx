/**
 * The 13-key editor every free-form bonus source uses: health, then strength, then the special
 * strength keys behind a fold, because most accounts never fill those in.
 *
 * Every value is a percentage read off a game screen and retyped here, so every field is the kit's
 * `NumberField` — a plain input that selects its whole value on focus (rule 9), decimals allowed
 * because the game writes 12.5 %. Clearing a field removes the key instead of storing a 0, so a
 * source only ever carries what was actually typed into it.
 *
 * Each field opens with its key's glyph (`BONUS_KEY_GLYPHS`), the way the Battle card's enemy fields
 * and the command bar's pools do: thirteen fields whose labels all end in the same word are told
 * apart by the mark before the figure, not by reading every label (owner, 2026-09-17). The label
 * still says the key in words; the glyph repeats it and is hidden from a screen reader.
 */
import { SimpleGrid, Stack } from '@mantine/core';

import { BONUS_KEYS, SPECIAL_KEYS } from '@/data/types';
import type { BonusKey, BonusMap, SpecialKey, SpecialMap } from '@/data/types';
import { BONUS_KEY_GLYPHS, Glyph } from '@/ui/domain';
import { Disclosure, NumberField } from '@/ui/kit';

import { BONUS_LABELS, SPECIAL_LABELS } from './labels';
import { FieldGroup } from './SourceSheet';

export interface BonusValues {
  health: BonusMap;
  strength: BonusMap;
  special?: SpecialMap;
}

export interface BonusKeyGridProps {
  value: BonusValues;
  onChange: (next: BonusValues) => void;
}

/** Sets or clears one key; an empty field removes the key instead of storing a 0. */
function setKey<K extends string>(
  map: Partial<Record<K, number>>,
  key: K,
  value: number | null,
): Partial<Record<K, number>> {
  const next = { ...map };
  if (value === null) delete next[key];
  else next[key] = value;
  return next;
}

export function BonusKeyGrid({ value, onChange }: BonusKeyGridProps) {
  const bonusField = (bucket: 'health' | 'strength', key: BonusKey) => (
    <NumberField
      key={`${bucket}-${key}`}
      label={`${BONUS_LABELS[key]} ${bucket}`}
      leftSection={<Glyph kind={BONUS_KEY_GLYPHS[key]} />}
      allowEmpty
      allowDecimal
      value={value[bucket][key] ?? null}
      onChange={(next) => {
        onChange({ ...value, [bucket]: setKey(value[bucket], key, next) });
      }}
    />
  );

  return (
    <Stack gap="lg">
      <FieldGroup label="Health, in percent">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          {BONUS_KEYS.map((key) => bonusField('health', key))}
        </SimpleGrid>
      </FieldGroup>
      <FieldGroup label="Strength, in percent">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          {BONUS_KEYS.map((key) => bonusField('strength', key))}
        </SimpleGrid>
      </FieldGroup>
      <Disclosure title="Special strength" summary="Double damage and second strikes">
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
          {SPECIAL_KEYS.map((key: SpecialKey) => (
            <NumberField
              key={key}
              label={SPECIAL_LABELS[key]}
              allowEmpty
              allowDecimal
              value={value.special?.[key] ?? null}
              onChange={(next) => {
                onChange({ ...value, special: setKey(value.special ?? {}, key, next) });
              }}
            />
          ))}
        </SimpleGrid>
      </Disclosure>
    </Stack>
  );
}
