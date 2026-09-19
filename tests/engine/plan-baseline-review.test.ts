/**
 * **S-100 — the review report, tested on a bar small enough to read by hand.**
 *
 * The owner, 2026-09-19: *"the baseline is hard to review; we need a report generation to generate a report
 * from the baseline to help the review."* `scripts/plan-baseline-review.ts` renders that page, and what has
 * to hold for it to be worth reading is not its prose but its **verdicts**: that a reading which moved the
 * wrong way is marked ▼ and reaches the *Trades to judge* list, that one which moved the right way is ▲ and
 * reaches *Rises*, that a stop the proposal no longer offers is named as lost rather than quietly dropped,
 * and that a cost is read in its own direction — more silver is worse even though the number went up.
 *
 * Two armies are built by hand below, ten lines each, holding exactly one of each case; the assertions read
 * the rendered Markdown, because the Markdown is the artefact the owner reviews. The last case renders the
 * real proposal against snapshot 16 — 12 scenarios, 28 campaigns — and asks only that it comes back whole:
 * the figures there are the engine's and move story by story, so pinning any of them here would be pinning
 * the benchmark twice.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import type { Side, SideScenario, SideTotals } from '../../scripts/plan-baseline-review.ts';
import {
  loadSide,
  renderReview,
  renderStages,
  sideFromBaseline,
  stageOf,
  verdictOf,
} from '../../scripts/plan-baseline-review.ts';

const totals = (over: Partial<SideTotals> = {}): SideTotals => ({
  marches: 4,
  damage: 10_000_000,
  silver: 5_000_000,
  gold: 100,
  seconds: 400_000,
  burned: 40,
  perSilver: 2,
  perHired: 250_000,
  soldiersLost: 30,
  monstersLost: 10,
  dragonCoins: 500,
  perSoldier: 333_333,
  perMonster: 1_000_000,
  ...over,
});

const scenario = (over: Partial<SideScenario> = {}): SideScenario => ({
  stops: { 'sweet-spot': totals() },
  plan: totals(),
  ratios: { bestSizer: 1, externals: { 'TotalStack · Total Optimization': 1 } },
  ...over,
});

const side = (kind: Side['kind'], scenarios: Record<string, SideScenario>): Side => ({
  path: `/tmp/${kind}.json`,
  kind,
  registeredBy: kind === 'baseline' ? 'Rémi' : null,
  registeredAt: kind === 'baseline' ? '2026-09-19' : null,
  reading: 'worst-opening',
  readingKnown: true,
  note: `a ${kind}`,
  run: null,
  scenarios,
  fromRows: false,
});

const ARMY = 'a two-stop army';
const OTHER = 'a one-stop army';

/** The registered side: two stops on one army, one stop on the other. */
const FROM = side('baseline', {
  [ARMY]: scenario({
    stops: { 'sweet-spot': totals(), 'steady-max': totals({ damage: 12_000_000, burned: 60 }) },
  }),
  [OTHER]: scenario(),
});

/**
 * The proposal: damage up on the sweet spot (a rise) for more silver (a fall), the `steady-max` gone (a stop
 * lost), an `all-in` offered that was not there (a stop gained), and the standing against the captured
 * answer down from 1.0 to 0.9 (a standing change).
 */
const TO = side('proposal', {
  [ARMY]: scenario({
    stops: {
      'sweet-spot': totals({ damage: 11_000_000, silver: 6_000_000, perSilver: 1.8333333 }),
      'all-in': totals({ damage: 13_000_000, burned: 80 }),
    },
    ratios: { bestSizer: 1, externals: { 'TotalStack · Total Optimization': 0.9 } },
  }),
  [OTHER]: scenario(),
});

const REPORT = renderReview(FROM, TO);
/** The lines of one section, from its heading to the next one. */
function section(report: string, heading: string): string {
  const lines = report.split('\n');
  const start = lines.indexOf(heading);
  expect(start, `no ${heading} section`).toBeGreaterThanOrEqual(0);
  const after = lines.slice(start + 1);
  const end = after.findIndex((line) => line.startsWith('## '));
  return (end === -1 ? after : after.slice(0, end)).join('\n');
}

describe('the baseline review report', () => {
  it('reads a cost in its own direction: more damage is a rise, more silver a fall', () => {
    expect(REPORT).toContain('| damage | 10,000,000 | 11,000,000 | +1,000,000 | +10.0 % | ▲ |');
    expect(REPORT).toContain('| silver | 5,000,000 | 6,000,000 | +1,000,000 | +20.0 % | ▼ |');
    // The two ratios that did not move at all, and the one that did.
    expect(REPORT).toContain('| damage a silver | 2.0000 | 1.8333 | -0.1667 | -8.3 % | ▼ |');
    expect(REPORT).toContain('| hired burned | 40 | 40 | 0 | 0.0 % | = |');
  });

  it('names the stop the bar lost and the stop it gained', () => {
    expect(REPORT).toContain('**lost `steady-max`**');
    expect(REPORT).toContain('**gained `all-in`**');
    // A lost stop leads the trades; a gained one leads the rises.
    expect(section(REPORT, '## Trades to judge')).toContain('**a two-stop army** — `steady-max`:');
    expect(section(REPORT, '## Rises')).toContain('**a two-stop army** — `all-in`:');
  });

  it('reads the standing against a captured answer, and lists its fall as a trade', () => {
    expect(REPORT).toContain(
      '| vs TotalStack · Total Optimization | 1.0000 | 0.9000 | -0.1000 | -10.0 % | ▼ |',
    );
    expect(section(REPORT, '## Trades to judge')).toContain('standing vs TotalStack · Total Optimization');
  });

  it('puts every fall in Trades and every rise in Rises, largest first', () => {
    const trades = section(REPORT, '## Trades to judge');
    const rises = section(REPORT, '## Rises');
    // Ordered by the share of the figure it started from: silver +20 % before the standing's -10 %.
    expect(trades.indexOf('| silver |')).toBeLessThan(trades.indexOf('standing vs TotalStack'));
    // The sweet spot's damage rose, so it is a rise and is nowhere in the trades.
    expect(trades).not.toContain('| `sweet-spot` | damage |');
    expect(rises).toContain('| `sweet-spot` | damage |');
    // The army that did not move contributes nothing to either list.
    expect(trades).not.toContain(OTHER);
    expect(rises).not.toContain(OTHER);
  });

  it('counts the readings it judged in its first line, and says where each file came from', () => {
    const summary = REPORT.split('\n')[2] ?? '';
    expect(summary).toContain('2 scenarios');
    expect(summary).toContain('1 stop lost · 1 stop gained');
    expect(summary).toContain('reading: worst-opening');
    expect(REPORT).toContain('registered by **Rémi** on 2026-09-19');
    expect(REPORT).toContain('a **proposal**, not a baseline');
  });

  it('warns when the two sides are not on the same reading', () => {
    const older = { ...FROM, reading: 'average damage', readingKnown: false };
    expect(renderReview(older, TO)).toContain('**The two sides are on different readings');
    expect(REPORT).not.toContain('**The two sides are on different readings');
  });

  it('warns when the two campaigns are not the same length', () => {
    const shorter = side('snapshot', {
      [ARMY]: scenario({ stops: { 'sweet-spot': totals({ marches: 1 }) } }),
    });
    expect(renderReview(shorter, TO)).toContain(
      '**Not the same campaign length** — *from* is priced over 1 march',
    );
  });

  it('marks a reading one side does not carry as not comparable', () => {
    const bare = totals();
    delete bare.dragonCoins;
    const without = side('snapshot', { [ARMY]: scenario({ stops: { 'sweet-spot': bare } }) });
    const report = renderReview(without, TO);
    expect(report).toContain('| dragon coins | — | 500 | — | — | · |');
  });
});

describe('the stage history', () => {
  it('orders the snapshots by their story number and marks each move against the row above', () => {
    expect(stageOf('benchmark-2026-09-18-06-shelter-all-types.json')).toEqual({
      index: 6,
      suffix: '',
      date: '2026-09-18',
      slug: 'shelter-all-types',
    });
    expect(stageOf('benchmark-latest.json')).toBeNull();
    const stages = renderStages(
      [
        { label: '1 one', side: FROM },
        { label: '2 two', side: TO },
      ],
      null,
    );
    expect(stages).toContain('| 1 one | 2 | + 10,000,000 | + 12,000,000 | — | + 1.0000 |');
    expect(stages).toContain('| 2 two | 2 | ▲ 11,000,000 | — | + 13,000,000 | = 1.0000 |');
  });
});

describe('the real proposal', () => {
  const SNAPSHOT = fileURLToPath(
    new URL('../../tools/theorycraft/out/benchmark-2026-09-19-16-rare-stock-readings.json', import.meta.url),
  );
  const PROPOSAL = fileURLToPath(new URL('./plan-baseline.proposed.json', import.meta.url));

  it('renders against snapshot 16 without throwing, one section a scenario', () => {
    const from = loadSide(SNAPSHOT);
    const to = loadSide(PROPOSAL);
    const report = renderReview(from, to);
    expect(report.startsWith('# The baseline, reviewed')).toBe(true);
    for (const label of Object.keys(to.scenarios)) expect(report).toContain(`## ${label}`);
    // Snapshot 16 and the proposal are the same bar read twice, so nothing of the sort the owner has to
    // judge is in it; the assertion is that the page is whole, not that the two agree.
    expect(report).toContain('## Trades to judge');
    expect(report).toContain('## Rises');
    expect(report.split('\n').length).toBeGreaterThan(100);
  });

  it('reads a proposal file as a proposal and never as a baseline', () => {
    const parsed = JSON.parse(readFileSync(PROPOSAL, 'utf8')) as Parameters<typeof sideFromBaseline>[1];
    expect(sideFromBaseline(PROPOSAL, parsed).kind).toBe('proposal');
    expect(sideFromBaseline(PROPOSAL, { ...parsed, registeredBy: 'Rémi' }).kind).toBe('baseline');
  });

  it('reads a cost and a ratio in opposite directions', () => {
    expect(verdictOf(10, 11, 'higher')).toBe('▲');
    expect(verdictOf(10, 11, 'lower')).toBe('▼');
    expect(verdictOf(10, 10, 'higher')).toBe('=');
    expect(verdictOf(1.2345678901, 1.2345678902, 'higher')).toBe('=');
  });
});
