import { POKEMON_DATA } from "../../data/pokemon/pokemonData.js";
import { calculateHP, calculateStat, getPokemonSprite } from "../../data/pokemon/battleHelpers.js";
import { buildMove } from "../../data/pokemon/moveData.js";

export function canEvolve(pokemon) {
  if (!pokemon) return false;

  // Look up the Pokémon entry in the dataset
  const pokemonNumber = pokemon.number ?? pokemon.id ?? null;
  if (!pokemonNumber) return false;

  const key = String(pokemonNumber).padStart(3, "0");
  const entry = POKEMON_DATA[key];

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

  const currentKey = String(currentNumber).padStart(3, "0");
  const currentEntry = POKEMON_DATA[currentKey];

  if (!currentEntry || !currentEntry.Evolution) return pokemonIn;

  const { to: evolvedName } = currentEntry.Evolution;
  if (!evolvedName) return pokemonIn;

  // Find the evolved Pokémon by matching InternalName (case-insensitive)
  let evolvedNumber = null;
  let evolvedEntry = null;

  for (const [num, data] of Object.entries(POKEMON_DATA)) {
    if (data.InternalName && data.InternalName.toUpperCase() === evolvedName.toUpperCase()) {
      evolvedNumber = num;
      evolvedEntry = data;
      break;
    }
  }

  if (!evolvedEntry || !evolvedNumber) return pokemonIn;

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

  // Get moves available at current level
  const availableMoves = (evolvedEntry.Moves || [])
    .filter((m) => m.level <= pokemonIn.level)
    .slice(-4)
    .map((m) => buildMove(m.name, evolvedEntry.Type1));

  if (availableMoves.length === 0) {
    availableMoves.push({
      name: "Tackle",
      power: 40,
      type: "Normal",
      category: "physical",
    });
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
    maxHp: newMaxHp,
    attack: newAttack,
    defense: newDefense,
    spAttack: newSpAttack,
    spDefense: newSpDefense,
    speed: newSpeed,
    type1: evolvedEntry.Type1,
    type2: evolvedEntry.Type2 || null,
    moves: availableMoves,
    sprite: getPokemonSprite(Number(evolvedNumber)),
    // Preserve progression
    exp: pokemonIn.exp,
    nextLevelExp: pokemonIn.nextLevelExp,
  };
}

// move helpers replaced by centralized moveData.buildMove
