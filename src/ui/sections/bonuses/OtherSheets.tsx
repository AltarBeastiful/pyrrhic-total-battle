/**
 * The two editors of the Other group that are a pick rather than a grid: the VIP level, and the
 * hero leading this march.
 */
import { heroes as heroTable } from '@/data';
import { setActiveFlag, updateSources } from '@/state/actions/bonuses';
import { vipNeedsManual } from '@/state/derive';
import type { Profile } from '@/state/schema';
import { Banner, NumberStepper, Select } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';

import { describeContribution } from './labels';
import { MAX_VIP_LEVEL, WHERE } from './rows';
import type { TotalsSummary } from './rows';
import { FieldGroup, SourceSheet, WorthList } from './SourceSheet';

/** Percentages typed by hand: up to two decimals, no grouping. */
const PERCENT: Intl.NumberFormatOptions = { maximumFractionDigits: 2, useGrouping: false };

export interface OtherSheetProps {
  profile: Profile;
  summary: TotalsSummary;
  onClose: () => void;
}

export function VipSheet({ profile, summary, onClose }: OtherSheetProps) {
  const { sources } = profile;
  return (
    <SourceSheet title="VIP" where={WHERE.vip} summary={summary} onClose={onClose}>
      <Stack gap={3}>
        <NumberStepper
          label="VIP level"
          value={sources.vipLevel}
          min={0}
          max={MAX_VIP_LEVEL}
          bigStep={5}
          hugeStep={MAX_VIP_LEVEL}
          onChange={(next) => {
            updateSources(profile.id, (current) => ({ ...current, vipLevel: next ?? 0 }));
          }}
        />
        {vipNeedsManual(profile) && (
          <FieldGroup label="Values you type">
            <Banner tone="warn">
              We have not measured the VIP table at this level. Type the army health and strength your VIP
              screen shows.
            </Banner>
            <Grid cols={2} gap={2}>
              <NumberStepper
                label="Army health"
                size="sm"
                suffix="%"
                step={0.1}
                allowEmpty
                formatOptions={PERCENT}
                value={sources.vipManual?.health ?? null}
                onChange={(next) => {
                  updateSources(profile.id, (current) => ({
                    ...current,
                    vipManual: { health: next ?? 0, strength: current.vipManual?.strength ?? 0 },
                  }));
                }}
              />
              <NumberStepper
                label="Army strength"
                size="sm"
                suffix="%"
                step={0.1}
                allowEmpty
                formatOptions={PERCENT}
                value={sources.vipManual?.strength ?? null}
                onChange={(next) => {
                  updateSources(profile.id, (current) => ({
                    ...current,
                    vipManual: { health: current.vipManual?.health ?? 0, strength: next ?? 0 },
                  }));
                }}
              />
            </Grid>
          </FieldGroup>
        )}
      </Stack>
    </SourceSheet>
  );
}

export function HeroSheet({ profile, summary, onClose }: OtherSheetProps) {
  const hero = heroTable.find((record) => record.id === profile.sources.hero);
  return (
    <SourceSheet title={hero?.name ?? 'Hero'} where={WHERE.hero} summary={summary} onClose={onClose}>
      <Stack gap={3}>
        <Select
          label="Hero"
          value={profile.sources.hero ?? ''}
          options={[
            { value: '', label: 'No hero' },
            ...heroTable.map((record) => ({ value: record.id, label: record.name })),
          ]}
          onChange={(heroId) => {
            updateSources(profile.id, (current) => {
              if (heroId === '') {
                const { hero: _dropped, ...rest } = current;
                return rest;
              }
              return { ...current, hero: heroId };
            });
            setActiveFlag('hero', heroId !== '');
          }}
        />
        {hero?.aloneOnly === true && (
          <Banner tone="warn">
            {hero.name} only grants its bonus when you march alone. Switch it off for a group march or a
            reinforcement.
          </Banner>
        )}
        <FieldGroup label="Worth right now">
          <WorthList
            lines={describeContribution(hero?.bonus ?? {})}
            empty={hero === undefined ? 'No hero chosen yet.' : `We have no figures for ${hero.name} yet.`}
          />
        </FieldGroup>
      </Stack>
    </SourceSheet>
  );
}
