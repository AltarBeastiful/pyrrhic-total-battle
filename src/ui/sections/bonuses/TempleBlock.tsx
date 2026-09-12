import { temple } from '@/data';
import { GROUPS } from '@/data/types';
import type { Group } from '@/data/types';
import type { Profile } from '@/state/schema';
import { useStore } from '@/state/store';

import { Card, NumberField } from '../../primitives';
import { BlockGlyph, KeySlot } from './glyphs';
import { GROUP_LABELS } from './labels';
import { Block, FieldGroup } from './parts';

/** The temple divides revival costs; level 0 divides by 1, i.e. it changes nothing. */
function divisorOf(level: number): number {
  return temple.multiplier[String(level)] ?? 1;
}

/**
 * Temple and training (S-17). These feed the recovery half of the battle summary: what it costs to put
 * the losses back on their feet.
 */
export function TempleBlock({ profile }: { profile: Profile }) {
  const updateProfile = useStore((state) => state.updateProfile);
  const { recovery } = profile;

  const patchGroup = (
    bucket: 'trainingCostReduction' | 'trainingSpeed',
    group: Group,
    value: number | null,
  ): void => {
    updateProfile(profile.id, (current) => {
      const next = { ...current.recovery[bucket] };
      if (value === null) delete next[group];
      else next[group] = value;
      return { recovery: { ...current.recovery, [bucket]: next } };
    });
  };

  return (
    <Block
      title="Temple and training"
      icon={<BlockGlyph name="recovery" />}
      description="What it costs to put your losses back on their feet, after the fight."
      where="the Temple for its level; the cost and speed bonuses sit on your barracks and workshops."
    >
      <div className="space-y-3">
        <Card tone="raised" className="flex flex-wrap items-end justify-between gap-4">
          <NumberField
            label="Temple level"
            className="w-32"
            value={recovery.templeLevel}
            min={0}
            max={45}
            onChange={(next) => {
              updateProfile(profile.id, (current) => ({
                recovery: { ...current.recovery, templeLevel: next ?? 0 },
              }));
            }}
          />
          <div className="text-right">
            <p className="text-muted text-xs">Revival costs divided by</p>
            <p className="nums text-2xl leading-tight font-semibold">
              {String(divisorOf(recovery.templeLevel))}
            </p>
          </div>
        </Card>

        <FieldGroup label="Training cost reduction">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GROUPS.map((group) => (
              <NumberField
                key={group}
                label={`${GROUP_LABELS[group]} training cost reduction`}
                hideLabel
                hint={GROUP_LABELS[group]}
                prefix={<KeySlot name={group} />}
                decimal
                suffix="%"
                value={recovery.trainingCostReduction[group] ?? null}
                onChange={(next) => {
                  patchGroup('trainingCostReduction', group, next);
                }}
              />
            ))}
          </div>
        </FieldGroup>

        <FieldGroup label="Training speed">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GROUPS.map((group) => (
              <NumberField
                key={group}
                label={`${GROUP_LABELS[group]} training speed`}
                hideLabel
                hint={GROUP_LABELS[group]}
                prefix={<KeySlot name={group} />}
                decimal
                suffix="%"
                value={recovery.trainingSpeed[group] ?? null}
                onChange={(next) => {
                  patchGroup('trainingSpeed', group, next);
                }}
              />
            ))}
          </div>
        </FieldGroup>
      </div>
    </Block>
  );
}
