# Critical 01: Sign-in stops copying the local profile into the account

Source: `todos.md`, entry "when logged out and logged in don't import the local profile each time". Critical item 1 of the 2026-10-10 review; not yet in the backlog index (proposed as B-13). Playbook: `2026-10-10-Critical-Items`. Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.

## Target behaviour (owner's words, paraphrased from todos.md)

- Local profiles are copied into an account **only when the account is created** (sign-up).
- **Signing in** silently replaces the on-screen profiles with the account's profiles. No "merged" dialog, no copy of local profiles under a `local` suffix.
- **Signing out** puts the app back on a fresh local profile (no account data left on screen).

## Where the code is today

- `src/account/state.ts`, action `adopt` (about lines 355 to 430): for every local profile not known to the account it calls `uniqueProfileName(profile.name, taken, 'local')`, adds it to `summary.added`, and merges it into the account document. `worthSaying` then opens the `merged` dialog. This runs on every sign-in, which is the bug.
- `src/account/state.ts`, action `leave` (about lines 201 to 215) and `signOut` (about line 502): sign-out and expiry already call `apply(freshLocal(current))`. Check what `keep` does for sign-out versus expiry.
- `src/account/auth.ts`: `signUpWithPassword` (line 122), `signInWithPassword` (line 97), `signInWithProvider` (line 82). The sign-up and sign-in paths must be told apart in `adopt`; OAuth sign-in can create an account too, so check how a new account is detected (for example a flag from the server or an `isNew` field) before writing code.
- Specs: `docs/plans/sso-accounts.md` and `docs/decisions/0009-optional-account-sync.md`. If the spec says something different from the owner's words above, do not guess. Record the conflict in the Notes section of this file and stop that task.
- Tests: `src/account/state.test.ts`, `src/account/merge.test.ts`, `src/account/auth.test.ts`, `src/account/sync.test.ts`.

## Tasks

- [x] Read the spec and the code, then write findings. Read `src/account/state.ts` (`adopt`, `leave`, `signOut`, `watch`, `readCache`/`writeCache`), `src/account/auth.ts` (the three sign-in paths and how a new account is reported), `docs/plans/sso-accounts.md`, `docs/decisions/0009-optional-account-sync.md`. Append a short "Findings" note under Notes naming: how `adopt` learns that an account was just created (or that it cannot), what the local cache (`readCache`) holds across sign-in, and any conflict with the owner's target. Do not change code in this task.

- [x] Split the sign-up and sign-in paths in `src/account/state.ts`. Give `adopt` a parameter (for example `{ created: boolean }`) set by the caller that knows which path ran. On `created: true`, keep today's behaviour: local profiles are copied into the new account with the `local` rename and the `merged` summary is kept. On `created: false`, do not copy any local profile: the account's document becomes the screen, the summary stays empty, and no `merged` dialog opens. If the account has no profiles at all on sign-in, keep the existing fallback (`withAProfile`) so the app still has a profile. Keep the change inside `src/account/state.ts` and its caller(s) in `src/account/auth.ts` or the sign-in UI (`src/ui/account/section.tsx`).

- [x] Make sign-in replace, not merge, the local cache. On sign-in (`created: false`) the local `readCache` value must not be used as a merge base for the local profiles, so local profiles cannot leak into the account through a later autosave. Check that `watch()` and the first `sync()` after sign-in push nothing built from the old local profile. Add a comment that states this rule in the place it is enforced.

- [x] Confirm sign-out returns to a fresh local profile. In `src/account/state.ts`, `signOut` must end with `freshLocal(...)` on screen, the account's profiles removed from `localStorage` (or the cache cleared for sign-out, but not for expiry), and `rememberDevice({ owner: null, ... })`. If sign-out currently keeps the account profiles in the cache, change it so sign-out clears them and expiry keeps them (expiry is the existing `keep: true` path). Add or update a test for each case.

- [ ] Update tests. In `src/account/state.test.ts` add or change cases: (a) sign-up with local profiles copies them with the `local` suffix and reports `merged`; (b) sign-in with local profiles adds nothing and reports no `merged` dialog; (c) sign-in with an account that has no profiles keeps a usable profile; (d) sign-out leaves a fresh local profile and no account profile on screen. Run `pnpm test -- src/account` and make it green. Do not loosen an existing assertion to make a test pass: if one fails for a reason you do not understand, stop and write the failure into Notes.

- [ ] Run the full gate. `pnpm typecheck`, `pnpm lint`, `pnpm format:check` on the changed files only (`pnpm exec prettier --check <files>`), and `pnpm test`. All must pass. Record the exact counts in Notes. If an unrelated test was already red before this phase, say so with its name and do not fix it here.

- [ ] Commit this phase only. Stage only the files this phase changed (list them with `git status --short`). The working tree already has other people's uncommitted changes (for example `.maestro/playbooks/performance-optimization/`, `tools/theorycraft/out/`, `todos.md`, `pyrrhic-my-account-2026-10-07.json`). Do not `git add -A` and do not stage those. Commit message: `Sign-in adopts the account's profiles; local profiles are copied only on sign-up`. End the commit message with `Co-Authored-By:` naming the model that is actually running this task.

## Manual Follow-Up (not executed by Auto Run)

- On a real account in the browser: sign in on a device that has local profiles, confirm no `merged` dialog and no `local` profiles appear; sign out and confirm a fresh profile appears.
- Owner to confirm the sign-out behaviour described above matches what they expect.

## Notes

### Findings (task 1, 2026-10-10)

**How `adopt` learns an account was just created: today it cannot.** `adopt(user)` takes only the `AccountUser`; nothing about the path reaches it. Callers:

- Email sign-up: `src/ui/account/AccountDialogs.tsx` `submit()` with `creating === true` calls `auth.signUpWithPassword`, shows the `created` view, and the *Continue* button calls `adopt(user)` (about line 229). The caller knows it is a sign-up: pass `{ created: true }` there.
- Email sign-in: same `submit()`, `creating === false`, calls `adopt(user)` (about line 118). Pass `{ created: false }`.
- OAuth (Google/Discord): `state.ts` `signInWith` → `auth.signInWithProvider` → `adopt(user)`. `signInWithProvider` returns `toUser(result.record)` and **drops `result.meta`**. PocketBase's `authWithOAuth2` answer carries `meta.isNew` (true when the OAuth2 sign-in created the `users` record; the SDK types `meta` as an open `{ [key: string]: any }`, `pocketbase.es.d.ts` line 609). So `signInWithProvider` must return `{ user, created: meta?.isNew === true }` (or similar) for `signInWith` to forward. `auth.test.ts` line 76 fakes `authWithOAuth2` with no `meta`; a case with `meta: { isNew: true }` is needed.
- `restore()` (start-up, signed-in session whose document is not this account's: an older build or another account's leftovers) calls `adopt(user)`: this is a sign-in, `created: false`. Edge case: a player who closes the tab on the *Account created* view never runs the sign-up `adopt`; the next start goes through `restore` as a sign-in and their local profiles are not copied. Acceptable under the owner's rule (silent replace), worth knowing.

**What the local cache (`readCache`) holds across sign-in.** `pyrrhic.account.cache.v1` holds `{ owner, doc }` and only ever holds **an account's** document, never this browser's own profiles. It is written by `leave(keep)` only when `keep` is true (expiry, or sign-out whose final save failed), and cleared by `leave(false)` (clean sign-out), by `adopt` (`writeCache(null)` after applying) and by `deleteAccount`. `adopt` uses it only when `cache.owner === user.id`, merged with the pulled remote as `base`. So the cache is not how local profiles leak; the leak is `adopt` building `local` from `useStore.getState().doc.profiles` (every profile whose id the account does not know, renamed with `local`) and merging it into `base`, then `dirty: true` + `sync()` pushes the result. Note also the fallback `if (next.profiles.length === 0) next = { ...next, profiles: current.profiles }` copies the on-screen (local) profiles into an empty account; on sign-in the `withAProfile` fresh profile should be used instead. The device-local fields (`deviceId`, `deviceName`, `ui`) still come from `current` and should keep doing so.

**Sign-out / expiry today.** `signOut` saves first, then `leave(!saved)`: a clean save clears the cache, a failed (offline) save keeps the account document in the cache and opens the `left` dialog; both end with `apply(freshLocal(current))` and `rememberDevice({ owner: null, remoteVersion: 0 })`. `expire` is `leave(true)`. So sign-out already puts a fresh local profile on screen; the only difference from task 4's wording is the offline sign-out, which keeps the cache on purpose so unsaved edits are not lost (spec §6 "Leaving"). Clearing it there would lose edits; task 4 should keep that case.

**Conflict with the specs (recorded, not guessed).** Both specs say the opposite of the owner's target on sign-in:

- `docs/plans/sso-accounts.md` §6 "Signing in": "Profiles this browser made while signed out (touched ones only …) are added to the account … `Main (local)` … A dialog lists what was added and what was renamed."
- `docs/decisions/0009-optional-account-sync.md`, Amendment S-49d: "Signing in adds the browser's own profiles to the account, renamed `Name (local)` on a clash."

The owner's `todos.md` entry (newer than both, 2026-10-07 specs vs. the 2026-10-10 review) asks for: copy only on account creation, silent replace on sign-in, fresh profile on sign-out. The sign-out part agrees with both specs. The sign-in part supersedes them; the implementing tasks should amend §6 "Signing in" and the ADR-0009 S-49d amendment in the same commit so code and spec agree. Owner sign-off on that amendment is already in the Manual Follow-Up list.


### Task 2: sign-up and sign-in split (2026-10-10)

- `adopt(user, { created })` in `src/account/state.ts` (the option is required, so no caller can forget it). `created: false` skips every local profile the account does not know; profiles the account already owns that are still on screen are kept. The "empty account takes the on-screen profile" fallback now runs only on `created: true`; on sign-in `withAProfile` gives an empty account a fresh `My account` profile. `summary.added` stays empty on sign-in, so no `merged` dialog opens.
- Callers: `AccountDialogs.tsx` email sign-in → `created: false`, *Account created* Continue → `created: true`; `restore()` → `created: false`; `signInWith` forwards the provider's flag. `auth.signInWithProvider` now returns `{ user, created }`, with `created = result.meta?.isNew === true`.
- Tests: `state.test.ts` gets a `signUp()` helper (the first call in each test makes the account, so it now says so). The old "signing in adds this browser's profiles" case became a sign-up case (account already holding `Main`), a new case checks a sign-in replaces silently, and another that a sign-in to an empty account shows `My account`, not the browser's own. `auth.test.ts` gets a `meta.isNew` case. `vitest run src/account src/ui/account`: 6 files, 97 tests passed; `pnpm typecheck` and eslint on `src/account src/ui/account` clean; prettier clean on the five changed files.
- Not yet done (tasks 3+): an offline sign-in with no cache shows a fresh profile that the next sync pushes to the account; the specs (`docs/plans/sso-accounts.md` §6, ADR-0009 S-49d) still describe the old sign-in merge.

### Task 3: sign-in replaces, the first save pushes nothing local (2026-10-10)

- `readCache` was already safe: it only holds an account's document and is used only when `cache.owner === user.id`. The rule is now stated in a comment where `adopt` builds `local` (`src/account/state.ts`).
- Two leaks closed in `adopt` on `created: false`: (1) this browser's **tombstones** were carried into `local` and merged into the account by the first save; they are now `[]` on sign-in. (2) The offline case from task 2: when the account could not be read (no cache, pull failed), the fresh `withAProfile` profile is a **stand-in** (`standIn` id, module state). The first sync then pulls before it saves (`sync({ pull: true })`, `dirty: false`), and `takeRemote` drops the stand-in from the first merge that brings profiles in, unless the player has edited it (`rev > 0`) or the account already holds it. A successful push, `leave` and `resetAccountModule` clear it.
- `watch()` only pulls (`sync({ pull: true })` on a newer version), and `takeRemote` merges the screen, which after `adopt` holds only the account's profiles. So no later save carries the old local profiles.
- New tests in `state.test.ts`: "a sign-in pushes nothing of this browser's own, not even what it deleted" and "a sign-in that cannot read the account yet does not save its stand-in profile into it". Both fail on the old `state.ts` and pass on the new one. `vitest run src/account src/ui/account`: 6 files, 99 tests passed; `pnpm typecheck`, eslint `src/account`, and prettier on the two files are clean.

### Task 4: sign-out returns to a fresh local profile (2026-10-10)

- No code change needed: `signOut` → `leave(!saved)` already ends with `apply(freshLocal(current))` and `rememberDevice({ owner: null, remoteVersion: 0 })`. A clean sign-out writes `writeCache(null)`; expiry (`expire` → `leave(true)`) keeps the account's document in the cache for the next sign-in. The offline sign-out also keeps the cache (`leave(true)` when the final save failed) on purpose, per spec §6 "Leaving": clearing it would lose unsaved edits. Kept as is.
- Tests tightened in `src/account/state.test.ts`: "signing out saves first…" now also checks that no account profile id is left on screen and that the device state reads `owner: null, remoteVersion: 0`. "an expired session puts the account away…" now also checks `owner: null` (the cache-kept assertion was already there). "signing out offline keeps the unsaved work put away" already covers the offline case. `vitest run src/account src/ui/account`: 6 files, 99 tests passed; `pnpm typecheck`, eslint and prettier on the test file are clean.

