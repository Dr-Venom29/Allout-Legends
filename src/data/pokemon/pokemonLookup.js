const POKEMON_BY_NUMBER = {};
const POKEMON_BY_NAME = {};
const POKEMON_BY_INTERNAL_NAME = {};

// Populate the lookup maps
Object.values(POKEMON_DATA).forEach((entry) => {
  POKEMON_BY_NUMBER[entry.Number] = entry;
  POKEMON_BY_NAME[entry.Name] = entry;
  POKEMON_BY_INTERNAL_NAME[entry.InternalName] = entry;
});

export function getPokemonEntry(pokemonOrIdentifier) {
  if (typeof pokemonOrIdentifier === 'number') {
    return POKEMON_BY_NUMBER[pokemonOrIdentifier];
  } else if (typeof pokemonOrIdentifier === 'string') {
    return POKEMON_BY_NAME[pokemonOrIdentifier] || POKEMON_BY_INTERNAL_NAME[pokemonOrIdentifier];
  } else {
    return POKEMON_BY_NUMBER[pokemonOrIdentifier.Number];
  }
}

export function getBaseStats(pokemonOrIdentifier) {
  const entry = getPokemonEntry(pokemonOrIdentifier);
  return entry?.BaseStats ?? null;
}

export function getBaseExp(pokemonOrIdentifier) {
  const entry = getPokemonEntry(pokemonOrIdentifier);
  return entry?.BaseEXP ?? null;
}