/**
 * cloneBattleState
 * 
 * Centralized utility for deep cloning the battle state before passing it to the engine.
 * This guarantees strict simulation immutability and replay safety without exposing 
 * the performance or serialization complexities to the entire codebase.
 * 
 * @param {Object} state - The live battle state
 * @returns {Object} A deep, isolated snapshot of the state
 */
export function cloneBattleState(state) {
  // structuredClone handles deep cloning of objects, arrays, etc. natively.
  // We wrap it here so we can later optimize or customize serialization 
  // (e.g., stripping out non-essential UI state, handling Maps/Sets if added later).
  return structuredClone(state);
}
