#!/usr/bin/env node
/**
 * **TotalStack replay** — the capture kit of 2026-09-18, run from the terminal instead of the page console,
 * over the scenarios the benchmark has no TotalStack row for.
 *
 * `docs/research/totalstack-capture-2026-09-18.md` is the kit: the owner pressed Generate once per stacking
 * method and once per method under a priority, and the snippet recorded, for each (route, flag set), the
 * request the page itself sent — `url`, `init` (method, headers, credentials) and `body`. This script takes
 * those bases out of `docs/research/fixtures/totalstack-2026-09-18-dataset-window.json` and replays them,
 * body by body, over seven new scenarios, deriving each one with the kit's own helpers (`zero`, `firstRun`,
 * `hire`, `owner`) so no field is guessed.
 *
 * ---
 *
 * **The token never leaves the request.** `init.headers` is forwarded to `fetch` as the opaque object the
 * dataset holds. This file never reads a header value, never prints one, and never writes one: the output
 * fixture carries `url` and `body` only, and `--dry-run` prints bodies. Do not add a line that logs `init`.
 *
 * ---
 *
 * Usage (the owner runs it himself, signed in to TotalStack — the Pro trial ends **2026-09-20**):
 *
 *     node tools/totalstack/replay.mjs             # dry run: forges and prints the bodies, sends nothing
 *     node tools/totalstack/replay.mjs --send      # sends them, sequentially, 400 ms apart
 *
 * Flags: `--send`, `--dry-run` (the default), `--verbose` (print every forged body, not one per scenario),
 * `--delay=<ms>`, `--origin=<https://…>`, `--monster-min-tier=<n>`, `--out=<path>`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ---- where things are ------------------------------------------------------------------------------------
const DATASET = new URL(
  '../../docs/research/fixtures/totalstack-2026-09-18-dataset-window.json',
  import.meta.url,
);
const MONSTERS = new URL('../../src/data/tables/monsters.json', import.meta.url);
const DEFAULT_OUT = new URL(
  '../../docs/research/fixtures/totalstack-2026-09-19-replay.json',
  import.meta.url,
);
/** The bases record `url` as the page saw it — `/api/calculations` — so a replay has to name the host. */
const DEFAULT_ORIGIN = 'https://totalstack.ca';
/** The kit's own pacing between two answers. Polite, and the rate the trial was captured at. */
const DEFAULT_DELAY_MS = 400;

// ---- the command line ------------------------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const value = (name, fallback) => {
  const hit = argv.find((arg) => arg.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const send = flag('send') && !flag('dry-run');
const verbose = flag('verbose');
const delayMs = Number(value('delay', DEFAULT_DELAY_MS));
const origin = String(value('origin', DEFAULT_ORIGIN)).replace(/\/$/, '');
const outPath = value('out', fileURLToPath(DEFAULT_OUT));

// ---- the kit's derivations, copied field for field ---------------------------------------------------------
/** Every key of a bonus map at 0 — the kit's `zero`. */
const zero = (object) => Object.fromEntries(Object.keys(object ?? {}).map((key) => [key, 0]));

/** The kit's `firstRun`: Guardsmen I–III and Specialists I, nothing excluded, no bonuses, no temple. */
const firstRun = (body) => ({
  ...body,
  guardsmenMinTier: 1,
  guardsmenMaxTier: 3,
  specialistMinTier: 1,
  specialistMaxTier: 1,
  guardsmenExcludedCategories: [],
  specialistExcludedCategories: [],
  excludedTroopIds: [],
  healthBonuses: zero(body.healthBonuses),
  strengthBonuses: zero(body.strengthBonuses),
  armyStrengthAgainstEpicMonstersBonus: 0,
  eventStrengthBonus: 0,
  specialStrengthBonuses: zero(body.specialStrengthBonuses),
  templeLevel: 0,
});

/**
 * The kit's `hire`: the hired set *is* the caps' keys, and the optimize bodies carry the same set inside
 * `optimizationSeed`. `hire(body, {})` therefore hires nothing — which is how the monsters scenarios ask for
 * a march of troops and monsters alone.
 */
const hire = (body, caps) => ({
  ...body,
  selectedMercenaryIds: Object.keys(caps),
  mercenaryCaps: { ...body.mercenaryCaps, ...caps },
  optimizationSeed: body.optimizationSeed
    ? { ...body.optimizationSeed, selectedMercenaryIds: Object.keys(caps) }
    : body.optimizationSeed,
});

/**
 * The kit's `owner`: the owner's Pyrrhic army leaves out the top-tier melee and ranged guardsmen and the melee
 * specialist, which the page's profile fields, so every owner scenario is asked with those three excluded or
 * the answer is a march he cannot make.
 */
const OWNER_WINDOW = ['archer-3', 'spearman-3', 'swordsman-1'];
const owner = (body, fields) => ({
  ...body,
  ...fields,
  excludedTroopIds: OWNER_WINDOW,
  optimizationSeed: body.optimizationSeed
    ? { ...body.optimizationSeed, excludedTroopIds: OWNER_WINDOW }
    : body.optimizationSeed,
});

/**
 * **"No cap"**, the way the kit expresses it: a very large number. Its `evening` scenario hires legionaries at
 * `9999` and the doc calls that row "legionaries unlimited"; the answers field ~2 000 of them, bounded by the
 * authority pool rather than by the cap. TotalStack's body has no null/absent form for an uncapped type —
 * `selectedMercenaryIds` is exactly `Object.keys(mercenaryCaps ∩ selection)`, so a type with no cap entry is a
 * type that is not hired at all.
 */
const UNLIMITED = 9999;

/**
 * **Monsters.** TotalStack's body switches the dominance pool on with `monsterMinTier` / `monsterMaxTier` and
 * narrows it with `excludedMonsterIds`; the answer comes back in `monsterCounts`. Every base of the capture
 * carries `monsterMinTier: 3, monsterMaxTier: 0` — max below min, i.e. **off** — which is why every one of the
 * 140 captured answers has `monsterCounts: {}`.
 *
 * There is **no dominance field in the request**: the body's forty keys hold none (the response reports a
 * `dominanceValue`, `null` throughout the capture). So a monsters scenario can only send the tiers, and how
 * much dominance the march may spend is the server's reading of the owner's own profile.
 *
 * The tiers come from the engine's own table (`src/data/tables/monsters.json`): four types a tier from 3 to 9.
 */
const monsterTable = JSON.parse(readFileSync(MONSTERS, 'utf8'));
const MONSTER_MAX_TIER = Math.max(...monsterTable.map((monster) => monster.tier));
const MONSTER_MIN_TIER = Number(value('monster-min-tier', 1));
const withMonsters = (body) => ({
  ...body,
  monsterMinTier: MONSTER_MIN_TIER,
  monsterMaxTier: MONSTER_MAX_TIER,
  excludedMonsterIds: [],
  optimizationSeed: body.optimizationSeed
    ? { ...body.optimizationSeed, excludedMonsterIds: [] }
    : body.optimizationSeed,
});

// ---- the scenarios the benchmark has no TotalStack row for ---------------------------------------------------
/**
 * Seven, each derived from a base exactly as the kit derives its ten.
 *
 * `first-run, 1 bear` / `2 bears` fill the two bear armies `tests/engine/plan-scenarios.ts` pins and the kit
 * answered only at 3 and 10. The two camps are the owner's own, read off his browser: 2026-09-18 (arbalesters
 * 485, legionaries 1 002, bears uncapped, 4 975 / 2 180) and 2026-09-19 (hunters only, at two settings). The
 * last two are the request he asked for on 2026-09-19 — *"a request with monsters for Total Optimization"*.
 */
const scenarios = [
  [
    'first-run, 1 bear',
    (body) => hire(firstRun({ ...body, inputValue: 20000, authorityValue: 40000 }), { 'bear-5': 1 }),
  ],
  [
    'first-run, 2 bears',
    (body) => hire(firstRun({ ...body, inputValue: 20000, authorityValue: 40000 }), { 'bear-5': 2 }),
  ],
  [
    'live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears uncapped, 4 975 / 2 180)',
    (body) =>
      hire(owner(body, { inputValue: 4975, authorityValue: 2180 }), {
        'arbalester-6': 485,
        'legionary-6': 1002,
        'bear-5': UNLIMITED,
      }),
  ],
  [
    'camp of 2026-09-19, hunters 450 (4 975 / 2 180)',
    (body) =>
      hire(
        owner(
          {
            ...body,
            guardsmenExcludedCategories: ['melee', 'ranged'],
            specialistExcludedCategories: ['melee'],
          },
          { inputValue: 4975, authorityValue: 2180 },
        ),
        { 'epic-monster-hunter-6': 450 },
      ),
  ],
  [
    'camp of 2026-09-19, hunters 120 (5 100 / 2 200)',
    (body) =>
      hire(
        owner(
          {
            ...body,
            guardsmenExcludedCategories: ['melee', 'ranged'],
            specialistExcludedCategories: ['melee'],
          },
          { inputValue: 5100, authorityValue: 2200 },
        ),
        { 'epic-monster-hunter-6': 120 },
      ),
  ],
  [
    `monsters, first-run army (tiers ${MONSTER_MIN_TIER}–${MONSTER_MAX_TIER}, no mercenaries)`,
    (body) => withMonsters(hire(firstRun({ ...body, inputValue: 20000, authorityValue: 40000 }), {})),
  ],
  [
    `monsters, owner’s window (tiers ${MONSTER_MIN_TIER}–${MONSTER_MAX_TIER}, hunters 450, 4 975 / 2 180)`,
    (body) =>
      withMonsters(
        hire(
          owner(
            {
              ...body,
              guardsmenExcludedCategories: ['melee', 'ranged'],
              specialistExcludedCategories: ['melee'],
            },
            { inputValue: 4975, authorityValue: 2180 },
          ),
          { 'epic-monster-hunter-6': 450 },
        ),
      ),
  ],
];

/** The kit's three priorities: a Generate body is replayed once as "none", an optimize body once per objective. */
const priorities = [
  ['none', null],
  ['averageDamage', 'averageDamage'],
  ['damagePerSilver', 'damagePerSilver'],
];

/** What the page calls a base's flags (`tests/engine/totalstack-rows.ts`'s `methodOf`, restated). */
function methodOf(key) {
  const optimize = key.startsWith('calculations/optimize');
  const relaxed = key.includes('relaxedPreservation=true');
  const saving = key.includes('monsterSaving=true');
  if (optimize) return relaxed ? 'priority search under M’s' : 'priority search under Elite';
  if (saving) return 'Total Optimization';
  return relaxed ? 'M’s Preservation' : 'Elite Preservation';
}

// ---- the run -------------------------------------------------------------------------------------------------
const dataset = JSON.parse(readFileSync(DATASET, 'utf8'));
const baseKeys = Object.keys(dataset.bases);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The few fields a reader checks a forged body by, for the dry run's one-line summary. */
const summarise = (body) =>
  [
    `L ${body.inputValue}`,
    `A ${body.authorityValue}`,
    `hired [${(body.selectedMercenaryIds ?? []).join(' · ') || '—'}]`,
    `caps {${(body.selectedMercenaryIds ?? []).map((id) => `${id}: ${body.mercenaryCaps?.[id]}`).join(', ') || '—'}}`,
    `troops G${body.guardsmenMinTier}–${body.guardsmenMaxTier} S${body.specialistMinTier}–${body.specialistMaxTier}`,
    `monsters ${body.monsterMinTier}–${body.monsterMaxTier}`,
    `excl troops [${(body.excludedTroopIds ?? []).join(' · ') || '—'}]`,
    `excl cats G[${(body.guardsmenExcludedCategories ?? []).join('·') || '—'}] S[${(body.specialistExcludedCategories ?? []).join('·') || '—'}]`,
    body.objective ? `objective ${body.objective}` : 'objective —',
  ].join(' | ');

/**
 * One answer. A request that throws, or that comes back outside 2xx, is retried **once** and then recorded as
 * it stands — status and body — so a failure is a row in the fixture rather than a gap in it.
 */
async function ask(base, body) {
  const url = base.url.startsWith('http') ? base.url : `${origin}${base.url}`;
  // `init` — headers included — is forwarded as the opaque object the dataset holds. Never inspected here.
  const init = { ...base.init, body: JSON.stringify(body) };
  if (process.env.TOTALSTACK_COOKIE) {
    init.headers = { ...init.headers, cookie: process.env.TOTALSTACK_COOKIE };
  }
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const text = await response.text();
      let json = null;
      try {
        json = JSON.parse(text);
      } catch {
        /* keep the text */
      }
      const answer = { status: response.status, response: json ?? text };
      if (response.ok || attempt === 1) return answer;
      await sleep(delayMs);
    } catch (error) {
      if (attempt === 1) return { status: 'error', response: String(error) };
      await sleep(delayMs);
    }
  }
  return { status: 'error', response: 'unreachable' };
}

async function main() {
  const planned = [];
  for (const key of baseKeys) {
    const base = dataset.bases[key];
    const optimize = 'objective' in base.body;
    for (const [name, make] of scenarios) {
      for (const [priorityName, objective] of priorities) {
        // A Generate body is replayed once, as "none"; an optimize body once a real objective.
        if (optimize === (priorityName === 'none')) continue;
        const body = { ...make(base.body) };
        if (optimize) body.objective = objective;
        planned.push({ key, base, name, priority: priorityName, body });
      }
    }
  }

  console.log(
    `TotalStack replay — ${baseKeys.length} bases × ${scenarios.length} scenarios = ${planned.length} answers` +
      `${send ? `, sending to ${origin}, ${delayMs} ms apart` : ', dry run (nothing is sent)'}`,
  );
  console.log(
    `monsters: tiers ${MONSTER_MIN_TIER}–${MONSTER_MAX_TIER}, ${monsterTable.length} types in src/data\n`,
  );
  for (const key of baseKeys) console.log(`  base ${methodOf(key)} — ${key.split('|')[0]}`);
  console.log('');

  if (!send) {
    const shown = new Set();
    for (const item of planned) {
      console.log(`· ${item.name} · ${methodOf(item.key)} · ${item.priority}\n    ${summarise(item.body)}`);
      if (verbose || !shown.has(item.name)) {
        shown.add(item.name);
        console.log(JSON.stringify(item.body, null, 1));
      }
    }
    console.log(`\ndry run: ${planned.length} bodies forged, none sent. Add --send to send them.`);
    return;
  }

  const results = [];
  let left = planned.length;
  for (const item of planned) {
    const answer = await ask(item.base, item.body);
    results.push({
      method: item.key,
      scenario: item.name,
      priority: item.priority,
      status: answer.status,
      request: item.body,
      response: answer.response,
    });
    left -= 1;
    console.log(`${left} left — ${answer.status} — ${methodOf(item.key)} · ${item.name} · ${item.priority}`);
    await sleep(delayMs);
  }

  // The fixture: the same shape as the dataset, **without `init`** — bodies only, so no header ever reaches disk.
  const bases = Object.fromEntries(
    baseKeys.map((key) => [key, { url: dataset.bases[key].url, body: dataset.bases[key].body }]),
  );
  writeFileSync(
    outPath,
    `${JSON.stringify({ capturedAt: new Date().toISOString(), bases, results }, null, 1)}\n`,
  );
  const ok = results.filter((row) => row.status === 200 || row.status === 201).length;
  console.log(`\nwrote ${outPath} — ${ok}/${results.length} answers at 2xx`);
}

main().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
