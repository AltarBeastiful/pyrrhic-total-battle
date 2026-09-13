/**
 * The one editor of the Other group that is a level rather than a grid: VIP.
 *
 * The hero used to live here too; it left for the head of the captain row, where its gear opens the
 * pick in a popover (D-34).
 */
import { Alert, SimpleGrid, Stack } from '@mantine/core';

import { updateSources } from '@/state/actions/bonuses';
import { vipNeedsManual } from '@/state/derive';
import type { Profile } from '@/state/schema';
import { NumberField } from '@/ui/kit2';

import { MAX_VIP_LEVEL, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet } from './SourceSheet';

export interface OtherSheetProps {
  profile: Profile;
  summary: TotalsSummary;
  onClose: () => void;
}

export function VipSheet({ profile, summary, onClose }: OtherSheetProps) {
  const { sources } = profile;
  return (
    <SourceSheet title="VIP" where={WHERE.vip} summary={summary} onClose={onClose}>
      <Stack gap="sm">
        <NumberField
          label="VIP level"
          value={sources.vipLevel}
          min={0}
          max={MAX_VIP_LEVEL}
          onChange={(next) => {
            updateSources(profile.id, (current) => ({ ...current, vipLevel: next ?? 0 }));
          }}
        />
        {vipNeedsManual(profile) && (
          <FieldGroup label="Values you type, in percent">
            <Alert color="brass" variant="light">
              We have not measured the VIP table at this level. Type the army health and strength your VIP
              screen shows.
            </Alert>
            <SimpleGrid cols={2} spacing="xs">
              <NumberField
                label="Army health"
                allowEmpty
                allowDecimal
                value={sources.vipManual?.health ?? null}
                onChange={(next) => {
                  updateSources(profile.id, (current) => ({
                    ...current,
                    vipManual: { health: next ?? 0, strength: current.vipManual?.strength ?? 0 },
                  }));
                }}
              />
              <NumberField
                label="Army strength"
                allowEmpty
                allowDecimal
                value={sources.vipManual?.strength ?? null}
                onChange={(next) => {
                  updateSources(profile.id, (current) => ({
                    ...current,
                    vipManual: { health: current.vipManual?.health ?? 0, strength: next ?? 0 },
                  }));
                }}
              />
            </SimpleGrid>
          </FieldGroup>
        )}
      </Stack>
    </SourceSheet>
  );
}
