/**
 * One calculation client for the whole page. Creating a `Worker` per section would spawn a thread per
 * editor; sections call `getCalcClient()` instead and share the same worker (or the same main-thread
 * fallback when the platform has none).
 */
import { createCalcClient, type CalcClient } from '@/worker/client';

let client: CalcClient | null = null;

export function getCalcClient(): CalcClient {
  client ??= createCalcClient();
  return client;
}

/** Terminate the shared client; the next `getCalcClient()` starts a fresh one. */
export function disposeCalcClient(): void {
  client?.dispose();
  client = null;
}
