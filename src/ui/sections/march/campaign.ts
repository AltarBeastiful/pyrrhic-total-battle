/**
 * What a campaign search has to say, in a player's words (S-54, PLAN §5.1).
 *
 * `searchComplete` answers with engine vocabulary — a method id, a `spend` fraction, a list of
 * candidates, a `CampaignSummary` per cell. None of that is what a player asks, and none of it may
 * reach the screen (design rule 26): a sizing is named the way the Battle card names it
 * (`docs/design.md` §7), a spend level is **how many of your mercenaries march each time**, and a
 * candidate is a row in a comparison.
 *
 * Everything here is a plain function over the engine's answer: no React, no store, so the wording
 * and the arithmetic are tested on their own (`campaign.test.ts`) and the components only lay them
 * out.
 */
import type { CampaignSummary, CompleteCandidate, CompleteMethod, CompleteResult } from '@/engine/campaign';

import { amount, percent } from './format';

/**
 * The three sizings, in the glossary's words — **not** the engine's. `elite` is the tier ladder,
 * `ms` is "Troops first", and `msRelaxed` is that same rule with the damage trades the Battle card
 * calls "Allow damage trades", so a player reads the winner in the vocabulary they chose from.
 */
export const SIZING_LABEL: Record<CompleteMethod, string> = {
  elite: 'Tier ladder',
  ms: 'Troops first',
  msRelaxed: 'Troops first, with damage trades',
};

/** The spend levels the engine tries, said as quantities rather than as fractions. */
const SPEND_WORDS: readonly (readonly [number, string])[] = [
  [1, 'All'],
  [0.75, 'Three quarters'],
  [0.5, 'Half'],
  [0.25, 'A quarter'],
];

/** How much of every hired stock one march fields. A level the engine invents falls back to a share. */
export function spendWords(spend: number): string {
  const found = SPEND_WORDS.find(([value]) => Math.abs(value - spend) < 0.005);
  return found === undefined ? percent(Math.round(spend * 100)) : found[1];
}

/** "10 marches", "1 march" — a campaign of one is a real answer under a tight silver budget. */
export function marchCount(fought: number): string {
  return `${amount(fought)} ${fought === 1 ? 'march' : 'marches'}`;
}

/** Whether this campaign has any hired stock at all — an account with none is a troops-only account. */
export function hasHiredStock(campaign: CampaignSummary): boolean {
  return Object.keys(campaign.marches[0]?.caps ?? {}).length > 0;
}

/**
 * The one line under the figures: what the winning march was sized by, and how much of the camp it
 * puts in the field. A player who hires nobody is told the sizing and nothing else — a sentence about
 * mercenaries they do not own is noise (design rule 15).
 */
export function sizingSentence(winner: CompleteCandidate): string {
  const sizing = SIZING_LABEL[winner.method];
  if (!hasHiredStock(winner.campaign)) return `Sized as ${sizing}.`;
  if (winner.spend >= 1) return `Sized as ${sizing}. Every mercenary you own marches each time.`;
  return `Sized as ${sizing}. ${spendWords(winner.spend)} of your mercenaries march each time.`;
}

/** Hired units (mercenaries and monsters) this march put in the field. */
export function hiredFielded(march: CampaignSummary['marches'][number]): number {
  return march.result.stacks.reduce(
    (total, stack) => (stack.unitId in march.caps ? total + stack.count : total),
    0,
  );
}

const sum = (counts: Record<string, number>): number =>
  Object.values(counts).reduce((total, value) => total + value, 0);

/** Mercenaries and monsters the whole campaign burns, and what is left when it ends. */
export function hiredTotals(campaign: CampaignSummary): { lost: number; remaining: number } {
  return { lost: sum(campaign.lost), remaining: sum(campaign.remaining) };
}

/** One line of the marches table: what it fielded, what it did, and what it has cost by then. */
export interface CampaignMarchRow {
  /** The march's number as a player counts them, from 1. */
  number: number;
  hired: number;
  damage: number;
  /** Silver spent by the end of this march, not by this march alone. */
  silverSoFar: number;
}

export function marchRows(campaign: CampaignSummary): CampaignMarchRow[] {
  let silver = 0;
  return campaign.marches.map((march, index) => {
    silver += march.summary.recovery.silver;
    return {
      number: index + 1,
      hired: hiredFielded(march),
      damage: march.summary.avgDamage,
      silverSoFar: silver,
    };
  });
}

/** One line of the comparison: a sizing at a share of the mercenaries, and what it gets you. */
export interface CampaignCompareRow {
  key: string;
  sizing: string;
  mercenaries: string;
  marches: number;
  damage: number;
  silver: number;
  lost: number;
  remaining: number;
  /** The row the march on screen came from. */
  winner: boolean;
}

const isFullSpend = (candidate: CompleteCandidate): boolean => candidate.spend >= 0.995;

/**
 * The comparison the March draws.
 *
 * `CompleteResult.candidates` is the best of every (sizing × spend) cell — twelve rows, most of them
 * a third reading of the same fact. Two questions are worth a line each:
 *
 *   1. **which sizing wins** — every sizing, marching with everything you own;
 *   2. **does holding mercenaries back pay** — the best answer at each lower share.
 *
 * The candidates arrive sorted by score, so the best of a share is simply the first row that carries
 * it. Order: the full-spend sizings first (best first, as the engine ranked them), then the lower
 * shares from the largest down, which is the order the question is asked in.
 */
export function compareRows(result: CompleteResult): CampaignCompareRow[] {
  const winner = result.winner;
  const rows: CampaignCompareRow[] = [];

  const push = (candidate: CompleteCandidate): void => {
    const totals = hiredTotals(candidate.campaign);
    rows.push({
      key: `${candidate.method}-${String(candidate.spend)}`,
      sizing: SIZING_LABEL[candidate.method],
      mercenaries: spendWords(candidate.spend),
      marches: candidate.campaign.fought,
      damage: candidate.campaign.totalAvg,
      silver: candidate.campaign.silver,
      lost: totals.lost,
      remaining: totals.remaining,
      winner: candidate.method === winner.method && candidate.spend === winner.spend,
    });
  };

  for (const candidate of result.candidates) {
    if (isFullSpend(candidate)) push(candidate);
  }

  const lower = [
    ...new Set(result.candidates.filter((one) => !isFullSpend(one)).map((one) => one.spend)),
  ].sort((a, b) => b - a);
  for (const spend of lower) {
    const best = result.candidates.find((candidate) => candidate.spend === spend);
    if (best !== undefined) push(best);
  }

  return rows;
}
