// Accuracy / hit resolution logic
// Determines whether a move hits or misses before damage calculation.
//
// Uses move accuracy (null = always hits, e.g. Swift)
// Future: evasion stages, accuracy stages, abilities, items

/**
 * Check whether a move hits its target.
 *
 * @param {object} move      – must have .accuracy (null = never miss, 0-100 = percentage)
 * @param {object} attacker  – the Pokémon using the move
 * @param {object} defender  – the target Pokémon
 * @returns {{ hit: boolean, message: string|null }}
 */
export function checkMoveHit(move, attacker, defender) {
  // Null or undefined accuracy means the move never misses (e.g. Swift, Aerial Ace)
  const accuracy = move?.accuracy;
  if (accuracy === null || accuracy === undefined) {
    return { hit: true, message: null };
  }

  // Accuracy of 0 is treated as "always hits" (some data sources use 0 for ∞ accuracy)
  if (accuracy === 0) {
    return { hit: true, message: null };
  }

  // Future: apply accuracy/evasion stage modifiers here
  // const accStages = attacker.statStages?.accuracy ?? 0;
  // const evaStages = defender.statStages?.evasion ?? 0;
  // const stageMultiplier = getAccuracyMultiplier(accStages - evaStages);
  // const finalAccuracy = accuracy * stageMultiplier;

  const finalAccuracy = accuracy;

  const roll = Math.random() * 100;

  if (roll < finalAccuracy) {
    return { hit: true, message: null };
  }

  const attackerName = attacker?.name ?? "Pokémon";
  return {
    hit: false,
    message: `${attackerName}'s attack missed!`,
  };
}
