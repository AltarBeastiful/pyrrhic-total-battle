# TotalStack capture kit — 2026-09-18 (Pro trial ends 2026-09-20)

The owner's TotalStack session is the only way to its answers: the coordinator's own call to the optimize
endpoint from the page was refused by Claude Code's permission layer, and the Generate button did not render a
result from the automation window. So the owner runs this kit himself in the page's console; the file it
downloads goes to `docs/research/fixtures/` and the benchmark reads it.

## What it captures

For each **stacking method** the page can run (Total Optimization · M's Preservation · Elite Preservation), the
request the page itself sends is recorded once (so the method's own field names are never guessed), then the
same request is replayed over the scenarios below with the fields that differ, under each **priority** (None ·
Maximum Damage `averageDamage` · Damage / Silver `damagePerSilver`):

| scenario | leadership | authority | troops | mercenaries (caps) | bonuses |
|---|---|---|---|---|---|
| owner 7 000 | 7 000 | 2 000 | the profile's | the profile's (EMH 142 · ABT 50 · LGN 42 · CHR 20) | the profile's |
| owner 12 000 | 12 000 | 2 000 | ″ | ″ | ″ |
| owner 20 000 | 20 000 | 2 000 | ″ | ″ | ″ |
| owner 11 000 | 11 000 | 2 000 | ″ | ″ | ″ |
| live, hunters only | 20 000 | 2 180 | ″ | EMH 83 | ″ |
| evening | 11 000 | 2 180 | ″ | EMH 83 · LGN 9 999 (unlimited) · CHR 10 · ABT 60 | ″ |
| first-run, 3 bears | 20 000 | 40 000 | G1–G3, S1, nothing excluded | Bear V 3 | none |
| first-run, 10 bears | 20 000 | 40 000 | ″ | Bear V 10 | none |
| first-run, hunters 83 | 20 000 | 40 000 | ″ | EMH 83 | none |
| the 4 000 case of 2026-09-15 | 4 000 | 2 000 | G1–G3 with melee/ranged excluded, S1 | EMH 14 · ABT 15 · LGN 16 · CHR 8 | melee +35/+70, army +3/+3 |

Ten scenarios × (three Generate bodies + three optimize bodies × two priorities) = 90 answers, a few seconds each.
The page picks the route by the priority: `/api/calculations` with None, `/api/calculations/optimize` (with an
`objective`) with Maximum Damage or Damage / Silver — both are recorded and replayed.

## How to run it

1. Open https://totalstack.ca, signed in, with your profile loaded. Open DevTools (F12) → Console.
2. Paste the snippet below and press Enter. It prints `recording…`.
3. Priority **None**: press **Generate** under **Total Optimization**, then under **M's Preservation**, then under
   **Elite Preservation**. Each press should print `recorded (n so far): calculations|…` with a new key. If a
   press prints nothing, the page did not send a request for it (say so); if Total Optimization prints the same
   key as another method, TotalStack sends the same body for both and only the page shows the difference.
   Then priority **Damage / Silver**: Generate once under each of the three methods again — those post to
   `/api/calculations/optimize` with an `objective`, and `run()` replays each of them under both priorities.
   Expect six keys before `run()`.
4. Type `run()` and press Enter. The console counts the answers down; when done a file
   `totalstack-2026-09-18-dataset.json` lands in Downloads. Hand it over.

If a step fails, the console says which scenario and why; `results` holds what was captured so far, and
`save()` downloads it.

```js
// ---- TotalStack capture kit, 2026-09-18 ----------------------------------------------------------------
const bases = {};            // method → { url, init, body } as the page sent it
const results = [];          // every answer, in order
const nativeFetch = window.fetch.bind(window);
const record = (url, init, bodyText) => {
  if (!url.includes('/api/calculations') || typeof bodyText !== 'string') return;
  const body = JSON.parse(bodyText);
  // The body carries no method name (2026-09-18): the method is the combination of its booleans, so the key
  // is every boolean and string the body has, plus the path — /api/calculations for Generate, /optimize for a
  // priority search (which carries `objective`).
  const flags = Object.keys(body)
    .filter((k) => typeof body[k] === 'boolean' || (typeof body[k] === 'string' && k !== 'bonusMode'))
    .sort()
    .map((k) => `${k}=${body[k]}`)
    .join(',');
  const key = `${url.split('/api/')[1]}|${flags}`;
  bases[key] = { url, init: { ...init, body: undefined }, body };
  console.log(`recorded (${Object.keys(bases).length} so far):`, key);
};
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (init && String(init.method).toUpperCase() === 'POST') record(url, init, init.body);
  return nativeFetch(input, init);
};
// The page may send through XMLHttpRequest instead of fetch: record that too, replayed through fetch.
const xhrOpen = XMLHttpRequest.prototype.open;
const xhrSend = XMLHttpRequest.prototype.send;
const xhrHeader = XMLHttpRequest.prototype.setRequestHeader;
XMLHttpRequest.prototype.open = function (method, url, ...rest) { this.__kit = { method, url, headers: {} }; return xhrOpen.call(this, method, url, ...rest); };
XMLHttpRequest.prototype.setRequestHeader = function (name, value) { if (this.__kit) this.__kit.headers[name] = value; return xhrHeader.call(this, name, value); };
XMLHttpRequest.prototype.send = function (body) {
  if (this.__kit && String(this.__kit.method).toUpperCase() === 'POST') {
    record(this.__kit.url, { method: 'POST', headers: this.__kit.headers, credentials: 'include' }, body);
  }
  return xhrSend.call(this, body);
};
console.log('recording… now press Generate once per stacking method (priority None).');

const zero = (o) => Object.fromEntries(Object.keys(o).map((k) => [k, 0]));
const firstRun = (b) => ({
  ...b,
  guardsmenMinTier: 1, guardsmenMaxTier: 3, specialistMinTier: 1, specialistMaxTier: 1,
  guardsmenExcludedCategories: [], specialistExcludedCategories: [], excludedTroopIds: [],
  healthBonuses: zero(b.healthBonuses), strengthBonuses: zero(b.strengthBonuses),
  armyStrengthAgainstEpicMonstersBonus: 0, eventStrengthBonus: 0,
  specialStrengthBonuses: zero(b.specialStrengthBonuses), templeLevel: 0,
});
const hire = (b, caps) => ({
  ...b,
  selectedMercenaryIds: Object.keys(caps),
  mercenaryCaps: { ...b.mercenaryCaps, ...caps },
  optimizationSeed: b.optimizationSeed ? { ...b.optimizationSeed, selectedMercenaryIds: Object.keys(caps) } : b.optimizationSeed,
});
const scenarios = [
  ['owner 7 000', (b) => ({ ...b, inputValue: 7000, authorityValue: 2000 })],
  ['owner 12 000', (b) => ({ ...b, inputValue: 12000, authorityValue: 2000 })],
  ['owner 20 000', (b) => ({ ...b, inputValue: 20000, authorityValue: 2000 })],
  ['owner 11 000', (b) => ({ ...b, inputValue: 11000, authorityValue: 2000 })],
  ['live, hunters only', (b) => hire({ ...b, inputValue: 20000, authorityValue: 2180 }, { 'epic-monster-hunter-6': 83 })],
  ['evening', (b) => hire({ ...b, inputValue: 11000, authorityValue: 2180 }, { 'epic-monster-hunter-6': 83, 'legionary-6': 9999, 'chariot-6': 10, 'arbalester-6': 60 })],
  ['first-run, 3 bears', (b) => hire(firstRun({ ...b, inputValue: 20000, authorityValue: 40000 }), { 'bear-5': 3 })],
  ['first-run, 10 bears', (b) => hire(firstRun({ ...b, inputValue: 20000, authorityValue: 40000 }), { 'bear-5': 10 })],
  ['first-run, hunters 83', (b) => hire(firstRun({ ...b, inputValue: 20000, authorityValue: 40000 }), { 'epic-monster-hunter-6': 83 })],
  ['the 4 000 case of 2026-09-15', (b) => hire({
    ...firstRun(b), inputValue: 4000, authorityValue: 2000, guardsmenExcludedCategories: ['melee', 'ranged'],
    healthBonuses: { ...zero(b.healthBonuses), melee: 35, army: 3 },
    strengthBonuses: { ...zero(b.strengthBonuses), melee: 70, army: 3 },
  }, { 'epic-monster-hunter-6': 14, 'arbalester-6': 15, 'legionary-6': 16, 'chariot-6': 8 })],
];
const priorities = [['none', null], ['averageDamage', 'averageDamage'], ['damagePerSilver', 'damagePerSilver']];

async function run() {
  const keys = Object.keys(bases);
  if (keys.length === 0) return console.warn('nothing recorded yet — press Generate first');
  let left = keys.length * scenarios.length * priorities.length;
  for (const key of keys) {
    const base = bases[key];
    for (const [name, make] of scenarios) {
      for (const [pName, objective] of priorities) {
        // A Generate body (/api/calculations) has no `objective`: it is replayed once, as "none". An optimize
        // body (/api/calculations/optimize) is replayed once a priority, "none" being no priority at all.
        const optimize = 'objective' in base.body;
        if (optimize === (pName === 'none')) { left -= 1; continue; }
        const body = { ...make(base.body) };
        if (optimize) body.objective = objective;
        try {
          const res = await nativeFetch(base.url, { ...base.init, body: JSON.stringify(body) });
          const text = await res.text();
          let json = null;
          try { json = JSON.parse(text); } catch { /* keep text */ }
          results.push({ method: key, scenario: name, priority: pName, status: res.status, request: body, response: json ?? text });
        } catch (error) {
          results.push({ method: key, scenario: name, priority: pName, status: 'error', request: body, response: String(error) });
          console.warn('failed:', key, name, pName, error);
        }
        left -= 1;
        console.log(`${left} left — ${key} · ${name} · ${pName}`);
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }
  save();
}
function save() {
  const blob = new Blob([JSON.stringify({ capturedAt: new Date().toISOString(), bases, results }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'totalstack-2026-09-18-dataset.json';
  a.click();
  console.log('saved', results.length, 'answers');
}
```

## What is read off the page today (already a fixture)

`docs/research/fixtures/totalstack-2026-09-18-total-optimization-7000.json` — Total Optimization, 7 000
leadership, priority Damage / Silver, on the owner's TotalStack profile (which fields Archer III and
Spearman III, unlike his Pyrrhic export): 13 352 794 average damage for 3 198 200 silver and 1 160 gold.

## First run, 2026-09-18 22:11 (`docs/research/fixtures/totalstack-2026-09-18-dataset.json`)

Two Generate bodies were recorded — `relaxedPreservation=true, enforceOrdering=false` (M's Preservation) and
`relaxedPreservation=false, enforceOrdering=true` (Elite Preservation); the Total Optimization press keyed the
same as one of them and was overwritten — and the body carries no `objective`, so the three "priorities" are the
same answer three times: 20 distinct answers, all HTTP 201, each following its scenario (the troops sum to the
leadership asked, the mercenaries follow the caps). `isOptimized` is false throughout: the priority search is
the optimize endpoint, reached only when a priority is set on the page. The second run above fills both gaps.

## Third run, 2026-09-18 22:44 (`docs/research/fixtures/totalstack-2026-09-18-dataset-full.json`) — the full set

Six bases, 80 answers (40 Generate at HTTP 201, 40 optimize at HTTP 200), each answer following its scenario.
The body names no method; the flags do:

| base | flags | what the page calls it |
|---|---|---|
| `/api/calculations` | relaxedPreservation=true, enforceOrdering=false | M's Preservation |
| `/api/calculations` | relaxedPreservation=false, enforceOrdering=true, monsterSaving=true | **Total Optimization** (its 7 000 answer matches the Battle Summary read off the page: ARC3 537 · RD3 239 · RD2 428 · SP3 436 · ARC2 959 · SP2 778 · SP1 1 408 · RD1 774, ABT 45 · EMH 42 · CHR 20 · LGN 36) |
| `/api/calculations` | relaxedPreservation=false, enforceOrdering=true | Elite Preservation |
| `/api/calculations` | relaxedPreservation=true, enforceOrdering=false, with `excludedTroopIds` archer-1 / spearman-1 / swordsman-1 | M's Preservation again, pressed after an optimize had left those types out on the page |
| `/api/calculations/optimize` | enforceOrdering=true, relaxedPreservation=false, objective | the priority search under Elite (replayed under both objectives) |
| `/api/calculations/optimize` | enforceOrdering=false, relaxedPreservation=true, objective | the priority search under M's (replayed under both objectives) |

Caveat for the owner's scenarios (7 000 / 12 000 / 20 000 / 11 000, live, evening): the kit only rewrites
`excludedTroopIds` for the first-run and 4 000 cases, so a base recorded while the page was excluding types
(the second M's base: archer-1, spearman-1, swordsman-1; the Total Optimization and Elite bases: archer-1,
swordsman-1) replays the owner's scenarios with those exclusions. The first M's base and both optimize bases
are the clean ones for those scenarios; the optimize answers carry their own `excludedTroopIds` in the response.
