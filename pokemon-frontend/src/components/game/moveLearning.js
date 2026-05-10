import { POKEMON_DATA } from "../../data/pokemon/pokemonData.js";

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

export function getMovesLearnedAtLevel(pokemon, level) {
  if (!pokemon || !Number.isFinite(level)) return [];

  const pokemonNumber = pokemon.number ?? pokemon.id ?? null;
  if (!pokemonNumber) return [];

  const key = String(pokemonNumber).padStart(3, "0");
  const entry = POKEMON_DATA[key];

  if (!entry || !Array.isArray(entry.Moves)) return [];

  return entry.Moves.filter((m) => m.level === level).map((m) => ({
    name: m.name,
    power: getMovePower(m.name),
    type: getMoveType(m.name, entry.Type1),
    category: getMoveCategory(m.name),
  }));
}

export function learnMoves(pokemon, newMoves) {
  if (!pokemon || !Array.isArray(newMoves) || newMoves.length === 0) {
    return {
      pokemon,
      learnedMoves: [],
      skippedMoves: [],
      pendingMoves: [],
    };
  }

  const knownMoveNames = new Set((pokemon.moves || []).map((m) => m.name));
  const currentMoves = [...(pokemon.moves || [])];
  const learnedMoves = [];
  const pendingMoves = [];

  for (const newMove of newMoves) {
    // Skip if already known
    if (knownMoveNames.has(newMove.name)) continue;

    // Add if room available
    if (currentMoves.length < 4) {
      currentMoves.push(newMove);
      learnedMoves.push(newMove.name);
      knownMoveNames.add(newMove.name);
    } else {
      // Queue for player decision
      pendingMoves.push(newMove);
    }
  }

  const updatedPokemon = {
    ...pokemon,
    moves: currentMoves,
  };

  return {
    pokemon: updatedPokemon,
    learnedMoves,
    skippedMoves: [],
    pendingMoves,
  };
}

export function replaceMove(pokemon, moveIndex, newMove) {
  if (!pokemon || !Number.isFinite(moveIndex) || moveIndex < 0 || moveIndex >= 4) {
    return pokemon;
  }

  const updatedMoves = [...(pokemon.moves || [])];
  if (updatedMoves[moveIndex]) {
    updatedMoves[moveIndex] = newMove;
  }

  return {
    ...pokemon,
    moves: updatedMoves,
  };
}
