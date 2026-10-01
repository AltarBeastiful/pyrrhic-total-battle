/**
 * **A plan kernel that declines every door it may decline** (W16 E3 S5c): the engine's reference side for the
 * comparisons in `tests/kernel/**`, now that the kernel is mandatory (`requiredPlanKernel()` throws on
 * `setKernel(null)`) and there is no zero-kernel engine left to ask.
 *
 * `march`, `bill`, `sizeStacks` and `ladders` answer `null`, so `plan.ts` takes its named `…Declined` paths
 * (`marchOfDeclined`, `marchRecoveryDeclined`, `sizedCountsDeclined`, the scorer's TypeScript ladders) — the
 * TypeScript those doors were held `Object.is` to. `bindTable`, `sizePool` and `marchBill` forward to a real
 * kernel: the first is a no-op to the engine's figures, and the other two are kernel-only doors with no
 * TypeScript left behind them (W16 E3 S5a), held to their old bodies by `tests/golden/sizepool.json` and
 * `parity.test.ts`.
 */
import type { PlanKernel } from '@/engine/fast';
import { createPlanKernel } from '@/kernel/plan';

import { loadKernelModule } from './load';

export function decliningKernel(real: PlanKernel = createPlanKernel(loadKernelModule())): PlanKernel {
  return {
    bindTable: (request, table) => {
      real.bindTable(request, table);
    },
    march: () => null,
    bill: () => null,
    marchBill: (request, counts) => real.marchBill(request, counts),
    sizePool: (slots, capacity, ceiling, spread) => real.sizePool(slots, capacity, ceiling, spread),
    sizeStacks: () => null,
    ladders: () => null,
  };
}
