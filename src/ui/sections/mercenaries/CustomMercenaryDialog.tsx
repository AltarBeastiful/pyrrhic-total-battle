/**
 * S-12 — the "mercenary the tables do not know yet" form.
 *
 * Every field is a number the player can read off the mercenary's own sheet in game, so the form asks for
 * exactly those and nothing else. The result is stored in `profile.mercenaries.custom` and turned into a
 * normal unit by `customMercenaryToUnit`, which is why the field names match that function's input.
 */
import { useState } from 'react';

import { events } from '@/data';
import { CATEGORIES, GROUPS, RACES } from '@/data/types';
import type { Category, Group, Race } from '@/data/types';
import type { CustomMercenary } from '@/state/schema';

import { Button, Dialog, NativeSelect, NumberField } from '../../primitives';
import { CATEGORY_LABELS, GROUP_LABELS, RACE_LABELS } from './labels';
import { TextField } from './TextField';

const NONE = '';

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
  category: Category | '';
  race: Race | '';
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
    category: merc?.category ?? '',
    race: merc?.race ?? '',
    event: merc?.event ?? NONE,
  };
}

export interface CustomMercenaryDialogProps {
  /** Absent = a new mercenary; present = edit that one, keeping its id. */
  initial?: CustomMercenary;
  onSubmit: (mercenary: CustomMercenary) => void;
  onClose: () => void;
}

export function CustomMercenaryDialog({ initial, onSubmit, onClose }: CustomMercenaryDialogProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(initial));
  const editing = initial !== undefined;

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
      ...(draft.category === '' ? {} : { category: draft.category }),
      ...(draft.race === '' ? {} : { race: draft.race }),
      ...(draft.event === NONE ? {} : { event: draft.event }),
    });
  };

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={editing ? 'Edit custom mercenary' : 'Custom mercenary'}
      description="Copy the numbers from the mercenary's own sheet in game."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" disabled={draft.name.trim() === ''} onClick={save}>
            {editing ? 'Save changes' : 'Add mercenary'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <TextField
          label="Name"
          value={draft.name}
          hint="Required — it is how the mercenary shows up in your list."
          onChange={(value) => {
            set('name', value);
          }}
          placeholder="Spider Queen"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Health"
            value={draft.health}
            min={0}
            onChange={(value) => {
              set('health', value);
            }}
          />
          <NumberField
            label="Strength"
            value={draft.strength}
            min={0}
            onChange={(value) => {
              set('strength', value);
            }}
          />
          <NumberField
            label="Authority cost"
            value={draft.cost}
            min={0}
            onChange={(value) => {
              set('cost', value);
            }}
          />
          <NumberField
            label="Revival gold"
            value={draft.revivalGold}
            min={0}
            onChange={(value) => {
              set('revivalGold', value);
            }}
          />
          <NumberField
            label="Double damage chance"
            value={draft.doubleDamageChance}
            min={0}
            max={100}
            decimal
            suffix="%"
            onChange={(value) => {
              set('doubleDamageChance', value);
            }}
          />
          <NativeSelect
            label="Role"
            hideLabel={false}
            value={draft.role}
            options={GROUPS.map((group) => ({ value: group, label: GROUP_LABELS[group] }))}
            onChange={(event) => {
              set('role', event.target.value as Group);
            }}
          />
          <NativeSelect
            label="Category"
            hideLabel={false}
            value={draft.category}
            options={[
              { value: NONE, label: 'None' },
              ...CATEGORIES.map((category) => ({ value: category, label: CATEGORY_LABELS[category] })),
            ]}
            onChange={(event) => {
              set('category', event.target.value as Category | '');
            }}
          />
          <NativeSelect
            label="Race"
            hideLabel={false}
            value={draft.race}
            options={[
              { value: NONE, label: 'None' },
              ...RACES.map((race) => ({ value: race, label: RACE_LABELS[race] })),
            ]}
            onChange={(event) => {
              set('race', event.target.value as Race | '');
            }}
          />
          <NativeSelect
            label="Event"
            hideLabel={false}
            value={draft.event}
            options={[
              { value: NONE, label: 'None' },
              ...events.map((record) => ({ value: record.id, label: record.name })),
            ]}
            onChange={(event) => {
              set('event', event.target.value);
            }}
          />
        </div>
        <p className="text-muted text-xs">
          Role, category and race decide which of your bonuses reach this mercenary. An event means its own
          bonuses only count while that event is running.
        </p>
      </div>
    </Dialog>
  );
}
