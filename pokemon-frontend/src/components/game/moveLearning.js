import { POKEMON_DATA } from "../../data/pokemon/pokemonData.js";
import { buildMove } from "../../data/pokemon/moveData.js";

export function getMovesLearnedAtLevel(pokemon, level) {
  if (!pokemon || !Number.isFinite(level)) return [];

  const pokemonNumber = pokemon.number ?? pokemon.id ?? null;
  if (!pokemonNumber) return [];

  const key = String(pokemonNumber).padStart(3, "0");
  const entry = POKEMON_DATA[key];

  if (!entry || !Array.isArray(entry.Moves)) return [];

  return entry.Moves.filter((m) => m.level === level).map((m) =>
    buildMove(m.name, entry.Type1)
  );
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
