/**
 * **The "What to upgrade next" card** (W17 C4, `docs/plans/advisor-card.md`): the advisor's pass on a button,
 * its progress, Cancel, and the upgrades ranked on the stop the bar is showing.
 *
 * It is a **next-investment** card (owner, 2026-10-08): an upgrade takes time in the game, so what a row says
 * is what that upgrade would bring to the marches after it, never "change this march now". The words follow.
 *
 * Drawn from an `AdvisorView` (`useAdvisor`, `./advisorSearch`) handed in, so it renders the same in a test as
 * on the page; mounting it, and its visibility, are the March section's.
 *
 * Design rules (`docs/design-rules.md`): 1 (under the plan, never before it), 3–4 (idle until asked, the other
 * stops folded), 5 (only deltas, never the recap's figures), 15 (no per-cost line while no probe has a cost —
 * none of the generic probes does, so a typed upgrade with a cost is the only row that carries one, and the
 * ordering note shows only then; the cut note only when the cut fired),
 * 17 (no inner scroller), 18–19 (one column of two-line rows that fits 390 px), 20 and 22 (no new colour: dimmed
 * text, red only for a failure), 21 (game glyphs through `Glyph`), 23 (stock Mantine and the kit's
 * `Disclosure`), 24 (a gain is a sign and a word; the progress is `aria-live`), 26 (sentence case, our words),
 * 28 (the recap's compact notation, the exact figure on hover).
 */
import { Button, Group, Stack, Text } from '@mantine/core';

import { CAMPAIGN } from '@/config';
import {
  gainPerCost,
  headlineOf,
  rankAdvice,
  rankingOrder,
  type AdvisorRow,
  type StopAdvice,
} from '@/engine/advisor';
import type { PlanPick } from '@/engine/plan';
import { BONUS_KEY_GLYPHS, Glyph, isBonusKey, type GlyphKind } from '@/ui/domain';
import { Disclosure } from '@/ui/kit';

import { canAdvise, useAdvisor, type AdvisorView } from './advisorSearch';
import { amount, compactTwo, signedPercent } from './format';
import { planWords } from './picks';
import classes from './march.module.css';

export type AdvisorCardProps = Pick<
  AdvisorView,
  'status' | 'done' | 'total' | 'headline' | 'rows' | 'result' | 'error' | 'compute' | 'cancel'
>;

const SECONDS = Math.round(CAMPAIGN.budgets.extra / 1000);

/** The probe's own mark: the bonus key's glyph for a health or strength line, the pool's for housing, none for a typed upgrade. */
function glyphOf(row: Pick<AdvisorRow, 'id' | 'family'>): GlyphKind | null {
  // A typed upgrade's id is the player's, never a bonus key: it can change several lines at once.
  if (row.family === 'user') return null;
  const key = row.id.slice(row.id.indexOf(':') + 1);
  if (row.family === 'housing') {
    return key === 'leadership' || key === 'authority' || key === 'dominance' ? key : null;
  }
  return isBonusKey(key) ? BONUS_KEY_GLYPHS[key] : null;
}

/** The damage a march would reach after the upgrade: the reading the gain is taken from. */
function reachedDamage(stop: StopAdvice): number | null {
  const march = stop.from === 'replanned' ? stop.replanned : stop.from === 'repriced' ? stop.repriced : null;
  return march === null ? null : march.bill.damage;
}

/** A compact figure, with its digits on hover only where the notation rounded them (rule 28). */
function Figure({ value }: { value: number }) {
  const short = compactTwo(value);
  const exact = amount(value);
  return (
    <Text span inherit {...(short === exact ? {} : { title: exact })}>
      {short}
    </Text>
  );
}

/**
 * A gain at the tenth the card prints, and a positive one too small for it as "under 0.1%": `signedPercent`
 * rounds 0.04 % to "0%", which beside "worth" reads as no gain while the row still ranks above one.
 */
function gainWords(gain: number): string {
  return signedPercent(gain) === '0%' ? 'under 0.1%' : signedPercent(gain);
}

/**
 * **One upgrade, read on one stop.** Two lines: the upgrade and what it is worth on the owner's rating (the
 * yardstick the bar and Tight use), then the damage it would bring. A clamped or zero reading is "no gain" —
 * kept on the list, never a minus (`StopAdvice.gain` is never below 0). A `worse` re-plan adds a faint line
 * with the re-planned figure, so a search regression is reported rather than read as a fact of the game.
 */
function AdvisorRowLine({ row, stop }: { row: AdvisorRow; stop: StopAdvice }) {
  const glyph = glyphOf(row);
  const gains = stop.gain > 0;
  const reached = reachedDamage(stop);
  return (
    <Stack gap={0} data-testid="advisor-row">
      <Group justify="space-between" wrap="nowrap" gap="sm" align="baseline">
        <Group gap={6} wrap="nowrap" miw={0}>
          {glyph !== null && <Glyph kind={glyph} />}
          <Text size="sm">{row.label}</Text>
        </Group>
        {gains ? (
          <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
            {gainWords(stop.gain)} worth
          </Text>
        ) : (
          <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            no gain
          </Text>
        )}
      </Group>
      {gains && reached !== null && (
        <Text className={classes.meta} c="dimmed">
          {signedPercent(stop.damagePercent)} damage, <Figure value={reached} /> a march
        </Text>
      )}
      {row.cost !== undefined && (
        <Text className={classes.meta} c="dimmed" data-testid="advisor-per-cost">
          {gains ? `${gainWords(gainPerCost(row, stop.pick) ?? 0)} per ${row.cost.unit}, ` : ''}costs{' '}
          {amount(row.cost.amount)} {row.cost.unit}
        </Text>
      )}
      {stop.worse && stop.replanned !== null && (
        <Text className={classes.meta} c="dimmed">
          the plan gets worse here: search issue (re-planned <Figure value={stop.replanned.bill.damage} />)
        </Text>
      )}
    </Stack>
  );
}

/** Every row on one stop, ranked on it. */
function StopList({ rows, pick }: { rows: readonly AdvisorRow[]; pick: PlanPick | null }) {
  return (
    <Stack gap="xs">
      {rows.map((row) => {
        const stop = headlineOf(row, pick ?? undefined);
        return stop === undefined ? null : <AdvisorRowLine key={row.id} row={row} stop={stop} />;
      })}
    </Stack>
  );
}

/**
 * **The ordering, said** (`rankAdvice`): nothing while every row ranks by gain; with a cost typed, that the
 * costed upgrades come first by gain per cost, one group per unit, and the others after by gain.
 */
function orderingWords(rows: readonly AdvisorRow[]): string | null {
  const units = rankingOrder(rows);
  if (units.length === 0) return null;
  const per = units.map((unit) => `per ${unit}`).join(', then ');
  const rest = rows.some((row) => row.cost === undefined) ? '; the others after, by gain' : '';
  return `Upgrades with a cost first, by gain ${per}${rest}.`;
}

/** What the pass's state says, in one line, beside the button. */
function statusWords(status: AdvisorCardProps['status'], done: number, total: number): string | null {
  switch (status) {
    case 'running':
      return `${String(done)} / ${String(total)} done`;
    case 'cancelled':
      return `Cancelled at ${String(done)} / ${String(total)}`;
    default:
      return null;
  }
}

export function AdvisorCard({
  status,
  done,
  total,
  headline,
  rows,
  result,
  error,
  compute,
  cancel,
}: AdvisorCardProps) {
  const running = status === 'running';
  const words = statusWords(status, done, total);
  const ordering = orderingWords(rows);
  const read = result !== null && result.baseline !== null && rows.length > 0;
  // The bar's other stops, in its own order, each ranked on itself: a move of the bar needs no new pass.
  const others = (result?.baseline ?? []).map((stop) => stop.pick).filter((pick) => pick !== headline);
  const cutCount = result?.cut.length ?? 0;
  const failedCount = result?.failed.length ?? 0;

  return (
    <Stack gap="sm" aria-label="What to upgrade next" role="region">
      <Stack gap={2}>
        <Text size="sm" fw={500}>
          What to upgrade next
        </Text>
        <Text className={classes.meta} c="dimmed">
          What each upgrade would bring to your next marches
          {headline === null ? '' : `, read on the ${planWords({ pick: headline })} stop`}.
        </Text>
      </Stack>

      <Group gap="sm" wrap="nowrap">
        {running ? (
          <Button size="xs" variant="default" onClick={cancel}>
            Cancel
          </Button>
        ) : (
          <Button size="xs" variant="default" onClick={compute}>
            {result === null ? 'Compute' : 'Compute again'}
          </Button>
        )}
        <Text className={classes.meta} c="dimmed" aria-live="polite">
          {words ?? ''}
        </Text>
      </Group>

      {status === 'failed' && error !== null && (
        <Text size="sm" c="red">
          The upgrades could not be read: {error}
        </Text>
      )}

      {status === 'cut' && (
        <Text size="sm" c="dimmed">
          {result?.baseline === null
            ? `The ${String(SECONDS)} s cut stopped the pass before the current march was read.`
            : `The ${String(SECONDS)} s cut stopped ${String(cutCount)} upgrade${cutCount === 1 ? '' : 's'} before ${cutCount === 1 ? 'it' : 'they'} finished.`}
        </Text>
      )}

      {failedCount > 0 && (
        <Text size="sm" c="dimmed">
          {failedCount} upgrade{failedCount === 1 ? '' : 's'} could not be read.
        </Text>
      )}

      {read && (
        <>
          {ordering !== null && (
            <Text className={classes.meta} c="dimmed" data-testid="advisor-ordering">
              {ordering}
            </Text>
          )}
          <StopList rows={rows} pick={headline} />
          {others.length > 0 && (
            <Disclosure
              title="Other stops"
              summary={`${String(others.length)} stop${others.length === 1 ? '' : 's'}`}
            >
              <Stack gap="md">
                {others.map((pick) => (
                  <Stack key={pick} gap="xs">
                    <Text size="sm" fw={500}>
                      {planWords({ pick })}
                    </Text>
                    <StopList rows={rankAdvice(result.rows, pick)} pick={pick} />
                  </Stack>
                ))}
              </Stack>
            </Disclosure>
          )}
        </>
      )}
    </Stack>
  );
}

/**
 * **The card where the March section mounts it**, under the plan (part 4b, `MarchSection.tsx`). It goes by the
 * plan's own condition: no plan, no card — `null`, so `Sections` gives it no line (as `PlanFold` does). On a
 * platform with no `Worker` the pass would run 30 whole plans on the page's own thread, so the card says why
 * in one line instead of offering a button that freezes the page (design rule 15: one dimmed line, no block).
 */
export function AdvisorFold() {
  const view = useAdvisor();
  if (view.headline === null) return null;
  if (!canAdvise()) {
    return (
      <Text className={classes.meta} c="dimmed">
        What to upgrade next needs a browser that can compute in the background; this one cannot.
      </Text>
    );
  }
  return <AdvisorCard {...view} />;
}
