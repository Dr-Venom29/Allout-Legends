/**
 * Validates the battle state before executing the turn deterministic engine.
 * 
 * @param {Object} state - The battle state passed from React
 * @throws {Error} If the state violates engine constraints
 */
export function assertValidBattleState(state) {
  if (!state.playerPokemon || typeof state.playerPokemon.currentHp !== 'number') {
    throw new Error(`[Engine Validation] Invalid playerPokemon state.`);
  }

  if (!state.enemy || typeof state.enemy.currentHp !== 'number') {
    throw new Error(`[Engine Validation] Invalid enemy state.`);
  }

  if (!state.playerAction || !state.enemyAction) {
    throw new Error(`[Engine Validation] Both combatants must have a selected action to evaluate a turn.`);
  }

  if (state.playerPokemon.currentHp < 0 || state.enemy.currentHp < 0) {
    throw new Error(`[Engine Validation] Negative HP detected before turn start. HP must never fall below 0.`);
  }
}
