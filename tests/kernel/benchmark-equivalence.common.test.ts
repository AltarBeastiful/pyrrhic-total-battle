/** The benchmark on both engine paths, the armies that run everywhere (`benchmark-equivalence.ts`). */
import { commonScenarios } from '../engine/plan-scenarios';

import { benchmarkEquivalence } from './benchmark-equivalence';

benchmarkEquivalence('the benchmark with the kernel, the common armies', commonScenarios());
