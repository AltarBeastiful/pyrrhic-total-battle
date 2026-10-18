// @vitest-environment jsdom
/**
 * **The burn ceiling on the owner's account** (`docs/plans/burn-ceiling.md` §3.2, §3.3; owner, 2026-10-18: *"On
 * the silver saver I know I can remove a weak stack like SW1 to put more monsters but this ups the merc burned
 * automatically"*).
 *
 * The owner's export of 2026-10-18 (`pyrrhic-my-account-2026-10-18.json` at the repository root, read only and
 * never committed; `PYRRHIC_EXPORT_2026_10_18` names another path), planned the way Generate plans it, and the
 * March read the way the pane reads it (`useMarch`). The file skips when the export is not on disk.
 *
 *  - The burn saver opens at 7 mercs lost (experiment 243's row), and taking SW1 out keeps it at 7.
 *  - A ceiling typed under it — on the march with SW1 out — re-sizes that edit and trims the march under it.
 *
 * **One test, both paths**: the plan kernel, and the declining kernel that sends the sizer and the march through
 * the TypeScript (`tests/kernel/declining.ts`); the raise is the kernel's on both.
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';

import type { PlanKernel } from '@/engine/fast';
import { setKernel } from '@/engine/fast';
import { createPlanKernel } from '@/kernel/plan';
import { parseImport } from '@/share/exportImport';
import { newRoot } from '@/state/defaults';
import type { Profile } from '@/state/schema';
import { useStore } from '@/state/store';
import { useResultStore } from '@/ui/resultStore';
import type * as WorkerClient from '@/worker/client';

import { putBackInMarch, removeFromFormation } from './formation';
import { runGenerate } from './generate';
import { changeBurnCeiling } from './poolLine';
import { useRunStore } from './runStore';
import { useMarch } from './useMarch';
import { decliningKernel } from '../../../../tests/kernel/declining';
import { loadKernelModule } from '../../../../tests/kernel/load';

vi.mock('@/ui/calcClient', async () => {
  const { createInlineClient } = await vi.importActual<typeof WorkerClient>('@/worker/client');
  const client = createInlineClient();
  return { getCalcClient: () => client, disposeCalcClient: () => undefined };
});

const EXPORT = process.env.PYRRHIC_EXPORT_2026_10_18 ?? 'pyrrhic-my-account-2026-10-18.json';
const SW1 = 'swordsman-1';

function load(): Profile | null {
  if (!existsSync(EXPORT)) return null;
  const parsed = parseImport(readFileSync(EXPORT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

const profile = load();

async function generateBurnSaver(): Promise<void> {
  if (profile === null) throw new Error('no export');
  const root = newRoot();
  root.profiles = [structuredClone(profile)];
  root.activeProfileId = profile.id;
  act(() => {
    useRunStore.getState().reset();
    useResultStore.getState().clear();
    useStore.getState().replaceDocument(root);
  });
  useRunStore.setState({ chosenStop: { kind: 'burn-saver', at: 0 } });
  await act(async () => {
    await runGenerate();
  });
  const plan = useRunStore.getState().plan;
  if (plan?.alternatives[useRunStore.getState().planPick]?.pick !== 'burn-saver') {
    throw new Error('the plan offers no burn-saver stop');
  }
}

const KERNEL = createPlanKernel(loadKernelModule());
const PATHS: [string, PlanKernel][] = [
  ['kernel', KERNEL],
  ['TypeScript', decliningKernel(KERNEL)],
];

afterEach(() => {
  cleanup();
});

describe.skipIf(profile === null).each(PATHS)(
  'the burn ceiling on the 2026-10-18 account, %s path',
  (_name, kernel) => {
    beforeAll(() => {
      setKernel(kernel);
    });
    afterAll(() => {
      setKernel(KERNEL);
    });

    test('SW1 out of the burn saver keeps 7 mercs lost, and a ceiling of 5 trims the edited march to 5', async () => {
      await generateBurnSaver();
      const { result: view } = renderHook(() => useMarch());
      const settled = async (check: () => void): Promise<void> => {
        await waitFor(
          () => {
            expect(view.current.searching).toBe(false);
            check();
          },
          { timeout: 120_000, interval: 20 },
        );
      };
      await settled(() => {
        expect(view.current.burn).toBe(7);
      });

      const before = useResultStore.getState().last;
      act(() => {
        removeFromFormation(SW1);
      });
      await waitFor(
        () => {
          expect(useResultStore.getState().last).not.toBe(before);
        },
        { timeout: 120_000 },
      );
      await settled(() => {
        expect(view.current.result?.stacks.some((stack) => stack.unitId === SW1 && stack.count > 0)).toBe(
          false,
        );
        expect(view.current.burn).toBe(7);
      });

      const edited = useResultStore.getState().last;
      act(() => {
        void changeBurnCeiling(5);
      });
      // The edit on screen is re-sized under the new ceiling (a new march is filed), and the March keeps under it.
      await waitFor(
        () => {
          expect(useResultStore.getState().last).not.toBe(edited);
        },
        { timeout: 120_000 },
      );
      await settled(() => {
        expect(view.current.burn).toBeLessThanOrEqual(5);
        expect(view.current.burn).toBeGreaterThan(0);
      });
      expect(useRunStore.getState().leftOutByPlayer).toEqual([SW1]);
    }, 600_000);

    test('a put-back under a ceiling swaps the march once, already Tight under the ceiling', async () => {
      await generateBurnSaver();
      const frames: string[] = [];
      const { result: view } = renderHook(() => {
        const march = useMarch();
        useEffect(() => {
          const counts = (march.result?.stacks ?? []).map(
            (stack) => `${stack.unitId}:${String(stack.count)}`,
          );
          const drawn = `${counts.join(',')}|${String(march.summary?.minDamage ?? 0)}`;
          if (frames.at(-1) !== drawn) frames.push(drawn);
        }, [march]);
        return march;
      });
      const settled = async (): Promise<void> => {
        await waitFor(
          () => {
            expect(view.current.searching).toBe(false);
          },
          { timeout: 120_000, interval: 20 },
        );
        await act(async () => {
          await new Promise((resolve) => globalThis.setTimeout(resolve, 100));
        });
      };
      await settled();
      await act(async () => {
        await changeBurnCeiling(5);
      });
      await settled();
      const out = useResultStore.getState().last;
      act(() => {
        removeFromFormation(SW1);
      });
      await waitFor(() => {
        expect(useResultStore.getState().last).not.toBe(out);
      });
      await settled();

      frames.splice(0, frames.length - 1);
      const back = useResultStore.getState().last;
      act(() => {
        putBackInMarch(SW1);
      });
      await waitFor(() => {
        expect(useResultStore.getState().last).not.toBe(back);
      });
      await settled();
      expect(frames, 'the put-back drew more than one march').toHaveLength(2);
      expect(view.current.burn).toBeLessThanOrEqual(5);
    }, 600_000);
  },
);
