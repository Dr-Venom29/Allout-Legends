export function createInitialPokedex() {
  return {
    seen: [],
    caught: [],
  };
}

export function markPokemonSeen(pokedex, pokemonId) {
  if (pokedex.seen.includes(pokemonId)) {
    return pokedex;
  }

  return {
    ...pokedex,
    seen: [...pokedex.seen, pokemonId],
  };
}

export function markPokemonCaught(pokedex, pokemonId) {
  let nextPokedex = pokedex;

  if (!nextPokedex.seen.includes(pokemonId)) {
    nextPokedex = {
      ...nextPokedex,
      seen: [...nextPokedex.seen, pokemonId],
    };
  }

  if (nextPokedex.caught.includes(pokemonId)) {
    return nextPokedex;
  }

  return {
    ...nextPokedex,
    caught: [...nextPokedex.caught, pokemonId],
  };
}

export function hasSeenPokemon(pokedex, pokemonId) {
  return pokedex.seen.includes(pokemonId);
}

export function hasCaughtPokemon(pokedex, pokemonId) {
  return pokedex.caught.includes(pokemonId);
}
