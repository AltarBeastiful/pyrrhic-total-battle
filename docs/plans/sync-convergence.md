# Sync convergence: two devices must stop rewriting each other

Status: spec, nothing built. Written 2026-10-19 after a 429 on `POST /api/app/profile`.

## What happened

The owner saw `429 Too Many Requests` when saving after a rename. The pushed body carried
`version` 3156; an earlier push of the same account (a few minutes before) carried 3016. About
140 *successful* saves in between, with no edit behind them: a loop, not a burst. The 429 is
only the rate limiter (now 200 a minute, migration `1792400000`) noticing it; raising the limit
hides the loop, it does not end it.

## Cause

Two devices on one account (here `429afa0d…` and `7053cd4f…`) each pull, merge, compare, and push
when the merge "differs" from the server. The comparison is order-sensitive and the merge is not
symmetric:

- `sameContent` (`src/account/merge.ts`) compares `JSON.stringify([profiles, tombstones])`. Same
  records in another order, or the same keys in another order, count as a different document.
- `unite` keeps *local's* order and appends remote newcomers; `mergeTombstones` lists local then
  remote. So each device merges the server's copy into *its own* order. Device A's merge of the
  server copy never equals the server copy when B wrote it, and B's merge of A's push never
  equals A's.
- Every push bumps `version`; PocketBase publishes it over realtime; the other device pulls
  (`watch` → `sync({ pull: true })`), merges into its own order, sees a difference, pushes.
  Forever, at network speed. Pushes that cross give 409s, which `syncOnce` answers with pull and
  retry (3 attempts), which is more traffic.

Measured (throwaway test, deleted): two devices holding the same three profiles and two
tombstones in different orders, alternating pull-and-merge: **9 pushes in 10 pulls**, no edit.
Deleting a profile adds a tombstone, which is one more list whose order can differ; that is why
it looked related to deletion. It is not the deletion itself.

## Requirements

1. **Convergence.** After any set of edits stops, the devices reach one document and stop
   pushing, within one pull each. A pull that brings nothing the device lacks pushes nothing.
2. **Content equality, not byte equality.** `sameContent` compares the *set* of records: profiles
   by id (order ignored), tombstones by id and `deletedAt`, and each profile by canonical JSON
   (keys sorted). A change of order alone is never a reason to push.
3. **Order is a display matter.** Profile order is whatever each device shows. If a shared order
   is wanted later it needs its own field; the merge must not invent one.
4. **A merge that changes nothing is not an edit.** If `merge(local, remote)` equals `remote`
   by (2), the device adopts `remoteVersion` and goes to `saved` without a request.
5. **Loop guard.** If a device has pushed N times (say 5) in a minute with no local edit between
   them, it stops, shows "Sync paused: this account keeps changing from another device", and
   waits for the next edit or a manual retry. A defence, not the fix; it should never fire once
   (1)–(4) hold, and its trigger is logged to the console so it is noticed if it does.
6. **429 is a pause, not an error state that retries instantly.** Honour `Retry-After` when the
   server sends it, else back off 5 s, 15 s, 60 s. The document stays dirty meanwhile.
7. **Own echoes are ignored.** A realtime event whose `updatedBy` is this `deviceId` never starts
   a pull (today the version check can lose a race with the push response).

## Tests (red first, on the current code)

- `merge.test.ts`: `sameContent` is true for the same records in a different profile order,
  different tombstone order, different `sectionUpdatedAt` key order; false when one field differs.
- `merge.test.ts`: simulate two devices alternating pull-and-merge-and-push-if-different over a
  shared server variable; after the first round the push count stays at 0. (The reproduction
  above, kept.)
- `state.test.ts`, with the fake PocketBase and `emitRealtime`: device with a different order
  receives a realtime version; no `POST` is made.
- `state.test.ts`: our own push's realtime echo, delivered before the push response, makes no
  pull.
- `state.test.ts`: loop guard trips after N pushes without edits; an edit re-arms it.
- `state.test.ts` and `sync.test.ts`: a 429 leaves the document dirty, shows the paused state,
  and retries after the delay, not at once.

## Order of work

1. `sameContent` canonical comparison + its tests (fixes the loop by itself).
2. Skip the push when the merge equals the server (req. 4); own-echo filter (req. 7).
3. 429 backoff (req. 6), loop guard (req. 5).
4. Decide whether the limit stays at 200 once the loop is gone; 30 was set when saves were manual.

## Not decided

- Whether to also stop pushing when the *only* difference is a device-local field that is in the
  document today (`ui`, `deviceName`); they are outside `sameContent` already, so probably not.
- Whether the server should refuse a push whose `data` equals the stored `data` (a cheap
  backstop that costs a comparison per save).
