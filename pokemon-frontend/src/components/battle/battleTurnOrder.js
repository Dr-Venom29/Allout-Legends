// Turn priority calculation
// Determines which combatant acts first each turn.
//
// Resolution order (matches Gen 3-4 rules):
//   1. Move priority bracket (Quick Attack = +1, etc.)
//   2. Modified speed (paralysis halves speed)
//   3. Random coin-flip on exact tie

import { getModifiedStats } from "../game/statusConditions";

/**
 * Returns the effective speed for a Pokémon, incorporating status modifiers.
 * @param {object} pokemon
 * @returns {number}
 */
export function getEffectiveSpeed(pokemon) {
  if (!pokemon) return 0;
  const mods = getModifiedStats(pokemon);
  return mods?.speed ?? pokemon.speed ?? 0;
}

/**
 * Determine turn order for a single turn.
 *
 * @param {object} playerPokemon  – the player's active Pokémon
 * @param {object} enemyPokemon   – the wild / trainer Pokémon
 * @param {object} playerMove     – the move the player selected (must have .priority)
 * @param {object} enemyMove      – the move the enemy selected (must have .priority)
 * @returns {{ first: 'player'|'enemy', second: 'player'|'enemy' }}
 */
export function determineTurnOrder(playerPokemon, enemyPokemon, playerMove, enemyMove, rng = Math.random) {
  const playerPriority = playerMove?.priority ?? 0;
  const enemyPriority = enemyMove?.priority ?? 0;

  // 1. Move priority bracket
  if (playerPriority !== enemyPriority) {
    return playerPriority > enemyPriority
      ? { first: "player", second: "enemy" }
      : { first: "enemy", second: "player" };
  }

  // 2. Effective speed comparison
  const playerSpeed = getEffectiveSpeed(playerPokemon);
  const enemySpeed = getEffectiveSpeed(enemyPokemon);

  if (playerSpeed !== enemySpeed) {
    return playerSpeed > enemySpeed
      ? { first: "player", second: "enemy" }
      : { first: "enemy", second: "player" };
  }

  // 3. Speed tie — random coin-flip (50/50)
  return rng() < 0.5
    ? { first: "player", second: "enemy" }
    : { first: "enemy", second: "player" };
}
