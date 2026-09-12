/**
 * `pnpm data:check` — the gate a data pull request has to pass (ADR-0007).
 *
 * Every file in `src/data/tables/` must parse, match its zod schema and already be in canonical form.
 * Problems are printed as `file: record · field: what is wrong`, so a contributor who has never opened
 * the code can fix the JSON from the message alone. Cross-table integrity (ids, tiers, kill orders) is
 * checked by `src/data/data.test.ts`, which `pnpm test` runs.
 */
import { inspectAllTables } from './data-tables.ts';

const reports = await inspectAllTables();
const problems: string[] = [];

for (const report of reports) {
  problems.push(...report.issues);
  if (report.canonical !== report.text) {
    problems.push(
      `${report.file}: not in canonical form (key order, sorting or indentation) — run \`pnpm data:format\``,
    );
  }
}

if (problems.length > 0) {
  process.stderr.write(
    `data:check failed — ${problems.length} problem(s) in src/data/tables:\n${problems
      .map((line) => `  ${line}`)
      .join('\n')}\n`,
  );
  process.exit(1);
}

process.stdout.write(`data:check — ${reports.length} tables valid and canonical\n`);
