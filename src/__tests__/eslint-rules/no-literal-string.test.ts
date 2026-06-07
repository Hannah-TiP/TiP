import { describe, it, expect } from 'vitest';
import { Linter } from 'eslint';
import tsParser from '@typescript-eslint/parser';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rule = require('../../../eslint-rules/no-literal-string.js');

// A Linter instance with the local i18n plugin registered, so per-line
// `// eslint-disable-next-line i18n/no-literal-string` directives resolve
// exactly the way they do in `npm run lint` (RuleTester can't model
// disable-directive resolution for an unregistered rule id).
const linter = new Linter();
const RULE_ID = 'i18n/no-literal-string';

function lint(code: string) {
  return linter.verify(code, {
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: 2022, sourceType: 'module' },
    },
    plugins: { i18n: { rules: { 'no-literal-string': rule } } },
    rules: { [RULE_ID]: 'error' },
  });
}

describe('eslint i18n/no-literal-string', () => {
  it('flags a hardcoded JSX text literal (violating case)', () => {
    const messages = lint('const A = () => <p>Welcome back</p>;');
    expect(messages).toHaveLength(1);
    expect(messages[0].ruleId).toBe(RULE_ID);
    expect(messages[0].messageId).toBe('jsxText');
  });

  it('flags a hardcoded translatable attribute (placeholder + aria-label)', () => {
    const placeholder = lint('const A = () => <input placeholder="Enter your email" />;');
    expect(placeholder).toHaveLength(1);
    expect(placeholder[0].messageId).toBe('jsxAttr');

    const ariaLabel = lint('const A = () => <button aria-label="Close" />;');
    expect(ariaLabel).toHaveLength(1);
    expect(ariaLabel[0].messageId).toBe('jsxAttr');
  });

  it('accepts t()-wrapped copy and ignores non-translatable attrs / enum tokens (valid case)', () => {
    expect(lint('const A = () => <p>{t("hotel.title")}</p>;')).toHaveLength(0);
    expect(lint('const A = () => <img alt={t("hotel.alt")} src="x" />;')).toHaveLength(0);
    expect(
      lint('const A = () => <div data-testid="hotel-card" className="grid" role="dialog" />;'),
    ).toHaveLength(0);
    // bare lowercase enum-like JSX text is treated as data, not copy
    expect(lint('const A = () => <span>leisure</span>;')).toHaveLength(0);
  });

  it('respects a per-line eslint-disable opt-out (opted-out case)', () => {
    const messages = lint(
      '// eslint-disable-next-line i18n/no-literal-string\nconst A = () => <p>Raw English copy</p>;',
    );
    expect(messages).toHaveLength(0);
  });
});
