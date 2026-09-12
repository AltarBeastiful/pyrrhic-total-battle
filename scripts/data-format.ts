/**
 * `pnpm data:format` — rewrites every file in `src/data/tables/` in its canonical form.
 *
 * Run it after editing a table by hand: records are sorted by id, keys are put back in their fixed
 * order and the file is formatted with the repository's Prettier settings, so the pull request shows
 * only the values you changed.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { TABLES_DIR, inspectAllTables } from './data-tables.ts';

const reports = await inspectAllTables();
const changed: string[] = [];

for (const report of reports) {
  if (report.canonical === report.text) continue;
  await writeFile(path.join(TABLES_DIR, report.file), report.canonical, 'utf8');
  changed.push(report.file);
}

const problems = reports.flatMap((report) => report.issues);
if (problems.length > 0) {
  process.stderr.write(
    `Formatted, but the tables do not match the schema:\n${problems.map((line) => `  ${line}`).join('\n')}\n`,
  );
}

process.stdout.write(
  changed.length === 0
    ? `data:format — ${reports.length} tables already canonical\n`
    : `data:format — rewrote ${changed.length} of ${reports.length} tables:\n${changed
        .map((file) => `  src/data/tables/${file}`)
        .join('\n')}\n`,
);

process.exit(problems.length > 0 ? 1 : 0);
