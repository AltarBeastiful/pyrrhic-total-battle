/**
 * The provider every kit2 and domain2 test renders inside. `env="test"` is Mantine's own switch for
 * a test environment: it turns off transitions and portals, so an overlay is in the tree the moment
 * it opens and jsdom never waits for an animation that will not run.
 */
import { MantineProvider } from '@mantine/core';
import { render, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';

import { cssVariablesResolver, theme } from '../theme';

/**
 * jsdom ships neither `matchMedia` nor `ResizeObserver`, and Mantine reads both on mount (the colour
 * scheme, and the floating elements' measurements). They are stubbed here rather than in a global
 * setup file on purpose: `src/ui/theme.test.ts` asserts what the app does when `matchMedia` is
 * *missing*, and a global stub would make that test pass for the wrong reason.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

if (typeof globalThis.ResizeObserver !== 'function') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

export function ThemeHarness({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} cssVariablesResolver={cssVariablesResolver} env="test">
      {children}
    </MantineProvider>
  );
}

export function renderWithTheme(ui: ReactElement): RenderResult {
  return render(ui, { wrapper: ThemeHarness });
}
