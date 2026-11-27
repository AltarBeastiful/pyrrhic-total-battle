/**
 * B-46 — the match seam: the four rounds reported on 2026-11-27 replayed from the starting armies. Every turn
 * must come out as logged (who acts, on what, the living counts and the kills), and so must the round shares.
 */
import { describe, expect, it } from 'vitest';

import { primeArenaMatch } from '../../src/engine/primeArena';
import { REPORTS } from '../helpers/primeArenaReports';
import type { Label, ReportHit } from '../helpers/primeArenaReports';

const line = (h: Omit<ReportHit, 'damage' | 'double'>): string =>
  `${h.side} ${h.actor} ${String(h.actorCount)} > ${h.target} ${String(h.targetCount)} -${String(h.kills)}`;

describe.each(REPORTS)('the match $name', (report) => {
  const doubleTurns = report.rounds.map((hits) => hits.flatMap((h, i) => (h.double ? [i + 1] : [])));
  const match = primeArenaMatch(report.attacker.army, report.defender.army, {
    doubleTurns: [doubleTurns[0]!, doubleTurns[1]!],
  });
  const labels = { attacker: report.attacker.labels, defender: report.defender.labels };

  it.each([0, 1] as const)('round index %i: every turn as logged', (r) => {
    const round = match.rounds[r];
    // Living counts, followed from the starting armies through the kills.
    const living = {
      attacker: report.attacker.army.stacks.map((s) => s.count),
      defender: report.defender.army.stacks.map((s) => s.count),
    };
    const replayed = round.steps.map((step) => {
      const other = step.side === 'attacker' ? 'defender' : 'attacker';
      const turn = {
        side: step.side,
        actor: labels[step.side][step.stack] as Label,
        actorCount: living[step.side][step.stack]!,
        target: labels[other][step.target] as Label,
        targetCount: living[other][step.target]!,
        kills: step.kills,
      };
      living[other][step.target]! -= step.kills;
      return line(turn);
    });
    expect(replayed).toEqual(report.rounds[r].map(line));
  });

  it.each([0, 1] as const)('round index %i: the damage of every hit the target did not cut short', (r) => {
    for (const [i, hit] of report.rounds[r].entries()) {
      if (hit.kills === hit.targetCount) continue;
      const off = Math.abs(match.rounds[r].steps[i]!.damage / hit.damage - 1);
      expect(off, `turn ${String(i + 1)}`).toBeLessThan(0.00002);
    }
  });

  it('ends on the shares and the winner the game showed', () => {
    const shown = match.rounds.map((round) => [
      Math.round(round.attacker.share * 100),
      Math.round(round.defender.share * 100),
    ]);
    expect(shown).toEqual(report.shares);
    expect(match.winner).toBe(report.winner);
  });
});
