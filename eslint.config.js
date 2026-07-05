// @ts-check
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import astroPlugin from 'eslint-plugin-astro';

// Flat config (ESLint 9+). The first task this config exists for is to set up
// tooling, not to enforce a strict style — keep the rule surface light and
// focused on real correctness bugs (unused vars, no-undef, no-shadow) plus
// the `eslint-plugin-astro` recommended baseline. Tighten as needed later.
export default [
  // Global ignores — match the build, deps, caches, and tests we don't own.
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'public/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      '.lighthouseci/**',
      '.wrangler/**',
      '.simple-git-hooks.js',
      'eslint.config.js',
    ],
  },

  // TypeScript / TSX — use the @typescript-eslint parser and plugin. Disable
  // a few stylistic rules that conflict with Prettier so the two tools stay
  // out of each other's way (Prettier handles formatting).
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-undef': 'off',
    },
  },

  // Base JS / TS checks ESLint ships. Apply across .js / .mjs / .ts.
  ...astroPlugin.configs.recommended,
];
