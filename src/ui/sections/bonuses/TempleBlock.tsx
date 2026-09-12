import { temple } from '@/data';
import { GROUPS } from '@/data/types';
import type { Group } from '@/data/types';
import type { Profile } from '@/state/schema';
import { useStore } from '@/state/store';

import { NumberField } from '../../primitives';
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
      note="Temple screen: the building's level. The training cost and speed bonuses are on your barracks and workshops, one figure per kind of unit."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <NumberField
            label="Temple level"
            className="w-36"
            value={recovery.templeLevel}
            min={0}
            max={45}
            onChange={(next) => {
              updateProfile(profile.id, (current) => ({
                recovery: { ...current.recovery, templeLevel: next ?? 0 },
              }));
            }}
          />
          <p className="text-muted pb-2 text-xs">
            Revival costs are divided by {String(divisorOf(recovery.templeLevel))}.
          </p>
        </div>

        <FieldGroup label="Training cost reduction">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GROUPS.map((group) => (
              <NumberField
                key={group}
                label={`${GROUP_LABELS[group]} training cost reduction`}
                hideLabel
                hint={GROUP_LABELS[group]}
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
