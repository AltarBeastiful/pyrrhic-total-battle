/**
 * **At most one call a frame** (W18 P4, experiment 200): a pass reports its progress once per settled job, and
 * each report was one store write and one render of the whole advisor card — the main thread busy 29–40 % of the
 * captain and other passes on a production build. `frameBatch` keeps the latest arguments and applies them once,
 * on the next animation frame; `flush` applies a pending call now (before the pass settles, fails or is
 * cancelled, so the count it shows is the last one), `drop` forgets it (the pass was stopped).
 *
 * Without `requestAnimationFrame` (a worker, the node test environment) a timer stands in for the frame.
 */
export interface FrameBatch<A extends unknown[]> {
  push: (...args: A) => void;
  flush: () => void;
  drop: () => void;
}

const FRAME_MS = 16;

export function frameBatch<A extends unknown[]>(apply: (...args: A) => void): FrameBatch<A> {
  let pending: A | null = null;
  let cancel: (() => void) | null = null;

  const flush = (): void => {
    cancel?.();
    cancel = null;
    if (pending === null) return;
    const args = pending;
    pending = null;
    apply(...args);
  };

  const schedule = (): void => {
    if (typeof requestAnimationFrame === 'function') {
      const id = requestAnimationFrame(flush);
      cancel = () => {
        cancelAnimationFrame(id);
      };
    } else {
      const id = setTimeout(flush, FRAME_MS);
      cancel = () => {
        clearTimeout(id);
      };
    }
  };

  return {
    push: (...args) => {
      pending = args;
      if (cancel === null) schedule();
    },
    flush,
    drop: () => {
      cancel?.();
      cancel = null;
      pending = null;
    },
  };
}
