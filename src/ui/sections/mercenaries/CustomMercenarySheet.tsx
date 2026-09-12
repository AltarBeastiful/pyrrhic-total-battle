/**
 * The "mercenary the tables do not know yet" form (design plan §7.2: the old dialog, restyled as a
 * sheet). Every field is a number the player can read off the mercenary's own card in game, so the
 * form asks for exactly those and nothing else, in the order the card reads them: what the unit is,
 * then what it costs to bring one back.
 *
 * The result is stored in `profile.mercenaries.custom` and turned into a normal unit by
 * `customMercenaryToUnit`, which is why the field names match that function's input.
 */
import { useState } from 'react';

import { events } from '@/data';
import { CATEGORIES, GROUPS, RACES } from '@/data/types';
import type { Category, Group, Race } from '@/data/types';
import type { CustomMercenary } from '@/state/schema';
import { Button, NumberStepper, Select, Sheet, TextField } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';

import { CATEGORY_LABELS, GROUP_LABELS, RACE_LABELS } from './labels';

/** `Select` keys are strings, so "nothing chosen" needs a key of its own. */
const NONE = 'none';

/** Short, readable and collision-free enough for a handful of hand-typed mercenaries. */
function shortId(): string {
  return `custom-${crypto.randomUUID().replace(/-/g, '').slice(0, 8)}`;
}

interface Draft {
  name: string;
  health: number | null;
  strength: number | null;
  cost: number | null;
  revivalGold: number | null;
  doubleDamageChance: number | null;
  role: Group;
  category: Category | typeof NONE;
  race: Race | typeof NONE;
  event: string;
}

function toDraft(merc: CustomMercenary | undefined): Draft {
  return {
    name: merc?.name ?? '',
    health: merc?.health ?? null,
    strength: merc?.strength ?? null,
    cost: merc?.cost ?? null,
    revivalGold: merc?.revivalGold ?? null,
    doubleDamageChance: merc?.doubleDamageChance ?? null,
    role: merc?.role ?? 'monster',
    category: merc?.category ?? NONE,
    race: merc?.race ?? NONE,
    event: merc?.event ?? NONE,
  };
}

export interface CustomMercenarySheetProps {
  isOpen: boolean;
  /** Absent = a new mercenary; present = edit that one, keeping its id. */
  initial?: CustomMercenary;
  onSubmit: (mercenary: CustomMercenary) => void;
  onClose: () => void;
}

export function CustomMercenarySheet({ isOpen, initial, onSubmit, onClose }: CustomMercenarySheetProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const editing = initial !== undefined;
  const named = draft.name.trim() !== '';

  const set = <K extends keyof Draft>(key: K, value: Draft[K]): void => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const save = (): void => {
    const name = draft.name.trim();
    if (name === '') return;
    onSubmit({
      id: initial?.id ?? shortId(),
      name,
      health: draft.health ?? 0,
      strength: draft.strength ?? 0,
      cost: draft.cost ?? 0,
      revivalGold: draft.revivalGold ?? 0,
      doubleDamageChance: draft.doubleDamageChance ?? 0,
      role: draft.role,
      ...(draft.category === NONE ? {} : { category: draft.category }),
      ...(draft.race === NONE ? {} : { race: draft.race }),
      ...(draft.event === NONE ? {} : { event: draft.event }),
    });
  };

  return (
    <Sheet
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={editing ? 'Edit custom mercenary' : 'Custom mercenary'}
      description="Copy the numbers straight off the mercenary's card in game."
      size="lg"
      footer={
        <>
          <Button onPress={onClose}>Cancel</Button>
          <Button variant="primary" isDisabled={!named} onPress={save}>
            {editing ? 'Save changes' : 'Add mercenary'}
          </Button>
        </>
      }
    >
      <Stack gap={4}>
        <TextField
          label="Name"
          value={draft.name}
          description="Required — it is how the mercenary shows up in your list."
          placeholder="Spider Queen"
          onChange={(value) => {
            set('name', value);
          }}
        />

        <Grid cols={{ sm: 2 }} gap={3}>
          <Select
            label="Role"
            value={draft.role}
            options={GROUPS.map((group) => ({ value: group, label: GROUP_LABELS[group] }))}
            onChange={(value) => {
              set('role', value as Group);
            }}
          />
          <Select
            label="Category"
            value={draft.category}
            options={[
              { value: NONE, label: 'None' },
              ...CATEGORIES.map((category) => ({ value: category, label: CATEGORY_LABELS[category] })),
            ]}
            onChange={(value) => {
              set('category', value as Category | typeof NONE);
            }}
          />
          <Select
            label="Race"
            value={draft.race}
            options={[
              { value: NONE, label: 'None' },
              ...RACES.map((race) => ({ value: race, label: RACE_LABELS[race] })),
            ]}
            onChange={(value) => {
              set('race', value as Race | typeof NONE);
            }}
          />
          <Select
            label="Event"
            value={draft.event}
            description="Its own bonuses only count while that event runs."
            options={[
              { value: NONE, label: 'None' },
              ...events.map((record) => ({ value: record.id, label: record.name })),
            ]}
            onChange={(value) => {
              set('event', value);
            }}
          />
          <NumberStepper
            label="Health"
            value={draft.health}
            min={0}
            step={1000}
            allowEmpty
            onChange={(value) => {
              set('health', value);
            }}
          />
          <NumberStepper
            label="Strength"
            value={draft.strength}
            min={0}
            step={1000}
            allowEmpty
            onChange={(value) => {
              set('strength', value);
            }}
          />
          <NumberStepper
            label="Authority cost"
            value={draft.cost}
            min={0}
            allowEmpty
            onChange={(value) => {
              set('cost', value);
            }}
          />
          <NumberStepper
            label="Double damage chance"
            value={draft.doubleDamageChance}
            min={0}
            max={100}
            suffix="%"
            allowEmpty
            onChange={(value) => {
              set('doubleDamageChance', value);
            }}
          />
          <NumberStepper
            label="Revival gold"
            value={draft.revivalGold}
            min={0}
            step={10}
            allowEmpty
            description="What one of them costs to bring back; mercenaries are never retrained."
            onChange={(value) => {
              set('revivalGold', value);
            }}
          />
        </Grid>
      </Stack>
    </Sheet>
  );
}
