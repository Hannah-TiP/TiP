/**
 * Local ESLint rule: e2e/no-bare-page-goto
 *
 * Forbids bare `page.goto(...)` calls in e2e specs. Every navigation must go
 * through the shared `gotoPage(page, path, options?)` helper
 * (e2e/support/navigation.ts), which waits out React 19's streaming reveal —
 * a bare `page.goto` resolves on `load`, inside the window where a
 * Suspense-wrapped page briefly holds TWO copies of its content, so any
 * immediate strict-mode locator hit can flake with "resolved to 2 elements".
 *
 * The rule flags ANY `<expr>.goto(...)` member call (not just the literal
 * receiver name `page`) so renaming the variable can't dodge it. The helper
 * itself lives outside the `e2e/**\/*.spec.ts` lint scope and is unaffected.
 *
 * Per-line opt-out (e.g. the guard-integrity spec that must observe the
 * pre-reveal window):
 *   // eslint-disable-next-line e2e/no-bare-page-goto
 */

'use strict';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow bare page.goto() in e2e specs; use gotoPage() from e2e/support/navigation instead.',
    },
    schema: [],
    messages: {
      bareGoto:
        'Bare page.goto() can race React’s streaming reveal ("resolved to 2 elements"). ' +
        "Use gotoPage(page, path, options?) from './support/navigation' instead.",
    },
  },

  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (callee.type !== 'MemberExpression' || callee.computed) return;
        const prop = callee.property;
        if (!prop || prop.type !== 'Identifier' || prop.name !== 'goto') return;
        context.report({ node: callee, messageId: 'bareGoto' });
      },
    };
  },
};
