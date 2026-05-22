/**
 * Centralized authentic battle rounding logic.
 *
 * Pokémon games (Gen 3+) heavily rely on deterministic rounding (often Math.floor),
 * but sometimes standard 0.5 rounding is used for certain mechanics.
 * 
 * This file guarantees that rounding behavior is not scattered loosely
 * as Math.floor or Math.round across different mechanics.
 */

export const ROUNDING_RULES = {
  FLOOR: "FLOOR",
  ROUND: "ROUND",
  CEIL: "CEIL",
};

/**
 * Rounds a battle value according to strict rules.
 * Most damage/stat calculations in Pokémon use Math.floor.
 * 
 * @param {number} value - The raw float
 * @param {string} rule - The rounding rule (default: FLOOR)
 * @returns {number} The integer result
 */
export function roundBattleValue(value, rule = ROUNDING_RULES.FLOOR) {
  switch (rule) {
    case ROUNDING_RULES.ROUND:
      return Math.round(value);
    case ROUNDING_RULES.CEIL:
      return Math.ceil(value);
    case ROUNDING_RULES.FLOOR:
    default:
      return Math.floor(value);
  }
}
