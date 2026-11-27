"use strict";

/**
 * Next.js only requires `critters` when `experimental.optimizeCss` is enabled.
 * This project does not use it; OpenNext's middleware bundle merely references
 * the module statically. Keep the bundle small and fail loudly if the feature
 * is ever turned on without installing the real package.
 */
function Critters() {
  throw new Error(
    "[critters-stub] experimental.optimizeCss is enabled but the real critters package is not installed. " +
      "Run `npm install critters@0.0.25 --save` (and remove the file:vendor/critters-stub entry), " +
      "or disable experimental.optimizeCss.",
  );
}

module.exports = Critters;
module.exports.default = Critters;
