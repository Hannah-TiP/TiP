import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import i18nPlugin from './eslint-rules/index.js';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'scripts/**',
    // Agent worktree artifacts
    '.claude/**',
    // Local ESLint rule sources + fixtures are not app code.
    'eslint-rules/**',
  ]),
  // i18n guard: hardcoded user-facing JSX strings (text children + the four
  // translatable attrs) must go through the t() helper. New violations fail
  // `npm run lint`. Per-line opt-out: // eslint-disable-next-line i18n/no-literal-string
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/**/__tests__/**', 'src/__tests__/**', 'src/**/*.test.tsx'],
    plugins: { i18n: i18nPlugin },
    rules: {
      'i18n/no-literal-string': 'error',
    },
  },
  // Streaming-reveal guard: e2e specs must navigate through gotoPage()
  // (e2e/support/navigation.ts) so React's Suspense streaming buffer is
  // consumed before locators run. New bare page.goto() calls fail
  // `npm run lint`. Per-line opt-out: // eslint-disable-next-line e2e/no-bare-page-goto
  {
    files: ['e2e/**/*.spec.ts'],
    plugins: { e2e: i18nPlugin },
    rules: {
      'e2e/no-bare-page-goto': 'error',
    },
  },
]);

export default eslintConfig;
