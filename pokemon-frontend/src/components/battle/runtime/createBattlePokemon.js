// Converts a static Party/Wild Pokemon object into a safe, isolated Runtime Pokemon object for the battle engine
export function createBattlePokemon(pokemon) {
  if (!pokemon) return null;

  return {
    ...pokemon,
    // Ensure we don't accidentally mutate the original moves array during battle
    moves: (pokemon.moves || []).map((m) => ({ ...m })),
    
    // Core battle state
    currentHp: pokemon.hp ?? pokemon.currentHp ?? pokemon.maxHp,
    maxHp: pokemon.maxHp,
    
    // Status
    status: pokemon.status ? { ...pokemon.status } : null,
    
    // Future Expansion
    statStages: {
      attack: 0,
      defense: 0,
      spAttack: 0,
      spDefense: 0,
      speed: 0,
      accuracy: 0,
      evasion: 0,
    },
    volatileStatuses: [],
  };
}
