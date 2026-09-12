/// <reference types="node" />
/** Parser for the captured TotalStack journal transcripts in `tests/fixtures/*.txt`. */
import { readFileSync } from 'node:fs';

import type { Category } from '../../src/engine/types';

const FIXTURES = new URL('../fixtures/', import.meta.url);
const TARGETS: Record<string, Category> = {
  fly: 'flying',
  rng: 'ranged',
  mnt: 'mounted',
  mel: 'melee',
};

export interface ParsedEntry {
  n: number;
  hits: number;
  actor: 'enemy' | 'army';
  /** Pill label of our stack: the attacker for army entries, the victim for enemy entries. */
  label: string;
  target?: Category;
  damage: number;
  features?: number;
}

/** Parses lines like `2:1H ARC1>fly 54693 (incl. 21943 features)` into entries. */
export function parseJournal(file: string): ParsedEntry[] {
  const text = readFileSync(new URL(file, FIXTURES), 'utf8');
  const body = text
    .split('\n')
    .filter((line) => /\d+:\d+H/.test(line))
    .join(' ');
  return body
    .split(';')
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const match =
        /^(\d+):(\d+)H\s+(\S+)>(\S+)\s+([\d,]+)(?:\s+\((?:incl\.\s+)?([\d,]+)(?:\s+features)?\))?/.exec(
          chunk,
        );
      if (!match) throw new Error(`unparsable journal entry: ${chunk}`);
      const [, n, hits, actor, target, damage, features] = match as unknown as string[];
      const numeric = (value: string): number => Number(value.replace(/,/g, ''));
      return {
        n: numeric(n!),
        hits: numeric(hits!),
        actor: actor === 'E' ? ('enemy' as const) : ('army' as const),
        label: actor === 'E' ? target! : actor!,
        ...(actor === 'E' ? {} : { target: TARGETS[target!] }),
        damage: numeric(damage!),
        ...(features === undefined ? {} : { features: numeric(features) }),
      };
    });
}
