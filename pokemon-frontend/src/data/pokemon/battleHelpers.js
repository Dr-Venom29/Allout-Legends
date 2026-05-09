// Battle calculation helpers
import { POKEMON_DATA } from './pokemonData.js';

const POKEMON_ENTRIES = Object.entries(POKEMON_DATA);

// Type effectiveness chart (Gen 1-4 standard)
export const TYPE_EFFECTIVENESS = {
  Normal: { Rock: 0.5, Ghost: 0, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5, Steel: 2 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5, Steel: 0.5 },
  Ice: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2, Steel: 0.5 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Dark: 2, Steel: 2 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Steel: 0 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2, Steel: 2 },
  Flying: { Grass: 2, Electric: 0.5, Fighting: 2, Bug: 2, Rock: 0.5, Steel: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5, Dark: 0, Steel: 0.5 },
  Bug: { Grass: 2, Fire: 0.5, Fighting: 0.5, Poison: 0.5, Flying: 0.5, Psychic: 2, Ghost: 0.5, Dark: 2, Steel: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2, Steel: 0.5 },
  Ghost: { Normal: 0, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Dragon: { Dragon: 2, Steel: 0.5 },
  Dark: { Fighting: 0.5, Psychic: 2, Ghost: 2, Dark: 0.5 },
  Steel: { Ice: 2, Rock: 2, Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5 }
};

// Calculate damage
export function calculateDamage(move, attacker, defender) {
  // Base power based on move (simplified)
  const movePower = move.power || 40;
  
  // Attack/Defense ratio
  const attackStat = move.category === 'physical' ? attacker.attack : attacker.spAttack;
  const defenseStat = move.category === 'physical' ? defender.defense : defender.spDefense;
  const safeDefenseStat = Math.max(1, defenseStat);
  
  // Level factor
  const level = attacker.level || 5;
  
  // Type effectiveness
  let effectiveness = 1;
  if (move.type) {
    effectiveness = TYPE_EFFECTIVENESS[move.type]?.[defender.type1] || 1;
    if (defender.type2) {
      effectiveness *= TYPE_EFFECTIVENESS[move.type]?.[defender.type2] || 1;
    }
  }
  
  // STAB (Same Type Attack Bonus)
  const stab = (move.type === attacker.type1 || move.type === attacker.type2) ? 1.5 : 1;
  
  // Random factor (85-100%)
  const random = 0.85 + Math.random() * 0.15;
  
  // Damage formula
  let damage = ((2 * level / 5 + 2) * movePower * (attackStat / safeDefenseStat) / 50 + 2) * stab * effectiveness * random;

  if (effectiveness === 0) {
    return 0;
  }
  
  return Math.max(1, Math.floor(damage));
}

// Calculate HP based on level and base stats
export function calculateHP(baseHP, level) {
  return Math.floor((2 * baseHP * level) / 100) + level + 10;
}

// Calculate other stats
export function calculateStat(baseStat, level) {
  return Math.floor((2 * baseStat * level) / 100) + 5;
}

// Get Pokémon sprite URL - FIXED for numbered images
export function getPokemonSprite(pokemonId) {
  // If it's a number or numeric string
  if (pokemonId !== undefined && !isNaN(pokemonId)) {
    const paddedId = pokemonId.toString().padStart(3, '0');
    return `/assets/pokemons/${paddedId}.png`;
  }
  
  // If it's a name, try to find its number from POKEMON_DATA
  if (typeof pokemonId === 'string') {
    // Find the Pokémon by InternalName or Name
    const entry = POKEMON_ENTRIES.find(([, data]) => 
      data.InternalName?.toLowerCase() === pokemonId.toLowerCase() ||
      data.Name?.toLowerCase() === pokemonId.toLowerCase()
    );
    
    if (entry) {
      const paddedId = entry[0].padStart(3, '0');
      return `/assets/pokemons/${paddedId}.png`;
    }
  }
  
  // Fallback to default
  return "/assets/pokemons/000.png";
}

// Get Pokémon number from name
export function getPokemonNumber(name) {
  if (!name) return null;

  const entry = POKEMON_ENTRIES.find(([, data]) => 
    data.InternalName?.toLowerCase() === name.toLowerCase() ||
    data.Name?.toLowerCase() === name.toLowerCase()
  );
  return entry ? entry[0] : null;
}

// Generate wild Pokémon instance - FIXED with correct sprite path
export function generateWildPokemon(pokemonData, level = null) {
  const baseLevel = level || Math.floor(Math.random() * 10) + 2;
  
  // Find the Pokémon's number ID
  let pokemonNumber = null;
  let pokemonId = null;
  
  for (const [id, data] of POKEMON_ENTRIES) {
    if (data.InternalName === pokemonData.InternalName || data.Name === pokemonData.Name) {
      pokemonNumber = id;
      pokemonId = data.InternalName;
      break;
    }
  }
  
  const hp = calculateHP(pokemonData.BaseStats.hp, baseLevel);
  
  // Get moves that are learned by this level
  const availableMoves = (pokemonData.Moves || [])
    .filter(m => m.level <= baseLevel)
    .slice(-4)
    .map(m => ({
      name: m.name,
      power: getMovePower(m.name),
      type: getMoveType(m.name, pokemonData.Type1),
      category: getMoveCategory(m.name)
    }));
  
  // If no moves found, add a default move
  if (availableMoves.length === 0) {
    availableMoves.push({
      name: "Tackle",
      power: 40,
      type: "Normal",
      category: "physical"
    });
  }
  
  return {
    id: pokemonId,
    number: pokemonNumber,
    name: pokemonData.Name,
    rareness: pokemonData.Rareness ?? 255,
    level: baseLevel,
    hp: hp,
    maxHp: hp,
    attack: calculateStat(pokemonData.BaseStats.attack, baseLevel),
    defense: calculateStat(pokemonData.BaseStats.defense, baseLevel),
    spAttack: calculateStat(pokemonData.BaseStats.spAttack, baseLevel),
    spDefense: calculateStat(pokemonData.BaseStats.spDefense, baseLevel),
    speed: calculateStat(pokemonData.BaseStats.speed, baseLevel),
    type1: pokemonData.Type1,
    type2: pokemonData.Type2 || null,
    moves: availableMoves,
    sprite: getPokemonSprite(pokemonNumber),
    xp: 0,
    xpToNext: Math.floor((pokemonData.GrowthRate === 'Medium' ? 100 : 80) * baseLevel / 2)
  };
}

// Helper: Get move power based on move name
function getMovePower(moveName) {
  const movePowers = {
    'Tackle': 40,
    'Growl': 0,
    'Tail Whip': 0,
    'Ember': 40,
    'Water Gun': 40,
    'ThunderShock': 40,
    'Vine Whip': 45,
    'Scratch': 40,
    'Bite': 60,
    'Quick Attack': 40,
    'Flamethrower': 90,
    'Thunderbolt': 90,
    'Ice Beam': 90,
    'Psychic': 90,
    'Earthquake': 100,
    'Surf': 90,
  };
  return movePowers[moveName] || 40;
}

// Helper: Get move type
function getMoveType(moveName, pokemonType) {
  const moveTypes = {
    'Tackle': 'Normal',
    'Growl': 'Normal',
    'Tail Whip': 'Normal',
    'Ember': 'Fire',
    'Flamethrower': 'Fire',
    'Fire Blast': 'Fire',
    'Water Gun': 'Water',
    'Surf': 'Water',
    'Hydro Pump': 'Water',
    'ThunderShock': 'Electric',
    'Thunderbolt': 'Electric',
    'Thunder': 'Electric',
    'Vine Whip': 'Grass',
    'Razor Leaf': 'Grass',
    'Solar Beam': 'Grass',
    'Scratch': 'Normal',
    'Bite': 'Dark',
    'Quick Attack': 'Normal',
    'Psychic': 'Psychic',
    'Earthquake': 'Ground',
  };
  return moveTypes[moveName] || pokemonType || 'Normal';
}

// Helper: Get move category
function getMoveCategory(moveName) {
  const specialMoves = ['Ember', 'Flamethrower', 'Fire Blast', 'Water Gun', 'Surf', 'Hydro Pump', 
                         'ThunderShock', 'Thunderbolt', 'Thunder', 'Vine Whip', 'Razor Leaf', 
                         'Solar Beam', 'Psychic', 'Ice Beam'];
  const statusMoves = ['Growl', 'Tail Whip', 'Leer', 'Sing', 'Hypnosis'];
  
  if (statusMoves.includes(moveName)) return 'status';
  if (specialMoves.includes(moveName)) return 'special';
  return 'physical';
}