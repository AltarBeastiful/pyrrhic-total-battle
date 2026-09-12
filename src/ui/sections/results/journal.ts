/**
 * The battle journal as sentences, written to sit next to the in-game report so a player can compare
 * the two line by line. The wording is ours; only the shape of the list (numbered entries, the damage
 * and its "features" part, the hit counter) follows the game's.
 *
 * Which enemy squad lands a kill is an attribution, not a measurement: the model says the enemy makes
 * one attack per squad each round, so the k-th attack of a round is credited to the k-th squad of the
 * formation. The drawer says so.
 */
import { CATEGORIES } from '@/data/types';
import type { BattleJournal, Category, EnemyFormation, JournalEntry } from '@/engine/types';

import { amount } from './format';

export const CATEGORY_NAME: Record<Category, string> = {
  melee: 'melee',
  ranged: 'ranged',
  mounted: 'mounted',
  flying: 'flying',
};

/** The enemy squads in formation order, one entry per squad (Arachne's: eight). */
export function enemySquads(enemy: EnemyFormation): Category[] {
  const squads: Category[] = [];
  for (const category of CATEGORIES) {
    for (let i = 0; i < Math.max(0, Math.round(enemy[category])); i += 1) squads.push(category);
  }
  return squads;
}

export interface JournalLine {
  n: number;
  actor: JournalEntry['actor'];
  text: string;
  hits: number;
}

/** One journal as numbered sentences; `labelOf` turns a unit id into its pill label. */
export function journalLines(
  journal: BattleJournal,
  enemy: EnemyFormation,
  labelOf: (unitId: string) => string,
): JournalLine[] {
  const squads = enemySquads(enemy);
  let enemyAttack = 0;
  return journal.entries.map((entry) => {
    const label = labelOf(entry.unitId);
    if (entry.actor === 'army') {
      const features = entry.featuresDamage ?? 0;
      const target = entry.target === undefined ? 'melee' : CATEGORY_NAME[entry.target];
      const extra = features > 0 ? `, including ${amount(features)} from the squad's features` : '';
      return {
        n: entry.n,
        actor: entry.actor,
        text: `Your ${label} squad dealt ${amount(entry.damage)} damage to the ${target} squad${extra}.`,
        hits: entry.hits,
      };
    }
    const squad =
      squads.length === 0 ? 'melee' : CATEGORY_NAME[squads[enemyAttack % squads.length] ?? 'melee'];
    enemyAttack += 1;
    return {
      n: entry.n,
      actor: entry.actor,
      text: `The monster's ${squad} squad destroyed your ${label} squad (${amount(entry.damage)}).`,
      hits: entry.hits,
    };
  });
}

/** The journal header the drawer shows and the copied text repeats. */
export function journalHeader(journal: BattleJournal, enemy: EnemyFormation): string {
  const squads = enemySquads(enemy).length;
  return `${String(journal.rounds)} rounds · ${String(journal.friendlyHits)} friendly hits · ${String(squads)} enemy squads`;
}

/** The whole journal as plain text, for the clipboard. */
export function journalText(
  title: string,
  journal: BattleJournal,
  enemy: EnemyFormation,
  labelOf: (unitId: string) => string,
): string {
  const lines = journalLines(journal, enemy, labelOf).map(
    (line) => `${String(line.n)}. ${line.text} (${String(line.hits)} hits)`,
  );
  return [
    title,
    journalHeader(journal, enemy),
    '',
    ...lines,
    '',
    `Total damage: ${amount(journal.totalDamage)}`,
  ].join('\n');
}
