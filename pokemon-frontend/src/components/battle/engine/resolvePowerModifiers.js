/**
 * Centralized Modifier Resolution
 * 
 * Resolves an array of modifier entries into a single multiplicative value.
 * This is the ONLY authority for computing final modifier output.
 * 
 * @param {Array<{source: string, multiplier: number}>} modifiers
 * @returns {number} The resolved multiplier (defaults to 1.0 if empty)
 */
export function resolvePowerModifiers(modifiers) {
  if (!modifiers || modifiers.length === 0) return 1.0;
  return modifiers.reduce((acc, mod) => acc * mod.multiplier, 1.0);
}
