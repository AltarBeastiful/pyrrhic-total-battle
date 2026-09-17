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

Ten scenarios × three priorities × three methods = 90 answers, a few seconds each.

## How to run it

1. Open https://totalstack.ca, signed in, with your profile loaded. Open DevTools (F12) → Console.
2. Paste the snippet below and press Enter. It prints `recording…`.
3. Choose **Total Optimization**, priority **None**, press **Generate**. The console prints `recorded: total…`.
   Do the same for **M's Preservation** and **Elite Preservation** (priority None each time).
4. Type `run()` and press Enter. The console counts the answers down; when done a file
   `totalstack-2026-09-18-dataset.json` lands in Downloads. Hand it over.

If a step fails, the console says which scenario and why; `results` holds what was captured so far, and
`save()` downloads it.

```js
// ---- TotalStack capture kit, 2026-09-18 ----------------------------------------------------------------
const bases = {};            // method → { url, init, body } as the page sent it
const results = [];          // every answer, in order
const nativeFetch = window.fetch.bind(window);
window.fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.url;
  if (url.includes('/api/calculations/') && init && String(init.method).toUpperCase() === 'POST' && typeof init.body === 'string') {
    const body = JSON.parse(init.body);
    const key = `${url.split('/api/calculations/')[1]}|${body.stackingMethod ?? body.method ?? body.mode ?? ''}|${body.relaxedPreservation}|${body.enforceOrdering}`;
    bases[key] = { url, init: { ...init, body: undefined }, body };
    console.log('recorded:', key, body);
  }
  return nativeFetch(input, init);
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
        const body = { ...make(base.body) };
        if ('objective' in base.body) body.objective = objective;
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
