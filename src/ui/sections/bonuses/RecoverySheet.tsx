/**
 * Temple and training (S-17). Not a bonus to the army but a bonus to what the losses cost, which is
 * why it is one always-on row at the end of the card rather than a group of its own: the temple
 * level divides every revival bill, and the training lines shave the retraining one.
 */
import { GROUPS } from '@/data/types';
import type { Group } from '@/data/types';
import type { Profile } from '@/state/schema';
import { useStore } from '@/state/store';
import { NumberStepper } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';

import { GROUP_LABELS } from './labels';
import { templeDivisor, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet } from './SourceSheet';

/** Percentages typed by hand: up to two decimals, no grouping. */
const PERCENT: Intl.NumberFormatOptions = { maximumFractionDigits: 2, useGrouping: false };

export interface RecoverySheetProps {
  profile: Profile;
  summary: TotalsSummary;
  onClose: () => void;
}

export function RecoverySheet({ profile, summary, onClose }: RecoverySheetProps) {
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
    <SourceSheet
      title="Temple and training"
      where={WHERE.recovery}
      summary={summary}
      onClose={onClose}
      size="lg"
    >
      <Stack gap={4}>
        <NumberStepper
          label="Temple level"
          value={recovery.templeLevel}
          min={0}
          max={45}
          description={`Revival costs divided by ${String(templeDivisor(recovery.templeLevel))}`}
          onChange={(next) => {
            updateProfile(profile.id, (current) => ({
              recovery: { ...current.recovery, templeLevel: next ?? 0 },
            }));
          }}
        />
        <FieldGroup label="Training cost reduction">
          <Grid cols={{ base: 2, sm: 4 }} gap={2}>
            {GROUPS.map((group) => (
              <NumberStepper
                key={group}
                label={`${GROUP_LABELS[group]} training cost reduction`}
                size="sm"
                suffix="%"
                step={0.1}
                allowEmpty
                formatOptions={PERCENT}
                value={recovery.trainingCostReduction[group] ?? null}
                onChange={(next) => {
                  patchGroup('trainingCostReduction', group, next);
                }}
              />
            ))}
          </Grid>
        </FieldGroup>
        <FieldGroup label="Training speed">
          <Grid cols={{ base: 2, sm: 4 }} gap={2}>
            {GROUPS.map((group) => (
              <NumberStepper
                key={group}
                label={`${GROUP_LABELS[group]} training speed`}
                size="sm"
                suffix="%"
                step={0.1}
                allowEmpty
                formatOptions={PERCENT}
                value={recovery.trainingSpeed[group] ?? null}
                onChange={(next) => {
                  patchGroup('trainingSpeed', group, next);
                }}
              />
            ))}
          </Grid>
        </FieldGroup>
      </Stack>
    </SourceSheet>
  );
}
