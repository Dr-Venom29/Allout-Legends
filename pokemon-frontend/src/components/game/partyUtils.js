/**
 * Check if a Pokémon is conscious (has HP > 0)
 */
export function isPokemonConscious(pokemon) {
  return (pokemon?.currentHp ?? pokemon?.hp ?? 0) > 0;
}

/**
 * Get all party indexes with conscious Pokémon, optionally excluding a specific index
 */
export function getUsablePartyIndexes(party, excludeIndex = null) {
  return party
    .map((pokemon, index) => ({ pokemon, index }))
    .filter(
      ({ pokemon, index }) =>
        index !== excludeIndex &&
        isPokemonConscious(pokemon)
    )
    .map(({ index }) => index);
}

/**
 * Check if there are any usable (conscious) Pokémon in the party, optionally excluding a specific index
 */
export function hasUsablePokemon(party, excludeIndex = null) {
  return getUsablePartyIndexes(party, excludeIndex).length > 0;
}
