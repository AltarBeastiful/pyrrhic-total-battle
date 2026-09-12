import { lazy, Suspense } from 'react';

import { PwaHost } from '@/pwa/PwaHost';
import { AppShell } from '@/ui/AppShell';

// The component gallery (`docs/plans/ui-foundation.md` §5) is reachable at `/#kit` while developing
// and nowhere else: a production build replaces `import.meta.env.DEV` with `false`, so the bundler
// folds this to `null` and drops the dynamic import — the kit page and its stories never ship.
const KitPage = import.meta.env.DEV
  ? lazy(async () => ({ default: (await import('@/ui/kitpage/KitPage')).KitPage }))
  : null;

export function App() {
  if (KitPage && globalThis.location.hash === '#kit') {
    return (
      <Suspense fallback={null}>
        <KitPage />
      </Suspense>
    );
  }

  return (
    <>
      <AppShell />
      <PwaHost />
    </>
  );
}
