import { describe, expect, test } from 'vitest';

import {
  checkDraft,
  deltaWords,
  emptyLine,
  fromDraft,
  hasErrors,
  toDraft,
  type UpgradeDraft,
} from './upgradeDraft';

function draft(patch: Partial<UpgradeDraft>): UpgradeDraft {
  return { label: 'Army health III', lines: [emptyLine()], amount: null, unit: '', ...patch };
}

describe('the upgrade draft', () => {
  test('a new draft opens with one empty line and no cost', () => {
    expect(toDraft(undefined)).toMatchObject({ label: '', amount: null, unit: '' });
    expect(toDraft(undefined).lines).toHaveLength(1);
  });

  test('an empty name and no line are refused, each with its sentence', () => {
    const errors = checkDraft(draft({ label: ' ' }));
    expect(errors.label).toBe('Name the upgrade, as the game calls it.');
    expect(errors.lines).toBe('Add at least one line the upgrade changes.');
  });

  test('a line needs a choice and a figure above 0, and each line comes once', () => {
    const errors = checkDraft(
      draft({
        lines: [
          { ...emptyLine(), value: 2 },
          { ...emptyLine(), target: 'health:army', value: 0 },
          { ...emptyLine(), target: 'strength:melee', value: 1 },
          { ...emptyLine(), target: 'strength:melee', value: 1 },
        ],
      }),
    );
    expect(errors.line).toEqual([
      'Pick what this line changes.',
      'Type what it adds.',
      undefined,
      'This line is already above.',
    ]);
    expect(errors.lines).toBeUndefined();
  });

  test('a cost needs its unit, and a unit its cost', () => {
    const line = { ...emptyLine(), target: 'health:army' as const, value: 2 };
    expect(checkDraft(draft({ lines: [line], amount: 4 })).unit).toBe('Say what the cost is counted in.');
    expect(checkDraft(draft({ lines: [line], unit: 'days' })).amount).toBe(
      'Type the cost, or clear its unit.',
    );
    expect(hasErrors(checkDraft(draft({ lines: [line], amount: 4, unit: 'talent points' })))).toBe(false);
  });

  test('a checked draft makes the stored upgrade, and the stored upgrade opens as the same draft', () => {
    const typed = draft({
      lines: [
        { ...emptyLine(), target: 'health:army', value: 2.5 },
        emptyLine(),
        { ...emptyLine(), target: 'housing:leadership', value: 1000 },
      ],
      amount: 4,
      unit: ' talent points ',
    });
    const upgrade = fromDraft(typed, 'u1');
    expect(upgrade).toEqual({
      id: 'u1',
      label: 'Army health III',
      deltas: { health: { army: 2.5 }, housing: { leadership: 1000 } },
      cost: { amount: 4, unit: 'talent points' },
    });
    expect(fromDraft(draft({}), 'u2')).toBeNull();
    const reopened = toDraft(upgrade ?? undefined);
    expect(reopened.lines.map(({ target, value }) => ({ target, value }))).toEqual([
      { target: 'health:army', value: 2.5 },
      { target: 'housing:leadership', value: 1000 },
    ]);
    expect(upgrade === null ? '' : deltaWords(upgrade)).toBe('+2.5 % Army health, +1 000 Leadership');
  });
});
