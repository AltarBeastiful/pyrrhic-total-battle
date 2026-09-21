#!/usr/bin/env node
/**
 * **TotalStack replay** — the capture kit of 2026-09-18, run from the terminal instead of the page console,
 * over the scenarios the benchmark has no TotalStack row for.
 *
 * `docs/research/totalstack-capture-2026-09-18.md` is the kit: the owner pressed Generate once per stacking
 * method and once per method under a priority, and the snippet recorded, for each `(route, flag set)`, the
 * request the page itself sent — its `url`, its `init` and its `body`. This script takes those bases out of
 * `docs/research/fixtures/totalstack-2026-09-18-dataset-window.json` and replays them over ten scenarios the
 * benchmark has no row for, deriving each with the kit's own helpers (`zero`, `firstRun`, `hire`, `owner`).
 *
 * ---
 *
 * **Updated 2026-09-19 to the API as it answers today.** The owner captured a 200 on
 * `POST /api/calculations/optimize`, and two things had moved:
 *
 *   - **The headers.** There is **no authorization header at all**. The route is identified by
 *     `x-session-id` (a uuid, the owner's session) and `x-calculation-request-id` (a uuid, fresh per
 *     request). So the session id comes from the environment — `TOTALSTACK_SESSION_ID`, which `--send`
 *     refuses to run without — the request id is minted here per request, and the stored `init.headers` are
 *     still forwarded opaquely **minus** any key matching `/authorization|cookie|set-cookie|content-type|
 *     origin|referer|x-session-id|x-calculation-request-id/i` (dropped **by key name**; no value is ever
 *     read). Every name the script sets itself is in that list, because two casings of one header name do
 *     **not** override — `fetch` comma-joins them, and a doubled `content-type` is what made the first run
 *     answer 400 on all 140 requests.
 *   - **The body.** `TEMPLATE` below is his own 2026-09-19 request, verbatim from that capture. It is the
 *     template for every scenario: the stored base body is laid over it (so each base keeps its own method
 *     flags, tier windows and bonuses) and the scenario's fields are laid over that. Every key of the new
 *     schema survives — `dominanceValue`, `templeLevel`, `trainingCostReductions`, `trainingSpeedBonuses`,
 *     `recoveryPlan`, `reviveAllTroops` — at the template's value wherever the old body had none.
 *
 * **The token never leaves the request.** This file never reads, prints or writes a header value. The dry run
 * prints bodies only, and the fixture it writes carries `url` and `body` per base — no `init`. Do not add a
 * line that logs headers.
 *
 * ---
 *
 * Usage (the owner runs it himself, signed in to TotalStack — the Pro trial ends **2026-09-20**):
 *
 *     node tools/totalstack/replay.mjs                             # dry run: prints the bodies, sends nothing
 *     TOTALSTACK_SESSION_ID=<uuid> node tools/totalstack/replay.mjs --send
 *
 * Flags: `--send`, `--dry-run` (the default), `--verbose`, `--delay=<ms>`, `--origin=<https://…>`,
 * `--monster-min-tier=<n>`, `--out=<path>`.
 */
import { randomUUID } from 'node:crypto';
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
/** The one secret the script takes, and only from the environment. Never printed. */
const SESSION_ENV = 'TOTALSTACK_SESSION_ID';

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

// ---- the body schema, as the API answers it today -----------------------------------------------------------
/**
 * The owner's own request of **2026-09-19**, verbatim from a `POST /api/calculations/optimize` that came back
 * 200: leadership 5 225, dominance 100, authority 2 120, monsters at tier 3, Epic Monster Hunter **V** 80 with
 * bears and cyclopes at 6, guardsmen +60/+60 and army +3/+3.
 *
 * Every scenario is built on this object, so every key of the current schema is sent even where the 2026-09-18
 * bases had none: `dominanceValue`, `templeLevel`, `trainingCostReductions`, `trainingSpeedBonuses`,
 * `recoveryPlan`, `reviveAllTroops`, and the `giant` row of the two bonus maps.
 */
const TEMPLATE = {
  inputValue: 5225,
  dominanceValue: 100,
  authorityValue: 2120,
  guardsmenMinTier: 1,
  guardsmenMaxTier: 3,
  specialistMinTier: 1,
  specialistMaxTier: 1,
  monsterMinTier: 3,
  monsterMaxTier: 3,
  engineerMinTier: 1,
  engineerMaxTier: 0,
  rangedPct: 25,
  meleePct: 25,
  mountedPct: 25,
  flyingPct: 0,
  guardsmenExcludedCategories: ['melee', 'ranged'],
  specialistExcludedCategories: [],
  excludedTroopIds: [],
  excludedMonsterIds: [],
  selectedMercenaryIds: ['epic-monster-hunter-5'],
  customMercenaries: [],
  mercenaryCaps: { 'bear-5': 6, 'cyclops-5': 6, 'epic-monster-hunter-5': 80 },
  enforceOrdering: false,
  monsterSaving: false,
  monstersLast: false,
  relaxedPreservation: true,
  damageStacking: false,
  damageStackingAttackOrder: false,
  roundMonstersTo10: false,
  roundMercsTo10: false,
  bonusMode: 'source',
  directBonuses: {},
  healthBonuses: {
    flying: 0,
    mounted: 0,
    melee: 0,
    ranged: 0,
    guardsmen: 60,
    specialist: 0,
    engineers: 0,
    monster: 0,
    army: 3,
    beast: 0,
    elemental: 0,
    dragon: 0,
    giant: 0,
  },
  objective: 'damagePerSilver',
  deepOptimizationSeeds: false,
  optimizationSeed: {
    excludedTroopIds: ['swordsman-1'],
    excludedMonsterIds: [],
    selectedMercenaryIds: ['epic-monster-hunter-5'],
    customMercenaryIds: [],
  },
  recoveryPlan: { mode: 'retrainAll', selectiveTopTroopTypes: 1 },
  reviveAllTroops: false,
  enemyFormation: { flying: 1, melee: 1, ranged: 1, mounted: 1 },
  templeLevel: 0,
  trainingCostReductions: { guardsmen: 0, specialists: 0, engineers: 0, monsters: 0 },
  trainingSpeedBonuses: { guardsmen: 0, specialists: 0, engineers: 0, monsters: 0 },
  strengthBonuses: {
    flying: 0,
    mounted: 0,
    melee: 0,
    ranged: 0,
    guardsmen: 60,
    specialist: 0,
    engineers: 0,
    monster: 0,
    army: 3,
    beast: 0,
    elemental: 0,
    dragon: 0,
    giant: 0,
  },
  matchupStrengthBonusesByCategoryAndTarget: { ranged: {}, melee: {}, mounted: {}, flying: {} },
  armyStrengthAgainstEpicMonstersBonus: 0,
  eventStrengthBonus: 0,
  activeEventStrengthName: null,
  arachnesEventActive: false,
  specialStrengthBonuses: {
    doubleDamageChance: 0,
    strikeTwoSquadsChance: 0,
    beastsStrikeTwoSquadsChance: 0,
    elementalsStrikeTwoSquadsChance: 0,
    dragonsStrikeTwoSquadsChance: 0,
    giantsStrikeTwoSquadsChance: 0,
    guardsmenDoubleDamageChance: 0,
    specialistsDoubleDamageChance: 0,
    engineersDoubleDamageChance: 0,
    monstersDoubleDamageChance: 0,
  },
};

/** The three keys only `/api/calculations/optimize` takes; a Generate body sends none of them. */
const OPTIMIZE_ONLY = ['objective', 'deepOptimizationSeeds', 'optimizationSeed'];

/** A bonus map on the template's key set (so `giant` is always there), with the old body's values over it. */
const overlay = (template, stored) => ({ ...template, ...(stored ?? {}) });

/**
 * A stored 2026-09-18 base body rebased on today's schema: the template first, the stored body over it — so
 * each base keeps its **own** method flags, tier windows, exclusions, caps and bonuses (the first-run army's
 * and the owner's export's, which is what the kit's scenarios were derived from) — with the bonus maps merged
 * key-wise so the new `giant` row is present, and the optimize-only keys dropped on the Generate route.
 */
function rebase(url, stored) {
  const body = {
    ...TEMPLATE,
    ...stored,
    healthBonuses: overlay(TEMPLATE.healthBonuses, stored.healthBonuses),
    strengthBonuses: overlay(TEMPLATE.strengthBonuses, stored.strengthBonuses),
    specialStrengthBonuses: overlay(TEMPLATE.specialStrengthBonuses, stored.specialStrengthBonuses),
    matchupStrengthBonusesByCategoryAndTarget: overlay(
      TEMPLATE.matchupStrengthBonusesByCategoryAndTarget,
      stored.matchupStrengthBonusesByCategoryAndTarget,
    ),
    trainingCostReductions: overlay(TEMPLATE.trainingCostReductions, stored.trainingCostReductions),
    trainingSpeedBonuses: overlay(TEMPLATE.trainingSpeedBonuses, stored.trainingSpeedBonuses),
  };
  if (!url.includes('/optimize')) for (const key of OPTIMIZE_ONLY) if (!(key in stored)) delete body[key];
  return body;
}

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
 * `selectedMercenaryIds` is exactly the set of cap keys, so a type with no cap entry is not hired at all.
 */
const UNLIMITED = 9999;

/**
 * **Monsters.** The dominance pool is switched on by `monsterMinTier` / `monsterMaxTier`, narrowed by
 * `excludedMonsterIds`, budgeted by **`dominanceValue`** — a key the 2026-09-18 bodies did not have and the
 * 2026-09-19 schema does — and answered in `monsterCounts`.
 *
 * The 2026-09-18 bases carried `monsterMinTier: 3, monsterMaxTier: 0` (a maximum below the minimum, i.e. off),
 * which is why all 140 captured answers have `monsterCounts: {}`. The tiers come from the engine's own table
 * (`src/data/tables/monsters.json`): four types a tier, **3 to 9** — so the minimum is 3, never 1.
 */
const monsterTable = JSON.parse(readFileSync(MONSTERS, 'utf8'));
const MONSTER_MAX_TIER = Math.max(...monsterTable.map((monster) => monster.tier));
const MONSTER_MIN_TIER = Math.max(3, Number(value('monster-min-tier', 3)));
const withMonsters = (body, { min = MONSTER_MIN_TIER, max = MONSTER_MAX_TIER, dominance }) => ({
  ...body,
  monsterMinTier: min,
  monsterMaxTier: max,
  dominanceValue: dominance,
  excludedMonsterIds: [],
  optimizationSeed: body.optimizationSeed
    ? { ...body.optimizationSeed, excludedMonsterIds: [] }
    : body.optimizationSeed,
});

// ---- the scenarios the benchmark has no TotalStack row for ---------------------------------------------------
/** The two hired types of experiment 110's monster camps, so the two answers are comparable to it. */
const CAMP_110_HIRED = { 'epic-monster-hunter-6': 83, 'bear-5': 6 };
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
  /**
   * His TotalStack profile as it stood on 2026-09-19: the template's own scenario fields, verbatim. Only the
   * base's method flags and route differ from the request that came back 200.
   */
  [
    'his TotalStack profile 2026-09-19 (5 225 / dominance 100 / 2 120, monsters tier 3, EMH V 80 · bears 6 · cyclopes 6)',
    (body) => ({
      ...body,
      inputValue: TEMPLATE.inputValue,
      dominanceValue: TEMPLATE.dominanceValue,
      authorityValue: TEMPLATE.authorityValue,
      guardsmenMinTier: TEMPLATE.guardsmenMinTier,
      guardsmenMaxTier: TEMPLATE.guardsmenMaxTier,
      specialistMinTier: TEMPLATE.specialistMinTier,
      specialistMaxTier: TEMPLATE.specialistMaxTier,
      monsterMinTier: TEMPLATE.monsterMinTier,
      monsterMaxTier: TEMPLATE.monsterMaxTier,
      guardsmenExcludedCategories: [...TEMPLATE.guardsmenExcludedCategories],
      specialistExcludedCategories: [...TEMPLATE.specialistExcludedCategories],
      excludedTroopIds: [...TEMPLATE.excludedTroopIds],
      excludedMonsterIds: [...TEMPLATE.excludedMonsterIds],
      selectedMercenaryIds: [...TEMPLATE.selectedMercenaryIds],
      mercenaryCaps: { ...TEMPLATE.mercenaryCaps },
      healthBonuses: { ...TEMPLATE.healthBonuses },
      strengthBonuses: { ...TEMPLATE.strengthBonuses },
      ...(body.optimizationSeed ? { optimizationSeed: { ...TEMPLATE.optimizationSeed } } : {}),
    }),
  ],
  /**
   * **The two armies the benchmark can score against nothing** (S-119, 2026-09-21). Every other scenario here
   * has a captured TotalStack row; these two have none, so `tests/engine/plan-benchmark.test.ts` prints `—`
   * for them on every reading and the owner's *"beat TotalStack everywhere"* has two blind armies — one of
   * them the camp he actually plays. Both are built from `tests/engine/plan-scenarios.ts`, field for field.
   */
  [
    'Aydae alone, 4 975 (EMH 83 · legionaries uncapped · chariots 10 · arbalesters 60, 4 975 / 2 180)',
    (body) =>
      hire(
        owner(
          {
            ...body,
            // `aydaeAlone`: `topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: [] }` — the
            // melee specialist stays, unlike the 2026-09-19 camps above.
            guardsmenExcludedCategories: ['melee', 'ranged'],
            specialistExcludedCategories: [],
          },
          { inputValue: 4975, authorityValue: 2180 },
        ),
        {
          'epic-monster-hunter-6': 83,
          'legionary-6': UNLIMITED,
          'chariot-6': 10,
          'arbalester-6': 60,
        },
      ),
  ],
  [
    'his usual setup 2026-09-19 (Aydae alone, 5 200 / 2 000 / dominance 200, monsters tier 3, EMH VI 90)',
    (body) =>
      withMonsters(
        hire(
          owner(
            {
              ...body,
              // `usualSetup`: guardsmen I–III, specialists I–I, the top melee and ranged guardsmen out and
              // the melee specialist in, monsters on tier 3 alone.
              guardsmenMinTier: 1,
              guardsmenMaxTier: 3,
              specialistMinTier: 1,
              specialistMaxTier: 1,
              guardsmenExcludedCategories: ['melee', 'ranged'],
              specialistExcludedCategories: [],
            },
            { inputValue: 5200, authorityValue: 2000 },
          ),
          { 'epic-monster-hunter-6': 90 },
        ),
        { min: 3, max: 3, dominance: 200 },
      ),
  ],
  [
    `monsters, first-run army (tiers ${MONSTER_MIN_TIER}–${MONSTER_MAX_TIER}, dominance 20 000, no mercenaries)`,
    (body) =>
      withMonsters(hire(firstRun({ ...body, inputValue: 20000, authorityValue: 40000 }), {}), {
        dominance: 20000,
      }),
  ],
  [
    `monsters, owner’s window (tiers ${MONSTER_MIN_TIER}–${MONSTER_MAX_TIER}, dominance 20 000, hunters 450, 4 975 / 2 180)`,
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
        { dominance: 20000 },
      ),
  ],
  /** The two camps experiment 110 measures the plan on, so its tables and these answers line up. */
  [
    'monsters, camp 110 — tiers 3–5, dominance 900 (EMH 83 · Bear V 6, 20 000 / 2 180)',
    (body) =>
      withMonsters(hire(firstRun({ ...body, inputValue: 20000, authorityValue: 2180 }), CAMP_110_HIRED), {
        min: 3,
        max: 5,
        dominance: 900,
      }),
  ],
  [
    'monsters, camp 110 — tiers 3–5, dominance 20 000 (EMH 83 · Bear V 6, 20 000 / 2 180)',
    (body) =>
      withMonsters(hire(firstRun({ ...body, inputValue: 20000, authorityValue: 2180 }), CAMP_110_HIRED), {
        min: 3,
        max: 5,
        dominance: 20000,
      }),
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

// ---- the headers ---------------------------------------------------------------------------------------------
/**
 * Header **names** only are ever looked at. The stored headers are forwarded as they stand except for the names
 * this drops — any authorization-like key, and **every name the script sets itself** — and then the fixed five
 * the API wants. No value is read, here or anywhere.
 *
 * **Why every name it sets is dropped first** (2026-09-19, the 400 run): the stored headers carry
 * `Content-Type` and this adds `content-type`. A JS object keeps both, and `fetch` turns an object into
 * `Headers` by **appending**, which merges two casings of one name into one comma-joined value —
 * `content-type: application/json, application/json`. That is not a media type any JSON body parser accepts,
 * so the server parsed no body at all and its validator answered `{"message":"Required","field":""}` with an
 * empty path — the root of the schema, i.e. "the body itself is missing". All 140 requests failed that way,
 * on both routes, while the previous version — which forwarded the stored headers untouched, with one
 * `Content-Type` — was answered 201. The body was never the problem.
 */
const DROP =
  /^(authorization|cookie|set-cookie|content-type|origin|referer|x-session-id|x-calculation-request-id)$/i;
function headersFor(stored) {
  const out = {};
  for (const name of Object.keys(stored ?? {})) if (!DROP.test(name)) out[name] = stored[name];
  return {
    ...out,
    'content-type': 'application/json',
    origin: DEFAULT_ORIGIN,
    referer: `${DEFAULT_ORIGIN}/`,
    'x-session-id': process.env[SESSION_ENV] ?? '',
    // A fresh uuid a request: the page mints one per calculation and the server keys on it.
    'x-calculation-request-id': randomUUID(),
  };
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
    `D ${body.dominanceValue}`,
    `hired [${(body.selectedMercenaryIds ?? []).join(' · ') || '—'}]`,
    `caps {${(body.selectedMercenaryIds ?? []).map((id) => `${id}: ${body.mercenaryCaps?.[id]}`).join(', ') || '—'}}`,
    `troops G${body.guardsmenMinTier}–${body.guardsmenMaxTier} S${body.specialistMinTier}–${body.specialistMaxTier}`,
    `monsters ${body.monsterMinTier}–${body.monsterMaxTier}`,
    `excl troops [${(body.excludedTroopIds ?? []).join(' · ') || '—'}]`,
    `excl cats G[${(body.guardsmenExcludedCategories ?? []).join('·') || '—'}] S[${(body.specialistExcludedCategories ?? []).join('·') || '—'}]`,
    `bonus H/S guardsmen ${body.healthBonuses?.guardsmen ?? '?'}/${body.strengthBonuses?.guardsmen ?? '?'} army ${body.healthBonuses?.army ?? '?'}/${body.strengthBonuses?.army ?? '?'}`,
    body.objective ? `objective ${body.objective}` : 'objective —',
  ].join(' | ');

/**
 * One answer. A request that throws, or that comes back outside 2xx, is retried **once** (with a new request
 * id) and then recorded as it stands — status and body — so a failure is a row in the fixture, not a gap.
 */
async function ask(base, body) {
  const url = base.url.startsWith('http') ? base.url : `${origin}${base.url}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: base.init?.method ?? 'POST',
        headers: headersFor(base.init?.headers),
        body: JSON.stringify(body),
      });
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
    const stored = dataset.bases[key];
    const template = rebase(stored.url, stored.body);
    const optimize = 'objective' in template;
    for (const [name, make] of scenarios) {
      for (const [priorityName, objective] of priorities) {
        // A Generate body is replayed once, as "none"; an optimize body once a real objective.
        if (optimize === (priorityName === 'none')) continue;
        const body = { ...make(template) };
        if (optimize) body.objective = objective;
        planned.push({ key, base: stored, name, priority: priorityName, body });
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
    /**
     * The wire check: what would actually go out. Byte length and the head of the serialised body (so an empty
     * or unserialisable body shows up here rather than as a 400), the final header **names** — never values,
     * and never more than one casing of a name — and the key/type diff of scenario 6 against `TEMPLATE`, which
     * is the captured request itself, so a key the merge dropped or retyped is visible without sending.
     */
    const probe = planned.find((item) => item.name.startsWith('his TotalStack profile')) ?? planned[0];
    const text = JSON.stringify(probe.body);
    const names = Object.keys(headersFor(probe.base.init?.headers));
    const lower = names.map((name) => name.toLowerCase());
    console.log(`\nwire check — ${methodOf(probe.key)} · ${probe.name} · ${probe.priority}`);
    console.log(`  body: ${Buffer.byteLength(text, 'utf8')} bytes, starts \`${text.slice(0, 80)}\``);
    console.log(`  header names: ${names.join(', ')}`);
    console.log(
      `  duplicate names (case-insensitive): ${lower.length === new Set(lower).size ? 'none' : [...new Set(lower.filter((name, index) => lower.indexOf(name) !== index))].join(', ')}`,
    );
    const optimizeProbe = 'objective' in probe.body;
    const missing = Object.keys(TEMPLATE).filter(
      (key) => !(key in probe.body) && (optimizeProbe || !OPTIMIZE_ONLY.includes(key)) && key !== 'objective',
    );
    const retyped = Object.keys(TEMPLATE).filter((key) => {
      if (!(key in probe.body)) return false;
      const kind = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);
      return kind(TEMPLATE[key]) !== kind(probe.body[key]);
    });
    const dropped = Object.keys(probe.body).filter((key) => probe.body[key] === undefined);
    console.log(
      `  vs the captured template: ${missing.length} key(s) missing${missing.length ? ` (${missing.join(', ')})` : ''}, ` +
        `${retyped.length} retyped${retyped.length ? ` (${retyped.join(', ')})` : ''}, ` +
        `${dropped.length} undefined and dropped by JSON.stringify${dropped.length ? ` (${dropped.join(', ')})` : ''}`,
    );
    console.log(`\ndry run: ${planned.length} bodies forged, none sent. Add --send to send them.`);
    return;
  }

  // The API identifies the caller by `x-session-id` alone — there is no authorization header — so without it
  // every answer would be a refusal. Refuse here instead, and say which variable to set.
  if (!process.env[SESSION_ENV]) {
    console.error(
      `${SESSION_ENV} is not set: TotalStack identifies the caller by the x-session-id header and this script ` +
        `takes it from the environment only. Run:\n\n    ${SESSION_ENV}=<uuid> node tools/totalstack/replay.mjs --send\n`,
    );
    process.exitCode = 1;
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

  // The fixture: the dataset's shape, **without `init`** — bodies only, so no header ever reaches disk. The
  // bodies recorded are the rebased ones, i.e. what was actually sent.
  const bases = Object.fromEntries(
    baseKeys.map((key) => [
      key,
      { url: dataset.bases[key].url, body: rebase(dataset.bases[key].url, dataset.bases[key].body) },
    ]),
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
