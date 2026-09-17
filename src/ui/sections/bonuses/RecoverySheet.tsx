/**
 * Temple and training (S-17). Not a bonus to the army but a bonus to what the losses cost, which is
 * why it is one always-on chip at the end of the card rather than a group of its own: the temple
 * level divides every revival bill, and the training lines shave the retraining one.
 *
 * The eight training fields show only their group — the glyph in the field and the word over it —
 * because the heading over each row of four already says "training cost reduction" or "training
 * speed", and four labels of four words each on one line were the crowd the owner asked to clear
 * (2026-09-17). The full name stays on the field for a screen reader.
 */
import { SimpleGrid, Stack } from '@mantine/core';

import { GROUPS } from '@/data/types';
import type { Group } from '@/data/types';
import type { Profile } from '@/state/schema';
import { useStore } from '@/state/store';
import { BONUS_KEY_GLYPHS, Glyph } from '@/ui/domain';
import { NumberField } from '@/ui/kit';

import { GROUP_LABELS } from './labels';
import { templeDivisor, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet } from './SourceSheet';

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
      <Stack gap="lg">
        <NumberField
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
        <FieldGroup label="Training cost reduction, in percent">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            {GROUPS.map((group) => (
              <NumberField
                key={group}
                label={GROUP_LABELS[group]}
                accessibleName={`${GROUP_LABELS[group]} training cost reduction`}
                leftSection={<Glyph kind={BONUS_KEY_GLYPHS[group]} />}
                allowEmpty
                allowDecimal
                value={recovery.trainingCostReduction[group] ?? null}
                onChange={(next) => {
                  patchGroup('trainingCostReduction', group, next);
                }}
              />
            ))}
          </SimpleGrid>
        </FieldGroup>
        <FieldGroup label="Training speed, in percent">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xs">
            {GROUPS.map((group) => (
              <NumberField
                key={group}
                label={GROUP_LABELS[group]}
                accessibleName={`${GROUP_LABELS[group]} training speed`}
                leftSection={<Glyph kind={BONUS_KEY_GLYPHS[group]} />}
                allowEmpty
                allowDecimal
                value={recovery.trainingSpeed[group] ?? null}
                onChange={(next) => {
                  patchGroup('trainingSpeed', group, next);
                }}
              />
            ))}
          </SimpleGrid>
        </FieldGroup>
      </Stack>
    </SourceSheet>
  );
}
