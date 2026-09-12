/**
 * The 13-key editor every free-form bonus source uses: health, then strength, then the special
 * strength keys behind a disclosure, because most accounts never fill those in.
 *
 * Every value is a stepper (D-32): arrows, the wheel, `Shift` and `Ctrl` jumps, and a figure typed
 * or pasted in the player's own locale. Clearing a field removes the key instead of storing a 0, so
 * a source only ever carries what was actually typed into it.
 */
import { BONUS_KEYS, SPECIAL_KEYS } from '@/data/types';
import type { BonusKey, BonusMap, SpecialKey, SpecialMap } from '@/data/types';
import { Disclosure, NumberStepper } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';

import { FieldGroup } from './SourceSheet';
import { BONUS_LABELS, SPECIAL_LABELS } from './labels';

export interface BonusValues {
  health: BonusMap;
  strength: BonusMap;
  special?: SpecialMap;
}

export interface BonusKeyGridProps {
  value: BonusValues;
  onChange: (next: BonusValues) => void;
  /** Special strength keys are meaningless for a few editors (the unexplained remainder). */
  withSpecial?: boolean;
}

/** Percentages, as the game writes them: up to two decimals, no grouping. */
const PERCENT: Intl.NumberFormatOptions = { maximumFractionDigits: 2, useGrouping: false };

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

export function BonusKeyGrid({ value, onChange, withSpecial = true }: BonusKeyGridProps) {
  const bonusField = (bucket: 'health' | 'strength', key: BonusKey) => (
    <NumberStepper
      key={`${bucket}-${key}`}
      label={`${BONUS_LABELS[key]} ${bucket}`}
      size="sm"
      suffix="%"
      step={0.1}
      allowEmpty
      formatOptions={PERCENT}
      value={value[bucket][key] ?? null}
      onChange={(next) => {
        onChange({ ...value, [bucket]: setKey(value[bucket], key, next) });
      }}
    />
  );

  return (
    <Stack gap={4}>
      <FieldGroup label="Health">
        <Grid cols={{ base: 1, sm: 2 }} gap={2}>
          {BONUS_KEYS.map((key) => bonusField('health', key))}
        </Grid>
      </FieldGroup>
      <FieldGroup label="Strength">
        <Grid cols={{ base: 1, sm: 2 }} gap={2}>
          {BONUS_KEYS.map((key) => bonusField('strength', key))}
        </Grid>
      </FieldGroup>
      {withSpecial && (
        <Disclosure title="Special strength" summary="Double damage and second strikes">
          <Grid cols={{ base: 1, sm: 2 }} gap={2}>
            {SPECIAL_KEYS.map((key: SpecialKey) => (
              <NumberStepper
                key={key}
                label={SPECIAL_LABELS[key]}
                size="sm"
                suffix="%"
                step={0.1}
                allowEmpty
                formatOptions={PERCENT}
                value={value.special?.[key] ?? null}
                onChange={(next) => {
                  onChange({ ...value, special: setKey(value.special ?? {}, key, next) });
                }}
              />
            ))}
          </Grid>
        </Disclosure>
      )}
    </Stack>
  );
}
