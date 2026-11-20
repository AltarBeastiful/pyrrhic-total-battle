/**
 * **Copy to battle bonuses** (B-25): one press writes the totals of the ranks the player holds into the "Hero
 * Talents" source, so the battle and the March read his tree. The sync state is derived on every render from the
 * tree and the source (`talentCopy`), never stored, so a hand edit, an import or a merge cannot leave it wrong.
 *
 * States: nothing held (disabled, with its reason beside it), out of sync (emphasised, the hover lists up to three
 * differences and is also read on keyboard focus and by a screen reader), in sync (quiet). A copy replaces the
 * whole source and asks once only when the source already holds a non-zero value (design rules 17, 21).
 */
import { Button, Group, Stack, Text, Tooltip, VisuallyHidden } from '@mantine/core';
import { useId, useMemo, useState } from 'react';

import { talents as TALENTS } from '@/data';
import { talentCopy, type TalentDifference } from '@/engine/talentCopy';
import { selectActiveProfile, useStore } from '@/state/store';
import { Dialog } from '@/ui/kit';

import { percent } from './labels';

const signed = (value: number): string => `${value > 0 ? '+' : ''}${percent(value)}`;

/** "melee strength +3 % in your tree, 0 % in Hero Talents". */
const differenceWords = (d: TalentDifference): string =>
  `${d.key} ${d.line} ${signed(d.tree)} in your tree, ${signed(d.source)} in Hero Talents`;

const holdsValue = (values: Readonly<Record<string, number | undefined>> | undefined): boolean =>
  Object.values(values ?? {}).some((value) => value !== undefined && value !== 0);

export function CopyToBattle() {
  const profile = useStore(selectActiveProfile);
  const updateProfile = useStore((state) => state.updateProfile);
  const [asking, setAsking] = useState(false);
  const hintId = useId();
  const ranks = profile?.talents.ranks;
  const hero = profile?.sources.permanent.find((entry) => entry.builtin === 'heroTalents');
  const copy = useMemo(() => (ranks === undefined ? null : talentCopy(TALENTS, ranks, hero)), [ranks, hero]);
  if (profile === undefined || copy === null) return null;

  const write = (): void => {
    updateProfile(profile.id, (current) => ({
      sources: {
        ...current.sources,
        permanent: current.sources.permanent.map((entry) => {
          if (entry.builtin !== 'heroTalents') return entry;
          const { special: _dropped, ...rest } = entry;
          return { ...rest, strength: copy.lines.strength, health: copy.lines.health };
        }),
      },
    }));
    setAsking(false);
  };
  const press = (): void => {
    if (
      hero !== undefined &&
      (holdsValue(hero.strength) || holdsValue(hero.health) || holdsValue(hero.special))
    )
      setAsking(true);
    else write();
  };

  const nothing = copy.held === 0;
  const quiet = !nothing && copy.inSync;
  const detail = copy.differences.map(differenceWords).join('; ');
  return (
    <Stack gap={4} role="group" aria-label="Battle bonuses from your talents">
      <Group gap="xs" align="center">
        <Tooltip
          label={detail}
          disabled={nothing || quiet}
          multiline
          w={260}
          events={{ hover: true, focus: true, touch: true }}
        >
          <Button
            size="xs"
            variant={quiet ? 'subtle' : 'filled'}
            disabled={nothing}
            aria-describedby={hintId}
            aria-label={quiet ? 'Copied, matches your tree' : 'Copy to battle bonuses'}
            onClick={press}
          >
            {quiet ? 'Copied, matches your tree' : 'Copy to battle bonuses'}
          </Button>
        </Tooltip>
        {nothing && (
          <Text size="xs" c="dimmed">
            Hold a rank to copy.
          </Text>
        )}
      </Group>
      <VisuallyHidden id={hintId}>
        {nothing
          ? 'No rank held.'
          : quiet
            ? 'Hero Talents matches your tree.'
            : `Hero Talents differs from your tree: ${detail}.`}
      </VisuallyHidden>
      {copy.noEffect > 0 && (
        <Text size="xs" c="dimmed">
          {`${String(copy.noEffect)} held ${copy.noEffect === 1 ? 'talent has' : 'talents have'} no battle effect here`}
        </Text>
      )}
      <Dialog
        opened={asking}
        onClose={() => {
          setAsking(false);
        }}
        role="alertdialog"
        size="sm"
        title="Replace Hero Talents?"
        description="Hero Talents already holds values. They are replaced by the totals of the ranks you hold."
        footer={
          <Group justify="flex-end" gap="xs">
            <Button
              variant="default"
              onClick={() => {
                setAsking(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={write}>Replace</Button>
          </Group>
        }
      />
    </Stack>
  );
}
