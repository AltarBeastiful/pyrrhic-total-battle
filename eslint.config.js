import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'node_modules/**',
      'docs/**',
      // AssemblyScript (`i32`, `load<f64>`, `@inline`): its own compiler checks it (`pnpm kernel:build`).
      'kernel/**',
      // Scratch git worktrees Claude Code parks inside the repo; they are copies of the tree.
      '.claude/**',
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

  // Config files and e2e specs run in node.
  {
    files: ['*.{js,ts}', 'e2e/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Kit rule 3 (`src/ui/kit/README.md`): styling is Mantine props, the theme and a CSS module next
  // to the composite that needs one. Utility class strings were the previous kit's habit and the
  // whole tree is off them since M-09, so `className` may only ever carry a CSS-module value.
  {
    files: ['src/ui/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="className"] > Literal',
          message:
            'No utility class strings (src/ui/kit/README.md, rule 3). Style with Mantine props, theme tokens or a CSS module.',
        },
        {
          selector: 'JSXAttribute[name.name="className"] > JSXExpressionContainer > TemplateLiteral',
          message:
            'No utility class strings (src/ui/kit/README.md, rule 3). Style with Mantine props, theme tokens or a CSS module.',
        },
      ],
    },
  },

  // A story's default export is a data object, not a component; fast refresh has nothing to say.
  // Neither does it about the test harness, whose export is a render function.
  {
    files: ['src/ui/kitpage/stories/*.story.tsx', 'src/ui/kit/testRender.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
);
