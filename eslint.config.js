import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import { maxClassNameUtilities, noArbitraryTailwind } from './eslint/no-arbitrary-tailwind.js';

/** The two house rules of `src/ui/kit/README.md` that need a rule of their own. */
const pyrrhic = {
  rules: {
    'no-arbitrary-tailwind': noArbitraryTailwind,
    'max-classname-utilities': maxClassNameUtilities,
  },
};

/**
 * Everything written before the UI foundation (T-02). These files style freely and are rewritten or
 * deleted section by section in Phases B–D; the kit rules apply to everything else from today and
 * this list shrinks to nothing at T-08.
 */
const LEGACY_STYLING = ['src/ui/sections/**', 'src/ui/profile/**', 'src/ui/sync/**', 'src/pwa/**'];

/**
 * The Mantine half of the tree (ADR-0008). It carries no Tailwind, so neither styling rule applies;
 * at M-09 these folders lose their `2` and the two rules above are deleted outright.
 */
const MANTINE_ONLY = ['src/ui/kit2/**', 'src/ui/domain2/**', 'src/ui/kitpage/stories2/**'];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**',
      'docs/**',
    ],
  },

  // Application and test sources.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2023,
      globals: { ...globals.browser, ...globals.es2021 },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Only component modules take part in fast refresh.
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/**/*.test.tsx'],
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Config files, custom lint rules and e2e specs run in node.
  {
    files: ['*.{js,ts}', 'eslint/**/*.js', 'e2e/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Kit rule 1, for the kit that is on its way out: React Aria Components is an implementation
  // detail of `src/ui/kit`. `@mantine/core` is deliberately *not* restricted — ADR-0008 makes it
  // the component system, and sections compose its layout and typography components directly.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/ui/kit/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react-aria-components', 'react-aria-components/*'],
              message:
                'react-aria-components is imported only inside src/ui/kit (src/ui/kit/README.md, rule 1). Import the kit component instead.',
            },
          ],
        },
      ],
    },
  },

  // Kit rule 3: tokens only. Values belong in src/index.css, never in a class name. `kit2`,
  // `domain2` and their stories use no Tailwind at all — Mantine props, theme tokens and a CSS
  // module for the handful of shapes the library has no prop for — so the rule has nothing to say
  // about them and must not be read as permission to start.
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    ignores: [...LEGACY_STYLING, ...MANTINE_ONLY],
    plugins: { pyrrhic },
    rules: {
      'pyrrhic/no-arbitrary-tailwind': 'error',
    },
  },

  // Kit rule 4: sections compose, they do not style. A warning while the new sections are being
  // written; it becomes an error, and the legacy list goes, at T-08.
  {
    files: ['src/ui/sections/**/*.{ts,tsx}', 'src/ui/shell/**/*.{ts,tsx}'],
    ignores: [...LEGACY_STYLING, ...MANTINE_ONLY],
    plugins: { pyrrhic },
    rules: {
      'pyrrhic/max-classname-utilities': ['warn', { max: 4 }],
    },
  },

  // A story's default export is a data object, not a component; fast refresh has nothing to say.
  // Neither does it about the test harness, whose export is a render function.
  {
    files: [
      'src/ui/kitpage/stories/*.story.tsx',
      'src/ui/kitpage/stories2/*.story.tsx',
      'src/ui/kit2/testRender.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
