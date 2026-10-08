/**
 * **A typed upgrade, as the form holds it** (W17 C2, `docs/plans/progression-advisor.md` §4): the draft the
 * "Add an upgrade" sheet edits, its checks, and the two conversions between it and the stored `UserUpgrade`.
 *
 * Kept apart from the sheet so the checks are plain functions a test reads without rendering. A draft is a
 * list of lines — one bonus line or one housing pool each, and what it adds — rather than a field per key:
 * a talent tier changes one or two of 29 possible lines, and 29 fields is not a form (design rule 6).
 */
import { BONUS_KEYS, type BonusKey } from '@/data/types';
import type { Pool } from '@/engine/types';
import { userUpgradeSchema, type UserUpgrade } from '@/state/schema';
import { POOL_LABELS, POOLS } from '@/ui/sections/battle/choices';
import { BONUS_LABELS, formatPercent } from '@/ui/sections/bonuses/labels';

import { amount as formatAmount } from './format';

/** What one line changes: a health or strength bonus line, or a housing pool. */
export type LineTarget = `health:${BonusKey}` | `strength:${BonusKey}` | `housing:${Pool}`;

export interface LineDraft {
  /** The row's own key, so React keeps a field's focus while the lines above it change. */
  key: string;
  target: LineTarget | null;
  value: number | null;
}

export interface UpgradeDraft {
  label: string;
  lines: LineDraft[];
  /** An empty amount and an empty unit is "no cost typed". */
  amount: number | null;
  unit: string;
}

export interface DraftErrors {
  label?: string;
  /** About the lines as a whole: none of them changes anything. */
  lines?: string;
  /** One per line, by index; `undefined` for a line with nothing wrong. */
  line: (string | undefined)[];
  amount?: string;
  unit?: string;
}

/** The choices of a line's select, grouped as the Bonuses section reads them. */
export const LINE_GROUPS: { group: string; items: { value: LineTarget; label: string }[] }[] = [
  {
    group: 'Health',
    items: BONUS_KEYS.map((key) => ({
      value: `health:${key}` as const,
      label: `${BONUS_LABELS[key]} health`,
    })),
  },
  {
    group: 'Strength',
    items: BONUS_KEYS.map((key) => ({
      value: `strength:${key}` as const,
      label: `${BONUS_LABELS[key]} strength`,
    })),
  },
  {
    group: 'Housing',
    items: POOLS.map((pool) => ({ value: `housing:${pool}` as const, label: POOL_LABELS[pool] })),
  },
];

const TARGETS = new Set<string>(LINE_GROUPS.flatMap((group) => group.items.map((item) => item.value)));

export function isLineTarget(value: string | null): value is LineTarget {
  return value !== null && TARGETS.has(value);
}

/** A housing pool counts slots, so its figure is whole; a bonus is a percentage and may have a fraction. */
export function isHousing(target: LineTarget | null): boolean {
  return target?.startsWith('housing:') ?? false;
}

let lineCount = 0;
export function emptyLine(): LineDraft {
  lineCount += 1;
  return { key: `line-${String(lineCount)}`, target: null, value: null };
}

/** The draft an upgrade opens with: its own lines when it is edited, one empty line when it is new. */
export function toDraft(upgrade: UserUpgrade | undefined): UpgradeDraft {
  if (upgrade === undefined) return { label: '', lines: [emptyLine()], amount: null, unit: '' };
  const lines: LineDraft[] = [];
  const { health, strength, housing } = upgrade.deltas;
  for (const [key, value] of Object.entries(health ?? {})) {
    lines.push({ ...emptyLine(), target: `health:${key as BonusKey}`, value });
  }
  for (const [key, value] of Object.entries(strength ?? {})) {
    lines.push({ ...emptyLine(), target: `strength:${key as BonusKey}`, value });
  }
  for (const [pool, value] of Object.entries(housing ?? {})) {
    if (value !== undefined) lines.push({ ...emptyLine(), target: `housing:${pool as Pool}`, value });
  }
  return {
    label: upgrade.label,
    lines: lines.length > 0 ? lines : [emptyLine()],
    amount: upgrade.cost?.amount ?? null,
    unit: upgrade.cost?.unit ?? '',
  };
}

/** A line the player has not touched: no choice, no figure. It is skipped, never an error. */
function untouched(line: LineDraft): boolean {
  return line.target === null && line.value === null;
}

/** What is wrong with the draft, in the words the sheet prints under each field. Empty when it can be saved. */
export function checkDraft(draft: UpgradeDraft): DraftErrors {
  const errors: DraftErrors = { line: [] };
  if (draft.label.trim() === '') errors.label = 'Name the upgrade, as the game calls it.';

  const seen = new Set<LineTarget>();
  let changes = 0;
  draft.lines.forEach((line, index) => {
    if (untouched(line)) return;
    if (line.target === null) {
      errors.line[index] = 'Pick what this line changes.';
    } else if (seen.has(line.target)) {
      errors.line[index] = 'This line is already above.';
    } else if (line.value === null || line.value <= 0) {
      errors.line[index] = 'Type what it adds.';
    } else {
      changes += 1;
    }
    if (line.target !== null) seen.add(line.target);
  });
  if (changes === 0 && errors.line.every((message) => message === undefined)) {
    errors.lines = 'Add at least one line the upgrade changes.';
  }

  const unit = draft.unit.trim();
  if (draft.amount !== null && draft.amount <= 0) errors.amount = 'A cost is above 0.';
  else if (draft.amount !== null && unit === '') errors.unit = 'Say what the cost is counted in.';
  else if (draft.amount === null && unit !== '') errors.amount = 'Type the cost, or clear its unit.';
  return errors;
}

export function hasErrors(errors: DraftErrors): boolean {
  return (
    errors.label !== undefined ||
    errors.lines !== undefined ||
    errors.amount !== undefined ||
    errors.unit !== undefined ||
    errors.line.some((message) => message !== undefined)
  );
}

/**
 * **The stored upgrade a checked draft makes**, under `id`; `null` while `checkDraft` finds anything wrong. It
 * goes through `userUpgradeSchema`, the shape the store and a sync will hold it to.
 */
export function fromDraft(draft: UpgradeDraft, id: string): UserUpgrade | null {
  if (hasErrors(checkDraft(draft))) return null;
  const deltas: UserUpgrade['deltas'] = {};
  for (const line of draft.lines) {
    if (line.target === null || line.value === null) continue;
    const [family, key] = line.target.split(':') as ['health' | 'strength' | 'housing', string];
    deltas[family] = { ...deltas[family], [key]: line.value };
  }
  const unit = draft.unit.trim();
  const parsed = userUpgradeSchema.safeParse({
    id,
    label: draft.label.trim(),
    deltas,
    ...(draft.amount === null ? {} : { cost: { amount: draft.amount, unit } }),
  });
  return parsed.success ? parsed.data : null;
}

/** What an upgrade changes, in one line: "+2 % Melee health, +1 000 Leadership". */
export function deltaWords(upgrade: UserUpgrade): string {
  const { health, strength, housing } = upgrade.deltas;
  const parts: string[] = [];
  for (const [key, value] of Object.entries(health ?? {})) {
    parts.push(`${formatPercent(value)} ${BONUS_LABELS[key as BonusKey]} health`);
  }
  for (const [key, value] of Object.entries(strength ?? {})) {
    parts.push(`${formatPercent(value)} ${BONUS_LABELS[key as BonusKey]} strength`);
  }
  for (const [pool, value] of Object.entries(housing ?? {})) {
    if (value !== undefined) parts.push(`+${formatAmount(value)} ${POOL_LABELS[pool as Pool]}`);
  }
  return parts.join(', ');
}
