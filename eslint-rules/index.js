'use strict';

const noLiteralString = require('./no-literal-string');

/**
 * Local ESLint plugin `i18n` for the TiP frontend.
 * Exposes the no-literal-string rule consumed by eslint.config.mjs.
 */
module.exports = {
  rules: {
    'no-literal-string': noLiteralString,
  },
};
