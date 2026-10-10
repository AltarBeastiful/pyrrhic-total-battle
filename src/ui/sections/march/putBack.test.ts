// @vitest-environment jsdom
/**
 * **Putting a troop back follows Tight on the same set, and is idempotent with taking it out** (Critical 03,
 * backlog B-10; the owner, `todos.md` 2026-10-10: *"putback should follow tight rules but keeping the
 * troops/merc/monster same set. Goal: put back and keep away a troop or contrary should end up idempotent"*).
 *
 * The owner's own account of 2026-10-07 (`pyrrhic-my-account-2026-10-07.json` at the repository root, read
 * only, never committed; `PYRRHIC_EXPORT_2026_10_07` names another path) is planned the way Generate plans it,
 * and the March is walked through the real presses — `removeFromFormation`, `putBackInMarch` — on the stores
 * and the inline calculation client, exactly as `formation.ts` runs them. What the March draws is read the way
 * `useMarch` draws it under the default position: the filed march with `Tight` over it (`liftedCounts`). The
 * file skips when the export is not on disk (experiment 201 reads it the same way).
 *
 * Three properties, one per `describe` line below:
 *
 *  1. **Tight rule.** The march a set of types stands at is the Tight raise of the march the plan gives that
 *     set: for the stop's own set, that is the stop under Tight — the march the bar opened on. So an edit and
 *     its inverse, pressed on any stop of the bar, land back on that stop's own march.
 *  2. **Same set.** A put-back adds the one type: every troop, mercenary and monster stack fielded before it is
 *     still fielded after it.
 *  3. **Idempotent.** Take out then put back, and put back then take out, both return the exact counts of the
 *     step before; a second put-back of a type already in changes nothing.
 *
 * **One test, both paths**: the walk runs on the plan kernel, and again on the declining kernel
 * (`tests/kernel/declining.ts`), which sends the sizer and the march through the TypeScript they were held to.
 * `Tight` itself is the kernel's on both (the TypeScript raise search was retired in W16 E3 S5b).
 *
 * Every stop of the bar is walked, with SW1 and SP3 (the two types of the owner's report): a stop that fields
 * the type takes it out and puts it back; a stop that leaves it out puts it back and takes it out.
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { act } from '@testing-library/react';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';

import { parseImport } from '@/share/exportImport';
import { newRoot } from '@/state/defaults';
import type { PlanKernel } from '@/engine/fast';
import { setKernel } from '@/engine/fast';
import type { PlanPick } from '@/engine/plan';
import { createPlanKernel } from '@/kernel/plan';
import type { Profile } from '@/state/schema';
import { useStore } from '@/state/store';
import { useResultStore } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import { removeFromFormation, putBackInMarch } from './formation';
import { runGenerate } from './generate';
import { liftedCounts } from './positions';
import { countsOf } from './raise';
import { useRunStore } from './runStore';
import { decliningKernel } from '../../../../tests/kernel/declining';
import { loadKernelModule } from '../../../../tests/kernel/load';

vi.mock('@/ui/calcClient', async () => {
  const { createInlineClient } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  const client = createInlineClient();
  return { getCalcClient: () => client, disposeCalcClient: () => undefined };
});

const EXPORT = process.env.PYRRHIC_EXPORT_2026_10_07 ?? 'pyrrhic-my-account-2026-10-07.json';
const TIGHT = { authority: 'tight', dominance: 'tight' } as const;
const SP3 = 'spearman-3';
const SW1 = 'swordsman-1';

function load(): Profile | null {
  if (!existsSync(EXPORT)) return null;
  const parsed = parseImport(readFileSync(EXPORT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

const profile = load();

/** What the March draws under the default position: the filed march, raised by `Tight`, zero stacks dropped. */
function shown(): Record<string, number> {
  const last = useResultStore.getState().last;
  if (last === null) throw new Error('no march on screen');
  const lifted = liftedCounts(last.request, last.result, TIGHT);
  const counts: Record<string, number> = { ...countsOf(last.result), ...(lifted?.counts ?? {}) };
  return Object.fromEntries(Object.entries(counts).filter(([, count]) => count > 0));
}

/** One press, waited for: the re-size files a new march (or an error) before the next press reads it. */
async function press(action: (unitId: string) => void, unitId: string): Promise<Record<string, number>> {
  const before = useResultStore.getState().last;
  act(() => {
    action(unitId);
  });
  await vi.waitFor(
    () => {
      const state = useResultStore.getState();
      expect(state.error).toBeNull();
      expect(state.last).not.toBe(before);
    },
    { timeout: 120_000, interval: 20 },
  );
  return shown();
}

/** The march Generate opens on at `kind`'s stop, with every edit of the last walk forgotten. */
async function generate(kind: PlanPick | null = null): Promise<Record<string, number>> {
  if (profile === null) throw new Error('no export');
  const root = newRoot();
  root.profiles = [structuredClone(profile)];
  root.activeProfileId = profile.id;
  act(() => {
    useStore.getState().replaceDocument(root);
  });
  // The stop the bar opens on is the one the player last read (`openingPosition`): name it by its kind.
  useRunStore.setState({ chosenStop: kind === null ? null : { kind, at: 0 } });
  await runGenerate();
  const plan = useRunStore.getState().plan;
  if (kind !== null && plan?.alternatives[useRunStore.getState().planPick]?.pick !== kind) {
    throw new Error(`the plan offers no ${kind} stop`);
  }
  if (useResultStore.getState().last === null) throw new Error(useResultStore.getState().error ?? 'no march');
  return shown();
}

const ids = (counts: Record<string, number>) => Object.keys(counts).sort();

/** The five stops of the bar on this account (experiment 201), and whether each fields SW1 and SP3. */
const STOPS = ['burn-saver', 'silver-saver', 'sweet-spot', 'more-mercs', 'steady-max'] as const;

/** One edit on the stop's own march: take `unitId` out if the stop fields it, put it back if it does not. */
function editOf(stop: Record<string, number>, unitId: string) {
  const fielded = (stop[unitId] ?? 0) > 0;
  return fielded
    ? { edit: removeFromFormation, inverse: putBackInMarch, words: 'out then back' }
    : { edit: putBackInMarch, inverse: removeFromFormation, words: 'back then out' };
}

const KERNEL = createPlanKernel(loadKernelModule());
const PATHS: [string, PlanKernel][] = [
  ['kernel', KERNEL],
  ['TypeScript', decliningKernel(KERNEL)],
];

describe.skipIf(profile === null).each(PATHS)(
  'putting a type back on the 2026-10-07 account, %s path',
  (_name, kernel) => {
    beforeAll(() => {
      setKernel(kernel);
    });
    afterAll(() => {
      setKernel(KERNEL);
    });

    describe.each(STOPS)('on the %s stop', (kind) => {
      test.each([SW1, SP3])(
        'Tight rule: %s, edited and edited back, lands on the stop under Tight',
        async (unitId) => {
          const stop = await generate(kind);
          const { edit, inverse, words } = editOf(stop, unitId);
          await press(edit, unitId);
          expect(await press(inverse, unitId), `${unitId} ${words}`).toEqual(stop);
        },
        600_000,
      );

      test.each([SW1, SP3])(
        'same set: %s, edited and edited back, keeps every stack the stop fields',
        async (unitId) => {
          const stop = await generate(kind);
          const { edit, inverse, words } = editOf(stop, unitId);
          const once = await press(edit, unitId);
          const back = await press(inverse, unitId);
          expect(ids(back), `${unitId} ${words}`).toEqual(ids(stop));
          // The edit itself moved that one type and no other.
          const moved = new Set(
            [...ids(once), ...ids(stop)].filter((id) => (once[id] ?? 0) > 0 !== (stop[id] ?? 0) > 0),
          );
          expect([...moved]).toEqual([unitId]);
        },
        600_000,
      );
    });

    test('idempotent: put back then take out restores the step before, and a second put-back changes nothing', async () => {
      await generate('sweet-spot');
      await press(removeFromFormation, SP3);
      const out = await press(removeFromFormation, SW1);
      const back = await press(putBackInMarch, SW1);
      expect(ids(back)).toEqual(ids({ ...out, [SW1]: 1 }));
      expect(await press(removeFromFormation, SW1)).toEqual(out);
      expect(await press(putBackInMarch, SW1)).toEqual(back);
      // A type already in: the press is a no-op.
      expect(await press(putBackInMarch, SW1)).toEqual(back);
    }, 600_000);

    test('idempotent: take out then put back restores the step before', async () => {
      await generate('sweet-spot');
      const before = await press(removeFromFormation, SP3);
      await press(removeFromFormation, SW1);
      expect(await press(putBackInMarch, SW1)).toEqual(before);
    }, 600_000);

    test('a pair off the stop: both types out, each put back and taken out again, restores the step before', async () => {
      await generate('sweet-spot');
      await press(removeFromFormation, SP3);
      const out = await press(removeFromFormation, SW1);
      for (const unitId of [SP3, SW1]) {
        await press(putBackInMarch, unitId);
        expect(await press(removeFromFormation, unitId), `${unitId} back then out`).toEqual(out);
      }
    }, 600_000);
  },
);
