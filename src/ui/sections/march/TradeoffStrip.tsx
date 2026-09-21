/**
 * What the objective actually bought (design rule 29; investigation 0013 §5, which is the brief this
 * file was rewritten against).
 *
 * The old strip printed seven figures of the winning selection against the all-types army. On the
 * owner's own army that was **seven zeroes**: he has already hand-trimmed his troops to the set the
 * search would pick, so the search drops nothing and every delta is 0 — a block of noise that reads
 * as "choosing an objective changes nothing". 0013 §5 asks for three behaviours instead, and this is
 * the whole component:
 *
 * 1. **Nothing dropped** → one sentence. "Highest average damage keeps every type — none can be left
 *    at home without losing damage." No strip, because there is no trade to show.
 * 2. **Unmeasurable** → one sentence. A march that spends no dragon coins cannot be ranked by damage
 *    per dragon coin: nothing was compared and the winner is the plain march, so the strip would be
 *    presenting an accident as a choice.
 * 3. **Otherwise** → the objectives **side by side**: one row each, the four figures every objective
 *    can be read on — worst opening, expected damage, silver, gold — so the choice is a comparison
 *    and not a claim. The rows are computed by running the other objectives on the same request
 *    after the main run (`objectiveCompare.ts`): cancellable, and cached for as long as the march on
 *    screen is the one they explain.
 *
 * Choosing a row is choosing the objective: it writes the setup and generates again, which is rule
 * 29's second half — the alternatives are offered *beside the answer*, not back in a form.
 */
import { Button, Group, Stack, Table, Text } from '@mantine/core';

import type { Objective } from '@/engine/types';
import { selectActiveSetup, useStore } from '@/state/store';
import { Glyph } from '@/ui/domain';
import { OBJECTIVE_CHOICES } from '@/ui/sections/battle/choices';

import { compact } from './format';
import { runGenerate } from './generate';
import classes from './march.module.css';
import { isUnmeasurable, useObjectiveComparison, type ObjectiveRow } from './objectiveCompare';
import type { SearchTradeoff } from './runStore';
import { useMarch } from './useMarch';

/** What the bar calls each objective; one glossary, so the strip and the bar never disagree. */
const TITLE = new Map(OBJECTIVE_CHOICES.map((choice) => [choice.value, choice.title]));

const objectiveTitle = (objective: Objective): string => TITLE.get(objective) ?? objective;

/** The four columns, in the order 0013 §5.3 writes them. */
const COLUMNS = [
  { key: 'minDamage', label: 'Worst' },
  { key: 'avgDamage', label: 'Expected' },
  { key: 'silver', label: 'Silver' },
  { key: 'gold', label: 'Gold' },
] as const;

/** What a ratio objective divides by, in the words the sentence needs. */
const COST_WORD: Partial<Record<Objective, string>> = {
  damagePerSilver: 'silver',
  damagePerGold: 'gold',
  damagePerDragonCoin: 'dragon coins',
};

export interface TradeoffStripProps {
  tradeoff: SearchTradeoff;
}

export function TradeoffStrip({ tradeoff }: TradeoffStripProps) {
  const setup = useStore(selectActiveSetup);
  const { snapshot } = useMarch();
  const dropped = tradeoff.excludedUnitIds.length;
  const unmeasurable = isUnmeasurable(tradeoff.objective, tradeoff.baseline);
  // The comparison is the third behaviour only: the two sentences are complete answers on their own,
  // and five searches to say what one line already says would be five searches wasted.
  const wanted = !unmeasurable && dropped > 0;
  const fingerprint =
    snapshot === null ? '' : `${snapshot.profileId}:${snapshot.setupId}:${String(snapshot.at)}`;
  const comparison = useObjectiveComparison(snapshot?.request ?? null, fingerprint, wanted);

  const choose = (objective: Objective): void => {
    useStore.getState().updateActiveSetup({ priority: objective });
    void runGenerate();
  };

  if (unmeasurable) {
    return (
      <Sentence>
        {`This march costs no ${COST_WORD[tradeoff.objective] ?? 'of what this objective divides by'}, so “${objectiveTitle(
          tradeoff.objective,
        )}” cannot be compared: nothing was ranked, and what is on screen is the plain march.`}
      </Sentence>
    );
  }

  if (dropped === 0) {
    return (
      <Sentence>
        {`“${objectiveTitle(
          tradeoff.objective,
        )}” keeps every type: none of them can be left at home without losing damage.`}
      </Sentence>
    );
  }

  return (
    <Stack gap="sm">
      <Group justify="space-between" wrap="nowrap" gap="sm">
        <Text component="h3" fz="0.9375rem" fw={600}>
          Objectives compared
        </Text>
        <Text span className={classes.meta} c="dimmed">
          {`${String(dropped)} ${dropped === 1 ? 'type' : 'types'} left at home`}
        </Text>
      </Group>

      {comparison.running && (
        <Group gap="sm" wrap="nowrap">
          <Text span size="sm" c="dimmed" role="status">
            Running the other objectives on this army…
          </Text>
          <Button size="compact-xs" variant="default" onClick={comparison.cancel}>
            Cancel
          </Button>
        </Group>
      )}

      {comparison.error !== null && (
        <Group gap="sm" wrap="nowrap">
          <Text span size="sm" c="dimmed">
            {comparison.error}
          </Text>
          <Button size="compact-xs" variant="default" onClick={comparison.run}>
            Try again
          </Button>
        </Group>
      )}

      {comparison.rows !== null && (
        <div className={classes.compareScroll}>
          <Table
            className={classes.compare}
            horizontalSpacing={6}
            verticalSpacing={6}
            aria-label="Every objective on this army"
          >
            <Table.Thead>
              <Table.Tr>
                <Table.Th scope="col">Objective</Table.Th>
                {COLUMNS.map((column) => (
                  <Table.Th key={column.key} scope="col" ta="end">
                    {column.label}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {comparison.rows.map((row) => (
                <Row
                  key={row.objective}
                  row={row}
                  current={row.objective === setup?.priority}
                  onChoose={() => {
                    choose(row.objective);
                  }}
                />
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </Stack>
  );
}

/**
 * One objective. The name is the control — pressing it makes that objective the march's and
 * generates again — and the row the search is answering right now says so in words as well as with
 * the mark, because colour is never the only signal (design rule 24).
 */
function Row({ row, current, onChoose }: { row: ObjectiveRow; current: boolean; onChoose: () => void }) {
  const title = objectiveTitle(row.objective);
  return (
    <Table.Tr data-current={current ? 'true' : undefined} {...(current ? { 'aria-current': 'true' } : {})}>
      <Table.Th scope="row">
        <Button
          variant="subtle"
          size="compact-xs"
          px={4}
          className={classes.compareName}
          aria-label={current ? `${title}, this march’s objective` : `Generate with ${title}`}
          onClick={onChoose}
        >
          {current && <Glyph kind="pin" scale={0.75} />}
          {title}
        </Button>
      </Table.Th>
      {COLUMNS.map((column) => (
        <Table.Td key={column.key} ta="end">
          {row.unmeasurable ? '—' : compact(row[column.key])}
        </Table.Td>
      ))}
    </Table.Tr>
  );
}

/** The two cases that are answered in one line. Prose, not a box: there is nothing to compare. */
function Sentence({ children }: { children: string }) {
  return (
    <Text size="sm" c="dimmed">
      {children}
    </Text>
  );
}
