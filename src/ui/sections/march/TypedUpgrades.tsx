/**
 * **The player's own upgrades, in the advisor card** (W17 C2): the list stored on the profile
 * (`profile.upgrades`), each with what it changes and what it costs, an edit and a delete, and "Add an upgrade".
 * The advisor's pass reads them beside its generic probes (`computeAdvice`), so a typed talent tier is ranked
 * with the rest — by gain per cost when it has one.
 *
 * Folded (design rules 3–4: typed once, read often), its summary the count. Edits go through `updateProfile`,
 * which stamps the profile's `upgrades` section for the account sync (S-49e).
 *
 * Design rules (`docs/design-rules.md`): 4 (folded, the count as its summary), 6 (each row reads as the
 * upgrade itself), 15 (no cost line while none is typed), 18–19 (two-line rows, icon buttons sized for a
 * thumb at 390 px), 23 (stock Mantine, the kit's `Disclosure`), 24 (each icon button named after its upgrade),
 * 26 (sentence case, our words).
 */
import { ActionIcon, Button, Group, Stack, Text } from '@mantine/core';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { UserUpgrade } from '@/state/schema';
import { selectActiveProfile, useStore } from '@/state/store';
import { Disclosure } from '@/ui/kit';

import { amount } from './format';
import { deltaWords } from './upgradeDraft';
import { UpgradeSheet } from './UpgradeSheet';
import classes from './march.module.css';

const EMPTY: readonly UserUpgrade[] = [];

/** Which sheet is open: none, a new upgrade, or one being edited. */
type Editing = { kind: 'closed' } | { kind: 'new' } | { kind: 'edit'; upgrade: UserUpgrade };

export function TypedUpgrades() {
  const profileId = useStore((state) => selectActiveProfile(state)?.id);
  const upgrades = useStore((state) => selectActiveProfile(state)?.upgrades ?? EMPTY);
  const updateProfile = useStore((state) => state.updateProfile);
  const [editing, setEditing] = useState<Editing>({ kind: 'closed' });
  // A fresh sheet per opening, so a cancelled draft never comes back.
  const [opening, setOpening] = useState(0);

  if (profileId === undefined) return null;

  const write = (next: UserUpgrade[]): void => {
    updateProfile(profileId, () => ({ upgrades: next }));
  };
  const open = (next: Editing): void => {
    setOpening((count) => count + 1);
    setEditing(next);
  };
  const close = (): void => {
    setEditing({ kind: 'closed' });
  };

  return (
    <>
      <Disclosure
        title="Your own upgrades"
        summary={
          upgrades.length === 0
            ? 'none typed'
            : `${String(upgrades.length)} upgrade${upgrades.length === 1 ? '' : 's'}`
        }
      >
        <Stack gap="xs">
          {upgrades.length === 0 && (
            <Text className={classes.meta} c="dimmed">
              Type the next step of a talent tier or a modernization to see what it would bring.
            </Text>
          )}
          {upgrades.map((upgrade) => (
            <Group
              key={upgrade.id}
              justify="space-between"
              wrap="nowrap"
              gap="xs"
              data-testid="typed-upgrade"
            >
              <Stack gap={0} miw={0}>
                <Text size="sm">{upgrade.label}</Text>
                <Text className={classes.meta} c="dimmed">
                  {deltaWords(upgrade)}
                  {upgrade.cost === undefined
                    ? ''
                    : `; costs ${amount(upgrade.cost.amount)} ${upgrade.cost.unit}`}
                </Text>
              </Stack>
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`Edit ${upgrade.label}`}
                  onClick={() => {
                    open({ kind: 'edit', upgrade });
                  }}
                >
                  <Pencil size={16} aria-hidden />
                </ActionIcon>
                <ActionIcon
                  size="lg"
                  variant="subtle"
                  color="gray"
                  aria-label={`Delete ${upgrade.label}`}
                  onClick={() => {
                    write(upgrades.filter((other) => other.id !== upgrade.id));
                  }}
                >
                  <Trash2 size={16} aria-hidden />
                </ActionIcon>
              </Group>
            </Group>
          ))}
          <Group>
            <Button
              size="xs"
              variant="default"
              leftSection={<Plus size={14} aria-hidden />}
              onClick={() => {
                open({ kind: 'new' });
              }}
            >
              Add an upgrade
            </Button>
          </Group>
        </Stack>
      </Disclosure>
      {editing.kind !== 'closed' && (
        <UpgradeSheet
          key={opening}
          opened
          {...(editing.kind === 'edit' ? { initial: editing.upgrade } : {})}
          onClose={close}
          onSubmit={(upgrade) => {
            const at = upgrades.findIndex((other) => other.id === upgrade.id);
            write(
              at === -1 ? [...upgrades, upgrade] : upgrades.map((other, i) => (i === at ? upgrade : other)),
            );
            close();
          }}
        />
      )}
    </>
  );
}
