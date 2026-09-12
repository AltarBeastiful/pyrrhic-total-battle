# totalstack-sync (prototype)

Scripts used on 2026-09-12 to pull the game-data tables out of TotalStack's client bundle.
They are the starting point for story S-05 (CI data-drift check). Not wired to CI yet.

- `jsconv.py` — tokenizer that turns a minified JS object/array literal into JSON without evaluating it
  (unquoted keys, `!0/!1`, `1e3`, single/backtick strings, bare identifiers → `"$ref:name"`).
- `extract_all.py` — scans a bundle for `name=[{...}]` literals containing data-like keys and dumps each as JSON.
- `extract_named.py` — extracts specific minified variable names (they change on every TotalStack build, so the
  CI version must locate tables by content, e.g. the array containing `"id":"archer-1"`, not by name).

Manual procedure used:
1. `curl https://totalstack.ca/` → find `assets/index-*.js`; the lazy chunks are listed inside it (`"./Home-*.js"` etc.).
2. Download the chunks, run `extract_all.py index-*.js Home-*.js`.
3. Copy the relevant tables to `docs/research/totalstack-data/` with stable names.
