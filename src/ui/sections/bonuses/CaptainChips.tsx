/**
 * The captains and the hero, as TotalStack draws them (design plan §7.3 as amended, D-34;
 * investigation 0006): a **dense wrapping row of name chips**, the hero at its head, thirty
 * captains after it, 32 px tall and 13 px of text — no portraits, no tiles, no Add button.
 *
 * Two targets on a chip, never one. The chip body enlists; the gear on its top-right corner opens an
 * anchored popover with the level and the stars and nothing else, so a player correcting a level
 * never discovers they also sent somebody on the march. A chip whose level is set wears a dot after
 * the name, and the fourth enlistment is refused — TotalStack refuses it in silence, we add one
 * polite sentence in a live region, because silence reads as a broken button.
 *
 * Only the captains that can change a stack carry a gear: ten of the thirty grant nothing a stack
 * size depends on, and they have no level to set — they can still ride along.
 *
 * The name is the whole chip: no glyph, no portrait, no second line (§7.3). Thirty-one chips have to
 * fit on two lines at desktop width, and a mark before every name buys nothing a player needs while
 * choosing — what the captain boosts is in the popover, next to the figure it moves.
 *
 * The grid is **one tab stop** (design rule 24; investigation 0011 measured fifty-two): the arrows
 * walk the chips, `Space` enlists, and the gear of the chip you are on is the next `Tab` — every
 * other gear is out of the tab order.
 */
import { Group, Select, Stack, Text } from '@mantine/core';

import { memo, useCallback, useEffect, useRef, useState } from 'react';

import { heroes as heroTable } from '@/data';
import { setActiveFlag, updateSources } from '@/state/actions/bonuses';
import { selectActiveProfile, useStore } from '@/state/store';
import { CaptainChip } from '@/ui/domain';
import { Figures, NumberField, Sections, useRovingTabs } from '@/ui/kit';

import classes from './bonuses.module.css';
import { captainBonusLines, MAX_CAPTAIN_STAR, type CaptainChipRow, type CaptainTarget } from './chips';
import { describeContribution } from './labels';
import { captainEntryFor, captainRecord } from './rows';

/** What the card says when a fourth captain is tapped. One line, and never more than one. */
export const CAPTAIN_CAP_MESSAGE = 'Three captains at most march together. Take one out first.';

/** The line under the heading, in our own words (rule 26). */
export const CAPTAIN_HELPER = 'A captain’s bonuses only count while that captain marches.';

/** "—" then ★1…★6: the seven steps the captain tables carry, by their index in the star table. */
const NO_STAR = '—';
const STAR_OPTIONS = [NO_STAR, ...Array.from({ length: MAX_CAPTAIN_STAR }, (_, i) => `★${String(i + 1)}`)];

// ---- the two editors a gear opens ---------------------------------------------------------------
/**
 * The captain's level and stars, in the popover (D-34). It reads the store itself rather than taking
 * the values as props, so the thirty chips around it keep their memoised props while it is open.
 */
function CaptainLevelEditor({ captainId }: { captainId: string }) {
  const profile = useStore(selectActiveProfile);
  if (profile === undefined) return null;

  const record = captainRecord(captainId);
  const entry = captainEntryFor(profile, captainId);
  const level = entry?.level ?? 0;
  const star = entry?.star ?? 0;

  const patch = (next: { level?: number; star?: number }): void => {
    updateSources(profile.id, (sources) => ({
      ...sources,
      captains: sources.captains.map((current) =>
        current.captainId === captainId ? { ...current, ...next } : current,
      ),
    }));
  };

  const lines = captainBonusLines(captainId, level, star);
  const footer = lines[0] ?? 'Nothing at this level yet.';
  return (
    // Two parts and one hairline, like every other card on the page (docs/design.md §4); the footer
    // is a **figure** and not a dimmed sentence — label 12 muted over the value at 15/600, the same
    // object the March's recap and the Bonuses TOTAL are made of.
    <Sections aria-label={record?.name ?? captainId}>
      <Stack gap="xs" w={220}>
        <Text size="sm" fw={600}>
          {record?.name ?? captainId}
        </Text>
        <NumberField
          label="Base level"
          value={level}
          min={0}
          max={999}
          onChange={(next) => {
            patch({ level: next ?? 0 });
          }}
        />
        <Select
          label="Star level"
          size="xs"
          data={STAR_OPTIONS}
          value={STAR_OPTIONS[star] ?? NO_STAR}
          allowDeselect={false}
          // Inside the popover, not in a portal: a click on a portalled option counts as a click
          // outside the popover and would close the editor before the pick landed.
          comboboxProps={{ withinPortal: false }}
          onChange={(next) => {
            patch({ star: Math.max(0, STAR_OPTIONS.indexOf(String(next ?? NO_STAR))) });
          }}
        />
      </Stack>
      <Figures
        label="What this captain adds"
        layout="grid"
        columns={1}
        items={[{ key: 'worth', label: 'At this level', value: footer }]}
      />
    </Sections>
  );
}

/** The hero's gear opens a pick, not a level: all the profile stores is which hero leads. */
function HeroEditor() {
  const profile = useStore(selectActiveProfile);
  if (profile === undefined) return null;
  const hero = heroTable.find((record) => record.id === profile.sources.hero);
  return (
    <Sections aria-label="Hero">
      <Stack gap="xs" w={220}>
        <Text size="sm" fw={600}>
          Hero
        </Text>
        <Select
          label="Leading this march"
          size="xs"
          data={[
            { value: '', label: 'No hero' },
            ...heroTable.map((record) => ({ value: record.id, label: record.name })),
          ]}
          value={profile.sources.hero ?? ''}
          allowDeselect={false}
          comboboxProps={{ withinPortal: false }}
          onChange={(next) => {
            const heroId = next ?? '';
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
      </Stack>
      <Stack gap={6}>
        <Figures
          label="What this hero adds"
          layout="grid"
          columns={1}
          items={[
            {
              key: 'worth',
              label: 'On this march',
              value:
                hero === undefined
                  ? 'No hero chosen'
                  : (describeContribution(hero.bonus)[0] ?? 'No figures yet'),
            },
          ]}
        />
        {hero?.aloneOnly === true && (
          <Text size="xs" c="dimmed">
            {hero.name} only grants its bonus on a solo march.
          </Text>
        )}
      </Stack>
    </Sections>
  );
}

// ---- one chip ------------------------------------------------------------------------------------
interface EnlistChipProps {
  chip: CaptainChipRow;
  opened: boolean;
  onToggle: (target: CaptainTarget) => void;
  onGear: (target: CaptainTarget) => void;
  onOpenedChange: (target: CaptainTarget, opened: boolean) => void;
}

/**
 * Memoised on purpose: thirty-one of these sit on one phone screen beside fifteen artifacts and
 * twenty-eight titles, and a toggle must not re-render the lot. The editor is built only for the
 * chip whose popover is open, so the other thirty get `null` and stay put.
 */
const EnlistChip = memo(function EnlistChip({
  chip,
  opened,
  onToggle,
  onGear,
  onOpenedChange,
}: EnlistChipProps) {
  return (
    <CaptainChip
      name={chip.name}
      enlisted={chip.enlisted}
      levelSet={chip.levelSet}
      onToggle={() => {
        onToggle(chip.target);
      }}
      {...(chip.hasEditor
        ? {
            onEditLevel: () => {
              onGear(chip.target);
            },
            levelEditor: !opened ? null : chip.target.kind === 'hero' ? (
              <HeroEditor />
            ) : (
              <CaptainLevelEditor captainId={chip.target.captainId} />
            ),
            levelEditorOpened: opened,
            onLevelEditorChange: (next: boolean) => {
              onOpenedChange(chip.target, next);
            },
          }
        : {})}
    />
  );
});

// ---- the row -------------------------------------------------------------------------------------
export interface CaptainChipsProps {
  chips: CaptainChipRow[];
  /** The march is full and a fourth chip was tapped. */
  isRefused: boolean;
  onEnlist: (target: CaptainTarget) => void;
  /** Mints the entry a level is recorded on, and says which chip's popover is open. */
  onConfigure: (target: CaptainTarget) => void;
}

const keyOf = (target: CaptainTarget): string => (target.kind === 'hero' ? 'hero' : target.captainId);

export function CaptainChips({ chips, isRefused, onEnlist, onConfigure }: CaptainChipsProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const roving = useRovingTabs();

  // The latest props, read inside callbacks that never change identity — which is what lets the
  // memoised chips keep their props stable across a toggle (the same trick `ChipRow` uses).
  const latest = useRef({ onEnlist, onConfigure });
  useEffect(() => {
    latest.current = { onEnlist, onConfigure };
  });

  const toggle = useCallback((target: CaptainTarget) => {
    latest.current.onEnlist(target);
  }, []);

  const gear = useCallback((target: CaptainTarget) => {
    const id = keyOf(target);
    setOpenId((current) => (current === id ? null : id));
    latest.current.onConfigure(target);
  }, []);

  const openedChange = useCallback((target: CaptainTarget, opened: boolean) => {
    setOpenId(opened ? keyOf(target) : null);
  }, []);

  return (
    <Stack gap="xs">
      <Text size="xs" c="dimmed">
        {CAPTAIN_HELPER}
      </Text>
      <Group
        role="group"
        aria-label="Captains and hero"
        className={classes.gearGrid}
        gap={8}
        wrap="wrap"
        {...roving}
      >
        {chips.map((chip) => (
          <EnlistChip
            key={chip.id}
            chip={chip}
            opened={openId === chip.id}
            onToggle={toggle}
            onGear={gear}
            onOpenedChange={openedChange}
          />
        ))}
      </Group>
      <Text role="status" size="xs" c="dimmed" mih="1.125rem">
        {isRefused ? CAPTAIN_CAP_MESSAGE : ''}
      </Text>
    </Stack>
  );
}
