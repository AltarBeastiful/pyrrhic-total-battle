/**
 * **The "Add an upgrade" form** (W17 C2): the next step of a real source — a talent tier, an army modernization
 * step — typed by the player, with what it costs when they know it, so the advisor reads what that step would
 * bring (`userProbe`) and ranks it by gain per cost.
 *
 * `CustomMercenarySheet`'s shape: a `Sheet` holding a draft, Cancel and the main button at its foot, Enter on
 * the last field doing what the main button does (owner, 2026-10-02: *"validate with enter"*). The checks are
 * `upgradeDraft.ts`'s and say nothing until the first try to save, then follow every keystroke.
 *
 * Design rules (`docs/design-rules.md`): 6 (the lines are the form, one per change), 9 (plain number inputs that
 * select on focus), 15 (the cost is optional and says so), 18–19 (one column at 390 px), 23 (stock Mantine and
 * the kit's `Sheet` and `NumberField`), 24 (every field labelled, the remove button named after its line), 26
 * (sentence case, our words).
 */
import { ActionIcon, Button, Group, Select, Stack, Text, TextInput } from '@mantine/core';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

import type { UserUpgrade } from '@/state/schema';
import { NumberField, Sheet } from '@/ui/kit';

import {
  checkDraft,
  emptyLine,
  fromDraft,
  hasErrors,
  isHousing,
  isLineTarget,
  LINE_GROUPS,
  toDraft,
  type LineDraft,
  type UpgradeDraft,
} from './upgradeDraft';

export interface UpgradeSheetProps {
  opened: boolean;
  /** Absent = a new upgrade; present = edit that one, keeping its id. */
  initial?: UserUpgrade;
  onSubmit: (upgrade: UserUpgrade) => void;
  onClose: () => void;
}

/** Short and collision-free enough for a handful of hand-typed upgrades (`CustomMercenarySheet`'s idea). */
function shortId(): string {
  return `upgrade-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

function lineName(target: LineDraft['target'], index: number): string {
  if (target === null) return `line ${String(index + 1)}`;
  for (const group of LINE_GROUPS) {
    const item = group.items.find((choice) => choice.value === target);
    if (item !== undefined) return group.group === 'Housing' ? `${item.label} housing` : item.label;
  }
  return `line ${String(index + 1)}`;
}

export function UpgradeSheet({ opened, initial, onSubmit, onClose }: UpgradeSheetProps) {
  const [draft, setDraft] = useState<UpgradeDraft>(() => toDraft(initial));
  const [tried, setTried] = useState(false);
  const editing = initial !== undefined;
  const errors = tried ? checkDraft(draft) : { line: [] };

  const set = <K extends keyof UpgradeDraft>(key: K, value: UpgradeDraft[K]): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };
  const setLine = (index: number, patch: Partial<LineDraft>): void => {
    setDraft((current) => ({
      ...current,
      lines: current.lines.map((line, at) => (at === index ? { ...line, ...patch } : line)),
    }));
  };

  const save = (): void => {
    setTried(true);
    if (hasErrors(checkDraft(draft))) return;
    const upgrade = fromDraft(draft, initial?.id ?? shortId());
    if (upgrade !== null) onSubmit(upgrade);
  };

  return (
    <Sheet
      opened={opened}
      onClose={onClose}
      title={editing ? 'Edit upgrade' : 'Add an upgrade'}
      description="The next step of a talent tier or a modernization, as the game shows it: what it adds, and what it costs if you want them ranked by cost."
      onEnter={save}
      footer={
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save}>{editing ? 'Save changes' : 'Add upgrade'}</Button>
        </Group>
      }
    >
      <Stack gap="sm">
        <TextInput
          label="Name"
          value={draft.label}
          placeholder="Talent: army health III"
          error={errors.label}
          onChange={(event) => {
            set('label', event.currentTarget.value);
          }}
        />

        <Stack gap="xs" role="group" aria-label="What it changes">
          <Text size="sm" fw={500}>
            What it changes
          </Text>
          {draft.lines.map((line, index) => (
            <Group key={line.key} gap="xs" wrap="nowrap" align="flex-start">
              <Select
                aria-label={`What ${lineName(line.target, index)} changes`}
                placeholder="Pick a line"
                data={LINE_GROUPS}
                value={line.target}
                searchable
                flex={1}
                miw={0}
                error={errors.line[index]}
                onChange={(value) => {
                  setLine(index, { target: isLineTarget(value) ? value : null });
                }}
              />
              <NumberField
                label=""
                accessibleName={`What ${lineName(line.target, index)} adds`}
                value={line.value}
                allowEmpty
                allowDecimal={!isHousing(line.target)}
                placeholder={isHousing(line.target) ? 'slots' : '%'}
                w="6.5rem"
                onChange={(value) => {
                  setLine(index, { value });
                }}
              />
              <ActionIcon
                size="lg"
                variant="subtle"
                color="gray"
                aria-label={`Remove ${lineName(line.target, index)}`}
                disabled={draft.lines.length === 1}
                onClick={() => {
                  set(
                    'lines',
                    draft.lines.filter((_, at) => at !== index),
                  );
                }}
              >
                <X size={16} aria-hidden />
              </ActionIcon>
            </Group>
          ))}
          {errors.lines !== undefined && (
            <Text size="sm" c="red" role="alert">
              {errors.lines}
            </Text>
          )}
          <Group>
            <Button
              size="xs"
              variant="default"
              leftSection={<Plus size={14} aria-hidden />}
              onClick={() => {
                set('lines', [...draft.lines, emptyLine()]);
              }}
            >
              Add a line
            </Button>
          </Group>
        </Stack>

        <Group gap="xs" wrap="nowrap" align="flex-start">
          <NumberField
            label="Cost"
            value={draft.amount}
            allowEmpty
            allowDecimal
            placeholder="optional"
            error={errors.amount}
            w="8rem"
            onChange={(value) => {
              set('amount', value);
            }}
          />
          <TextInput
            label="Counted in"
            value={draft.unit}
            placeholder="talent points"
            error={errors.unit}
            flex={1}
            miw={0}
            onChange={(event) => {
              set('unit', event.currentTarget.value);
            }}
          />
        </Group>
      </Stack>
    </Sheet>
  );
}
