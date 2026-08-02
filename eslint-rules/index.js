'use strict';

const noLiteralString = require('./no-literal-string');
const noBarePageGoto = require('./no-bare-page-goto');

/**
 * Local ESLint plugin for the TiP frontend. eslint.config.mjs registers this
 * same plugin object under two namespaces: `i18n` (no-literal-string, src/)
 * and `e2e` (no-bare-page-goto, e2e specs).
 */
module.exports = {
  rules: {
    'no-literal-string': noLiteralString,
    'no-bare-page-goto': noBarePageGoto,
  },
};
