/**
 * **The troop-pool cache, a copy and nothing else** (W20 C1, `docs/plans/sizer-track-c.md`; `sizeTroops` in
 * `kernel/assembly/index.ts`). Pool 0 of the sizer is kept per input (the slots' HP, cost and cap, the capacity,
 * the spread) and copied on a hit. On every benchmark army and both fixtures:
 *
 *  - **door level**: the recorded `sizedShape` calls are answered twice through the kernel's door, in the
 *    order they were asked — once with the cache warm, once with it flushed before every call — and the stacks
 *    must be the same entries with `Object.is` counts;
 *  - **plan level**: `planCampaign`'s answer is the same JSON with the cache on and with it off
 *    (`sizerPoolCache(1)`, so one binary serves both arms).
 *
 * Within one instance the caps and the capacity do not move across a plan's calls, so a key that forgot them
 * would pass both; the guard for that is `plan-kernel.test.ts`' seeded `sizeStacks` cases (random subsets and
 * caps against the TypeScript), which goes red on a key without the caps (checked 2026-10-11: 19 red).
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planKernel, setKernel } from '@/engine/fast';
import type { CampaignInput, Effective, SizerMethod } from '@/engine/plan';
import { planCampaign } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';

import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

const real = createPlanKernel(loadKernelModule());
const initial = planKernel();
afterEach(() => setKernel(initial));

interface CacheExports {
  sizerPoolCache(mode: number): void;
  sizerPoolCacheFlush(): void;
}

/**
 * Every kernel instance the file makes (one a bound request), so the cache's switch and flush reach them all;
 * an instance made later takes the mode in force.
 */
const OriginalInstance = WebAssembly.Instance;
const instances: WeakRef<CacheExports>[] = [];
let mode = 0;
class Captured extends OriginalInstance {
  constructor(module: WebAssembly.Module, imports?: WebAssembly.Imports) {
    super(module, imports);
    const raw = this.exports as unknown as CacheExports;
    raw.sizerPoolCache(mode);
    instances.push(new WeakRef(raw));
  }
}
(WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = Captured;
afterAll(() => {
  (WebAssembly as { Instance: typeof WebAssembly.Instance }).Instance = OriginalInstance;
});

const each = (run: (raw: CacheExports) => void): void => {
  for (const ref of instances) {
    const raw = ref.deref();
    if (raw !== undefined) run(raw);
  }
};
/** 0 answers pool 0 through the cache, 1 by `sizePool` every time. */
const setCache = (next: number): void => {
  mode = next;
  each((raw) => raw.sizerPoolCache(next));
};
const flush = (): void => each((raw) => raw.sizerPoolCacheFlush());

/** Recorded calls compared per plan at most (an even sample past it). */
const PER_PLAN = 1_500;

type Stacks = { entry: Effective; count: number }[];
interface Call {
  request: StackRequest;
  byId: Map<string, Effective>;
  mercs: Stacks;
  method: SizerMethod;
  troopIds: ReadonlySet<string> | undefined;
}

function sameStacks(a: Stacks, b: Stacks): string | null {
  if (a.length !== b.length) return `${String(a.length)} stacks against ${String(b.length)}`;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] as Stacks[number];
    const y = b[i] as Stacks[number];
    if (x.entry !== y.entry) return `stack ${String(i)}: ${x.entry.id} against ${y.entry.id}`;
    if (!Object.is(x.count, y.count))
      return `stack ${String(i)} ${x.entry.id}: ${x.count} against ${y.count}`;
  }
  return null;
}

/** One plan's sizer calls, recorded through the real door. */
function recordCalls(input: CampaignInput): Call[] {
  const calls: Call[] = [];
  setKernel({
    ...real,
    sizerShape: (request, byId, mercs, method, troopIds) => {
      calls.push({
        request,
        byId: byId as Map<string, Effective>,
        mercs: mercs.map((merc) => ({ entry: merc.entry, count: merc.count })),
        method,
        troopIds,
      });
      return real.sizerShape(request, byId, mercs, method, troopIds);
    },
  });
  try {
    planCampaign(input);
  } catch {
    // An army with no feasible plan still asked its sizer first.
  }
  setKernel(initial);
  return calls;
}

/** The plan as JSON, its clock readings (`retype.ms`) left out: everything else must be the same. */
const answerOf = (input: CampaignInput): string => {
  try {
    const plan = planCampaign(input);
    return JSON.stringify(plan, (key, value: unknown) => (key === 'ms' ? undefined : value));
  } catch (error) {
    return `throws ${(error as Error).message}`;
  }
};

function probeSettings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const settings = { ...buildPlanRequest(profile, setup) };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

const ACCOUNT = 'pyrrhic-my-account-2026-10-07.json';
function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

const owner = ownerProfile();
const account = accountProfile();
const cases: { label: string; input: CampaignInput }[] = [
  ...[...commonScenarios(), ...(owner ? ownerScenarios(owner) : [])].map((scenario) => ({
    label: scenario.label,
    input: {
      request: scenario.request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    },
  })),
  ...(owner ? [{ label: 'exactness fixture (2026-09-17)', input: probeSettings(owner) }] : []),
  ...(account ? [{ label: 'timing fixture (2026-10-07)', input: probeSettings(account) }] : []),
];

describe('the troop-pool cache (W20 C1)', () => {
  it.each(cases)(
    '$label: every sizer call answers as it does with the cache flushed',
    ({ input }) => {
      setCache(0);
      const calls = recordCalls(input);
      const step = Math.max(1, Math.ceil(calls.length / PER_PLAN));
      const sampled: Call[] = [];
      for (let c = 0; c < calls.length; c += step) sampled.push(calls[c] as Call);
      const ask = (call: Call) =>
        real.sizerShape(call.request, call.byId, call.mercs, call.method, call.troopIds);
      // Warm: the calls in the order asked, the cache filling as it goes.
      flush();
      const warm = sampled.map(ask);
      // Cold: the cache flushed before every call.
      const cold = sampled.map((call) => {
        flush();
        return ask(call);
      });
      sampled.forEach((call, c) => {
        const a = warm[c];
        const b = cold[c];
        expect(a, `call ${String(c)} declined`).not.toBeNull();
        expect(b, `call ${String(c)} declined`).not.toBeNull();
        if (a === null || a === undefined || b === null || b === undefined) return;
        const where = sameStacks(a.rungs, b.rungs) ?? sameStacks(a.mercs, b.mercs);
        expect(
          where,
          `call ${String(c)} (${call.method}, ${call.troopIds?.size ?? 'all'} troop types)`,
        ).toBeNull();
      });
    },
    300_000,
  );

  it.each(cases)(
    '$label: the plan is the same with the cache on and off',
    ({ input }) => {
      setCache(1);
      const off = answerOf(input);
      setCache(0);
      const on = answerOf(input);
      expect(on).toBe(off);
    },
    300_000,
  );
});
