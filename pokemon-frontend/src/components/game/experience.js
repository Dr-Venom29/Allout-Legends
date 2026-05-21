import { POKEMON_DATA } from "../../data/pokemon/pokemonData.js";
import { calculateHP, calculateStat } from "../../data/pokemon/battleHelpers.js";
import { canEvolve, evolvePokemon } from "./evolution.js";
import { getMovesLearnedAtLevel, learnMoves } from "./moveLearning.js";
import { getBaseStats, getBaseExp } from "../../data/pokemon/pokemonLookup.js";

const MAX_LEVEL = 100;

export function getExpForLevel(level) {
  return Math.pow(level, 3);
}

function getNextLevelExp(pokemon) {
  return getExpForLevel(pokemon.level);
}

export function calculateExpReward(enemy) {
  if (!enemy || typeof enemy.level !== "number") return 0;
  const baseExp = getBaseExp(enemy) || 140; // Default fallback if not found
  return Math.floor((baseExp * enemy.level) / 7);
}

function recalculateStats(pokemon) {
  const baseStats = getBaseStats(pokemon);
    if (baseStats) {
      const newMaxHp = calculateHP(baseStats.hp, pokemon.level);
      const newAttack = calculateStat(baseStats.attack, pokemon.level);
      const newDefense = calculateStat(baseStats.defense, pokemon.level);
      const newSpAttack = calculateStat(baseStats.spAttack, pokemon.level);
      const newSpDefense = calculateStat(baseStats.spDefense, pokemon.level);
      const newSpeed = calculateStat(baseStats.speed, pokemon.level);

      pokemon.maxHp = newMaxHp;
      pokemon.attack = newAttack;
      pokemon.defense = newDefense;
      pokemon.spAttack = newSpAttack;
      pokemon.spDefense = newSpDefense;
      pokemon.speed = newSpeed;
    }
}

function getNextHp(pokemon) {
  const baseStats = getBaseStats(pokemon);
  if (baseStats) {
    return calculateHP(baseStats.hp, pokemon.level);
  } else {
    return pokemon.hp;
  }
}

function isEligibleForEvolution(pokemon) {
  return canEvolve(pokemon);
}

export function normalizePokemon(pokemon) {
  if (!pokemon) return pokemon;
  const level = Number.isFinite(pokemon.level) ? pokemon.level : 5;
  const exp = Number.isFinite(pokemon.exp) ? pokemon.exp : (Number.isFinite(pokemon.xp) ? pokemon.xp : 0);
  const nextLevelExp = Number.isFinite(pokemon.nextLevelExp)
    ? pokemon.nextLevelExp
    : (Number.isFinite(pokemon.xpToNext) ? pokemon.xpToNext : getExpForLevel(level));
  return {
    ...pokemon,
    level,
    exp,
    nextLevelExp,
  };
}

export function addExperience(pokemonIn, amount) {
  if (!pokemonIn || amount <= 0) {
    return {
      pokemon: pokemonIn,
      expGained: 0,
      leveledUp: false,
      levelsGained: 0,
      newLevel: pokemonIn?.level ?? null,
    };
  }

  let pokemon = { ...normalizePokemon(pokemonIn) };

  if (pokemon.level >= MAX_LEVEL) {
    // At max level, do not accumulate exp
    return {
      pokemon: { ...pokemon, exp: getExpForLevel(MAX_LEVEL), nextLevelExp: getExpForLevel(MAX_LEVEL) },
      expGained: 0,
      leveledUp: false,
      levelsGained: 0,
      newLevel: pokemon.level,
    };
  }

  let remainingExp = amount;
  pokemon.exp = (pokemon.exp || 0) + remainingExp;

  let leveledUp = false;
  let levelsGained = 0;
  let learnedMoveNames = [];
  let pendingMoveLearning = null;

  while (pokemon.exp >= getNextLevelExp(pokemon) && pokemon.level < MAX_LEVEL) {
    // Increase level
    pokemon.level += 1;

    // Learn moves for this level
    const movesAtLevel = getMovesLearnedAtLevel(pokemon, pokemon.level);
    if (movesAtLevel && movesAtLevel.length > 0) {
      const moveResult = learnMoves(pokemon, movesAtLevel);
      pokemon = moveResult.pokemon;
      if (moveResult.learnedMoves.length > 0) {
        learnedMoveNames.push(...moveResult.learnedMoves);
      }
      if (moveResult.pendingMoves.length > 0 && !pendingMoveLearning) {
        pendingMoveLearning = moveResult.pendingMoves[0];
      }
    }

    // Recalculate stats
    recalculateStats(pokemon);

    // Sync hp and currentHp
    pokemon.hp = pokemon.currentHp = getNextHp(pokemon);

    remainingExp -= getNextLevelExp(pokemon);
    leveledUp = true;
    levelsGained += 1;
  }

  // Check for evolution after level-ups
  const previousName = pokemon.name;
  let evolved = false;
  let evolvedName = null;

  if (isEligibleForEvolution(pokemon)) {
    pokemon = evolvePokemon(pokemon);
    evolved = true;
    evolvedName = pokemon.name;
  }

  return {
    pokemon,
    expGained: amount,
    leveledUp,
    levelsGained,
    newLevel: pokemon.level,
    evolved,
    previousName: evolved ? previousName : null,
    evolvedName: evolved ? evolvedName : null,
    learnedMoves: learnedMoveNames,
    pendingMoveLearning: pendingMoveLearning,
  };
}

