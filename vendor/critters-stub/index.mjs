/**
 * ESM twin of index.js — the OpenNext middleware bundle uses the "module"
 * condition, so it resolves this file instead of the CJS one.
 */
export default function Critters() {
  throw new Error(
    "[critters-stub] experimental.optimizeCss is enabled but the real critters package is not installed. " +
      "Run `npm install critters@0.0.25 --save` (and remove the file:vendor/critters-stub entry), " +
      "or disable experimental.optimizeCss.",
  );
}
