/**
 * `pnpm bench:baseline` — run the benchmark and **propose** a baseline for the owner to register.
 *
 * The rule this exists for (owner, 2026-09-19): *"the benchmark is like non-regression tests. A given
 * scenario should not be worse, or it's a discrepancy, or a new baseline needs to be registered by me if the
 * trade is ok."* So nothing in the repo may re-base the benchmark by itself. This task reads the figures the
 * benchmark just measured (`tools/theorycraft/out/benchmark-latest.json`) and writes them to
 * **`tests/engine/plan-baseline.proposed.json`**, with `registeredBy: null`.
 *
 * A proposal is not a baseline. Nothing reads a file whose `registeredBy` is null, wherever it sits
 * (`tests/engine/plan-baseline.ts`). To register one, the owner reads the proposal, satisfies himself that
 * the trade is worth it, sets `registeredBy` to his own name and `registeredAt` to the date, and renames the
 * file to `tests/engine/plan-baseline.json`. From that run on, every stop of every scenario in it is held:
 * damage not lower, silver not higher, the stock burned not higher, both ratios not lower, no stop lost.
 *
 * The task **refuses to overwrite a registered baseline**: it only ever writes the `.proposed.json` name.
 *
 * It does not run the benchmark itself — `package.json` runs that first, so the figures are this tree's.
 * Run the two by hand instead if the owner's export is somewhere unusual:
 *
 * ```
 * pnpm vitest run tests/engine/plan-benchmark.test.ts
 * node scripts/plan-baseline.ts
 * ```
 *
 * **The two steps are chained with `;` and not with `&&`, deliberately.** The moment a baseline is worth
 * proposing is exactly the moment the benchmark's hand pins are *red* — a change moved a scenario and the
 * owner has to judge the trade — and `&&` would refuse to write the proposal in that state, which is the
 * state S-94 ships in (four pins failing). Vitest still prints its own pass or fail above this task's
 * output; the exit code `pnpm bench:baseline` returns is this script's, and it says whether the proposal
 * was written.
 *
 * The file is written with **two-space indentation**, which is what Prettier formats JSON to: a generated
 * file has to pass `pnpm format:check` unchanged, and the committed proposal has to come back byte for byte
 * from a re-run.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { Baseline, BaselineScenario } from '../tests/engine/plan-baseline.ts';

const FIGURES = new URL('../tools/theorycraft/out/benchmark-latest.json', import.meta.url);
const PROPOSAL = new URL('../tests/engine/plan-baseline.proposed.json', import.meta.url);

interface RunScenario {
  label: string;
  refusal: string | null;
  baseline: BaselineScenario | null;
}

const figuresPath = fileURLToPath(FIGURES);
if (!existsSync(figuresPath)) {
  process.stderr.write(
    `bench:baseline: ${figuresPath} is not there — run \`pnpm vitest run tests/engine/plan-benchmark.test.ts\` first.\n`,
  );
  process.exit(1);
}

const run = JSON.parse(readFileSync(figuresPath, 'utf8')) as { run: string; scenarios: RunScenario[] };
const scenarios: Record<string, BaselineScenario> = {};
const refused: string[] = [];
for (const scenario of run.scenarios) {
  if (scenario.baseline === null) {
    refused.push(`${scenario.label} — ${scenario.refusal ?? 'no plan'}`);
    continue;
  }
  scenarios[scenario.label] = scenario.baseline;
}

const proposal: Baseline = {
  // Null is what makes this a proposal and not a baseline. The owner sets it.
  registeredBy: null,
  registeredAt: null,
  reading: 'worst-opening',
  note:
    'Proposed, not registered. Measured by `pnpm bench:baseline` from the benchmark run of ' +
    `${run.run}; every damage figure is a march's worst opening (the enemy-first journal, S-94). ` +
    'To register: read it, set `registeredBy` to your name and `registeredAt` to the date, and rename ' +
    'this file to `plan-baseline.json`.',
  scenarios,
};

writeFileSync(fileURLToPath(PROPOSAL), `${JSON.stringify(proposal, null, 2)}\n`);
process.stdout.write(
  `bench:baseline: proposed ${String(Object.keys(scenarios).length)} scenarios in ` +
    `tests/engine/plan-baseline.proposed.json (registeredBy: null — register it by hand).\n`,
);
for (const line of refused) process.stdout.write(`  not proposed: ${line}\n`);
