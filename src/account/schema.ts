/**
 * What the backend is allowed to say (S-49b). The server stores an opaque blob and we own its
 * schema, so nothing that comes back is trusted: every response is parsed here before the rest of
 * the module sees a field, and a shape we do not recognise becomes an `AccountError('server')`
 * rather than an `undefined` three call frames later.
 */
import { z } from 'zod';

/** One `profiles` record, as `GET /api/collections/profiles/records` returns it. */
export const profileRecordSchema = z.object({
  id: z.string().min(1),
  version: z.int().min(1),
  /** PocketBase's wire format is `2026-09-13 02:59:21.284Z` — a space, not ISO-8601's `T`. */
  updated: z.string().default(''),
  updatedBy: z.string().default(''),
  /** The root document. Validated by `src/state/migrations.ts`, not here. */
  data: z.unknown(),
});
export type ProfileRecord = z.infer<typeof profileRecordSchema>;

/** `200` from `POST /api/app/profile`. */
export const pushOkSchema = z.object({
  version: z.int().min(1),
  updated: z.string().default(''),
});

/** `409` from `POST /api/app/profile`; `serverVersion` is `0` for an account that never saved. */
export const pushConflictSchema = z.object({
  data: z.object({
    serverVersion: z.int().min(0),
    updated: z.string().default(''),
  }),
});

/** The authenticated user, as much of it as the account menu shows. */
export const authUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().default(''),
  verified: z.boolean().default(false),
});
export type AccountUser = z.infer<typeof authUserSchema>;
