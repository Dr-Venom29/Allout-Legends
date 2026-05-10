import { POKEMON_DATA } from "../../data/pokemon/pokemonData.js";
import { calculateHP, calculateStat, getPokemonSprite } from "../../data/pokemon/battleHelpers.js";

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
  const currentHpBefore = pokemonIn.hp ?? maxHpBefore;
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
    .map((m) => ({
      name: m.name,
      power: getMovePower(m.name),
      type: getMoveType(m.name, evolvedEntry.Type1),
      category: getMoveCategory(m.name),
    }));

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
    id: evolvedEntry.InternalName,
    number: evolvedNumber,
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
    sprite: getPokemonSprite(evolvedNumber),
    // Preserve progression
    exp: pokemonIn.exp,
    nextLevelExp: pokemonIn.nextLevelExp,
  };
}

// Helper: Get move power based on move name
function getMovePower(moveName) {
  const movePowers = {
    Tackle: 40,
    Growl: 0,
    "Tail Whip": 0,
    Ember: 40,
    "Water Gun": 40,
    ThunderShock: 40,
    "Vine Whip": 45,
    Scratch: 40,
    Bite: 60,
    "Quick Attack": 40,
    Flamethrower: 90,
    Thunderbolt: 90,
    "Ice Beam": 90,
    Psychic: 90,
    Earthquake: 100,
    Surf: 90,
  };
  return movePowers[moveName] || 40;
}

// Helper: Get move type
function getMoveType(moveName, pokemonType) {
  const moveTypes = {
    Tackle: "Normal",
    Growl: "Normal",
    "Tail Whip": "Normal",
    Ember: "Fire",
    Flamethrower: "Fire",
    "Fire Blast": "Fire",
    "Water Gun": "Water",
    Surf: "Water",
    "Hydro Pump": "Water",
    ThunderShock: "Electric",
    Thunderbolt: "Electric",
    Thunder: "Electric",
    "Vine Whip": "Grass",
    "Razor Leaf": "Grass",
    "Solar Beam": "Grass",
    Scratch: "Normal",
    Bite: "Dark",
    "Quick Attack": "Normal",
    Psychic: "Psychic",
    Earthquake: "Ground",
  };
  return moveTypes[moveName] || pokemonType || "Normal";
}

// Helper: Get move category
function getMoveCategory(moveName) {
  const specialMoves = [
    "Ember",
    "Flamethrower",
    "Fire Blast",
    "Water Gun",
    "Surf",
    "Hydro Pump",
    "ThunderShock",
    "Thunderbolt",
    "Thunder",
    "Vine Whip",
    "Razor Leaf",
    "Solar Beam",
    "Psychic",
    "Ice Beam",
  ];
  const statusMoves = ["Growl", "Tail Whip", "Leer", "Sing", "Hypnosis"];

  if (statusMoves.includes(moveName)) return "status";
  if (specialMoves.includes(moveName)) return "special";
  return "physical";
}
