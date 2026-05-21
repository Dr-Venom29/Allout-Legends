import { getPokemonEntry } from "../../data/pokemon/pokemonLookup.js";
import { calculateHP, calculateStat, getPokemonSprite } from "../../data/pokemon/battleHelpers.js";
import { buildMove } from "../../data/pokemon/moveData.js";

export function canEvolve(pokemon) {
  if (!pokemon) return false;

  // Look up the Pokémon entry in the dataset
  const pokemonNumber = pokemon.number ?? pokemon.id ?? null;
  if (!pokemonNumber) return false;

  const entry = getPokemonEntry(pokemonNumber);

  if (!entry || !entry.Evolution) return false;

  const { method, value } = entry.Evolution;

  // For now, only support Level-based evolution
  if (method !== "Level") return false;

  // Check if Pokémon has reached the required level
  return pokemon.level >= value;
}

export function evolvePokemon(pokemonIn) {
  if (!pokemonIn) return pokemonIn;

  // Find the current Pokémon entry
  const currentNumber = pokemonIn.number ?? pokemonIn.id ?? null;
  if (!currentNumber) return pokemonIn;

  const currentEntry = getPokemonEntry(currentNumber);

  if (!currentEntry || !currentEntry.Evolution) return pokemonIn;

  const { to: evolvedName } = currentEntry.Evolution;
  if (!evolvedName) return pokemonIn;

  // Find the evolved Pokémon using the lookup map (O(1))
  const evolvedEntry = getPokemonEntry(evolvedName);

  if (!evolvedEntry) return pokemonIn;
  const evolvedNumber = Number(evolvedEntry.Number) || Number(evolvedEntry.number) || null;

  // Calculate current HP ratio to preserve player's battle state
  const maxHpBefore = pokemonIn.maxHp ?? 10;
  const currentHpBefore = pokemonIn.currentHp ?? pokemonIn.hp ?? maxHpBefore;
  const hpRatio = maxHpBefore > 0 ? currentHpBefore / maxHpBefore : 1;

  // Generate evolved Pokémon at current level
  const newMaxHp = calculateHP(evolvedEntry.BaseStats.hp, pokemonIn.level);
  const newAttack = calculateStat(evolvedEntry.BaseStats.attack, pokemonIn.level);
  const newDefense = calculateStat(evolvedEntry.BaseStats.defense, pokemonIn.level);
  const newSpAttack = calculateStat(evolvedEntry.BaseStats.spAttack, pokemonIn.level);
  const newSpDefense = calculateStat(evolvedEntry.BaseStats.spDefense, pokemonIn.level);
  const newSpeed = calculateStat(evolvedEntry.BaseStats.speed, pokemonIn.level);

  // Preserve current HP ratio
  const newCurrentHp = Math.max(1, Math.floor(newMaxHp * hpRatio));

  // Preserve existing custom moves (TMs, previous learnset, etc.)
  const preservedMoves = (pokemonIn.moves || []).map(move => ({ ...move }));
  
  if (preservedMoves.length === 0) {
    preservedMoves.push(buildMove("Tackle", evolvedEntry.Type1));
  }

  // Build the evolved Pokémon object, preserving progression data
  return {
    ...pokemonIn,
    id: Number(evolvedNumber),
    number: Number(evolvedNumber),
    internalName: evolvedEntry.InternalName,
    name: evolvedEntry.Name,
    rareness: evolvedEntry.Rareness ?? 255,
    level: pokemonIn.level,
    hp: newCurrentHp,
    currentHp: newCurrentHp,
    maxHp: newMaxHp,
    attack: newAttack,
    defense: newDefense,
    spAttack: newSpAttack,
    spDefense: newSpDefense,
    speed: newSpeed,
    type1: evolvedEntry.Type1,
    type2: evolvedEntry.Type2 || null,
    moves: preservedMoves,
    sprite: getPokemonSprite(Number(evolvedNumber)),
    // Preserve progression
    exp: pokemonIn.exp,
    nextLevelExp: pokemonIn.nextLevelExp,
  };
}

// move helpers replaced by centralized moveData.buildMove
