import type { ReactNode } from 'react';

import { BONUS_KEYS, SPECIAL_KEYS } from '@/data/types';
import type { BonusKey, BonusMap, SpecialKey, SpecialMap } from '@/data/types';

import { ChevronDownIcon } from '../../icons';
import { NumberField } from '../../primitives';
import { KeySlot } from './glyphs';
import { BONUS_LABELS, SPECIAL_LABELS } from './labels';

export interface BonusValues {
  health: BonusMap;
  strength: BonusMap;
  special?: SpecialMap;
}

export interface BonusKeyGridProps {
  value: BonusValues;
  onChange: (next: BonusValues) => void;
  /** Prefix of the field labels, so two editors on screen never share an accessible name. */
  scope: string;
  /** Special strength keys are meaningless for a few editors (the unexplained remainder). */
  withSpecial?: boolean;
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

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{children}</div>;
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="text-muted text-xs font-semibold tracking-wide uppercase">{children}</p>;
}

/**
 * The 13-key editor every free-form bonus source uses: health, strength, and the special strength keys
 * in a disclosure, because most accounts never fill them in. Each field wears the glyph of its key —
 * category, group or race — so a column can be scanned without reading every hint.
 */
export function BonusKeyGrid({ value, onChange, scope, withSpecial = true }: BonusKeyGridProps) {
  const bonusField = (bucket: 'health' | 'strength', key: BonusKey) => (
    <NumberField
      key={`${bucket}-${key}`}
      label={`${scope} ${BONUS_LABELS[key]} ${bucket}`}
      hideLabel
      hint={BONUS_LABELS[key]}
      prefix={<KeySlot name={key} />}
      decimal
      suffix="%"
      value={value[bucket][key] ?? null}
      onChange={(next) => {
        onChange({ ...value, [bucket]: setKey(value[bucket], key, next) });
      }}
    />
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Caption>Health</Caption>
        <Grid>{BONUS_KEYS.map((key) => bonusField('health', key))}</Grid>
      </div>
      <div className="space-y-2">
        <Caption>Strength</Caption>
        <Grid>{BONUS_KEYS.map((key) => bonusField('strength', key))}</Grid>
      </div>
      {withSpecial && (
        <details className="border-line group rounded-lg border px-3 py-2">
          <summary className="text-muted tap flex cursor-pointer list-none items-center gap-2 text-xs font-semibold tracking-wide uppercase">
            <span aria-hidden="true" className="transition-transform group-open:rotate-180">
              <ChevronDownIcon />
            </span>
            Special strength
          </summary>
          <div className="mt-2">
            <Grid>
              {SPECIAL_KEYS.map((key: SpecialKey) => (
                <NumberField
                  key={key}
                  label={`${scope} ${SPECIAL_LABELS[key]}`}
                  hideLabel
                  hint={SPECIAL_LABELS[key]}
                  prefix={<KeySlot name={key} />}
                  decimal
                  suffix="%"
                  value={value.special?.[key] ?? null}
                  onChange={(next) => {
                    onChange({ ...value, special: setKey(value.special ?? {}, key, next) });
                  }}
                />
              ))}
            </Grid>
          </div>
        </details>
      )}
    </div>
  );
}
