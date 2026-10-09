/**
 * **The "What to upgrade next" card** (W17 C4, `docs/plans/advisor-card.md`): the advisor's pass on a button,
 * its progress, Cancel, and the upgrades ranked on the stop the bar is showing.
 *
 * **Two buttons, two passes** (owner, 2026-10-08, Phase 04b): "Compute my upgrades" reads the typed list alone,
 * "Compute default upgrades" the 29 generic probes at their default increase. Each has its own progress,
 * Cancel, cut note, failure line and ranked list, under its own small heading shown once it has been computed.
 *
 * **Captains** (W17 C5) are a third pass beside the two, on a button of their own (`CaptainSection`,
 * `captainSearch.ts`): experiment 193 put the pass over the 20 s cut when run together with the others. It lists
 * the best trio per stop and the next star or level of each captain; only with a captain owned (rule 15).
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
 * 28 (the recap's compact notation, the exact figure on hover). Rule 15 again for the two buttons: "my
 * upgrades" with nothing typed is disabled beside the one dimmed line that says why, and a heading appears
 * only once its list does. The march cost under each gain (`MarchCost`) answers to rules 5, 15, 19, 20–24,
 * 26 and 28 too: a change and never the recap's bill, no line where nothing shows, the purses' glyphs in stock
 * Mantine text, a saving said by a word.
 */
import { Button, Group, Stack, Text } from '@mantine/core';
import { Fragment, type ReactNode } from 'react';

import { CAMPAIGN } from '@/config';
import {
  costChange,
  gainPerCost,
  gainReading,
  headlineOf,
  outstandingSeconds,
  rankAdvice,
  rankingOrder,
  type AdvisorRow,
  type StopAdvice,
} from '@/engine/advisor';
import type { PlanPick } from '@/engine/plan';
import { PROBE_BONUS_DELTA, PROBE_HOUSING_PERCENT } from '@/engine/probes';
import { DEFAULT_TABLES } from '@/state/derive';
import { BONUS_KEY_GLYPHS, Glyph, isBonusKey, type GlyphKind } from '@/ui/domain';
import { Disclosure } from '@/ui/kit';
import type { TrioStopAdvice } from '@/worker/captainAdvice';

import { canAdvise, useAdvisor, type AdvisorKindView, type AdvisorView } from './advisorSearch';
import { useCaptainAdvice, type CaptainView } from './captainSearch';
import { amount, compactTwo, delta, duration, signedPercent } from './format';
import { planWords } from './picks';
import { TypedUpgrades } from './TypedUpgrades';
import classes from './march.module.css';

export type AdvisorCardProps = Pick<AdvisorView, 'headline' | 'typed' | 'mine' | 'default'> & {
  /** The player's own upgrades and their form (`TypedUpgrades`), read by the "my upgrades" pass. */
  upgrades?: ReactNode;
  /** The captain section (`captainSearch.ts`): the best trio and the next star; left out, the card has none. */
  captains?: CaptainView;
};

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
  return gainReading(stop)?.bill.damage ?? null;
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

/** One figure of the march cost: a purse or the queue, by how much it moves, and which way. */
interface CostFigure {
  kind: 'silver' | 'gold' | 'time';
  /** The size of the change as the line prints it: the recap's notation for a purse, the queue's own shape. */
  short: string;
  /** The change in full and signed, for the hover. */
  exact: string;
  word: string;
  /** The march costs more of it; otherwise the upgrade saves some. */
  rises: boolean;
}

const PURSES = ['silver', 'gold'] as const;

/**
 * **What the upgrade changes in the march's bill**, figure by figure, off the reading the gain is
 * (`costChange`): silver and gold where the change shows in the recap's notation, the training queue only where
 * it is outstanding (`outstandingSeconds`, the owner's bound in `CAMPAIGN.outstandingTraining`). Empty with no
 * gain, and where every figure rounds away: the card then prints no line at all, never "same cost" (rule 15).
 */
function costFigures(stop: StopAdvice): CostFigure[] {
  const change = costChange(stop);
  if (change === null) return [];
  const figures: CostFigure[] = [];
  for (const kind of PURSES) {
    const value = change[kind];
    const short = compactTwo(Math.abs(value));
    if (short !== '0') {
      figures.push({ kind, short, exact: `${delta(value)} ${kind}`, word: kind, rises: value > 0 });
    }
  }
  const seconds = outstandingSeconds(stop.current.bill, change);
  if (seconds !== null) {
    // The queue's own shape is already its full figure (`duration`), so the hover repeats it with its sign.
    const short = duration(Math.abs(seconds));
    figures.push({
      kind: 'time',
      short,
      exact: `${seconds > 0 ? '+' : '-'}${short} training`,
      word: 'training',
      rises: seconds > 0,
    });
  }
  return figures;
}

/**
 * **What the upgrade costs the march** (Phase 04b; owner, 2026-10-08: damage alone is not enough, each row
 * shows *"silver, gold, and the training time only when it is outstanding"*). One dimmed line under the damage,
 * read off the same march, so the gain, the damage and the cost a row prints are one reading. What rises follows
 * "costs" with its plus, what falls follows "saves": a word, never a colour (rules 20, 24). Each figure wears
 * its purse's glyph as the recap draws it (rule 21), and the two never part where the line wraps at 390 px
 * (rule 19). The hover gives the figures in full (rule 28) and names them the **march cost**, so a
 * typed upgrade's own price — "costs 4 talent points", on the line under this one — is never read as it.
 * Display only: no rating or ranking reads it.
 */
function MarchCost({ stop }: { stop: StopAdvice }) {
  const figures = costFigures(stop);
  if (figures.length === 0) return null;
  const groups = [
    { verb: 'costs', sign: '+', figures: figures.filter((figure) => figure.rises) },
    { verb: 'saves', sign: '', figures: figures.filter((figure) => !figure.rises) },
  ].filter((group) => group.figures.length > 0);
  return (
    <Text
      className={classes.meta}
      c="dimmed"
      data-testid="advisor-march-cost"
      title={`March cost: ${figures.map((figure) => figure.exact).join(', ')}`}
    >
      {groups.map((group, index) => (
        <Fragment key={group.verb}>
          {index > 0 ? '; ' : ''}
          {`${group.verb} `}
          {group.figures.map((figure, at) => (
            <Fragment key={figure.kind}>
              {at > 0 ? ', ' : ''}
              <Text span inherit style={{ whiteSpace: 'nowrap' }}>
                <Glyph kind={figure.kind} /> {`${group.sign}${figure.short} ${figure.word}`}
              </Text>
            </Fragment>
          ))}
        </Fragment>
      ))}
    </Text>
  );
}

/**
 * **One upgrade, read on one stop.** Two lines: the upgrade and what it is worth on the owner's rating (the
 * yardstick the bar and Tight use), then the damage it would bring, and under it what it costs the march when
 * that moves (`MarchCost`). A clamped or zero reading is "no gain" — kept on the list, never a minus
 * (`StopAdvice.gain` is never below 0), and with no cost line. A `worse` re-plan adds a faint line with the
 * re-planned figure, so a search regression is reported rather than read as a fact of the game.
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
      <MarchCost stop={stop} />
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
function statusWords(status: AdvisorKindView['status'], done: number, total: number): string | null {
  switch (status) {
    case 'running':
      return `${String(done)} / ${String(total)} done`;
    case 'cancelled':
      return `Cancelled at ${String(done)} / ${String(total)}`;
    default:
      return null;
  }
}

/** What "default increase" means, from the probes' own constants (`src/engine/probes.ts`). */
const DEFAULT_INCREASE = `Default increase: +${String(PROBE_BONUS_DELTA)} point on a health or strength line, +${String(PROBE_HOUSING_PERCENT)}% of a housing pool.`;

interface PassSectionProps {
  /** The button's words. */
  compute: string;
  /** What the pass reads, for Cancel's name and the failure line. */
  noun: string;
  /** The list's heading, shown once the list is. */
  heading: string;
  view: AdvisorKindView;
  headline: PlanPick | null;
  /** Why the button is off, when it is: shown as the one dimmed line. */
  blocked?: string | undefined;
  /** A dimmed line saying what the pass reads. */
  note?: string | undefined;
  /** Whether this list states its ordering (a typed cost is the only thing that changes the order). */
  ordering?: boolean | undefined;
}

/** One pass: its button, progress, Cancel, notes and the list it ranked, with its heading once there is one. */
function PassSection({ compute, noun, heading, view, headline, blocked, note, ordering }: PassSectionProps) {
  const { status, done, total, rows, result, error } = view;
  const running = status === 'running';
  const words = statusWords(status, done, total);
  const orderingLine = ordering === true ? orderingWords(rows) : null;
  const read = result !== null && result.baseline !== null && rows.length > 0;
  // The bar's other stops, in its own order, each ranked on itself: a move of the bar needs no new pass.
  const others = (result?.baseline ?? []).map((stop) => stop.pick).filter((pick) => pick !== headline);
  const cutCount = result?.cut.length ?? 0;
  const failedCount = result?.failed.length ?? 0;

  return (
    <Stack gap="xs" data-testid={`advisor-pass-${noun}`}>
      <Group gap="sm" wrap="nowrap">
        {running ? (
          <Button size="xs" variant="default" onClick={view.cancel} aria-label={`Cancel ${noun}`}>
            Cancel
          </Button>
        ) : (
          <Button size="xs" variant="default" onClick={view.compute} disabled={blocked !== undefined}>
            {result === null ? compute : `${compute} again`}
          </Button>
        )}
        <Text className={classes.meta} c="dimmed" aria-live="polite">
          {words ?? ''}
        </Text>
      </Group>
      {blocked !== undefined && (
        <Text className={classes.meta} c="dimmed">
          {blocked}
        </Text>
      )}
      {note !== undefined && (
        <Text className={classes.meta} c="dimmed">
          {note}
        </Text>
      )}

      {status === 'failed' && error !== null && (
        <Text size="sm" c="red">
          The {noun} could not be read: {error}
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
          <Text size="sm" fw={500}>
            {heading}
          </Text>
          {orderingLine !== null && (
            <Text className={classes.meta} c="dimmed" data-testid="advisor-ordering">
              {orderingLine}
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

/** A trio's key (`aydae,beowulf,skadi`) in the captains' own names. */
function trioWords(key: string): string {
  return key
    .split(',')
    .map((id) => DEFAULT_TABLES.captains.find((record) => record.id === id)?.name ?? id)
    .join(', ');
}

/**
 * **The best trio on one stop of the bar**: the stop, what the trio is worth on the owner's rating, and under
 * it the captains with the damage they would bring. Where no trio gains the line says the march's own is the
 * best ("your captains"), never a loss: `bestPerStop` keeps the current trio on a gain of 0.
 */
function TrioLine({ stop }: { stop: TrioStopAdvice }) {
  const gains = stop.gain > 0 && stop.advice !== null;
  const reached = stop.advice === null ? null : reachedDamage(stop.advice);
  return (
    <Stack gap={0} data-testid="captain-trio">
      <Group justify="space-between" wrap="nowrap" gap="sm" align="baseline">
        <Text size="sm">{planWords({ pick: stop.pick })}</Text>
        {gains ? (
          <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
            {gainWords(stop.gain)} worth
          </Text>
        ) : (
          <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
            your captains
          </Text>
        )}
      </Group>
      <Text className={classes.meta} c="dimmed">
        {trioWords(stop.trio)}
        {gains && stop.advice !== null && reached !== null && (
          <>
            , {signedPercent(stop.advice.damagePercent)} damage, <Figure value={reached} /> a march
          </>
        )}
      </Text>
    </Stack>
  );
}

/**
 * **The captain section** (W17 C5): its own button and clock (experiment 193: the pass costs 3–6 s on its own
 * and over the 20 s cut beside the other two), its progress and Cancel, then the best trio per stop and the next
 * star or level of each captain, ranked on the stop the bar shows. The trio is a suggestion: the march keeps the
 * captains the player chose, and the line under the heading says so (rule 15: said once, only with a list).
 * Nothing at all with no captain owned.
 */
function CaptainSection({ view, headline }: { view: CaptainView; headline: PlanPick | null }) {
  const { status, done, total, result, rows, error } = view;
  if (view.owned === 0) return null;
  const running = status === 'running';
  const words = statusWords(status, done, total);
  const advice = result?.advice ?? null;
  const read = advice !== null && advice.baseline !== null;
  const cut = result?.upgrades?.cut.length ?? 0;
  const confirmedCut = advice?.cut.length ?? 0;
  const lead = result?.lead;
  const others = (advice?.baseline ?? []).map((stop) => stop.pick).filter((pick) => pick !== headline);
  const failed = (advice?.failed.length ?? 0) + (result?.upgrades?.failed.length ?? 0);

  return (
    <Stack gap="xs" data-testid="advisor-pass-captains">
      <Group gap="sm" wrap="nowrap">
        {running ? (
          <Button size="xs" variant="default" onClick={view.cancel} aria-label="Cancel captains">
            Cancel
          </Button>
        ) : (
          <Button size="xs" variant="default" onClick={view.compute}>
            {result === null ? 'Compute captains' : 'Compute captains again'}
          </Button>
        )}
        <Text className={classes.meta} c="dimmed" aria-live="polite">
          {words ?? ''}
        </Text>
      </Group>

      {status === 'failed' && error !== null && (
        <Text size="sm" c="red">
          The captains could not be read: {error}
        </Text>
      )}

      {status === 'cut' && (
        <Text size="sm" c="dimmed">
          {advice === null || advice.baseline === null
            ? `The ${String(SECONDS)} s cut stopped the pass before the current march was read.`
            : `The ${String(SECONDS)} s cut stopped the pass before it read everything${
                confirmedCut + cut > 0 ? ` (${String(confirmedCut + cut)} unfinished)` : ''
              }.`}
        </Text>
      )}

      {failed > 0 && (
        <Text size="sm" c="dimmed">
          {failed} trio{failed === 1 ? '' : 's'} or upgrade{failed === 1 ? '' : 's'} could not be read.
        </Text>
      )}

      {read && (
        <>
          <Text size="sm" fw={500}>
            Best captains
          </Text>
          <Text className={classes.meta} c="dimmed">
            A suggestion: your march keeps the captains you chose.
          </Text>
          <Stack gap="xs">
            {advice.best.map((stop) => (
              <TrioLine key={stop.pick} stop={stop} />
            ))}
          </Stack>
          {rows.length > 0 && result !== null && (
            <>
              <Text size="sm" fw={500}>
                Next captain upgrades
              </Text>
              {lead !== undefined && lead !== advice.currentKey && (
                <Text className={classes.meta} c="dimmed" data-testid="captain-lead">
                  Read with {trioWords(lead)}, the best trio.
                </Text>
              )}
              <StopList rows={rows} pick={headline} />
              {others.length > 0 && (
                <Disclosure
                  title="Other stops (captains)"
                  summary={`${String(others.length)} stop${others.length === 1 ? '' : 's'}`}
                >
                  <Stack gap="md">
                    {others.map((pick) => (
                      <Stack key={pick} gap="xs">
                        <Text size="sm" fw={500}>
                          {planWords({ pick })}
                        </Text>
                        <StopList rows={rankAdvice(rows, pick)} pick={pick} />
                      </Stack>
                    ))}
                  </Stack>
                </Disclosure>
              )}
            </>
          )}
        </>
      )}
    </Stack>
  );
}

export function AdvisorCard({
  headline,
  typed,
  mine,
  default: generic,
  upgrades,
  captains,
}: AdvisorCardProps) {
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

      {upgrades}

      <PassSection
        compute="Compute my upgrades"
        noun="my upgrades"
        heading="Your upgrades"
        view={mine}
        headline={headline}
        blocked={typed === 0 ? 'Type an upgrade first.' : undefined}
        ordering
      />
      <PassSection
        compute="Compute default upgrades"
        noun="default upgrades"
        heading="Default upgrades"
        view={generic}
        headline={headline}
        note={DEFAULT_INCREASE}
      />
      {captains !== undefined && <CaptainSection view={captains} headline={headline} />}
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
  const captains = useCaptainAdvice();
  if (view.headline === null) return null;
  if (!canAdvise()) {
    return (
      <Text className={classes.meta} c="dimmed">
        What to upgrade next needs a browser that can compute in the background; this one cannot.
      </Text>
    );
  }
  return <AdvisorCard {...view} captains={captains} upgrades={<TypedUpgrades />} />;
}
