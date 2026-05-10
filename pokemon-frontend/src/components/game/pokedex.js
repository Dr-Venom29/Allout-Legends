export function createInitialPokedex() {
  return {
    seen: [],
    caught: [],
  };
}

export function markPokemonSeen(pokedex, pokemonId) {
  const seenSet = new Set(pokedex.seen);

  seenSet.add(pokemonId);

  return {
    ...pokedex,
    seen: [...seenSet],
  };
}

export function markPokemonCaught(pokedex, pokemonId) {
  const seenSet = new Set(pokedex.seen);
  const caughtSet = new Set(pokedex.caught);

  seenSet.add(pokemonId);
  caughtSet.add(pokemonId);

  return {
    ...pokedex,
    seen: [...seenSet],
    caught: [...caughtSet],
  };
}

export function hasSeenPokemon(pokedex, pokemonId) {
  return new Set(pokedex.seen).has(pokemonId);
}

export function hasCaughtPokemon(pokedex, pokemonId) {
  return new Set(pokedex.caught).has(pokemonId);
}

export function getSeenCount(pokedex) {
  return new Set(pokedex.seen).size;
}

export function getCaughtCount(pokedex) {
  return new Set(pokedex.caught).size;
}
