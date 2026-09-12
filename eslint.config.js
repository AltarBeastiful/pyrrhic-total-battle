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

  // Kit rule 1: React Aria Components is an implementation detail of the kit. Everything else
  // imports the kit's own components, so a swap of behaviour library touches one directory.
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

  // Kit rule 3: tokens only. Values belong in src/index.css, never in a class name.
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    ignores: LEGACY_STYLING,
    plugins: { pyrrhic },
    rules: {
      'pyrrhic/no-arbitrary-tailwind': 'error',
    },
  },

  // Kit rule 4: sections compose, they do not style. A warning while the new sections are being
  // written; it becomes an error, and the legacy list goes, at T-08.
  {
    files: ['src/ui/sections/**/*.{ts,tsx}', 'src/ui/shell/**/*.{ts,tsx}'],
    ignores: LEGACY_STYLING,
    plugins: { pyrrhic },
    rules: {
      'pyrrhic/max-classname-utilities': ['warn', { max: 4 }],
    },
  },

  // A story's default export is a data object, not a component; fast refresh has nothing to say.
  {
    files: ['src/ui/kitpage/stories/*.story.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
