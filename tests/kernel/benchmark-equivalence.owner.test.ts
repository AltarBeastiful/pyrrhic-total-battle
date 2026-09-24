/** The benchmark on both engine paths, the owner's armies where his export is (`benchmark-equivalence.ts`). */
import { it } from 'vitest';

import { OWNER_EXPORT, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { benchmarkEquivalence } from './benchmark-equivalence';

const profile = ownerProfile();
if (profile)
  benchmarkEquivalence('the benchmark with the kernel, the owner’s armies', ownerScenarios(profile));
else it.skip(`the benchmark with the kernel, the owner’s armies (no export at ${OWNER_EXPORT})`, () => {});
