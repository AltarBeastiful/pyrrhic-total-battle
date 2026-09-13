/**
 * The campaign behind a "Complete optimization" (S-54, PLAN §5.1).
 *
 * A complete optimization does not answer "what is the best march"; it answers "what is the best
 * **plan**" — which sizing, and how many of your mercenaries to put in the field each time, over the
 * run of marches you said you would fight. The march itself is drawn exactly as every other march
 * is; what this file adds is the two things that would otherwise be invisible:
 *
 * - **one line under the figures** naming the sizing the search chose and how much it fields, because
 *   the march on screen is sized by a rule the player did not pick themselves (design rule 29: an
 *   answer says what it did);
 * - **a folded Campaign section** (design rule 4) with the campaign's own figures, the marches one by
 *   one, and the plans compared — the plan the answer came from marked.
 *
 * It replaces the objectives comparison for this method rather than joining it: that strip runs five
 * more searches to compare objectives on one battle, and a campaign has already compared twelve plans
 * over ten. Nothing here computes anything — `campaign.ts` does the arithmetic and the wording, and
 * the run store already holds the answer.
 */
import { Group, Stack, Table, Text } from '@mantine/core';

import { Glyph } from '@/ui/domain';
import { Disclosure, Figures } from '@/ui/kit';

import type { CampaignCompareRow, CampaignMarchRow } from './campaign';
import { compareRows, hiredTotals, marchCount, marchRows, sizingSentence } from './campaign';
import { amount, compact, ratio } from './format';
import classes from './march.module.css';
import { useRunStore } from './runStore';
import { useMarch } from './useMarch';

/**
 * What sized the march on screen, in one line. Under the figures, in the muted meta ink: it explains
 * an answer rather than being one, and it steps back with the rest of the answer when the setup has
 * moved (`.outOfDate`).
 */
export function CampaignSizing() {
  const campaign = useRunStore((state) => state.campaign);
  const { stale } = useMarch();
  if (campaign === null) return null;

  return (
    <Text size="sm" c="dimmed" className={stale ? classes.outOfDate : undefined}>
      {sizingSentence(campaign.winner)}
    </Text>
  );
}

/** The campaign, folded (design rule 4): figures, the marches, and the plans compared. */
export function CampaignFold() {
  const result = useRunStore((state) => state.campaign);
  const edited = useRunStore((state) => state.leftOutByPlayer.length > 0);
  if (result === null) return null;

  const { campaign } = result.winner;
  const hired = hiredTotals(campaign);
  const marches = marchRows(campaign);
  const rows = compareRows(result);

  return (
    <Disclosure
      title="Campaign"
      summary={`${marchCount(campaign.fought)} · ${compact(campaign.totalAvg)} damage`}
    >
      <Stack gap="md">
        {/* The campaign's own figures, in the one figure style (docs/design.md §4, line 7). Two
            columns, as everything in a 420 px pane is. */}
        <Figures
          label="This campaign in figures"
          layout="grid"
          items={[
            { key: 'marches', label: 'Marches fought', value: amount(campaign.fought) },
            {
              key: 'damage',
              label: 'Total expected damage',
              value: amount(campaign.totalAvg),
              glyph: <Glyph kind="averageDamage" />,
            },
            {
              key: 'silver',
              label: 'Total silver',
              value: amount(campaign.silver),
              glyph: <Glyph kind="silver" />,
            },
            { key: 'perSilver', label: 'Damage per silver', value: ratio(campaign.damagePerSilver) },
            { key: 'lost', label: 'Mercenaries lost', value: amount(hired.lost) },
            { key: 'left', label: 'Mercenaries left', value: amount(hired.remaining) },
          ]}
        />

        {/* The one thing a player would otherwise have to count for themselves: the campaign ran out
            of silver before it ran out of marches. */}
        {campaign.stoppedBy === 'silver' && (
          <Text size="sm" c="var(--mantine-color-brass-filled)">
            {campaign.fought === 0
              ? 'Your silver budget does not pay for a single march of this army. Raise it, or march with less.'
              : `Your silver budget pays for ${marchCount(campaign.fought)} of the ones you planned. The rest would have to wait.`}
          </Text>
        )}

        {edited && (
          <Text size="sm" c="dimmed">
            These totals belong to the march Generate found. Your own changes to it are not in them — generate
            again to plan on the army you are fielding now.
          </Text>
        )}

        <Stack gap="xs">
          <Text component="h3" size="sm" fw={600}>
            March by march
          </Text>
          {/* Wider than a 420 px pane at its widest, so it takes a scroller of its own — design
              rule 17 forbids a *pane* that scrolls apart from the page, not a table wider than its
              column (the objectives table has had one since 0013 §5.3). */}
          <div className={classes.compareScroll}>
            <Table
              className={classes.compare}
              horizontalSpacing={6}
              verticalSpacing={6}
              aria-label="Every march of this campaign"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th scope="col">March</Table.Th>
                  <Table.Th scope="col" ta="end">
                    Mercenaries
                  </Table.Th>
                  <Table.Th scope="col" ta="end">
                    Damage
                  </Table.Th>
                  <Table.Th scope="col" ta="end">
                    Silver so far
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {marches.map((march) => (
                  <MarchRow key={march.number} march={march} />
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Stack>

        <Stack gap="xs">
          <Text component="h3" size="sm" fw={600}>
            The plans compared
          </Text>
          <Text size="xs" c="dimmed">
            Damage and silver are the whole campaign’s; lost and left are your mercenaries.
          </Text>
          <div className={classes.compareScroll}>
            <Table
              className={classes.compare}
              horizontalSpacing={6}
              verticalSpacing={6}
              aria-label="Every plan this campaign was compared against"
            >
              <Table.Thead>
                <Table.Tr>
                  <Table.Th scope="col">Plan</Table.Th>
                  <Table.Th scope="col" ta="end">
                    Marches
                  </Table.Th>
                  <Table.Th scope="col" ta="end">
                    Damage
                  </Table.Th>
                  <Table.Th scope="col" ta="end">
                    Silver
                  </Table.Th>
                  <Table.Th scope="col" ta="end">
                    Lost
                  </Table.Th>
                  <Table.Th scope="col" ta="end">
                    Left
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row) => (
                  <CompareRow key={row.key} row={row} />
                ))}
              </Table.Tbody>
            </Table>
          </div>
        </Stack>
      </Stack>
    </Disclosure>
  );
}

function MarchRow({ march }: { march: CampaignMarchRow }) {
  return (
    <Table.Tr>
      <Table.Th scope="row">{amount(march.number)}</Table.Th>
      <Table.Td ta="end">{amount(march.hired)}</Table.Td>
      <Table.Td ta="end">{compact(march.damage)}</Table.Td>
      <Table.Td ta="end">{compact(march.silverSoFar)}</Table.Td>
    </Table.Tr>
  );
}

/**
 * One plan. The row the answer came from carries the mark, `aria-current` and a word in its own
 * cell's name, because colour is never the only signal (design rule 24).
 */
function CompareRow({ row }: { row: CampaignCompareRow }) {
  return (
    <Table.Tr
      data-current={row.winner ? 'true' : undefined}
      {...(row.winner ? { 'aria-current': 'true' } : {})}
    >
      {/* The plan names itself in two lines — the sizing, then how much of your camp it fields — so
          the five figures beside it fit the pane instead of being pushed off its edge. */}
      <Table.Th scope="row" className={classes.planCell}>
        <Group gap={4} wrap="nowrap" align="flex-start">
          {row.winner && <Glyph kind="pin" scale={0.75} label="This march" />}
          <Stack gap={0} miw={0}>
            <Text span inherit>
              {row.sizing}
            </Text>
            <Text span className={classes.meta} c="dimmed" fw={400}>
              {`${row.mercenaries} mercenaries`}
            </Text>
          </Stack>
        </Group>
      </Table.Th>
      <Table.Td ta="end">{amount(row.marches)}</Table.Td>
      <Table.Td ta="end">{compact(row.damage)}</Table.Td>
      <Table.Td ta="end">{compact(row.silver)}</Table.Td>
      <Table.Td ta="end">{amount(row.lost)}</Table.Td>
      <Table.Td ta="end">{amount(row.remaining)}</Table.Td>
    </Table.Tr>
  );
}
