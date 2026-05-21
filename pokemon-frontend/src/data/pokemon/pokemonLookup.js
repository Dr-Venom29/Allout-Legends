import { POKEMON_DATA } from './pokemonData.js';

const POKEMON_BY_NUMBER = {};
const POKEMON_BY_NAME = {};
const POKEMON_BY_INTERNAL_NAME = {};

// Build lookup maps once
Object.values(POKEMON_DATA).forEach((entry) => {
  POKEMON_BY_NUMBER[entry.Number] = entry;
  if (entry.Name) POKEMON_BY_NAME[entry.Name.toLowerCase()] = entry;
  if (entry.InternalName) POKEMON_BY_INTERNAL_NAME[entry.InternalName] = entry;
});

export function getPokemonEntry(pokemonOrIdentifier) {
  if (!pokemonOrIdentifier) return null;
  
  if (typeof pokemonOrIdentifier === 'number') {
    return POKEMON_BY_NUMBER[pokemonOrIdentifier];
  } else if (typeof pokemonOrIdentifier === 'string') {
    const lowerIdentifier = pokemonOrIdentifier.toLowerCase();
    return POKEMON_BY_NAME[lowerIdentifier] || POKEMON_BY_INTERNAL_NAME[pokemonOrIdentifier];
  } else if (typeof pokemonOrIdentifier === 'object') {
    // If it's a pokemon object, use its Number if available, else try Name or InternalName
    if (pokemonOrIdentifier.Number) return POKEMON_BY_NUMBER[pokemonOrIdentifier.Number];
    if (pokemonOrIdentifier.InternalName) return POKEMON_BY_INTERNAL_NAME[pokemonOrIdentifier.InternalName];
    if (pokemonOrIdentifier.species) {
        return POKEMON_BY_NAME[pokemonOrIdentifier.species.toLowerCase()] || POKEMON_BY_INTERNAL_NAME[pokemonOrIdentifier.species];
    }
  }
  return null;
}

export function getBaseStats(pokemonOrIdentifier) {
  const entry = getPokemonEntry(pokemonOrIdentifier);
  return entry?.BaseStats ?? null;
}

export function getBaseExp(pokemonOrIdentifier) {
  const entry = getPokemonEntry(pokemonOrIdentifier);
  return entry?.BaseEXP ?? null;
}
