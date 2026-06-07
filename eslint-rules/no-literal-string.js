/**
 * Local ESLint rule: i18n/no-literal-string
 *
 * Flags user-facing English string literals that are NOT routed through the
 * i18n helper `t()`:
 *   - JSX element text children  (<p>Hello</p>)
 *   - the four translatable JSX attributes: alt, title, placeholder, aria-label
 *
 * It deliberately does NOT flag:
 *   - data-testid, className, id, key, href, role, type, name, and any other
 *     non-translatable attribute
 *   - values produced by a call expression, e.g. {t('key')}
 *   - pure punctuation / symbols / numbers (no ASCII letters)
 *   - single-word lowercase tokens that look like enum/identifier values and
 *     contain no whitespace (e.g. "leisure") — these are usually data, not copy
 *
 * Per-line opt-out:
 *   // eslint-disable-next-line i18n/no-literal-string
 */

'use strict';

const TRANSLATABLE_ATTRS = new Set(['alt', 'title', 'placeholder', 'aria-label']);

// A string is "user-facing copy" worth flagging when it contains at least one
// run of two or more ASCII letters. This keeps out punctuation, numbers,
// single-letter labels, and hex/entity noise while catching real words.
function looksLikeCopy(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return /[A-Za-z]{2,}/.test(trimmed);
}

// Single bare lowercase identifier-ish token with no spaces (enum / slug / key)
// — treat as data, not copy. e.g. "leisure", "all-inclusive", "check_in".
function looksLikeEnumToken(value) {
  const trimmed = value.trim();
  if (/\s/.test(trimmed)) return false;
  return /^[a-z][a-z0-9_-]*$/.test(trimmed);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow hardcoded user-facing string literals in JSX; use the i18n t() helper instead.',
    },
    schema: [],
    messages: {
      jsxText:
        'Hardcoded user-facing string "{{ text }}". Wrap it in t(\'key\') and add EN/KR catalog entries.',
      jsxAttr:
        'Hardcoded user-facing {{ attr }} "{{ text }}". Wrap it in t(\'key\') and add EN/KR catalog entries.',
    },
  },

  create(context) {
    return {
      JSXText(node) {
        if (!looksLikeCopy(node.value)) return;
        if (looksLikeEnumToken(node.value)) return;
        context.report({
          node,
          messageId: 'jsxText',
          data: { text: node.value.trim().slice(0, 40) },
        });
      },

      JSXAttribute(node) {
        const name = node.name && node.name.name;
        if (typeof name !== 'string' || !TRANSLATABLE_ATTRS.has(name)) return;

        const value = node.value;
        if (!value) return;

        if (value.type === 'Literal') {
          if (!looksLikeCopy(value.value)) return;
          if (looksLikeEnumToken(value.value)) return;
          context.report({
            node: value,
            messageId: 'jsxAttr',
            data: { attr: name, text: String(value.value).slice(0, 40) },
          });
          return;
        }

        if (value.type === 'JSXExpressionContainer') {
          const expr = value.expression;
          if (expr && expr.type === 'Literal' && typeof expr.value === 'string') {
            if (!looksLikeCopy(expr.value)) return;
            if (looksLikeEnumToken(expr.value)) return;
            context.report({
              node: expr,
              messageId: 'jsxAttr',
              data: { attr: name, text: expr.value.slice(0, 40) },
            });
          }
        }
      },
    };
  },
};
